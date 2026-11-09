import Link from 'next/link';
import { getSite, validityLabel } from '@/lib/settings';

export const metadata = { title: 'Aide – SMEC' };

export default async function Aide() {
  const site = await getSite();
  const contact = site.email ? <a href={`mailto:${site.email}`}>{site.email}</a> : "l'équipe SMEC";
  return (
    <div className="box info">
      <h1>Aide et questions fréquentes</h1>

      <details open>
        <summary>Comment obtenir ma carte ?</summary>
        <p>Remplissez le <Link href="/inscription">formulaire de demande</Link> (nom, téléphone, photo) et indiquez comment vous payez : espèces, Wave ou Orange Money. Votre carte est activée dès que l'équipe SMEC a confirmé la réception de votre paiement.</p>
      </details>
      <details>
        <summary>Comment payer ?</summary>
        <p>Trois possibilités : en espèces auprès de l'équipe SMEC, par Wave, ou par Orange Money. Après votre inscription, la page de votre carte affiche le montant, une référence à indiquer avec votre paiement et les instructions.</p>
      </details>
      <details>
        <summary>Combien coûte la carte et combien de temps est-elle valable ?</summary>
        <p>La carte coûte {site.price.toLocaleString('fr-FR')} FCFA. Validité : {validityLabel(site)}.</p>
      </details>
      <details>
        <summary>J'ai payé, mais ma carte n'est pas active.</summary>
        <p>La confirmation est faite à la main par l'équipe : elle peut prendre un peu de temps. Actualisez la page de votre carte, et si rien ne change, contactez {contact} en indiquant votre nom, votre téléphone et la référence de votre paiement.</p>
      </details>
      <details>
        <summary>J'ai perdu le lien de ma carte, que faire ?</summary>
        <p>Conservez le lien dès que vous l'avez : ajoutez la page à vos favoris ou à l'écran d'accueil de votre téléphone, et téléchargez la carte en PNG ou en PDF. En cas de perte, faites une demande sur la page <Link href="/retrouver-ma-carte">Retrouver ma carte</Link> ou contactez {contact}.</p>
      </details>
      <details>
        <summary>Comment vérifier qu'une carte est valide ?</summary>
        <p>Scannez le QR code de la carte avec l'appareil photo d'un téléphone. Une page s'ouvre et indique si la carte est valide, expirée, révoquée ou en attente de paiement.</p>
      </details>
      <details>
        <summary>Quelle photo dois-je envoyer ?</summary>
        <p>Une photo d'identité récente, de face, au format JPG ou PNG (4 Mo maximum). Elle apparaîtra sur votre carte.</p>
      </details>
    </div>
  );
}
