/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://notefav.com',
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  sitemapSize: 7000,
  changefreq: 'daily',
  priority: 0.7,
  exclude: [
    '/dashboard',
    '/profile',
    '/settings',
    '/notes',
    '/notes/*',
    '/goals',
    '/goals/*',
    '/groups',
    '/groups/*'
  ],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://notefav.com/sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/dashboard/',
          '/profile/',
          '/settings/',
          '/notes/',
          '/goals/',
          '/groups/'
        ],
      },
    ],
  },
}; 