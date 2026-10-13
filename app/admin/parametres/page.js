import { Fragment } from 'react';
import { redirect } from 'next/navigation';
import { admin } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Parametres() {
  const me = await getAdmin();
  if (!me) redirect('/admin/login');
  const { data: admins } = await admin().from('admin_users').select('email, role');
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '—';
  const simulation = process.env.PAYMENT_MODE === 'simulation';

  return (
    <>
      <h1>Paramètres</h1>
      <p className="sub">Configuration actuelle de l'application (lecture seule)</p>

      <div className="panel">
        <h2>Carte de membre</h2>
        <dl className="kv">
          <dt>Prix de la carte</dt><dd>1 000 FCFA</dd>
          <dt>Validité</dt><dd>Jusqu'au 31 décembre de l'année d'émission</dd>
          <dt>Format du numéro</dt><dd>SMEC-AAAA-NNNN</dd>
        </dl>
      </div>

      <div className="panel">
        <h2>Paiement et site</h2>
        <dl className="kv">
          <dt>Mode de paiement</dt>
          <dd>{simulation ? 'Simulation (paiement validé automatiquement – tests uniquement)' : 'Réel'}</dd>
          <dt>Adresse du site</dt><dd>{site}</dd>
        </dl>
      </div>

      <div className="panel">
        <h2>Administrateurs</h2>
        <dl className="kv">
          {(admins || []).map((a) => (
            <Fragment key={a.email}><dt>{a.role}</dt><dd>{a.email}{a.email === me.email ? ' (vous)' : ''}</dd></Fragment>
          ))}
        </dl>
        <p className="sub" style={{ margin: '14px 0 0' }}>
          Pour modifier ces valeurs ou ajouter un administrateur, voir Vercel (variables d'environnement) et Supabase (table admin_users).
        </p>
      </div>
    </>
  );
}
