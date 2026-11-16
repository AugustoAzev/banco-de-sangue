import { defineConfig, devices } from '@playwright/test';

// Testes de ponta a ponta (E2E) pela interface, contra o servidor de produção já construído.
// Pré-requisito: `npm run build` (o CI faz isso no job anterior) e as variáveis do .env.
const PORT = Number(process.env.E2E_PORT ?? 3000);
const emCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  // Os arquivos *.test.ts são do Jest; o Playwright só pega os *.spec.js.
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  forbidOnly: emCI,
  retries: emCI ? 1 : 0,
  reporter: emCI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start',
    env: { PORT: String(PORT) },
    url: `http://localhost:${PORT}/api/health`,
    reuseExistingServer: !emCI,
    timeout: 60_000,
  },
});
