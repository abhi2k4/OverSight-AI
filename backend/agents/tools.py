"""
LangChain tools for agent interactions with DataHub and internal databases
"""
import json
import logging
from typing import Optional, List, Dict, Any
from langchain_core.tools import tool
from sqlalchemy.orm import Session

from backend.integrations.datahub_client import get_datahub_client
from backend.models import EnrichedRecord, Agent
from backend.database import get_db

logger = logging.getLogger(__name__)


@tool
async def search_datasets_tool(
    query: str,
    platform: Optional[str] = None,
    domain: Optional[str] = None,
    limit: int = 10
) -> str:
    """
    Search for datasets in DataHub by query string.
    
    Args:
        query: Search query string (e.g., 'sales', 'customer', 'transactions')
        platform: Optional platform filter (e.g., 'snowflake', 'bigquery', 'postgres')
        domain: Optional domain filter (e.g., 'sales', 'hr', 'finance')
        limit: Maximum number of results to return (default: 10)
    
    Returns:
        JSON string containing list of datasets with URN, name, platform, and description
    """
    try:
        client = get_datahub_client()
        results = await client.search_datasets(
            query=query,
            platform=platform,
            domain=domain,
            limit=limit
        )
        
        if not results:
            return json.dumps({
                "message": f"No datasets found matching query: {query}",
                "count": 0,
                "datasets": []
            })
        
        return json.dumps({
            "message": f"Found {len(results)} datasets",
            "count": len(results),
            "datasets": results
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in search_datasets_tool: {e}")
        return json.dumps({"error": str(e)})


@tool
async def get_dataset_metadata_tool(urn: str) -> str:
    """
    Get detailed metadata for a specific dataset from DataHub.
    
    Args:
        urn: The URN (Unique Resource Name) of the dataset
    
    Returns:
        JSON string containing dataset metadata including schema, tags, owners, and properties
    """
    try:
        client = get_datahub_client()
        metadata = await client.get_dataset_metadata(urn)
        
        if not metadata:
            return json.dumps({
                "error": f"Dataset not found: {urn}"
            })
        
        return json.dumps({
            "message": "Dataset metadata retrieved successfully",
            "metadata": metadata
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in get_dataset_metadata_tool: {e}")
        return json.dumps({"error": str(e)})


@tool
async def search_by_tags_tool(tags: str, limit: int = 10) -> str:
    """
    Search for datasets by tags in DataHub.
    
    Args:
        tags: Comma-separated list of tags (e.g., 'pii,sensitive' or 'public')
        limit: Maximum number of results to return (default: 10)
    
    Returns:
        JSON string containing list of datasets matching the tags
    """
    try:
        tag_list = [t.strip() for t in tags.split(",")]
        client = get_datahub_client()
        results = await client.search_by_tags(tags=tag_list, limit=limit)
        
        return json.dumps({
            "message": f"Found {len(results)} datasets with tags: {tags}",
            "count": len(results),
            "tags_searched": tag_list,
            "datasets": results
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in search_by_tags_tool: {e}")
        return json.dumps({"error": str(e)})


@tool
async def get_lineage_tool(urn: str, direction: str = "DOWNSTREAM") -> str:
    """
    Get lineage information for a dataset.
    
    Args:
        urn: The URN of the dataset
        direction: Lineage direction - 'UPSTREAM' or 'DOWNSTREAM' (default: 'DOWNSTREAM')
    
    Returns:
        JSON string containing lineage graph with entities and relationships
    """
    try:
        if direction.upper() not in ["UPSTREAM", "DOWNSTREAM"]:
            return json.dumps({"error": "Direction must be 'UPSTREAM' or 'DOWNSTREAM'"})
        
        client = get_datahub_client()
        lineage = await client.get_lineage(urn=urn, direction=direction.upper())
        
        return json.dumps({
            "message": f"Lineage retrieved for {urn}",
            "lineage": lineage
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in get_lineage_tool: {e}")
        return json.dumps({"error": str(e)})


@tool
async def search_by_domain_tool(domain: str, limit: int = 10) -> str:
    """
    Search for datasets within a specific business domain.
    
    Args:
        domain: Domain name (e.g., 'sales', 'hr', 'finance', 'marketing', 'operations')
        limit: Maximum number of results to return (default: 10)
    
    Returns:
        JSON string containing list of datasets in the domain
    """
    try:
        client = get_datahub_client()
        results = await client.search_by_domain(domain=domain, limit=limit)
        
        return json.dumps({
            "message": f"Found {len(results)} datasets in domain: {domain}",
            "count": len(results),
            "domain": domain,
            "datasets": results
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in search_by_domain_tool: {e}")
        return json.dumps({"error": str(e)})


@tool
def get_enriched_records_tool(
    collection: Optional[str] = None,
    entity_type: Optional[str] = None,
    limit: int = 10
) -> str:
    """
    Query enriched records from the internal database.
    
    Args:
        collection: Filter by collection/tag name (e.g., 'pii', 'sales', 'finance')
        entity_type: Filter by entity type (e.g., 'user', 'product', 'transaction')
        limit: Maximum number of results to return (default: 10)
    
    Returns:
        JSON string containing enriched records with AI-generated metadata
    """
    try:
        db = next(get_db())
        query = db.query(EnrichedRecord)
        
        if entity_type:
            query = query.filter(EnrichedRecord.entity_type == entity_type)
        
        if collection:
            # Filter by tag in enriched_metadata
            query = query.filter(
                EnrichedRecord.enriched_metadata.op('->>')('tags').contains(collection)
            )
        
        records = query.limit(limit).all()
        
        results = []
        for record in records:
            results.append({
                "id": record.id,
                "source_system": record.source_system,
                "entity_type": record.entity_type,
                "raw_data": record.raw_data,
                "enriched_metadata": record.enriched_metadata,
                "enrichment_timestamp": record.enrichment_timestamp.isoformat() if record.enrichment_timestamp else None
            })
        
        return json.dumps({
            "message": f"Found {len(results)} enriched records",
            "count": len(results),
            "filters": {
                "collection": collection,
                "entity_type": entity_type
            },
            "records": results
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in get_enriched_records_tool: {e}")
        return json.dumps({"error": str(e)})


@tool
def get_collections_tool() -> str:
    """
    Get all available collections (tags) from enriched records.
    
    Returns:
        JSON string containing list of collections with counts
    """
    try:
        db = next(get_db())
        
        # Get all enriched records and extract tags
        records = db.query(EnrichedRecord).all()
        
        tag_counts = {}
        for record in records:
            metadata = record.enriched_metadata
            if isinstance(metadata, dict) and "tags" in metadata:
                tags = metadata["tags"]
                if isinstance(tags, list):
                    for tag in tags:
                        tag_counts[tag] = tag_counts.get(tag, 0) + 1
        
        collections = [
            {"name": tag, "count": count}
            for tag, count in sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
        ]
        
        return json.dumps({
            "message": f"Found {len(collections)} collections",
            "count": len(collections),
            "collections": collections
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in get_collections_tool: {e}")
        return json.dumps({"error": str(e)})


@tool
def get_analytics_tool(metric: Optional[str] = None) -> str:
    """
    Get analytics and statistics about enriched data.
    
    Args:
        metric: Specific metric to retrieve (e.g., 'total_records', 'avg_confidence', 'by_entity_type')
    
    Returns:
        JSON string containing analytics data
    """
    try:
        db = next(get_db())
        
        total_records = db.query(EnrichedRecord).count()
        
        # Count by entity type
        entity_counts = {}
        records = db.query(EnrichedRecord).all()
        
        total_confidence = 0
        confidence_count = 0
        
        for record in records:
            entity_type = record.entity_type
            entity_counts[entity_type] = entity_counts.get(entity_type, 0) + 1
            
            # Extract confidence if available
            metadata = record.enriched_metadata
            if isinstance(metadata, dict) and "confidence" in metadata:
                try:
                    confidence = float(metadata["confidence"])
                    total_confidence += confidence
                    confidence_count += 1
                except (ValueError, TypeError):
                    pass
        
        avg_confidence = total_confidence / confidence_count if confidence_count > 0 else 0
        
        analytics = {
            "total_records": total_records,
            "average_confidence": round(avg_confidence, 2),
            "by_entity_type": entity_counts
        }
        
        return json.dumps({
            "message": "Analytics retrieved successfully",
            "analytics": analytics
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in get_analytics_tool: {e}")
        return json.dumps({"error": str(e)})


@tool
def check_compliance_tool(entity_type: Optional[str] = None, sensitivity_level: Optional[str] = None) -> str:
    """
    Check compliance status of datasets and identify PII or sensitive data.
    
    Args:
        entity_type: Filter by entity type
        sensitivity_level: Filter by sensitivity level (e.g., 'pii', 'sensitive', 'public')
    
    Returns:
        JSON string containing compliance report
    """
    try:
        db = next(get_db())
        query = db.query(EnrichedRecord)
        
        if entity_type:
            query = query.filter(EnrichedRecord.entity_type == entity_type)
        
        records = query.all()
        
        compliance_report = {
            "total_records": len(records),
            "pii_records": 0,
            "sensitive_records": 0,
            "public_records": 0,
            "issues": []
        }
        
        for record in records:
            metadata = record.enriched_metadata
            if isinstance(metadata, dict) and "tags" in metadata:
                tags = metadata.get("tags", [])
                if isinstance(tags, list):
                    if "pii" in tags:
                        compliance_report["pii_records"] += 1
                    if "sensitive" in tags:
                        compliance_report["sensitive_records"] += 1
                    if "public" in tags:
                        compliance_report["public_records"] += 1
        
        return json.dumps({
            "message": "Compliance check completed",
            "compliance_report": compliance_report
        }, indent=2)
        
    except Exception as e:
        logger.error(f"Error in check_compliance_tool: {e}")
        return json.dumps({"error": str(e)})


# Tool registry for easy access
ALL_TOOLS = [
    search_datasets_tool,
    get_dataset_metadata_tool,
    search_by_tags_tool,
    get_lineage_tool,
    search_by_domain_tool,
    get_enriched_records_tool,
    get_collections_tool,
    get_analytics_tool,
    check_compliance_tool
]

# Tool groups by agent specialization
TOOL_GROUPS = {
    "data_discovery": [
        search_datasets_tool,
        get_dataset_metadata_tool,
        search_by_domain_tool,
        get_collections_tool
    ],
    "metadata": [
        get_dataset_metadata_tool,
        search_by_tags_tool,
        get_lineage_tool,
        get_enriched_records_tool
    ],
    "compliance": [
        search_by_tags_tool,
        check_compliance_tool,
        get_enriched_records_tool
    ],
    "analytics": [
        get_analytics_tool,
        get_enriched_records_tool,
        get_collections_tool
    ],
    "supervisor": ALL_TOOLS  # Supervisor has access to all tools
}
