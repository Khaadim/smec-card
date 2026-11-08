'use client';
import { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { resetPassword } from '../actions';
import PasswordInput from '../PasswordInput';

export default function NouveauMotDePasse() {
  const [token, setToken] = useState('');
  const [tokenHash, setTokenHash] = useState('');
  const [problem, setProblem] = useState('');
  const [state, formAction, pending] = useActionState(resetPassword, null);

  // Deux formats de lien possibles : ?token_hash=... (modèle d'e-mail personnalisé) ou #access_token=... (lien Supabase standard)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get('token_hash')) { setTokenHash(q.get('token_hash')); return; }
    const h = new URLSearchParams(window.location.hash.slice(1));
    const t = h.get('access_token');
    if (t && h.get('type') === 'recovery') { setToken(t); return; }
    setProblem(h.get('error_code') === 'otp_expired' || h.get('error_description')
      ? 'Ce lien a expiré ou a déjà été utilisé.'
      : 'Lien manquant ou invalide : ouvrez-le directement depuis l’e-mail.');
  }, []);

  return (
    <div className="box">
      <h2 style={{ marginTop: 0 }}>Nouveau mot de passe</h2>
      {problem && (
        <>
          <p className="err">{problem} Refaites une demande de réinitialisation.</p>
          <Link className="link-sm" href="/admin/mot-de-passe-oublie">Demander un nouveau lien</Link>
        </>
      )}
      {(token || tokenHash) && (
        <form action={formAction}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="token_hash" value={tokenHash} />
          <label>Nouveau mot de passe (10 caractères minimum)</label>
          <PasswordInput name="password" minLength={10} required autoComplete="new-password" />
          <label>Confirmer le mot de passe</label>
          <PasswordInput name="confirm" minLength={10} required autoComplete="new-password" />         
          <button disabled={pending}>{pending ? 'Enregistrement…' : 'Enregistrer'}</button>
          {state?.error && <p className="err">{state.error}</p>}
          {state?.error && <Link className="link-sm" href="/admin/mot-de-passe-oublie">Demander un nouveau lien</Link>}
        </form>
      )}
    </div>
  );
}
