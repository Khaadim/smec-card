import { site } from '@/lib/site';
import { requestCardLink } from './actions';

export const metadata = { title: 'Retrouver ma carte – SMEC' };

export default async function RetrouverMaCarte({ searchParams }) {
  const { sent } = await searchParams;
  const wa = site.whatsapp
    ? `https://wa.me/${site.whatsapp}?text=${encodeURIComponent('Bonjour, j’ai perdu le lien de ma carte de membre SMEC. Pouvez-vous me le renvoyer ?')}`
    : null;

  return (
    <div className="box">
      <h2 style={{ marginTop: 0 }}>Retrouver ma carte</h2>
      {sent ? (
        <p className="ok">Demande enregistrée. Si ces informations correspondent à un membre, l'équipe SMEC vous renverra le lien de votre carte (par WhatsApp ou SMS, sur le numéro indiqué à l'inscription). Cela peut prendre un peu de temps.</p>
      ) : (
        <>
          <p className="muted">Par sécurité, le lien de la carte n'est pas affiché ici : il est renvoyé par l'équipe au membre concerné. Saisissez exactement les informations de votre inscription.</p>
          <form action={requestCardLink}>
            <label>Prénom *</label>
            <input name="first_name" required />
            <label>Nom *</label>
            <input name="last_name" required />
            <label>Numéro de téléphone utilisé à l'inscription *</label>
            <input name="phone" type="tel" placeholder="+221 77 123 45 67" required />
            <button>Demander le renvoi de mon lien</button>
          </form>
        </>
      )}
      {wa && <a className="link-sm" href={wa} target="_blank" rel="noopener noreferrer">Ou contactez l'équipe sur WhatsApp</a>}
    </div>
  );
}
