import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <img src="/OverSight.png" alt="Oversight Logo" width="40" height="40" />
      <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Oversight</span>
    </div>
  ),
  project: {
    link: 'https://github.com/abhi2k4/GRACE_Knowcode_OverSight',
  },
  docsRepositoryBase: 'https://github.com/abhi2k4/GRACE_Knowcode_OverSight/tree/main',
  footer: {
    content: (
      <span>
        {new Date().getFullYear()} © Oversight - Unified Enterprise Data Observability Platform
      </span>
    ),
  },
  head: (
    <>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="description" content="Oversight - Leveraging proven open-source components (DataHub + Langfuse observability + MinIO storage + Keycloak auth) for unified enterprise control" />
      <meta property="og:title" content="Oversight Documentation" />
      <link rel="icon" href="/OverSight.png" />
    </>
  ),
  sidebar: {
    defaultMenuCollapseLevel: 1,
  },
  toc: {
    backToTop: true,
  }
}

export default config
