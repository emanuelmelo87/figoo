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
