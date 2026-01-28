---
sidebar_position: 3
title: DataHub Integration Guide
---

# DataHub Integration Guide

This guide covers the installation and configuration of DataHub as part of your Oversight platform.

## Overview

DataHub is a modern data catalog that helps you discover, understand, and govern your data. As part of Oversight, it provides the metadata layer that connects all your data sources.

## Installation

### Prerequisites

- Python 3.8 or later
- Docker and Docker Compose
- At least 8GB RAM
- 10GB free disk space

### Quick Start Installation

The easiest way to get started with DataHub is using the CLI:

```bash
# Install Python dependencies
python3 -m pip install --upgrade pip wheel setuptools

# Install DataHub CLI
python3 -m pip install --upgrade acryl-datahub

# Quick start with Docker
datahub docker quickstart
```

This command will:
1. Pull all required Docker images
2. Start DataHub services (GMS, Frontend, Elasticsearch, PostgreSQL, Kafka)
3. Initialize the database
4. Load sample metadata

### Access DataHub

Once installation completes, access DataHub at: `http://localhost:9002`

**Default credentials:**
- Username: `datahub`
- Password: `datahub`

## Architecture

DataHub consists of several components:

- **DataHub Frontend**: React-based web UI
- **DataHub GMS (Graph Metadata Service)**: Core metadata API
- **Elasticsearch**: Search and indexing
- **PostgreSQL**: Primary metadata store
- **Kafka**: Event streaming
- **Schema Registry**: Avro schema management

## Configuration

### Basic Configuration

DataHub configuration is managed through environment variables and configuration files.

#### Environment Variables

Create a `.datahub/datahub.properties` file:

```properties
# DataHub host
datahub.host=localhost:9002

# Authentication
auth.enabled=true
auth.type=oidc

# Search
elasticsearch.host=elasticsearch:9200

# Database
db.host=postgres:5432
db.name=datahub
```

### Authentication Integration

#### Keycloak Integration

Configure DataHub to use Keycloak for SSO:

```yaml
# datahub-gms/env.properties
auth.oidc.enabled=true
auth.oidc.clientId=oversight-app
auth.oidc.clientSecret=your-keycloak-secret
auth.oidc.discoveryUri=http://localhost:8080/realms/oversight/.well-known/openid-configuration
auth.oidc.userNameClaim=preferred_username
auth.oidc.userNameClaimRegex=.*
```

Restart DataHub services:

```bash
datahub docker restart
```

## Data Ingestion

DataHub supports ingestion from 50+ data sources.

### UI-Based Ingestion

1. Navigate to **Ingestion** → **Sources**
2. Click **Create new source**
3. Select your data source type
4. Configure connection details
5. Test connection
6. Set ingestion schedule
7. Click **Save & Run**

### CLI-Based Ingestion

#### Install Source Connector

```bash
# Example: Install MySQL connector
pip install 'acryl-datahub[mysql]'

# Example: Install Snowflake connector
pip install 'acryl-datahub[snowflake]'
```

#### Create Recipe File

Create a `recipe.yml` file:

```yaml
# MySQL example
source:
  type: mysql
  config:
    host_port: localhost:3306
    database: mydb
    username: ${MYSQL_USER}
    password: ${MYSQL_PASSWORD}
    
sink:
  type: datahub-rest
  config:
    server: http://localhost:8080
    token: ${DATAHUB_TOKEN}
```

#### Run Ingestion

```bash
datahub ingest -c recipe.yml
```

### Supported Data Sources

#### Databases
- MySQL, PostgreSQL, Oracle, SQL Server
- MongoDB, Cassandra, DynamoDB
- MariaDB, Teradata, Vertica

#### Data Warehouses
- Snowflake
- BigQuery
- Redshift
- Azure Synapse
- Databricks

#### Data Lakes
- S3
- Azure Data Lake Storage (ADLS)
- Google Cloud Storage (GCS)
- HDFS

#### BI & Visualization
- Tableau
- Looker
- PowerBI
- Superset
- Metabase

#### Data Processing
- Apache Spark
- Apache Airflow
- dbt
- Apache Flink
- Kafka

#### ML Platforms
- SageMaker
- MLflow
- Kubeflow

## Common Ingestion Examples

### Snowflake Ingestion

```yaml
source:
  type: snowflake
  config:
    account_id: abc123.us-east-1
    warehouse: COMPUTE_WH
    username: ${SNOWFLAKE_USER}
    password: ${SNOWFLAKE_PASSWORD}
    role: DATAHUB_ROLE
    database_pattern:
      allow:
        - "PROD_.*"
    schema_pattern:
      deny:
        - ".*_TEMP"
```

### PostgreSQL Ingestion

```yaml
source:
  type: postgres
  config:
    host_port: localhost:5432
    database: production
    username: ${POSTGRES_USER}
    password: ${POSTGRES_PASSWORD}
    include_tables: true
    include_views: true
    profiling:
      enabled: true
```

### S3 Data Lake Ingestion

```yaml
source:
  type: s3
  config:
    aws_access_key_id: ${AWS_ACCESS_KEY}
    aws_secret_access_key: ${AWS_SECRET_KEY}
    aws_region: us-east-1
    path_specs:
      - include: s3://my-bucket/data/**/*.parquet
        table_name: my_dataset
```

### dbt Integration

```yaml
source:
  type: dbt
  config:
    manifest_path: /path/to/target/manifest.json
    catalog_path: /path/to/target/catalog.json
    sources_path: /path/to/target/sources.json
    target_platform: snowflake
```

## Features & Usage

### Data Discovery

Use the search bar to find:
- Datasets
- Dashboards
- Data pipelines
- ML models
- Users

**Search syntax:**
- `name:customer*` - Find by name
- `platform:snowflake` - Filter by platform
- `tag:pii` - Filter by tag
- `owner:john.doe` - Filter by owner

### Data Lineage

View how data flows through your organization:

1. Navigate to a dataset
2. Click on **Lineage** tab
3. View upstream and downstream dependencies
4. Click on nodes to explore related assets

### Glossary Terms

Create business glossary:

1. Navigate to **Govern** → **Glossary**
2. Click **Create Term**
3. Define:
   - Term name
   - Definition
   - Related terms
   - Owners
4. Link to datasets

### Domains

Organize data by business domains:

1. Navigate to **Govern** → **Domains**
2. Click **Create Domain**
3. Set domain name (e.g., "Marketing", "Finance")
4. Assign datasets to domains
5. Set domain owners

### Tags

Add metadata tags:

1. Navigate to dataset
2. Click **Add Tags**
3. Create or select tags (e.g., "PII", "Critical")
4. Tags appear in search and can trigger policies

### Data Quality

Monitor data quality:

1. Navigate to **Govern** → **Quality**
2. Create assertions:
   - Freshness checks
   - Volume checks
   - Schema validation
   - Custom SQL checks
3. Set up alerts

### Data Contracts

Define data expectations:

```yaml
# Example data contract
dataset: urn:li:dataset:(urn:li:dataPlatform:snowflake,prod.sales.orders,PROD)
contract:
  freshness:
    maxAge: 24h
  schema:
    fields:
      - name: order_id
        type: integer
        nullable: false
      - name: customer_id
        type: integer
        nullable: false
  quality:
    - type: sql
      statement: "SELECT COUNT(*) FROM orders WHERE amount < 0"
      operator: EQUALS
      value: 0
```

## GraphQL API

DataHub provides a powerful GraphQL API:

```graphql
# Query datasets
query {
  search(
    input: {
      type: DATASET
      query: "customers"
      start: 0
      count: 10
    }
  ) {
    start
    count
    total
    searchResults {
      entity {
        urn
        type
        ... on Dataset {
          name
          description
          platform {
            name
          }
        }
      }
    }
  }
}
```

Access GraphiQL interface at: `http://localhost:9002/api/graphiql`

## Python SDK

Programmatic access with Python:

```python
from datahub.emitter.mce_builder import make_dataset_urn
from datahub.emitter.rest_emitter import DatahubRestEmitter
from datahub.metadata.schema_classes import DatasetPropertiesClass

# Create emitter
emitter = DatahubRestEmitter("http://localhost:8080")

# Create dataset URN
dataset_urn = make_dataset_urn(
    platform="snowflake",
    name="prod.sales.orders"
)

# Update dataset properties
properties = DatasetPropertiesClass(
    description="Customer orders table",
    customProperties={
        "owner": "sales-team",
        "criticality": "high"
    }
)

# Emit metadata
emitter.emit_mcp(
    MetadataChangeProposalWrapper(
        entityUrn=dataset_urn,
        aspect=properties
    )
)
```

## Integration with Oversight

### With MinIO

Store large metadata artifacts in MinIO:

```yaml
# Configure DataHub to use MinIO
storage:
  type: s3
  s3:
    endpoint: http://localhost:9090
    accessKey: minio
    secretKey: miniosecret
    bucket: datahub-artifacts
```

### With Langfuse

Cross-reference ML models:
- Track which datasets are used by LLM applications
- Link Langfuse traces to DataHub datasets
- Understand data lineage for AI models

### With Keycloak

Already covered in Authentication Integration section above.

## Monitoring

### Health Check

```bash
curl http://localhost:8080/health
```

### Metrics

DataHub exposes metrics at: `http://localhost:8080/metrics`

### Logs

View logs:

```bash
docker logs datahub-gms-1
docker logs datahub-frontend-react-1
```

## Troubleshooting

### Issue: Ingestion Fails

**Solution:**
1. Check source connectivity
2. Verify credentials
3. Review ingestion logs: `datahub ingest -c recipe.yml --debug`

### Issue: Search Not Working

**Solution:**
1. Check Elasticsearch health
2. Reindex: `datahub index rebuild`

### Issue: Lineage Not Showing

**Solution:**
1. Ensure upstream ingestion includes lineage
2. Check if lineage data was ingested
3. Verify graph service is running

## Production Deployment

### Kubernetes Deployment

```bash
# Add DataHub Helm repo
helm repo add datahub https://helm.datahubproject.io/

# Install DataHub
helm install datahub datahub/datahub \
  --set global.datahub.gms.image.tag=latest \
  --set global.elasticsearch.host=elasticsearch-master
```

### Configuration Best Practices

1. **Use external databases** (PostgreSQL, Elasticsearch)
2. **Enable authentication** (OIDC with Keycloak)
3. **Set up SSL/TLS**
4. **Configure backups**
5. **Monitor performance**
6. **Scale horizontally** (multiple GMS instances)

## Resources

- [Official Documentation](https://datahubproject.io/docs/)
- [GitHub Repository](https://github.com/datahub-project/datahub)
- [Community Slack](https://datahubspace.slack.com/)
- [Example Recipes](https://datahubproject.io/docs/metadata-ingestion/source_docs/)
- [API Documentation](https://datahubproject.io/docs/api/graphql/overview)

## Next Steps

- [Configure data sources](https://datahubproject.io/docs/metadata-ingestion/)
- [Set up data governance](https://datahubproject.io/docs/features)
- [Create data contracts](https://www.acryldata.io/blog/data-contracts-in-datahub)
- [Build with GraphQL API](https://datahubproject.io/docs/api/graphql/overview)
