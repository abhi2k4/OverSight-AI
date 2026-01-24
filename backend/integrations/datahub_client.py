"""
DataHub client wrapper for metadata operations
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from functools import lru_cache

from backend.api.config import settings

logger = logging.getLogger(__name__)


class DataHubClient:
    """Wrapper for DataHub API operations with caching and error handling"""
    
    def __init__(self):
        self._client = None
        self._search_client = None
        self._lineage_client = None
        self._cache = {}
        self._cache_expiry = {}
        self.enabled = settings.datahub_enabled
        
        if self.enabled:
            self._initialize_client()
    
    def _initialize_client(self):
        """Initialize DataHub client connections"""
        try:
            from datahub.emitter.rest_emitter import DatahubRestEmitter
            from datahub.ingestion.graph.client import DatahubClientConfig, DataHubGraph
            
            config = DatahubClientConfig(
                server=settings.datahub_server_url,
                token=settings.datahub_token if settings.datahub_token else None,
                timeout_sec=settings.datahub_timeout
            )
            
            self._client = DataHubGraph(config)
            logger.info(f"DataHub client initialized: {settings.datahub_server_url}")
            
        except ImportError:
            logger.warning("DataHub SDK not installed. Install with: pip install 'acryl-datahub[datahub-rest]'")
            self.enabled = False
        except Exception as e:
            logger.error(f"Failed to initialize DataHub client: {e}")
            self.enabled = False
    
    def _get_cached(self, key: str) -> Optional[Any]:
        """Get cached result if not expired"""
        if key in self._cache:
            expiry = self._cache_expiry.get(key)
            if expiry and datetime.now() < expiry:
                return self._cache[key]
            else:
                # Expired, remove from cache
                del self._cache[key]
                del self._cache_expiry[key]
        return None
    
    def _set_cache(self, key: str, value: Any):
        """Cache result with TTL"""
        self._cache[key] = value
        self._cache_expiry[key] = datetime.now() + timedelta(seconds=settings.datahub_cache_ttl)
    
    async def search_datasets(
        self, 
        query: str = "*",
        platform: Optional[str] = None,
        domain: Optional[str] = None,
        tags: Optional[List[str]] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for datasets in DataHub
        
        Args:
            query: Search query string
            platform: Filter by platform (e.g., 'snowflake', 'bigquery')
            domain: Filter by domain
            tags: Filter by tags
            limit: Maximum results to return
            
        Returns:
            List of dataset metadata dictionaries
        """
        if not self.enabled:
            return []
        
        cache_key = f"search:{query}:{platform}:{domain}:{tags}:{limit}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            results = []
            
            # Build filters
            filters = []
            if platform:
                filters.append({"field": "platform", "value": platform, "condition": "EQUAL"})
            if domain:
                filters.append({"field": "domains", "value": domain, "condition": "EQUAL"})
            if tags:
                for tag in tags:
                    filters.append({"field": "tags", "value": tag, "condition": "EQUAL"})
            
            # Execute search
            search_results = self._client.graph.execute_graphql(
                query="""
                query search($input: SearchInput!) {
                    search(input: $input) {
                        total
                        searchResults {
                            entity {
                                urn
                                type
                                ... on Dataset {
                                    name
                                    platform {
                                        name
                                    }
                                    properties {
                                        name
                                        description
                                    }
                                }
                            }
                        }
                    }
                }
                """,
                variables={
                    "input": {
                        "type": "DATASET",
                        "query": query,
                        "start": 0,
                        "count": limit,
                        "filters": filters
                    }
                }
            )
            
            if search_results and "search" in search_results:
                for result in search_results["search"]["searchResults"]:
                    entity = result["entity"]
                    results.append({
                        "urn": entity.get("urn"),
                        "type": entity.get("type"),
                        "name": entity.get("name"),
                        "platform": entity.get("platform", {}).get("name"),
                        "description": entity.get("properties", {}).get("description"),
                    })
            
            self._set_cache(cache_key, results)
            return results
            
        except Exception as e:
            logger.error(f"Error searching datasets: {e}")
            return []
    
    async def get_dataset_metadata(self, urn: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed metadata for a specific dataset
        
        Args:
            urn: Dataset URN
            
        Returns:
            Dataset metadata dictionary
        """
        if not self.enabled:
            return None
        
        cache_key = f"metadata:{urn}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            result = self._client.graph.execute_graphql(
                query="""
                query getDataset($urn: String!) {
                    dataset(urn: $urn) {
                        urn
                        name
                        platform {
                            name
                        }
                        properties {
                            name
                            description
                            customProperties {
                                key
                                value
                            }
                        }
                        schemaMetadata {
                            fields {
                                fieldPath
                                nativeDataType
                                description
                            }
                        }
                        tags {
                            tags {
                                tag {
                                    name
                                }
                            }
                        }
                        ownership {
                            owners {
                                owner {
                                    ... on CorpUser {
                                        username
                                    }
                                }
                                type
                            }
                        }
                    }
                }
                """,
                variables={"urn": urn}
            )
            
            if result and "dataset" in result:
                dataset = result["dataset"]
                metadata = {
                    "urn": dataset.get("urn"),
                    "name": dataset.get("name"),
                    "platform": dataset.get("platform", {}).get("name"),
                    "description": dataset.get("properties", {}).get("description"),
                    "custom_properties": dataset.get("properties", {}).get("customProperties", []),
                    "schema": dataset.get("schemaMetadata", {}).get("fields", []),
                    "tags": [t["tag"]["name"] for t in dataset.get("tags", {}).get("tags", [])],
                    "owners": [
                        {"username": o["owner"].get("username"), "type": o["type"]}
                        for o in dataset.get("ownership", {}).get("owners", [])
                    ]
                }
                
                self._set_cache(cache_key, metadata)
                return metadata
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting dataset metadata: {e}")
            return None
    
    async def search_by_tags(self, tags: List[str], limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search datasets by tags
        
        Args:
            tags: List of tag names
            limit: Maximum results
            
        Returns:
            List of matching datasets
        """
        return await self.search_datasets(query="*", tags=tags, limit=limit)
    
    async def get_lineage(
        self, 
        urn: str, 
        direction: str = "DOWNSTREAM",
        max_hops: int = 1
    ) -> Dict[str, Any]:
        """
        Get lineage information for a dataset
        
        Args:
            urn: Dataset URN
            direction: 'UPSTREAM' or 'DOWNSTREAM'
            max_hops: Maximum number of hops
            
        Returns:
            Lineage graph data
        """
        if not self.enabled:
            return {"entities": [], "relationships": []}
        
        cache_key = f"lineage:{urn}:{direction}:{max_hops}"
        cached = self._get_cached(cache_key)
        if cached:
            return cached
        
        try:
            # This would use DataHub's lineage API
            # Simplified example
            lineage = {
                "entity": urn,
                "direction": direction,
                "entities": [],
                "relationships": []
            }
            
            self._set_cache(cache_key, lineage)
            return lineage
            
        except Exception as e:
            logger.error(f"Error getting lineage: {e}")
            return {"entities": [], "relationships": []}
    
    async def search_by_domain(self, domain: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Search datasets by domain
        
        Args:
            domain: Domain name
            limit: Maximum results
            
        Returns:
            List of datasets in domain
        """
        return await self.search_datasets(query="*", domain=domain, limit=limit)
    
    async def health_check(self) -> bool:
        """Check if DataHub connection is healthy"""
        if not self.enabled:
            return False
        
        try:
            # Simple health check
            result = self._client.graph.execute_graphql(
                query="{ __typename }"
            )
            return result is not None
        except Exception as e:
            logger.error(f"DataHub health check failed: {e}")
            return False


# Singleton instance
@lru_cache(maxsize=1)
def get_datahub_client() -> DataHubClient:
    """Get or create DataHub client singleton"""
    return DataHubClient()
