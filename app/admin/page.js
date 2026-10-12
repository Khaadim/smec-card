import Link from 'next/link';
import { redirect } from 'next/navigation';
import { admin, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { logout, changeCardStatus } from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  if (!(await getAdmin())) redirect('/admin/login');
  const { q = '', s = '' } = await searchParams;
  const sb = admin();

  const [{ count: total }, { count: paid }, { count: pending }, { data: cards }] = await Promise.all([
    sb.from('members').select('*', { count: 'exact', head: true }),
    sb.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
    sb.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    sb.from('cards').select('*, members(*)').order('created_at', { ascending: false }).limit(500),
  ]);

  const rows = (cards || []).map((c) => ({ ...c, st: computeStatus(c) }));
  const expired = rows.filter((r) => r.st === 'expired').length;
  const needle = q.toLowerCase().trim();
  const list = rows.filter((r) => {
    const m = r.members;
    const hay = `${m.first_name} ${m.last_name} ${m.phone} ${r.card_number || ''}`.toLowerCase();
    return (!needle || hay.includes(needle)) && (!s || r.st === s);
  });

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div className="row">
        <h2 style={{ margin: 0 }}>Tableau de bord</h2>
        <form action={logout}><button className="small gray">Déconnexion</button></form>
      </div>

      <div className="stats">
        <div className="box"><b>{total ?? 0}</b><span>Membres</span></div>
        <div className="box"><b>{paid ?? 0}</b><span>Paiements validés</span></div>
        <div className="box"><b>{pending ?? 0}</b><span>Paiements en attente</span></div>
        <div className="box"><b>{expired}</b><span>Cartes expirées</span></div>
      </div>

      <form className="row" style={{ margin: '16px 0' }}>
        <input name="q" defaultValue={q} placeholder="Rechercher (nom, n°, téléphone)" />
        <select name="s" defaultValue={s}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="small">Filtrer</button>
        <Link className="btnlink" href="/admin/export">Export Excel</Link>
      </form>

      <div className="box" style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>N°</th><th>Nom</th><th>Téléphone</th><th>Statut</th><th>Action</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{r.card_number || '—'}</td>
                <td><Link href={`/carte/${r.token}`} target="_blank">{r.members.first_name} {r.members.last_name}</Link></td>
                <td>{r.members.phone}</td>
                <td><span className={`badge ${r.st}`}>{STATUS_LABELS[r.st]}</span></td>
                <td>
                  <form action={changeCardStatus} className="row">
                    <input type="hidden" name="card_id" value={r.id} />
                    {r.status === 'revoked' ? (
                      <button name="action" value="reactivate" className="small">Réactiver</button>
                    ) : (
                      <>
                        <input name="reason" placeholder="Motif" required style={{ width: 110, padding: 6 }} />
                        <button name="action" value="revoke" className="small red">Révoquer</button>
                      </>
                    )}
                  </form>
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="muted">Aucun résultat.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
