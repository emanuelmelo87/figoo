# Diretrizes e Anti-Patterns do Projeto Figoo

Este arquivo é lido automaticamente pelos agentes para garantir conformidade com o design system, regras de dados e padrões de arquitetura do Figoo.

## Anti-Patterns (O Que NUNCA Fazer)
- **Não usar elementos flutuantes (`position: fixed`)** que cubram botões de ação ou conteúdo da página (ex: antigo botão flutuante da IA).
- **Não criar páginas sem a topbar universal** (`figoo-ui.js`).
- **Não usar `<select>` brutos** sem Autocomplete Combobox e suporte a cadastro rápido.
- **Não exibir dados encriptados ou IDs brutos** no DOM sem passar por `figoo-auth.js` / `figoo-ui.js`.
- **Não carregar scripts sem parâmetro de cache-busting** (`?v=...`).
- **Não amontoar chips/botões** em linhas fixas sem `flex-wrap: wrap`.
- **Não rodar scripts de migração no Firebase** sem antes executar `scripts/backup_db.js`.
- **Não reimplementar filtro multi-seleção ou listagem na mão**: use `createMultiSelectFilter` (Padrão A, popover com busca/Set/chips) e `figooEmptyState` (estado vazio padronizado) de `figoo-ui.js`; toda listagem deve ter uma única função de renderização como fonte de verdade, usando `figooMatchTerms` para busca. Ver detalhes e convenção de ids em `AGENTS.md`, item 10.
- **Não usar `list="..."` + `<datalist>` em campos ligados via `attachAutocomplete`**: o auto-attach genérico de `figoo-ui.js` reivindica esses inputs antes da tela conseguir ligar a busca certa, e trava assim pra sempre (sem erro, só sugestão vazia). Ligue sempre explicitamente com `attachAutocomplete('#id', getItemsFn, opts)` lendo de um array em memória; município/entidade sempre a partir de `entidadesFull`/`entidades` (via `figooEntMunicipioClean`), nunca do mapa de `clientes`/contatos. Ver `AGENTS.md`, item 11.
- **Não reimplementar acessibilidade de modal**: `figoo-ui.js` já marca todo `.modal-ov .modal-card` com `role="dialog"` e fecha com Esc, globalmente. `<div onclick>` fazendo papel de botão/checkbox/link precisa de `role`/`tabindex`/teclado — nunca `display:none` num input real. Ver `AGENTS.md`, item 12.
- **Não inventar breakpoint novo**: use sempre 600/900/1400/1600 (mesma escala do `figoo-ui.js`). Controle que só aparece no `:hover` precisa de par com `(hover:none),(pointer:coarse)`. Use `.figoo-tap-min`/`.figoo-safe-bottom` de `figoo-base.css` pra alvo de toque e área segura, em vez de reescrever. Ver `AGENTS.md`, item 13.
- **Não alterar função global de `figoo-ui.js`/`figoo-auth.js` sem testar isolada antes de publicar**: são compartilhadas por todas as 15 telas — um `ReferenceError` de variável fora de escopo (sintaxe válida, `node --check` não pega) derruba a topbar em todo lugar de uma vez só assim que vai ao ar. Teste a função alterada isolada no navegador com dado fictício antes do `firebase deploy`. Ver `AGENTS.md`, item 14.
- **`clientes.html`/`municipios.html` não existem mais como telas** — viraram redirect pra `contas.html` (unificação de 27/08). Não recriar cadastro/CRUD nelas; qualquer ajuste de Conta/Contato/Município é em `contas.html`. Não chame `loadMunicipiosRegistry()` a partir de `ensureContasData()`/`onRefresh` — um refresh concorrente já sobrescreveu com `[]` uma renomeação feita no mesmo instante; só rode sob demanda, ao abrir o modal "Gerenciar municípios".
