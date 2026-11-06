import { admin } from '@/lib/supabase';
import { site, paymentMode } from '@/lib/site';

const METHODS = ['cash', 'wave', 'orange_money'];

export async function POST(req) {
  const sb = admin();
  const f = await req.formData();
  const first_name = String(f.get('first_name') || '').trim();
  const last_name = String(f.get('last_name') || '').trim();
  const phone = String(f.get('phone') || '').trim();
  const email = String(f.get('email') || '').trim() || null;
  const photo = f.get('photo');
  const m = String(f.get('method') || 'cash');
  const method = METHODS.includes(m) ? m : 'cash';
  const mode = paymentMode();

  if (!first_name || !last_name) return Response.json({ error: 'Prénom et nom obligatoires.' }, { status: 400 });
  if (!/^\+?[0-9 ]{8,16}$/.test(phone)) return Response.json({ error: 'Numéro de téléphone invalide.' }, { status: 400 });
  if (!photo || typeof photo === 'string' || photo.size === 0) return Response.json({ error: 'Photo obligatoire.' }, { status: 400 });
  if (!['image/jpeg', 'image/png'].includes(photo.type)) return Response.json({ error: 'Photo : JPG ou PNG uniquement.' }, { status: 400 });
  if (photo.size > 4 * 1024 * 1024) return Response.json({ error: 'Photo trop lourde (4 Mo maximum).' }, { status: 400 });
  if (mode !== 'manual' && mode !== 'simulation') return Response.json({ error: 'Paiement en ligne non encore configuré.' }, { status: 501 });

  // Doublon : même téléphone avec une carte active ou une demande en cours
  const { data: dup } = await sb.from('members').select('id, cards(status, expires_at)').eq('phone', phone);
  if (dup?.some((x) => x.cards?.some((c) => c.status === 'pending_payment' || (c.status === 'active' && new Date(c.expires_at) > new Date()))))
    return Response.json({ error: 'Ce numéro possède déjà une carte ou une demande en cours.' }, { status: 409 });

  const photo_path = `${crypto.randomUUID()}.${photo.type === 'image/png' ? 'png' : 'jpg'}`;
  const up = await sb.storage.from('photos').upload(photo_path, Buffer.from(await photo.arrayBuffer()), { contentType: photo.type });
  if (up.error) return Response.json({ error: "Échec de l'envoi de la photo." }, { status: 500 });

  const { data: member, error: e1 } = await sb.from('members').insert({ first_name, last_name, phone, email, photo_path }).select().single();
  if (e1) return Response.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });

  const { data: card, error: e2 } = await sb.from('cards').insert({ member_id: member.id }).select().single();
  if (e2) return Response.json({ error: 'Erreur lors de la création de la carte.' }, { status: 500 });

  const { data: payment } = await sb.from('payments')
    .insert({ member_id: member.id, card_id: card.id, amount: site.price, method: mode === 'simulation' ? 'simulation' : method }).select().single();

  if (mode === 'simulation') {
    await sb.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', payment.id);
    await sb.rpc('activate_card', { p_card_id: card.id });
  }
  // Mode "manual" : le paiement reste « en attente » jusqu'à confirmation par un administrateur

  return Response.json({ token: card.token });
}
