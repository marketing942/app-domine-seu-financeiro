'use client';

import { useState } from 'react';
import {
  LayoutDashboard, ArrowLeftRight, Tag, PieChart, TrendingUp,
  Building2, FileBarChart, Bell, ChevronDown, ChevronUp,
  Lightbulb, CheckCircle2, BookOpen
} from 'lucide-react';

interface Section {
  id: string;
  icon: React.ReactNode;
  title: string;
  color: string;
  summary: string;
  steps: string[];
  tips?: string[];
}

const SECTIONS: Section[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={20} />,
    title: 'Dashboard',
    color: 'blue',
    summary: 'Visão geral das suas finanças em tempo real.',
    steps: [
      'Ao acessar o Dashboard, você vê um resumo do mês atual: total de receitas, despesas, saldo e percentual do orçamento utilizado.',
      'Os cards coloridos mostram rapidamente se você está no positivo (verde) ou no negativo (vermelho).',
      'O gráfico de categorias mostra onde você mais gasta, ajudando a identificar onde cortar.',
      'As transações recentes listam os últimos lançamentos para conferência rápida.',
      'A saudação no topo exibe seu nome, a data e o horário atual.',
    ],
    tips: [
      'Acesse o Dashboard diariamente para manter o controle em dia.',
      'Se o saldo aparecer negativo, vá à aba Transações e verifique despesas não pagas.',
    ],
  },
  {
    id: 'transactions',
    icon: <ArrowLeftRight size={20} />,
    title: 'Transações',
    color: 'green',
    summary: 'Registre todas as suas entradas e saídas de dinheiro.',
    steps: [
      'Clique no botão "+ Nova Transação" para lançar uma receita ou despesa.',
      'Escolha o tipo: Receita (dinheiro que entra) ou Despesa (dinheiro que sai).',
      'Preencha a descrição, o valor, a data de vencimento e a categoria.',
      'Defina o status: "Pendente" (ainda não pago/recebido) ou "Pago/Recebido".',
      'Para contas parceladas ou recorrentes, use a opção de Recorrência e escolha mensal, semanal etc.',
      'Para marcar uma transação como paga, clique no ícone de check ao lado dela na lista.',
      'Use os filtros de mês e tipo para encontrar lançamentos específicos.',
    ],
    tips: [
      'Registre as transações assim que ocorrerem para não esquecer.',
      'Use a recorrência para contas fixas como aluguel, internet e salário.',
      'Transações pendentes aparecem em destaque para você não perder os vencimentos.',
    ],
  },
  {
    id: 'categories',
    icon: <Tag size={20} />,
    title: 'Categorias',
    color: 'orange',
    summary: 'Organize seus gastos e receitas em categorias personalizadas.',
    steps: [
      'O app já vem com categorias padrão como Alimentação, Transporte, Saúde e Salário.',
      'Para criar uma nova categoria, clique em "+ Nova Categoria".',
      'Escolha um nome, ícone, cor e se é do tipo Receita ou Despesa.',
      'Você pode adicionar subcategorias para detalhar ainda mais (ex.: Alimentação → Restaurante, Mercado).',
      'Marque categorias como favoritas para acessá-las mais rapidamente ao lançar transações.',
      'Para editar ou excluir, clique nos ícones ao lado de cada categoria.',
    ],
    tips: [
      'Crie categorias que façam sentido para o seu estilo de vida.',
      'Evite criar categorias demais — isso dificulta a análise dos relatórios.',
      'Use subcategorias para detalhar sem poluir a lista principal.',
    ],
  },
  {
    id: 'budget',
    icon: <PieChart size={20} />,
    title: 'Orçamento',
    color: 'purple',
    summary: 'Defina limites de gastos por categoria e acompanhe se está dentro do planejado.',
    steps: [
      'Na aba Orçamento, você define quanto pretende gastar em cada categoria por mês.',
      'Clique em uma categoria e insira o valor planejado para o mês.',
      'As barras de progresso mostram quanto você já gastou em relação ao limite definido.',
      'Categorias em vermelho indicam que você ultrapassou o orçamento.',
      'Categorias em amarelo indicam que você está próximo do limite (acima de 80%).',
      'O resumo no topo mostra o total planejado vs. o total gasto no mês.',
    ],
    tips: [
      'Comece definindo orçamento apenas para as categorias onde você mais gasta.',
      'Revise os limites mensalmente conforme sua realidade financeira muda.',
      'Use o orçamento como meta, não como punição — ajuste quando necessário.',
    ],
  },
  {
    id: 'investments',
    icon: <TrendingUp size={20} />,
    title: 'Investimentos',
    color: 'teal',
    summary: 'Acompanhe quanto você está investindo por mês e por tipo.',
    steps: [
      'Na aba Investimentos, registre seus aportes mensais em diferentes tipos: Renda Fixa, Ações, Fundos, Criptomoedas etc.',
      'Para cada investimento, informe o valor planejado (meta) e o valor real (o que foi efetivamente investido).',
      'O app compara o planejado vs. o realizado para mostrar se você está cumprindo suas metas de investimento.',
      'Você pode adicionar múltiplos investimentos por mês e por tipo.',
      'Use o campo de descrição para identificar o ativo (ex.: "Tesouro Selic 2026", "IVVB11").',
    ],
    tips: [
      'Defina uma meta mensal de investimento e trate-a como uma despesa fixa.',
      'Registre os aportes assim que fizer a transferência para não esquecer.',
      'Compare meses anteriores para ver sua evolução como investidor.',
    ],
  },
  {
    id: 'patrimony',
    icon: <Building2 size={20} />,
    title: 'Patrimônio',
    color: 'amber',
    summary: 'Mapeie seus bens e dívidas para calcular seu patrimônio líquido.',
    steps: [
      'Na aba Patrimônio, cadastre seus bens: imóveis, veículos, investimentos, equipamentos etc.',
      'Para cada bem, informe o valor de compra, a valorização estimada e a depreciação.',
      'Se o bem tem uma dívida associada (ex.: financiamento), informe o saldo devedor.',
      'O app calcula automaticamente o valor líquido de cada bem (valor atual − dívida).',
      'O total do patrimônio líquido aparece no topo da página.',
      'Atualize os valores periodicamente para manter o cálculo preciso.',
    ],
    tips: [
      'Inclua todos os seus bens, mesmo os de menor valor, para ter uma visão completa.',
      'Atualize o saldo das dívidas mensalmente conforme você paga as parcelas.',
      'Patrimônio líquido crescente é um sinal de saúde financeira a longo prazo.',
    ],
  },
  {
    id: 'reports',
    icon: <FileBarChart size={20} />,
    title: 'Relatórios',
    color: 'indigo',
    summary: 'Analise sua vida financeira com gráficos e comparativos mensais.',
    steps: [
      'Na aba Relatórios, você encontra gráficos detalhados de receitas e despesas por período.',
      'Selecione o mês e o ano que deseja analisar.',
      'O gráfico de pizza mostra a distribuição dos gastos por categoria.',
      'O gráfico de barras compara receitas e despesas mês a mês.',
      'A tabela de categorias mostra o detalhamento de cada gasto com percentuais.',
      'Use os relatórios para identificar padrões e tomar decisões financeiras mais inteligentes.',
    ],
    tips: [
      'Analise os relatórios no início de cada mês para planejar o mês seguinte.',
      'Preste atenção nas categorias que crescem mês a mês — podem indicar gastos descontrolados.',
      'Compare o mês atual com o anterior para ver sua evolução.',
    ],
  },
  {
    id: 'alerts',
    icon: <Bell size={20} />,
    title: 'Alertas',
    color: 'red',
    summary: 'Receba avisos sobre vencimentos e situações que merecem atenção.',
    steps: [
      'A aba Alertas exibe automaticamente situações que precisam da sua atenção.',
      'Alertas de vencimento: transações com data de vencimento próxima ou já vencidas.',
      'Alertas de orçamento: categorias que estão próximas ou acima do limite definido.',
      'Clique em um alerta para ir diretamente para a transação ou categoria relacionada.',
      'Após resolver a situação (pagar a conta, por exemplo), o alerta desaparece automaticamente.',
    ],
    tips: [
      'Verifique os alertas toda semana para não deixar contas vencerem.',
      'Configure orçamentos nas categorias principais para receber alertas de gastos excessivos.',
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; text: string; border: string; iconBg: string }> = {
  blue:   { bg: 'bg-blue-50 dark:bg-blue-900/20',    text: 'text-blue-700 dark:text-blue-300',    border: 'border-blue-200 dark:border-blue-800',   iconBg: 'bg-blue-100 dark:bg-blue-900/40' },
  green:  { bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-300',  border: 'border-green-200 dark:border-green-800', iconBg: 'bg-green-100 dark:bg-green-900/40' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20',text: 'text-orange-700 dark:text-orange-300',border: 'border-orange-200 dark:border-orange-800',iconBg: 'bg-orange-100 dark:bg-orange-900/40' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20',text: 'text-purple-700 dark:text-purple-300',border: 'border-purple-200 dark:border-purple-800',iconBg: 'bg-purple-100 dark:bg-purple-900/40' },
  teal:   { bg: 'bg-teal-50 dark:bg-teal-900/20',    text: 'text-teal-700 dark:text-teal-300',    border: 'border-teal-200 dark:border-teal-800',   iconBg: 'bg-teal-100 dark:bg-teal-900/40' },
  amber:  { bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-700 dark:text-amber-300',  border: 'border-amber-200 dark:border-amber-800', iconBg: 'bg-amber-100 dark:bg-amber-900/40' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20',text: 'text-indigo-700 dark:text-indigo-300',border: 'border-indigo-200 dark:border-indigo-800',iconBg: 'bg-indigo-100 dark:bg-indigo-900/40' },
  red:    { bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-700 dark:text-red-300',      border: 'border-red-200 dark:border-red-800',     iconBg: 'bg-red-100 dark:bg-red-900/40' },
};

function SectionCard({ section }: { section: Section }) {
  const [open, setOpen] = useState(false);
  const c = COLOR_MAP[section.color];

  return (
    <div className={`rounded-xl border ${c.border} overflow-hidden`}>
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${open ? c.bg : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50'}`}
      >
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.iconBg} ${c.text}`}>
          {section.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm ${c.text}`}>{section.title}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{section.summary}</p>
        </div>
        <div className={`shrink-0 ${c.text}`}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {open && (
        <div className="px-5 pb-5 pt-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 space-y-4">
          {/* Passo a passo */}
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <BookOpen size={12} /> Passo a passo
            </p>
            <ol className="space-y-2">
              {section.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
                  <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${c.iconBg} ${c.text}`}>
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Dicas */}
          {section.tips && section.tips.length > 0 && (
            <div className={`rounded-lg p-4 ${c.bg} space-y-2`}>
              <p className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${c.text}`}>
                <Lightbulb size={12} /> Dicas
              </p>
              {section.tips.map((tip, i) => (
                <div key={i} className="flex gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <CheckCircle2 size={13} className={`shrink-0 mt-0.5 ${c.text}`} />
                  <span className="leading-relaxed">{tip}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HowToUsePage() {
  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <BookOpen size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold">Como utilizar o Domínio Financeiro</h1>
            <p className="text-white/80 text-sm">Guia completo para aproveitar ao máximo o app</p>
          </div>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">
          O Domínio Financeiro foi criado para ser simples e poderoso ao mesmo tempo. Clique em cada módulo abaixo para aprender a usá-lo da melhor forma.
        </p>
      </div>

      {/* Início rápido */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-3">
        <h2 className="font-semibold text-gray-900 dark:text-white text-sm flex items-center gap-2">
          <Lightbulb size={16} className="text-yellow-500" />
          Por onde começar?
        </h2>
        <ol className="space-y-2">
          {[
            'Cadastre suas categorias de receitas e despesas na aba Categorias.',
            'Lance suas transações do mês atual na aba Transações.',
            'Defina limites de gastos por categoria na aba Orçamento.',
            'Acompanhe o resumo do mês no Dashboard.',
            'Analise seus padrões financeiros nos Relatórios.',
          ].map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-gray-700 dark:text-gray-300">
              <span className="shrink-0 w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <span className="leading-relaxed pt-0.5">{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Módulos */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Módulos do app — clique para expandir
        </h2>
        <div className="space-y-2">
          {SECTIONS.map(section => (
            <SectionCard key={section.id} section={section} />
          ))}
        </div>
      </div>

      {/* Dica final */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-5">
        <div className="flex gap-3">
          <CheckCircle2 size={20} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300 text-sm">Dica de ouro</p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1 leading-relaxed">
              A consistência é o segredo do sucesso financeiro. Reserve 5 minutos por dia para lançar suas transações e revisar o Dashboard. Em poucos meses, você terá uma visão clara e completa da sua vida financeira.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
