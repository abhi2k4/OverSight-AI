"""
Mapper for transforming OverSight enriched records to DataHub metadata.
"""

import json
import logging
from collections import defaultdict
from datetime import datetime
from typing import Any, Dict, List, Set, Optional

from datahub.emitter.mcp import MetadataChangeProposalWrapper
from datahub.metadata.schema_classes import (
    DatasetPropertiesClass,
    GlobalTagsClass,
    TagAssociationClass,
    SchemaMetadataClass,
    SchemaFieldClass,
    StringTypeClass,
    NumberTypeClass,
    BooleanTypeClass,
    ArrayTypeClass,
    NullTypeClass,
)

from .config import DataHubConfig

logger = logging.getLogger(__name__)


class DataHubMapper:
    """
    Maps OverSight enriched records to DataHub metadata aspects.
    """
    
    def __init__(self, config: Optional[DataHubConfig] = None):
        """
        Initialize mapper.
        
        Args:
            config: DataHub configuration
        """
        self.config = config or DataHubConfig()
    
    def map_source_to_dataset(self, source_system: str, enriched_records: List[Dict[str, Any]]) -> List[MetadataChangeProposalWrapper]:
        """
        Map enriched records from a source system to DataHub dataset metadata.
        
        Args:
            source_system: Source system identifier
            enriched_records: List of enriched records from this source
            
        Returns:
            List of MetadataChangeProposalWrappers for this dataset
        """
        if not enriched_records:
            logger.warning(f"No records found for source: {source_system}")
            return []
        
        dataset_urn = self.config.get_dataset_urn(source_system)
        mcps = []
        
        # 1. Dataset Properties
        properties_mcp = self._build_dataset_properties(dataset_urn, source_system, enriched_records)
        mcps.append(properties_mcp)
        
        # 2. Global Tags
        tags_mcp = self._build_global_tags(dataset_urn, enriched_records)
        if tags_mcp:
            mcps.append(tags_mcp)
        
        # 3. Schema Metadata
        schema_mcp = self._build_schema_metadata(dataset_urn, source_system, enriched_records)
        if schema_mcp:
            mcps.append(schema_mcp)
        
        logger.info(f"Created {len(mcps)} MCPs for source: {source_system}")
        return mcps
    
    def _build_dataset_properties(
        self, 
        dataset_urn: str, 
        source_system: str, 
        records: List[Dict[str, Any]]
    ) -> MetadataChangeProposalWrapper:
        """Build DatasetProperties aspect"""
        
        # Aggregate statistics
        total_records = len(records)
        confidences = []
        low_confidence_count = 0
        entity_types = set()
        latest_enrichment = None
        
        for record in records:
            # Extract enriched metadata
            enriched_meta = record.get("enriched_metadata", {})
            if isinstance(enriched_meta, str):
                try:
                    enriched_meta = json.loads(enriched_meta)
                except:
                    enriched_meta = {}
            
            # Confidence
            confidence = enriched_meta.get("confidence", 0.5)
            confidences.append(confidence)
            if confidence < self.config.LOW_CONFIDENCE_THRESHOLD:
                low_confidence_count += 1
            
            # Entity types
            if record.get("entity_type"):
                entity_types.add(record["entity_type"])
            
            # Latest enrichment timestamp
            enrichment_ts = record.get("enrichment_timestamp")
            if enrichment_ts:
                if isinstance(enrichment_ts, str):
                    try:
                        enrichment_ts = datetime.fromisoformat(enrichment_ts.replace('Z', '+00:00'))
                    except:
                        pass
                if latest_enrichment is None or enrichment_ts > latest_enrichment:
                    latest_enrichment = enrichment_ts
        
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.5
        
        # Determine source type
        source_type = "unknown"
        if source_system.endswith('.db'):
            source_type = "sqlite"
        elif source_system.endswith('.json'):
            source_type = "json"
        elif source_system.endswith('.csv'):
            source_type = "csv"
        
        # Build description
        entity_type_str = ", ".join(sorted(entity_types)) if entity_types else "data"
        description = (
            f"{source_system} enriched with AI-generated metadata. "
            f"Contains {total_records} {entity_type_str} record(s) with average "
            f"confidence score of {avg_confidence:.2f}."
        )
        
        # Build custom properties
        custom_properties = {
            "source_system": source_system,
            "total_records": str(total_records),
            "avg_confidence": f"{avg_confidence:.2f}",
            "low_confidence_count": str(low_confidence_count),
            "enrichment_version": self.config.ENRICHMENT_VERSION,
            "entity_types": ", ".join(sorted(entity_types)),
            "data_source_type": source_type,
            "oversight_api": f"{self.config.OVERSIGHT_API_URL}/api/enriched?source_system={source_system}",
        }
        
        if latest_enrichment:
            custom_properties["last_enrichment"] = latest_enrichment.isoformat()
        
        # Create aspect
        properties_aspect = DatasetPropertiesClass(
            description=description,
            customProperties=custom_properties,
        )
        
        return MetadataChangeProposalWrapper(
            entityUrn=dataset_urn,
            aspect=properties_aspect,
        )
    
    def _build_global_tags(
        self, 
        dataset_urn: str, 
        records: List[Dict[str, Any]]
    ) -> Optional[MetadataChangeProposalWrapper]:
        """Build GlobalTags aspect"""
        
        # Collect all unique tags from all records
        all_tags: Set[str] = set()
        
        for record in records:
            enriched_meta = record.get("enriched_metadata", {})
            if isinstance(enriched_meta, str):
                try:
                    enriched_meta = json.loads(enriched_meta)
                except:
                    enriched_meta = {}
            
            tags = enriched_meta.get("tags", [])
            if isinstance(tags, list):
                all_tags.update(tags)
        
        if not all_tags:
            logger.debug(f"No tags found for dataset: {dataset_urn}")
            return None
        
        # Create tag associations
        tag_associations = [
            TagAssociationClass(tag=self.config.get_tag_urn(tag))
            for tag in sorted(all_tags)
        ]
        
        tags_aspect = GlobalTagsClass(tags=tag_associations)
        
        return MetadataChangeProposalWrapper(
            entityUrn=dataset_urn,
            aspect=tags_aspect,
        )
    
    def _build_schema_metadata(
        self, 
        dataset_urn: str, 
        source_system: str, 
        records: List[Dict[str, Any]]
    ) -> Optional[MetadataChangeProposalWrapper]:
        """Build SchemaMetadata aspect by inferring schema from raw_data"""
        
        # Collect field information across all records
        field_info = defaultdict(lambda: {
            "types": set(),
            "nullable": False,
            "present_count": 0,
        })
        
        for record in records:
            raw_data = record.get("raw_data", {})
            if isinstance(raw_data, str):
                try:
                    raw_data = json.loads(raw_data)
                except:
                    raw_data = {}
            
            if not isinstance(raw_data, dict):
                continue
            
            # Track fields
            for field_name, field_value in raw_data.items():
                field_info[field_name]["present_count"] += 1
                
                # Infer type
                if field_value is None:
                    field_info[field_name]["nullable"] = True
                    field_info[field_name]["types"].add("null")
                elif isinstance(field_value, bool):
                    field_info[field_name]["types"].add("boolean")
                elif isinstance(field_value, int):
                    field_info[field_name]["types"].add("number")
                elif isinstance(field_value, float):
                    field_info[field_name]["types"].add("number")
                elif isinstance(field_value, str):
                    field_info[field_name]["types"].add("string")
                elif isinstance(field_value, list):
                    field_info[field_name]["types"].add("array")
                elif isinstance(field_value, dict):
                    field_info[field_name]["types"].add("object")
                else:
                    field_info[field_name]["types"].add("string")
        
        if not field_info:
            logger.debug(f"No schema fields found for dataset: {dataset_urn}")
            return None
        
        # Build schema fields
        schema_fields = []
        total_records = len(records)
        
        for field_name, info in sorted(field_info.items()):
            # Determine primary type
            types = info["types"]
            if "string" in types:
                native_type = StringTypeClass()
            elif "number" in types:
                native_type = NumberTypeClass()
            elif "boolean" in types:
                native_type = BooleanTypeClass()
            elif "array" in types:
                native_type = ArrayTypeClass()
            else:
                native_type = NullTypeClass()
            
            # Calculate presence percentage
            presence_pct = (info["present_count"] / total_records * 100) if total_records > 0 else 0
            
            # Build description
            type_str = ", ".join(sorted(types))
            description = f"Field present in {presence_pct:.0f}% of records. Type(s): {type_str}"
            
            schema_field = SchemaFieldClass(
                fieldPath=field_name,
                type=native_type,
                nativeDataType=type_str,
                description=description,
                nullable=info["nullable"],
            )
            schema_fields.append(schema_field)
        
        # Create schema metadata
        schema_aspect = SchemaMetadataClass(
            schemaName=source_system,
            platform=f"urn:li:dataPlatform:{self.config.PLATFORM_NAME}",
            version=0,
            hash="",
            platformSchema=None,
            fields=schema_fields,
        )
        
        return MetadataChangeProposalWrapper(
            entityUrn=dataset_urn,
            aspect=schema_aspect,
        )
