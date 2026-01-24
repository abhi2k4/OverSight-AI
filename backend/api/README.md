# OverSight Enrichment API

AI-powered data enrichment API using Gemini LLM for automatic metadata generation and multi-label classification.

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Run the API

```bash
cd backend/api
python main.py
```

Or using uvicorn directly:

```bash
uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

Interactive docs: `http://localhost:8000/docs`

## API Endpoints

### POST /api/enrich
Enrich records with AI-generated metadata

```bash
curl -X POST http://localhost:8000/api/enrich \
  -H "Content-Type: application/json" \
  -d '{
    "records": [{
      "source_system": "product_db",
      "entity_type": "product",
      "raw_data": {
        "id": 101,
        "name": "Laptop Pro 15",
        "price": 1299.99
      }
    }]
  }'
```

### GET /api/enriched
Query enriched records with filters

```bash
# Get all records
curl http://localhost:8000/api/enriched

# Filter by tags
curl http://localhost:8000/api/enriched?tags=product,sales

# Paginate
curl http://localhost:8000/api/enriched?limit=10&offset=0
```

### GET /api/collections
List available collections (tag groupings)

```bash
curl http://localhost:8000/api/collections
```

### GET /api/collections/{name}
Get records for a specific collection

```bash
curl http://localhost:8000/api/collections/sales
```

### GET /api/taxonomy
Get the complete tag taxonomy

```bash
curl http://localhost:8000/api/taxonomy
```

## Architecture

- **FastAPI**: Async web framework
- **Gemini LLM**: AI enrichment engine
- **SQLite**: Data persistence
- **Pydantic**: Request/response validation
- **SQLAlchemy**: ORM for database operations

## Configuration

Edit `backend/api/config.py` to customize:
- Gemini model selection
- Temperature settings
- Taxonomy definitions
- Database URL
- Batch size limits
