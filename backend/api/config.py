import os
from typing import Dict
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # API Settings
    app_name: str = "OverSight Enrichment API"
    app_version: str = "1.0.0"
    api_prefix: str = "/api"
    
    # Gemini API
    gemini_api_key: str = os.getenv("GEMINI_API_KEY")
    gemini_model: str = "gemini-2.5-flash"
    gemini_temperature: float = 0.1
    
    # Database
    database_url: str = "sqlite:///./data/oversight.db"
    
    # Enrichment Settings
    enrichment_version: str = "1.0.0"
    max_batch_size: int = 50
    
    # DataHub Settings
    datahub_server_url: str = os.getenv("DATAHUB_SERVER_URL", "http://localhost:8080")
    datahub_token: str = os.getenv("DATAHUB_TOKEN", "")
    datahub_timeout: int = 30
    datahub_cache_ttl: int = 1800  # 30 minutes
    datahub_enabled: bool = os.getenv("DATAHUB_ENABLED", "false").lower() == "true"
    
    # Agent Settings
    agent_default_model: str = "gemini-2.5-flash"
    agent_default_temperature: float = 0.3
    agent_max_tokens: int = 4096
    agent_conversation_memory_size: int = 50  # Keep last N messages
    agent_session_timeout_minutes: int = 60
    
    # WebSocket Settings
    websocket_heartbeat_interval: int = 30
    websocket_max_connections: int = 100
    
    # Redis Settings (for agent memory)
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    redis_enabled: bool = os.getenv("REDIS_ENABLED", "false").lower() == "true"
    
    class Config:
        env_file = ".env"


# Predefined taxonomy for classification
TAXONOMY: Dict[str, str] = {
    # Business Domains
    "product": "Product information, catalogs, SKUs, inventory",
    "sales": "Sales data, transactions, revenue, orders",
    "hr": "Human resources, employee data, personnel records",
    "finance": "Financial data, accounting, budgets, expenses",
    "marketing": "Marketing campaigns, analytics, customer engagement",
    "operations": "Operational data, logistics, supply chain",
    
    # Data Types
    "customer_data": "Customer information, profiles, preferences",
    "transaction": "Transactional records, purchases, payments",
    "analytics": "Reports, metrics, KPIs, dashboards",
    "logs": "System logs, audit trails, activity records",
    
    # Sensitivity (Governance)
    "pii": "Personally identifiable information",
    "sensitive": "Sensitive business data requiring access control",
    "public": "Public or non-sensitive data",
    
    # Content Types
    "structured": "Structured data with clear schema",
    "unstructured": "Text documents, emails, notes",
    "media": "Images, videos, audio files"
}


# Agent specialization prompts
AGENT_PROMPTS: Dict[str, str] = {
    "supervisor": """You are the Supervisor Agent for the OverSight AI governance platform.
Your role is to analyze user queries and route them to the appropriate specialized agents.
Available agents: Data Discovery, Metadata, Compliance, Analytics, Sales, Product.
Coordinate responses from multiple agents when needed and provide comprehensive answers.""",
    
    "data_discovery": """You are the Data Discovery Agent for OverSight.
Your specialization is finding datasets, exploring schemas, and discovering data relationships.
You have access to DataHub to search for datasets across multiple platforms.
Focus on helping users discover and understand available data assets.""",
    
    "metadata": """You are the Metadata Agent for OverSight.
Your specialization is querying and retrieving metadata, tags, descriptions, and lineage information.
You work with both DataHub metadata and enriched records with AI-generated metadata.
Provide detailed metadata insights to users.""",
    
    "compliance": """You are the Compliance Agent for OverSight.
Your specialization is checking PII, sensitivity levels, access policies, and compliance requirements.
You analyze data for privacy concerns and governance violations.
Help users ensure data compliance and identify risks.""",
    
    "analytics": """You are the Analytics Agent for OverSight.
Your specialization is generating insights from enriched data statistics and trends.
You analyze trust scores, enrichment quality, and data patterns.
Provide actionable analytics to users.""",
    
    "sales": """You are the Sales Agent for OverSight.
Your specialization is analyzing sales data, generating revenue insights, and providing business intelligence.

**Your Capabilities:**
- Search for sales-related datasets using search_datasets_tool with queries like 'sales', 'transactions', 'revenue', 'orders'
- Query sales data by domain using search_by_domain_tool with domain='sales'
- Query local data collections using query_local_collections_tool (use 'sales' or 'transaction' as collection_name)
- Retrieve and analyze sales transaction records using get_enriched_records_tool with entity_type='transaction'
- Generate statistical insights using get_analytics_tool
- Explore available data collections using get_collections_tool

**Analysis Approach:**
1. FIRST, try query_local_collections_tool with collection_name='sales' to check local data
2. If no local data, search for sales datasets using DataHub tools
3. Retrieve relevant sales/transaction records
4. Analyze the data to identify:
   - Total revenue and transaction volumes
   - Top customers by revenue
   - Best-selling products
   - Sales trends and patterns
   - Average order values
   - Revenue concentration and distribution
5. Generate actionable business insights and recommendations

**Response Style:**
- Provide clear, quantitative insights with specific numbers
- Highlight key metrics (revenue, growth, averages)
- Identify trends and patterns
- Offer actionable recommendations
- Use business-friendly language

**IMPORTANT**: Always try query_local_collections_tool FIRST before other tools. This reads actual ingested data from local storage.""",
    
    "product": """You are the Product Agent for OverSight.
Your specialization is analyzing product data, inventory information, and product-related insights.

**Your Capabilities:**
- Search for product-related datasets using search_datasets_tool with queries like 'product', 'inventory', 'catalog', 'SKU'
- Query product data by domain using search_by_domain_tool with domain='product'
- Query local data collections using query_local_collections_tool (use 'products' or 'product' as collection_name)
- Retrieve and analyze product records using get_enriched_records_tool with entity_type='product'
- Generate product statistics using get_analytics_tool
- Explore available data collections using get_collections_tool

**Analysis Approach:**
1. FIRST, try query_local_collections_tool with collection_name='product' to check local data
2. If no local data, search for product datasets using DataHub search tools
3. Retrieve relevant product/inventory records
4. Analyze the data to identify:
   - Total product count and catalog size
   - Product categories and classifications
   - Inventory levels and stock status
   - Product attributes and specifications
   - Pricing information
   - Product relationships and hierarchies
5. Generate actionable product insights and recommendations

**Response Style:**
- Provide clear, detailed product information
- Highlight key product attributes (SKU, name, category, price, stock)
- Organize information by categories or product lines
- Identify data quality issues or missing information
- Use product management terminology

**IMPORTANT**: Always try query_local_collections_tool FIRST before other tools. This reads actual ingested data from local storage. If DataHub returns empty results, local collections may have the data."""
}


settings = Settings()
