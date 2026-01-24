# DataHub Integration Guide

Complete guide for integrating OverSight with DataHub for data discovery and governance.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Initialization](#initialization)
6. [Syncing Data](#syncing-data)
7. [Using DataHub UI](#using-datahub-ui)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

## Overview

DataHub integration enables:
- **Data Discovery**: Browse and search enriched metadata in a web UI
- **Governance**: Tag-based classification and organization
- **Lineage**: Track data from source to enrichment
- **Quality**: View AI confidence scores and data quality metrics
- **Collaboration**: Share datasets across teams with domains

### Architecture

```
┌─────────────────┐
│  Data Sources   │ (SQLite, JSON, CSV)
└────────┬────────┘
         │ Ingestion
         ▼
┌─────────────────┐
│   Enrichment    │ (AI with Gemini)
└────────┬────────┘
         │ Store
         ▼
┌─────────────────┐
│ SQLite Database │ (enriched_records)
└────────┬────────┘
         │ Sync
         ▼
┌─────────────────┐
│  DataHub GMS    │ (Metadata Service)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  DataHub UI     │ (Web Interface)
└─────────────────┘
```

## Prerequisites

- Docker with 4GB+ RAM available
- Python 3.9+
- OverSight with enriched data (run `python run_ingestion_with_enrichment.py`)

## Installation

### 1. Install DataHub SDK

Already included in requirements.txt:

```bash
pip install -r requirements.txt
```

### 2. Deploy DataHub

Deploy using Docker Compose:

```bash
datahub docker quickstart
```

This deploys 14 containers including:
- MySQL (metadata storage)
- ElasticSearch (search index)
- Kafka (event streaming)
- DataHub GMS (metadata service on port 8080)
- DataHub Frontend (UI on port 9002)

**Verify deployment:**

```bash
# Check containers are running
docker ps

# Test GMS API
curl http://localhost:8080/health

# Access UI
open http://localhost:9002
```

**Default credentials:**
- Username: `datahub`
- Password: `datahub`

## Configuration

### Environment Variables

Create or update `.env` file:

```bash
# DataHub Configuration
DATAHUB_GMS_URL=http://localhost:8080
DATAHUB_ENV=PROD
OVERSIGHT_API_URL=http://localhost:8000

# Optional: DataHub authentication token
# DATAHUB_GMS_TOKEN=your_token_here
```

### DataHub Settings

All settings are in `backend/datahub/config.py`:

- **Platform Name**: `oversight` (how datasets are identified in DataHub)
- **Batch Size**: 50 (number of records to sync at once)
- **Retry Settings**: 3 attempts with exponential backoff
- **Confidence Threshold**: 0.7 (for low confidence warnings)

## Initialization

### Step 1: Initialize Tags and Domains

Run the initialization script:

```bash
python scripts/initialize_datahub.py
```

This creates:

**14 Tags:**
| Tag | Description | Color |
|-----|-------------|-------|
| product | Product catalog and inventory data | Blue |
| sales | Sales transactions and revenue data | Green |
| hr | Human resources and employee data | Purple |
| finance | Financial records and accounting data | Orange |
| marketing | Marketing campaigns and analytics | Pink |
| operations | Operational metrics and logs | Blue Grey |
| customer_data | Customer information and profiles | Cyan |
| transaction | Transaction records and payment data | Light Green |
| analytics | Analytics and business intelligence data | Indigo |
| logs | System and application logs | Brown |
| pii | Personally Identifiable Information | Red |
| sensitive | Sensitive business data | Deep Orange |
| public | Public data suitable for general access | Green |
| structured | Structured data with defined schema | Teal |
| unstructured | Unstructured data without fixed schema | Grey |
| media | Media files and binary data | Deep Purple |

**5 Domains:**
- **Sales**: Sales transactions, revenue, customer data
- **HR**: Employee data, hiring, HR management
- **Finance**: Financial records, accounting, analytics
- **Operations**: Operational metrics, logs, system data
- **Product**: Product catalogs, inventory, structured data

**Verify in DataHub UI:**
1. Login to http://localhost:9002
2. Go to "Govern" → "Tags" to see all tags
3. Go to "Govern" → "Domains" to see all domains

## Syncing Data

### Full Sync via Script

```bash
python scripts/sync_to_datahub.py
```

**Output:**
```
======================================================================
DataHub Sync - OverSight Enriched Data
======================================================================

DataHub GMS Server: http://localhost:8080
OverSight API: http://localhost:8000

Testing DataHub connection...
✅ Connected to DataHub GMS

Analyzing data to sync...
Total records: 32
Total sources: 3

Sources to sync:
  - sqlite_products.db: 12 records
  - json_sales.json: 15 records
  - csv_users.csv: 5 records

Starting sync...
----------------------------------------------------------------------

======================================================================
Sync Complete
======================================================================
Status: SUCCESS
Sources synced: 3/3
Total records: 32

Per-source results:
  ✅ sqlite_products.db: 3/3 MCPs emitted
  ✅ json_sales.json: 3/3 MCPs emitted
  ✅ csv_users.csv: 3/3 MCPs emitted
```

### Full Sync via API

```bash
# Trigger sync
curl -X POST http://localhost:8000/api/datahub/sync

# Check status
curl http://localhost:8000/api/datahub/status
```

### What Gets Synced

For each source system, DataHub receives:

1. **Dataset Properties Aspect**
   - Description: AI-generated summary of the source
   - Custom Properties:
     - `source_system`: Source identifier
     - `total_records`: Number of enriched records
     - `avg_confidence`: Average AI confidence score
     - `low_confidence_count`: Records below 0.7 confidence
     - `enrichment_version`: Version tracking
     - `entity_types`: Types of data in the source
     - `data_source_type`: sqlite, json, or csv
     - `oversight_api`: Link to OverSight API for details
     - `last_enrichment`: Latest enrichment timestamp

2. **Global Tags Aspect**
   - All unique tags from enriched records
   - Tags are clickable and searchable in DataHub

3. **Schema Metadata Aspect**
   - Inferred from raw_data JSON fields
   - Field names, types, and presence percentages
   - Descriptions for common fields

## Using DataHub UI

### Discovery Workflow

**1. Browse by Platform**
- Navigate to "Browse"
- Select Platform: "oversight"
- See all synced datasets grouped by source

**2. Search**
- Use global search bar
- Search by:
  - Dataset name (e.g., "products", "sales")
  - Description keywords (e.g., "enriched", "AI-generated")
  - Tags (e.g., "pii", "finance")
  - Custom properties (e.g., "confidence")

**3. View Dataset Details**

Click on any dataset to see:

**Properties Tab:**
- Description with record counts and confidence
- Custom properties with all metadata
- Link to OverSight API for detailed view

**Schema Tab:**
- Inferred fields from raw_data
- Data types and presence percentages
- Field descriptions

**Tags Tab:**
- All applied tags with color coding
- Click tags to find related datasets

**Documentation Tab:**
- Links to OverSight API endpoints
- Filtered views by source system

**4. Filter and Organize**
- Filter by domain (Sales, HR, Finance, etc.)
- Filter by tags
- Sort by last enrichment timestamp
- View confidence distributions

### Example Search Queries

```
# Find all PII data
tag:pii

# Find sales-related datasets
tag:sales OR sales

# Find high-confidence enriched data
platform:oversight AND confidence

# Find structured product data
tag:product AND tag:structured
```

## API Reference

### POST /api/datahub/sync

Sync all enriched records to DataHub.

**Request:**
```bash
curl -X POST http://localhost:8000/api/datahub/sync
```

**Response:**
```json
{
  "status": "success",
  "synced_sources": 3,
  "total_records": 32,
  "sources": {
    "sqlite_products.db": {
      "success": true,
      "records_count": 12,
      "mcps_created": 3,
      "mcps_emitted": 3
    }
  },
  "errors": [],
  "datahub_url": "http://localhost:9002",
  "message": "Synced 3 source(s) to DataHub"
}
```

### GET /api/datahub/status

Check DataHub connectivity and get sync statistics.

**Request:**
```bash
curl http://localhost:8000/api/datahub/status
```

**Response:**
```json
{
  "connected": true,
  "gms_url": "http://localhost:8080",
  "platform_name": "oversight",
  "total_records": 32,
  "total_sources": 3,
  "sources": {
    "sqlite_products.db": 12,
    "json_sales.json": 15,
    "csv_users.csv": 5
  },
  "datahub_ui": "http://localhost:9002",
  "message": "DataHub is connected"
}
```

### POST /api/datahub/initialize

Initialize DataHub with tags and domains (one-time setup).

**Request:**
```bash
curl -X POST http://localhost:8000/api/datahub/initialize
```

**Response:**
```json
{
  "status": "success",
  "tags_created": 14,
  "tags_failed": 0,
  "domains_created": 5,
  "domains_failed": 0,
  "errors": [],
  "message": "Created 14 tags and 5 domains in DataHub"
}
```

## Troubleshooting

### DataHub Not Connecting

**Error:** `Cannot connect to DataHub GMS at http://localhost:8080`

**Solutions:**
1. Check DataHub is running: `docker ps | grep datahub`
2. Restart DataHub: `datahub docker quickstart`
3. Check GMS health: `curl http://localhost:8080/health`
4. Verify `.env` has correct `DATAHUB_GMS_URL`

### Sync Fails with Permission Error

**Error:** `403 Forbidden` or authentication error

**Solutions:**
1. Check if DataHub requires authentication
2. Set `DATAHUB_GMS_TOKEN` in `.env` if needed
3. Verify token has write permissions

### Tags/Domains Not Appearing

**Issue:** Initialized tags don't show in UI

**Solutions:**
1. Wait 1-2 minutes for indexing
2. Refresh DataHub UI (clear cache)
3. Re-run initialization: `python scripts/initialize_datahub.py`
4. Check for errors in initialization output

### Datasets Not Showing After Sync

**Issue:** Sync succeeds but datasets don't appear

**Solutions:**
1. Wait 2-3 minutes for ElasticSearch indexing
2. Check sync results for errors
3. Verify in GMS directly: `curl http://localhost:8080/entities?action=search`
4. Restart DataHub frontend container

### Docker Memory Issues

**Error:** `Total Docker memory configured is below minimum threshold`

**Solutions:**
1. Increase Docker memory to 4GB+ in Docker Desktop settings
2. Use Docker Compose with custom memory limits
3. Deploy on cloud VM with sufficient resources

### Low Confidence Warnings

**Issue:** Many records with low confidence scores

**Solutions:**
1. Review AI enrichment prompts
2. Improve data quality before enrichment
3. Adjust confidence threshold in config
4. Use review queue: `GET /api/review`

## Advanced Usage

### Incremental Sync

For future enhancement, track last sync timestamp:

```python
# In sync_service.py
last_sync = get_last_sync_timestamp()
new_records = repository.get_all(enrichment_timestamp__gt=last_sync)
sync_source(new_records)
```

### Custom Domains

Add more domains by editing `backend/datahub/domain_initializer.py`:

```python
OVERSIGHT_DOMAINS = {
    "engineering": {
        "name": "Engineering",
        "description": "Engineering data, code, and infrastructure"
    }
}
```

### Lineage Tracking

Add lineage to show data flow:

```python
# In mapper.py, add UpstreamLineageClass
lineage = UpstreamLineageClass(
    upstreams=[
        UpstreamClass(
            dataset=source_file_urn,
            type=DatasetLineageTypeClass.TRANSFORMED
        )
    ]
)
```

## Best Practices

1. **Initialize Once**: Run `initialize_datahub.py` only once per DataHub instance
2. **Regular Syncs**: Sync after each enrichment batch for fresh data
3. **Monitor Errors**: Check sync results for failed MCPs
4. **Tag Consistency**: Use taxonomy tags consistently across enrichment
5. **Confidence Thresholds**: Review low-confidence records before syncing
6. **Backup DataHub**: Use `datahub docker quickstart --backup` before upgrades

## Resources

- **DataHub Docs**: https://datahubproject.io/docs
- **OverSight API**: http://localhost:8000/docs
- **DataHub UI**: http://localhost:9002
- **DataHub GitHub**: https://github.com/datahub-project/datahub

## Support

For issues with:
- **OverSight integration**: Check this guide and backend logs
- **DataHub deployment**: See DataHub quickstart docs
- **Sync failures**: Review sync service logs and API responses
