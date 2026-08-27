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

12. **Modais (`.modal-ov`/`.modal-card`) já ganham acessibilidade de graça — não duplique**
    - *Por que:* toda tela cadastra seus modais com essa mesma estrutura, e cada uma reimplementava (ou esquecia) fechar com Esc e marcar `role="dialog"`.
    - *Regra:* `figoo-ui.js` já roda uma passada global que marca todo `.modal-ov .modal-card` com `role="dialog" aria-modal="true"` e fecha o `.modal-ov` visível ao apertar Esc. Uma tela nova não precisa (e não deve) reimplementar isso — só usar a estrutura `.modal-ov.hidden > .modal-card` normalmente.
    - *Regra (div/span clicável):* qualquer `<div>`/`<span onclick="...">` que funciona como botão, checkbox ou link de navegação precisa de `role`/`tabindex="0"`/handler de teclado (Enter/Espaço) — ou, melhor, ser um `<button>`/`<a href>` de verdade. Não usar `display:none` para esconder um `<input type="checkbox|radio">` real (tira do tab order) — se precisar de estilo customizado, escondê-lo visualmente (`position:absolute;opacity:0`) mantendo-o operável.

13. **NUNCA Inventar um Breakpoint Novo — Use a Escala Padrão (600 / 900 / 1400 / 1600)**
    - *Por que:* `figoo-base.css` não define nenhum `@media` — cada tela inventava seu próprio valor (520, 640, 880, 960, 639, 480...), criando faixas de largura "sem dono" onde nada foi pensado (ex.: tablet caindo entre duas regras que não se encontram). Auditoria de responsividade (2026-08-20) encontrou isso em praticamente todas as 15 telas.
    - *Regra:* qualquer `@media (max-width:...)`/`(min-width:...)` nova deve usar **600** (telefone), **900** (tablet — também o ponto onde layouts lado-a-lado como rail+detalhe ou sidebar+conteúdo devem colapsar pra 1 coluna), **1400** e **1600** (laptop grande / monitor). Esses são os mesmos valores que `figoo-ui.js` já usa pro topbar/rodapé.
    - *Regra (hover-only):* qualquer controle que só aparece/fica visível no `:hover` (ícone de ação num card, por exemplo) precisa de um par com `@media (hover:none), (pointer:coarse)` deixando-o sempre visível — sem isso, ele fica inacessível em iPad e notebook touch, que não têm hover confiável.
    - *Regra (toque/safe-area):* use as classes utilitárias de `figoo-base.css` — `.figoo-tap-min` (garante ~44px de alvo de toque sem mudar o tamanho visual) e `.figoo-safe-bottom` (`padding-bottom: env(safe-area-inset-bottom)`, pra qualquer FAB/toast/barra fixa perto do rodapé da tela) — em vez de reescrever isso em cada arquivo.

14. **NUNCA Alterar uma Função Global de `figoo-ui.js`/`figoo-auth.js` Sem Testar Isolada Antes de Publicar**
    - *Por que:* (26/08) uma correção no link do logo da topbar (`renderTopbar`, `figoo-ui.js`) usou uma variável (`enc`) que só existe no escopo de outra função (`_getToolsList`) — sintaticamente válido, mas `renderTopbar` inteira quebrava com `Uncaught ReferenceError: enc is not defined` assim que chamada, tirando a topbar do ar em **toda tela logada** simultaneamente, porque a função é compartilhada por todas as 15 telas. Só apareceu depois de publicado.
    - *Regra:* antes de dar `firebase deploy` numa mudança em `figoo-ui.js`/`figoo-auth.js` (arquivos carregados por todas as telas), rode a função alterada isolada no navegador com dados fictícios primeiro (`fetch` do arquivo publicado, `window.eval` do corpo, chamar a função com um objeto de teste e inspecionar o DOM resultante) — não basta ler o código ou confiar no `node --check` (sintaxe válida não pega `ReferenceError` de variável fora de escopo).

---

## 🎨 Padrões de Interface (UI/UX Design System)

- **Layout e Container:** Margem e padding central padrão de `24px`, molduras limpas e cor de fundo alinhada com a variável CSS `var(--bg)`.
- **Identificação de Usuário Logado:** Exibição obrigatória no canto superior direito do nome/e-mail do usuário ativo (`👤 username`).
- **Navegação Compacta:** Ícones do cabeçalho em formato de pílulas compactas com expansão suave ao passar o mouse (hover).
- **Central de IA (Slide-Over):** A IA funciona como gaveta lateral direita em 100vh com transição suave, sem provocar barras de rolagem indesejadas na página principal.
- **Modais Standard:** Utilizar o template unificado de modal com cabeçalho limpo, corpo rolável (`max-height: 80vh`) e botões de ação (Salvar/Cancelar) no rodapé.
- **Painel Admin Enxuto (`admin.html`):** Focado no gerenciamento de usuários, marcadores (tags), tipos de ações programadas e restauração de backup JSON, sem cards e modais redundantes no rodapé.
- **Favicon:** todas as telas geram o ícone da guia via um mesmo script canvas inline no `<head>` (procure por `Favicon Canvas Padrão Figoo` em qualquer tela pra copiar) — desenha a folha da marca em runtime e injeta como `link[rel=icon]`; não crie um favicon estático `<link>` novo nem um SVG diferente por tela.

---

## 🔒 Segurança, Dados e Performance do Firebase

- **Criptografia e Senhas:** Lógica centralizada em `figoo-auth.js` com criptografia de ponta a ponta (AES-GCM 256-bit).
- **Paridade de Contas Admin:** Garantir sempre a sincronia e paridade total de dados entre as duas contas administradoras (`emanuel.alexandre@betha.com.br` e `emanuel.melo87@gmail.com`).
- **Performance de Leitura REST (Zero HTTP 401):** As regras em `database.rules.json` devem permitir acesso direto aos nós encriptados (`pendencias`, `entidades`, `clientes`, `reunioes`, `pagamentos`, `colaboradores`, `acoes_programadas`, `acoes_programadas_types`). Como os dados são 100% cifrados no cliente, o acesso direto elimina bloqueios HTTP 401, reduzindo a latência de requisição para `~30ms`. `pagamentos` não tem mais tela própria (Mensal foi removido), mas a regra fica — `_dataCollectAll`/`dataReencryptAll` (`figoo-auth.js`) ainda dependem dela pra re-cifrar dados antigos na troca de senha sem perdê-los.

---

## 🛠️ Organização do Projeto

- **Localização de Telas:** Todas as telas `.html` da aplicação residem obrigatoriamente na raiz do projeto (`c:\Minhas-Ferramentas\FigooAgvt`).
- **Pastas Scratch (`/scratch`):** Uso exclusivo para scripts temporários de auditoria e testes pontuais. Scripts definitivos de manutenção/backup devem residir em `/scripts`.
- **Helpers Compartilhados para Tela Nova (`figoo-ui.js`):** Antes de escrever filtro ou listagem do zero numa tela nova, veja se já existe pronto: `createMultiSelectFilter` (Padrão A, filtro multi-seleção em popover), `figooEmptyState` (estado vazio padronizado), `figooMatchTerms`/`figooSearchNorm` (busca multi-termo sem acento), `attachAutocomplete`/`attachSelectAutocomplete` (combobox com busca), `figooEntMunicipioClean` (município "oficial" de uma entidade, tratando o caso do campo corrompido com o próprio nome da entidade), `figooCascadeRename`/`figooCheckPersonInUse` (rename em cascata / checagem de uso antes de excluir). Ver itens 10 e 11 dos anti-patterns para os padrões completos.
- **`home.html` (página inicial pós-login, 26/08):** ao logar (e-mail/senha, Google, ou sessão já ativa) e ao clicar no logo "figoo" da topbar (`renderTopbar`, `figoo-ui.js`), o usuário cai aqui — busca única estilo Google que consulta Pendências, Clientes, Contas, Reuniões, Colaboradores, Municípios e Ações Programadas ao mesmo tempo (via `figooMatchTerms`) e uma grade de atalhos pra cada ferramenta (reaproveita `_getToolsList`, não duplica a lista). Ao adicionar uma tela nova, se ela precisar aparecer na busca global, some seu carregamento/campos em `home.html` seguindo o mesmo padrão (`haystack`/`buildResult` por tipo).
- **Convenção de deep-link por tela (usada em `home.html` e replicável em qualquer link direto pra um registro):** `pendencias.html?e=<email>&p=<id>` · `contas.html?e=<email>&id=<id>` (também aceita `e_id=`/`search=`/`q=` pra conta, `c=<id>` pra abrir direto um contato/cliente, e `m=<nome>` pra filtrar por município) · `reunioes.html?e=<email>&m=<id>` (também aceita `search=`) · `acoes-programadas.html?e=<email>&a=<id>`. **`equipe.html` não tem deep-link por id** — use `?search=<nome>` como aproximação. Os nomes de parâmetro não são padronizados entre telas (`p` vs `c` vs `id` vs `m` vs `a`) — confira a tela de destino antes de assumir.
- **Unificação Contas/Clientes/Municípios (27/08):** `clientes.html` e `municipios.html` foram descontinuados como telas próprias — os dois viraram *redirect shims* (`location.replace('contas.html' + location.search)`) porque compartilhavam o mesmo dado subjacente (conta ↔ contato ↔ município) em 3 lugares divergentes, causando os bugs de "cadastro duplicado invisível"/"não aparece pra outras telas" corrigidos nesse mesmo dia (ver `figooIsActive`). `contas.html` agora concentra: CRUD de conta (`entModal`), CRUD de contato (`cliModal`), filtro de município (popover já existente, `allDistinctMun`/`entMunOptions`, derivado de entidades/clientes — **não** confundir com o cadastro real abaixo) e o botão "⚙️ Gerenciar municípios" (`munGerModal`/`mg*`), que opera sobre o cadastro real em `municipios/${ek}/items` (mesmo nó que `municipios.html` usava) — renomear usa `figooCascadeRename(ek,'municipio',...)`, excluir bloqueia se houver conta/cliente/pendência vinculado (mesma checagem, só local em memória — não abre conexão nova). **Não** chame `loadMunicipiosRegistry()` a partir de `ensureContasData()`/`onRefresh` — já foi tentado e um refresh concorrente sobrescrevia com `[]` uma renomeação/exclusão feita no mesmo instante; ela só deve rodar sob demanda, ao abrir `munGerModal`. `_getToolsList` (`figoo-ui.js`) não lista mais "Clientes"/"Municípios" — só "Contas". `figoo-ui.js`/`figoo-chat.js`/`auditoria-ia.html`/`home.html` que montavam link pra `clientes.html?...`/`municipios.html?...` foram todos apontados direto pra `contas.html?...` (evita o hop de redirect).
- **Módulo "Mensal"/Pagamentos removido (26/08):** `pagamentos.html` foi descontinuado (não funcionava mais) e removido do projeto, junto com a camada "💰 Pagamentos" do `calendario.html` e as referências em backup/permissões do `admin.html`. **Não removido:** a regra `pagamentos` em `database.rules.json` e a entrada `pagamentos/${ek}` em `_dataCollectAll` (`figoo-auth.js`) — ficam de propósito, pois `dataReencryptAll`/`dataDecryptAll` (troca/remoção de senha) dependem delas pra não deixar órfãos os registros antigos de pagamento que ainda existam no banco de usuários antigos.
- **Disciplina de publicação:** `firebase deploy` publica o que estiver no disco **na hora**, commitado ou não — não é acoplado ao Git. Se um commit fica sem `git push` + `firebase deploy` logo em seguida, produção e repositório divergem silenciosamente (foi o que gerou a confusão de publicações "perdidas" em 26/08). Depois de qualquer commit relevante, publique na sequência: `git push` → `firebase deploy --only hosting`. Se desconfiar de divergência, baixe os arquivos publicados (`curl`/`fetch` em cada tela) e compare (normalizando CRLF/LF, já que `core.autocrlf=true` neste repo) contra o working tree antes de decidir o que reverter.
