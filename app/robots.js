import { getSite } from '@/lib/settings';

// Indique aux moteurs de recherche ce qu'ils peuvent explorer : les pages publiques oui,
// l'administration et les pages personnelles des membres (cartes) non.
export default async function robots() {
  const { siteUrl } = await getSite();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/carte/', '/verifier/', '/api/', '/retrouver-ma-carte'] }],
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml`, host: siteUrl } : {}),
  };
}
