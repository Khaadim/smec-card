import Link from 'next/link';
import { site } from '@/lib/site';
import Brand from './Brand';

const I = {
  instagram: <><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/></>,
  facebook: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>,
  linkedin: <><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>,
  whatsapp: <path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/>,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>,
};
const Ico = ({ n }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{I[n]}</svg>
);

export default function Footer() {
  const links = [
    ['instagram', 'Instagram', site.instagram],
    ['facebook', 'Facebook', site.facebook],
    ['linkedin', 'LinkedIn', site.linkedin],
    ['whatsapp', 'WhatsApp', site.whatsapp && `https://wa.me/${site.whatsapp}`],
    ['mail', 'E-mail', site.email && `mailto:${site.email}`],
  ].filter(([, , url]) => url);

  return (
    <footer className="foot">
      <div className="foot-line" />
      <div className="foot-in">
        <div className="foot-brand">
          <Brand size={60} />
          <p>{site.tagline}</p>
          <p className="motto">{site.motto}</p>
          {links.length > 0 && (
            <div className="soc">
              {links.map(([n, label, url]) => (
                <a key={n} href={url} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}><Ico n={n} /></a>
              ))}
            </div>
          )}
        </div>

        <div className="foot-col">
          <h4>Navigation</h4>
          <Link href="/">Accueil</Link>
          <Link href="/inscription">Demander ma carte</Link>
          <Link href="/retrouver-ma-carte">Retrouver ma carte</Link>
          <Link href="/aide">Aide et FAQ</Link>
        </div>

        <div className="foot-col">
          <h4>Informations</h4>
          <Link href="/confidentialite">Confidentialité</Link>
          <Link href="/admin">Espace administrateur</Link>
          {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
          {site.whatsapp && <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
        </div>
      </div>
      <div className="foot-bottom">
        <span>© {new Date().getFullYear()} {site.name} – {site.fullName}</span>
        <span>{site.slogan}</span>
      </div>
    </footer>
  );
}
