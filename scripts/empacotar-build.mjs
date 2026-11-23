// Fase "package" do build: transforma a saída do build num pacote único e executável.
//
// Uso: npm run build && npm run package
// Saída: dist/banco-de-sangue-<versão>.tar.gz
//   Para rodar: extrair, criar o .env (ver .env.example) e executar `node server.js`.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const standalone = join(raiz, '.next', 'standalone');

if (!existsSync(join(standalone, '.next', 'static'))) {
  console.error('Servidor standalone não encontrado. Rode `npm run build` antes de `npm run package`.');
  process.exit(1);
}

const { name, version } = JSON.parse(readFileSync(join(raiz, 'package.json'), 'utf8'));
const nomePacote = `${name}-${version}`;
const dist = join(raiz, 'dist');
const pasta = join(dist, nomePacote);

rmSync(pasta, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(standalone, pasta, { recursive: true });

// O Next copia o .env local para o standalone. Segredos nunca vão dentro do pacote:
// quem instala cria o próprio .env a partir do modelo.
rmSync(join(pasta, '.env'), { force: true });
cpSync(join(raiz, '.env.example'), join(pasta, '.env.example'));

writeFileSync(
  join(pasta, 'BUILD-INFO.json'),
  JSON.stringify(
    { nome: name, versao: version, commit: lerCommit(), geradoEm: new Date().toISOString(), node: process.version },
    null,
    2,
  ) + '\n',
);

const arquivo = `${nomePacote}.tar.gz`;
execFileSync('tar', ['-czf', arquivo, nomePacote], { cwd: dist, stdio: 'inherit' });
console.log(`Pacote gerado: dist/${arquivo}`);

function lerCommit() {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'desconhecido';
  }
}
