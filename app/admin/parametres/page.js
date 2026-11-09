import { Fragment } from 'react';
import { redirect } from 'next/navigation';
import { admin } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { getSite, getSettingsState, numberExample } from '@/lib/settings';
import { paymentMode } from '@/lib/site';
import { saveSettings } from '../actions';

export const dynamic = 'force-dynamic';

export default async function Parametres({ searchParams }) {
  const me = await getAdmin();
  if (!me) redirect('/admin/login');
  const { ok, e } = await searchParams;
  const sb = admin();
  const [{ missing }, site, { data: admins }, { data: ver }] = await Promise.all([
    getSettingsState(),
    getSite(),
    sb.from('admin_users').select('email, role'),
    sb.rpc('smec_settings_version'),
  ]);
  const mode = paymentMode();
  const sqlV2 = ver === 2;

  return (
    <>
      <h1>Paramètres</h1>
      <p className="sub">Les modifications s'appliquent au site public dans les minutes qui suivent.</p>
      {ok && <div className="msg ok">Paramètres enregistrés.</div>}
      {e && <div className="msg err">{e}</div>}
      {missing && (
        <div className="msg err">La table des paramètres n'existe pas encore : exécutez le script <b>settings.sql</b> dans Supabase (SQL Editor) pour pouvoir enregistrer.</div>
      )}
      {!missing && !sqlV2 && (
        <div className="msg err">La durée de validité et le format du numéro ne s'appliqueront pas tant que le script <b>settings_v2.sql</b> n'a pas été exécuté dans Supabase (SQL Editor).</div>
      )}

      <form action={saveSettings}>
        <div className="two">
          <div>
            <div className="panel">
              <h2>Carte de membre</h2>
              <div className="fgrid">
                <label>Prix de la carte (FCFA)<input name="price" type="number" min="0" max="1000000" defaultValue={site.price} required /></label>
                <label>Durée de validité
                  <select name="validityMode" defaultValue={site.validityMode}>
                    <option value="end_of_year">Jusqu'au 31 décembre de l'année d'émission</option>
                    <option value="months">Un nombre de mois à partir de l'activation</option>
                  </select>
                </label>
                <label>Nombre de mois (si « mois » est choisi)<input name="validityMonths" type="number" min="1" max="60" defaultValue={site.validityMonths} /></label>
                <p className="sub" style={{ margin: 0 }}>Le prix et la durée s'appliquent aux nouvelles cartes. Les cartes déjà activées gardent leur date d'expiration.</p>
              </div>
            </div>

            <div className="panel">
              <h2>Format du numéro de carte</h2>
              <div className="fgrid">
                <label>Préfixe (2 à 10 lettres ou chiffres)<input name="cardPrefix" defaultValue={site.cardPrefix} maxLength={10} required /></label>
                <label>Nombre de chiffres du compteur (3 à 8)<input name="cardDigits" type="number" min="3" max="8" defaultValue={site.cardDigits} required /></label>
                <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" name="cardIncludeYear" defaultChecked={site.cardIncludeYear} style={{ width: 'auto' }} /> Inclure l'année dans le numéro
                </label>
                <p className="sub" style={{ margin: 0 }}>Exemple avec les valeurs enregistrées : <b>{numberExample(site)}</b>. Les numéros déjà attribués ne changent pas.</p>
              </div>
            </div>

            <div className="panel">
              <h2>Paiement</h2>
              <div className="fgrid">
                <label>Numéro Wave qui reçoit les paiements<input name="waveNumber" defaultValue={site.waveNumber} placeholder="77 123 45 67" /></label>
                <label>Numéro Orange Money qui reçoit les paiements<input name="orangeNumber" defaultValue={site.orangeNumber} placeholder="77 123 45 67" /></label>
                <label>Où remettre les espèces<input name="cashPlace" defaultValue={site.cashPlace} placeholder="lors de la prochaine séance du club" /></label>
              </div>
            </div>
          </div>

          <div>
            <div className="panel">
              <h2>Adresse du site</h2>
              <div className="fgrid">
                <label>Adresse publique du site<input name="siteUrl" defaultValue={site.siteUrl} placeholder="https://smec-card.vercel.app" /></label>
                <p className="sub" style={{ margin: 0 }}>
                  Cette adresse sert aux QR codes, aux liens envoyés aux membres et au lien de réinitialisation du mot de passe. Elle ne déplace pas le site : elle doit être l'adresse réelle où il est hébergé (Vercel).
                  Si vous la changez, mettez aussi à jour <b>Site URL</b> et <b>Redirect URLs</b> dans Supabase (Authentication &gt; URL Configuration). Les QR codes déjà téléchargés ou imprimés gardent l'ancienne adresse.
                </p>
              </div>
            </div>

            <div className="panel">
              <h2>Coordonnées et réseaux</h2>
              <div className="fgrid">
                <label>E-mail de contact<input name="email" type="email" defaultValue={site.email} placeholder="contact@smec.sn" /></label>
                <label>WhatsApp (chiffres avec indicatif)<input name="whatsapp" defaultValue={site.whatsapp} placeholder="221771234567" /></label>
                <label>Instagram (lien complet)<input name="instagram" defaultValue={site.instagram} placeholder="https://instagram.com/..." /></label>
                <label>Facebook (lien complet)<input name="facebook" defaultValue={site.facebook} placeholder="https://facebook.com/..." /></label>
                <label>LinkedIn (lien complet)<input name="linkedin" defaultValue={site.linkedin} placeholder="https://linkedin.com/..." /></label>
              </div>
            </div>

            <div className="panel">
              <h2>Textes du site</h2>
              <div className="fgrid">
                <label>Phrase d'accroche<input name="tagline" defaultValue={site.tagline} /></label>
                <label>Devise<input name="motto" defaultValue={site.motto} /></label>
              </div>
            </div>
          </div>
        </div>
        <button style={{ maxWidth: 320 }}>Enregistrer les paramètres</button>
      </form>

      <div className="panel" style={{ marginTop: 22 }}>
        <h2>Informations techniques (lecture seule)</h2>
        <dl className="kv">
          <dt>Mode de paiement</dt>
          <dd>{mode === 'simulation' ? 'Simulation (paiement validé automatiquement – tests uniquement)' : mode === 'manual' ? 'Manuel : espèces, Wave, Orange Money (confirmé par un administrateur)' : 'Réel (agrégateur de paiement)'}</dd>
          {(admins || []).map((a) => (
            <Fragment key={a.email}><dt>Administrateur</dt><dd>{a.email}{a.email === me.email ? ' (vous)' : ''}</dd></Fragment>
          ))}
        </dl>
        <p className="sub" style={{ margin: '14px 0 0' }}>Le mode de paiement se modifie dans Vercel (variable PAYMENT_MODE) ; les administrateurs, dans Supabase (table admin_users).</p>
      </div>
    </>
  );
}
