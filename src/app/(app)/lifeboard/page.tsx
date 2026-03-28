'use client';

import { ExternalLink, Target, BookOpen, LayoutGrid, Sparkles } from 'lucide-react';

const FEATURES = [
  {
    icon: Target,
    title: 'Metas de vida',
    desc: 'Defina e acompanhe metas em todas as áreas da sua vida: saúde, carreira, relacionamentos, finanças e muito mais.',
  },
  {
    icon: LayoutGrid,
    title: 'Organização por áreas',
    desc: 'Visualize cada dimensão da sua vida em painéis separados, mantendo o foco e a clareza sobre o que realmente importa.',
  },
  {
    icon: BookOpen,
    title: 'Rotinas e anotações',
    desc: 'Crie rotinas diárias, registre anotações e reflexões, e mantenha um diário de progresso pessoal.',
  },
  {
    icon: Sparkles,
    title: 'Visão holística',
    desc: 'Tenha uma visão completa e integrada da sua vida, identificando padrões e oportunidades de crescimento.',
  },
];

export default function LifeBoardPage() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-lg">
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-white/10 rounded-full" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium mb-4">
            <Sparkles size={14} />
            Aplicativo parceiro
          </div>
          <h1 className="text-3xl font-bold mb-2 leading-tight">Life Board</h1>
          <p className="text-white/90 text-base leading-relaxed mb-6">
            Organize suas metas de vida, rotinas e anotações por cada área da vida. Tenha controle total da sua jornada pessoal em um único lugar.
          </p>
          <a
            href="https://app-life-board.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-6 py-3 rounded-xl hover:bg-purple-50 transition-colors shadow-md text-sm"
          >
            <ExternalLink size={16} />
            Clique aqui e crie sua conta gratuitamente
          </a>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          O que você pode fazer no Life Board
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 space-y-2"
            >
              <div className="w-9 h-9 bg-violet-100 dark:bg-violet-900/30 rounded-lg flex items-center justify-center">
                <Icon size={18} className="text-violet-600 dark:text-violet-400" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-sm">{title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA secundário */}
      <div className="bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1">
          <p className="font-semibold text-violet-900 dark:text-violet-200 text-sm">Pronto para transformar sua vida?</p>
          <p className="text-xs text-violet-700 dark:text-violet-400 mt-0.5">
            O Life Board é gratuito e complementa perfeitamente o Domínio Financeiro.
          </p>
        </div>
        <a
          href="https://app-life-board.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
        >
          <ExternalLink size={14} />
          Acessar Life Board
        </a>
      </div>
    </div>
  );
}
