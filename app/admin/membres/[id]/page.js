import Link from 'next/link';
import { redirect } from 'next/navigation';
import { admin, photoUrl, computeStatus, STATUS_LABELS } from '@/lib/supabase';
import { getAdmin } from '@/lib/auth';
import { updateMember, deleteMember, changeCardStatus } from '../../actions';
import ConfirmButton from '../../ConfirmButton';

export const dynamic = 'force-dynamic';
const OK = { created: 'Membre créé et carte activée.', updated: 'Modifications enregistrées.' };
const PAY = { paid: 'Validé', pending: 'En attente', failed: 'Échoué' };
const fmt = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default async function MembreDetail({ params, searchParams }) {
  if (!(await getAdmin())) redirect('/admin/login');
  const { id } = await params;
  const { ok = '', e = '' } = await searchParams;
  const sb = admin();

  const { data: m } = await sb.from('members').select('*, cards(*), payments(*)').eq('id', id).maybeSingle();
  if (!m) {
    return (
      <>
        <p className="sub"><Link href="/admin/membres">← Retour aux membres</Link></p>
        <div className="msg err">Membre introuvable.</div>
      </>
    );
  }

  const card = m.cards?.[0];
  const st = card ? computeStatus(card) : null;
  const photo = await photoUrl(sb, m.photo_path);
  const pays = [...(m.payments || [])].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <>
      <p className="sub"><Link href="/admin/membres">← Retour aux membres</Link></p>
      <h1>{m.first_name} {m.last_name}</h1>
      <p className="sub">Membre depuis le {fmt(m.created_at)}</p>
      {OK[ok] && <div className="msg ok">{OK[ok]}</div>}
      {e && <div className="msg err">{e}</div>}

      <div className="two">
        <div>
          <div className="panel">
            <h2>Informations</h2>
            <form action={updateMember} className="fgrid">
              <input type="hidden" name="id" value={m.id} />
              {photo ? <img className="thumb" src={photo} alt="" /> : <div className="thumb empty-thumb">Pas de photo</div>}
              <label>Prénom *<input name="first_name" defaultValue={m.first_name} required /></label>
              <label>Nom *<input name="last_name" defaultValue={m.last_name} required /></label>
              <label>Téléphone *<input name="phone" type="tel" defaultValue={m.phone} required /></label>
              <label>E-mail<input name="email" type="email" defaultValue={m.email || ''} /></label>
              <label>Changer la photo (JPG ou PNG, 4 Mo max)<input name="photo" type="file" accept="image/jpeg,image/png" /></label>
              <button>Enregistrer les modifications</button>
            </form>
          </div>
        </div>

        <div>
          <div className="panel">
            <h2>Carte de membre</h2>
            {card ? (
              <>
                <dl className="kv">
                  <dt>Numéro</dt><dd>{card.card_number || '—'}</dd>
                  <dt>Statut</dt><dd><span className={`pill ${st}`}>{STATUS_LABELS[st]}</span></dd>
                  <dt>Émise le</dt><dd>{fmt(card.issued_at)}</dd>
                  <dt>Expire le</dt><dd>{fmt(card.expires_at)}</dd>
                  {card.revoked_reason && <><dt>Motif de révocation</dt><dd>{card.revoked_reason}</dd></>}
                </dl>
                <div className="act" style={{ marginTop: 14 }}>
                  <a className="btnlink sm" href={`/carte/${card.token}`} target="_blank">Voir la carte</a>
                  <a className="btnlink sm" href={`/verifier/${card.token}`} target="_blank">Vérification</a>
                  {card.card_number && <>
                    <a className="btnlink sm" href={`/carte/${card.token}/png`}>PNG</a>
                    <a className="btnlink sm" href={`/carte/${card.token}/pdf`}>PDF</a>
                  </>}
                </div>
                <form action={changeCardStatus} className="act" style={{ marginTop: 14 }}>
                  <input type="hidden" name="card_id" value={card.id} />
                  {card.status === 'revoked' ? (
                    <button name="action" value="reactivate">Réactiver la carte</button>
                  ) : (
                    <>
                      <input name="reason" placeholder="Motif de révocation" required />
                      <button name="action" value="revoke" className="warn">Révoquer</button>
                    </>
                  )}
                </form>
              </>
            ) : <p className="sub">Aucune carte.</p>}
          </div>

          <div className="panel">
            <h2>Paiements</h2>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Date</th><th>Montant</th><th>Mode</th><th>Statut</th></tr></thead>
                <tbody>
                  {pays.map((p) => (
                    <tr key={p.id}>
                      <td>{fmt(p.created_at)}</td>
                      <td>{p.amount.toLocaleString('fr-FR')} FCFA</td>
                      <td>{p.method || '—'}</td>
                      <td><span className={`pill ${p.status}`}>{PAY[p.status]}</span></td>
                    </tr>
                  ))}
                  {pays.length === 0 && <tr><td colSpan={4} className="empty">Aucun paiement.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel danger-zone">
            <h2>Zone dangereuse</h2>
            <p className="sub">Supprimer ce membre efface aussi sa carte, ses paiements et sa photo. Pour simplement désactiver une carte, utilisez plutôt « Révoquer ».</p>
            <form action={deleteMember}>
              <input type="hidden" name="id" value={m.id} />
              <ConfirmButton className="danger" message={`Supprimer définitivement ${m.first_name} ${m.last_name} ? Cette action est irréversible.`}>Supprimer ce membre</ConfirmButton>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
