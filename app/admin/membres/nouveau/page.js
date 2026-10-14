import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/auth';
import { createMember } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function NouveauMembre({ searchParams }) {
  if (!(await getAdmin())) redirect('/admin/login');
  const { e = '' } = await searchParams;

  return (
    <>
      <p className="sub"><Link href="/admin/membres">← Retour aux membres</Link></p>
      <h1>Nouveau membre</h1>
      <p className="sub">Pour un membre qui a payé hors ligne (espèces, transfert…). La carte est activée immédiatement.</p>
      {e && <div className="msg err">{e}</div>}

      <div className="panel" style={{ maxWidth: 640 }}>
        <form action={createMember} className="fgrid">
          <label>Prénom *<input name="first_name" required /></label>
          <label>Nom *<input name="last_name" required /></label>
          <label>Téléphone *<input name="phone" type="tel" placeholder="+221 77 123 45 67" required /></label>
          <label>E-mail<input name="email" type="email" /></label>
          <label>Photo (JPG ou PNG, 4 Mo max)<input name="photo" type="file" accept="image/jpeg,image/png" /></label>
          <div className="two-cols">
            <label>Montant payé (FCFA)<input name="amount" type="number" min="0" defaultValue="1000" /></label>
            <label>Mode de paiement
              <select name="method" defaultValue="cash">
                <option value="cash">Espèces</option>
                <option value="wave">Wave</option>
                <option value="orange_money">Orange Money</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="other">Autre</option>
              </select>
            </label>
          </div>
          <button>Créer le membre et activer la carte</button>
        </form>
      </div>
    </>
  );
}
