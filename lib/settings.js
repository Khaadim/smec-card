import { unstable_cache } from 'next/cache';
import { admin } from './supabase';
import { site as defaults } from './site';

// Paramètres que l'administrateur peut modifier
export const EDITABLE = [
  'price', 'tagline', 'motto', 'email', 'whatsapp', 'instagram', 'facebook', 'linkedin',
  'waveNumber', 'orangeNumber', 'cashPlace',
  'validityMode', 'validityMonths', 'cardPrefix', 'cardDigits', 'cardIncludeYear', 'siteUrl',
];

// Lecture brute dans la base (sans cache). "missing" = la table n'existe pas encore.
export async function getSettingsState() {
  try {
    const { data, error } = await admin().from('app_settings').select('data').eq('id', 1).maybeSingle();
    if (error) return { missing: true, data: {} };
    return { missing: false, data: data?.data || {} };
  } catch {
    return { missing: true, data: {} };
  }
}

const cached = unstable_cache(getSettingsState, ['app-settings'], { tags: ['settings'], revalidate: 300 });

const clamp = (n, lo, hi, d) => (Number.isFinite(Number(n)) ? Math.min(hi, Math.max(lo, Math.round(Number(n)))) : d);

// Paramètres du site = valeurs par défaut (lib/site.js) + valeurs modifiées dans l'administration
export async function getSite() {
  const { data } = await cached();
  const out = { ...defaults };
  for (const k of EDITABLE) if (data[k] !== undefined && data[k] !== null) out[k] = data[k];
  out.price = Number(out.price) || defaults.price;
  out.validityMonths = clamp(out.validityMonths, 1, 60, 12);
  out.cardDigits = clamp(out.cardDigits, 3, 8, 4);
  out.cardIncludeYear = out.cardIncludeYear !== false;
  out.siteUrl = String(out.siteUrl || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || '').replace(/\/+$/, '');
  return out;
}

export const validityLabel = (s) =>
  s.validityMode === 'months' ? `${s.validityMonths} mois à partir de l'activation` : "jusqu'au 31 décembre de l'année d'émission";

export const validityShort = (s) =>
  s.validityMode === 'months' ? `valable ${s.validityMonths} mois` : "valable jusqu'au 31 décembre";

export const numberExample = (s, n = 42) =>
  `${s.cardPrefix}-${s.cardIncludeYear ? new Date().getFullYear() + '-' : ''}${String(n).padStart(s.cardDigits, '0')}`;
