import os
from typing import Dict
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings and configuration"""
    
    # API Settings
    app_name: str = "OverSight Enrichment API"
    app_version: str = "1.0.0"
    api_prefix: str = "/api"
    
    # Gemini API
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    gemini_model: str = "gemini-2.0-flash-exp"
    gemini_temperature: float = 0.1
    
    # Database
    database_url: str = "sqlite:///./data/oversight.db"
    
    # Enrichment Settings
    enrichment_version: str = "1.0.0"
    max_batch_size: int = 50
    
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


settings = Settings()
