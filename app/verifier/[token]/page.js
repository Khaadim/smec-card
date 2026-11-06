import { admin, photoUrl, STATUS_LABELS } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function VerifyPage({ params }) {
  const { token } = await params;
  const sb = admin();
  const { data: r } = await sb.rpc('verify_card', { p_token: token });

  if (!r?.found) {
    return <div className="box card"><p className="big" style={{ color: '#e04545' }}>✕ CARTE INTROUVABLE</p><p className="muted">Ce QR code ne correspond à aucune carte SMEC.</p></div>;
  }

  const photo = await photoUrl(sb, r.photo_path);
  const valid = r.status === 'active';

  return (
    <div className="box card">
      <p className="big" style={{ color: valid ? '#1e9e4f' : '#e04545' }}>
        {valid ? '✔ CARTE SMEC VALIDE' : `✕ CARTE NON VALIDE`}
      </p>
      {photo && <img className="photo" src={photo} alt="" />}
      <h2>{r.first_name} {r.last_name}</h2>
      <p className="muted">N° membre : {r.card_number || '—'}</p>
      <span className={`badge ${r.status}`}>{STATUS_LABELS[r.status]}</span>
      {r.expires_at && <p className="muted">Date d'expiration : {new Date(r.expires_at).toLocaleDateString('fr-FR')}</p>}
      <p className="muted" style={{ fontSize: 12 }}>Vérification effectuée le {new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Africa/Dakar' })}</p>
    </div>
  );
}
