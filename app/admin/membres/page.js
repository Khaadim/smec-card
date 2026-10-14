import Link from 'next/link';
import { redirect } from 'next/navigation';
import { admin, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { changeCardStatus, deleteMember } from '../actions';
import ConfirmButton from '../ConfirmButton';
import Icon from '../icons';

export const dynamic = 'force-dynamic';
const OK = { created: 'Membre créé et carte activée.', updated: 'Membre modifié.', deleted: 'Membre supprimé.' };

export default async function Membres({ searchParams }) {
  if (!(await getAdmin())) redirect('/admin/login');
  const { q = '', s = '', ok = '', e = '' } = await searchParams;
  const { data } = await admin().from('cards').select('*, members(*)').order('created_at', { ascending: false }).limit(500);
  const needle = q.toLowerCase().trim();
  const list = (data || []).map((c) => ({ ...c, st: computeStatus(c) })).filter((r) => {
    const m = r.members;
    const hay = `${m.first_name} ${m.last_name} ${m.phone} ${r.card_number || ''}`.toLowerCase();
    return (!needle || hay.includes(needle)) && (!s || r.st === s);
  });

  return (
    <>
      <div className="head">
        <div>
          <h1>Membres</h1>
          <p className="sub">{list.length} résultat(s)</p>
        </div>
        <Link className="btnlink solid" href="/admin/membres/nouveau"><Icon name="users" size={16} /> Nouveau membre</Link>
      </div>

      {OK[ok] && <div className="msg ok">{OK[ok]}</div>}
      {e && <div className="msg err">{e}</div>}

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
            <thead><tr><th>N°</th><th>Nom</th><th>Téléphone</th><th>Statut</th><th>Carte</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.card_number || '—'}</td>
                  <td><Link href={`/admin/membres/${r.member_id}`}>{r.members.first_name} {r.members.last_name}</Link></td>
                  <td>{r.members.phone}</td>
                  <td><span className={`pill ${r.st}`}>{STATUS_LABELS[r.st]}</span></td>
                  <td>{r.card_number ? <><a href={`/carte/${r.token}/png`}>PNG</a> · <a href={`/carte/${r.token}/pdf`}>PDF</a></> : '—'}</td>
                  <td>
                    <div className="act">
                      <Link className="btnlink sm" href={`/admin/membres/${r.member_id}`}>Modifier</Link>
                      <form action={changeCardStatus} className="act">
                        <input type="hidden" name="card_id" value={r.id} />
                        {r.status === 'revoked' ? (
                          <button name="action" value="reactivate">Réactiver</button>
                        ) : (
                          <>
                            <input name="reason" placeholder="Motif" required />
                            <button name="action" value="revoke" className="warn">Révoquer</button>
                          </>
                        )}
                      </form>
                      <form action={deleteMember}>
                        <input type="hidden" name="id" value={r.member_id} />
                        <ConfirmButton className="danger" message={`Supprimer définitivement ${r.members.first_name} ${r.members.last_name} ? Sa carte et ses paiements seront aussi supprimés. Cette action est irréversible.`}>Supprimer</ConfirmButton>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="empty">Aucun résultat.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
