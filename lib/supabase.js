import { createClient } from '@supabase/supabase-js';

// Client serveur uniquement (clé secrète) : ne jamais l'importer dans un composant "use client"
export const admin = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

export async function photoUrl(sb, path) {
  if (!path) return null;
  const { data } = await sb.storage.from('photos').createSignedUrl(path, 3600);
  return data?.signedUrl || null;
}

export function computeStatus(card) {
  if (card.status === 'active' && card.expires_at && new Date(card.expires_at) < new Date()) return 'expired';
  return card.status;
}

export const STATUS_LABELS = {
  active: 'Actif',
  expired: 'Expiré',
  revoked: 'Révoqué',
  pending_payment: 'Paiement en attente',
};
