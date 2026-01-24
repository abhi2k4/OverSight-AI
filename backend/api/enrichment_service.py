import json
import os
import asyncio
from typing import Dict, Any, List
from google import genai
from google.genai import types

from backend.api.config import settings, TAXONOMY
from backend.api.constants import (
    ERROR_CONFIDENCE_DEFAULT,
    FALLBACK_CONFIDENCE_DEFAULT,
    NORMAL_CONFIDENCE_DEFAULT,
    DEFAULT_TAGS
)
from backend.api.schemas import EnrichmentMetadata


class EnrichmentService:
    """Service for AI-powered data enrichment using Gemini"""
    
    def __init__(self):
        """Initialize the enrichment service with Gemini client"""
        api_key = settings.gemini_api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        self.client = genai.Client(api_key=api_key)
        self.model = settings.gemini_model
        self.temperature = settings.gemini_temperature
        self.taxonomy = TAXONOMY
        
    def _build_system_prompt(self) -> str:
        """Build the system prompt for enrichment"""
        taxonomy_list = "\n".join([f"- {tag}: {desc}" for tag, desc in self.taxonomy.items()])
        
        return f"""You are a data classification assistant for an enterprise AI governance system.
Your task is to analyze data records and generate:
1. A concise description (max 2 sentences) summarizing the record's content
2. Relevant tags from the predefined taxonomy
3. A confidence score (0-1) for your classification

Available tags:
{taxonomy_list}

Rules:
- Use ONLY tags from the provided taxonomy above
- Assign multiple tags if the record spans domains (most records will have 2-4 tags)
- Be conservative—only assign tags you're confident about
- Descriptions should be factual and concise
- Always return valid JSON in the exact format specified
- Confidence should reflect how certain you are about the classification"""
    
    def _build_user_prompt(self, source_system: str, entity_type: str, raw_data: Dict[str, Any]) -> str:
        """Build the user prompt with record data"""
        formatted_data = json.dumps(raw_data, indent=2)
        
        return f"""Analyze this record and provide enrichment metadata.

Source system: {source_system}
Entity type: {entity_type}

Record data:
{formatted_data}

Return ONLY a JSON object with this exact structure:
{{
  "description": "A concise 1-2 sentence summary",
  "tags": ["tag1", "tag2"],
  "confidence": 0.95
}}

Make sure the tags are ONLY from the available taxonomy list provided in the system prompt."""
    
    def _parse_llm_response(self, response_text: str) -> EnrichmentMetadata:
        """Parse LLM response into EnrichmentMetadata"""
        try:
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            data = json.loads(text)
            valid_tags = [tag for tag in data.get("tags", []) if tag in self.taxonomy]
            
            if not valid_tags:
                valid_tags = DEFAULT_TAGS
            
            return EnrichmentMetadata(
                description=data.get("description", "Data record"),
                tags=valid_tags,
                confidence=min(max(data.get("confidence", NORMAL_CONFIDENCE_DEFAULT), 0.0), 1.0),
                entities=data.get("entities")
            )
        except Exception as e:
            print(f"Error parsing LLM response: {e}")
            return EnrichmentMetadata(
                description="Data record requiring manual review",
                tags=DEFAULT_TAGS,
                confidence=FALLBACK_CONFIDENCE_DEFAULT
            )
    
    async def enrich_record(
        self,
        source_system: str,
        entity_type: str,
        raw_data: Dict[str, Any],
        max_retries: int = 3
    ) -> EnrichmentMetadata:
        """
        Enrich a single record using Gemini LLM with retry logic
        """
        system_prompt = self._build_system_prompt()
        user_prompt = self._build_user_prompt(source_system, entity_type, raw_data)
        
        contents = [
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=user_prompt)],
            ),
        ]
        
        generate_content_config = types.GenerateContentConfig(
            temperature=self.temperature,
            system_instruction=[types.Part.from_text(text=system_prompt)],
        )
        
        for attempt in range(max_retries):
            try:
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=contents,
                    config=generate_content_config,
                )
                
                return self._parse_llm_response(response.text)
                
            except Exception as e:
                print(f"Error calling Gemini API (attempt {attempt + 1}/{max_retries}): {e}")
                
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"Retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                else:
                    print(f"All retry attempts exhausted for {entity_type} from {source_system}")
                    return EnrichmentMetadata(
                        description=f"Error enriching {entity_type} record from {source_system}",
                        tags=DEFAULT_TAGS,
                        confidence=ERROR_CONFIDENCE_DEFAULT
                    )
    
    async def enrich_records_batch(
        self,
        records: List[Dict[str, Any]],
        parallel: bool = True,
        max_concurrent: int = 5
    ) -> List[Dict[str, Any]]:
        """Enrich multiple records with parallel processing"""
        if not parallel or len(records) == 1:
            results = []
            for record in records:
                try:
                    metadata = await self.enrich_record(
                        source_system=record["source_system"],
                        entity_type=record["entity_type"],
                        raw_data=record["raw_data"]
                    )
                    results.append({"success": True, "record": record, "metadata": metadata})
                except Exception as e:
                    results.append({"success": False, "record": record, "error": str(e)})
            return results
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def enrich_with_semaphore(record: Dict[str, Any]) -> Dict[str, Any]:
            async with semaphore:
                try:
                    metadata = await self.enrich_record(
                        source_system=record["source_system"],
                        entity_type=record["entity_type"],
                        raw_data=record["raw_data"]
                    )
                    return {"success": True, "record": record, "metadata": metadata}
                except Exception as e:
                    return {"success": False, "record": record, "error": str(e)}
        
        tasks = [enrich_with_semaphore(record) for record in records]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                processed_results.append({"success": False, "record": records[i], "error": str(result)})
            else:
                processed_results.append(result)
        
        return processed_results
