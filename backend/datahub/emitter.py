"""
DataHub emitter for sending metadata to DataHub GMS.
"""

import logging
import time
from typing import List, Optional

from datahub.emitter.mcp import MetadataChangeProposalWrapper
from datahub.emitter.rest_emitter import DatahubRestEmitter

from .config import DataHubConfig

logger = logging.getLogger(__name__)


class DataHubEmitter:
    """
    Wrapper around DataHub REST emitter with connection management and error handling.
    """
    
    def __init__(self, config: Optional[DataHubConfig] = None):
        """
        Initialize DataHub emitter.
        
        Args:
            config: DataHub configuration (uses defaults if None)
        """
        self.config = config or DataHubConfig()
        self._emitter: Optional[DatahubRestEmitter] = None
        
    def _get_emitter(self) -> DatahubRestEmitter:
        """Get or create REST emitter instance"""
        if self._emitter is None:
            self._emitter = DatahubRestEmitter(
                gms_server=self.config.GMS_SERVER,
                token=self.config.GMS_TOKEN,
                timeout_sec=self.config.CONNECTION_TIMEOUT,
            )
        return self._emitter
    
    def test_connection(self) -> bool:
        """
        Test connection to DataHub GMS.
        
        Returns:
            True if connection successful, False otherwise
        """
        try:
            emitter = self._get_emitter()
            emitter.test_connection()
            logger.info(f"Successfully connected to DataHub GMS at {self.config.GMS_SERVER}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to DataHub GMS: {e}")
            return False
    
    def emit_mcp(self, mcp: MetadataChangeProposalWrapper) -> bool:
        """
        Emit a single MetadataChangeProposal to DataHub.
        
        Args:
            mcp: Metadata change proposal to emit
            
        Returns:
            True if emission successful, False otherwise
        """
        try:
            emitter = self._get_emitter()
            emitter.emit(mcp)
            logger.debug(f"Successfully emitted MCP for entity: {mcp.entityUrn}")
            return True
        except Exception as e:
            logger.error(f"Failed to emit MCP for {mcp.entityUrn}: {e}")
            return False
    
    def emit_batch(self, mcps: List[MetadataChangeProposalWrapper]) -> dict:
        """
        Emit a batch of MetadataChangeProposals to DataHub with retry logic.
        
        Args:
            mcps: List of metadata change proposals to emit
            
        Returns:
            Dictionary with success count, failure count, and errors
        """
        results = {
            "success": 0,
            "failed": 0,
            "errors": []
        }
        
        for mcp in mcps:
            retry_count = 0
            success = False
            
            while retry_count <= self.config.MAX_RETRIES and not success:
                try:
                    if self.emit_mcp(mcp):
                        results["success"] += 1
                        success = True
                    else:
                        retry_count += 1
                        if retry_count <= self.config.MAX_RETRIES:
                            wait_time = self.config.RETRY_BACKOFF ** retry_count
                            logger.warning(f"Retrying MCP emission in {wait_time}s (attempt {retry_count}/{self.config.MAX_RETRIES})")
                            time.sleep(wait_time)
                except Exception as e:
                    retry_count += 1
                    if retry_count <= self.config.MAX_RETRIES:
                        wait_time = self.config.RETRY_BACKOFF ** retry_count
                        logger.warning(f"Error emitting MCP, retrying in {wait_time}s: {e}")
                        time.sleep(wait_time)
                    else:
                        logger.error(f"Failed to emit MCP after {self.config.MAX_RETRIES} retries: {e}")
                        results["failed"] += 1
                        results["errors"].append({
                            "entity_urn": str(mcp.entityUrn),
                            "error": str(e)
                        })
        
        logger.info(f"Batch emission complete: {results['success']} succeeded, {results['failed']} failed")
        return results
    
    def close(self):
        """Close the emitter connection"""
        if self._emitter:
            # DataHub REST emitter doesn't need explicit closing
            self._emitter = None
            logger.debug("DataHub emitter closed")
