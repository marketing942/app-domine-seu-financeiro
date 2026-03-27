/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // O código está em src/ — Next.js 14 detecta isso automaticamente via tsconfig paths
  // Não usar output: 'export' pois temos API routes e server components
};

module.exports = nextConfig;
