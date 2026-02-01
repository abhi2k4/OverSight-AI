# OverSight Deployment Guide

This directory contains all deployment configurations for the OverSightAI & Data Governance Platform. The deployment is designed to be **cloud-agnostic** and supports both **bare metal** and **Kubernetes** environments.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Quick Start](#quick-start)
- [Docker Compose Deployment](#docker-compose-deployment)
- [Kubernetes/Helm Deployment](#kuberneteshelm-deployment)
- [Configuration](#configuration)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

## 🏗️ Architecture Overview

The OverSight platform consists of the following components:

1. **Backend API** - FastAPI-based REST API and WebSocket server
2. **Frontend** - React application with Express proxy server
3. **PostgreSQL** - Primary database for application data
4. **Redis** - Caching and job queue management
5. **MinIO** - Object storage for raw data files
6. **Keycloak** - Authentication and authorization service
7. **DataHub** (Optional) - External metadata catalog integration

## 🚀 Quick Start

### Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+
- OR Kubernetes 1.24+ with Helm 3.8+
- Minimum 8GB RAM, 4 CPU cores, 50GB disk space

### Docker Compose (Bare Metal / Local)

1. **Clone and navigate to deployment directory:**
   ```bash
   cd deployment
   ```

2. **Copy environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file with your configuration:**
   ```bash
   # Required: Set your Gemini API key
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Optional: Configure other services
   POSTGRES_PASSWORD=your_secure_password
   MINIO_ROOT_PASSWORD=your_secure_password
   ```

4. **Build and start services:**
   ```bash
   docker-compose up -d
   ```

5. **Check service status:**
   ```bash
   docker-compose ps
   ```

6. **Access the application:**
   - Frontend: http://localhost:3003
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)
   - Keycloak: http://localhost:8080 (admin/admin123)

### Kubernetes/Helm Deployment

1. **Build and push Docker images:**
   ```bash
   # Build backend
   docker build -f deployment/Dockerfile.backend -t your-registry.com/oversight-backend:1.0.0 .
   docker push your-registry.com/oversight-backend:1.0.0
   
   # Build frontend
   docker build -f deployment/Dockerfile.frontend -t your-registry.com/oversight-frontend:1.0.0 .
   docker push your-registry.com/oversight-frontend:1.0.0
   ```

2. **Install with Helm:**
   ```bash
   # Development
   helm install oversight ./helm/oversight -f helm/oversight/values-dev.yaml
   
   # Production
   helm install oversight ./helm/oversight -f helm/oversight/values-production.yaml
   ```

3. **Check deployment status:**
   ```bash
   kubectl get pods -l app.kubernetes.io/name=oversight
   ```

## 🐳 Docker Compose Deployment

### Service Configuration

The `docker-compose.yml` file defines all services with health checks and dependencies. Services are automatically started in the correct order.

### Environment Variables

All configuration is done through environment variables. See `.env.example` for all available options.

### Persistent Volumes

The following volumes are created for data persistence:

- `postgres_data` - PostgreSQL database
- `redis_data` - Redis persistence
- `minio_data` - MinIO object storage
- `backend_data` - Backend application data
- `keycloak_db_data` - Keycloak database

### Scaling Services

To scale services horizontally:

```bash
docker-compose up -d --scale backend=3 --scale frontend=2
```

### Updating Services

```bash
# Pull latest images
docker-compose pull

# Recreate containers
docker-compose up -d
```

### Stopping Services

```bash
# Stop services (keeps volumes)
docker-compose stop

# Stop and remove containers (keeps volumes)
docker-compose down

# Stop and remove everything including volumes
docker-compose down -v
```

## ☸️ Kubernetes/Helm Deployment

### Helm Chart Structure

```
helm/oversight/
├── Chart.yaml              # Chart metadata
├── values.yaml             # Default values
├── values-dev.yaml         # Development overrides
├── values-production.yaml  # Production overrides
└── templates/              # Kubernetes manifests
    ├── backend/
    ├── frontend/
    ├── postgres/
    ├── redis/
    ├── minio/
    └── keycloak/
```

### Customizing Values

1. **Copy values file:**
   ```bash
   cp helm/oversight/values.yaml helm/oversight/my-values.yaml
   ```

2. **Edit `my-values.yaml` with your settings**

3. **Install with custom values:**
   ```bash
   helm install oversight ./helm/oversight -f helm/oversight/my-values.yaml
   ```

### Upgrading Deployment

```bash
# Update values
helm upgrade oversight ./helm/oversight -f helm/oversight/my-values.yaml

# Rollback if needed
helm rollback oversight
```

### Uninstalling

```bash
helm uninstall oversight
```

## ⚙️ Configuration

### Backend Configuration

Key environment variables for the backend:

- `DATABASE_URL` - PostgreSQL connection string
- `GEMINI_API_KEY` - Google Gemini API key (required)
- `MINIO_ENDPOINT` - MinIO server endpoint
- `REDIS_HOST` - Redis server hostname
- `KEYCLOAK_URL` - Keycloak server URL

### Frontend Configuration

Key environment variables for the frontend:

- `PYTHON_API_URL` - Backend API URL
- `KEYCLOAK_URL` - Keycloak server URL
- `KEYCLOAK_REALM` - Keycloak realm name
- `KEYCLOAK_CLIENT_ID` - Keycloak client ID

### Database Migration

The backend automatically initializes the database schema on first startup. For manual migration:

```bash
# Using Docker Compose
docker-compose exec backend python -c "from backend.database import init_db; init_db()"

# Using Kubernetes
kubectl exec -it deployment/oversight-backend -- python -c "from backend.database import init_db; init_db()"
```

### Keycloak Setup

1. Access Keycloak admin console: http://localhost:8080
2. Login with admin credentials from `.env`
3. Create a new realm: `oversight`
4. Create clients:
   - `oversight-frontend` (public client)
   - `oversight-backend` (confidential client)
5. Configure redirect URIs and roles

## 🏭 Production Deployment

### Security Checklist

- [ ] Change all default passwords
- [ ] Use secrets management (Kubernetes Secrets, HashiCorp Vault, etc.)
- [ ] Enable TLS/SSL for all services
- [ ] Configure firewall rules
- [ ] Set up monitoring and alerting
- [ ] Enable backup strategies
- [ ] Configure log aggregation
- [ ] Set resource limits and requests
- [ ] Enable autoscaling
- [ ] Configure ingress with TLS

### Production Values

Use `values-production.yaml` as a starting point and customize:

```yaml
backend:
  replicaCount: 3
  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
  resources:
    limits:
      cpu: 4000m
      memory: 4Gi
```

### Secrets Management

For production, use Kubernetes Secrets:

```bash
# Create secrets
kubectl create secret generic oversight-secrets \
  --from-literal=gemini-api-key=your_key \
  --from-literal=postgres-password=your_password \
  --from-literal=keycloak-client-secret=your_secret

# Reference in values.yaml
envFrom:
  - secretRef:
      name: oversight-secrets
```

### Monitoring

Recommended monitoring stack:

- **Prometheus** - Metrics collection
- **Grafana** - Visualization
- **Loki** - Log aggregation
- **AlertManager** - Alerting

### Backup Strategy

1. **Database Backups:**
   ```bash
   # PostgreSQL
   kubectl exec -it postgres-pod -- pg_dump -U oversight oversight > backup.sql
   ```

2. **MinIO Backups:**
   - Use MinIO's built-in replication
   - Or backup the PVC

3. **Application Data:**
   - Backup persistent volumes regularly

## 🔧 Troubleshooting

### Services Not Starting

1. **Check logs:**
   ```bash
   docker-compose logs backend
   kubectl logs deployment/oversight-backend
   ```

2. **Check health endpoints:**
   ```bash
   curl http://localhost:8000/api/health
   curl http://localhost:3003/health
   ```

3. **Verify environment variables:**
   ```bash
   docker-compose config
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   docker-compose ps postgres
   kubectl get pods -l component=postgres
   ```

2. **Test connection:**
   ```bash
   docker-compose exec postgres psql -U oversight -d oversight
   ```

### MinIO Access Issues

1. **Verify MinIO is running:**
   ```bash
   curl http://localhost:9000/minio/health/live
   ```

2. **Check credentials in `.env`**

### Keycloak Issues

1. **Check Keycloak logs:**
   ```bash
   docker-compose logs keycloak
   ```

2. **Verify database connection:**
   ```bash
   docker-compose exec keycloak-db psql -U keycloak -d keycloak
   ```

### Performance Issues

1. **Check resource usage:**
   ```bash
   docker stats
   kubectl top pods
   ```

2. **Scale services:**
   ```bash
   # Docker Compose
   docker-compose up -d --scale backend=3
   
   # Kubernetes
   kubectl scale deployment oversight-backend --replicas=3
   ```

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [MinIO Documentation](https://min.io/docs/)

## 🤝 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourorg/oversight/issues)
- Documentation: See main README.md
- Community: [Join our Discord/Slack]

## 📝 License

[Your License Here]
