'use server';
import { redirect } from 'next/navigation';
import { admin } from '@/lib/supabase';
import { sameNumber, digits } from '@/lib/phone';

// Enregistre une demande si les informations correspondent à un membre.
// Le lien n'est JAMAIS affiché ici : l'équipe le renvoie elle-même au membre (protection de la vie privée).
export async function requestCardLink(formData) {
  const first = String(formData.get('first_name') || '').trim().toLowerCase();
  const last = String(formData.get('last_name') || '').trim();
  const phone = String(formData.get('phone') || '');

  if (first && last && digits(phone).length >= 8) {
    const sb = admin();
    const { data: cands } = await sb.from('members').select('id, first_name, last_name, phone').ilike('last_name', last.replace(/[%_]/g, ''));
    const m = (cands || []).find((x) => sameNumber(x.phone, phone) && x.first_name.trim().toLowerCase() === first);
    if (m) {
      // Une seule demande par heure et par membre (anti-spam)
      const since = new Date(Date.now() - 3600 * 1000).toISOString();
      const { data: recent } = await sb.from('audit_log').select('id').eq('action', 'card_link_request').eq('target_id', m.id).gte('created_at', since).limit(1);
      if (!recent?.length) await sb.from('audit_log').insert({ action: 'card_link_request', target_id: m.id, details: {} });
    }
  }
  // Même réponse dans tous les cas : on ne révèle pas si une personne est membre
  redirect('/retrouver-ma-carte?sent=1');
}
