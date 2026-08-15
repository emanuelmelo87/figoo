// figoo-chat.js — Floating AI Chat for Figoo (Cascade Ingestion, Smart Relational Matching, ID & Link Return & Live Sync)
// Injetado em todas as páginas pelo figoo-ui.js
(function() {
  'use strict';

  if (window.location.pathname.includes('auditoria-ia')) return; // Ocultar chat flutuante no módulo de IA em tela cheia
  if (document.getElementById('figoo-chat-fab')) return; // já injetado

  let sessions = {};
  let currentSession = null;
  let isThinking = false;
  let chatOpen = false;
  let emailKey = null;

  function getItemUrl(moduleName, itemId) {
    let userEml = localStorage.getItem('figoo_email') || '';
    let encEmail = encodeURIComponent(userEml);
    let encId = encodeURIComponent(itemId || '');

    if (moduleName === 'pendencias') return `pendencias.html?e=${encEmail}&p=${encId}`;
    if (moduleName === 'reunioes') return `reunioes.html?e=${encEmail}&m=${encId}`;
    if (moduleName === 'clientes') return `clientes.html?e=${encEmail}&c=${encId}`;
    if (moduleName === 'entidades') return `contas.html?e=${encEmail}&e_id=${encId}`;
    if (moduleName === 'colaboradores') return `equipe.html?e=${encEmail}&col=${encId}`;
    if (moduleName === 'tarefas') return `pendencias.html?e=${encEmail}`;
    if (moduleName === 'calendario') return `calendario.html?e=${encEmail}`;
    return `index.html?e=${encEmail}`;
  }

  async function fetchUserDatabaseContext(ek) {
    let municipiosSet = new Set();
    let entidadesList = [];
    let clientesList = [];
    let colaboradoresList = [];

    if (!ek) return { municipios: [], entidades: [], clientes: [], colaboradores: [] };

    try {
      // 1. Entidades
      let entMap = await fbGetEnc(`entidades/${ek}/e`, 8000).catch(() => null);
      if (entMap && typeof entMap === 'object') {
        Object.values(entMap).forEach(e => {
          if (e && (e.nome || e.entidade)) {
            let name = e.nome || e.entidade;
            let mun = e.municipio || e.mun || e.uf || '';
            entidadesList.push({ id: e.id, nome: name, municipio: mun });
            if (mun) municipiosSet.add(mun.trim());
          }
        });
      }

      let rawIdx = await fbGet(`tarefas/${ek}/__idx`, 5000).catch(() => null);
      if (rawIdx && typeof rawIdx === 'object') {
        if (Array.isArray(rawIdx.municipios)) rawIdx.municipios.forEach(m => m && municipiosSet.add(m.trim()));
        if (Array.isArray(rawIdx.contas)) {
          rawIdx.contas.forEach(c => {
            if (c && c.entidade) {
              let mun = c.municipio || '';
              entidadesList.push({ id: c.id, nome: c.entidade, municipio: mun });
              if (mun) municipiosSet.add(mun.trim());
            }
          });
        }
      }

      // 2. Clientes
      let cliMap = await fbGetEnc(`clientes/${ek}/c`, 8000).catch(() => null);
      if (cliMap && typeof cliMap === 'object') {
        Object.values(cliMap).forEach(c => {
          if (c && c.nome) {
            let mun = c.municipio || c.cidade || '';
            clientesList.push({ id: c.id, nome: c.nome, entidade: c.entidade || '', municipio: mun });
            if (mun) municipiosSet.add(mun.trim());
          }
        });
      }
      let cliArr = await fbGetEnc(`clientes/${ek}/items`, 8000).catch(() => null);
      if (Array.isArray(cliArr)) {
        cliArr.forEach(c => {
          if (c && c.nome) {
            let mun = c.municipio || c.cidade || '';
            clientesList.push({ id: c.id, nome: c.nome, entidade: c.entidade || '', municipio: mun });
            if (mun) municipiosSet.add(mun.trim());
          }
        });
      }

      // 3. Colaboradores
      let colArr = await fbGetEnc(`colaboradores/${ek}/items`, 8000).catch(() => null);
      if (Array.isArray(colArr)) {
        colArr.forEach(c => {
          if (c && c.nome) colaboradoresList.push({ id: c.id, nome: c.nome, cargo: c.cargo || '' });
        });
      }

      // 4. Pendencias & Reunioes (para extrair municípios adicionais)
      let pendArr = await fbGetEnc(`pendencias/${ek}/items`, 8000).catch(() => null);
      if (Array.isArray(pendArr)) {
        pendArr.forEach(p => { if (p && p.municipio) municipiosSet.add(p.municipio.trim()); });
      }
    } catch(e) {
      console.error('Erro ao carregar contexto relacional:', e);
    }

    return {
      municipios: Array.from(municipiosSet).filter(Boolean),
      entidades: entidadesList,
      clientes: clientesList,
      colaboradores: colaboradoresList
    };
  }

  function normalizeStr(str) {
    if (!str) return '';
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function findBestMatch(inputStr, list, nameKey = 'nome') {
    if (!inputStr || !list || !list.length) return null;
    let target = normalizeStr(inputStr);

    let exact = list.find(item => normalizeStr(typeof item === 'string' ? item : item[nameKey]) === target);
    if (exact) return exact;

    let partial = list.find(item => {
      let name = normalizeStr(typeof item === 'string' ? item : item[nameKey]);
      return name.includes(target) || target.includes(name);
    });
    return partial || null;
  }

  async function enhanceRecordWithRelationalData(moduleName, item, ek) {
    if (!ek || !item) return item;
    try {
      let ctx = await fetchUserDatabaseContext(ek);

      // 1. Relacionar Cliente
      if (item.cliente) {
        let matchedCli = findBestMatch(item.cliente, ctx.clientes, 'nome');
        if (matchedCli) {
          item.cliente = matchedCli.nome;
          if (!item.entidade && matchedCli.entidade) item.entidade = matchedCli.entidade;
          if (!item.municipio && matchedCli.municipio) item.municipio = matchedCli.municipio;
        }
      }

      // 2. Relacionar Entidade
      if (item.entidade) {
        let matchedEnt = findBestMatch(item.entidade, ctx.entidades, 'nome');
        if (matchedEnt) {
          item.entidade = matchedEnt.nome;
          if (!item.municipio && matchedEnt.municipio) item.municipio = matchedEnt.municipio;
        }
      }

      // 3. Relacionar Município
      if (item.municipio) {
        let matchedMun = findBestMatch(item.municipio, ctx.municipios);
        if (matchedMun) {
          item.municipio = matchedMun;
        }
      }

      // 4. Relacionar Colaborador (quem / responsavel)
      let quemVal = item.quem || item.responsavel;
      if (quemVal) {
        let matchedCol = findBestMatch(quemVal, ctx.colaboradores, 'nome');
        if (matchedCol) {
          if (item.quem) item.quem = matchedCol.nome;
          if (item.responsavel) item.responsavel = matchedCol.nome;
        }
      }
    } catch(e) {
      console.error('Erro ao vincular dados relacionais:', e);
    }
    return item;
  }

  async function getSystemPrompt() {
    const now = new Date();
    const dateIso = now.toISOString().split('T')[0];
    const dateFormatted = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    let ctxSummary = '';
    if (emailKey) {
      let ctx = await fetchUserDatabaseContext(emailKey);
      let mList = ctx.municipios.slice(0, 30).join(', ');
      let eList = ctx.entidades.slice(0, 30).map(x => x.nome).join(', ');
      let cList = ctx.clientes.slice(0, 30).map(x => x.nome + (x.entidade ? ' (' + x.entidade + ')' : '')).join(', ');
      let colList = ctx.colaboradores.slice(0, 30).map(x => x.nome).join(', ');

      ctxSummary = `
DADOS CADASTRADOS NO BANCO DO USUÁRIO (RELACIONE COM ESTES REGISTROS EXISTENTES):
- MUNICÍPIOS EXISTENTES: ${mList || 'Nenhum'}
- ENTIDADES EXISTENTES: ${eList || 'Nenhuma'}
- CLIENTES EXISTENTES: ${cList || 'Nenhum'}
- COLABORADORES DA EQUIPE: ${colList || 'Nenhum'}

REGRA OBRIGATÓRIA DE RELACIONAMENTO:
Ao preencher os campos "municipio", "entidade", "cliente" ou "quem"/"responsavel", utilize SEMPRE os nomes oficiais dos registros acima já cadastrados no banco de dados se houver correspondência, em vez de criar nomes isolados.`;
    }

    return `Você é o assistente virtual oficial e inteligente do sistema Figoo.
Data e Hora Atual: ${dateFormatted} (${dateIso}) às ${timeFormatted}.

${ctxSummary}

Sua missão é ajudar o usuário a gerenciar sua rotina de trabalho e LER e INSERIR registros de forma 100% precisa, completa e RELACIONAL EM CASCATA no banco de dados.

Sempre que o usuário pedir para cadastrar, agendar, salvar, criar ou adicionar algo (ou consultar dados), retorne APENAS um objeto JSON válido, sem nenhum texto ao redor.

AÇÕES JSON SUPORTADAS:

1. LER DADOS:
{"action": "read", "module": "pendencias" | "reunioes" | "clientes" | "entidades" | "colaboradores" | "tarefas" | "calendario"}

2. INSERIR REGISTRO ÚNICO:
{"action": "insert", "module": "<NOME_DO_MODULO>", "data": { ... }}

3. INGESTÃO EM CASCATA DE MÚLTIPLAS ENTIDADES RELACIONADAS (cascade_insert):
Se a instrução do usuário envolver mais de um módulo (por exemplo: relato de uma reunião que menciona um novo cliente, uma entidade e gera 1 ou mais pendências/tarefas), você DEVE retornar um JSON "cascade_insert" ordenado logicamente:

{"action": "cascade_insert", "operations": [
  {"action": "insert", "module": "entidades", "data": { "nome": "Prefeitura de Capinzal", "municipio": "Capinzal", "tipo": "Prefeitura" }},
  {"action": "insert", "module": "clientes", "data": { "nome": "Ana Souza", "cargo": "Diretora", "entidade": "Prefeitura de Capinzal", "municipio": "Capinzal" }},
  {"action": "insert", "module": "reunioes", "data": { "cliente": "Prefeitura de Capinzal", "data": "${dateIso}", "modo": "presencial", "participantes": [{"nome": "Ana Souza", "papel": "Diretora"}] }},
  {"action": "insert", "module": "pendencias", "data": { "desc": "Enviar proposta de contrato", "dueDate": "${dateIso}", "entidade": "Prefeitura de Capinzal", "cliente": "Ana Souza", "municipio": "Capinzal" }}
]}

ESTRUTURAS ESPERADAS POR MÓDULO (module):

A) "pendencias" (Pendências / Tarefas a fazer):
- desc: (obrigatório) Descrição detalhada da tarefa.
- quem: Responsável / Colaborador (senão "").
- entidade: Nome da empresa / órgão público / prefeitura envolvida (senão "").
- cliente: Nome do contato / cliente (senão "").
- municipio: Nome do município (senão "").
- tipo: "executar" (default) ou "retorno".
- urgencia: "alta", "media", "baixa" ou "normal" (default: "normal").
- status: "pendente" (default) ou "feita".
- dueDate: Data "YYYY-MM-DD" se houver prazo (calcule a partir da data atual ${dateIso}), senão null.
- phone: Telefone (senão "").
- jira: Código Jira ex: "PROJ-123" (senão "").

B) "reunioes" (Reuniões agendadas ou registradas):
- cliente: (obrigatório) Nome da empresa, prefeitura ou cliente da reunião.
- data: Data "YYYY-MM-DD" (se não informada, use "${dateIso}").
- hora: Horário "HH:MM" (senão null).
- modo: "online" (default) ou "presencial".
- local: Link ou endereço (senão null).
- status: "agendada" (default), "realizada" ou "cancelada".
- proximaData: "YYYY-MM-DD" da próxima reunião (senão null).
- participantes: Array de objetos [{ "nome": "...", "papel": "..." }] se houver.
- pauta: Array de objetos [{ "texto": "...", "done": false }] se houver.
- ata: Resumo ou ata se houver (senão null).

C) "clientes" (Contatos individuais de clientes):
- nome: (obrigatório) Nome completo da pessoa.
- cargo: Cargo ou função (senão "").
- entidade: Empresa ou prefeitura vinculada (senão "").
- email: E-mail (senão "").
- fone: Telefone/WhatsApp (senão "").
- obs: Observações (senão "").
- municipio: Município (senão "").

D) "entidades" (Empresas, Prefeituras, Órgãos, Contas):
- nome: (obrigatório) Nome da empresa / órgão público.
- tipo: Ex: "Prefeitura", "Empresa", "Câmara Municipal", "Autarquia" (senão "").
- segmento: Setor/Segmento (senão "").
- municipio: Município (senão "").
- uf: Estado SC, SP, PR, etc. (senão "").
- fone: Telefone (senão "").
- email: E-mail (senão "").
- obs: Observações (senão "").

E) "colaboradores" (Membros da equipe):
- nome: (obrigatório) Nome da pessoa.
- cargo: Cargo (senão "").
- email: E-mail (senão "").
- fone: Telefone (senão "").
- departamento: Departamento/área (senão "").
- status: "ativo" (default) ou "inativo".

F) "tarefas" (Tarefas genéricas):
- titulo: (obrigatório) Título da tarefa.
- desc: Descrição (senão "").
- status: "pendente" (default), "em_andamento" ou "concluido".
- prazo: "YYYY-MM-DD" (senão null).
- responsavel: Nome do responsável (senão "").

G) "acoes_programadas" (Ações e atividades programadas no cliente):
- titulo: (obrigatório) Título / Objetivo da ação ex: "Treinamento de Folha de Pagamento".
- tipo: Tipo da ação ex: "Treinamento", "Implantação", "Consultoria Presencial", "Auditoria", "Suporte Técnico", "Alinhamento CS".
- entidade: Nome da Conta / Prefeitura / Empresa (senão "").
- cliente: Nome do Cliente / Contato (senão "").
- responsavel: Nome do Colaborador responsável da equipe (senão "").
- data: Data "YYYY-MM-DD" (se não informada, use "${dateIso}").
- hora: Horário "HH:MM" (senão null).
- status: "programada" (default), "em_andamento", "concluida" ou "cancelada".
- obs: Observações ou resumo da execução (senão "").

G) "calendario" (Eventos do calendário):
- title: (obrigatório) Título do evento.
- date: "YYYY-MM-DD" (obrigatório).
- time: "HH:MM" (senão null).
- description: Descrição (senão "").
- category: Categoria ex: "Trabalho", "Pessoal", "Reunião" (senão "").

FLUXO DE CONFIRMAÇÃO E RETORNO DE ID / LINK:
- Se o usuário pedir para criar algo mas não especificou todos os detalhes ou não deu um comando direto de salvamento, mostre um resumo dos dados formatado em texto legível e pergunte: "Posso salvar estes dados no banco?".
- Quando o usuário aprovar ("sim", "confirmo", "pode salvar", "ok") ou se o comando dele já for direto ("Cadastre agora X"), responda estritamente com o objeto JSON de inserção.
- Não misture texto e JSON na mesma resposta.`;
  }

  // 1. Injetar CSS
  const css = document.createElement('style');
  css.textContent = `
    .fc-fab { display: none !important; }
    
    .fc-drawer-backdrop {
      position: fixed; inset: 0; background: rgba(0,0,0,0.35); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
      z-index: 99998; opacity: 0; pointer-events: none; transition: opacity 0.25s ease;
    }
    .fc-drawer-backdrop.open { opacity: 1; pointer-events: auto; }
    
    .fc-panel {
      position: fixed; top: 0; right: 0; bottom: 0; width: 440px; max-width: 90vw; height: 100vh;
      background: var(--white, #fff); box-shadow: -10px 0 35px rgba(0,0,0,0.2); z-index: 99999;
      display: flex; flex-direction: column; overflow: hidden; border-left: 1px solid var(--border, #E8EAED);
      transform: translateX(100%); transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1); border-radius: 0;
    }
    .fc-panel.open { transform: translateX(0); opacity: 1; pointer-events: auto; }
    
    .fc-head { background:var(--primary, #2D5016); padding:14px 18px; color:#fff; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }
    .fc-title { font-weight:700; font-size:0.95rem; display:flex; align-items:center; gap:8px; }
    .fc-actions { display:flex; align-items:center; gap:6px; }
    .fc-head-btn { background:rgba(255,255,255,0.14); border:none; color:#fff; cursor:pointer; opacity:0.9; padding:6px 10px; display:flex; align-items:center; gap:4px; font-size:0.78rem; font-weight:500; border-radius:6px; transition:opacity 0.2s, background 0.2s; }
    .fc-head-btn:hover { opacity:1; background:rgba(255,255,255,0.25); }
    
    .fc-body { flex:1; overflow-y:auto; padding:16px; display:flex; flex-direction:column; gap:12px; background:var(--bg, #F6F7F9); }
    
    .fc-msg { max-width:88%; padding:12px 15px; border-radius:14px; font-size:0.88rem; line-height:1.5; position:relative; word-wrap:break-word; white-space:pre-wrap; }
    .fc-msg.user { background:color-mix(in srgb, var(--secondary, #5EAD24) 18%, var(--white, #fff)); color:var(--text, #1B1F1D); align-self:flex-end; border-bottom-right-radius:2px; }
    .fc-msg.ai { background:#fff; border:1px solid var(--border, #E8EAED); color:var(--text, #1B1F1D); align-self:flex-start; border-bottom-left-radius:2px; box-shadow:0 1px 3px rgba(0,0,0,0.04); }
    .fc-msg.sys { align-self:center; background:#EBF3E6; border:1px solid #C4E2B5; color:#2D5016; font-size:0.8rem; padding:10px 14px; border-radius:10px; max-width:92%; font-weight:500; text-align:left; }
    
    .fc-msg ul { margin:6px 0; padding-left:18px; }
    .fc-msg p { margin:4px 0; }
    .fc-msg strong { font-weight:600; color:var(--primary, #2D5016); }
    .fc-time { display:block; font-size:0.65rem; opacity:0.55; margin-top:4px; text-align:right; white-space:normal; }
    
    .fc-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 10px 14px;
      background: var(--bg, #F6F7F9);
      border-top: 1px solid var(--border, #E8EAED);
      flex-shrink: 0;
      max-height: 140px;
      overflow-y: auto;
    }
    .fc-chip {
      background: #ffffff;
      border: 1px solid var(--border, #E8EAED);
      border-radius: 16px;
      padding: 6px 12px;
      font-size: 0.78rem;
      font-weight: 500;
      color: var(--text, #1B1F1D);
      white-space: normal;
      cursor: pointer;
      transition: all 0.15s ease;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .fc-chip:hover {
      border-color: var(--secondary, #5EAD24);
      color: var(--primary, #2D5016);
      background: color-mix(in srgb, var(--secondary, #5EAD24) 10%, #fff);
      transform: translateY(-1px);
    }

    .fc-foot { padding:14px 16px; background:#fff; border-top:1px solid var(--border, #E8EAED); display:flex; gap:8px; align-items:center; flex-shrink:0; }
    .fc-input { flex:1; border:1px solid var(--border, #E8EAED); border-radius:20px; padding:10px 16px; font-size:0.88rem; outline:none; transition:border-color 0.2s; background:var(--bg, #F6F7F9); }
    .fc-input:focus { border-color:var(--secondary, #5EAD24); background:#fff; }
    .fc-send { width:38px; height:38px; border-radius:50%; background:var(--secondary, #5EAD24); color:#fff; border:none; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:opacity 0.2s; flex-shrink:0; }
    .fc-send:disabled { opacity:0.5; cursor:not-allowed; }
    
    .fc-typing { display:flex; gap:4px; align-items:center; padding:12px 16px; align-self:flex-start; background:#fff; border-radius:12px; border:1px solid var(--border, #E8EAED); }
    .fc-dot { width:6px; height:6px; background:var(--text2, #67716B); border-radius:50%; animation:fcbounce 1.4s infinite ease-in-out both; }
    .fc-dot:nth-child(1) { animation-delay:-0.32s; }
    .fc-dot:nth-child(2) { animation-delay:-0.16s; }
    @keyframes fcbounce { 0%, 80%, 100% { transform:scale(0); } 40% { transform:scale(1); } }

    @media (max-width: 600px) {
      .fc-panel { width: 100vw !important; max-width: 100vw !important; }
    }
  `;
  document.head.appendChild(css);

  // 2. Injetar HTML
  const fab = document.createElement('button');
  fab.id = 'figoo-chat-fab';
  fab.className = 'fc-fab';
  fab.title = 'Figoo AI Chat';
  fab.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 5.58 2 10c0 2.53 1.44 4.79 3.69 6.22l-.93 3.26c-.16.56.39 1.04.9.82l3.66-1.57A10.63 10.63 0 0012 19c5.52 0 10-3.58 10-8s-4.48-8-10-8zm-2 9H8V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z"/></svg>';
  document.body.appendChild(fab);

  const panel = document.createElement('div');
  panel.className = 'fc-panel';
  panel.innerHTML = `
    <div class="fc-head">
      <div class="fc-title">✨ Figoo AI</div>
      <div class="fc-actions">
        <button class="fc-head-btn fc-new" id="fc-btn-new" title="Iniciar nova conversa"><span>➕ Nova</span></button>
        <button class="fc-head-btn fc-end" id="fc-btn-end" title="Encerrar conversa atual"><span>🏁 Encerrar</span></button>
        <button class="fc-head-btn fc-close" title="Fechar chat" style="padding:4px"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg></button>
      </div>
    </div>
    <div class="fc-body" id="fc-body"></div>
    <div class="fc-chips" id="fc-chips">
      <button class="fc-chip" data-prompt="Me ajuda a montar o Feedback de um colaborador da minha equipe?">👤 Feedback Colaborador</button>
      <button class="fc-chip" data-prompt="Tive uma reunião presencial com a Prefeitura. Participante Ana. Criar pendência: Enviar proposta.">💡 Reunião + Pendência</button>
      <button class="fc-chip" data-prompt="Criar pendência urgente: Ligar para o cliente amanhã.">⚡ Pendência Urgente</button>
      <button class="fc-chip" data-prompt="Listar minhas pendências abertas">🔍 Consultar Pendências</button>
    </div>
    <div class="fc-foot">
      <input type="text" class="fc-input" id="fc-input" placeholder="Pergunte algo ou peça para agendar/salvar..." autocomplete="off">
      <button class="fc-send" id="fc-send" disabled><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
    </div>
  `;
  document.body.appendChild(panel);

  const uiBody = document.getElementById('fc-body');
  const uiInput = document.getElementById('fc-input');
  const uiSend = document.getElementById('fc-send');
  const uiClose = panel.querySelector('.fc-close');
  const uiBtnNew = document.getElementById('fc-btn-new');
  const uiBtnEnd = document.getElementById('fc-btn-end');

  panel.querySelectorAll('.fc-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      let prompt = btn.getAttribute('data-prompt');
      if (prompt && uiInput) {
        uiInput.value = prompt;
        uiInput.focus();
        uiSend.disabled = false;
      }
    });
  });

  // 3. Gestão de Sessões no Firebase
  async function loadSessionsData() {
    if (!emailKey) return;
    try {
      let rawSessions = await fbGetEnc('ai_chats/' + emailKey + '/sessions', 8000);
      sessions = rawSessions ? (typeof rawSessions === 'object' ? rawSessions : {}) : {};
      
      let activeId = await fbGetEnc('ai_chats/' + emailKey + '/active_session_id', 4000);
      if (activeId && sessions[activeId] && sessions[activeId].status === 'active') {
        currentSession = sessions[activeId];
      } else {
        await createNewSession();
      }
      renderMessages();
    } catch (e) {
      console.error('Erro ao carregar sessões de chat:', e);
      await createNewSession();
    }
  }

  async function createNewSession() {
    let nowMs = Date.now();
    let id = 'sess_' + nowMs + '_' + Math.random().toString(36).substr(2, 4);
    currentSession = {
      id: id,
      title: 'Nova Conversa',
      startedAt: nowMs,
      endedAt: null,
      status: 'active',
      messages: [
        { role: 'assistant', content: 'Olá! Sou seu assistente Figoo. Posso cadastrar pendências, agendar reuniões, adicionar clientes e consultar dados para você. O que deseja fazer hoje?', timestamp: nowMs }
      ],
      activities: []
    };
    sessions[id] = currentSession;
    await saveSessionData();
  }

  async function saveSessionData() {
    if (!emailKey || !currentSession) return;
    try {
      sessions[currentSession.id] = currentSession;
      await fbSetEnc('ai_chats/' + emailKey + '/sessions', sessions);
      await fbSetEnc('ai_chats/' + emailKey + '/active_session_id', currentSession.id);
      await fbSetEnc('ai_chats/' + emailKey + '/messages', currentSession.messages);
    } catch (e) {
      console.error('Erro ao salvar sessão de chat:', e);
    }
  }

  async function endCurrentSession() {
    if (!currentSession) return;
    if (confirm('Deseja encerrar a conversa atual? Ela ficará salva no seu histórico de Auditoria IA.')) {
      currentSession.status = 'closed';
      currentSession.endedAt = Date.now();
      await saveSessionData();
      await createNewSession();
      renderMessages();
    }
  }

  function renderFormattedText(txt) {
    if (!txt) return '';
    let html = txt
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" style="color:var(--primary,#2D5016);font-weight:600;text-decoration:underline">$1 ↗</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:rgba(0,0,0,0.06);padding:2px 5px;border-radius:4px;font-family:monospace">$1</code>')
      .replace(/^\s*-\s+(.*)$/gm, '<li>$1</li>');
    if (html.includes('<li>')) {
      html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    }
    return html;
  }

  function renderMessages() {
    uiBody.innerHTML = '';
    let msgs = currentSession ? currentSession.messages : [];
    
    msgs.forEach(m => {
      if (m.role === 'system' && !m.show) return;

      let div = document.createElement('div');
      div.className = 'fc-msg ' + (m.role === 'user' ? 'user' : (m.role === 'assistant' ? 'ai' : 'sys'));

      let contentHtml = renderFormattedText(m.content);
      let timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      div.innerHTML = contentHtml + (m.role !== 'system' ? '<span class="fc-time">' + timeStr + '</span>' : '');
      uiBody.appendChild(div);
    });
    uiBody.scrollTop = uiBody.scrollHeight;
  }

  function showTyping() {
    let div = document.createElement('div');
    div.id = 'fc-typing';
    div.className = 'fc-typing';
    div.innerHTML = '<div class="fc-dot"></div><div class="fc-dot"></div><div class="fc-dot"></div>';
    uiBody.appendChild(div);
    uiBody.scrollTop = uiBody.scrollHeight;
  }

  function hideTyping() {
    let t = document.getElementById('fc-typing');
    if (t) t.remove();
  }

  function notifyPageUpdate(moduleName, item) {
    try {
      const channelMap = { reunioes: 'figoo-reun', clientes: 'figoo-cli', entidades: 'figoo-cli', pendencias: 'figoo-pend' };
      const ch = channelMap[moduleName];
      if (ch && typeof BroadcastChannel !== 'undefined') {
        new BroadcastChannel(ch).postMessage({ ek: emailKey, action: 'insert', item: item });
      }
    } catch (e) {}

    try {
      if (moduleName === 'pendencias' && typeof window.renderAll === 'function') window.renderAll();
      if (moduleName === 'reunioes' && typeof window.loadMeetings === 'function') window.loadMeetings();
      if (moduleName === 'clientes' && typeof window.loadClientes === 'function') window.loadClientes();
      if (moduleName === 'colaboradores' && typeof window.loadEquipe === 'function') window.loadEquipe();
    } catch (e) {}
  }

  // 4. Ingestão Única e Ingestão em Cascata (Multi-Entidade)
  async function executeSingleInsert(mod, inputData) {
    inputData = inputData || {};
    let nowMs = Date.now();
    let res = null;

    // Auto-matching relacional
    inputData = await enhanceRecordWithRelationalData(mod, inputData, emailKey);

    if (mod === 'pendencias') {
      let path = 'pendencias/' + emailKey + '/items';
      let existing = await fbGetEnc(path, 10000);
      let list = existing ? (Array.isArray(existing) ? existing : Object.values(existing)) : [];
      let maxTicket = list.reduce((m, x) => Math.max(m, x.ticketNum || 0), 0);
      
      let item = {
        id: inputData.id || ('p_' + nowMs + '_' + Math.random().toString(36).substr(2, 4)),
        ticketNum: maxTicket + 1,
        desc: inputData.desc || 'Nova pendência',
        quem: inputData.quem || '',
        entidade: inputData.entidade || '',
        cliente: inputData.cliente || '',
        municipio: inputData.municipio || '',
        tipo: inputData.tipo || 'executar',
        urgencia: inputData.urgencia || 'normal',
        status: inputData.status || 'pendente',
        dueDate: inputData.dueDate || null,
        phone: inputData.phone || '',
        jira: inputData.jira || '',
        tagIds: inputData.tagIds || [],
        notinhas: inputData.notinhas || [],
        createdAt: nowMs,
        updatedAt: nowMs,
        doneAt: null
      };

      list.unshift(item);
      await fbSetEnc(path, list);
      notifyPageUpdate('pendencias', item);
      res = { success: true, action: 'insert', module: 'pendencias', label: 'Pendência #' + String(item.ticketNum).padStart(4, '0') + ': ' + item.desc, data: item };
    }
    else if (mod === 'reunioes') {
      let id = inputData.id || ('m_' + nowMs + '_' + Math.random().toString(36).substr(2, 4));
      let path = 'reunioes/' + emailKey + '/m/' + id;
      let todayIso = new Date().toISOString().split('T')[0];

      let item = {
        id: id,
        cliente: inputData.cliente || inputData.entidade || 'Reunião',
        data: inputData.data || todayIso,
        hora: inputData.hora || null,
        modo: inputData.modo || 'online',
        local: inputData.local || null,
        status: inputData.status || 'agendada',
        proximaData: inputData.proximaData || null,
        participantes: inputData.participantes || [],
        pauta: inputData.pauta || [],
        ata: inputData.ata || null,
        pendItemIds: inputData.pendItemIds || [],
        createdAt: nowMs,
        updatedAt: nowMs
      };

      await fbSetEnc(path, item);
      notifyPageUpdate('reunioes', item);
      res = { success: true, action: 'insert', module: 'reunioes', label: 'Reunião com ' + item.cliente + (item.data ? ' (' + item.data + ')' : ''), data: item };
    }
    else if (mod === 'clientes') {
      let id = inputData.id || ('c_' + nowMs + '_' + Math.random().toString(36).substr(2, 4));
      let path = 'clientes/' + emailKey + '/c/' + id;

      let item = {
        id: id,
        nome: inputData.nome || 'Novo Cliente',
        cargo: inputData.cargo || '',
        entidade: inputData.entidade || '',
        email: inputData.email || '',
        fone: inputData.fone || '',
        obs: inputData.obs || '',
        municipio: inputData.municipio || '',
        tags: inputData.tags || [],
        createdAt: nowMs,
        updatedAt: nowMs
      };

      await fbSetEnc(path, item);
      notifyPageUpdate('clientes', item);
      res = { success: true, action: 'insert', module: 'clientes', label: 'Cliente ' + item.nome, data: item };
    }
    else if (mod === 'entidades') {
      let id = inputData.id || ('e_' + nowMs + '_' + Math.random().toString(36).substr(2, 4));
      let path = 'entidades/' + emailKey + '/e/' + id;

      let item = {
        id: id,
        nome: inputData.nome || 'Nova Entidade',
        tipo: inputData.tipo || '',
        segmento: inputData.segmento || '',
        municipio: inputData.municipio || '',
        uf: inputData.uf || '',
        fone: inputData.fone || '',
        email: inputData.email || '',
        obs: inputData.obs || '',
        tags: inputData.tags || [],
        createdAt: nowMs,
        updatedAt: nowMs
      };

      await fbSetEnc(path, item);
      notifyPageUpdate('entidades', item);
      res = { success: true, action: 'insert', module: 'entidades', label: 'Entidade ' + item.nome, data: item };
    }
    else if (mod === 'colaboradores') {
      let path = 'colaboradores/' + emailKey + '/items';
      let existing = await fbGetEnc(path, 10000);
      let list = existing ? (Array.isArray(existing) ? existing : Object.values(existing)) : [];

      let item = {
        id: inputData.id || ('col_' + nowMs + '_' + Math.random().toString(36).substr(2, 4)),
        nome: inputData.nome || 'Novo Colaborador',
        cargo: inputData.cargo || '',
        email: inputData.email || '',
        fone: inputData.fone || '',
        departamento: inputData.departamento || '',
        status: inputData.status || 'ativo',
        createdAt: nowMs,
        updatedAt: nowMs
      };

      list.unshift(item);
      await fbSetEnc(path, list);
      notifyPageUpdate('colaboradores', item);
      res = { success: true, action: 'insert', module: 'colaboradores', label: 'Colaborador ' + item.nome, data: item };
    }
    else if (mod === 'tarefas') {
      let path = 'tarefas/' + emailKey + '/items';
      let existing = await fbGetEnc(path, 10000);
      let list = existing ? (Array.isArray(existing) ? existing : Object.values(existing)) : [];

      let item = {
        id: inputData.id || ('t_' + nowMs + '_' + Math.random().toString(36).substr(2, 4)),
        titulo: inputData.titulo || 'Nova Tarefa',
        desc: inputData.desc || '',
        status: inputData.status || 'pendente',
        prazo: inputData.prazo || null,
        responsavel: inputData.responsavel || '',
        createdAt: nowMs,
        updatedAt: nowMs
      };

      list.unshift(item);
      await fbSetEnc(path, list);
      res = { success: true, action: 'insert', module: 'tarefas', label: 'Tarefa: ' + item.titulo, data: item };
    }
    else if (mod === 'calendario') {
      let path = 'calendario/' + emailKey + '/events';
      let existing = await fbGetEnc(path, 10000);
      let list = existing ? (Array.isArray(existing) ? existing : Object.values(existing)) : [];

      let item = {
        id: inputData.id || ('ev_' + nowMs + '_' + Math.random().toString(36).substr(2, 4)),
        title: inputData.title || 'Novo Evento',
        date: inputData.date || new Date().toISOString().split('T')[0],
        time: inputData.time || null,
        description: inputData.description || '',
        category: inputData.category || 'Trabalho',
        createdAt: nowMs,
        updatedAt: nowMs
      };

      list.unshift(item);
      await fbSetEnc(path, list);
      res = { success: true, action: 'insert', module: 'calendario', label: 'Evento: ' + item.title, data: item };
    }
    else if (mod === 'acoes_programadas' || mod === 'acoes-programadas' || mod === 'acoes') {
      let path = 'acoes_programadas/' + emailKey + '/items';
      let existing = await fbGetEnc(path, 10000);
      let list = existing ? (Array.isArray(existing) ? existing : Object.values(existing)) : [];

      let item = {
        id: inputData.id || ('act_' + nowMs + '_' + Math.random().toString(36).substr(2, 4)),
        titulo: inputData.titulo || inputData.desc || inputData.objetivo || 'Nova Ação Programada',
        tipo: inputData.tipo || 'Treinamento',
        status: inputData.status || 'programada',
        entidade: inputData.entidade || inputData.conta || '',
        cliente: inputData.cliente || inputData.contato || '',
        responsavel: inputData.responsavel || inputData.colaborador || '',
        data: inputData.data || inputData.dataInicio || new Date().toISOString().split('T')[0],
        dataFim: inputData.dataFim || inputData.prazo || null,
        hora: inputData.hora || null,
        obs: inputData.obs || inputData.observacao || '',
        createdAt: nowMs,
        updatedAt: nowMs
      };

      list.unshift(item);
      await fbSetEnc(path, list);
      res = { success: true, action: 'insert', module: 'acoes_programadas', label: 'Ação Programada: ' + item.titulo, data: item };
    }

    if (res && res.success && currentSession) {
      if (!currentSession.activities) currentSession.activities = [];
      currentSession.activities.push({
        id: res.data ? res.data.id : Date.now(),
        module: res.module,
        label: res.label,
        timestamp: nowMs,
        data: res.data
      });
    }

    return res || { error: 'Módulo não suportado' };
  }

  async function executeAction(jsonStr) {
    try {
      let cmd = JSON.parse(jsonStr);

      if (cmd.action === 'cascade_insert' && Array.isArray(cmd.operations)) {
        let createdItems = [];
        let createdMeetingId = null;
        let createdPendenciaIds = [];
        let createdMeetingObj = null;

        for (let op of cmd.operations) {
          if (!op || op.action !== 'insert') continue;
          let subRes = await executeSingleInsert(op.module, op.data);
          if (subRes && subRes.success) {
            createdItems.push(subRes);
            if (op.module === 'reunioes' && subRes.data) {
              createdMeetingId = subRes.data.id;
              createdMeetingObj = subRes.data;
            } else if (op.module === 'pendencias' && subRes.data) {
              createdPendenciaIds.push(subRes.data.id);
            }
          }
        }

        // Se reunião e pendências foram criadas no mesmo lote, vincula pendItemIds na reunião!
        if (createdMeetingId && createdPendenciaIds.length > 0 && createdMeetingObj) {
          try {
            let path = 'reunioes/' + emailKey + '/m/' + createdMeetingId;
            let currentMeeting = await fbGetEnc(path, 8000) || createdMeetingObj;
            currentMeeting.pendItemIds = Array.from(new Set([...(currentMeeting.pendItemIds || []), ...createdPendenciaIds]));
            await fbSetEnc(path, currentMeeting);
            notifyPageUpdate('reunioes', currentMeeting);
          } catch (e) {
            console.error('Erro ao cruzar IDs da reunião e pendências:', e);
          }
        }

        return {
          success: true,
          action: 'cascade_insert',
          label: `Operação Relacional em Cascata (${createdItems.length} registros criados e vinculados)`,
          items: createdItems
        };
      }

      if (cmd.action === 'read') {
        let path = cmd.module + '/' + emailKey + '/items';
        if (cmd.module === 'reunioes') path = 'reunioes/' + emailKey + '/m';
        if (cmd.module === 'clientes') path = 'clientes/' + emailKey + '/c';
        if (cmd.module === 'entidades') path = 'entidades/' + emailKey + '/e';
        let data = await fbGetEnc(path, 10000);
        return { success: true, action: 'read', data: data || [] };
      }
      else if (cmd.action === 'insert') {
        return await executeSingleInsert(cmd.module, cmd.data);
      }
      return { error: 'Ação ou módulo desconhecido.' };
    } catch (e) {
      return { error: e.message };
    }
  }

  async function processAgentTurn() {
    isThinking = true;
    showTyping();
    uiInput.disabled = true;

    try {
      if (typeof figooAI === 'undefined' || !figooAI.callAIChat) {
        throw new Error("Módulo de IA não configurado ou carregado.");
      }

      let systemPrompt = await getSystemPrompt();
      let payload = { messages: currentSession.messages, system: systemPrompt };
      let reply = await figooAI.callAIChat(payload);

      let cleanReply = reply.trim();
      if (cleanReply.startsWith('{') && cleanReply.endsWith('}')) {
        let actionResult = await executeAction(cleanReply);
        
        currentSession.messages.push({ role: 'assistant', content: cleanReply, timestamp: Date.now(), show: false });
        
        let labelMsg = '';
        if (actionResult.action === 'cascade_insert' && Array.isArray(actionResult.items)) {
          let lines = actionResult.items.map(item => {
            let itemId = item.data ? item.data.id : '';
            let itemUrl = getItemUrl(item.module, itemId);
            let iconMap = { entidades: '🏛️', clientes: '👥', reunioes: '🗓️', pendencias: '📋', colaboradores: '👤', tarefas: '📝', calendario: '📅' };
            let icon = iconMap[item.module] || '⚡';
            return `${icon} **${item.label}** (\`${itemId}\`) — [Abrir no Figoo](${itemUrl})`;
          });

          labelMsg = `✅ **${actionResult.label}**\n\n` + lines.join('\n\n');
        } else {
          let itemId = actionResult.data ? actionResult.data.id : '';
          let itemUrl = getItemUrl(actionResult.module, itemId);

          labelMsg = actionResult.success 
            ? `✅ **${actionResult.label || 'Registro'}** salvo no banco de dados com sucesso!\n🆔 **ID:** \`${itemId}\`\n🔗 **Link:** [Abrir registro no Figoo](${itemUrl})`
            : `❌ Erro ao salvar: ${actionResult.error}`;
        }

        currentSession.messages.push({ role: 'system', content: labelMsg, timestamp: Date.now(), show: true });

        renderMessages();
        await saveSessionData();
        await processAgentTurn();
      } else {
        currentSession.messages.push({ role: 'assistant', content: cleanReply, timestamp: Date.now() });
        renderMessages();
        await saveSessionData();
      }
    } catch (e) {
      let errMsg = e.message || '';
      if (errMsg.includes('demand') || errMsg.includes('503') || errMsg.includes('sobrecarregado')) {
        errMsg = 'O servidor da IA do Google está enfrentando um pico temporário de alta demanda. Por favor, tente novamente em alguns instantes.';
      }
      currentSession.messages.push({ role: 'assistant', content: '⚠️ ' + errMsg, timestamp: Date.now() });
      renderMessages();
      await saveSessionData();
    }

    isThinking = false;
    hideTyping();
    uiInput.disabled = false;
    uiInput.focus();
  }

  // 5. Eventos e Drawer
  const backdrop = document.createElement('div');
  backdrop.className = 'fc-drawer-backdrop';
  document.body.appendChild(backdrop);

  function toggleChat(state) {
    if (!emailKey) {
      let e = localStorage.getItem('figoo_email');
      if (e && typeof emailToKey === 'function') emailKey = emailToKey(e);
    }
    if (typeof state === 'boolean') chatOpen = state;
    else chatOpen = !chatOpen;

    if (chatOpen) {
      if (!emailKey) return alert("Faça login primeiro.");
      backdrop.classList.add('open');
      panel.classList.add('open');
      uiInput.focus();
      if (!currentSession) loadSessionsData();
    } else {
      backdrop.classList.remove('open');
      panel.classList.remove('open');
    }
  }

  window.toggleFigooChat = toggleChat;

  backdrop.addEventListener('click', () => toggleChat(false));
  uiClose.addEventListener('click', () => toggleChat(false));

  uiBtnNew.addEventListener('click', async () => {
    if (confirm('Deseja iniciar uma nova conversa limpa?')) {
      await createNewSession();
      renderMessages();
    }
  });

  uiBtnEnd.addEventListener('click', () => {
    endCurrentSession();
  });

  uiInput.addEventListener('input', () => { uiSend.disabled = uiInput.value.trim().length === 0; });
  uiInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !isThinking && uiInput.value.trim().length > 0) {
      sendMessage();
    }
  });
  uiSend.addEventListener('click', () => {
    if (!isThinking && uiInput.value.trim().length > 0) sendMessage();
  });

  function sendMessage() {
    let txt = uiInput.value.trim();
    uiInput.value = '';
    uiSend.disabled = true;

    if (currentSession && currentSession.messages.length <= 1) {
      currentSession.title = txt.length > 35 ? txt.substr(0, 35) + '…' : txt;
    }

    currentSession.messages.push({ role: 'user', content: txt, timestamp: Date.now() });
    renderMessages();
    saveSessionData();

    processAgentTurn();
  }

})();
