export default async function sitemap() {
  const baseUrl = 'https://notefav.com';

  // Ana sayfalar
  const routes = [
    '',
    '/features',
    '/auth/login',
    '/auth/signup',
    '/auth/reset-password',
    '/help',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: route === '' ? 1.0 : 0.8,
  }));

  return routes;
} 