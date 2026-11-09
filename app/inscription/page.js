import { getSite, validityShort } from '@/lib/settings';
import Form from './Form';

export const metadata = { title: 'Demander ma carte – SMEC' };

export default async function Inscription() {
  const site = await getSite();
  return <Form price={site.price} validity={validityShort(site)} />;
}
