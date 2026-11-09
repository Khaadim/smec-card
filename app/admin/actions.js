'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { getSite } from '@/lib/settings';

/* ---------------- Connexion / déconnexion ---------------- */

export async function login(formData) {
  const anon = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
  });
  if (error || !data.session) redirect('/admin/login?e=1');

  const { data: a } = await admin().from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!a) redirect('/admin/login?e=2');

  (await cookies()).set('smec-admin', data.session.access_token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: data.session.expires_in || 3600, secure: process.env.NODE_ENV === 'production',
  });
  redirect('/admin');
}

export async function logout() {
  (await cookies()).delete('smec-admin');
  redirect('/admin/login');
}

/* ---------------- Mot de passe oublié ---------------- */

export async function requestReset(formData) {
  const email = String(formData.get('email') || '').trim();
  if (email) {
    // On n'envoie le lien que pour un compte administrateur (et on ne révèle jamais s'il existe)
    const { data: a } = await admin().from('admin_users').select('user_id').ilike('email', email.replace(/[%_]/g, '')).maybeSingle();
    if (a) {
      const anon = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
      const { siteUrl: site } = await getSite();
      await anon.auth.resetPasswordForEmail(email, { redirectTo: `${site}/admin/nouveau-mot-de-passe` });
    }
  }
  redirect('/admin/mot-de-passe-oublie?sent=1');
}

export async function resetPassword(prev, formData) {
  const token = String(formData.get('token') || '');          // jeton reçu dans l'adresse (après le #)
  const tokenHash = String(formData.get('token_hash') || ''); // jeton reçu dans l'adresse (?token_hash=)
  const pw = String(formData.get('password') || '');
  const pw2 = String(formData.get('confirm') || '');
  const expired = { error: 'Lien invalide ou expiré. Refaites une demande de réinitialisation.' };

  if (!token && !tokenHash) return expired;
  // Les vérifications du mot de passe viennent AVANT l'utilisation du jeton : une faute de frappe ne le "brûle" pas
  if (pw.length < 10) return { error: 'Le mot de passe doit contenir au moins 10 caractères.' };
  if (pw !== pw2) return { error: 'Les deux mots de passe ne correspondent pas.' };

  const sb = admin();
  let user = null;
  if (tokenHash) {
    const anon = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await anon.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
    if (error || !data?.user) return expired;
    user = data.user;
  } else {
    const { data, error } = await sb.auth.getUser(token);
    if (error || !data?.user) return expired;
    user = data.user;
  }

  const { data: a } = await sb.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!a) return { error: "Ce compte n'a pas accès à l'administration." };

  const { error: e2 } = await sb.auth.admin.updateUserById(user.id, { password: pw });
  if (e2) return { error: 'Impossible de changer le mot de passe. Choisissez-en un différent de l’ancien.' };

  await sb.from('audit_log').insert({ admin_id: user.id, action: 'reset_password', target_id: user.id });
  redirect('/admin/login?ok=reset');
}

/* ---------------- Outils internes ---------------- */

async function requireAdmin() {
  const me = await getAdmin();
  if (!me) redirect('/admin/login');
  return me;
}

const fail = (url, msg) => redirect(`${url}?e=${encodeURIComponent(msg)}`);
const METHODS = ['cash', 'wave', 'orange_money', 'mobile_money', 'other'];
const hasFile = (f) => f && typeof f !== 'string' && f.size > 0;

function readFields(f) {
  return {
    first_name: String(f.get('first_name') || '').trim(),
    last_name: String(f.get('last_name') || '').trim(),
    phone: String(f.get('phone') || '').trim(),
    email: String(f.get('email') || '').trim(),
  };
}

function checkFields(v) {
  if (!v.first_name || !v.last_name) return 'Prénom et nom obligatoires.';
  if (!/^\+?[0-9 ]{8,16}$/.test(v.phone)) return 'Numéro de téléphone invalide.';
  if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return 'E-mail invalide.';
  return null;
}

function checkPhoto(file) {
  if (!['image/jpeg', 'image/png'].includes(file.type)) return 'Photo : JPG ou PNG uniquement.';
  if (file.size > 4 * 1024 * 1024) return 'Photo trop lourde (4 Mo maximum).';
  return null;
}

async function savePhoto(sb, file) {
  const path = `${crypto.randomUUID()}.${file.type === 'image/png' ? 'png' : 'jpg'}`;
  const { error } = await sb.storage.from('photos').upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type });
  return error ? null : path;
}

const refresh = () => revalidatePath('/admin', 'layout');

/* ---------------- CRÉER un membre (paiement hors ligne) ---------------- */

export async function createMember(formData) {
  const me = await requireAdmin();
  const sb = admin();
  const BACK = '/admin/membres/nouveau';

  const v = readFields(formData);
  const err = checkFields(v);
  if (err) fail(BACK, err);

  const file = formData.get('photo');
  if (hasFile(file)) {
    const pe = checkPhoto(file);
    if (pe) fail(BACK, pe);
  }

  const { data: dup } = await sb.from('members').select('id').eq('phone', v.phone).limit(1);
  if (dup?.length) fail(BACK, 'Un membre avec ce numéro existe déjà.');

  let photo_path = null;
  if (hasFile(file)) {
    photo_path = await savePhoto(sb, file);
    if (!photo_path) fail(BACK, "Échec de l'envoi de la photo.");
  }

  const { data: member, error: e1 } = await sb.from('members').insert({ ...v, email: v.email || null, photo_path }).select().single();
  if (e1) fail(BACK, "Erreur lors de l'enregistrement du membre.");

  const { data: card, error: e2 } = await sb.from('cards').insert({ member_id: member.id }).select().single();
  if (e2) fail(BACK, 'Erreur lors de la création de la carte.');

  const amount = Math.max(0, parseInt(String(formData.get('amount') || '0'), 10) || 0);
  const m = String(formData.get('method') || 'cash');
  const method = METHODS.includes(m) ? m : 'cash';

  await sb.from('payments').insert({ member_id: member.id, card_id: card.id, amount, method, status: 'paid', paid_at: new Date().toISOString() });
  await sb.rpc('activate_card', { p_card_id: card.id });
  await sb.from('audit_log').insert({ admin_id: me.id, action: 'create_member', target_id: member.id, details: { method, amount } });

  refresh();
  redirect(`/admin/membres/${member.id}?ok=created`);
}

/* ---------------- MODIFIER un membre ---------------- */

export async function updateMember(formData) {
  const me = await requireAdmin();
  const sb = admin();
  const id = String(formData.get('id'));
  const BACK = `/admin/membres/${id}`;

  const v = readFields(formData);
  const err = checkFields(v);
  if (err) fail(BACK, err);

  const file = formData.get('photo');
  if (hasFile(file)) {
    const pe = checkPhoto(file);
    if (pe) fail(BACK, pe);
  }

  const { data: old } = await sb.from('members').select('photo_path').eq('id', id).maybeSingle();
  if (!old) fail('/admin/membres', 'Membre introuvable.');

  const { data: dup } = await sb.from('members').select('id').eq('phone', v.phone).neq('id', id).limit(1);
  if (dup?.length) fail(BACK, 'Ce numéro est déjà utilisé par un autre membre.');

  const patch = { ...v, email: v.email || null };
  if (hasFile(file)) {
    const path = await savePhoto(sb, file);
    if (!path) fail(BACK, "Échec de l'envoi de la photo.");
    patch.photo_path = path;
  }

  const { error } = await sb.from('members').update(patch).eq('id', id);
  if (error) fail(BACK, "Erreur lors de l'enregistrement.");

  if (patch.photo_path && old.photo_path) await sb.storage.from('photos').remove([old.photo_path]);
  await sb.from('audit_log').insert({ admin_id: me.id, action: 'update_member', target_id: id, details: { photo_changed: !!patch.photo_path } });

  refresh();
  redirect(`${BACK}?ok=updated`);
}

/* ---------------- SUPPRIMER un membre ---------------- */

export async function deleteMember(formData) {
  const me = await requireAdmin();
  const sb = admin();
  const id = String(formData.get('id'));

  const { data: m } = await sb.from('members').select('first_name, last_name, phone, photo_path').eq('id', id).maybeSingle();
  if (!m) fail('/admin/membres', 'Membre introuvable.');

  // La carte et les paiements du membre sont supprimés avec lui (suppression en cascade)
  const { error } = await sb.from('members').delete().eq('id', id);
  if (error) fail('/admin/membres', 'Suppression impossible.');

  if (m.photo_path) await sb.storage.from('photos').remove([m.photo_path]);
  await sb.from('audit_log').insert({ admin_id: me.id, action: 'delete_member', target_id: id, details: { name: `${m.first_name} ${m.last_name}`, phone: m.phone } });

  refresh();
  redirect('/admin/membres?ok=deleted');
}

/* ---------------- Confirmer / refuser un paiement ---------------- */

export async function confirmPayment(formData) {
  const me = await requireAdmin();
  const sb = admin();
  const id = String(formData.get('payment_id'));
  const { data: p } = await sb.from('payments').select('*').eq('id', id).maybeSingle();
  if (!p) return;

  if (p.status !== 'paid') await sb.from('payments').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
  if (p.card_id) {
    const { data: c } = await sb.from('cards').select('status').eq('id', p.card_id).maybeSingle();
    if (c && c.status === 'pending_payment') await sb.rpc('activate_card', { p_card_id: p.card_id });
  }
  await sb.from('audit_log').insert({ admin_id: me.id, action: 'confirm_payment', target_id: id, details: { method: p.method, amount: p.amount } });
  refresh();
}

export async function rejectPayment(formData) {
  const me = await requireAdmin();
  const id = String(formData.get('payment_id'));
  await admin().from('payments').update({ status: 'failed' }).eq('id', id).eq('status', 'pending');
  await admin().from('audit_log').insert({ admin_id: me.id, action: 'reject_payment', target_id: id });
  refresh();
}

export async function markLinkSent(formData) {
  const me = await requireAdmin();
  const id = String(formData.get('member_id'));
  await admin().from('audit_log').insert({ admin_id: me.id, action: 'card_link_sent', target_id: id });
  refresh();
}

/* ---------------- Paramètres modifiables ---------------- */

export async function saveSettings(formData) {
  const me = await requireAdmin();
  const BACK = '/admin/parametres';
  const t = (k, max = 200) => String(formData.get(k) || '').trim().slice(0, max);

  const price = parseInt(String(formData.get('price') || ''), 10);
  if (!Number.isFinite(price) || price < 0 || price > 1000000) fail(BACK, 'Prix invalide (entre 0 et 1 000 000 FCFA).');

  const email = t('email');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fail(BACK, 'E-mail invalide.');

  const whatsapp = t('whatsapp', 30).replace(/\D/g, '');
  if (whatsapp && (whatsapp.length < 9 || whatsapp.length > 15)) fail(BACK, 'Numéro WhatsApp invalide : chiffres avec indicatif, par exemple 221771234567.');

  const links = {};
  for (const k of ['instagram', 'facebook', 'linkedin']) {
    const v = t(k, 300);
    if (v && !/^https:\/\//i.test(v)) fail(BACK, `Le lien ${k} doit commencer par https://`);
    links[k] = v;
  }

  const validityMode = String(formData.get('validityMode') || 'end_of_year') === 'months' ? 'months' : 'end_of_year';
  const validityMonths = parseInt(String(formData.get('validityMonths') || '12'), 10);
  if (validityMode === 'months' && !(validityMonths >= 1 && validityMonths <= 60)) fail(BACK, 'La durée de validité doit être comprise entre 1 et 60 mois.');

  const cardPrefix = t('cardPrefix', 20).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cardPrefix.length < 2 || cardPrefix.length > 10) fail(BACK, 'Le préfixe du numéro doit contenir 2 à 10 lettres ou chiffres (sans espace ni tiret).');
  const cardDigits = parseInt(String(formData.get('cardDigits') || '4'), 10);
  if (!(cardDigits >= 3 && cardDigits <= 8)) fail(BACK, 'Le nombre de chiffres du numéro doit être compris entre 3 et 8.');
  const cardIncludeYear = formData.get('cardIncludeYear') === 'on';

  let siteUrl = t('siteUrl', 200);
  if (siteUrl) {
    let u;
    try { u = new URL(siteUrl); } catch { fail(BACK, "Adresse du site invalide : écrivez par exemple https://smec-card.vercel.app"); }
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) fail(BACK, "L'adresse du site doit commencer par https://");
    siteUrl = u.origin;
  }

  const data = {
    price, tagline: t('tagline', 250), motto: t('motto', 150), email, whatsapp, ...links,
    waveNumber: t('waveNumber', 30), orangeNumber: t('orangeNumber', 30), cashPlace: t('cashPlace', 150),
    validityMode, validityMonths: Number.isFinite(validityMonths) ? validityMonths : 12,
    cardPrefix, cardDigits, cardIncludeYear, siteUrl,
  };

  const { error } = await admin().from('app_settings').upsert({ id: 1, data, updated_at: new Date().toISOString(), updated_by: me.id });
  if (error) fail(BACK, "Enregistrement impossible : la table des paramètres n'existe peut-être pas encore (exécutez le script settings.sql dans Supabase).");

  await admin().from('audit_log').insert({ admin_id: me.id, action: 'update_settings', details: { price } });
  revalidateTag('settings');
  refresh();
  redirect(`${BACK}?ok=1`);
}

/* ---------------- Révoquer / réactiver une carte ---------------- */

export async function changeCardStatus(formData) {
  const me = await requireAdmin();
  const cardId = String(formData.get('card_id'));
  const action = String(formData.get('action'));
  const reason = String(formData.get('reason') || '').trim();
  const sb = admin();

  if (action === 'revoke') {
    if (!reason) return; // motif obligatoire
    await sb.from('cards').update({ status: 'revoked', revoked_reason: reason }).eq('id', cardId);
    await sb.from('audit_log').insert({ admin_id: me.id, action: 'revoke_card', target_id: cardId, details: { reason } });
  } else if (action === 'reactivate') {
    const { data: c } = await sb.from('cards').select('card_number').eq('id', cardId).single();
    await sb.from('cards').update({ status: c?.card_number ? 'active' : 'pending_payment', revoked_reason: null }).eq('id', cardId);
    await sb.from('audit_log').insert({ admin_id: me.id, action: 'reactivate_card', target_id: cardId });
  }
  refresh();
}
