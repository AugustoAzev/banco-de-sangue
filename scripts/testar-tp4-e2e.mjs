// Testes de ponta a ponta do TP4 pela interface, contra o sistema rodando e o banco real.
//
// Cobre: o checklist do enunciado (redesign, funcionalidades novas e acessibilidade) e
// regressão das áreas vizinhas (login, cadastro, edição, CPF duplicado, CEP, anonimização,
// exclusão, insumos, estoque, responsivo, erros de console, API).
//
// Pré-requisitos:
//   1. npm run build && npm start -- -p 3100
//   2. npm install --no-save axe-core@4
// Uso:
//   node scripts/testar-tp4-e2e.mjs [pasta-de-saída]
//
// Dados: tudo o que o roteiro cria leva o prefixo "E2E TP4" e é apagado no final (bloco
// finally), inclusive se algum teste falhar. As bolsas de teste usam um tipo sanguíneo que
// estava SEM estoque no início, para que as saídas não alterem bolsas reais.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE_SRC = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const BASE = process.env.BASE_URL || 'http://localhost:3100';
const EMAIL = process.env.BS_EMAIL || 'admin@pulse.com';
const PASS = process.env.BS_PASS || '12345678';
const OUT = process.argv[2] || './e2e-saida';
const ENV_FILE = process.env.ENV_FILE || path.resolve('.env');
fs.mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------- acesso direto ao banco (só limpeza e conferência)
const env = Object.fromEntries(
  fs.readFileSync(ENV_FILE, 'utf8').split(/\r?\n/).filter(l => /^\w+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
);
const REST = `${env.SUPABASE_URL}/rest/v1`;
const SVC = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' };
const rest = async (p, opts = {}) => {
  const r = await fetch(`${REST}${p}`, { ...opts, headers: { ...SVC, ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`REST ${opts.method || 'GET'} ${p} -> ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json().catch(() => null);
};

// ---------------------------------------------------------------- execução
const RUN = String(Date.now()).slice(-6);
const START = new Date(Date.now() - 2 * 60 * 1000).toISOString();
const NOME_A = `E2E TP4 Teste ${RUN} Mouse`;
const NOME_B = `E2E TP4 Teste ${RUN} Teclado`;
const CPF_A = `9${RUN}4321`;
const CPF_B = `8${RUN}1234`;
const mask = d => `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
const INSUMO = `E2E TP4 Insumo ${RUN}`;
const criados = { doadores: new Set() };

const results = [];
const consoleErrors = [];
let page;

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
async function check(id, area, desc, fn) {
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ id, area, desc, ok: true, detail: detail ?? '' });
    console.log(`✔ ${id} ${desc}${detail ? ` — ${detail}` : ''}`);
  } catch (e) {
    const detail = String(e?.message || e).split('\n')[0].slice(0, 300);
    results.push({ id, area, desc, ok: false, detail });
    console.log(`✘ ${id} ${desc} — ${detail}`);
    await page?.screenshot({ path: path.join(OUT, `falha-${id}.png`) }).catch(() => {});
    await page?.keyboard.press('Escape').catch(() => {});
  } finally {
    results[results.length - 1].segundos = Math.round((Date.now() - t0) / 100) / 10;
  }
}

function watchConsole(p, label) {
  p.on('pageerror', e => consoleErrors.push(`${label}: pageerror ${e.message}`));
  p.on('console', m => {
    // 4xx esperados (login inválido, 409 do registro do sistema) aparecem como "Failed to load resource".
    if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) consoleErrors.push(`${label}: ${m.text()}`);
  });
}

async function waitReady(route) {
  if (route === '/dashboard') {
    await page.waitForFunction(() => {
      const v = [...document.querySelectorAll('.stat-value')];
      return v.length === 4 && v.every(e => !e.textContent.includes('—'));
    });
    await page.waitForFunction(() => !document.body.innerText.includes('Carregando movimentações'));
  } else if (route === '/estoque') {
    await page.waitForFunction(() => document.querySelectorAll('tbody tr').length >= 1 && !document.body.innerText.includes('Atualizando estoque'));
  } else if (route === '/doadores') {
    await page.waitForFunction(() => /doadores (cadastrados|encontrados)/.test(document.querySelector('#busca-resultado')?.textContent || ''));
  } else if (route === '/insumos') {
    await page.waitForFunction(() => !document.body.innerText.includes('Carregando insumos'));
  }
}
async function go(route) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });
  await waitReady(route);
}
const toast = re => page.locator('.system-toast').filter({ hasText: re }).first();
async function axe() {
  await page.addScriptTag({ content: AXE_SRC });
  const v = await page.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } })).violations.map(x => `${x.id}(${x.nodes.length})`));
  return v;
}
const token = () => page.evaluate(() => localStorage.getItem('@BancoSangue:token'));
async function api(method, url, data) {
  const r = await page.request.fetch(`${BASE}${url}`, { method, headers: { Authorization: `Bearer ${await token()}` }, data });
  let body = null;
  try { body = await r.json(); } catch { /* 204 */ }
  return { status: r.status(), body };
}
async function estoqueTabela() {
  await waitReady('/estoque');
  return page.$$eval('tbody tr', trs => trs.map(tr => ({
    tipo: tr.querySelector('.blood-type-chip')?.textContent.trim(),
    qtd: Number(tr.children[1]?.textContent.trim()),
    situacao: tr.children[3]?.textContent.trim(),
  })));
}
const activeInfo = () => page.evaluate(() => {
  const el = document.activeElement;
  return { id: el?.id || '', text: (el?.textContent || '').trim(), label: el?.getAttribute('aria-label') || '', inDialog: !!el?.closest('[role="alertdialog"]') };
});
async function abrirCadastroDoador() {
  await go('/doadores');
  await page.getByRole('button', { name: 'Novo Doador' }).click();
  await page.getByLabel('Nome Completo *').waitFor();
}
async function preencherDoador({ nome, cpf, idade = '30', sexo = 'Feminino', tipo = 'A_POSITIVO', triagem = true, consentimento = true }) {
  await page.getByLabel('Nome Completo *').fill(nome);
  await page.getByLabel('CPF *', { exact: true }).fill(cpf);
  await page.getByLabel('Idade *').fill(idade);
  await page.getByLabel('Sexo *').selectOption(sexo);
  await page.getByLabel('Tipo Sanguíneo *').selectOption(tipo);
  for (const n of ['condicao_1', 'condicao_2', 'condicao_3']) await page.locator(`input[name="${n}"]`).setChecked(triagem);
  await page.locator('input[name="consentimento_lgpd"]').setChecked(consentimento);
}
async function idDoadorPorCpf(digits) {
  const { body } = await api('GET', '/api/donors');
  return body.find(d => (d.cpf || '').replace(/\D/g, '') === digits)?.id_doador;
}

const browser = await chromium.launch({ headless: true });
let tipoTeste = null;
try {
  // ================================================================ B. Login e sessão
  const anon = await browser.newContext({ viewport: { width: 1366, height: 860 }, locale: 'pt-BR' });
  page = await anon.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(120000);
  watchConsole(page, 'anônimo');

  await check('B1', 'Regressão — login', 'Rota protegida sem sessão redireciona para o login', async () => {
    await page.goto(`${BASE}/doadores`);
    await page.waitForURL(u => new URL(u).pathname === '/', { timeout: 30000 });
  });
  await check('B2', 'Regressão — login', 'Senha errada mostra erro e o aviso de erro não some sozinho (9 s)', async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.getByLabel('E-mail profissional').fill(EMAIL);
    await page.getByLabel('Senha').fill('senha-errada');
    await page.getByRole('button', { name: /acessar sistema/i }).click();
    await toast(/Credenciais inválidas/).waitFor();
    await page.waitForTimeout(9000);
    assert(await toast(/Credenciais inválidas/).isVisible(), 'aviso de erro sumiu antes de 9 s');
    return 'mensagem continua visível após 9 s';
  });
  await check('B3', 'Regressão — API', 'API recusa acesso sem token (401)', async () => {
    const urls = [['GET', '/api/donors'], ['GET', '/api/inventory/bolsas'], ['GET', '/api/inventory/movimentacoes'], ['POST', '/api/inventory/saidas']];
    const st = [];
    for (const [m, u] of urls) st.push((await page.request.fetch(`${BASE}${u}`, { method: m })).status());
    assert(st.every(s => s === 401), `status: ${st.join(', ')}`);
    return st.join(', ');
  });
  await check('F1a', 'Acessibilidade', 'Login sem violações WCAG A/AA (axe)', async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const v = await axe();
    assert(v.length === 0, v.join(', '));
  });
  await anon.close();

  const ctx = await browser.newContext({ viewport: { width: 1366, height: 860 }, locale: 'pt-BR' });
  page = await ctx.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(120000);
  watchConsole(page, 'logado');

  await check('B4', 'Regressão — login', 'Login válido leva ao painel', async () => {
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    await page.getByLabel('E-mail profissional').fill(EMAIL);
    await page.getByLabel('Senha').fill(PASS);
    await page.getByRole('button', { name: /acessar sistema/i }).click();
    await page.waitForURL(/dashboard/);
    await waitReady('/dashboard');
  });

  // ================================================================ C. Etapa 1 — Redesign
  await check('C10', 'Redesign (M09 · H2)', 'Perfil exibido como "Administrador" (não o enum)', async () => {
    const t = await page.locator('.app-user').innerText();
    assert(/Administrador\b/.test(t) && !/ADMINISTRADOR/.test(t), t.replace(/\s+/g, ' '));
  });
  await check('F6', 'Acessibilidade (2.4.2)', 'Cada tela tem título próprio na aba', async () => {
    const out = [];
    for (const [r, t] of [['/dashboard', 'Painel Geral'], ['/doadores', 'Doadores'], ['/estoque', 'Estoque de Sangue'], ['/insumos', 'Insumos']]) {
      await go(r);
      const title = await page.title();
      assert(title === `${t} — Banco de Sangue`, `${r}: "${title}"`);
      out.push(title);
    }
    return out.join(' | ');
  });
  await check('C2', 'Redesign (M01 · H4)', 'Os 4 cards do painel são links que levam à tela certa', async () => {
    const alvos = { 'Total de Doadores': '/doadores', 'Bolsas em Estoque': '/estoque', 'Menor Estoque': '/estoque', 'Insumos em Baixo Estoque': '/insumos' };
    for (const [titulo, rota] of Object.entries(alvos)) {
      await go('/dashboard');
      await page.locator('a.stat-card-link', { hasText: titulo }).click();
      await page.waitForURL(u => new URL(u).pathname === rota);
    }
    return 'todos navegam';
  });

  let painel;
  await check('C1', 'Redesign (M01 · H1)', 'Números do painel batem com as telas de estoque, doadores e insumos', async () => {
    await go('/dashboard');
    const card = async t => (await page.locator('a.stat-card-link', { hasText: t }).locator('.stat-value').innerText()).split('\n')[0].trim();
    painel = {
      doadores: Number(await card('Total de Doadores')),
      bolsas: Number(await card('Bolsas em Estoque')),
      menor: await page.locator('a.stat-card-link', { hasText: 'Menor Estoque' }).locator('.stat-value [aria-hidden="true"]').innerText(),
      insumosBaixos: Number(await card('Insumos em Baixo Estoque')),
      avisos: await page.locator('.notice-list li strong').allInnerTexts(),
    };
    await go('/estoque');
    const tab = await estoqueTabela();
    const soma = tab.reduce((s, r) => s + r.qtd, 0);
    const minQtd = Math.min(...tab.map(r => r.qtd));
    const abaixo = tab.filter(r => r.qtd < 3).map(r => r.tipo).sort();
    assert(painel.bolsas === soma, `painel ${painel.bolsas} ≠ soma do estoque ${soma}`);
    assert(tab.find(r => r.tipo === painel.menor)?.qtd === minQtd, `menor estoque ${painel.menor} não tem a menor quantidade (${minQtd})`);
    assert(JSON.stringify([...painel.avisos].sort()) === JSON.stringify(abaixo), `avisos [${painel.avisos}] ≠ abaixo do mínimo [${abaixo}]`);
    await go('/doadores');
    const total = Number((await page.locator('#busca-resultado').innerText()).match(/\d+/)[0]);
    assert(painel.doadores === total, `painel ${painel.doadores} doadores ≠ lista ${total}`);
    await go('/insumos');
    const qtds = (await page.$$eval('tbody tr', trs => trs.map(tr => Number(tr.children[2]?.textContent)))).filter(n => !Number.isNaN(n));
    const baixos = qtds.filter(q => q < 10).length;
    assert(painel.insumosBaixos === baixos, `painel ${painel.insumosBaixos} ≠ insumos < 10: ${baixos}`);
    tipoTeste = tab.find(r => r.qtd === 0)?.tipo ?? null;
    return `bolsas ${soma}, menor ${painel.menor} (${minQtd}), ${abaixo.length} tipos abaixo do mínimo, ${total} doadores, ${baixos} insumos baixos`;
  });
  await check('C3', 'Redesign (M02 · H1/H2)', 'Estoque lista os 8 tipos, sem "ID Lote", com situação coerente', async () => {
    await go('/estoque');
    const tab = await estoqueTabela();
    const heads = await page.$$eval('thead th', ths => ths.map(t => t.textContent.trim()));
    assert(tab.length === 8, `${tab.length} linhas`);
    assert(!heads.some(h => /id lote/i.test(h)), `cabeçalhos: ${heads}`);
    for (const r of tab) {
      const esperado = r.qtd === 0 ? 'Sem estoque' : r.qtd < 3 ? 'Abaixo do mínimo' : 'Adequado';
      assert(r.situacao === esperado, `${r.tipo}: ${r.qtd} bolsas mostra "${r.situacao}"`);
    }
    return heads.join(' | ');
  });
  await check('C11', 'Redesign (M10 · H10)', 'Dicas de preenchimento visíveis (450 mL, mínimo, limite de insumos, CEP)', async () => {
    await go('/estoque');
    assert(await page.getByText('Estoque mínimo: 3 bolsas por tipo').isVisible(), 'sem estoque mínimo');
    await page.getByRole('button', { name: 'Registrar Entrada' }).click();
    assert(await page.getByText('Cada unidade corresponde a uma bolsa de 450 mL.').isVisible(), 'sem dica de 450 mL');
    await go('/insumos');
    await page.getByRole('button', { name: 'Adicionar Item' }).click();
    assert(await page.getByText(/Abaixo de 10 unidades/).isVisible(), 'sem dica de baixo estoque');
    await abrirCadastroDoador();
    assert(await page.getByText(/Ao sair do campo, o endereço é preenchido/).isVisible(), 'sem dica do CEP');
  });
  await check('C7', 'Redesign (M06 · H6)', 'Todo botão de ícone tem dica (title)', async () => {
    const semDica = [];
    for (const r of ['/doadores', '/estoque', '/insumos']) {
      await go(r);
      semDica.push(...(await page.$$eval('button.icon-btn', bs => bs.filter(b => !b.title).map(b => b.outerHTML.slice(0, 60)))));
    }
    assert(semDica.length === 0, semDica.join(' ; '));
  });
  await check('C4', 'Redesign (M03 · H5)', 'Registro do sistema protegido na tela e na API (409)', async () => {
    await go('/doadores');
    const linha = page.locator('tbody tr', { hasText: '000.000.000-00' });
    assert(await linha.getByText('Registro do sistema').isVisible(), 'sem selo');
    assert((await linha.locator('button').count()) === 0, 'linha tem botões de ação');
    const { body } = await api('GET', '/api/donors');
    const gen = body.find(d => (d.cpf || '').replace(/\D/g, '') === '00000000000');
    const st = [
      (await api('PUT', `/api/donors/${gen.id_doador}`, { nome: 'x' })).status,
      (await api('DELETE', `/api/donors/${gen.id_doador}`)).status,
      (await api('PATCH', `/api/donors/${gen.id_doador}/anonymize`)).status,
    ];
    assert(st.every(s => s === 409), `status ${st}`);
    const depois = (await api('GET', '/api/donors')).body.find(d => d.id_doador === gen.id_doador);
    assert(depois && depois.cpf === gen.cpf && !depois.anonimizado_em, 'registro foi alterado');
    return `PUT/DELETE/anonymize → ${st.join('/')}`;
  });
  await check('C6', 'Redesign (M05 · H4)', 'Formulários padronizados: botão do cabeçalho some, "Cancelar" fecha e devolve o foco', async () => {
    const casos = [['/doadores', 'Novo Doador', 'btn-novo-doador'], ['/estoque', 'Registrar Entrada', 'btn-registrar-entrada'], ['/insumos', 'Adicionar Item', 'btn-novo-insumo']];
    for (const [r, botao, id] of casos) {
      await go(r);
      await page.getByRole('button', { name: botao, exact: true }).click();
      assert((await page.getByRole('button', { name: botao, exact: true }).count()) === 0, `${r}: botão do cabeçalho continua visível`);
      await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await page.waitForTimeout(150);
      const a = await activeInfo();
      assert(a.id === id, `${r}: foco foi para "${a.id || a.text}"`);
    }
    return 'doadores, estoque e insumos';
  });
  await check('C5', 'Redesign (M04 · H9) + A11y (3.3.1)', 'Erro de CPF aparece junto do campo, recebe o foco e continua após 8 s', async () => {
    await abrirCadastroDoador();
    await preencherDoador({ nome: `${NOME_A} invalido`, cpf: '123' });
    await page.getByRole('button', { name: 'Cadastrar Doador' }).click();
    const erro = page.locator('#doador-cpf-erro');
    await erro.waitFor();
    const a = await activeInfo();
    assert(a.id === 'doador-cpf', `foco em "${a.id}"`);
    assert(await page.getByLabel('CPF *', { exact: true }).getAttribute('aria-invalid') === 'true', 'sem aria-invalid');
    assert((await page.getByLabel('CPF *', { exact: true }).getAttribute('aria-describedby')) === 'doador-cpf-erro', 'erro não ligado ao campo');
    await page.waitForTimeout(8000);
    assert(await erro.isVisible(), 'mensagem sumiu');
    const v = await axe();
    assert(v.length === 0, `axe com erro na tela: ${v}`);
    return await erro.innerText();
  });

  // ================================================================ G. Regressão — doadores
  await check('G1', 'Regressão — doadores', 'Cadastro válido aparece na lista com CPF formatado; aviso de sucesso some sozinho', async () => {
    await abrirCadastroDoador();
    await preencherDoador({ nome: NOME_A, cpf: CPF_A, tipo: 'O_NEGATIVO' });
    await page.getByRole('button', { name: 'Cadastrar Doador' }).click();
    await toast(/cadastrado com sucesso/).waitFor();
    const id = await idDoadorPorCpf(CPF_A);
    assert(id, 'doador não encontrado na API');
    criados.doadores.add(id);
    const linha = page.locator('tbody tr', { hasText: NOME_A });
    await linha.waitFor({ timeout: 30000 });
    assert(await linha.getByText(mask(CPF_A)).isVisible(), 'CPF não formatado na lista');
    await page.waitForTimeout(9000);
    assert((await toast(/cadastrado com sucesso/).count()) === 0, 'aviso de sucesso não sumiu');
  });
  await check('G2', 'Regressão — doadores', 'CPF duplicado (mesmo número com máscara) é recusado junto do campo', async () => {
    await abrirCadastroDoador();
    await preencherDoador({ nome: `${NOME_A} duplicado`, cpf: mask(CPF_A) });
    await page.getByRole('button', { name: 'Cadastrar Doador' }).click();
    const erro = page.locator('#doador-cpf-erro');
    await erro.waitFor();
    const t = await erro.innerText();
    assert(/CPF já cadastrado/.test(t), t);
    return t;
  });
  await check('G4', 'Regressão — CEP (TP3)', 'CEP válido preenche o endereço (ViaCEP real); inexistente mostra aviso', async () => {
    await abrirCadastroDoador();
    await page.getByLabel('CEP').fill('01310-100');
    await page.getByLabel('Endereço').click();
    await page.waitForFunction(() => /Paulista/.test(document.querySelector('#doador-endereco')?.value || ''), null, { timeout: 30000 });
    const end = await page.getByLabel('Endereço').inputValue();
    await page.getByLabel('CEP').fill('00000-000');
    await page.getByLabel('Endereço').click();
    await page.locator('#doador-cep-status', { hasText: 'CEP não encontrado' }).waitFor({ timeout: 30000 });
    return end;
  });
  await check('G3', 'Regressão — doadores', 'Edição salva o nome; a API recusa idade fora da faixa (PUT)', async () => {
    await go('/doadores');
    await page.getByRole('button', { name: `Editar doador ${NOME_A}` }).click();
    assert(await page.getByLabel('CPF *', { exact: true }).isDisabled(), 'CPF editável na edição');
    await page.getByLabel('Nome Completo *').fill(`${NOME_A} Editado`);
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await toast(/atualizados/).waitFor();
    await waitReady('/doadores');
    assert(await page.locator('tbody tr', { hasText: `${NOME_A} Editado` }).isVisible(), 'nome novo não aparece');
    const id = [...criados.doadores][0];
    const r = await api('PUT', `/api/donors/${id}`, { idade: 70 });
    assert(r.status === 400, `PUT idade 70 → ${r.status}`);
    return `PUT idade 70 → ${r.status} (${r.body?.detail})`;
  });

  // ================================================================ F. Acessibilidade — teclado
  await check('F2', 'Acessibilidade (2.4.1)', 'Primeiro Tab é "Pular para o conteúdo"; Enter + Tab chega ao botão principal', async () => {
    await go('/doadores');
    await page.keyboard.press('Tab');
    let a = await activeInfo();
    assert(/Pular para o conteúdo principal/.test(a.text), `primeiro Tab: "${a.text}"`);
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    a = await activeInfo();
    assert(a.id === 'btn-novo-doador', `depois do atalho: "${a.id || a.text}"`);
    return '3 teclas';
  });
  await check('F9', 'Acessibilidade (2.4.3)', 'Ao trocar de tela pelo menu (Enter), o próximo Tab já vai para o conteúdo, não para o resto do menu', async () => {
    await go('/dashboard');
    await page.getByRole('link', { name: 'Doadores', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL(/doadores/);
    await waitReady('/doadores');
    await page.keyboard.press('Tab');
    const a = await activeInfo();
    assert(a.id === 'btn-novo-doador', `próximo Tab foi para "${a.id || a.text}"`);
    return 'Tab seguinte: "Novo Doador"';
  });
  await check('F8', 'Acessibilidade (2.1.1)', 'Cadastro completo de doador usando só o teclado', async () => {
    await go('/doadores');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // abre o formulário; o foco vai para o nome
    await page.waitForTimeout(200);
    const passos = [
      ['doador-nome', () => page.keyboard.type(NOME_B)],
      ['doador-cpf', () => page.keyboard.type(CPF_B)],
      ['doador-idade', () => page.keyboard.type('41')],
      ['doador-sexo', () => page.keyboard.type('M')],
      ['doador-tipo_sanguineo', () => page.keyboard.type('B')],
      ['doador-email', null], ['doador-telefone', null], ['doador-cep', null], ['doador-endereco', null],
    ];
    for (const [i, [esperado, acao]] of passos.entries()) {
      if (i > 0) await page.keyboard.press('Tab');
      const a = await activeInfo();
      assert(a.id === esperado, `passo ${i + 1}: foco em "${a.id || a.text}", esperado ${esperado}`);
      if (acao) await acao();
    }
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Tab'); await page.keyboard.press('Space'); } // 3 critérios + consentimento
    await page.keyboard.press('Tab');
    const a = await activeInfo();
    assert(/Cadastrar Doador/.test(a.text), `antes de enviar o foco está em "${a.text}"`);
    await page.keyboard.press('Enter');
    await toast(/cadastrado com sucesso/).waitFor();
    const id = await idDoadorPorCpf(CPF_B);
    assert(id, 'doador não gravado');
    criados.doadores.add(id);
    const d = (await api('GET', '/api/donors')).body.find(x => x.id_doador === id);
    assert(d.sexo === 'Masculino' && d.tipo_sanguineo === 'B_POSITIVO' && d.idade === 41, `gravado: ${d.sexo}/${d.tipo_sanguineo}/${d.idade}`);
    return 'gravado com sexo, tipo e idade escolhidos pelo teclado';
  });
  await check('F3', 'Acessibilidade (2.4.3 / 2.1.2)', 'Diálogo: foco no "Cancelar", Tab preso, Esc fecha e devolve o foco ao botão', async () => {
    await go('/doadores');
    const botao = page.getByRole('button', { name: `Excluir doador ${NOME_B}` });
    await botao.focus();
    await page.keyboard.press('Enter');
    await page.getByRole('alertdialog').waitFor();
    let a = await activeInfo();
    assert(a.inDialog && a.text === 'Cancelar', `ao abrir: "${a.text}" (dentro: ${a.inDialog})`);
    const msg = await page.getByRole('alertdialog').innerText();
    for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
    a = await activeInfo();
    assert(a.inDialog, 'foco saiu do diálogo com Tab');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    a = await activeInfo();
    assert(a.label === `Excluir doador ${NOME_B}`, `ao fechar: "${a.label || a.text}"`);
    assert(msg.includes(NOME_B), 'mensagem não cita o doador (M08)');
    assert((await idDoadorPorCpf(CPF_B)) !== undefined, 'Esc excluiu o doador');
    return 'confirmação cita o nome do doador';
  });
  await check('F5', 'Acessibilidade (4.1.2)', 'Botões de ação anunciam a ação e o nome do item', async () => {
    await go('/doadores');
    for (const n of [`Editar doador ${NOME_B}`, `Anonimizar dados de ${NOME_B} (LGPD)`, `Excluir doador ${NOME_B}`]) {
      assert((await page.getByRole('button', { name: n, exact: true }).count()) === 1, `sem botão "${n}"`);
    }
    return 'editar, anonimizar e excluir';
  });
  await check('F4', 'Acessibilidade (1.3.1 / 3.3.2)', 'Todos os campos dos formulários e filtros têm rótulo associado', async () => {
    const semRotulo = [];
    const conferir = async tela => {
      semRotulo.push(...(await page.$$eval('input:not([type=hidden]), select, textarea', (els, tela) => els
        .filter(e => !(e.labels && e.labels.length) && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby'))
        .map(e => `${tela}: ${e.name || e.id || e.type}`), tela)));
    };
    await abrirCadastroDoador(); await conferir('doador');
    await go('/estoque'); await conferir('estoque-filtro');
    await page.getByRole('button', { name: 'Registrar Entrada' }).click(); await conferir('estoque-entrada');
    await go('/insumos'); await page.getByRole('button', { name: 'Adicionar Item' }).click(); await conferir('insumo');
    assert(semRotulo.length === 0, semRotulo.join(', '));
    return 'doador, busca, estoque (filtro e entrada) e insumo';
  });

  // ================================================================ E. Funcionalidade 2 — busca
  const contagem = async () => (await page.locator('#busca-resultado').innerText()).trim();
  const nomesVisiveis = () => page.$$eval('tbody tr td:first-child', tds => tds.map(t => t.textContent.trim()));
  await check('E1', 'Funcionalidade 2 — busca', 'Nome sem diferenciar acento e maiúsculas', async () => {
    await go('/doadores');
    await page.getByLabel('Buscar por nome ou CPF').fill('e2e tp4 teste ' + RUN);
    await page.waitForTimeout(200);
    const n1 = await nomesVisiveis();
    assert(n1.length === 2 && n1.every(n => n.includes(RUN)), `achou ${n1}`);
    await page.getByLabel('Buscar por nome ou CPF').fill('JOÃO');
    await page.waitForTimeout(200);
    const n2 = await nomesVisiveis();
    assert(n2.some(n => /jo[aã]o/i.test(n)), `"JOÃO" achou ${n2}`);
    return `"JOÃO" → ${n2.join(', ')}`;
  });
  await check('E2', 'Funcionalidade 2 — busca', 'CPF parcial com e sem máscara encontra o mesmo doador', async () => {
    await go('/doadores');
    const parcialSem = CPF_A.slice(0, 6);
    const parcialCom = mask(CPF_A).slice(0, 7);
    await page.getByLabel('Buscar por nome ou CPF').fill(parcialSem);
    await page.waitForTimeout(200);
    const a = await nomesVisiveis();
    await page.getByLabel('Buscar por nome ou CPF').fill(parcialCom);
    await page.waitForTimeout(200);
    const b = await nomesVisiveis();
    assert(a.length === 1 && JSON.stringify(a) === JSON.stringify(b), `"${parcialSem}" → ${a}; "${parcialCom}" → ${b}`);
    return `"${parcialSem}" e "${parcialCom}" → ${a[0]}`;
  });
  await check('E3', 'Funcionalidade 2 — busca', 'Filtro por tipo sanguíneo e por situação; contagem "X de Y"', async () => {
    await go('/doadores');
    const total = Number((await contagem()).match(/\d+/)[0]);
    await page.getByLabel('Tipo sanguíneo', { exact: true }).selectOption('O_POSITIVO');
    await page.waitForTimeout(200);
    const tipos = await page.$$eval('tbody tr .blood-type-chip', cs => cs.map(c => c.textContent.trim()));
    assert(tipos.length > 0 && tipos.every(t => t === 'O+'), `tipos: ${tipos}`);
    const c = await contagem();
    assert(c === `${tipos.length} de ${total} doadores encontrados`, `contagem "${c}"`);
    await page.getByLabel('Tipo sanguíneo', { exact: true }).selectOption('');
    await page.getByLabel('Situação').selectOption('ANONIMIZADOS');
    await page.waitForTimeout(200);
    const status = await page.$$eval('tbody tr td:nth-child(5)', tds => tds.map(t => t.textContent.trim()));
    assert(status.length > 0 && status.every(s => s === 'Anonimizado (LGPD)'), `situações: ${status}`);
    return `O+: ${c}; anonimizados: ${status.length}`;
  });
  await check('E4', 'Funcionalidade 2 — busca', 'Sem resultado: mensagem, "Limpar busca" restaura a lista e devolve o foco', async () => {
    await go('/doadores');
    const total = await contagem();
    await page.getByLabel('Buscar por nome ou CPF').fill('zzzz-nao-existe');
    await page.waitForTimeout(200);
    assert(await page.getByText('Nenhum doador encontrado para esta busca.').isVisible(), 'sem mensagem');
    await page.locator('tbody').getByRole('button', { name: 'Limpar busca' }).click();
    await page.waitForTimeout(200);
    const a = await activeInfo();
    assert(a.id === 'busca-texto', `foco em "${a.id}"`);
    assert((await contagem()) === total, `contagem ${await contagem()} ≠ ${total}`);
    assert(await page.locator('#busca-resultado').getAttribute('aria-live') === 'polite', 'contagem não é anunciada');
  });
  await check('F1b', 'Acessibilidade', 'Doadores com busca ativa e formulário aberto sem violações (axe)', async () => {
    await go('/doadores');
    await page.getByLabel('Buscar por nome ou CPF').fill('maria');
    let v = await axe();
    assert(v.length === 0, `busca: ${v}`);
    await page.getByRole('button', { name: 'Novo Doador' }).click();
    v = await axe();
    assert(v.length === 0, `formulário: ${v}`);
  });

  // ================================================================ G. Regressão — anonimizar e excluir
  await check('G5', 'Regressão — LGPD (TP3)', 'Anonimizar remove dados pessoais e mantém o registro', async () => {
    await go('/doadores');
    await page.getByRole('button', { name: `Anonimizar dados de ${NOME_B} (LGPD)` }).click();
    const dlg = page.getByRole('alertdialog');
    assert((await dlg.innerText()).includes(NOME_B), 'confirmação não cita o nome');
    await dlg.getByRole('button', { name: 'Confirmar' }).click();
    await toast(/anonimizado com sucesso/).waitFor();
    const id = [...criados.doadores][1];
    const d = (await api('GET', '/api/donors')).body.find(x => x.id_doador === id);
    assert(d && d.anonimizado_em && d.cpf === null && d.nome_completo === 'Doador Anonimizado (LGPD)', JSON.stringify(d));
    return 'nome trocado, CPF removido, registro mantido';
  });
  await check('G6', 'Regressão — doadores', 'Excluir doador sem doações (pela tela e pela API)', async () => {
    await go('/doadores');
    const nome = `${NOME_A} Editado`;
    await page.getByRole('button', { name: `Excluir doador ${nome}` }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
    await toast(/excluído/).waitFor();
    await page.locator('tbody tr', { hasText: nome }).waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    assert((await page.locator('tbody tr', { hasText: nome }).count()) === 0, 'continua na lista');
    const idB = [...criados.doadores][1];
    const r = await api('DELETE', `/api/donors/${idB}`);
    assert(r.status === 204, `DELETE anonimizado → ${r.status}`);
    return 'tela: removido; API (anonimizado): 204';
  });

  // ================================================================ G7 — insumos
  await check('G7', 'Regressão — insumos', 'Criar, sinalizar baixo estoque no painel, editar, validar negativo e excluir', async () => {
    await go('/dashboard');
    const antes = Number(await page.locator('a.stat-card-link', { hasText: 'Insumos em Baixo Estoque' }).locator('.stat-value').innerText());
    await go('/insumos');
    await page.getByRole('button', { name: 'Adicionar Item' }).click();
    await page.getByLabel('Nome do Material *').fill(INSUMO);
    await page.getByLabel('Quantidade *', { exact: true }).fill('5');
    await page.getByRole('button', { name: 'Adicionar Insumo' }).click();
    await toast(/adicionado/).waitFor();
    const linha = page.locator('tbody tr', { hasText: INSUMO });
    await linha.waitFor({ timeout: 30000 });
    assert(await linha.getByText('Baixo Estoque').isVisible(), 'sem selo de baixo estoque');
    await go('/dashboard');
    const depois = Number(await page.locator('a.stat-card-link', { hasText: 'Insumos em Baixo Estoque' }).locator('.stat-value').innerText());
    assert(depois === antes + 1, `painel ${antes} → ${depois}`);
    await go('/insumos');
    await page.getByRole('button', { name: `Editar insumo ${INSUMO}` }).click();
    await page.getByLabel('Quantidade *', { exact: true }).fill('-3');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    assert(await page.locator('#insumo-quantidade-erro').isVisible(), 'negativo aceito (M07)');
    await page.getByLabel('Quantidade *', { exact: true }).fill('50');
    await page.getByRole('button', { name: 'Salvar Alterações' }).click();
    await toast(/atualizado/).waitFor();
    await page.locator('tbody tr', { hasText: INSUMO }).getByText('Normal').waitFor({ timeout: 30000 });
    await page.getByRole('button', { name: `Excluir insumo ${INSUMO}` }).click();
    const dlg = page.getByRole('alertdialog');
    assert((await dlg.innerText()).includes(INSUMO), 'confirmação não cita o insumo');
    await dlg.getByRole('button', { name: 'Confirmar' }).click();
    await toast(/excluído/).waitFor();
    await page.locator('tbody tr', { hasText: INSUMO }).waitFor({ state: 'detached', timeout: 30000 }).catch(() => {});
    assert((await page.locator('tbody tr', { hasText: INSUMO }).count()) === 0, 'insumo continua na lista');
    return `painel ${antes} → ${depois}; -3 recusado; 50 → Normal; excluído`;
  });
  await check('F1c', 'Acessibilidade', 'Insumos com formulário aberto sem violações (axe)', async () => {
    await go('/insumos');
    await page.getByRole('button', { name: 'Adicionar Item' }).click();
    const v = await axe();
    assert(v.length === 0, v.join(', '));
  });

  // ================================================================ D. Funcionalidade 1 — saída de bolsas
  const ENUM = { 'A+': 'A_POSITIVO', 'A-': 'A_NEGATIVO', 'B+': 'B_POSITIVO', 'B-': 'B_NEGATIVO', 'AB+': 'AB_POSITIVO', 'AB-': 'AB_NEGATIVO', 'O+': 'O_POSITIVO', 'O-': 'O_NEGATIVO' };
  const FALADO = t => `${t.replace(/[+-]$/, '')} ${t.endsWith('+') ? 'positivo' : 'negativo'}`;
  const qtdTipo = async t => (await estoqueTabela()).find(r => r.tipo === t)?.qtd;

  if (!tipoTeste) {
    results.push({ id: 'D*', area: 'Funcionalidade 1 — saída', desc: 'Nenhum tipo sem estoque para testar sem afetar bolsas reais', ok: false, detail: 'pulado' });
  } else {
    const T = tipoTeste;
    await check('D1', 'Funcionalidade 1 — saída', `Entrada de bolsas em ${T} (tipo sem estoque) atualiza tabela e painel`, async () => {
      await go('/estoque');
      await page.getByRole('button', { name: 'Registrar Entrada' }).click();
      await page.getByLabel('Quantidade de bolsas *').fill('');
      await page.getByRole('button', { name: 'Salvar Entrada' }).click();
      assert(await page.locator('#entrada-tipo_sangue-erro').isVisible() && await page.locator('#entrada-quantidade-erro').isVisible(), 'campos vazios aceitos (M07)');
      await page.getByLabel('Tipo Sanguíneo *').selectOption(ENUM[T]);
      await page.getByLabel('Quantidade de bolsas *').fill('1');
      await page.getByRole('button', { name: 'Salvar Entrada' }).click();
      await toast(/1 bolsa registrada/).waitFor();
      await page.waitForTimeout(1500); // segunda entrada com data posterior (para conferir a ordem de saída)
      await waitReady('/estoque');
      await page.getByRole('button', { name: 'Registrar Entrada' }).click();
      await page.getByLabel('Tipo Sanguíneo *').selectOption(ENUM[T]);
      await page.getByLabel('Quantidade de bolsas *').fill('2');
      await page.getByRole('button', { name: 'Salvar Entrada' }).click();
      await toast(/2 bolsas registradas/).waitFor();
      await go('/estoque');
      const linha = (await estoqueTabela()).find(r => r.tipo === T);
      assert(linha.qtd === 3 && linha.situacao === 'Adequado', JSON.stringify(linha));
      await go('/dashboard');
      const total = Number((await page.locator('a.stat-card-link', { hasText: 'Bolsas em Estoque' }).locator('.stat-value').innerText()));
      assert(total === painel.bolsas + 3, `painel ${painel.bolsas} → ${total}`);
      return `${T}: 0 → 3 (Adequado); painel ${painel.bolsas} → ${total}; campos vazios recusados`;
    });
    await check('D2', 'Funcionalidade 1 — saída', 'Saída pela linha da tabela já vem com o tipo e o foco na quantidade', async () => {
      await go('/estoque');
      await page.getByRole('button', { name: `Registrar saída de bolsas ${FALADO(T)}` }).click();
      await page.waitForTimeout(200);
      assert((await page.getByLabel('Tipo Sanguíneo *').inputValue()) === ENUM[T], 'tipo não veio preenchido');
      assert((await activeInfo()).id === 'saida-quantidade', `foco em ${(await activeInfo()).id}`);
      const v = await axe();
      assert(v.length === 0, `axe no formulário de saída: ${v}`);
      return 'axe sem violações no formulário de saída';
    });
    await check('D3', 'Funcionalidade 1 — saída', 'Mais bolsas do que o estoque é bloqueado sem gravar nada', async () => {
      await page.getByLabel('Quantidade de bolsas *').fill('99');
      await page.getByRole('button', { name: 'Registrar Despacho' }).click();
      const t = await page.locator('#saida-quantidade-erro').innerText();
      assert(/Há apenas 3/.test(t), t);
      assert((await page.getByRole('alertdialog').count()) === 0, 'abriu confirmação');
      const api99 = await api('POST', '/api/inventory/saidas', { tipo_sangue: ENUM[T], quantidade: 99, status: 'DESPACHADA' });
      assert(api99.status === 400, `API → ${api99.status}`);
      await go('/estoque');
      assert((await qtdTipo(T)) === 3, 'estoque mudou');
      return `${t} · API → 400 (${api99.body?.detail})`;
    });
    await check('D4', 'Funcionalidade 1 — saída', 'Despacho com destino: confirmação, estoque −1 e a bolsa MAIS ANTIGA sai', async () => {
      await go('/estoque');
      await page.getByRole('button', { name: `Registrar saída de bolsas ${FALADO(T)}` }).click();
      await page.getByLabel('Quantidade de bolsas *').fill('1');
      await page.getByLabel('Destino (opcional)').fill(`E2E TP4 Hospital ${RUN}`);
      await page.getByRole('button', { name: 'Registrar Despacho' }).click();
      const dlg = page.getByRole('alertdialog');
      assert(/despacho de 1 bolsa/.test(await dlg.innerText()), 'confirmação sem detalhes');
      await dlg.getByRole('button', { name: 'Confirmar' }).click();
      await toast(/Despacho de 1 bolsa/).waitFor();
      await go('/estoque');
      assert((await qtdTipo(T)) === 2, `estoque ${await qtdTipo(T)}`);
      const rows = await rest(`/doacoes?tipo_sanguineo_coletado=eq.${ENUM[T]}&criado_em=gte.${START}&select=status,data_doacao,observacoes&order=data_doacao.asc`);
      assert(rows.length === 3 && rows[0].status === 'DESPACHADA' && rows.slice(1).every(r => r.status === 'EM_ESTOQUE'), JSON.stringify(rows.map(r => r.status)));
      assert(rows[0].observacoes === `E2E TP4 Hospital ${RUN}`, 'destino não gravado');
      return 'saiu a bolsa da primeira entrada (FIFO); destino gravado';
    });
    await check('D5', 'Funcionalidade 1 — saída', 'Descarte exige motivo; com motivo, estoque −1', async () => {
      await go('/estoque');
      await page.getByRole('button', { name: /^Registrar Saída$/ }).click();
      await page.getByRole('radio', { name: /Descarte/ }).check();
      await page.getByLabel('Tipo Sanguíneo *').selectOption(ENUM[T]);
      await page.getByLabel('Quantidade de bolsas *').fill('1');
      await page.getByRole('button', { name: 'Registrar Descarte' }).click();
      assert(await page.locator('#saida-observacoes-erro').isVisible(), 'descarte sem motivo aceito');
      assert((await activeInfo()).id === 'saida-observacoes', 'foco não foi para o motivo');
      await page.getByLabel('Motivo do descarte *').fill(`E2E TP4 motivo ${RUN}`);
      await page.getByRole('button', { name: 'Registrar Descarte' }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
      await toast(/Descarte de 1 bolsa/).waitFor();
      await go('/estoque');
      assert((await qtdTipo(T)) === 1, `estoque ${await qtdTipo(T)}`);
      const semMotivo = await api('POST', '/api/inventory/saidas', { tipo_sangue: ENUM[T], quantidade: 1, status: 'DESCARTADA' });
      assert(semMotivo.status === 400, `API descarte sem motivo → ${semMotivo.status}`);
      return `API sem motivo → 400 (${semMotivo.body?.detail})`;
    });
    await check('D6', 'Funcionalidade 1 — saída', 'Histórico mostra entrada, despacho e descarte (estoque e painel), mesmo após recarregar', async () => {
      const conferir = async () => {
        const itens = await page.locator('.movement-item').allInnerTexts();
        const t = itens.join(' || ');
        assert(itens.some(i => /Despacho de 1 bolsa/.test(i) && i.includes(`E2E TP4 Hospital ${RUN}`)), 'sem despacho');
        assert(itens.some(i => /Descarte de 1 bolsa/.test(i) && i.includes(`E2E TP4 motivo ${RUN}`)), 'sem descarte');
        assert(itens.some(i => /Entrada de 2 bolsas/.test(i)), `sem entrada de 2: ${t.slice(0, 200)}`);
      };
      await go('/estoque'); await conferir();
      await page.reload({ waitUntil: 'networkidle' }); await waitReady('/estoque'); await conferir();
      await go('/dashboard'); await conferir();
      const lim = await api('GET', '/api/inventory/movimentacoes?limite=2');
      assert(lim.status === 200 && lim.body.length <= 2, `limite=2 → ${lim.body?.length}`);
      return 'estoque, recarregado e painel; ?limite=2 respeitado';
    });
    await check('G8', 'Regressão — estoque', 'Filtro por tipo e "Excluir lote" continuam funcionando', async () => {
      await go('/estoque');
      await page.getByLabel('Filtrar por tipo sanguíneo:').selectOption(ENUM[T]);
      await waitReady('/estoque');
      const tab = await estoqueTabela();
      assert(tab.length === 1 && tab[0].tipo === T, `filtro → ${JSON.stringify(tab)}`);
      await page.getByRole('button', { name: `Excluir lote de ${FALADO(T)} (corrigir lançamento incorreto)` }).click();
      await page.getByRole('alertdialog').getByRole('button', { name: 'Confirmar' }).click();
      await toast(/excluído do estoque/).waitFor();
      await go('/estoque');
      const linha = (await estoqueTabela()).find(r => r.tipo === T);
      assert(linha.qtd === 0 && linha.situacao === 'Sem estoque', JSON.stringify(linha));
      return `${T} voltou a 0 (Sem estoque)`;
    });
  }

  await check('F1d', 'Acessibilidade', 'Painel, estoque (com formulário de entrada) e diálogo aberto sem violações (axe)', async () => {
    const falhas = [];
    await go('/dashboard'); falhas.push(...(await axe()).map(v => `painel ${v}`));
    await go('/estoque'); falhas.push(...(await axe()).map(v => `estoque ${v}`));
    await page.getByRole('button', { name: 'Registrar Entrada' }).click(); falhas.push(...(await axe()).map(v => `entrada ${v}`));
    await go('/insumos');
    await page.locator('button[aria-label^="Excluir insumo"]').first().click();
    await page.getByRole('alertdialog').waitFor();
    falhas.push(...(await axe()).map(v => `diálogo ${v}`));
    await page.getByRole('alertdialog').getByRole('button', { name: 'Cancelar' }).click();
    assert(falhas.length === 0, falhas.join(', '));
  });

  // ================================================================ G10/G11 — responsivo e console
  await check('G10', 'Regressão — layout', 'Celular (390 px): sem rolagem horizontal da página em nenhuma tela', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    try {
      const larg = [];
      for (const r of ['/dashboard', '/doadores', '/estoque', '/insumos']) {
        await go(r);
        const w = await page.evaluate(() => document.documentElement.scrollWidth);
        larg.push(`${r} ${w}px`);
        assert(w <= 391, `${r}: página com ${w}px`);
      }
      return larg.join(', ');
    } finally {
      await page.setViewportSize({ width: 1366, height: 860 });
    }
  });
  await check('G12', 'Regressão — layout', 'Notebook com zoom (1280 px): cards do painel com a mesma altura, tabelas sem estourar e "Ações" alinhado como as demais colunas', async () => {
    await page.setViewportSize({ width: 1280, height: 720 });
    try {
      await go('/dashboard');
      const alturas = await page.$$eval('.stat-card', cs => cs.map(c => Math.round(c.getBoundingClientRect().height)));
      assert(new Set(alturas).size === 1, `alturas dos cards: ${alturas}`);
      const out = [`cards ${alturas[0]}px`];
      for (const r of ['/doadores', '/estoque', '/insumos']) {
        await go(r);
        const m = await page.evaluate(() => {
          const c = document.querySelector('.table-container');
          const ths = [...document.querySelectorAll('thead th')].map(t => getComputedStyle(t).textAlign);
          return { visivel: c.clientWidth, tabela: c.scrollWidth, alinhamentos: [...new Set(ths)] };
        });
        assert(m.tabela <= m.visivel, `${r}: tabela ${m.tabela}px em ${m.visivel}px`);
        assert(m.alinhamentos.length === 1, `${r}: cabeçalhos com alinhamentos ${m.alinhamentos}`);
        out.push(`${r} ${m.tabela}/${m.visivel}px`);
      }
      return out.join(', ');
    } finally {
      await page.setViewportSize({ width: 1366, height: 860 });
    }
  });
  await check('B5', 'Regressão — login', 'Encerrar sessão volta ao login e bloqueia as telas', async () => {
    await go('/dashboard');
    await page.getByRole('button', { name: 'Encerrar Sessão' }).click();
    await page.waitForURL(u => new URL(u).pathname === '/');
    await page.goto(`${BASE}/estoque`);
    await page.waitForURL(u => new URL(u).pathname === '/');
  });
  await check('G11', 'Regressão — estabilidade', 'Nenhum erro de JavaScript no console durante todo o roteiro', async () => {
    assert(consoleErrors.length === 0, consoleErrors.slice(0, 5).join(' | '));
  });
} finally {
  // ================================================================ limpeza dos dados de teste
  const limpeza = [];
  try {
    if (tipoTeste) {
      const ENUM = { 'A+': 'A_POSITIVO', 'A-': 'A_NEGATIVO', 'B+': 'B_POSITIVO', 'B-': 'B_NEGATIVO', 'AB+': 'AB_POSITIVO', 'AB-': 'AB_NEGATIVO', 'O+': 'O_POSITIVO', 'O-': 'O_NEGATIVO' };
      const rows = await rest(`/doacoes?tipo_sanguineo_coletado=eq.${ENUM[tipoTeste]}&criado_em=gte.${START}&select=id_doacao`);
      if (rows.length) await rest(`/doacoes?id_doacao=in.(${rows.map(r => r.id_doacao).join(',')})`, { method: 'DELETE' });
      limpeza.push(`${rows.length} bolsas de teste`);
    }
    const ids = [...criados.doadores];
    const sobra = ids.length ? await rest(`/doadores?id_doador=in.(${ids.join(',')})&select=id_doador`) : [];
    if (sobra.length) await rest(`/doadores?id_doador=in.(${sobra.map(d => d.id_doador).join(',')})`, { method: 'DELETE' });
    limpeza.push(`${sobra.length} doadores restantes`);
    const ins = await rest(`/insumos?nome=like.${encodeURIComponent('E2E TP4*')}&select=id`);
    if (ins.length) await rest(`/insumos?id=in.(${ins.map(i => i.id).join(',')})`, { method: 'DELETE' });
    limpeza.push(`${ins.length} insumos restantes`);
  } catch (e) {
    limpeza.push(`ERRO NA LIMPEZA: ${e.message}`);
  }
  await browser.close();
  const ok = results.filter(r => r.ok).length;
  fs.writeFileSync(path.join(OUT, 'resultado-e2e.json'), JSON.stringify({ data: new Date().toISOString(), tipoTeste, limpeza, consoleErrors, results }, null, 2));
  console.log(`\nResultado: ${ok}/${results.length} verificações passaram. Limpeza: ${limpeza.join('; ')}`);
}
