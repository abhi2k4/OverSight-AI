import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from backend.api.config import settings, TAXONOMY
from backend.api.constants import (
    DEFAULT_PAGE_LIMIT,
    LOW_CONFIDENCE_THRESHOLD,
    HTTP_500_INTERNAL_ERROR,
    HTTP_404_NOT_FOUND,
    HTTP_400_BAD_REQUEST
)
from backend.api.schemas import (
    EnrichRequest,
    EnrichResponse,
    EnrichedRecordsResponse,
    CollectionsResponse,
    Collection,
    AnalyticsResponse
)
from backend.api.helpers import parse_metadata_json, build_enriched_record_response
from backend.api.dependencies import (
    get_enriched_record_repository,
    get_analytics_service,
    get_enrichment_orchestrator
)
from backend.repositories.enriched_record_repository import EnrichedRecordRepository
from backend.services.analytics_service import AnalyticsService
from backend.services.enrichment_orchestrator import EnrichmentOrchestrator
from backend.database import get_db, init_db
from backend.api.agent_routes import router as agent_router
from backend.api.websocket_routes import router as websocket_router

from dotenv import load_dotenv
load_dotenv()

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="AI-powered data enrichment API for OverSight governance platform"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include agent routes
app.include_router(agent_router, prefix=settings.api_prefix)

# Include WebSocket routes
app.include_router(websocket_router, prefix=settings.api_prefix)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    print(f"✅ {settings.app_name} started successfully")
    print(f"📊 Database: {settings.database_url}")
    print(f"🤖 Model: {settings.gemini_model}")


@app.get("/")
async def root():
    """Root endpoint - API health check"""
    return {
        "name": settings.app_name,
        "version": settings.app_version,
        "status": "healthy",
        "endpoints": {
            "enrich": f"{settings.api_prefix}/enrich",
            "enriched": f"{settings.api_prefix}/enriched",
            "collections": f"{settings.api_prefix}/collections"
        }
    }


@app.get(f"{settings.api_prefix}/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.post(f"{settings.api_prefix}/enrich", response_model=EnrichResponse)
async def enrich_records(
    request: EnrichRequest,
    db: Session = Depends(get_db)
):
    """Enrich single or batch records with AI-generated metadata"""
    try:
        if len(request.records) > settings.max_batch_size:
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail=f"Batch size exceeds maximum of {settings.max_batch_size} records"
            )
        
        orchestrator = get_enrichment_orchestrator(db)
        enriched_results, failed_count = await orchestrator.enrich_and_persist(request.records)
        
        status = "success" if failed_count == 0 else "partial_success" if enriched_results else "failed"
        
        return EnrichResponse(
            status=status,
            enriched_count=len(enriched_results),
            results=enriched_results
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=HTTP_500_INTERNAL_ERROR, detail=f"Enrichment failed: {str(e)}")


@app.get(f"{settings.api_prefix}/enriched", response_model=EnrichedRecordsResponse)
async def get_enriched_records(
    tags: Optional[str] = None,
    entity_type: Optional[str] = None,
    source_system: Optional[str] = None,
    min_confidence: Optional[float] = None,
    limit: int = DEFAULT_PAGE_LIMIT,
    offset: int = 0,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Query enriched records with filters"""
    try:
        repository = get_enriched_record_repository(db)
        tag_list = [t.strip() for t in tags.split(",")] if tags else None
        
        records, total = repository.get_all(
            limit=limit,
            offset=offset,
            tags=tag_list,
            entity_type=entity_type,
            source_system=source_system,
            min_confidence=min_confidence,
            search=search
        )
        
        enriched_records = [build_enriched_record_response(record) for record in records]
        
        return EnrichedRecordsResponse(
            total=total,
            page=(offset // limit) + 1,
            limit=limit,
            records=enriched_records
        )
        
    except Exception as e:
        raise HTTPException(status_code=HTTP_500_INTERNAL_ERROR, detail=f"Query failed: {str(e)}")


@app.get(f"{settings.api_prefix}/collections", response_model=CollectionsResponse)
async def list_collections(db: Session = Depends(get_db)):
    """List available collections (tag-based groupings)"""
    try:
        repository = get_enriched_record_repository(db)
        records = repository.get_all_records()
        
        tag_counts = {}
        for record in records:
            metadata = parse_metadata_json(record.enriched_metadata)
            for tag in metadata.get("tags", []):
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        collections = [
            Collection(name=tag, count=count, description=TAXONOMY[tag])
            for tag, count in tag_counts.items()
            if tag in TAXONOMY
        ]
        collections.sort(key=lambda x: x.count, reverse=True)
        
        return CollectionsResponse(collections=collections)
        
    except Exception as e:
        raise HTTPException(status_code=HTTP_500_INTERNAL_ERROR, detail=f"Failed to list collections: {str(e)}")


@app.get(f"{settings.api_prefix}/collections/{{name}}", response_model=EnrichedRecordsResponse)
async def get_collection(
    name: str,
    limit: int = DEFAULT_PAGE_LIMIT,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Get all records for a specific collection (tag)"""
    if name not in TAXONOMY:
        raise HTTPException(status_code=HTTP_404_NOT_FOUND, detail=f"Collection '{name}' not found in taxonomy")
    
    return await get_enriched_records(tags=name, limit=limit, offset=offset, db=db)


@app.get(f"{settings.api_prefix}/taxonomy")
async def get_taxonomy():
    """Get the complete taxonomy of available tags"""
    return {"taxonomy": TAXONOMY, "tag_count": len(TAXONOMY)}


@app.get(f"{settings.api_prefix}/analytics", response_model=AnalyticsResponse)
async def get_analytics(db: Session = Depends(get_db)):
    """Get analytics and statistics about enriched data"""
    try:
        repository = get_enriched_record_repository(db)
        analytics_service = get_analytics_service(db)
        
        records = repository.get_all_records()
        stats = analytics_service.calculate_enrichment_stats(records)
        
        return AnalyticsResponse(stats=stats, timestamp=datetime.now(timezone.utc))
        
    except Exception as e:
        raise HTTPException(status_code=HTTP_500_INTERNAL_ERROR, detail=f"Analytics failed: {str(e)}")


@app.get(f"{settings.api_prefix}/review")
async def get_review_queue(
    min_confidence: float = 0.0,
    max_confidence: float = LOW_CONFIDENCE_THRESHOLD,
    limit: int = DEFAULT_PAGE_LIMIT,
    db: Session = Depends(get_db)
):
    """Get records that need human review (low confidence scores)"""
    try:
        repository = get_enriched_record_repository(db)
        records = repository.get_by_confidence_range(min_confidence, max_confidence, limit)
        
        review_records = [
            {
                "id": record.id,
                "source_system": record.source_system,
                "entity_type": record.entity_type,
                "raw_data": record.raw_data,
                "enriched_metadata": parse_metadata_json(record.enriched_metadata),
                "enrichment_timestamp": record.enrichment_timestamp.isoformat(),
                "needs_review": True
            }
            for record in records
        ]
        
        return {
            "status": "success",
            "review_queue_size": len(review_records),
            "confidence_range": {"min": min_confidence, "max": max_confidence},
            "records": review_records
        }
        
    except Exception as e:
        raise HTTPException(status_code=HTTP_500_INTERNAL_ERROR, detail=f"Review queue failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
