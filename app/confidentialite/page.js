import { site } from '@/lib/site';

export const metadata = { title: 'Politique de confidentialité – SMEC' };

// Modèle à relire et à adapter par l'association (durées de conservation, mentions légales).
export default function Confidentialite() {
  const contact = site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : "l'équipe SMEC";
  return (
    <div className="box info">
      <h1>Politique de confidentialité</h1>
      <p>{site.name} – {site.fullName} s'engage à protéger les données personnelles de ses membres. Voici ce que nous collectons et pourquoi.</p>

      <h2>Données collectées</h2>
      <ul>
        <li>Prénom, nom, numéro de téléphone et, si vous le fournissez, adresse e-mail.</li>
        <li>Votre photo d'identité.</li>
        <li>Les informations de paiement (montant, mode, référence). Nous ne conservons pas votre numéro de carte bancaire : le paiement est traité par un prestataire spécialisé.</li>
      </ul>

      <h2>Pourquoi ces données ?</h2>
      <p>Pour créer et gérer votre carte de membre, vérifier sa validité et suivre les adhésions.</p>

      <h2>Ce qui est visible lorsqu'on scanne votre QR code</h2>
      <p>Votre photo, votre prénom, votre nom, votre numéro de membre, le statut de votre carte et sa date d'expiration. Votre numéro de téléphone et votre e-mail ne sont jamais affichés.</p>

      <h2>Qui a accès à vos données ?</h2>
      <p>Les administrateurs de {site.name}, ainsi que nos prestataires techniques (hébergement, base de données, paiement) dans la mesure nécessaire au fonctionnement du service.</p>

      <h2>Durée de conservation</h2>
      <p>[À compléter par l'association : par exemple, pendant la durée de l'adhésion puis X mois.]</p>

      <h2>Vos droits</h2>
      <p>Vous pouvez demander l'accès à vos données, leur correction ou leur suppression en contactant {contact}.</p>

      <h2>Sécurité</h2>
      <p>Les échanges sont chiffrés (HTTPS), les photos ne sont pas accessibles par un lien public, et l'accès à l'administration est protégé par identifiant et mot de passe.</p>

      <p className="muted">Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}.</p>
    </div>
  );
}
