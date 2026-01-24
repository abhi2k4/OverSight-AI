# DataHub Integration - Quick Start

Get your enriched data into DataHub in 3 simple steps!

## Prerequisites

✅ Python 3.9+ installed  
✅ Docker with 4GB+ RAM available  
✅ Enriched data in OverSight database

## Step 1: Deploy DataHub (5 minutes)

```bash
# Install DataHub CLI (already in requirements.txt)
pip install -r requirements.txt

# Deploy DataHub using Docker
datahub docker quickstart
```

**Access DataHub UI:**
- URL: http://localhost:9002
- Username: `datahub`
- Password: `datahub`

**Note:** If you get a memory error, increase Docker memory to 4GB+ in Docker Desktop settings.

## Step 2: Initialize Tags & Domains (30 seconds)

```bash
python scripts/initialize_datahub.py
```

This creates:
- **14 tags**: product, sales, hr, finance, pii, sensitive, etc.
- **5 domains**: Sales, HR, Finance, Operations, Product

## Step 3: Sync Your Data (1 minute)

```bash
python scripts/sync_to_datahub.py
```

Or use the API:

```bash
curl -X POST http://localhost:8000/api/datahub/sync
```

## Verify in DataHub UI

1. Open http://localhost:9002
2. Click "Browse" → Select Platform: "oversight"
3. See your datasets with:
   - ✅ AI-generated descriptions
   - ✅ Tags from taxonomy
   - ✅ Inferred schemas
   - ✅ Confidence scores
   - ✅ Links to OverSight API

## API Endpoints

### Check Status
```bash
curl http://localhost:8000/api/datahub/status
```

### Sync Data
```bash
curl -X POST http://localhost:8000/api/datahub/sync
```

### Initialize (if not done)
```bash
curl -X POST http://localhost:8000/api/datahub/initialize
```

## What Gets Synced?

For each data source, DataHub receives:

**Dataset Properties:**
- Description with AI summary
- Record count and confidence scores
- Source type (SQLite, JSON, CSV)
- Link to OverSight API

**Tags:**
- All unique tags from enriched records
- Searchable and filterable

**Schema:**
- Inferred fields from raw data
- Data types and presence percentages

## Complete Workflow

```bash
# 1. Ingest and enrich data
python run_ingestion_with_enrichment.py

# 2. Check enriched data
curl http://localhost:8000/api/enriched

# 3. Sync to DataHub
python scripts/sync_to_datahub.py

# 4. Browse in DataHub UI
open http://localhost:9002
```

## Troubleshooting

**DataHub won't start:**
- Increase Docker memory to 4GB+
- Check Docker is running: `docker ps`

**Sync fails:**
- Verify DataHub is running: `curl http://localhost:8080/health`
- Check enriched data exists: `curl http://localhost:8000/api/enriched`

**Datasets not showing:**
- Wait 2-3 minutes for indexing
- Refresh browser cache
- Check sync results for errors

## Need More Help?

- **Complete Guide**: See `DATAHUB_GUIDE.md`
- **Implementation Details**: See `DATAHUB_IMPLEMENTATION_SUMMARY.md`
- **API Docs**: http://localhost:8000/docs
- **DataHub Docs**: https://datahubproject.io/docs

## Architecture Diagram

```
┌─────────────┐
│   Sources   │ (SQLite, JSON, CSV)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Enrichment  │ (AI with Gemini)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   SQLite    │ (enriched_records)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ DataHub GMS │ (:8080)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ DataHub UI  │ (:9002) ← You are here!
└─────────────┘
```

## Next Steps

1. ✅ Deploy DataHub
2. ✅ Initialize tags and domains
3. ✅ Sync enriched data
4. 🎯 Browse datasets in DataHub UI
5. 🎯 Search by tags and descriptions
6. 🎯 View confidence scores and metadata
7. 🎯 Link back to OverSight for details

**Happy discovering! 🚀**
