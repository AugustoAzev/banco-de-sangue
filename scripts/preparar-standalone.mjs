// Gancho "postbuild": o npm roda este script sozinho logo depois de `npm run build`.
//
// O `next build` com `output: 'standalone'` gera o servidor em .next/standalone, mas deixa de
// fora os arquivos estáticos (CSS, JS do navegador e a pasta public). Aqui eles são copiados
// para o lugar onde o server.js os procura, e o servidor fica pronto para `npm start`.
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const raiz = process.cwd();
const standalone = join(raiz, '.next', 'standalone');

if (!existsSync(join(standalone, 'server.js'))) {
  // Ambientes que ignoram o modo standalone (ex.: Vercel) não precisam deste passo.
  console.log('postbuild: saída standalone não encontrada; nada a preparar.');
  process.exit(0);
}

cpSync(join(raiz, '.next', 'static'), join(standalone, '.next', 'static'), { recursive: true });
cpSync(join(raiz, 'public'), join(standalone, 'public'), { recursive: true });
console.log('postbuild: servidor standalone pronto em .next/standalone');
