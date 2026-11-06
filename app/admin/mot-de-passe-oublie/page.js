import Link from 'next/link';
import { requestReset } from '../actions';

export default async function MotDePasseOublie({ searchParams }) {
  const { sent } = await searchParams;
  return (
    <div className="box">
      <h2 style={{ marginTop: 0 }}>Mot de passe oublié</h2>
      {sent ? (
        <p className="ok">Si cet e-mail correspond à un compte administrateur, un lien de réinitialisation vient d'être envoyé. Vérifiez aussi vos courriers indésirables. Le lien est à usage limité dans le temps.</p>
      ) : (
        <>
          <p className="muted">Saisissez l'e-mail de votre compte administrateur : nous vous enverrons un lien pour choisir un nouveau mot de passe.</p>
          <form action={requestReset}>
            <label>E-mail</label>
            <input name="email" type="email" required />
            <button>Envoyer le lien</button>
          </form>
        </>
      )}
      <Link className="link-sm" href="/admin/login">← Retour à la connexion</Link>
    </div>
  );
}
