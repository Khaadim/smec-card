import Link from 'next/link';
import './globals.css';
import Footer from './Footer';
import Brand from './Brand';

export const metadata = { title: 'SMEC – Carte de membre', description: 'School of Medicine English Club' };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header className="site-head">
          <Link href="/" className="brand-link"><Brand /></Link>
          <Link className="head-cta" href="/inscription">Demander ma carte</Link>
        </header>
        <main className="wrap">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
