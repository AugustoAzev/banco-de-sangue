// Captura as evidências de usabilidade e acessibilidade do TP4 (prints, axe e Lighthouse).
//
// Pré-requisitos:
//   1. Sistema rodando com o Supabase configurado:  npm run build && npm start -- -p 3100
//   2. Ferramentas de medição (não ficam no package.json):
//        npm install --no-save lighthouse@12 axe-core@4
//
// Uso:
//   node scripts/capturar-evidencias.mjs <rotulo> <pasta-dos-prints> <pasta-dos-relatorios>
//   ex.: node scripts/capturar-evidencias.mjs depois docs/redesign/screenshots/depois docs/evolucao/evidencias
//
// Variáveis opcionais: BASE_URL (padrão http://localhost:3100), BS_EMAIL, BS_PASS.
// Atenção: o roteiro envia um cadastro de doador com CPF inválido (rejeitado, nada é
// gravado) e abre/cancela um diálogo de exclusão — não altera dados.
import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE_SRC = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const [label = 'antes', shotsDir = './out/shots', reportDir = './out/reports'] = process.argv.slice(2);
const BASE = process.env.BASE_URL || 'http://localhost:3100';
const PORT = 9333;
fs.mkdirSync(shotsDir, { recursive: true });
fs.mkdirSync(reportDir, { recursive: true });

const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bs-a11y-'));
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: true,
  viewport: { width: 1366, height: 860 },
  locale: 'pt-BR',
  args: [`--remote-debugging-port=${PORT}`],
});
const page = context.pages()[0] ?? (await context.newPage());
// O Supabase gratuito pode demorar alguns segundos por conexão; tempos folgados evitam falso erro.
page.setDefaultNavigationTimeout(120000);
page.setDefaultTimeout(60000);

async function runAxe() {
  await page.addScriptTag({ content: AXE_SRC });
  return page.evaluate(async () => {
    // eslint-disable-next-line no-undef
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return r.violations.map(v => ({
      id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
      exemplos: v.nodes.slice(0, 3).map(n => n.target.join(' ')),
    }));
  });
}

async function tabsUntil(predicateSrc, max = 40) {
  await page.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  await page.locator('body').click({ position: { x: 5, y: 5 } }).catch(() => {});
  for (let i = 1; i <= max; i++) {
    await page.keyboard.press('Tab');
    const hit = await page.evaluate(predicateSrc);
    if (hit) return i;
  }
  return null;
}

const results = { label, data: new Date().toISOString(), paginas: {} };

// 1) Login pela interface (como um usuário faria)
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
await page.screenshot({ path: `${shotsDir}/01-login.png` });
results.paginas.login = { axe: await runAxe() };
await page.getByLabel('E-mail profissional').fill(process.env.BS_EMAIL || 'admin@pulse.com');
await page.getByLabel('Senha').fill(process.env.BS_PASS || '12345678');
await page.getByRole('button', { name: /acessar sistema/i }).click();
await page.waitForURL(/dashboard/, { timeout: 20000 });
await page.waitForLoadState('networkidle');
await page.waitForTimeout(800);

const routes = [
  ['dashboard', '/dashboard'],
  ['doadores', '/doadores'],
  ['estoque', '/estoque'],
  ['insumos', '/insumos'],
];

let n = 2;
for (const [name, route] of routes) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  const prefix = String(n++).padStart(2, '0');
  await page.screenshot({ path: `${shotsDir}/${prefix}-${name}.png`, fullPage: true });
  results.paginas[name] = { axe: await runAxe() };
  results.paginas[name].ariaMain = await page.locator('main').ariaSnapshot().catch(() => null);
}

// 2) Estados com interação
// Doadores: formulário aberto
await page.goto(`${BASE}/doadores`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.getByRole('button', { name: /novo doador/i }).click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${shotsDir}/${String(n++).padStart(2, '0')}-doadores-formulario.png`, fullPage: true });
results.paginas['doadores-formulario'] = {
  axe: await runAxe(),
  ariaForm: await page.locator('form').first().ariaSnapshot().catch(() => null),
};
// Envio do formulário com CPF inválido para ver o retorno de erro
await page.locator('input[name="nome"]').fill('Teste Avaliacao');
await page.locator('input[name="cpf"]').fill('123');
await page.locator('input[name="idade"]').fill('30');
await page.locator('select[name="sexo"]').selectOption({ index: 1 });
await page.locator('select[name="tipo_sanguineo"]').selectOption({ index: 1 });
await page.locator('input[type="checkbox"]').evaluateAll(els => els.forEach(e => { if (!e.checked) e.click(); }));
await page.getByRole('button', { name: /cadastrar doador/i }).click();
await page.waitForTimeout(1500);
await page.screenshot({ path: `${shotsDir}/${String(n++).padStart(2, '0')}-doadores-erro-cpf.png` });
await page.waitForTimeout(5500);
await page.screenshot({ path: `${shotsDir}/${String(n++).padStart(2, '0')}-doadores-erro-apos-6s.png` });

// Teclado: quantos Tabs até o botão principal da tela de doadores
await page.goto(`${BASE}/doadores`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
results.teclado = {
  tabsAteNovoDoador: await tabsUntil(() => /novo doador/i.test(document.activeElement?.textContent || '')),
};
// Teclado: foco no primeiro botão de ação da tabela (mostra se o foco é visível)
const tabsAcao = await tabsUntil(() => !!document.activeElement?.closest('td'));
results.teclado.tabsAtePrimeiraAcaoTabela = tabsAcao;
results.teclado.nomeAcessivelPrimeiraAcao = await page.evaluate(() => {
  const el = document.activeElement;
  return el ? (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent.trim() || '(sem nome)') : null;
});
await page.screenshot({ path: `${shotsDir}/${String(n++).padStart(2, '0')}-teclado-foco-acao.png` });

// Diálogo de confirmação: para onde vai o foco ao abrir?
await page.keyboard.press('End');
const acoes = page.locator('td button');
if (await acoes.count()) {
  await acoes.last().focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  results.teclado.focoAoAbrirDialogo = await page.evaluate(() => {
    const el = document.activeElement;
    const dentro = !!el?.closest('[role="alertdialog"],[role="dialog"]');
    return { dentroDoDialogo: dentro, elemento: el?.tagName, texto: (el?.textContent || '').trim().slice(0, 40) };
  });
  await page.screenshot({ path: `${shotsDir}/${String(n++).padStart(2, '0')}-dialogo-confirmacao.png` });
  results.paginas['dialogo-confirmacao'] = { axe: await runAxe() };
  // Três Tabs com o diálogo aberto: o foco continua dentro dele?
  for (let i = 0; i < 3; i++) await page.keyboard.press('Tab');
  results.teclado.focoDentroDoDialogoAposTresTabs = await page.evaluate(
    () => !!document.activeElement?.closest('[role="alertdialog"],[role="dialog"]'),
  );
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  results.teclado.focoAoFecharDialogo = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return '(nenhum — foco perdido no documento)';
    return el.getAttribute('aria-label') || el.getAttribute('title') || el.tagName;
  });
}

// Atalho "Pular para o conteúdo": Tab → Enter → Tab até o botão principal.
await page.goto(`${BASE}/doadores`, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.keyboard.press('Tab');
const primeiroFoco = await page.evaluate(() => (document.activeElement?.textContent || '').trim());
await page.waitForTimeout(400); // espera a transição do atalho terminar antes da captura
await page.screenshot({ path: `${shotsDir}/${String(n++).padStart(2, '0')}-primeiro-tab.png` });
let teclasComAtalho = null;
if (/pular para o conte/i.test(primeiroFoco)) {
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  const ativo = await page.evaluate(() => (document.activeElement?.textContent || '').trim());
  if (/novo doador/i.test(ativo)) teclasComAtalho = 3;
}
results.teclado.primeiroElementoNoTab = primeiroFoco;
results.teclado.teclasAteNovoDoadorComAtalho = teclasComAtalho;

// Foco visível em um campo de formulário
await page.getByRole('button', { name: /novo doador/i }).click();
await page.waitForTimeout(300);
await page.locator('input[name="nome"]').focus();
await page.screenshot({ path: `${shotsDir}/${String(n++).padStart(2, '0')}-foco-campo.png`, clip: { x: 248, y: 0, width: 1118, height: 420 } });

// 3) Lighthouse (categoria acessibilidade) nas rotas, reaproveitando a sessão logada
results.lighthouse = {};
for (const [name, route] of [['login', '/'], ...routes]) {
  if (name === 'login') continue; // login redireciona quando já há sessão; medido abaixo
  const r = await lighthouse(`${BASE}${route}`, {
    port: PORT, output: 'json', logLevel: 'error', onlyCategories: ['accessibility'],
    disableStorageReset: true, formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1366, height: 860, deviceScaleFactor: 1, disabled: false },
  });
  const cat = r.lhr.categories.accessibility;
  const falhas = cat.auditRefs
    .map(a => r.lhr.audits[a.id])
    .filter(a => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'notApplicable' && a.scoreDisplayMode !== 'manual' && a.scoreDisplayMode !== 'informative')
    .map(a => a.title);
  results.lighthouse[name] = { score: Math.round(cat.score * 100), falhas };
}
// Login sem sessão
await page.evaluate(() => localStorage.clear());
{
  const r = await lighthouse(`${BASE}/`, {
    port: PORT, output: 'json', logLevel: 'error', onlyCategories: ['accessibility'],
    disableStorageReset: true, formFactor: 'desktop',
    screenEmulation: { mobile: false, width: 1366, height: 860, deviceScaleFactor: 1, disabled: false },
  });
  const cat = r.lhr.categories.accessibility;
  results.lighthouse.login = {
    score: Math.round(cat.score * 100),
    falhas: cat.auditRefs.map(a => r.lhr.audits[a.id]).filter(a => a.score !== null && a.score < 1 && !['notApplicable', 'manual', 'informative'].includes(a.scoreDisplayMode)).map(a => a.title),
  };
}

await context.close();
fs.writeFileSync(path.join(reportDir, `relatorio-${label}.json`), JSON.stringify(results, null, 2));

// Resumo no console
console.log(`== ${label} ==`);
for (const [k, v] of Object.entries(results.lighthouse)) console.log(`Lighthouse ${k.padEnd(10)} ${v.score}  falhas: ${v.falhas.join(' | ')}`);
for (const [k, v] of Object.entries(results.paginas)) {
  const total = v.axe.reduce((s, x) => s + x.nodes, 0);
  console.log(`axe ${k.padEnd(22)} ${v.axe.length} regras / ${total} elementos: ${v.axe.map(x => `${x.id}(${x.nodes})`).join(', ')}`);
}
console.log('teclado', JSON.stringify(results.teclado));
