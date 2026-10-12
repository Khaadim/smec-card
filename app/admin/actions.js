'use server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { admin } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';

export async function login(formData) {
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({
    email: String(formData.get('email') || '').trim(),
    password: String(formData.get('password') || ''),
  });
  if (error || !data.session) redirect('/admin/login?e=1');

  const { data: a } = await admin().from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!a) redirect('/admin/login?e=2');

  (await cookies()).set('smec-admin', data.session.access_token, {
    httpOnly: true, sameSite: 'lax', path: '/', maxAge: 3600, secure: process.env.NODE_ENV === 'production',
  });
  redirect('/admin');
}

export async function logout() {
  (await cookies()).delete('smec-admin');
  redirect('/admin/login');
}

export async function changeCardStatus(formData) {
  const me = await getAdmin();
  if (!me) redirect('/admin/login');

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
  revalidatePath('/admin');
}
