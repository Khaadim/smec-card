'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

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
      const site = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
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
