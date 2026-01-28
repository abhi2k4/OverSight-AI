---
sidebar_position: 3
title: MinIO - Object Storage
---

# MinIO - High-Performance Object Storage

## What is MinIO?

MinIO is a high-performance, S3-compatible object storage system designed for cloud-native and containerized environments. It's used within Oversight as the primary storage backend for Langfuse and can be integrated with other components for scalable data storage.

## Key Features

### 🚀 High Performance
- **Sub-millisecond latency** for object operations
- **Multi-threaded** for concurrent access
- **Read-after-write consistency**
- **Optimized for NVMe** storage

### ☁️ S3 Compatible
- **Full S3 API compatibility**
- Works with existing S3 tools and SDKs
- Easy migration from AWS S3
- Standard AWS SDK integration

### 🔒 Security First
- **Encryption at-rest** and in-transit
- **IAM-style access control**
- **Multi-tenancy support**
- **Audit logging**
- **Versioning support**

### 📊 Enterprise Features
- **Distributed mode** for high availability
- **Erasure coding** for data protection
- **Replication** across sites
- **Lifecycle management**
- **Event notifications**

### 🎯 Cloud Native
- **Kubernetes native**
- **Containerized deployment**
- **Horizontal scaling**
- **Stateless design**

## Installation in Oversight

MinIO is automatically installed as part of the Langfuse stack:

```bash
cd langfuse
docker compose up -d
```

MinIO is configured with:
- **API endpoint**: `http://localhost:9090`
- **Console**: `http://localhost:9091`
- **Default credentials**: `minio` / `miniosecret`

## Accessing MinIO Console

1. Open browser to `http://localhost:9091`
2. Login with credentials:
   - **Username**: `minio`
   - **Password**: `miniosecret`
3. View buckets, objects, and metrics

## Buckets in Oversight

MinIO automatically creates the `langfuse` bucket with prefixes:
- **events/**: LLM trace events
- **media/**: Uploaded media files
- **exports/**: Batch export data

## Configuration

### Environment Variables

MinIO in Langfuse is configured via environment variables:

```yaml
# Event Upload (Internal)
LANGFUSE_S3_EVENT_UPLOAD_BUCKET=langfuse
LANGFUSE_S3_EVENT_UPLOAD_ENDPOINT=http://minio:9000
LANGFUSE_S3_EVENT_UPLOAD_ACCESS_KEY_ID=minio
LANGFUSE_S3_EVENT_UPLOAD_SECRET_ACCESS_KEY=miniosecret

# Media Upload (External)
LANGFUSE_S3_MEDIA_UPLOAD_BUCKET=langfuse
LANGFUSE_S3_MEDIA_UPLOAD_ENDPOINT=http://localhost:9090
LANGFUSE_S3_MEDIA_UPLOAD_ACCESS_KEY_ID=minio
LANGFUSE_S3_MEDIA_UPLOAD_SECRET_ACCESS_KEY=miniosecret
```

### Standalone Installation

For standalone MinIO deployment:

```bash
# Using Docker
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=adminpassword" \
  -v /mnt/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

## SDK Integration

### Python

```bash
pip install minio
```

```python
from minio import Minio

client = Minio(
    "localhost:9090",
    access_key="minio",
    secret_key="miniosecret",
    secure=False
)

# Upload object
client.fput_object(
    "mybucket",
    "myobject.txt",
    "/path/to/file.txt"
)

# Download object
client.fget_object(
    "mybucket",
    "myobject.txt",
    "/path/to/download.txt"
)
```

### JavaScript

```bash
npm install minio
```

```javascript
const Minio = require('minio');

const minioClient = new Minio.Client({
    endPoint: 'localhost',
    port: 9090,
    useSSL: false,
    accessKey: 'minio',
    secretKey: 'miniosecret'
});

// Upload file
minioClient.fPutObject('mybucket', 'myobject.txt', '/path/to/file.txt');
```

### AWS SDK (S3 Compatible)

```python
import boto3

s3 = boto3.client(
    's3',
    endpoint_url='http://localhost:9090',
    aws_access_key_id='minio',
    aws_secret_access_key='miniosecret'
)

# Upload
s3.upload_file('/path/to/file.txt', 'mybucket', 'myobject.txt')

# Download
s3.download_file('mybucket', 'myobject.txt', '/path/to/download.txt')
```

## Use Cases in Oversight

### LLM Trace Storage
Store detailed traces and events from Langfuse for long-term analysis.

### Media File Storage
Handle images, audio, and video files used in LLM interactions.

### Data Lake Storage
Build a data lake for analytics with DataHub metadata.

### Backup Storage
Store backups of databases and configurations.

### Artifact Storage
Store ML model artifacts, datasets, and experiment results.

## Advanced Features

### Bucket Policies

Create fine-grained access policies:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {"AWS": ["*"]},
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::public-bucket/*"]
    }
  ]
}
```

### Lifecycle Rules

Automatically expire or transition objects:

```xml
<LifecycleConfiguration>
  <Rule>
    <ID>expire-old-files</ID>
    <Status>Enabled</Status>
    <Expiration>
      <Days>90</Days>
    </Expiration>
  </Rule>
</LifecycleConfiguration>
```

### Event Notifications

Trigger webhooks on object events:

```bash
mc event add local/mybucket arn:minio:sqs::primary:webhook \
  --event put,delete
```

### Replication

Set up cross-region replication:

```bash
mc replicate add local/source-bucket \
  --remote-bucket remote-bucket \
  --arn arn:minio:replication::replica:dest
```

## Monitoring

### Metrics

MinIO exposes Prometheus-compatible metrics:
- Request rate
- Throughput
- Latency percentiles
- Error rates
- Storage capacity

### Health Checks

```bash
# Liveness check
curl http://localhost:9090/minio/health/live

# Readiness check
curl http://localhost:9090/minio/health/ready
```

## Integration with Other Components

### With DataHub
Store large dataset artifacts and reference them in DataHub metadata.

### With Langfuse
Automatic integration for event and media storage (already configured).

### With Applications
Use as S3-compatible storage for any application data.

## Management Tools

### MinIO Client (mc)

```bash
# Install mc
brew install minio/stable/mc

# Configure alias
mc alias set local http://localhost:9090 minio miniosecret

# List buckets
mc ls local

# Copy files
mc cp myfile.txt local/mybucket/

# Mirror directories
mc mirror /local/dir local/mybucket/prefix
```

### Web Console

Access the browser-based console at `http://localhost:9091` for:
- Bucket management
- Object browsing
- User management
- Monitoring dashboards
- Configuration

## Performance Tuning

### Storage Configuration

```bash
# Use multiple drives for better performance
minio server /data{1...4}
```

### Network Optimization

```bash
# Increase parallel transfers
export MINIO_API_REQUESTS_MAX=1000
```

### Cache Settings

```bash
# Enable cache for frequently accessed objects
export MINIO_CACHE="on"
export MINIO_CACHE_DRIVES="/mnt/cache"
```

## Security Best Practices

1. **Change default credentials** immediately
2. **Enable HTTPS** in production
3. **Use IAM policies** for access control
4. **Enable encryption** at-rest
5. **Regular security updates**
6. **Audit logging** enabled
7. **Network isolation** where possible

## High Availability

### Distributed Mode

Deploy MinIO in distributed mode:

```bash
# 4-node cluster
minio server \
  http://host{1...4}/data{1...4}
```

### Kubernetes Deployment

```bash
# Using MinIO Operator
kubectl apply -k github.com/minio/operator

# Create tenant
kubectl apply -f minio-tenant.yaml
```

## Backup & Recovery

### Backup

```bash
# Mirror bucket to backup location
mc mirror local/mybucket backup/mybucket
```

### Restore

```bash
# Restore from backup
mc mirror backup/mybucket local/mybucket
```

## Resources

- [Official Documentation](https://min.io/docs/minio/linux/index.html)
- [GitHub Repository](https://github.com/minio/minio)
- [Slack Community](https://slack.min.io/)
- [Client SDKs](https://min.io/docs/minio/linux/developers/minio-drivers.html)

## Next Steps

- [Install Oversight](/getting-started)
- [Configure Langfuse with MinIO](/guides/langfuse)
- [MinIO Administration Guide](https://min.io/docs/minio/linux/administration/console.html)
