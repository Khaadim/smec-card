import './globals.css';

export const metadata = { title: 'SMEC – Carte de membre', description: 'School of Medicine English Club' };

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header>SMEC · School of Medicine English Club</header>
        <main className="wrap">{children}</main>
      </body>
    </html>
  );
}
