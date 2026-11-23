// Configuração do ESLint no formato "flat config" (ESLint 9).
// O `next lint` foi descontinuado pelo Next.js 15.5; o lint passa a ser feito
// direto pelo ESLint, com as mesmas regras recomendadas pelo Next.
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'dist/**',
      'test-results/**',
      'playwright-report/**',
      'next-env.d.ts',
    ],
  },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    // Nos testes, `req`/`res` são objetos falsos montados à mão para chamar as rotas
    // da API sem servidor; tipá-los por completo não traz segurança nenhuma ao teste.
    files: ['tests/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
];

export default config;
