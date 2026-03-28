'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Eye, EyeOff, User, Lock, LogOut, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, type Theme } from '@/hooks/use-theme';

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [tab, setTab] = useState<'profile' | 'password' | 'appearance'>('profile');

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');
  const [passwordError, setPasswordError] = useState('');

  async function handleLogout() {
    await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'logout' }) });
    router.push('/login');
    router.refresh();
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(''); setPasswordMsg('');
    if (newPassword.length < 6) { setPasswordError('Senha deve ter pelo menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('As senhas não coincidem'); return; }
    setSavingPassword(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change-password', currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordError(data.error || 'Erro ao alterar senha'); return; }
      setPasswordMsg('Senha alterada com sucesso!');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } finally { setSavingPassword(false); }
  }

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'light', label: 'Claro', icon: <Sun size={20} />, desc: 'Fundo branco, ideal para ambientes iluminados' },
    { value: 'dark', label: 'Escuro', icon: <Moon size={20} />, desc: 'Fundo escuro, confortável à noite' },
    { value: 'system', label: 'Sistema', icon: <Monitor size={20} />, desc: 'Segue a preferência do seu dispositivo' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
        {([
          { key: 'profile', label: 'Perfil', icon: User },
          { key: 'password', label: 'Senha', icon: Lock },
          { key: 'appearance', label: 'Aparência', icon: Sun },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap ${tab === key ? 'border-primary-600 text-primary-600 dark:text-primary-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Informações do perfil</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Para alterar sua foto de perfil, clique no avatar na barra lateral esquerda. Para alterar a senha, use a aba <strong>Senha</strong>.
          </p>
        </div>
      )}

      {tab === 'password' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Alterar senha</h3>
          {passwordError && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg px-4 py-3 text-sm">{passwordError}</div>}
          {passwordMsg && <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg px-4 py-3 text-sm">{passwordMsg}</div>}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha atual</label>
              <div className="relative">
                <input type={showCurrent ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova senha</label>
              <div className="relative">
                <input type={showNew ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6}
                  className="w-full px-4 py-2.5 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar nova senha</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <button type="submit" disabled={savingPassword}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2">
              {savingPassword && <Loader2 size={15} className="animate-spin" />}
              {savingPassword ? 'Salvando...' : 'Alterar senha'}
            </button>
          </form>
        </div>
      )}

      {tab === 'appearance' && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Tema do aplicativo</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Escolha como o Domínio Financeiro deve aparecer na sua tela.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {themeOptions.map(({ value, label, icon, desc }) => {
              const active = theme === value;
              return (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                    active
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`p-3 rounded-full ${active ? 'bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'}`}>
                    {icon}
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-semibold ${active ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>{label}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
                  </div>
                  {active && (
                    <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Danger zone */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-6 space-y-4">
        <h3 className="font-semibold text-red-600 dark:text-red-400">Zona de perigo</h3>
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2.5 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-medium transition">
          <LogOut size={16} /> Sair da conta
        </button>
      </div>
    </div>
  );
}
