'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon from './icons';
import { logout } from './actions';

const NAV = [
  { href: '/admin', label: 'Tableau de bord', icon: 'dashboard' },
  { href: '/admin/membres', label: 'Membres', icon: 'users' },
  { href: '/admin/paiements', label: 'Paiements', icon: 'payments' },
  { href: '/admin/cartes', label: 'Cartes', icon: 'card' },
  { href: '/admin/parametres', label: 'Paramètres', icon: 'settings' },
];

export default function Sidebar({ email }) {
  const path = usePathname();
  const active = (h) => (h === '/admin' ? path === '/admin' : path.startsWith(h));
  return (
    <aside className="side">
      <div className="brand"><span className="logo">SMEC</span><small>Administration</small></div>
      <nav>
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={active(n.href) ? 'on' : ''}>
            <Icon name={n.icon} /><span>{n.label}</span>
          </Link>
        ))}
      </nav>
      <div className="me">
        <small>{email}</small>
        <form action={logout}><button className="out"><Icon name="logout" size={18} /><span>Déconnexion</span></button></form>
      </div>
    </aside>
  );
}
