import './admin.css';
import { getAdmin } from '@/lib/auth';
import Sidebar from './Sidebar';

export default async function AdminLayout({ children }) {
  const me = await getAdmin();
  if (!me) return children; // page de connexion : pas de barre latérale
  return (
    <div className="adm">
      <Sidebar email={me.email} />
      <div className="adm-main">{children}</div>
    </div>
  );
}
