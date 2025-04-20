export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/profile/', '/settings/', '/notes/', '/goals/', '/groups/'],
    },
    sitemap: 'https://notefav.com/sitemap.xml',
  };
} 