# Domínio Financeiro — Sistema Web

Aplicação web de controle financeiro pessoal construída com **Next.js 14**, **TypeScript**, **Tailwind CSS** e banco de dados **SQLite** (via better-sqlite3).

## Funcionalidades

- Dashboard com resumo mensal, gráficos de receitas/despesas e alertas
- Transações (receitas e despesas) com recorrência mensal e parcelamento
- Categorias personalizáveis
- Orçamento mensal por categoria com barra de progresso
- Investimentos (reserva de emergência, longo prazo, projetos futuros)
- Patrimônio (ativos e passivos com cálculo de patrimônio líquido)
- Relatórios anuais com gráficos de barras, linha e pizza
- Alertas de vencimentos (vencidas, hoje, em breve)
- Autenticação completa (login, registro, recuperação de senha)

---

## Como rodar localmente

```bash
# 1. Instale as dependências
npm install

# 2. Crie o arquivo de variáveis de ambiente
cp .env.example .env.local

# 3. Edite .env.local e defina o JWT_SECRET
# JWT_SECRET=qualquer-string-segura

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: http://localhost:3001

---

## Deploy no Vercel via GitHub

### Passo 1 — Subir o código para o GitHub

```bash
cd dominio-financeiro-web
git init
git add .
git commit -m "feat: sistema web Domínio Financeiro"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/dominio-financeiro-web.git
git push -u origin main
```

### Passo 2 — Criar projeto no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New Project"**
3. Importe o repositório `dominio-financeiro-web` do GitHub
4. Na tela de configuração, defina as **variáveis de ambiente**:

| Variável | Valor |
|----------|-------|
| `JWT_SECRET` | Uma string aleatória e segura (ex: `openssl rand -base64 32`) |
| `DB_DIR` | `/tmp` |

5. Clique em **Deploy**

> **Importante sobre o banco de dados:** O Vercel usa um sistema de arquivos efêmero. O banco SQLite em `/tmp` funciona para uso individual, mas os dados são resetados periodicamente. Para uso em produção com múltiplos usuários, recomenda-se migrar para um banco externo como **PlanetScale**, **Supabase** ou **Turso** (SQLite na nuvem).

### Passo 3 — Acessar o sistema

Após o deploy, o Vercel fornecerá uma URL como:
`https://dominio-financeiro-web.vercel.app`

Crie sua conta diretamente na tela de registro.

---

## Estrutura do projeto

```
src/
  app/
    (auth)/          ← Páginas de login, registro, recuperação de senha
    (app)/           ← Páginas protegidas (dashboard, transações, etc.)
    api/
      auth/          ← API de autenticação
      finance/       ← API de dados financeiros
  components/
    layout/          ← Sidebar e TopBar
    modals/          ← Modais de formulários
  lib/
    db.ts            ← Banco de dados SQLite
    auth.ts          ← JWT e cookies
    finance-context.tsx ← Estado global de finanças
    utils.ts         ← Utilitários
  types/
    finance.ts       ← Tipos TypeScript
  data/
    default-categories.ts ← Categorias padrão
```

---

## Tecnologias

| Tecnologia | Versão |
|------------|--------|
| Next.js | 14.2.5 |
| React | 18.3 |
| TypeScript | 5 |
| Tailwind CSS | 3.4 |
| better-sqlite3 | 11.3 |
| bcryptjs | 2.4 |
| jsonwebtoken | 9.0 |
| recharts | 2.12 |
| lucide-react | 0.447 |
