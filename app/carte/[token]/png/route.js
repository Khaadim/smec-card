import { renderCardPng } from '@/lib/cardimage';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { token } = await params;
  const r = await renderCardPng(token);
  if (!r) return new Response('Carte introuvable', { status: 404 });
  return new Response(r.buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${r.filename}.png"`,
      'Cache-Control': 'no-store',
    },
  });
}
