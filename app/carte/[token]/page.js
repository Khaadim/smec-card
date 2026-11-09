import QRCode from 'qrcode';
import { admin, photoUrl, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { METHOD_LABELS } from '@/lib/site';
import { getSite } from '@/lib/settings';
import Brand from '../../Brand';

export const dynamic = 'force-dynamic';

const btn = { display: 'block', padding: '12px', borderRadius: 10, background: '#1d5fd1', color: '#fff', fontWeight: 700, textDecoration: 'none', textAlign: 'center' };

function instructions(method, site) {
  const amount = `${site.price.toLocaleString('fr-FR')} FCFA`;
  if (method === 'wave') return site.waveNumber ? `Envoyez ${amount} par Wave au ${site.waveNumber}.` : `Envoyez ${amount} par Wave. L'équipe SMEC vous communiquera le numéro.`;
  if (method === 'orange_money') return site.orangeNumber ? `Envoyez ${amount} par Orange Money au ${site.orangeNumber}.` : `Envoyez ${amount} par Orange Money. L'équipe SMEC vous communiquera le numéro.`;
  return `Remettez ${amount} en espèces à l'équipe SMEC${site.cashPlace ? ` (${site.cashPlace})` : ''}.`;
}

export default async function CardPage({ params }) {
  const { token } = await params;
  const site = await getSite();
  const sb = admin();
  const { data: card } = await sb.from('cards').select('*, members(*)').eq('token', token).maybeSingle();
  if (!card) return <div className="box">Carte introuvable.</div>;

  const m = card.members;
  const status = computeStatus(card);
  const photo = await photoUrl(sb, m.photo_path);
  const siteUrl = site.siteUrl;
  const qr = await QRCode.toDataURL(`${siteUrl}/verifier/${token}`, { width: 360, margin: 1 });

  let pending = null;
  if (card.status === 'pending_payment') {
    const { data: pays } = await sb.from('payments').select('*').eq('card_id', card.id).order('created_at', { ascending: false }).limit(1);
    pending = pays?.[0] || null;
  }

  return (
    <div className="box card">
      <div className="cardtop"><Brand size={56} /></div>
      {photo && <img className="photo" src={photo} alt="" />}
      <h2>{m.first_name} {m.last_name}</h2>
      <p className="muted">N° membre : {card.card_number || '—'}</p>
      <p className="muted">{m.phone}</p>
      <span className={`badge ${status}`}>{STATUS_LABELS[status]}</span>

      {pending && (
        <div className="paybox">
          <b>Paiement en attente de confirmation</b>
          <p>Montant : {pending.amount.toLocaleString('fr-FR')} FCFA · Mode : {METHOD_LABELS[pending.method] || pending.method}</p>
          <p>Référence : <b>{pending.id.slice(0, 6).toUpperCase()}</b> (à indiquer avec votre paiement)</p>
          <p>{instructions(pending.method, site)}</p>
          <p>Votre carte sera activée dès que l'équipe SMEC aura confirmé le paiement. <b>Conservez cette page</b> (ajoutez-la à vos favoris) : actualisez-la ensuite pour voir votre carte.</p>
        </div>
      )}

      {card.expires_at && <p className="muted">Date d'expiration : {new Date(card.expires_at).toLocaleDateString('fr-FR')}</p>}
      {card.card_number && <img src={qr} alt="QR code" width={180} height={180} />}
      <p className="muted">{site.slogan}</p>

      {card.card_number && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
          <a style={btn} href={`/carte/${token}/png`}>Télécharger PNG</a>
          <a style={btn} href={`/carte/${token}/pdf`}>Télécharger PDF</a>
        </div>
      )}
    </div>
  );
}
