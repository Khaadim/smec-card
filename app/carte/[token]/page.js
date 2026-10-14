import QRCode from 'qrcode';
import { admin, photoUrl, computeStatus, STATUS_LABELS } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const btn = { display: 'block', padding: '12px', borderRadius: 10, background: '#1d5fd1', color: '#fff', fontWeight: 700, textDecoration: 'none', textAlign: 'center' };

export default async function CardPage({ params }) {
  const { token } = await params;
  const sb = admin();
  const { data: card } = await sb.from('cards').select('*, members(*)').eq('token', token).maybeSingle();
  if (!card) return <div className="box">Carte introuvable.</div>;

  const m = card.members;
  const status = computeStatus(card);
  const photo = await photoUrl(sb, m.photo_path);
  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const qr = await QRCode.toDataURL(`${site}/verifier/${token}`, { width: 360, margin: 1 });

  return (
    <div className="box card">
      <p className="big" style={{ color: '#0a2a5e' }}>SMEC</p>
      {photo && <img className="photo" src={photo} alt="" />}
      <h2>{m.first_name} {m.last_name}</h2>
      <p className="muted">N° membre : {card.card_number || '—'}</p>
      <p className="muted">{m.phone}</p>
      <span className={`badge ${status}`}>{STATUS_LABELS[status]}</span>
      {card.expires_at && <p className="muted">Date d'expiration : {new Date(card.expires_at).toLocaleDateString('fr-FR')}</p>}
      <img src={qr} alt="QR code" width={180} height={180} />
      <p className="muted">Learn · Connect · Grow</p>

      {card.card_number && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <a style={btn} href={`/carte/${token}/png`}>Télécharger PNG</a>
          <a style={btn} href={`/carte/${token}/pdf`}>Télécharger PDF</a>
        </div>
      )}
    </div>
  );
}
