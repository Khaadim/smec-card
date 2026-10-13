import { redirect } from 'next/navigation';
import { admin } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const LABELS = { paid: 'Validé', pending: 'En attente', failed: 'Échoué' };

export default async function Paiements({ searchParams }) {
  if (!(await getAdmin())) redirect('/admin/login');
  const { s = '' } = await searchParams;
  const { data } = await admin().from('payments').select('*, members(first_name,last_name)').order('created_at', { ascending: false }).limit(300);
  const all = data || [];
  const list = s ? all.filter((p) => p.status === s) : all;
  const total = all.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0);

  return (
    <>
      <h1>Paiements</h1>
      <p className="sub">Total encaissé : <b>{total.toLocaleString('fr-FR')} FCFA</b></p>
      <div className="panel">
        <div className="chips">
          <a href="/admin/paiements" className={!s ? 'on' : ''}>Tous ({all.length})</a>
          {Object.entries(LABELS).map(([k, v]) => (
            <a key={k} href={`/admin/paiements?s=${k}`} className={s === k ? 'on' : ''}>{v} ({all.filter((p) => p.status === k).length})</a>
          ))}
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Date</th><th>Membre</th><th>Montant</th><th>Mode</th><th>Référence</th><th>Statut</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{p.members ? `${p.members.first_name} ${p.members.last_name}` : '—'}</td>
                  <td>{p.amount.toLocaleString('fr-FR')} FCFA</td>
                  <td>{p.method || '—'}</td>
                  <td>{p.provider_ref || '—'}</td>
                  <td><span className={`pill ${p.status}`}>{LABELS[p.status]}</span></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="empty">Aucun paiement.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
