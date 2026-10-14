import { ImageResponse } from 'next/og';
import QRCode from 'qrcode';
import { admin, computeStatus, STATUS_LABELS } from './supabase';

const COLORS = { active: '#1e9e4f', expired: '#e04545', revoked: '#333333', pending_payment: '#f0a020' };

// Génère l'image PNG de la carte (800 x 1200). Retourne null si la carte n'existe pas ou n'est pas payée.
export async function renderCardPng(token) {
  const sb = admin();
  const { data: card } = await sb.from('cards').select('*, members(*)').eq('token', token).maybeSingle();
  if (!card || !card.card_number) return null;

  const m = card.members;
  const status = computeStatus(card);

  let photo = null;
  if (m.photo_path) {
    const { data: blob } = await sb.storage.from('photos').download(m.photo_path);
    if (blob) {
      const buf = Buffer.from(await blob.arrayBuffer());
      photo = `data:${blob.type || 'image/jpeg'};base64,${buf.toString('base64')}`;
    }
  }

  const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  const qr = await QRCode.toDataURL(`${site}/verifier/${token}`, { width: 400, margin: 1 });
  const expiry = card.expires_at ? new Date(card.expires_at).toLocaleDateString('fr-FR') : '—';

  const image = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#eef4fc' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#0a2a5e', color: '#ffffff', padding: '40px 0 30px' }}>
          <div style={{ display: 'flex', fontSize: 72, letterSpacing: 4 }}>SMEC</div>
          <div style={{ display: 'flex', fontSize: 26, color: '#9db6e0' }}>School of Medicine English Club</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, padding: '34px 40px 0' }}>
          {photo ? (
            <img src={photo} width={240} height={240} style={{ borderRadius: 32, objectFit: 'cover' }} />
          ) : (
            <div style={{ display: 'flex', width: 240, height: 240, borderRadius: 32, background: '#dde6f5' }} />
          )}
          <div style={{ display: 'flex', fontSize: 46, color: '#0a2a5e', marginTop: 22 }}>{`${m.first_name} ${m.last_name}`}</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#33466b', marginTop: 8 }}>{`N° membre : ${card.card_number}`}</div>
          <div style={{ display: 'flex', fontSize: 26, color: '#33466b', marginTop: 4 }}>{m.phone}</div>
          <div style={{ display: 'flex', fontSize: 28, color: '#ffffff', background: COLORS[status], borderRadius: 40, padding: '6px 34px', marginTop: 16 }}>
            {STATUS_LABELS[status]}
          </div>
          <div style={{ display: 'flex', fontSize: 24, color: '#33466b', marginTop: 12 }}>{`Date d'expiration : ${expiry}`}</div>
          <div style={{ display: 'flex', background: '#ffffff', borderRadius: 16, padding: 12, marginTop: 20 }}>
            <img src={qr} width={260} height={260} />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', background: '#0a2a5e', color: '#9db6e0', fontSize: 26, padding: '22px 0' }}>
          Learn · Connect · Grow
        </div>
      </div>
    ),
    { width: 800, height: 1200 }
  );

  return { buffer: await image.arrayBuffer(), filename: `carte-${card.card_number}` };
}
