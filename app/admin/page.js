import Link from 'next/link';
import { redirect } from 'next/navigation';
import { admin, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import Icon from './icons';

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
