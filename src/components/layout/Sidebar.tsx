'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef, useState } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, Tag, PieChart, TrendingUp, Building2,
  FileBarChart, Bell, Settings, LogOut, Camera, User, Loader2,
  BookOpen, Sparkles, Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSession } from '@/hooks/use-session';

const NAV_ITEMS = [
  { href: '/dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/transactions', label: 'Transações',     icon: ArrowLeftRight },
  { href: '/categories',   label: 'Categorias',     icon: Tag },
  { href: '/budget',       label: 'Orçamento',      icon: Target },
  { href: '/investments',  label: 'Investimentos',  icon: TrendingUp },
  { href: '/patrimony',    label: 'Patrimônio',     icon: Building2 },
  { href: '/reports',      label: 'Relatórios',     icon: FileBarChart },
  { href: '/alerts',       label: 'Alertas',        icon: Bell },
];

const BOTTOM_ITEMS = [
  { href: '/lifeboard',   label: 'Life Board',      icon: Sparkles,  highlight: true },
  { href: '/how-to-use',  label: 'Como utilizar?',  icon: BookOpen,  highlight: false },
  { href: '/settings',    label: 'Configurações',   icon: Settings,  highlight: false },
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
    if (file.size > 2 * 1024 * 1024) { alert('A imagem deve ter no máximo 2MB.'); return; }
    setUploading(true);
    try {
      const dataUrl = await resizeImage(file, 200);
      await updateAvatar(dataUrl);
    } catch { alert('Erro ao atualizar foto. Tente novamente.'); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function resizeImage(file: File, maxSize: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();
      reader.onload = e => { img.src = e.target?.result as string; };
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
    <div className="flex flex-col items-center gap-2 px-4 py-5 border-b border-white/10">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative group w-16 h-16 rounded-full overflow-hidden ring-2 ring-white/30 hover:ring-white/60 transition-all focus:outline-none"
        title="Clique para trocar a foto"
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-white/20 flex items-center justify-center">
            <span className="text-xl font-bold text-white select-none">
              {initials || <User size={24} />}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          {uploading
            ? <Loader2 size={20} className="text-white animate-spin" />
            : <Camera size={20} className="text-white" />
          }
        </div>
      </button>
      <div className="text-center min-w-0 w-full">
        <p className="text-sm font-semibold text-white truncate">{name}</p>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
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
    <aside className="w-64 flex flex-col h-full shrink-0 bg-gradient-to-b from-[#1E3A5F] to-[#0F2440]">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://d2xsxph8kpxj0f.cloudfront.net/310519663437863321/n33KJ4UHePniBT7kHqCguh/logo-df-v2-eAhzmV5o6VL7KXh7EFJXzW.png"
              alt="Domínio Financeiro"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight">Domínio</p>
            <p className="font-bold text-[#5BA4C4] text-sm leading-tight">Financeiro</p>
          </div>
        </div>
      </div>

      {/* Avatar + nome */}
      <AvatarUploader name={user.name} />

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon size={18} className={active ? 'text-[#5BA4C4]' : ''} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: Life Board, Como usar, Configurações, Sair */}
      <div className="px-3 py-4 border-t border-white/10 space-y-0.5">
        {BOTTOM_ITEMS.map(({ href, label, icon: Icon, highlight }) => {
          const active = pathname === href;
          if (highlight) {
            return (
              <Link key={href} href={href}
                className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                  active ? 'bg-violet-500/30 text-violet-200' : 'text-violet-300/80 hover:bg-violet-500/20 hover:text-violet-200')}>
                <Icon size={18} />
                {label}
              </Link>
            );
          }
          return (
            <Link key={href} href={href}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active ? 'bg-white/20 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white')}>
              <Icon size={18} />
              {label}
            </Link>
          );
        })}

        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300/80 hover:bg-red-500/20 hover:text-red-200 transition-all">
          <LogOut size={18} />
          Sair
        </button>

        <div className="mt-2 px-3 py-1.5 bg-white/5 rounded-lg">
          <p className="text-xs text-white/40 truncate">{user.email}</p>
        </div>
      </div>
    </aside>
  );
}
