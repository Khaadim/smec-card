import Link from 'next/link';
import { redirect } from 'next/navigation';
import { admin, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { changeCardStatus } from '../actions';
import Icon from '../icons';

export const dynamic = 'force-dynamic';

export default async function Membres({ searchParams }) {
  if (!(await getAdmin())) redirect('/admin/login');
  const { q = '', s = '' } = await searchParams;
  const { data } = await admin().from('cards').select('*, members(*)').order('created_at', { ascending: false }).limit(500);
  const needle = q.toLowerCase().trim();
  const list = (data || []).map((c) => ({ ...c, st: computeStatus(c) })).filter((r) => {
    const m = r.members;
    const hay = `${m.first_name} ${m.last_name} ${m.phone} ${r.card_number || ''}`.toLowerCase();
    return (!needle || hay.includes(needle)) && (!s || r.st === s);
  });

  return (
    <>
      <h1>Membres</h1>
      <p className="sub">{list.length} résultat(s)</p>
      <div className="panel">
        <form className="tools">
          <input name="q" defaultValue={q} placeholder="Rechercher (nom, n°, téléphone)" />
          <select name="s" defaultValue={s}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button>Filtrer</button>
          <Link className="btnlink" href="/admin/export"><Icon name="download" size={16} /> Export Excel</Link>
        </form>
        <div className="tablewrap">
          <table>
            <thead><tr><th>N°</th><th>Nom</th><th>Téléphone</th><th>Statut</th><th>Action</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.card_number || '—'}</td>
                  <td><Link href={`/carte/${r.token}`} target="_blank">{r.members.first_name} {r.members.last_name}</Link></td>
                  <td>{r.members.phone}</td>
                  <td><span className={`pill ${r.st}`}>{STATUS_LABELS[r.st]}</span></td>
                  <td>
                    <form action={changeCardStatus} className="act">
                      <input type="hidden" name="card_id" value={r.id} />
                      {r.status === 'revoked' ? (
                        <button name="action" value="reactivate">Réactiver</button>
                      ) : (
                        <>
                          <input name="reason" placeholder="Motif" required />
                          <button name="action" value="revoke" className="danger">Révoquer</button>
                        </>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={5} className="empty">Aucun résultat.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
