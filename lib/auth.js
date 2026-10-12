import { cookies } from 'next/headers';
import { admin } from './supabase';

// Retourne l'administrateur connecté, ou null
export async function getAdmin() {
  const token = (await cookies()).get('smec-admin')?.value;
  if (!token) return null;
  const sb = admin();
  const { data } = await sb.auth.getUser(token);
  if (!data?.user) return null;
  const { data: a } = await sb.from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
  return a ? data.user : null;
}
