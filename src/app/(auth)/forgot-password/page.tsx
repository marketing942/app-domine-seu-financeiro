'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';

type Step = 'email' | 'code' | 'password' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [devCode, setDevCode] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'forgot-password', email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUserId(data.userId);
      if (data.devCode) setDevCode(data.devCode);
      setStep('code');
    } catch { setError('Erro de conexão.'); }
    finally { setLoading(false); }
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify-reset-code', userId, code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep('password');
    } catch { setError('Erro de conexão.'); }
    finally { setLoading(false); }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset-password', userId, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep('done');
    } catch { setError('Erro de conexão.'); }
    finally { setLoading(false); }
  }

  if (step === 'done') {
    return (
      <div className="text-center space-y-4">
        <div className="text-5xl">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Senha redefinida!</h2>
        <p className="text-gray-500 dark:text-gray-400">Sua senha foi alterada com sucesso.</p>
        <button onClick={() => router.push('/login')}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg transition">
          Ir para o login
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4">
          <ArrowLeft size={16} /> Voltar ao login
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recuperar senha</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          {step === 'email' && 'Informe seu e-mail para receber o código de verificação'}
          {step === 'code' && 'Digite o código de 6 dígitos enviado para seu e-mail'}
          {step === 'password' && 'Crie uma nova senha para sua conta'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Enviando...' : 'Enviar código'}
          </button>
        </form>
      )}

      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} className="space-y-4">
          {devCode && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-400 rounded-lg px-4 py-3 text-sm">
              <strong>Modo desenvolvimento:</strong> Código: <span className="font-mono font-bold">{devCode}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código de verificação</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} required
              placeholder="000000" maxLength={6}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition text-center text-2xl tracking-widest font-mono" />
          </div>
          <button type="submit" disabled={loading || code.length !== 6}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Verificando...' : 'Verificar código'}
          </button>
        </form>
      )}

      {step === 'password' && (
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-lg transition flex items-center justify-center gap-2">
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </button>
        </form>
      )}
    </div>
  );
}
