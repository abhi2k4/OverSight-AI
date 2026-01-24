# OverSight - AI & Data Governance Platform

Enterprise AI control plane providing continuous, real-time visibility and governance over how data is used by AI systems.

## Features

- **Data Ingestion**: Multi-source data ingestion (SQLite, JSON, CSV)
- **AI Enrichment**: Automatic metadata generation and classification using Gemini LLM
- **Multi-label Tagging**: Intelligent categorization (product, sales, hr, finance, etc.)
- **Collection-based Queries**: Organize data by business domains
- **Analytics Dashboard**: Comprehensive statistics and insights
- **Review Workflow**: Human-in-the-loop for low-confidence records
- **REST API**: Complete FastAPI backend with 9 endpoints

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Key

Create a `.env` file:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run Tests

```bash
# Run all tests
pytest tests/

# Run specific test
python tests/integration/test_enrichment_api.py
```

### 4. Start API Server

```bash
python scripts/start_api_server.py
```

API available at: http://localhost:8000
Docs: http://localhost:8000/docs

### 5. Run Complete Workflow

```bash
python scripts/run_ingestion_with_enrichment.py
```

## Architecture

```
backend/
├── api/              # HTTP layer (routes, schemas)
├── services/         # Business logic
├── repositories/     # Data access layer
├── ingestion/        # Data ingestion pipeline
└── core/             # Shared utilities

Clean 3-layer architecture:
API Layer → Service Layer → Repository Layer → Database
```

## API Endpoints

- `POST /api/enrich` - Enrich records with AI
- `GET /api/enriched` - Query enriched data
- `GET /api/collections` - List collections
- `GET /api/collections/{name}` - Get collection data
- `GET /api/analytics` - View statistics
- `GET /api/review` - Review queue
- `GET /api/taxonomy` - Available tags
- `GET /api/health` - Health check

## Documentation

- **Quick Start**: `docs/QUICKSTART.md`
- **Full Docs**: `docs/README_ENRICHMENT.md`
- **Implementation**: `docs/IMPLEMENTATION_COMPLETE.md`
- **Refactoring**: `REFACTORING_SUMMARY.md`

## Project Structure

```
├── backend/            # Backend API and services
├── frontend/           # React frontend
├── tests/              # Test suite
├── scripts/            # Utility scripts
├── docs/               # Documentation
├── data/               # Data files and database
└── output/             # Ingestion output
```

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy, Pydantic
- **AI**: Google Gemini LLM
- **Database**: SQLite (PostgreSQL-ready)
- **Frontend**: React, Vite, TailwindCSS
- **Testing**: Pytest

## Development

### Run Tests
```bash
pytest tests/ -v
```

### Code Quality
```bash
# Type checking
mypy backend/

# Linting
flake8 backend/
```

### Export Data
```bash
python scripts/export_enriched_output.py
```

## DataHub Integration

OverSight integrates with DataHub for enhanced data discovery and governance. DataHub provides a web UI to browse, search, and visualize your enriched metadata.

### Setup DataHub

**1. Deploy DataHub Locally**

```bash
# Install DataHub CLI (already included in requirements.txt)
pip install acryl-datahub[datahub-rest]

# Deploy DataHub using Docker (requires 4GB+ RAM)
datahub docker quickstart
```

DataHub UI will be available at: http://localhost:9002 (username: `datahub`, password: `datahub`)

**2. Initialize Tags and Domains**

Create OverSight taxonomy in DataHub:

```bash
python scripts/initialize_datahub.py
```

This creates:
- 14 tags: product, sales, hr, finance, marketing, operations, customer_data, transaction, analytics, logs, pii, sensitive, public, structured, unstructured, media
- 5 domains: Sales, HR, Finance, Operations, Product

**3. Sync Enriched Data**

Push enriched data to DataHub:

```bash
python scripts/sync_to_datahub.py
```

Or use the API:

```bash
curl -X POST http://localhost:8000/api/datahub/sync
```

### DataHub API Endpoints

- `POST /api/datahub/sync` - Sync all enriched data to DataHub
- `GET /api/datahub/status` - Check DataHub connectivity and sync statistics
- `POST /api/datahub/initialize` - Initialize tags and domains (one-time setup)

### Using DataHub UI

1. Open http://localhost:9002 and login
2. Browse → Platform: "oversight"
3. View synced datasets with:
   - AI-generated descriptions
   - Applied tags from taxonomy
   - Inferred schema from raw data
   - Custom properties (confidence scores, record counts)
   - Link to OverSight API for detailed records

### DataHub Architecture

```
OverSight Enriched Data → DataHub Sync Service → DataHub GMS → DataHub UI
                                                              → ElasticSearch (Search)
```

Each source system (sqlite_products, json_sales, csv_users) becomes a separate dataset entity in DataHub with:
- Aggregated metadata from all records
- Unique tags collected from enriched data
- Inferred schema from raw_data fields
- Custom properties linking back to OverSight API

### Configuration

DataHub settings can be configured via environment variables:

```bash
# DataHub GMS Server URL
export DATAHUB_GMS_URL=http://localhost:8080

# OverSight API URL (for links in DataHub)
export OVERSIGHT_API_URL=http://localhost:8000

# DataHub environment (PROD, DEV, etc.)
export DATAHUB_ENV=PROD
```

## License

Copyright © 2026 OverSight
