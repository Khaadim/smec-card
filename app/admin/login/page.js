import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { login } from '../actions';
import PasswordInput from '../../../PasswordInput';

export default async function LoginPage({ searchParams }) {
  if (await getAdmin()) redirect('/admin');
  const { e, ok } = await searchParams;
  return (
    <div className="box">
      <h2 style={{ marginTop: 0 }}>Espace administration</h2>
      {ok === 'reset' && <p className="ok">Mot de passe modifié. Vous pouvez vous connecter.</p>}
      <form action={login}>
        <label>E-mail</label>
        <input name="email" type="email" required />
        <label>Mot de passe</label>
        <PasswordInput name="password" required autoComplete="current-password" />
        <button>Se connecter</button>
        {e === '1' && <p className="err">E-mail ou mot de passe incorrect.</p>}
        {e === '2' && <p className="err">Ce compte n'a pas accès à l'administration.</p>}
      </form>
      <Link className="link-sm" href="/admin/mot-de-passe-oublie">Mot de passe oublié ?</Link>
    </div>
  );
}
