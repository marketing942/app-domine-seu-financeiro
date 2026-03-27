import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/db';
import AppShell from '@/components/layout/AppShell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const user = getUserById(session.userId);
  if (!user) redirect('/login');

  const userData = { id: user.id, name: user.name, email: user.email };

  return <AppShell user={userData}>{children}</AppShell>;
}
