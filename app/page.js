import Link from 'next/link';
import { site } from '@/lib/site';

const STEPS = [
  ['1', 'Inscrivez-vous', 'Remplissez le formulaire avec votre photo.'],
  ['2', 'Choisissez votre paiement', 'Espèces, Wave ou Orange Money.'],
  ['3', 'Validation', "L'équipe SMEC confirme la réception de votre paiement."],
  ['4', 'Recevez votre carte', 'Carte numérique avec QR code, téléchargeable en PNG et PDF.'],
];
const WHY = [
  ['Gain de temps', "Plus besoin d'être présent pour remettre les cartes."],
  ['Sécurité', 'Chaque carte se vérifie en temps réel grâce à son QR code.'],
  ['Partout avec vous', 'Sur téléphone, tablette ou ordinateur.'],
  ['Écologique', 'Moins de papier, moins d’impression.'],
];

export default function Accueil() {
  return (
    <>
      <section className="bleed hero">
        <div className="hero-in">
          <img className="hero-badge" src="/logo.png" alt="SMEC – School of Medicine English Club" />
          <h1>Votre carte de membre numérique</h1>
          <p className="motto">{site.motto}</p>
          <p className="lead">Simple · Rapide · Sécurisée. Obtenez votre carte SMEC en quelques minutes et gardez-la toujours avec vous.</p>
          <div className="hero-btns">
            <Link className="cta" href="/inscription">Demander ma carte – {site.price.toLocaleString('fr-FR')} FCFA</Link>
            <Link className="cta ghost" href="/aide">Comment ça marche ?</Link>
          </div>
        </div>
      </section>

      <section className="land">
        <h2>Comment ça marche</h2>
        <div className="grid4">
          {STEPS.map(([n, t, d]) => (
            <div className="tile" key={n}><span className="num">{n}</span><b>{t}</b><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="land">
        <h2>Pourquoi une carte numérique ?</h2>
        <div className="grid4">
          {WHY.map(([t, d]) => (
            <div className="tile alt" key={t}><b>{t}</b><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="land band">
        <h2>Prêt à rejoindre SMEC ?</h2>
        <p>{site.tagline}</p>
        <Link className="cta" href="/inscription">Demander ma carte</Link>
      </section>
    </>
  );
}
