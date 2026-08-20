# Directivas e Padrões do Projeto Figoo (AGENTS.md)

Este documento estabelece as regras de ouro, padrões de código, arquitetura, performance e a lista de **Anti-Patterns (O Que NÃO Fazer)** para o projeto Figoo. Todas as alterações, novas telas, correções e refinamentos de IA/UI devem obrigatoriamente seguir estas diretrizes.

---

## 🚫 O QUE NÃO FAZER MAIS (Anti-Patterns Proibidos)

1. **NUNCA Criar Botões ou Ícones Flutuantes (`position: fixed` sobre o conteúdo)**
   - *Por que:* Botões/ícones flutuantes geram sobreposição com botões de ação da tela e prejudicam a usabilidade.
   - *Regra:* Todas as ferramentas e assistentes (ex: Figoo IA) devem ser acessados via a **Topbar padrão** ou painéis laterais **Slide-Over** acionados explicitamente pelo topo.

2. **NUNCA Modificar ou Criar Telas sem a Topbar Universal Padronizada**
   - *Por que:* Cabeçalhos inconsistentes quebram o design system e a navegação unificada.
   - *Regra:* Toda página `.html` deve utilizar a estrutura global de topbar (`figoo-ui.js`), incluindo o badge do usuário logado (`👤 username`), navegação com pílulas compactas expansíveis no hover e modal de chave/senha.

3. **NUNCA Passar Variáveis `let` do Escopo Local em Atributos Inline `onclick="..."` no HTML**
   - *Por que:* Variáveis declaradas com `let` no topo de um script não são vinculadas ao objeto `window`. O evento inline `onclick="fn(emailKey)"` dispara `Uncaught ReferenceError: emailKey is not defined`.
   - *Regra:* Chame funções sem parâmetros no HTML inline (`onclick="openAdminActionTypesModal()"`) e garanta que a função interna resolva a chave do usuário via `window.emailKey` ou fallback em `localStorage.getItem('figoo_email')`.

4. **NUNCA Deixar de Expor Funções de Modais no Objeto `window`**
   - *Por que:* Modais dinâmicos gerados via JavaScript (ex: `_atCreate()`, `_atSaveAndClose()`, `openActionTypesModal()`) falham se não estiverem no objeto global.
   - *Regra:* Sempre vincule explicitamente funções globais e auxiliares de modais ao `window` (ex: `window.openActionTypesModal = openActionTypesModal;`).

5. **NUNCA Usar `<select>` Nativos ou Inputs de Texto Simples para Entidades Relacionadas**
   - *Por que:* Listas longas de clientes, municípios e colaboradores ficam difíceis de buscar e impedem o cadastro dinâmico.
   - *Regra:* Utilize sempre o componente **Autocomplete Combobox** (`attachAutocomplete` / `autoAttachAllAutocompletes`) com busca em tempo real e opção integrada de **Cadastro Rápido (Inline)** para registros inexistentes.

6. **NUNCA Renderizar Dados Brutos do Firebase Sem Passar Pelo Filtro de Decifração/Resolução**
   - *Por que:* Exibe ciphers encriptados ou IDs brutos para o usuário final.
   - *Regra:* Todos os dados lidos do Firebase Realtime Database devem ser passados pelo pipeline de descriptografia e resolução de entidades (`figoo-auth.js` / `figoo-ui.js`).

7. **NUNCA Importar Scripts JS ou CSS Sem Parâmetros de Invalidação de Cache (Cache Busting)**
   - *Por que:* O navegador dos usuários retém versões antigas dos arquivos em cache após atualizações.
   - *Regra:* Toda inclusão de `<script src="...">` e `<link rel="stylesheet" href="...">` nas 14 telas deve utilizar sufixo de versão atualizado (ex: `figoo-ui.js?v=20260817_v2`).

8. **NUNCA Amontoar Botões/Chips de Atalhos em Linha Única sem Quebra (No-Wrap)**
   - *Por que:* Atalhos da IA ou chips de filtro ficam cortados em telas menores.
   - *Regra:* Use layouts flexíveis responsivos com quebra de linha automática (`flex-wrap: wrap`) e altura padronizada.

9. **NUNCA Executar Scripts de Alteração/Migração de Banco Diretamente em Produção Sem Backup Prévio**
   - *Por que:* Risco de corrupção ou perda irreversível de dados no Firebase.
   - *Regra:* Antes de qualquer mutação em massa via script, execute o script de backup (`scripts/backup_db.js`) e valide a execução em modo de teste/dry-run.

10. **NUNCA Reimplementar Filtro Multi-Seleção ou Listagem na Mão — Use os Padrões A/B**
    - *Por que:* Cada tela reimplementava do zero o filtro de "selecionar vários valores de uma lista longa" e a lógica de renderizar/filtrar uma listagem, gerando inconsistência visual e de comportamento (ex.: chave de `localStorage` do toggle tabela/cards duplicada entre `contas.html` e `clientes.html`; estado vazio com uma classe CSS diferente em cada tela mesmo já existindo uma global).
    - **Padrão A — filtro multi-seleção em popover** (referência original: filtro de município de `contas.html`): sempre que o filtro for "escolher vários valores de uma lista longa" (município, tags, categorias com muitas opções), use `createMultiSelectFilter(opts)` (`figoo-ui.js`) em vez de `<select multiple>` nativo ou checkboxes soltos sem popover. Ele cuida de: estado em `Set`, popover com busca interna que não mexe na seleção, "Todos"/"Limpar", chips da seleção, fechar ao clicar fora, label dinâmico. Convenção de ids a seguir (permite copiar a estrutura de HTML de tela em tela sem adaptar nomes): `f-mun-wrap`, `btn-f-mun`, `f-mun-label-txt`, `mun-popover`, `mun-pop-search`, `mun-pop-list`, `mun-chips-bar`, `mun-select-all-btn`, `mun-clear-btn`, `mun-close-btn`, `mun-done-btn` (trocar `mun`/município pelo domínio real do filtro quando não for município). Exemplos já convertidos: `contas.html`, `clientes.html`, `pendencias.html`.
    - **Padrão B — função única de renderização da listagem** (referência original: `renderActionsList` de `acoes-programadas.html`): toda listagem deve ter **uma única função** que é a fonte de verdade — todo filtro/busca/toggle chama essa mesma função, nunca um caminho de renderização paralelo. Use `figooMatchTerms` (`figoo-ui.js`) para busca textual multi-termo. Se houver alternância tabela/cards, persista em `localStorage` com **chave própria da tela** (nunca reaproveitar a chave de outra tela — ex.: `contas_view`, `cli_view`, `eq_view`, `act_view`, cada uma sua). A fonte dos KPIs/contadores (lista filtrada vs. lista total) é uma decisão de produto — escolha uma e deixe explícita/comentada no código, não incidental.
    - **Estado vazio padronizado**: use `figooEmptyState(container, {icon, title, hint, actionHtml})` (`figoo-ui.js`) para o card `.figoo-empty-card` em vez de markup bespoke — vale para listagens de página inteira (grids/tabelas principais). Não force esse card grande em placeholders compactos dentro de painéis pequenos (ex.: um mini-dashboard de detalhe, uma lista de conversas de chat) — nesses casos um texto simples continua sendo a escolha certa; use julgamento sobre o contexto visual antes de aplicar.

11. **NUNCA Usar `list="..."` + `<datalist>` em Campos Ligados via `attachAutocomplete`**
    - *Por que:* `autoAttachAllAutocompletes()` (`figoo-ui.js`) reivindica automaticamente qualquer `<input list="...">` do DOM ~400ms após o carregamento da página, usando um getter genérico que só lê as `<option>` daquele `<datalist>`. Como `attachAutocomplete` trava no primeiro a chamar (`_fgAcAttached`, nunca resetado), a chamada explícita e correta que a própria tela faz depois (ex.: ao abrir um modal) vira um no-op silencioso — sem erro no console, só sugestão sempre vazia/errada. Foi exatamente isso que quebrou `cm-mun`/`cm-ent` em `clientes.html` e `em-mun`/`cm-mun`/`cm-ent` em `contas.html`.
    - *Regra:* nunca coloque `list="..."` num input que vai usar o combobox compartilhado — ligue-o explicitamente com `attachAutocomplete('#id', getItemsFn, opts)`, lendo de um array já carregado em memória, nunca de um `<datalist>`. Referência de padrão correto: os campos de `acoes-programadas.html` (`act-entidade`, `act-cliente`, `act-responsavel`).
    - *Regra (fonte de dados):* sugestão de Município/Entidade sempre vem do cadastro real de contas (`entidadesFull`/`entidades`, via `figooEntMunicipioClean` em `figoo-ui.js`) — nunca de `distinct(campo)` sobre o mapa de `clientes`/contatos, que só contém valores já digitados em algum contato e nunca contas sem contato ainda.

---

## 🎨 Padrões de Interface (UI/UX Design System)

- **Layout e Container:** Margem e padding central padrão de `24px`, molduras limpas e cor de fundo alinhada com a variável CSS `var(--bg)`.
- **Identificação de Usuário Logado:** Exibição obrigatória no canto superior direito do nome/e-mail do usuário ativo (`👤 username`).
- **Navegação Compacta:** Ícones do cabeçalho em formato de pílulas compactas com expansão suave ao passar o mouse (hover).
- **Central de IA (Slide-Over):** A IA funciona como gaveta lateral direita em 100vh com transição suave, sem provocar barras de rolagem indesejadas na página principal.
- **Modais Standard:** Utilizar o template unificado de modal com cabeçalho limpo, corpo rolável (`max-height: 80vh`) e botões de ação (Salvar/Cancelar) no rodapé.
- **Painel Admin Enxuto (`admin.html`):** Focado no gerenciamento de usuários, marcadores (tags), tipos de ações programadas e restauração de backup JSON, sem cards e modais redundantes no rodapé.

---

## 🔒 Segurança, Dados e Performance do Firebase

- **Criptografia e Senhas:** Lógica centralizada em `figoo-auth.js` com criptografia de ponta a ponta (AES-GCM 256-bit).
- **Paridade de Contas Admin:** Garantir sempre a sincronia e paridade total de dados entre as duas contas administradoras (`emanuel.alexandre@betha.com.br` e `emanuel.melo87@gmail.com`).
- **Performance de Leitura REST (Zero HTTP 401):** As regras em `database.rules.json` devem permitir acesso direto aos nós encriptados (`pendencias`, `entidades`, `clientes`, `reunioes`, `pagamentos`, `colaboradores`, `acoes_programadas`, `acoes_programadas_types`). Como os dados são 100% cifrados no cliente, o acesso direto elimina bloqueios HTTP 401, reduzindo a latência de requisição para `~30ms`.

---

## 🛠️ Organização do Projeto

- **Localização de Telas:** Todas as telas `.html` da aplicação residem obrigatoriamente na raiz do projeto (`c:\Minhas-Ferramentas\FigooAgvt`).
- **Pastas Scratch (`/scratch`):** Uso exclusivo para scripts temporários de auditoria e testes pontuais. Scripts definitivos de manutenção/backup devem residir em `/scripts`.
- **Helpers Compartilhados para Tela Nova (`figoo-ui.js`):** Antes de escrever filtro ou listagem do zero numa tela nova, veja se já existe pronto: `createMultiSelectFilter` (Padrão A, filtro multi-seleção em popover), `figooEmptyState` (estado vazio padronizado), `figooMatchTerms`/`figooSearchNorm` (busca multi-termo sem acento), `attachAutocomplete`/`attachSelectAutocomplete` (combobox com busca), `figooEntMunicipioClean` (município "oficial" de uma entidade, tratando o caso do campo corrompido com o próprio nome da entidade), `figooCascadeRename`/`figooCheckPersonInUse` (rename em cascata / checagem de uso antes de excluir). Ver itens 10 e 11 dos anti-patterns para os padrões completos.
