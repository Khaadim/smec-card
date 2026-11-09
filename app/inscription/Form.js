'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Form({ price, validity }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('cash');
  const amount = `${price.toLocaleString('fr-FR')} FCFA`;

  const METHODS = [
    ['cash', 'Espèces', `Vous remettrez les ${amount} à l'équipe SMEC.`],
    ['wave', 'Wave', `Après l'inscription, vous enverrez les ${amount} par Wave.`],
    ['orange_money', 'Orange Money', `Après l'inscription, vous enverrez les ${amount} par Orange Money.`],
  ];

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/request', { method: 'POST', body: new FormData(e.target) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.');
      router.push(`/carte/${data.token}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="box">
      <h2 style={{ marginTop: 0 }}>Demande de carte membre</h2>
      <p className="muted">Prix : {amount} · carte {validity}</p>
      <form onSubmit={submit}>
        <label>Prénom *</label>
        <input name="first_name" required />
        <label>Nom *</label>
        <input name="last_name" required />
        <label>Numéro de téléphone *</label>
        <input name="phone" type="tel" placeholder="+221 77 123 45 67" required />
        <label>E-mail</label>
        <input name="email" type="email" />
        <label>Photo d'identité * (JPG ou PNG, 4 Mo max)</label>
        <input name="photo" type="file" accept="image/jpeg,image/png" required />

        <label>Comment allez-vous payer ? *</label>
        <div className="methods">
          {METHODS.map(([v, l]) => (
            <label key={v} className={`method ${method === v ? 'on' : ''}`}>
              <input type="radio" name="method" value={v} checked={method === v} onChange={() => setMethod(v)} />
              {l}
            </label>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 8 }}>{METHODS.find((m) => m[0] === method)[2]} Votre carte sera activée dès que l'équipe aura confirmé le paiement.</p>

        <button disabled={loading}>{loading ? 'Veuillez patienter…' : 'Envoyer ma demande'}</button>
        {error && <p className="err">{error}</p>}
      </form>
    </div>
  );
}
