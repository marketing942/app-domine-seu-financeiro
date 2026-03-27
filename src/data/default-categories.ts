import { Category } from '@/types/finance';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat_moradia', name: 'Moradia', icon: 'home', color: '#6366F1',
    type: 'expense', isDefault: true,
    subcategories: [
      { id: 'sub_aluguel', name: 'Aluguel', categoryId: 'cat_moradia' },
      { id: 'sub_agua', name: 'Água', categoryId: 'cat_moradia' },
      { id: 'sub_luz', name: 'Luz / Energia', categoryId: 'cat_moradia' },
      { id: 'sub_condominio', name: 'Condomínio', categoryId: 'cat_moradia' },
      { id: 'sub_gas', name: 'Gás', categoryId: 'cat_moradia' },
      { id: 'sub_manutencao', name: 'Manutenção', categoryId: 'cat_moradia' },
    ],
  },
  {
    id: 'cat_transporte', name: 'Transporte', icon: 'car', color: '#0EA5E9',
    type: 'expense', isDefault: true,
    subcategories: [
      { id: 'sub_gasolina', name: 'Gasolina', categoryId: 'cat_transporte' },
      { id: 'sub_uber', name: 'Uber / Táxi', categoryId: 'cat_transporte' },
      { id: 'sub_onibus', name: 'Ônibus / Metrô', categoryId: 'cat_transporte' },
      { id: 'sub_manut_carro', name: 'Manutenção do carro', categoryId: 'cat_transporte' },
      { id: 'sub_seguro_auto', name: 'Seguro do carro', categoryId: 'cat_transporte' },
    ],
  },
  {
    id: 'cat_alimentacao', name: 'Alimentação', icon: 'utensils', color: '#F97316',
    type: 'expense', isDefault: true,
    subcategories: [
      { id: 'sub_supermercado', name: 'Supermercado', categoryId: 'cat_alimentacao' },
      { id: 'sub_restaurante', name: 'Restaurante', categoryId: 'cat_alimentacao' },
      { id: 'sub_delivery', name: 'Delivery', categoryId: 'cat_alimentacao' },
      { id: 'sub_padaria', name: 'Padaria / Café', categoryId: 'cat_alimentacao' },
    ],
  },
  {
    id: 'cat_saude', name: 'Saúde', icon: 'heart', color: '#EF4444',
    type: 'expense', isDefault: true,
    subcategories: [
      { id: 'sub_plano_saude', name: 'Plano de saúde', categoryId: 'cat_saude' },
      { id: 'sub_consulta', name: 'Consulta médica', categoryId: 'cat_saude' },
      { id: 'sub_farmacia', name: 'Farmácia', categoryId: 'cat_saude' },
      { id: 'sub_academia', name: 'Academia', categoryId: 'cat_saude' },
    ],
  },
  {
    id: 'cat_educacao', name: 'Educação', icon: 'book', color: '#8B5CF6',
    type: 'expense', isDefault: true,
    subcategories: [
      { id: 'sub_mensalidade', name: 'Mensalidade', categoryId: 'cat_educacao' },
      { id: 'sub_curso', name: 'Curso / Treinamento', categoryId: 'cat_educacao' },
      { id: 'sub_livros', name: 'Livros / Material', categoryId: 'cat_educacao' },
    ],
  },
  {
    id: 'cat_lazer', name: 'Lazer', icon: 'smile', color: '#EC4899',
    type: 'expense', isDefault: true,
    subcategories: [
      { id: 'sub_streaming', name: 'Streaming', categoryId: 'cat_lazer' },
      { id: 'sub_viagem', name: 'Viagem', categoryId: 'cat_lazer' },
      { id: 'sub_cinema', name: 'Cinema / Show', categoryId: 'cat_lazer' },
      { id: 'sub_hobby', name: 'Hobby', categoryId: 'cat_lazer' },
    ],
  },
  {
    id: 'cat_financeiro', name: 'Financeiro', icon: 'credit-card', color: '#64748B',
    type: 'expense', isDefault: true,
    subcategories: [
      { id: 'sub_cartao', name: 'Cartão de crédito', categoryId: 'cat_financeiro' },
      { id: 'sub_emprestimo', name: 'Empréstimo', categoryId: 'cat_financeiro' },
      { id: 'sub_financiamento', name: 'Financiamento', categoryId: 'cat_financeiro' },
      { id: 'sub_seguro', name: 'Seguro', categoryId: 'cat_financeiro' },
      { id: 'sub_taxa', name: 'Taxas / Tarifas', categoryId: 'cat_financeiro' },
    ],
  },
  {
    id: 'cat_outros_desp', name: 'Outros', icon: 'more-horizontal', color: '#94A3B8',
    type: 'expense', isDefault: true,
    subcategories: [],
  },
  // ── RECEITAS ──────────────────────────────────────────────────
  {
    id: 'cat_salario', name: 'Salário', icon: 'briefcase', color: '#10B981',
    type: 'income', isDefault: true,
    subcategories: [
      { id: 'sub_salario_fixo', name: 'Salário fixo', categoryId: 'cat_salario' },
      { id: 'sub_bonus', name: 'Bônus / Comissão', categoryId: 'cat_salario' },
      { id: 'sub_ferias', name: 'Férias / 13º', categoryId: 'cat_salario' },
    ],
  },
  {
    id: 'cat_freelance', name: 'Freelance', icon: 'laptop', color: '#06B6D4',
    type: 'income', isDefault: true,
    subcategories: [],
  },
  {
    id: 'cat_rendimentos', name: 'Rendimentos', icon: 'trending-up', color: '#84CC16',
    type: 'income', isDefault: true,
    subcategories: [
      { id: 'sub_dividendos', name: 'Dividendos', categoryId: 'cat_rendimentos' },
      { id: 'sub_aluguel_rec', name: 'Aluguel recebido', categoryId: 'cat_rendimentos' },
      { id: 'sub_juros', name: 'Juros / CDB / Poupança', categoryId: 'cat_rendimentos' },
    ],
  },
  {
    id: 'cat_outros_rec', name: 'Outras receitas', icon: 'plus-circle', color: '#A3E635',
    type: 'income', isDefault: true,
    subcategories: [],
  },
];
