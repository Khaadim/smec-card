import { redirect } from 'next/navigation';
import { admin, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const fmt = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default async function Cartes({ searchParams }) {
  if (!(await getAdmin())) redirect('/admin/login');
  const { s = '' } = await searchParams;
  const { data } = await admin().from('cards').select('*, members(first_name,last_name)').order('created_at', { ascending: false }).limit(500);
  const all = (data || []).map((c) => ({ ...c, st: computeStatus(c) }));
  const list = s ? all.filter((c) => c.st === s) : all;

  return (
    <>
      <h1>Cartes</h1>
      <p className="sub">Cartes émises et leur état de validité</p>
      <div className="panel">
        <div className="chips">
          <a href="/admin/cartes" className={!s ? 'on' : ''}>Toutes ({all.length})</a>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <a key={k} href={`/admin/cartes?s=${k}`} className={s === k ? 'on' : ''}>{v} ({all.filter((c) => c.st === k).length})</a>
          ))}
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>N° carte</th><th>Membre</th><th>Émise le</th><th>Expire le</th><th>Statut</th><th>Liens</th></tr></thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td>{c.card_number || '—'}</td>
                  <td>{c.members.first_name} {c.members.last_name}</td>
                  <td>{fmt(c.issued_at)}</td>
                  <td>{fmt(c.expires_at)}</td>
                  <td>
                    <span className={`pill ${c.st}`}>{STATUS_LABELS[c.st]}</span>
                    {c.revoked_reason && <small style={{ color: '#5b6b88' }}> · {c.revoked_reason}</small>}
                  </td>
                  <td><a href={`/carte/${c.token}`} target="_blank">Carte</a> · <a href={`/verifier/${c.token}`} target="_blank">Vérification</a></td>
                </tr>
              ))}
              {list.length === 0 && <tr><td colSpan={6} className="empty">Aucune carte.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
