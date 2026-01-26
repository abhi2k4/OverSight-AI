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

# Include policy and compliance routes
from backend.api.policy_routes import router as policy_router
from backend.api.compliance_routes import router as compliance_router
from backend.api.violation_routes import router as violation_router

app.include_router(policy_router, prefix=settings.api_prefix)
app.include_router(compliance_router, prefix=settings.api_prefix)
app.include_router(violation_router, prefix=settings.api_prefix)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()
    
    # Seed default compliances if database is empty
    try:
        from backend.database import SessionLocal
        from backend.models import Compliance
        
        db = SessionLocal()
        try:
            compliance_count = db.query(Compliance).count()
            if compliance_count == 0:
                print("[Startup] No compliances found in database, seeding defaults...")
                from backend.scripts.seed_compliances import seed_compliances
                seed_compliances()
            else:
                print(f"[Startup] Found {compliance_count} compliances in database")
                
            # Also check policies
            from backend.models import Policy
            policy_count = db.query(Policy).count()
            print(f"[Startup] Found {policy_count} policies in database")
        finally:
            db.close()
    except Exception as e:
        print(f"[Startup] Warning: Could not check/seed compliances: {e}")
        import traceback
        traceback.print_exc()
    
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
    """Process ingestion only for uploaded files (enrichment handled separately)"""
    try:
        job_statuses[job_id]["status"] = "processing"
        job_statuses[job_id]["files_processed"] = 0
        job_statuses[job_id]["records_ingested"] = 0
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
        job_statuses[job_id]["output_dir"] = str(output_dir)
        job_statuses[job_id]["status"] = "ingested"  # Changed from "completed"
        job_statuses[job_id]["enrichment_status"] = "pending"  # Ready for enrichment
        job_statuses[job_id]["progress"] = 100
        
        # Save metadata (sensitivity and compliance) to a JSON file in output directory
        import json
        metadata = {}
        for file_info in file_paths:
            entity_type = file_info.get("entity_type", "")
            if entity_type:
                metadata[entity_type] = {
                    "sensitivity": file_info.get("sensitivity", "Low"),
                    "compliance": file_info.get("compliance", [])
                }
        
        metadata_file = output_dir / "metadata.json"
        with open(metadata_file, "w") as f:
            json.dump(metadata, f, indent=2)
        
        print(f"[Job {job_id}] Ingestion complete: {total_records} records ingested. Ready for enrichment.")
        
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
    entity_types: Optional[str] = Form(None),
    sensitivities: Optional[str] = Form(None),
    compliances: Optional[str] = Form(None)
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
    
    # Parse sensitivities if provided (comma-separated)
    sensitivity_list = sensitivities.split(",") if sensitivities else []
    
    # Parse compliances if provided (JSON array of arrays)
    compliance_list = []
    if compliances:
        try:
            import json
            compliance_list = json.loads(compliances)
            if not isinstance(compliance_list, list):
                compliance_list = []
        except:
            compliance_list = []
    
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
        
        # Get sensitivity (from form or default to 'Low')
        sensitivity = sensitivity_list[idx] if idx < len(sensitivity_list) else 'Low'
        
        # Get compliance (from form or default to empty list)
        compliance = compliance_list[idx] if idx < len(compliance_list) else []
        if not isinstance(compliance, list):
            compliance = []
        
        # Save file
        file_path = upload_dir / file.filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_paths.append({
            "path": str(file_path),
            "type": file_type,
            "entity_type": entity_type,
            "filename": file.filename,
            "sensitivity": sensitivity,
            "compliance": compliance
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
        "file_paths": file_paths,
        "output_dir": None,  # Will be set after ingestion
        "enrichment_status": "pending",  # pending, processing, completed, failed
        "enrichment_job_id": None,  # Track enrichment job separately
        "created_at": datetime.now(timezone.utc).isoformat()
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
    if status["status"] == "ingested" or status["status"] == "completed":
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


# Enrichment job tracking (separate from ingestion)
enrichment_job_statuses: Dict[str, Dict[str, Any]] = {}


async def process_enrichment_job(ingestion_job_id: str, output_dir: str):
    """Process enrichment for an ingested dataset"""
    enrichment_job_id = f"enrich_{ingestion_job_id}_{uuid.uuid4().hex[:8]}"
    
    try:
        # Update ingestion job status
        if ingestion_job_id in job_statuses:
            job_statuses[ingestion_job_id]["enrichment_status"] = "processing"
            job_statuses[ingestion_job_id]["enrichment_job_id"] = enrichment_job_id
        
        # Initialize enrichment job status
        enrichment_job_statuses[enrichment_job_id] = {
            "enrichment_job_id": enrichment_job_id,
            "ingestion_job_id": ingestion_job_id,
            "status": "processing",
            "progress": 0,
            "records_enriched": 0,
            "records_failed": 0,
            "errors": []
        }
        
        # Run enrichment bridge
        print(f"[Enrichment Job {enrichment_job_id}] Starting enrichment for ingestion job {ingestion_job_id}...")
        bridge = EnrichmentBridge(output_dir=output_dir)
        try:
            stats = await run_enrichment_async(bridge, batch_size=10)
            
            enrichment_job_statuses[enrichment_job_id]["records_enriched"] = stats.get("enriched", 0)
            enrichment_job_statuses[enrichment_job_id]["records_failed"] = stats.get("failed", 0)
            enrichment_job_statuses[enrichment_job_id]["status"] = "completed"
            enrichment_job_statuses[enrichment_job_id]["progress"] = 100
            enrichment_job_statuses[enrichment_job_id]["stats"] = stats
            
            # Update ingestion job status
            if ingestion_job_id in job_statuses:
                job_statuses[ingestion_job_id]["enrichment_status"] = "completed"
                job_statuses[ingestion_job_id]["records_enriched"] = stats.get("enriched", 0)
            
            print(f"[Enrichment Job {enrichment_job_id}] Enrichment complete: {stats}")
        finally:
            bridge.close()
        
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[Enrichment Job {enrichment_job_id}] Error: {str(e)}\n{error_trace}")
        
        enrichment_job_statuses[enrichment_job_id]["status"] = "failed"
        enrichment_job_statuses[enrichment_job_id]["error"] = str(e)
        enrichment_job_statuses[enrichment_job_id]["errors"].append(str(e))
        
        # Update ingestion job status
        if ingestion_job_id in job_statuses:
            job_statuses[ingestion_job_id]["enrichment_status"] = "failed"


@app.post(f"{settings.api_prefix}/enrichment/process")
async def process_enrichment(
    background_tasks: BackgroundTasks,
    ingestion_job_id: Optional[str] = Form(None)
):
    """
    Process enrichment for a specific ingestion job
    
    Takes an ingestion job_id and enriches the data from its output directory
    """
    if not ingestion_job_id:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail="ingestion_job_id is required"
        )
    
    if ingestion_job_id not in job_statuses:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail=f"Ingestion job {ingestion_job_id} not found"
        )
    
    job_status = job_statuses[ingestion_job_id]
    
    # Check if ingestion is complete
    if job_status["status"] != "ingested":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Ingestion job {ingestion_job_id} is not ready for enrichment. Status: {job_status['status']}"
        )
    
    # Check if already enriched
    if job_status.get("enrichment_status") == "completed":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Ingestion job {ingestion_job_id} has already been enriched"
        )
    
    # Check if enrichment is already in progress
    if job_status.get("enrichment_status") == "processing":
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Enrichment is already in progress for ingestion job {ingestion_job_id}"
        )
    
    output_dir = job_status.get("output_dir")
    if not output_dir:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST,
            detail=f"Output directory not found for ingestion job {ingestion_job_id}"
        )
    
    # Start enrichment processing
    background_tasks.add_task(process_enrichment_job, ingestion_job_id, output_dir)
    
    return {
        "ingestion_job_id": ingestion_job_id,
        "status": "queued",
        "message": "Enrichment processing started"
    }


@app.get(f"{settings.api_prefix}/enrichment/queue")
async def get_enrichment_queue():
    """Get list of ingestion jobs ready for enrichment"""
    ready_jobs = []
    
    for job_id, job_status in job_statuses.items():
        if job_status["status"] == "ingested" and job_status.get("enrichment_status") == "pending":
            ready_jobs.append({
                "job_id": job_id,
                "status": job_status["status"],
                "files_processed": job_status.get("files_processed", 0),
                "records_ingested": job_status.get("records_ingested", 0),
                "output_dir": job_status.get("output_dir"),
                "enrichment_status": job_status.get("enrichment_status", "pending"),
                "created_at": job_status.get("created_at")
            })
    
    return {
        "total": len(ready_jobs),
        "jobs": ready_jobs
    }


@app.get(f"{settings.api_prefix}/enrichment/status/{{ingestion_job_id}}")
async def get_enrichment_status(ingestion_job_id: str):
    """Get enrichment status for an ingestion job"""
    if ingestion_job_id not in job_statuses:
        raise HTTPException(
            status_code=HTTP_404_NOT_FOUND,
            detail=f"Ingestion job {ingestion_job_id} not found"
        )
    
    job_status = job_statuses[ingestion_job_id]
    enrichment_job_id = job_status.get("enrichment_job_id")
    
    result = {
        "ingestion_job_id": ingestion_job_id,
        "enrichment_status": job_status.get("enrichment_status", "pending"),
        "records_enriched": job_status.get("records_enriched", 0),
        "records_ingested": job_status.get("records_ingested", 0)
    }
    
    # If enrichment job exists, include its details
    if enrichment_job_id and enrichment_job_id in enrichment_job_statuses:
        enrichment_status = enrichment_job_statuses[enrichment_job_id]
        result["enrichment_job"] = {
            "enrichment_job_id": enrichment_job_id,
            "status": enrichment_status.get("status"),
            "progress": enrichment_status.get("progress", 0),
            "records_enriched": enrichment_status.get("records_enriched", 0),
            "records_failed": enrichment_status.get("records_failed", 0)
        }
    
    return result


@app.get(f"{settings.api_prefix}/ingest/jobs")
async def list_ingestion_jobs():
    """List all ingestion jobs with their status"""
    jobs = []
    
    for job_id, job_status in job_statuses.items():
        jobs.append({
            "job_id": job_id,
            "status": job_status.get("status"),
            "files_processed": job_status.get("files_processed", 0),
            "total_files": job_status.get("total_files", 0),
            "records_ingested": job_status.get("records_ingested", 0),
            "records_enriched": job_status.get("records_enriched", 0),
            "output_dir": job_status.get("output_dir"),
            "enrichment_status": job_status.get("enrichment_status", "pending"),
            "created_at": job_status.get("created_at"),
            "progress": job_status.get("progress", 0)
        })
    
    # Sort by created_at descending (newest first)
    jobs.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {
        "total": len(jobs),
        "jobs": jobs
    }


@app.get(f"{settings.api_prefix}/output/collections")
async def get_output_collections(
    source_system: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = DEFAULT_PAGE_LIMIT,
    offset: int = 0
):
    """
    Read collection data from output directory (fallback when database is empty)
    
    Searches through data/uploads/*/output/ directory structure to find
    matching source_system and entity_type in JSONL files.
    """
    try:
        import json
        from pathlib import Path
        
        uploads_dir = Path("data/uploads")
        if not uploads_dir.exists():
            return {
                "total": 0,
                "page": 1,
                "limit": limit,
                "records": []
            }
        
        all_records = []
        metadata_map = {}  # entity_type -> {sensitivity, compliance}
        
        # Search through all job directories
        for job_dir in uploads_dir.iterdir():
            if not job_dir.is_dir():
                continue
            
            output_dir = job_dir / "output"
            if not output_dir.exists():
                continue
            
            # Try to load metadata.json if it exists
            metadata_file = output_dir / "metadata.json"
            if metadata_file.exists():
                try:
                    with open(metadata_file, 'r') as f:
                        job_metadata = json.load(f)
                        metadata_map.update(job_metadata)
                except:
                    pass
            
            # Find all JSONL files matching the criteria
            for jsonl_file in output_dir.rglob("data.jsonl"):
                # Extract source_system and entity_type from path
                # Path structure: .../output/{source_system}/{entity_type}/{date}/data.jsonl
                parts = jsonl_file.parts
                if len(parts) < 4:
                    continue
                
                file_source_system = parts[-4]
                file_entity_type = parts[-3]
                
                # Filter by source_system and entity_type if provided
                if source_system and file_source_system != source_system:
                    continue
                if entity_type and file_entity_type != entity_type:
                    continue
                
                # Get file size for size calculation
                file_size_bytes = jsonl_file.stat().st_size if jsonl_file.exists() else 0
                
                # Try to get enriched metadata from database if available
                from backend.database import SessionLocal
                db = SessionLocal()
                has_enriched_data = False
                try:
                    repository = get_enriched_record_repository(db)
                    # Check if we have enriched records for this source/entity
                    sample_enriched, _ = repository.get_all(
                        limit=1,
                        offset=0,
                        source_system=file_source_system,
                        entity_type=file_entity_type
                    )
                    has_enriched_data = len(sample_enriched) > 0
                except:
                    has_enriched_data = False
                finally:
                    db.close()
                
                # Read JSONL file
                try:
                    record_count = 0
                    sample_records = []
                    
                    with open(jsonl_file, 'r', encoding='utf-8') as f:
                        for line in f:
                            line = line.strip()
                            if not line:
                                continue
                            
                            try:
                                record_data = json.loads(line)
                                
                                # Extract raw_data from the envelope structure
                                raw_data = record_data.get("record") or record_data.get("raw_record") or record_data
                                
                                # Try to get enriched metadata from database if available
                                enriched_metadata = None
                                if has_enriched_data:
                                    try:
                                        db = SessionLocal()
                                        repository = get_enriched_record_repository(db)
                                        # Find matching enriched record by raw_data
                                        raw_data_str = json.dumps(raw_data, sort_keys=True)
                                        enriched_records = repository.get_all_records()
                                        for er in enriched_records:
                                            if (er.source_system == file_source_system and 
                                                er.entity_type == file_entity_type and
                                                json.dumps(er.raw_data, sort_keys=True) == raw_data_str):
                                                enriched_metadata = parse_metadata_json(er.enriched_metadata)
                                                break
                                        db.close()
                                    except:
                                        pass
                                
                                # If no enriched metadata found, create basic metadata
                                if not enriched_metadata:
                                    # Calculate size estimate from this record
                                    record_size_bytes = len(json.dumps(raw_data).encode('utf-8'))
                                    estimated_size_mb = (record_size_bytes * 1000) / (1024 * 1024)  # Rough estimate
                                    if estimated_size_mb < 1:
                                        estimated_size = f"{estimated_size_mb * 1024:.2f} KB"
                                    elif estimated_size_mb < 1024:
                                        estimated_size = f"{estimated_size_mb:.2f} MB"
                                    else:
                                        estimated_size = f"{estimated_size_mb / 1024:.2f} GB"
                                    
                                    # Extract tags from record structure to infer compliance
                                    tags = []
                                    raw_data_str = json.dumps(raw_data).lower()
                                    if any(keyword in raw_data_str for keyword in ['email', 'name', 'address', 'phone', 'ssn']):
                                        tags.append('pii')
                                    if 'gdpr' in raw_data_str or 'eu' in raw_data_str:
                                        tags.append('GDPR')
                                    if any(keyword in raw_data_str for keyword in ['health', 'medical', 'patient', 'diagnosis']):
                                        tags.append('HIPAA')
                                    if any(keyword in raw_data_str for keyword in ['card', 'payment', 'credit', 'cvv']):
                                        tags.append('PCI-DSS')
                                    
                                    enriched_metadata = {
                                        "description": f"Data record from {file_source_system}",
                                        "tags": tags if tags else ["structured"],
                                        "confidence": 0.7,  # Lower confidence for unenriched data
                                        "estimated_size": estimated_size
                                    }
                                
                                # Get metadata for this entity_type if available
                                entity_metadata = metadata_map.get(file_entity_type, {})
                                
                                # Create a record in the same format as enriched records
                                record = {
                                    "id": len(all_records) + 1,  # Temporary ID
                                    "source_system": file_source_system,
                                    "entity_type": file_entity_type,
                                    "raw_data": raw_data,
                                    "enriched_metadata": enriched_metadata,
                                    "enrichment_timestamp": record_data.get("ingestion_timestamp") or datetime.now(timezone.utc).isoformat(),
                                    # Add upload metadata (sensitivity and compliance)
                                    "upload_metadata": {
                                        "sensitivity": entity_metadata.get("sensitivity", "Low"),
                                        "compliance": entity_metadata.get("compliance", [])
                                    }
                                }
                                
                                all_records.append(record)
                                record_count += 1
                                
                                # Store sample for size calculation
                                if len(sample_records) < 10:
                                    sample_records.append(record)
                                    
                            except json.JSONDecodeError as e:
                                print(f"Error parsing line in {jsonl_file}: {e}")
                                continue
                    
                    # Update size estimates based on actual file size if we have records
                    if record_count > 0 and sample_records:
                        avg_record_size = file_size_bytes / record_count if record_count > 0 else 0
                        total_size_bytes = avg_record_size * record_count
                        
                        # Format size
                        if total_size_bytes < 1024 * 1024:
                            formatted_size = f"{total_size_bytes / 1024:.2f} KB"
                        elif total_size_bytes < 1024 * 1024 * 1024:
                            formatted_size = f"{total_size_bytes / (1024 * 1024):.2f} MB"
                        else:
                            formatted_size = f"{total_size_bytes / (1024 * 1024 * 1024):.2f} GB"
                        
                        # Update estimated_size in metadata for sample records
                        for record in sample_records:
                            if record.get("enriched_metadata"):
                                record["enriched_metadata"]["estimated_size"] = formatted_size
                                
                except Exception as e:
                    print(f"Error reading {jsonl_file}: {e}")
                    continue
        
        # Apply pagination
        total = len(all_records)
        paginated_records = all_records[offset:offset + limit]
        
        return {
            "total": total,
            "page": (offset // limit) + 1,
            "limit": limit,
            "records": paginated_records,
            "metadata": metadata_map  # Include metadata in response
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTP_500_INTERNAL_ERROR,
            detail=f"Failed to read from output directory: {str(e)}"
        )


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
