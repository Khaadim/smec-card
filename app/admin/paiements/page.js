import { redirect } from 'next/navigation';
import { admin } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { METHOD_LABELS } from '@/lib/site';
import { confirmPayment, rejectPayment } from '../actions';
import ConfirmButton from '../ConfirmButton';

export const dynamic = 'force-dynamic';
const LABELS = { paid: 'Validé', pending: 'En attente', failed: 'Refusé' };

export default async function Paiements({ searchParams }) {
  if (!(await getAdmin())) redirect('/admin/login');
  const { s = '' } = await searchParams;
  const { data } = await admin().from('payments').select('*, members(first_name,last_name,phone)').order('created_at', { ascending: false }).limit(300);
  const all = data || [];
  const list = s ? all.filter((p) => p.status === s) : all;
  const total = all.filter((p) => p.status === 'paid').reduce((a, p) => a + p.amount, 0);
  const pendingCount = all.filter((p) => p.status === 'pending').length;

  return (
    <>
      <h1>Paiements</h1>
      <p className="sub">Total encaissé : <b>{total.toLocaleString('fr-FR')} FCFA</b> · {pendingCount} paiement(s) à confirmer</p>
      <div className="panel">
        <div className="chips">
          <a href="/admin/paiements" className={!s ? 'on' : ''}>Tous ({all.length})</a>
          {Object.entries(LABELS).map(([k, v]) => (
            <a key={k} href={`/admin/paiements?s=${k}`} className={s === k ? 'on' : ''}>{v} ({all.filter((p) => p.status === k).length})</a>
          ))}
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Date</th><th>Membre</th><th>Téléphone</th><th>Montant</th><th>Mode</th><th>Réf.</th><th>Statut</th><th>Action</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td>{p.members ? `${p.members.first_name} ${p.members.last_name}` : '—'}</td>
                  <td>{p.members?.phone || '—'}</td>
                  <td>{p.amount.toLocaleString('fr-FR')} FCFA</td>
                  <td>{METHOD_LABELS[p.method] || p.method || '—'}</td>
                  <td>{p.id.slice(0, 6).toUpperCase()}</td>
                  <td><span className={`pill ${p.status}`}>{LABELS[p.status]}</span></td>
                  <td>
                    {p.status === 'pending' ? (
                      <div className="act">
                        <form action={confirmPayment}>
                          <input type="hidden" name="payment_id" value={p.id} />
                          <ConfirmButton message={`Confirmer la réception de ${p.amount.toLocaleString('fr-FR')} FCFA de ${p.members?.first_name || 'ce membre'} ? Sa carte sera activée.`}>Confirmer</ConfirmButton>
                        </form>
                        <form action={rejectPayment}>
                          <input type="hidden" name="payment_id" value={p.id} />
                          <ConfirmButton className="danger" message="Refuser ce paiement ?">Refuser</ConfirmButton>
                        </form>
                      </div>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={8} className="empty">Aucun paiement.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
