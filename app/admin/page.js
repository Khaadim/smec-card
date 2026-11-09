import Link from 'next/link';
import { redirect } from 'next/navigation';
import { admin, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import Icon from './icons';
import CopyButton from './CopyButton';
import { markLinkSent } from './actions';
import { waNumber } from '@/lib/phone';
import { getSite } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  if (!(await getAdmin())) redirect('/admin/login');
  const sb = admin();
  const [{ count: total }, { data: pays }, { data: cards }] = await Promise.all([
    sb.from('members').select('*', { count: 'exact', head: true }),
    sb.from('payments').select('amount, status'),
    sb.from('cards').select('*, members(first_name,last_name,phone)').order('created_at', { ascending: false }).limit(500),
  ]);

  const paid = (pays || []).filter((p) => p.status === 'paid');
  const pending = (pays || []).filter((p) => p.status === 'pending').length;
  const revenue = paid.reduce((s, p) => s + p.amount, 0);
  // Demandes « retrouver ma carte » en attente de traitement
  const since = new Date(Date.now() - 30 * 864e5).toISOString();
  const { data: logs } = await sb.from('audit_log').select('action, target_id, created_at').in('action', ['card_link_request', 'card_link_sent']).gte('created_at', since).limit(300);
  const lastReq = {}, lastSent = {};
  for (const l of logs || []) {
    const t = l.created_at, tgt = l.target_id, map = l.action === 'card_link_request' ? lastReq : lastSent;
    if (!map[tgt] || t > map[tgt]) map[tgt] = t;
  }
  const pendingIds = Object.keys(lastReq).filter((id) => !lastSent[id] || lastSent[id] < lastReq[id]);
  let linkRequests = [];
  if (pendingIds.length) {
    const { data: ms } = await sb.from('members').select('id, first_name, last_name, phone, cards(token)').in('id', pendingIds);
    linkRequests = ms || [];
  }
  const siteUrl = (await getSite()).siteUrl;

  const rows = (cards || []).map((c) => ({ ...c, st: computeStatus(c) }));
  const count = (s) => rows.filter((r) => r.st === s).length;
  const expired = count('expired');
  const bars = [['active', '#1e9e4f'], ['pending_payment', '#f0a020'], ['expired', '#e04545'], ['revoked', '#333']];
  const max = Math.max(1, rows.length);

  const stats = [
    { label: 'Total membres', value: total ?? 0, icon: 'users', c: 'blue' },
    { label: 'Paiements validés', value: paid.length, icon: 'check', c: 'green' },
    { label: 'Paiements en attente', value: pending, icon: 'clock', c: 'orange' },
    { label: 'Cartes expirées', value: expired, icon: 'alert', c: 'red' },
    { label: 'Revenus (FCFA)', value: revenue.toLocaleString('fr-FR'), icon: 'trend', c: 'teal' },
  ];

  return (
    <>
      <h1>Tableau de bord</h1>
      <p className="sub">Vue d'ensemble de SMEC – School of Medicine English Club</p>

      <div className="stats">
        {stats.map((s) => (
          <div className="stat" key={s.label}>
            <div className={`ic ${s.c}`}><Icon name={s.icon} size={22} /></div>
            <div><b>{s.value}</b><span>{s.label}</span></div>
          </div>
        ))}
      </div>

      {linkRequests.length > 0 && (
        <div className="panel">
          <h2>Demandes de lien de carte ({linkRequests.length})</h2>
          <p className="sub">Ces membres ont perdu le lien de leur carte. Envoyez-le sur le numéro enregistré, puis marquez la demande comme traitée.</p>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Membre</th><th>Téléphone</th><th>Action</th></tr></thead>
              <tbody>
                {linkRequests.map((m) => {
                  const link = `${siteUrl}/carte/${m.cards?.[0]?.token}`;
                  return (
                    <tr key={m.id}>
                      <td><Link href={`/admin/membres/${m.id}`}>{m.first_name} {m.last_name}</Link></td>
                      <td>{m.phone}</td>
                      <td>
                        <div className="act">
                          <a className="btnlink sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${waNumber(m.phone)}?text=${encodeURIComponent(`Bonjour ${m.first_name}, voici le lien de votre carte de membre SMEC : ${link}`)}`}>WhatsApp</a>
                          <CopyButton label="Copier le lien" text={link} />
                          <form action={markLinkSent}><input type="hidden" name="member_id" value={m.id} /><button>Marquer traité</button></form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="panel">
        <h2>Répartition des cartes</h2>
        <div className="bars">
          {bars.map(([k, color]) => (
            <div key={k}>
              <label>{STATUS_LABELS[k]}</label>
              <div className="bar"><i style={{ width: `${(count(k) / max) * 100}%`, background: color }} /></div>
              <em>{count(k)}</em>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Derniers membres</h2>
        <div className="tablewrap">
          <table>
            <thead><tr><th>N°</th><th>Nom</th><th>Téléphone</th><th>Statut</th></tr></thead>
            <tbody>
              {rows.slice(0, 6).map((r) => (
                <tr key={r.id}>
                  <td>{r.card_number || '—'}</td>
                  <td><Link href={`/carte/${r.token}`} target="_blank">{r.members.first_name} {r.members.last_name}</Link></td>
                  <td>{r.members.phone}</td>
                  <td><span className={`pill ${r.st}`}>{STATUS_LABELS[r.st]}</span></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={4} className="empty">Aucun membre pour le moment.</td></tr>}
            </tbody>
          </table>
        </div>
        <p style={{ margin: '14px 0 0' }}><Link className="btnlink" href="/admin/membres">Voir tous les membres</Link></p>
      </div>
    </>
  );
}
