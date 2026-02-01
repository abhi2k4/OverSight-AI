// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import {themes as prismThemes} from 'prism-react-renderer';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'OverSightAI',
  tagline: 'Unified Enterprise Data Observability Platform',
  favicon: 'img/OverSight.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://docs.oversightai.in',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For subdomain deployment, use '/'
  baseUrl: '/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'abhi2k4', // Usually your GitHub org/user name.
  projectName: 'GRACE_Knowcode_OverSight', // Usually your repo name.

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  // Ensure proper Unicode/UTF-8 encoding
  headTags: [
    {
      tagName: 'meta',
      attributes: {
        charset: 'utf-8',
      },
    },
    {
      tagName: 'meta',
      attributes: {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1.0',
      },
    },
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          sidebarPath: './sidebars.js',
          editUrl:
            'https://github.com/abhi2k4/GRACE_Knowcode_OverSight/tree/main/docs/my-website/',
        },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: 'img/oversight-social-card.jpg',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      navbar: {
        title: 'OverSightAI',
        logo: {
          alt: 'OverSight Logo',
          src: 'img/OverSight.png',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'mainSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            label: 'Main Site',
            href: 'https://oversightai.in',
            position: 'left',
          },
          {
            href: 'https://github.com/abhi2k4/GRACE_Knowcode_OverSight',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Introduction',
                to: '/docs/intro',
              },
              {
                label: 'Getting Started',
                to: '/docs/getting-started',
              },
              {
                label: 'Components',
                to: '/docs/components/datahub',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'DataHub Slack',
                href: 'https://datahubspace.slack.com/',
              },
              {
                label: 'Langfuse Discord',
                href: 'https://langfuse.com/discord',
              },
              {
                label: 'Keycloak Community',
                href: 'https://www.keycloak.org/community',
              },
              {
                label: 'MinIO Slack',
                href: 'https://slack.min.io/',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'About',
                to: '/docs/about',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/abhi2k4/GRACE_Knowcode_OverSight',
              },
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} OverSightAI - Unified Enterprise Data Observability Platform. Built with ❤️ for the data community.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
    }),
};

export default config;
