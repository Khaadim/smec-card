import { admin, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function GET() {
  if (!(await getAdmin())) return new Response('Non autorisé', { status: 401 });
  const { data } = await admin().from('cards').select('*, members(*)').order('created_at', { ascending: false });
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [['N°', 'Prénom', 'Nom', 'Téléphone', 'E-mail', 'Statut', 'Expiration'].map(esc).join(';')];
  for (const c of data || []) {
    lines.push([
      c.card_number, c.members.first_name, c.members.last_name, c.members.phone, c.members.email,
      STATUS_LABELS[computeStatus(c)], c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-FR') : '',
    ].map(esc).join(';'));
  }
  return new Response('\uFEFF' + lines.join('\n'), {
    headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="membres-smec.csv"' },
  });
}
