import { login } from '../actions';

export default async function LoginPage({ searchParams }) {
  const { e } = await searchParams;
  return (
    <div className="box">
      <h2 style={{ marginTop: 0 }}>Espace administration</h2>
      <form action={login}>
        <label>E-mail</label>
        <input name="email" type="email" required />
        <label>Mot de passe</label>
        <input name="password" type="password" required />
        <button>Se connecter</button>
        {e === '1' && <p className="err">E-mail ou mot de passe incorrect.</p>}
        {e === '2' && <p className="err">Ce compte n'a pas accès à l'administration.</p>}
      </form>
    </div>
  );
}
