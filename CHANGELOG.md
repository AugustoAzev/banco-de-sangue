# Changelog

Mudanças relevantes do sistema Banco de Sangue. O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento segue o [SemVer](https://semver.org/lang/pt-BR/).

## [1.2.0] — 2026-10-04 — TP4: Redesign e Manutenção Evolutiva

Documentação: [`docs/redesign/`](./docs/redesign/) (Etapa 1) e [`docs/evolucao/`](./docs/evolucao/) (Etapa 2).

### Adicionado

- **Registro de saída de bolsas, por despacho ou descarte.** A saída muda o status da bolsa em vez de apagar o registro. As bolsas mais antigas do tipo saem primeiro, e o motivo é obrigatório no descarte. Novas rotas: [`POST /api/inventory/saidas`](./pages/api/inventory/saidas.ts) e [`GET /api/inventory/movimentacoes`](./pages/api/inventory/movimentacoes.ts).
- **Histórico de movimentações** (entradas, despachos e descartes) no painel e na tela de estoque. Substitui o card "Movimentações Recentes", que era um texto fixo.
- **Busca de doadores** por nome (sem diferenciar acentos) ou CPF (com ou sem máscara), tipo sanguíneo e situação (ativo ou anonimizado).
- **Política de estoque** ([`src/lib/inventory-policy.ts`](./src/lib/inventory-policy.ts)): estoque mínimo de 3 bolsas por tipo e limite de baixo estoque de insumos, definidos num só lugar.
- **Card "Insumos em Baixo Estoque"** no painel.
- **Roteiro de evidências** [`scripts/capturar-evidencias.mjs`](./scripts/capturar-evidencias.mjs): capturas de tela, axe-core e Lighthouse.
- **47 testes automatizados novos**: de 33 para 80.

### Alterado

- **Painel:** "Bolsas em Estoque" soma as bolsas. "Menor Estoque" mostra o tipo e a quantidade. Os avisos listam todos os tipos abaixo do mínimo, e só aparecem quando há algum.
- **Estoque:** a tabela mostra os 8 tipos sanguíneos, inclusive os sem estoque, com a situação de cada um (Adequado, Abaixo do mínimo ou Sem estoque). Saiu a coluna "ID Lote".
- **Formulários padronizados nas três telas:** título, botão de fechar, ação principal e "Cancelar".
- **Erros junto do campo:** no cadastro de doador, o erro aparece junto do campo e fica até a correção.
- **Confirmações específicas:** citam o item afetado e explicam a consequência.
- **Rótulo único de tipo sanguíneo** em todas as telas.
- **Perfil legível:** o perfil do usuário aparece como "Administrador" ou "Atendente".

### Corrigido

- **Total de bolsas do painel:** contava os tipos sanguíneos em vez das bolsas (6 em vez de 9).
- **Aviso de estoque crítico:** era emitido sem existir nível de segurança definido.
- **Card "Coletas Hoje":** parecia um link, não levava a lugar nenhum e era calculado sobre os grupos.
- **Doador genérico das entradas de estoque:** podia ser editado, anonimizado ou excluído, o que quebrava o registro de novas bolsas. Agora é protegido na tela e na API (`409`).
- **Quantidades inválidas:** a quantidade negativa de insumo e a quantidade vazia no estoque (`NaN`) passaram a ser recusadas.

### Acessibilidade (WCAG 2.1 AA)

- **Leitor de tela:**
  - nome acessível com contexto em todos os botões de ícone;
  - rótulos ligados a todos os campos;
  - erros ligados ao campo (`aria-invalid`, `aria-describedby`);
  - tabelas com legenda e cabeçalhos;
  - tipo sanguíneo lido por extenso.
- **Teclado:**
  - diálogo de confirmação com foco no "Cancelar", Tab preso no diálogo e foco devolvido ao fechar;
  - foco gerenciado ao abrir e fechar formulários;
  - link "Pular para o conteúdo principal";
  - indicador de foco visível.
- **Contraste:** o texto secundário passou de 4,34:1 para 5,18:1 e as descrições, de 2,54:1 para 5,73:1.
- **Avisos e animações:** os avisos de erro não somem sozinhos, e as animações respeitam a opção "reduzir movimento".
- **Títulos de página:** cada tela tem título próprio.
- **Resultado medido:** Lighthouse de 90–96 para **100** nas 5 telas; axe-core sem violações.

## [1.1.0] — 2026-09-21 — TP3: Manutenção Adaptativa

Documentação: [`manutencao-adaptativa/`](./manutencao-adaptativa/) e [`RELATORIO.md`](./RELATORIO.md). Versão não marcada com tag na época; registrada aqui retroativamente.

### Adicionado

- **Consentimento LGPD** obrigatório e datado no cadastro de doador.
- **Anonimização de doador** ([`PATCH /api/donors/{id}/anonymize`](./pages/api/donors/[id]/anonymize.ts)), que preserva o histórico de doações.
- **Integração com o ViaCEP** ([`GET /api/cep/{cep}`](./pages/api/cep/[cep].ts)) para preencher o endereço do doador.

### Alterado

- **TypeScript fixado em `5.9.3`:** a versão 7 quebra o `ts-jest` e o `next build`.
- **Regras de elegibilidade de doadores centralizadas** em [`src/lib/donor-eligibility.ts`](./src/lib/donor-eligibility.ts) (manutenção preventiva, 2026-09-09).

### Corrigido

- **Manutenção corretiva (2026-08-31):**
  - as bolsas agrupadas retornavam `id` 0;
  - a idade do doador era aceita sem validação;
  - o CPF aceitava emojis.
- **Ajustes após a avaliação do TP3 (2026-10-04):**
  - CPF normalizado;
  - `id_registrador` resolvido pelo e-mail;
  - "Excluir lote" passou a remover o lote inteiro;
  - nova tentativa automática em leituras com falha de rede.

## [1.0.0] — 2025-11-23

- **Primeira versão:** login com JWT, cadastro de doadores, estoque de bolsas por tipo sanguíneo, insumos e painel.

[1.2.0]: https://github.com/AugustoAzev/banco-de-sangue/pull/78
[1.1.0]: https://github.com/AugustoAzev/banco-de-sangue/compare/release/1.0.0...014e608
[1.0.0]: https://github.com/AugustoAzev/banco-de-sangue/tree/release/1.0.0
