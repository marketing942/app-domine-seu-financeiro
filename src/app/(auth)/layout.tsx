import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <span className="text-3xl">₿</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Domínio Financeiro</h1>
          <p className="text-primary-200 mt-1">Gerencie suas finanças com inteligência</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
