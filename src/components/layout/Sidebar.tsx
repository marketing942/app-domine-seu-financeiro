'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, Tag, PieChart, TrendingUp, Building2,
  FileBarChart, Bell, Settings, LogOut, DollarSign, Camera, User, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/categories', label: 'Categorias', icon: Tag },
  { href: '/budget', label: 'Orçamento', icon: PieChart },
  { href: '/investments', label: 'Investimentos', icon: TrendingUp },
  { href: '/patrimony', label: 'Patrimônio', icon: Building2 },
  { href: '/reports', label: 'Relatórios', icon: FileBarChart },
  { href: '/alerts', label: 'Alertas', icon: Bell },
];

const BOTTOM_ITEMS = [
  { href: '/settings', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  user: { id: number; name: string; email: string };
}

function AvatarUploader({ name }: { name: string }) {
  const { user, updateAvatar } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valida tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }

    setUploading(true);
    try {
      // Converte para base64 e redimensiona via canvas
      const dataUrl = await resizeImage(file, 200);
      await updateAvatar(dataUrl);
    } catch {
      alert('Erro ao atualizar foto. Tente novamente.');
    } finally {
      setUploading(false);
      // Limpa o input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function resizeImage(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => {
        img.src = e.target?.result as string;
      };
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const avatarUrl = user?.avatarUrl ?? null;

  return (
    <div className="flex flex-col items-center gap-2 px-4 py-4 border-b border-gray-200 dark:border-gray-800">
      {/* Avatar clicável */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative group w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary-200 dark:ring-primary-800 hover:ring-primary-400 dark:hover:ring-primary-500 transition-all focus:outline-none focus:ring-primary-500"
        title="Clique para trocar a foto"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
            <span className="text-xl font-bold text-primary-700 dark:text-primary-300 select-none">
              {initials || <User size={24} />}
            </span>
          </div>
        )}

        {/* Overlay de câmera ao hover */}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading
            ? <Loader2 size={20} className="text-white animate-spin" />
            : <Camera size={20} className="text-white" />
          }
        </div>
      </button>

      {/* Nome e email */}
      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{name}</p>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    window.location.href = '/login';
  }

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shrink-0">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">Domínio</p>
            <p className="font-bold text-primary-600 text-sm leading-tight">Financeiro</p>
          </div>
        </div>
      </div>

      {/* Avatar + nome do usuário */}
      <AvatarUploader name={user.name} />

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon size={18} className={active ? 'text-primary-600 dark:text-primary-400' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-200 dark:border-gray-800 space-y-1">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut size={18} />
          Sair
        </button>

        {/* Email do usuário */}
        <div className="mt-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
        </div>
      </div>
    </aside>
  );
}
