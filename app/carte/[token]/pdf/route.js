import { PDFDocument } from 'pdf-lib';
import { renderCardPng } from '@/lib/cardimage';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { token } = await params;
  const r = await renderCardPng(token);
  if (!r) return new Response('Carte introuvable', { status: 404 });

  const pdf = await PDFDocument.create();
  pdf.setTitle(r.filename);
  const page = pdf.addPage([300, 450]); // même proportions que l'image (2:3)
  const png = await pdf.embedPng(r.buffer);
  page.drawImage(png, { x: 0, y: 0, width: 300, height: 450 });

  return new Response(await pdf.save(), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${r.filename}.pdf"`,
      'Cache-Control': 'no-store',
    },
  });
}
