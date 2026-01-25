import os
import sys

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, BackgroundTasks, Form
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
from pathlib import Path
import shutil
import asyncio

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
    AnalyticsResponse,
    DatasetRegisterRequest,
    DatasetRegisterResponse
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
from backend.datahub_integration.config import DataHubConfig
from backend.datahub_integration.sync_service import DataHubSyncService
from backend.datahub_integration.tag_initializer import TagInitializer
from backend.datahub_integration.domain_initializer import DomainInitializer
from backend.api.agent_routes import router as agent_router
from backend.api.websocket_routes import router as websocket_router
from backend.ingestion.pipeline import IngestionPipeline
from backend.ingestion.enrichment_bridge import EnrichmentBridge
from backend.ingestion.factory import SourceFactory

from dotenv import load_dotenv
import json
import re
load_dotenv()

# Job status storage (in-memory, could be replaced with Redis)
job_statuses: Dict[str, Dict[str, Any]] = {}

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
    # Log registered routes for debugging
    print(f"📋 Registered ingestion routes:")
    print(f"   POST {settings.api_prefix}/ingest/upload")
    print(f"   GET {settings.api_prefix}/ingest/status/{{job_id}}")


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


# ============================================================================
# DataHub Integration Endpoints
# ============================================================================

@app.post(f"{settings.api_prefix}/datahub/sync")
async def sync_to_datahub(db: Session = Depends(get_db)):
    """
    Sync all enriched records to DataHub.
    
    This endpoint triggers a full sync of enriched data to DataHub,
    creating dataset entities with metadata, tags, and schema information.
    """
    try:
        config = DataHubConfig()
        sync_service = DataHubSyncService(db, config)
        
        # Test connection first
        if not sync_service.test_connection():
            raise HTTPException(
                status_code=503,
                detail=f"Cannot connect to DataHub GMS at {config.GMS_SERVER}. Ensure DataHub is running."
            )
        
        # Perform sync
        results = sync_service.sync_all()
        
        return {
            "status": results["status"],
            "synced_sources": results["synced_sources"],
            "total_records": results["total_records"],
            "sources": results.get("sources", {}),
            "errors": results.get("errors", []),
            "datahub_url": "http://localhost:9002",
            "message": f"Synced {results['synced_sources']} source(s) to DataHub"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_ERROR,
            detail=f"DataHub sync failed: {str(e)}"
        )


@app.get(f"{settings.api_prefix}/datahub/status")
async def datahub_status(db: Session = Depends(get_db)):
    """
    Check DataHub connectivity and get sync statistics.
    
    Returns connection status and information about data ready to sync.
    """
    try:
        config = DataHubConfig()
        sync_service = DataHubSyncService(db, config)
        
        # Test connection
        connected = sync_service.test_connection()
        
        # Get sync stats
        stats = sync_service.get_sync_stats() if connected else {}
        
        return {
            "connected": connected,
            "gms_url": config.GMS_SERVER,
            "platform_name": config.PLATFORM_NAME,
            "total_records": stats.get("total_records", 0),
            "total_sources": stats.get("total_sources", 0),
            "sources": stats.get("sources", {}),
            "datahub_ui": "http://localhost:9002",
            "message": "DataHub is connected" if connected else "DataHub is not reachable"
        }
        
    except Exception as e:
        return {
            "connected": False,
            "gms_url": DataHubConfig.GMS_SERVER,
            "error": str(e),
            "message": "Failed to connect to DataHub"
        }


@app.post(f"{settings.api_prefix}/datahub/initialize")
async def initialize_datahub():
    """
    Initialize DataHub with OverSight tags and domains.
    
    This is a one-time setup that creates taxonomy tags and organizational
    domains in DataHub. Should be run before the first sync.
    """
    try:
        config = DataHubConfig()
        
        # Initialize tags
        tag_init = TagInitializer(config)
        tag_results = tag_init.initialize_all_tags()
        tag_init.close()
        
        # Initialize domains
        domain_init = DomainInitializer(config)
        domain_results = domain_init.initialize_all_domains()
        domain_init.close()
        
        return {
            "status": "success",
            "tags_created": tag_results["tags_created"],
            "tags_failed": tag_results.get("tags_failed", 0),
            "domains_created": domain_results["domains_created"],
            "domains_failed": domain_results.get("domains_failed", 0),
            "errors": tag_results.get("errors", []) + domain_results.get("errors", []),
            "message": f"Created {tag_results['tags_created']} tags and {domain_results['domains_created']} domains in DataHub"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_ERROR,
            detail=f"DataHub initialization failed: {str(e)}"
        )


# DataHub Search Endpoints for Agent Context
@app.get(f"{settings.api_prefix}/datahub/search")
async def search_datasets(
    query: str = "*",
    platform: Optional[str] = None,
    limit: int = 10
):
    """
    Search datasets in DataHub for agent context
    """
    try:
        from backend.integrations.datahub_client import get_datahub_client
        
        client = get_datahub_client()
        results = await client.search_datasets(
            query=query,
            platform=platform,
            limit=limit
        )
        
        return {
            "status": "success",
            "count": len(results),
            "datasets": results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "datasets": []
        }


@app.get(f"{settings.api_prefix}/datahub/search/domain")
async def search_datasets_by_domain(
    domain: str,
    limit: int = 10
):
    """
    Search datasets by business domain for agent context
    """
    try:
        from backend.integrations.datahub_client import get_datahub_client
        
        client = get_datahub_client()
        results = await client.search_by_domain(
            domain=domain,
            limit=limit
        )
        
        return {
            "status": "success",
            "domain": domain,
            "count": len(results),
            "datasets": results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "datasets": []
        }


@app.get(f"{settings.api_prefix}/datahub/search/tags")
async def search_datasets_by_tags(
    tags: str,
    limit: int = 10
):
    """
    Search datasets by tags for agent context
    """
    try:
        from backend.integrations.datahub_client import get_datahub_client
        
        client = get_datahub_client()
        tag_list = [t.strip() for t in tags.split(",")]
        results = await client.search_by_tags(
            tags=tag_list,
            limit=limit
        )
        
        return {
            "status": "success",
            "tags": tag_list,
            "count": len(results),
            "datasets": results
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "datasets": []
        }


@app.post(f"{settings.api_prefix}/datasets/register", response_model=DatasetRegisterResponse)
async def register_dataset(request: DatasetRegisterRequest):
    """
    Register a new dataset by generating metadata using Gemini LLM.
    
    Takes a dataset description and uses AI to generate:
    - Dataset Name
    - Description (one-liner)
    - Sensitivity level
    - Estimated records count
    - Estimated size
    - Compliance requirements
    - Status
    - Last accessed time
    """
    try:
        from google import genai
        
        api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=503,
                detail="GEMINI_API_KEY not configured. Please set it in your environment variables."
            )
        
        client = genai.Client(api_key=api_key)
        model = settings.gemini_model
        
        prompt = f"""You are a data governance assistant. Based on the following dataset description, generate structured metadata.

Dataset Description: {request.description}

Generate a JSON response with the following structure:
{{
  "dataset_name": "A concise, descriptive name for the dataset",
  "description": "A one-line description of what this dataset contains",
  "sensitivity": "Low, Medium, High, or Critical",
  "records": <estimated number of records as integer>,
  "size": "Estimated size in GB or MB (e.g., '24.5 GB' or '150 MB')",
  "compliance": ["List", "of", "applicable", "compliance", "frameworks", "like", "GDPR", "HIPAA", "CCPA", "PCI-DSS"],
  "status": "active",
  "last_accessed": "Just now"
}}

Rules:
- Dataset name should be clear and professional
- Description must be exactly one line
- Sensitivity: Use "Low" for public data, "Medium" for internal data, "High" for sensitive data, "Critical" for highly sensitive data
- Records: Provide a realistic estimate based on the description
- Size: Estimate based on typical data sizes (e.g., 1M records ≈ 1-5 GB for structured data)
- Compliance: Include relevant frameworks (GDPR for EU personal data, HIPAA for health data, CCPA for California data, PCI-DSS for payment data, SOC 2 for security)
- Status: Always "active" for new registrations
- Last accessed: Always "Just now" for new registrations

Return ONLY valid JSON, no markdown formatting, no code blocks."""

        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={
                    "temperature": 0.3,
                    "max_output_tokens": 500,
                }
            )
            
            response_text = response.text.strip()
            
            # Clean up response - remove markdown code blocks if present
            if response_text.startswith("```json"):
                response_text = response_text[7:]
            elif response_text.startswith("```"):
                response_text = response_text[3:]
            if response_text.endswith("```"):
                response_text = response_text[:-3]
            response_text = response_text.strip()
            
            # Parse JSON
            data = json.loads(response_text)
            
            # Validate and set defaults
            dataset_name = data.get("dataset_name", "Unnamed Dataset")
            description = data.get("description", request.description)
            sensitivity = data.get("sensitivity", "Medium")
            records = int(data.get("records", 100000))
            size = data.get("size", "1 GB")
            compliance = data.get("compliance", [])
            if not isinstance(compliance, list):
                compliance = []
            status = data.get("status", "active")
            last_accessed = data.get("last_accessed", "Just now")
            
            return DatasetRegisterResponse(
                dataset_name=dataset_name,
                description=description,
                sensitivity=sensitivity,
                records=records,
                size=size,
                compliance=compliance,
                status=status,
                last_accessed=last_accessed
            )
            
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to parse AI response as JSON: {str(e)}. Response: {response_text[:200]}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini API error: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_ERROR,
            detail=f"Dataset registration failed: {str(e)}"
        )


# ============================================================================
# Ingestion & Enrichment Endpoints
# ============================================================================

async def run_ingestion_async(pipeline: IngestionPipeline):
    """Async wrapper for IngestionPipeline.run()"""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(None, pipeline.run)


async def run_enrichment_async(bridge: EnrichmentBridge, batch_size: int = 10):
    """Async wrapper for EnrichmentBridge.process_all()"""
    return await bridge.process_all(batch_size=batch_size)


async def process_ingestion_job(job_id: str, file_paths: List[Dict[str, str]]):
    """Process ingestion and enrichment for uploaded files"""
    try:
        job_statuses[job_id]["status"] = "processing"
        job_statuses[job_id]["files_processed"] = 0
        job_statuses[job_id]["records_ingested"] = 0
        job_statuses[job_id]["records_enriched"] = 0
        job_statuses[job_id]["errors"] = []
        
        # Create sources from uploaded files
        sources = []
        for file_info in file_paths:
            file_path = file_info["path"]
            file_type = file_info["type"]
            entity_type = file_info.get("entity_type", Path(file_path).stem)
            
            try:
                config = {"file_path": file_path}
                if entity_type:
                    config["entity_type"] = entity_type
                
                source = SourceFactory.create(file_type, config)
                sources.append(source)
            except Exception as e:
                error_msg = f"Error creating source for {file_path}: {str(e)}"
                job_statuses[job_id]["errors"].append(error_msg)
                continue
        
        if not sources:
            job_statuses[job_id]["status"] = "failed"
            job_statuses[job_id]["error"] = "No valid sources created"
            return
        
        # Run ingestion pipeline
        upload_dir = Path("data/uploads") / job_id
        output_dir = upload_dir / "output"
        output_dir.mkdir(parents=True, exist_ok=True)
        
        pipeline = IngestionPipeline(sources, output_dir=str(output_dir))
        await run_ingestion_async(pipeline)
        
        # Count records from output JSONL files
        jsonl_files = list(Path(output_dir).rglob("data.jsonl"))
        total_records = 0
        for jsonl_file in jsonl_files:
            try:
                with open(jsonl_file, 'r', encoding='utf-8') as f:
                    total_records += sum(1 for line in f if line.strip())
            except Exception:
                pass
        
        job_statuses[job_id]["files_processed"] = len(sources)
        job_statuses[job_id]["records_ingested"] = total_records
        
        # Run enrichment bridge (following test script pattern)
        print(f"[Job {job_id}] Starting enrichment bridge...")
        bridge = EnrichmentBridge(output_dir=str(output_dir))
        try:
            stats = await run_enrichment_async(bridge, batch_size=10)
            
            job_statuses[job_id]["records_enriched"] = stats.get("enriched", 0)
            job_statuses[job_id]["status"] = "completed"
            job_statuses[job_id]["progress"] = 100
            job_statuses[job_id]["enrichment_stats"] = stats
            
            print(f"[Job {job_id}] Enrichment complete: {stats}")
        finally:
            bridge.close()
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Job {job_id}] Error: {str(e)}\n{error_trace}")
        job_statuses[job_id]["status"] = "failed"
        job_statuses[job_id]["error"] = str(e)
        job_statuses[job_id]["errors"].append(str(e))


@app.post(f"{settings.api_prefix}/ingest/upload")
async def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    entity_types: Optional[str] = Form(None)
):
    """
    Upload files for ingestion and enrichment
    
    Accepts multiple files (CSV, JSON, SQLite) and starts processing
    Follows the same workflow as tests/run_ingestion_with_enrichment.py:
    1. Create sources using SourceFactory
    2. Run IngestionPipeline
    3. Run EnrichmentBridge.process_all()
    """
    if not files:
        raise HTTPException(status_code=HTTP_400_BAD_REQUEST, detail="No files provided")
    
    # Generate job ID
    job_id = str(uuid.uuid4())
    
    # Create upload directory
    upload_dir = Path("data/uploads") / job_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Parse entity types if provided (comma-separated)
    entity_type_list = entity_types.split(",") if entity_types else []
    
    # Save files and detect types
    file_paths = []
    valid_extensions = {".csv", ".json", ".db", ".sqlite", ".sqlite3"}
    
    for idx, file in enumerate(files):
        # Validate file extension
        file_ext = Path(file.filename).suffix.lower()
        if file_ext not in valid_extensions:
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail=f"Invalid file type: {file.filename}. Supported: CSV, JSON, SQLite"
            )
        
        # Determine file type
        if file_ext == ".csv":
            file_type = "csv"
        elif file_ext in {".json"}:
            file_type = "json"
        elif file_ext in {".db", ".sqlite", ".sqlite3"}:
            file_type = "sqlite"
        else:
            file_type = "csv"  # default
        
        # Get entity type (from form or filename)
        entity_type = entity_type_list[idx] if idx < len(entity_type_list) else Path(file.filename).stem
        
        # Save file
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_paths.append({
            "path": str(file_path),
            "type": file_type,
            "entity_type": entity_type,
            "filename": file.filename
        })
    
    # Initialize job status
    job_statuses[job_id] = {
        "job_id": job_id,
        "status": "queued",
        "progress": 0,
        "files_processed": 0,
        "total_files": len(files),
        "records_ingested": 0,
        "records_enriched": 0,
        "errors": [],
        "file_paths": file_paths
    }
    
    # Start background processing
    background_tasks.add_task(process_ingestion_job, job_id, file_paths)
    
    return {
        "job_id": job_id,
        "files_received": len(files),
        "status": "queued",
        "message": "Files uploaded, processing started"
    }


@app.get(f"{settings.api_prefix}/ingest/status/{{job_id}}")
async def get_ingestion_status(job_id: str):
    """Get status of an ingestion job"""
    if job_id not in job_statuses:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail=f"Job {job_id} not found"
        )
    
    status = job_statuses[job_id]
    
    # Calculate progress
    if status["status"] == "completed":
        progress = 100
    elif status["status"] == "failed":
        progress = 0
    elif status["status"] == "processing":
        # Estimate progress based on files processed
        if status["total_files"] > 0:
            progress = min(90, int((status["files_processed"] / status["total_files"]) * 90))
        else:
            progress = 50
    else:
        progress = 0
    
    status["progress"] = progress
    
    return status


@app.delete(f"{settings.api_prefix}/enriched")
async def delete_collection(
    source_system: str,
    entity_type: str,
    db: Session = Depends(get_db)
):
    """Delete all records for a specific collection (source_system + entity_type)"""
    try:
        repository = get_enriched_record_repository(db)
        deleted_count = repository.delete_by_source_and_entity(source_system, entity_type)
        
        return {
            "success": True,
            "message": f"Deleted {deleted_count} records",
            "deleted_count": deleted_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_ERROR,
            detail=f"Failed to delete collection: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
