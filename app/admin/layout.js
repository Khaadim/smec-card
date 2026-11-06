import './admin.css';
import { getAdmin } from '@/lib/auth';
import { paymentMode } from '@/lib/site';
import Sidebar from './Sidebar';
import Footer from '../Footer';

export default async function AdminLayout({ children }) {
  const me = await getAdmin();
  if (!me) return children; // page de connexion : pas de barre latérale
  return (
    <div className="adm">
      <Sidebar email={me.email} mode={paymentMode()} />
      <div className="adm-main">
        <div className="adm-content">{children}</div>
        <Footer />
      </div>
    </div>
  );
}
