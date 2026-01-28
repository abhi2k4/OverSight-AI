---
sidebar_position: 1
title: DataHub - Data Catalog
---

# DataHub - Data Catalog & Governance

## What is DataHub?

DataHub is a modern data catalog designed to streamline metadata management, data discovery, and data governance. It enables users to efficiently explore and understand their data, track data lineage, profile datasets, and establish data contracts. This extensible metadata management platform is built for developers to tame the complexity of their rapidly evolving data ecosystems and for data practitioners to leverage the total value of data within their organization.

## Key Features

### 🔍 Data Discovery
Search your entire data ecosystem, including dashboards, datasets, ML models, and raw files. Find what you need quickly with powerful search and filtering capabilities.

### 🧭 Data Governance
Define ownership and track PII. Establish clear data ownership, manage access controls, and ensure compliance with data privacy regulations.

### ✅ Data Quality Control
Improve data quality through:
- Metadata tests
- Assertions and validations
- Data freshness checks
- Data contracts

### 📊 UI-based Ingestion
Easily set up integrations in minutes using DataHub's intuitive UI-based ingestion feature. Connect to various data sources without writing code.

### 🔌 APIs and SDKs
For users who prefer programmatic control, DataHub offers a comprehensive set of APIs and SDKs for:
- Python
- Java
- GraphQL
- REST APIs

### 💚 Vibrant Community
Join a thriving community that provides support through:
- Office hours
- Workshops
- Active Slack channel
- Regular town halls

## Getting Started

### Quick Installation

```bash
# Install DataHub CLI
python3 -m pip install --upgrade pip wheel setuptools
python3 -m pip install --upgrade acryl-datahub

# Start DataHub with Docker
datahub docker quickstart
```

### Access DataHub
Once installed, access DataHub at: `http://localhost:9002`

Default credentials: `datahub` / `datahub`

## Deployment Options

### Local Development
Use the Docker quickstart for local development and testing:
```bash
datahub docker quickstart
```

### Kubernetes (Production)
Deploy DataHub to production using Helm charts:
```bash
helm repo add datahub https://helm.datahubproject.io/
helm install datahub datahub/datahub
```

### DataHub Cloud
For a fully managed solution, consider [DataHub Cloud](https://www.acryldata.io/).

## Data Ingestion

### UI-based Ingestion
1. Navigate to **Ingestion** → **Sources**
2. Click **Create new source**
3. Select your data source type (Snowflake, BigQuery, MySQL, etc.)
4. Configure connection details
5. Schedule ingestion runs

### CLI-based Ingestion
Use the DataHub CLI for programmatic ingestion:

```bash
# Install connector
pip install 'acryl-datahub[mysql]'

# Create recipe file
cat > recipe.yml <<EOF
source:
  type: mysql
  config:
    host_port: localhost:3306
    database: mydb
    username: user
    password: pass
EOF

# Run ingestion
datahub ingest -c recipe.yml
```

## Supported Data Sources

DataHub supports 50+ data sources including:
- **Databases**: MySQL, PostgreSQL, Oracle, SQL Server, MongoDB
- **Data Warehouses**: Snowflake, BigQuery, Redshift, Azure Synapse
- **Data Lakes**: S3, ADLS, GCS
- **BI Tools**: Tableau, Looker, PowerBI, Superset
- **ETL**: Airflow, dbt, Spark
- **ML Platforms**: SageMaker, MLflow, Kubeflow

## Key Concepts

### Datasets
Represent tables, views, or collections of data. Track schema, ownership, tags, and more.

### Data Lineage
Visualize how data flows through your organization. Understand upstream and downstream dependencies.

### Glossary Terms
Create a business glossary to standardize terminology across your organization.

### Domains
Organize data assets by business domains (e.g., Marketing, Finance, Engineering).

### Data Contracts
Define expectations for data quality and structure. Monitor compliance automatically.

## Integration with Oversight

DataHub integrates seamlessly with other Oversight components:

- **Keycloak**: Use Keycloak for SSO authentication
- **MinIO**: Store large metadata artifacts in MinIO
- **Langfuse**: Cross-reference ML model metadata with LLM traces

## Use Cases

### Data Discovery
Help data analysts and scientists discover relevant datasets quickly.

### Compliance & Governance
Track PII, manage data access, and ensure regulatory compliance.

### Data Quality
Monitor data quality metrics and set up automated alerts.

### Impact Analysis
Understand the impact of schema changes before making them.

### Data Democratization
Make data accessible and understandable to all team members.

## Resources

- [Official Documentation](https://datahubproject.io/docs/)
- [GitHub Repository](https://github.com/datahub-project/datahub)
- [Community Slack](https://datahubspace.slack.com/)
- [Demo Instance](https://demo.datahub.com/)
- [YouTube Channel](https://www.youtube.com/channel/UC3qFQC5IiwR5fvWEqi_tJ5w)

## Next Steps

- [Install DataHub](/getting-started)
- [DataHub Integration Guide](/guides/datahub)
- [Configure Data Sources](https://datahubproject.io/docs/metadata-ingestion/)
