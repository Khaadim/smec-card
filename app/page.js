'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/request', { method: 'POST', body: new FormData(e.target) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      router.push(`/carte/${data.token}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <div className="box">
      <h2 style={{ marginTop: 0 }}>Demande de carte membre</h2>
      <p className="muted">Prix : 1 000 FCFA · carte valable jusqu'au 31 décembre</p>
      <form onSubmit={submit}>
        <label>Prénom *</label>
        <input name="first_name" required />
        <label>Nom *</label>
        <input name="last_name" required />
        <label>Numéro de téléphone *</label>
        <input name="phone" type="tel" placeholder="+221 77 123 45 67" required />
        <label>E-mail</label>
        <input name="email" type="email" />
        <label>Photo d'identité * (JPG ou PNG, 5 Mo max)</label>
        <input name="photo" type="file" accept="image/jpeg,image/png" required />
        <button disabled={loading}>{loading ? 'Veuillez patienter…' : 'Payer et obtenir ma carte'}</button>
        {error && <p className="err">{error}</p>}
      </form>
    </div>
  );
}
