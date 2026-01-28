import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: '🗂️ DataHub - Data Catalog',
    description: (
      <>
        Modern metadata management platform for data discovery, lineage tracking, 
        and governance. Search across all data assets with visual lineage graphs.
      </>
    ),
  },
  {
    title: '👁️ Langfuse - LLM Observability',
    description: (
      <>
        Complete observability for LLM applications with tracing, cost tracking, 
        and quality monitoring. Optimize your AI applications in real-time.
      </>
    ),
  },
  {
    title: '💾 MinIO - Object Storage',
    description: (
      <>
        High-performance S3-compatible object storage with enterprise-grade reliability,
        encryption, and distributed architecture for all your data needs.
      </>
    ),
  },
  {
    title: '🔐 Keycloak - Authentication',
    description: (
      <>
        Enterprise-grade identity and access management with SSO, RBAC, social login,
        and multi-factor authentication. One login for all services.
      </>
    ),
  },
];

function Feature({title, description}) {
  return (
    <div className={clsx('col col--6')}>
      <div className="text--center padding-horiz--md margin-bottom--lg">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
