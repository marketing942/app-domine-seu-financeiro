import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getUserById, initDb } from '@/lib/db';
import AppShell from '@/components/layout/AppShell';

let dbInitialized = false;
async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  await ensureDb();

  const session = await getSession();
  if (!session) redirect('/login');

  const user = await getUserById(session.userId);
  if (!user) redirect('/login');

  const userData = { id: user.id, name: user.name, email: user.email };

  return <AppShell user={userData}>{children}</AppShell>;
}
