# Metadata Manager - Implementation Guide

## Overview
The Metadata Manager is a new frontend panel that allows you to configure data sources, ingest data, enrich it with AI, and push enriched metadata to DataHub - similar to the ingestion pipeline workflow.

## Features

### 1. **Data Source Configuration**
- Add and manage multiple data sources (CSV, JSON, SQLite)
- Configure file paths and entity types
- Store configurations in localStorage for persistence

### 2. **Ingestion & Enrichment Workflow**
- **Ingest**: Pull data from configured sources
- **Enrich**: Use AI agents to add metadata, tags, descriptions
- **Push**: Sync enriched metadata to DataHub

### 3. **Real-time Monitoring**
- Track ingestion and enrichment statistics
- View processing status for each source
- Monitor records ingested and enriched

### 4. **Statistics Dashboard**
- Total sources configured
- Active sources (synced)
- Total records ingested
- Total records enriched

### 5. **Search & Filtering**
- Search sources by name or type
- Filter by source type (CSV, JSON, SQLite)
- Filter by status (Configured, Synced, Processing, Error)

## User Interface

### Navigation
- Located in the left sidebar as "Metadata Manager"
- Icon: Database file icon
- Route: `/metadata`

### Main Components

#### Stats Cards
- **Total Sources**: Number of configured data sources
- **Active Sources**: Sources that have been successfully synced
- **Records Ingested**: Total records pulled from all sources
- **Records Enriched**: Total records enriched with AI metadata

#### Sources Table
Displays all configured sources with:
- Source name and type
- Configuration details (file path, entity type)
- Status badge (Configured, Synced, Processing, Error)
- Records ingested and enriched counts
- Last sync timestamp
- Action buttons (Process, Delete)

#### Action Buttons
- **Process All**: Run ingestion + enrichment for all sources
- **Add Source**: Open dialog to configure a new data source
- **Process** (per source): Run workflow for individual source
- **Delete** (per source): Remove source configuration

## Workflow

### Adding a New Source
1. Click "Add Source" button
2. Fill in the form:
   - **Source Name**: Friendly name (e.g., "Customer Database")
   - **Source Type**: Select CSV, JSON, or SQLite
   - **File Path**: Path to the data file (e.g., "data/customers.csv")
   - **Entity Type**: Optional entity classification (e.g., "customer", "product")
3. Click "Add Source"
4. Source appears in the table with "Configured" status

### Processing a Source
1. Click "Process" button on a source row
2. System performs three steps:
   - **Step 1**: Ingest data from the source
   - **Step 2**: Enrich records with AI metadata
   - **Step 3**: Push enriched metadata to DataHub
3. Status updates to "Synced" on success
4. Processing stats displayed below the table

### Processing All Sources
1. Click "Process All" button in the header
2. System processes each source sequentially
3. All sources update to "Synced" status

## API Integration

### Backend Endpoints (To Be Implemented)

#### 1. Ingestion API
```
POST /api/ingestion/run
Body: {
  "sources": [
    {
      "type": "csv",
      "config": {
        "file_path": "data/users.csv",
        "entity_type": "system_user"
      }
    }
  ]
}
Response: {
  "total_records": 100,
  "status": "success"
}
```

#### 2. Enrichment API
```
POST /api/enrichment/process
Body: {
  "output_dir": "output",
  "batch_size": 10
}
Response: {
  "enriched": 95,
  "failed": 5,
  "skipped": 0
}
```

#### 3. DataHub Sync API (Placeholder)
```
POST /api/datahub/sync
Body: {
  "source_system": "products_db",
  "entity_type": "product"
}
Response: {
  "synced": true,
  "entities_pushed": 100
}
```

## Default Sources

The system comes pre-configured with three example sources:

1. **Products Database**
   - Type: SQLite
   - Path: `data/products.db`

2. **Sales Transactions**
   - Type: JSON
   - Path: `data/sales.json`
   - Entity: `sales_transaction`

3. **User Records**
   - Type: CSV
   - Path: `data/users.csv`
   - Entity: `system_user`

## Data Persistence

- Source configurations are stored in browser localStorage
- Key: `metadata_sources`
- Persists across browser sessions
- Can be cleared by removing localStorage data

## Status States

- **Configured**: Source added but not yet processed
- **Synced**: Successfully ingested, enriched, and pushed to DataHub
- **Processing**: Currently running the workflow
- **Error**: Failed during ingestion, enrichment, or sync

## Next Steps

### Backend Implementation Required

1. **Create Ingestion API Endpoint**
   - File: `backend/api/ingestion_routes.py`
   - Endpoint: `POST /api/ingestion/run`
   - Use existing `IngestionPipeline` class

2. **Create Enrichment API Endpoint**
   - File: `backend/api/enrichment_routes.py`
   - Endpoint: `POST /api/enrichment/process`
   - Use existing `EnrichmentBridge` class

3. **Create DataHub Sync API Endpoint**
   - File: `backend/api/datahub_routes.py`
   - Endpoint: `POST /api/datahub/sync`
   - Use existing DataHub integration

4. **Register Routes in Main API**
   - Update `backend/api/main.py`
   - Add new routers for ingestion, enrichment, and datahub

### Future Enhancements

1. **Real-time Progress Updates**
   - WebSocket connection for live progress
   - Progress bars for each processing step

2. **Scheduling**
   - Cron-like scheduling for automatic processing
   - Recurring sync intervals

3. **Advanced Source Types**
   - PostgreSQL, MySQL databases
   - REST APIs
   - Cloud storage (S3, Azure Blob)

4. **Validation**
   - Test connection before saving
   - Validate file paths exist
   - Schema validation

5. **Error Handling**
   - Detailed error messages
   - Retry mechanisms
   - Error logs and debugging

6. **DataHub Integration**
   - View synced entities in DataHub
   - Link to DataHub UI
   - Sync status verification

## Files Modified

1. **Created**: `frontend/src/pages/MetadataManager.jsx` - Main page component
2. **Modified**: `frontend/src/App.jsx` - Added route
3. **Modified**: `frontend/src/components/Sidebar.jsx` - Added navigation item

## Testing

To test the Metadata Manager:

1. Start the frontend: `npm run dev` (in frontend directory)
2. Navigate to http://localhost:5173/metadata
3. View pre-configured sources
4. Add a new source using the "Add Source" button
5. Click "Process" on a source (will show API errors until backend is implemented)

## Notes

- The UI is fully functional and ready to use
- Backend API endpoints need to be implemented for full functionality
- Currently shows toast notifications for all actions
- Processing will fail gracefully until backend APIs are available
- All data is stored locally in the browser
