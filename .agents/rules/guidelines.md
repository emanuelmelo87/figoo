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
