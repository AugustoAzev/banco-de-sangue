/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['bcryptjs'],
  // Gera em .next/standalone um servidor Node autossuficiente (só as dependências usadas).
  // É o artefato que `npm run package` empacota, como o .jar no Maven. A Vercel ignora a opção.
  output: 'standalone',
  // O lint é uma fase própria do pipeline (`npm run lint`); não precisa rodar de novo no build.
  eslint: { ignoreDuringBuilds: true },
};

module.exports = nextConfig;
