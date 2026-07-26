// figoo-ui.js — Topbar e footer consistentes em todas as páginas
// Portal figoo · v2.0 · 2026-05
// ─────────────────────────────────────────────────────────────
// Requer: figoo-auth.js (authClearSession, emailToKey)
//
// Funções públicas:
//   renderTopbar(config)
//   setTopbarEmail(email)
//   setCloudBadge(state)    — 'online' | 'local' | ''
//   renderFooter(module, version)
//   doLogout(ek)            — limpa sessão e redireciona para index

// ─── CSS base (topbar + footer) ──────────────────────────────
(function _injectUiCSS() {
  if (document.getElementById('_figoo_ui_css')) return;
  const s = document.createElement('style');
  s.id = '_figoo_ui_css';
  s.textContent = `
    .topbar{background:var(--white,#FFFFFF);border-bottom:1.5px solid color-mix(in srgb, var(--secondary,#5EAD24) 45%, var(--border,#E8EAED));padding-top:env(safe-area-inset-top);height:calc(52px + env(safe-area-inset-top));display:flex;justify-content:center;flex-shrink:0;position:sticky;top:0;z-index:100;box-sizing:border-box}
    .topbar-inner{width:100%;max-width:1200px;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:0 20px;box-sizing:border-box;margin:0 auto;position:relative}
    @media (min-width: 1400px) { .topbar-inner { max-width: 1440px; } }
    @media (min-width: 1600px) { .topbar-inner { max-width: 1600px; } }
    .topbar-left{display:flex;align-items:center;gap:10px;min-width:0;flex-shrink:0}
    .logo-link{display:flex;align-items:center;gap:7px;text-decoration:none;color:var(--text,#1B1F1D);font-weight:700;font-size:.9rem;flex-shrink:0}
    .divider-v{width:1px;height:18px;background:var(--border,#E8EAED);flex-shrink:0}
    .page-badge{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.82rem;color:#fff;flex-shrink:0}
    .page-badge svg{width:15px;height:15px;display:block}
    .page-meta{display:flex;flex-direction:column;gap:1px;min-width:0}
    .page-title{font-size:.84rem;font-weight:700;color:var(--text,#1B1F1D);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .page-sub{font-size:.60rem;color:var(--text2,#67716B);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
    
    /* Center Navigation Pill Bar (Perfect Mathematical Centering) */
    .topbar-center{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;gap:4px;background:rgba(127,127,127,.06);border:.5px solid var(--border,#E8EAED);padding:3px 4px;border-radius:10px;z-index:5;pointer-events:auto}
    .tnav-pill{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:8px;font-size:.76rem;font-weight:600;color:var(--text2,#67716B);text-decoration:none;transition:all .15s;white-space:nowrap}
    .tnav-pill:hover{color:var(--text,#1B1F1D);background:rgba(127,127,127,.12)}
    .tnav-pill.active{background:var(--primary,#2D5016);color:#FFFFFF;font-weight:700;box-shadow:0 2px 6px rgba(45,80,22,0.25)}
    .tnav-pill .tbtn-ico{display:inline-flex;align-items:center;justify-content:center;width:14px;height:14px}
    .tnav-pill .tbtn-ico svg{width:14px;height:14px;display:block}

    .topbar-right{display:flex;align-items:center;gap:6px;margin-left:auto;flex-shrink:0}
    .status-badge{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;flex-shrink:0;color:var(--text2,#67716B)}
    .status-badge svg{width:17px;height:17px;display:block}
    .status-badge.online{color:var(--secondary,#5EAD24)}
    .status-badge.saving{color:var(--text2,#67716B)}
    .status-badge.local{color:#B7791F}
    .status-badge.saving svg{animation:fig-spin 1s linear infinite}
    @keyframes fig-spin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.status-badge.saving svg{animation:none}}
    .tbtn{background:rgba(127,127,127,.08);border:.5px solid var(--border,#E8EAED);color:var(--text,#1B1F1D);padding:5px 12px;border-radius:8px;font-size:.71rem;font-weight:500;cursor:pointer;font-family:inherit;transition:background .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;text-decoration:none}
    .tbtn:hover{background:rgba(127,127,127,.16)}
    .tbtn:focus-visible,.fgt-btn:focus-visible{outline:2px solid var(--secondary,#5EAD24);outline-offset:2px}
    .tbtn.accent{border-color:var(--secondary,#5EAD24);color:var(--secondary,#5EAD24)}
    .tbtn.success{background:var(--secondary,#5EAD24);color:#fff;border-color:transparent}
    .tbtn-ico{display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;flex-shrink:0;line-height:1}
    .tbtn-ico svg{width:15px;height:15px;display:block}
    .figoo-footer{background:var(--bg,#F6F7F9);text-align:center;font-size:.7rem;color:var(--text2,#67716B);padding:14px 18px;border-top:.5px solid var(--border,#E8EAED);margin-top:auto;flex-shrink:0}

    /* ── Override "app moderno" da topbar ── */
    #topbar.topbar{background:var(--white,#FFFFFF);border-bottom:1.5px solid color-mix(in srgb, var(--secondary,#5EAD24) 45%, var(--border,#E8EAED));color:var(--text,#1B1F1D)}
    #topbar .logo-link{color:var(--text,#1B1F1D)}
    #topbar .divider-v{background:var(--border,#E8EAED)}
    #topbar .page-title,#topbar .page-title-tb{color:var(--text,#1B1F1D)}
    #topbar .page-sub{color:var(--text2,#67716B)}
    #topbar .status-badge{color:var(--text2,#67716B)}
    #topbar .status-badge.online{color:var(--secondary,#5EAD24)}
    #topbar .status-badge.local{color:#B7791F}
    #topbar .tbtn{background:rgba(127,127,127,.08);border:.5px solid var(--border,#E8EAED);color:var(--text,#1B1F1D);border-radius:8px}
    #topbar .tbtn:hover{background:rgba(127,127,127,.16)}

    /* ── Barra de navegação inferior (só mobile) ── */
    .fgnav{display:none;position:fixed;left:0;right:0;bottom:0;z-index:600;background:var(--white,#FFFFFF);border-top:.5px solid var(--border,#E8EAED);height:calc(58px + env(safe-area-inset-bottom));padding:0 4px env(safe-area-inset-bottom);box-shadow:0 -2px 12px rgba(0,0,0,.05)}
    .fgnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;color:var(--text2,#67716B);font-size:.62rem;font-weight:500;min-width:0;-webkit-tap-highlight-color:transparent}
    .fgnav-item svg{width:22px;height:22px;flex-shrink:0}
    .fgnav-item.active{color:var(--secondary,#5EAD24)}
    .fgnav-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;padding:0 2px}

    @media(max-width:960px){
      .topbar-center{display:none!important}
    }
    @media(max-width:680px){
      .fgnav{display:flex}
      body{padding-bottom:calc(58px + env(safe-area-inset-bottom))}
      input,select,textarea{font-size:16px!important}
      .tbtn,#topbar .tbtn,.topbar-right .fgt-btn{min-height:38px;padding:6px 11px}
      .toast{bottom:calc(70px + env(safe-area-inset-bottom))!important}
    }
    @media(max-width:600px){.topbar-inner{padding:0 8px;gap:4px}.logo-link{font-size:0;gap:0}.divider-v,.page-badge,.status-badge{display:none!important}.page-sub,.tbtn-label{display:none!important}.topbar-right{gap:2px}.tbtn,.topbar-right .fgt-btn{padding:4px 7px;font-size:.7rem}}`;
  document.head.appendChild(s);
})();

// SVG do logo figoo (folha)
const _FIGOO_LOGO = `<svg width="14" height="17" viewBox="0 0 22 26" fill="none">
  <path d="M11 23 C11 23 1 17 3 5 C8 2 11 13 11 23Z" fill="#C0DD97"/>
  <path d="M11 23 C11 23 21 17 19 5 C14 2 11 13 11 23Z" fill="#5EAD24" opacity="0.9"/>
  <circle cx="11" cy="25" r="2" fill="#8B6914"/>
</svg>`;

// ─── Set de ícones do cabeçalho (linha, monocromático, currentColor) ──
// Fonte única — usado pelo renderTopbar, pelo figoo-theme.js e pelas páginas.
function _ic(p){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;}
const FIG_ICON = {
  theme:  _ic('<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12z" fill="currentColor" stroke="none"/>'),
  wallet: _ic('<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>'),
  list:   _ic('<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>'),
  tag:    _ic('<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r="1.2"/>'),
  key:    _ic('<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L21 5"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>'),
  logout: _ic('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>'),
  link:   _ic('<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>'),
  gear:   _ic('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
  calendar:_ic('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'),
  users:  _ic('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>'),
  building:_ic('<path d="M3 21h18M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6"/>'),
  saved:  _ic('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
  saving: _ic('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>'),
  unsaved:_ic('<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>')
};
if (typeof window !== 'undefined') window.FIG_ICON = FIG_ICON;

// ─── Navegação entre ferramentas ────────────────────────────

/** Detecta o id do módulo actual a partir do URL. */
function _getModuleId() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('admin')) return 'admin';
  if (path.includes('pagamentos')) return 'mensal';
  if (path.includes('pendencia')) return 'pendencias';
  if (path.includes('reunio') || path.includes('reuniao')) return 'reunioes';
  if (path.includes('conta')) return 'contas';
  if (path.includes('cliente')) return 'clientes';
  return '';
}

/**
 * Gera HTML com botões de navegação para as outras ferramentas.
 * @param {string} currentId — id do módulo actual (não aparece na lista)
 * @param {string} email     — e-mail para passar como ?e=
 */
function _buildToolsNav(currentId, email) {
  const enc = encodeURIComponent(email || '');
  const tools = [
    { id: 'pendencias', icon: FIG_ICON.list,     label: 'Pendências', href: `pendencias.html?e=${enc}` },
    { id: 'reunioes',   icon: FIG_ICON.calendar, label: 'Reuniões',   href: `reunioes.html?e=${enc}` },
    { id: 'clientes',   icon: FIG_ICON.users,    label: 'Clientes',   href: `clientes.html?e=${enc}` },
    { id: 'contas',     icon: FIG_ICON.building, label: 'Contas',     href: `contas.html?e=${enc}` },
    { id: 'mensal',     icon: FIG_ICON.wallet,   label: 'Mensal',     href: `pagamentos.html?e=${enc}` }
  ];
  if ((email || '').toLowerCase().includes('emanuel.alexandre') || (email || '').toLowerCase().includes('emanuel_alexandre') || currentId === 'admin') {
    tools.push({ id: 'admin', icon: FIG_ICON.gear, label: 'Admin', href: `admin.html?e=${enc}` });
  }
  return tools
    .map(t => {
      const isAct = t.id === currentId;
      return `<a href="${t.href}" class="tnav-pill ${isAct ? 'active' : ''}" title="${t.label}"><span class="tbtn-ico">${t.icon}</span><span>${t.label}</span></a>`;
    })
    .join('');
}

function _buildMobileNav(currentId, email) {
  const enc = encodeURIComponent(email || '');
  const tools = [
    { id: 'pendencias', icon: FIG_ICON.list,     label: 'Pendências', href: `pendencias.html?e=${enc}` },
    { id: 'reunioes',   icon: FIG_ICON.calendar, label: 'Reuniões',   href: `reunioes.html?e=${enc}` },
    { id: 'clientes',   icon: FIG_ICON.users,    label: 'Clientes',   href: `clientes.html?e=${enc}` },
    { id: 'contas',     icon: FIG_ICON.building, label: 'Contas',     href: `contas.html?e=${enc}` },
    { id: 'mensal',     icon: FIG_ICON.wallet,   label: 'Mensal',     href: `pagamentos.html?e=${enc}` }
  ];
  if ((email || '').toLowerCase().includes('emanuel.alexandre') || (email || '').toLowerCase().includes('emanuel_alexandre') || currentId === 'admin') {
    tools.push({ id: 'admin', icon: FIG_ICON.gear, label: 'Admin', href: `admin.html?e=${enc}` });
  }
  return tools
    .map(t => {
      const isAct = t.id === currentId;
      return `<a href="${t.href}" class="fgnav-item ${isAct ? 'active' : ''}" title="${t.label}"><span class="fgnav-ico">${t.icon}</span><span>${t.label}</span></a>`;
    })
    .join('');
}

/**
 * Actualiza o conteúdo do elemento #topbar com a estrutura padrão figoo.
 *
 * @param {object} config
 *   module       {string}   — nome do módulo (ex: 'pendências')
 *   badge        {string}   — emoji/texto do badge (ex: '📋')
 *   badgeColor   {string}   — cor de fundo do badge
 *   version      {string}   — versão (ex: 'v1.7')
 *   email        {string}   — e-mail exibido abaixo do módulo
 *   extraButtons {string}   — HTML de botões extra (inseridos antes de 🔑 e ⏏)
 *   onLogout     {function} — callback para logout
 *   onPassword   {function} — callback para gestão de senha (omitir para esconder botão)
 */
function renderTopbar(config) {
  const {
    module = '',
    badge = '',
    badgeColor = 'var(--secondary,#5EAD24)',
    version = '',
    email = '',
    extraButtons = '',
    onLogout,
    onPassword
  } = config;

  const tb = document.getElementById('topbar');
  if (!tb) return;

  const moduleId  = _getModuleId();
  const toolsNav  = _buildToolsNav(moduleId, email);

  tb.innerHTML = `
    <div class="topbar-inner">
      <div class="topbar-left">
        <a href="index.html" class="logo-link" title="Início · figoo" style="cursor:pointer" onclick="window.location.href='index.html'">
          ${_FIGOO_LOGO} figoo
        </a>
        <div class="divider-v"></div>
        ${badge ? `<div class="page-badge" style="background:${badgeColor}">${badge}</div>` : ''}
        <div class="page-meta">
          <div class="page-title" id="topbar-title">${module}</div>
          <div class="page-sub" id="topbar-email-sub">${email}</div>
        </div>
      </div>

      <div class="topbar-center" id="topbar-center">
        ${toolsNav}
      </div>

      <div class="topbar-right" id="topbar-right">
        <span class="status-badge online" id="cloud-badge" title="Salvo na nuvem">${FIG_ICON.saved}</span>
        ${extraButtons}
        ${onPassword
          ? `<button class="tbtn" id="btn-pw-mgmt" onclick="_figoo_pwBtn()" title="Gerenciar senha"><span class="tbtn-ico">${FIG_ICON.key}</span><span class="tbtn-label">Senha</span></button>`
          : ''}
        <button class="tbtn" onclick="_figoo_logoutBtn()" title="Sair"><span class="tbtn-ico">${FIG_ICON.logout}</span><span class="tbtn-label">Sair</span></button>
      </div>
    </div>`;

  let fgNavEl = document.getElementById('fgnav-bar');
  if (!fgNavEl) {
    fgNavEl = document.createElement('nav');
    fgNavEl.id = 'fgnav-bar';
    fgNavEl.className = 'fgnav';
    document.body.appendChild(fgNavEl);
  }
  fgNavEl.innerHTML = _buildMobileNav(moduleId, email);

  window._figoo_logoutCb   = onLogout;
  window._figoo_passwordCb = onPassword;
}

function _figoo_logoutBtn()  { if (window._figoo_logoutCb)  window._figoo_logoutCb(); }
function _figoo_pwBtn()      { if (window._figoo_passwordCb) window._figoo_passwordCb(); }

/**
 * Helper para acionar download de arquivo no navegador.
 */
function _figDownloadFile(filename, textContent, mimeType) {
  const blob = new Blob([textContent], { type: mimeType || 'text/markdown;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 200);
}

/**
 * Exporta todo o banco de dados do usuário ativo em arquivos Markdown (.md) separados
 * para Pendências, Clientes, Contas, Reuniões e Pagamentos, empacotados em um arquivo ZIP.
 */
async function exportFigooToMarkdown(ek) {
  const email = (localStorage.getItem('figoo_email') || '').trim();
  const emailKey = ek || (email ? emailToKey(email) : '');
  if (!emailKey) {
    alert('Nenhum usuário ativo para exportar.');
    return;
  }

  const btn = document.getElementById('btn-export-md');
  if (btn) btn.textContent = 'Gerando Markdown…';

  const dNow = new Date().toLocaleString('pt-BR');
  const dIso = new Date().toISOString().slice(0, 10);
  const files = {};

  try {
    // 1. Pendências (1_pendencias.md)
    try {
      const rawPend = await fbGetEnc(`pendencias/${emailKey}/items`, 15000);
      const list = Array.isArray(rawPend) ? rawPend : (rawPend && typeof rawPend === 'object' ? Object.values(rawPend) : []);
      let md = `# 📋 Backup de Pendências — Figoo\n_Exportado em: ${dNow}_\n\nTotal de registros: ${list.length}\n\n---\n\n`;

      list.forEach((i, idx) => {
        const ticket = i.ticketNum ? '#' + String(i.ticketNum).padStart(4, '0') : `#${idx + 1}`;
        const descText = (i.desc || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
        const statusText = i.status === 'feita' ? '✅ Feita' : '⏳ Pendente';

        md += `### ${ticket} — ${i.entidade || i.quem || 'Sem título'}\n`;
        md += `- **Status**: ${statusText}\n`;
        md += `- **Tipo**: ${i.tipo || 'retorno'}\n`;
        md += `- **Urgência**: ${i.urgencia || 'normal'}\n`;
        if (i.quem) md += `- **Quem Pediu**: ${i.quem}\n`;
        if (i.entidade) md += `- **Entidade**: ${i.entidade}\n`;
        if (i.jira) md += `- **Chamado Jira**: ${i.jira}\n`;
        if (i.dueDate) md += `- **Prazo**: ${i.dueDate}\n`;
        if (i.phone) md += `- **WhatsApp**: ${i.phone}\n`;
        if (i.createdAt) md += `- **Criado em**: ${new Date(i.createdAt).toLocaleString('pt-BR')}\n`;

        if (descText) {
          md += `\n**Descrição / Detalhes**:\n${descText}\n`;
        }

        if (Array.isArray(i.notinhas) && i.notinhas.length) {
          md += `\n**Anotações / Marcos**:\n`;
          i.notinhas.forEach(n => {
            const chk = n.done ? '[x]' : '[ ]';
            md += `- ${chk} ${n.text || ''}\n`;
          });
        }

        if (Array.isArray(i.marcos) && i.marcos.length) {
          md += `\n**Marcos de Prazo**:\n`;
          i.marcos.forEach(m => {
            const chk = m.done ? '[x]' : '[ ]';
            md += `- ${chk} ${m.label || ''} (${m.date || ''})\n`;
          });
        }

        md += `\n---\n\n`;
      });

      files['1_pendencias.md'] = md;
    } catch (e) {
      console.warn('[export md pendencias error]', e);
    }

    // 2. Clientes (2_clientes.md)
    try {
      const rawCli = await fbGet(`clientes/${emailKey}/c`, 15000);
      const cliList = [];
      if (rawCli && typeof rawCli === 'object') {
        for (const id in rawCli) {
          if (id.indexOf('__') === 0) continue;
          try {
            const c = await decData(rawCli[id]);
            if (c && c.nome) cliList.push(c);
          } catch (err) {}
        }
      }

      let md = `# 👥 Backup de Clientes (Contatos) — Figoo\n_Exportado em: ${dNow}_\n\nTotal de contatos: ${cliList.length}\n\n`;
      md += `| Nome | Área / Papel | Município | Entidade | WhatsApp | E-mail | Notas |\n`;
      md += `| --- | --- | --- | --- | --- | --- | --- |\n`;

      cliList.forEach(c => {
        const clean = (s) => (s || '').replace(/\|/g, '-').replace(/\n/g, ' ');
        md += `| ${clean(c.nome)} | ${clean(c.area)} | ${clean(c.municipio)} | ${clean(c.entidade)} | ${clean(c.whatsapp)} | ${clean(c.email)} | ${clean(c.notas)} |\n`;
      });

      md += `\n\n## Detalhes Individuais dos Clientes\n\n`;
      cliList.forEach(c => {
        md += `### 👤 ${c.nome}\n`;
        if (c.area) md += `- **Área / Papel**: ${c.area}\n`;
        if (c.municipio) md += `- **Município**: ${c.municipio}\n`;
        if (c.entidade) md += `- **Entidade**: ${c.entidade}\n`;
        if (c.whatsapp) md += `- **WhatsApp**: ${c.whatsapp}\n`;
        if (c.email) md += `- **E-mail**: ${c.email}\n`;
        if (c.notas) md += `- **Notas**: ${c.notas}\n`;
        md += `\n---\n\n`;
      });

      files['2_clientes.md'] = md;
    } catch (e) {
      console.warn('[export md clientes error]', e);
    }

    // 3. Reuniões (3_reunioes.md)
    try {
      const rawReun = await fbGet(`reunioes/${emailKey}/m`, 15000);
      const reunList = [];
      if (rawReun && typeof rawReun === 'object') {
        for (const id in rawReun) {
          if (id.indexOf('__') === 0) continue;
          try {
            const m = await decData(rawReun[id]);
            if (m) reunList.push(m);
          } catch (err) {}
        }
      }

      let md = `# 🗓️ Backup de Reuniões — Figoo\n_Exportado em: ${dNow}_\n\nTotal de reuniões: ${reunList.length}\n\n---\n\n`;

      reunList.forEach(m => {
        const ataText = (m.ata || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
        const parts = (m.participantes || []).map(p => p.nome + (p.papel ? ` (${p.papel})` : '')).join(', ');

        md += `### 🗓️ Reunião: ${m.cliente || 'Sem cliente'}\n`;
        md += `- **Data**: ${m.data || 'Sem data'}\n`;
        md += `- **Hora**: ${m.hora || 'Sem hora'}\n`;
        md += `- **Local / Link**: ${m.local || '-'}\n`;
        md += `- **Modo**: ${m.modo || 'presencial'}\n`;
        md += `- **Status**: ${m.status || 'agendada'}\n`;
        if (parts) md += `- **Participantes**: ${parts}\n`;

        if (ataText) {
          md += `\n**Ata / Pauta / Anotações**:\n${ataText}\n`;
        }

        md += `\n---\n\n`;
      });

      files['3_reunioes.md'] = md;
    } catch (e) {
      console.warn('[export md reunioes error]', e);
    }

    // 4. Contas / Entidades (4_contas.md)
    try {
      const rawEnt = await fbGet(`entidades/${emailKey}/e`, 15000);
      const entList = [];
      if (rawEnt && typeof rawEnt === 'object') {
        for (const id in rawEnt) {
          if (id.indexOf('__') === 0) continue;
          try {
            const e = await decData(rawEnt[id]);
            if (e && e.nome) entList.push(e);
          } catch (err) {}
        }
      }

      let md = `# 🏛️ Backup de Contas & Entidades — Figoo\n_Exportado em: ${dNow}_\n\nTotal de contas: ${entList.length}\n\n`;
      md += `| Nome da Conta | Município | Situação | Notas |\n`;
      md += `| --- | --- | --- | --- |\n`;

      entList.forEach(e => {
        const clean = (s) => (s || '').replace(/\|/g, '-').replace(/\n/g, ' ');
        md += `| ${clean(e.nome)} | ${clean(e.municipio)} | ${clean(e.situacao || 'Ativo')} | ${clean(e.notas)} |\n`;
      });

      files['4_contas.md'] = md;
    } catch (e) {
      console.warn('[export md contas error]', e);
    }

    // 5. Pagamentos (5_pagamentos.md)
    try {
      const rawPag = await fbGet(`pagamentos/${emailKey}`, 15000);
      let md = `# 💰 Backup de Lançamentos Financeiros — Figoo\n_Exportado em: ${dNow}_\n\n`;

      if (rawPag && typeof rawPag === 'object') {
        for (const mes in rawPag) {
          if (mes.indexOf('__') === 0) continue;
          try {
            const monthObj = await decData(rawPag[mes]);
            const itens = Array.isArray(monthObj) ? monthObj : (monthObj && monthObj.itens ? monthObj.itens : []);
            if (itens.length) {
              md += `## Mês / Competência: ${mes}\n\n`;
              md += `| Descrição | Tipo | Valor (R$) | Status |\n`;
              md += `| --- | --- | --- | --- |\n`;
              itens.forEach(item => {
                const tipoStr = item.tipo === 'desconto' ? 'Despesa' : 'Provento';
                const pagoStr = item.pago ? '✅ Pago' : '⏳ Pendente';
                md += `| ${item.desc || ''} | ${tipoStr} | R$ ${(item.valor || 0).toFixed(2)} | ${pagoStr} |\n`;
              });
              md += `\n---\n\n`;
            }
          } catch (err) {}
        }
      }

      files['5_pagamentos.md'] = md;
    } catch (e) {
      console.warn('[export md pagamentos error]', e);
    }

    // Tenta empacotar em ZIP via JSZip se disponível
    try {
      if (typeof JSZip === 'undefined') {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload = resolve;
          s.onerror = () => resolve();
          document.head.appendChild(s);
        });
      }

      if (typeof JSZip !== 'undefined') {
        const zip = new JSZip();
        for (const fileName in files) {
          zip.file(fileName, files[fileName]);
        }
        const content = await zip.generateAsync({ type: 'blob' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(content);
        a.download = `figoo_backup_markdown_${emailKey}_${dIso}.zip`;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 200);
        return;
      }
    } catch (e) {
      console.warn('[jszip error, fallback to individual downloads]', e);
    }

    // Fallback: faz o download de cada arquivo .md individualmente
    for (const fileName in files) {
      _figDownloadFile(fileName, files[fileName], 'text/markdown;charset=utf-8');
    }

  } catch (err) {
    alert('Erro ao exportar arquivos Markdown: ' + (err.message || 'tente novamente.'));
  } finally {
    if (btn) btn.innerHTML = `<span class="tbtn-ico">${FIG_ICON.note || '📝'}</span><span class="tbtn-label">Exportar Markdown (.md)</span>`;
  }
}
if (typeof window !== 'undefined') window.exportFigooToMarkdown = exportFigooToMarkdown;

/** Actualiza o sub-texto com o e-mail na topbar. */
function setTopbarEmail(email) {
  const el = document.getElementById('topbar-email-sub');
  if (el) el.textContent = email;
}

/** Define o estado do badge de salvamento ('online' | 'local' | 'saving' | ''). */
function setCloudBadge(state) {
  const el = document.getElementById('cloud-badge');
  if (!el) return;
  const icons = { online: FIG_ICON.saved, local: FIG_ICON.unsaved, saving: FIG_ICON.saving };
  const titles = { online: 'Salvo na nuvem', local: 'Alterações não sincronizadas com a nuvem', saving: 'Salvando…' };
  el.title = titles[state] || 'Salvo na nuvem';
  el.className = 'status-badge' + (state ? ' ' + state : ' online');
  el.innerHTML = icons[state] || FIG_ICON.saved;
}

/**
 * Renderiza o footer padrão no final do body.
 * @param {string} module  — nome do módulo
 * @param {string} version — versão
 */
function renderFooter(module, version) {
  const existing = document.getElementById('_figoo_footer');
  if (existing) existing.remove();
  const footer = document.createElement('footer');
  footer.id = '_figoo_footer';
  footer.className = 'figoo-footer';
  const parts = ['figoo'];
  if (module) parts.push(module);
  if (version) parts.push(version);
  footer.textContent = parts.join(' · ');
  document.body.appendChild(footer);
}

/**
 * Logout: limpa sessão, remove email do localStorage e vai para index.html.
 * @param {string} ek — emailKey
 */
function doLogout(ek) {
  if (ek) authClearSession(ek);
  localStorage.removeItem('figoo_email');
  window.location.href = 'index.html';
}

// ─── Setup helpers partilhados ──────────────────────────────
// HTML do modal de recuperação de senha (injectado dinamicamente na view setup)

/**
 * Mostra o ecrã de recuperação de senha na view setup.
 * Usa authSendRecovery() de figoo-auth.js.
 * @param {string} email — email pré-preenchido
 * @param {string} ek
 */
function showForgotPasswordUI(email, ek) {
  // Cria overlay
  const existing = document.getElementById('_figoo_forgot_modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '_figoo_forgot_modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:8000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';
  overlay.innerHTML = `
    <div style="background:var(--white);border-radius:14px;padding:28px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);border:.5px solid var(--border)">
      <h3 style="font-size:1rem;font-weight:600;color:var(--text);margin-bottom:5px">Recuperar senha</h3>
      <p style="font-size:.79rem;color:var(--text2);line-height:1.65;margin-bottom:18px">Informe o seu e-mail para receber um link de redefinição de senha.</p>
      <div style="margin-bottom:12px">
        <label style="font-size:.7rem;font-weight:500;color:var(--text2);display:block;margin-bottom:4px">E-mail</label>
        <input id="_fg_email" type="email" value="${email || ''}" placeholder="seu@email.com"
          style="width:100%;border:.5px solid var(--border);border-radius:8px;padding:11px 13px;font-size:.9rem;font-family:inherit;outline:none;color:var(--text);background:var(--white);box-sizing:border-box"
          onkeydown="if(event.key==='Enter')_fgSend()" />
      </div>
      <div id="_fg_msg" style="font-size:.75rem;min-height:18px;margin-bottom:10px;color:var(--secondary)"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="this.closest('#_figoo_forgot_modal').remove()"
          style="padding:9px 16px;border:.5px solid var(--border);border-radius:8px;background:none;color:var(--text2);font-size:.84rem;font-weight:500;cursor:pointer;font-family:inherit">
          Cancelar
        </button>
        <button id="_fg_btn" onclick="_fgSend()"
          style="padding:9px 20px;border:none;border-radius:8px;background:var(--primary);color:#fff;font-size:.84rem;font-weight:500;cursor:pointer;font-family:inherit">
          Enviar link
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => { const el = document.getElementById('_fg_email'); if (el) el.focus(); }, 80);
}

async function _fgSend() {
  const emailEl = document.getElementById('_fg_email');
  const msgEl   = document.getElementById('_fg_msg');
  const btn     = document.getElementById('_fg_btn');
  const e = emailEl ? emailEl.value.trim() : '';
  if (!e || !e.includes('@')) { if (msgEl) { msgEl.style.color = '#C05050'; msgEl.textContent = 'Informe um e-mail válido.'; } return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }
  try {
    const ek = emailToKey(e);
    await authSendRecovery(e, ek);
    if (msgEl) { msgEl.style.color = '#2D5016'; msgEl.textContent = '✓ Link enviado! Verifique o seu e-mail.'; }
    if (btn) btn.textContent = 'Enviado';
  } catch (err) {
    const m = err.message || '';
    if (m.startsWith('__NO_EMAILJS__:')) {
      // EmailJS não configurado — mostra link para debug
      const link = m.replace('__NO_EMAILJS__:', '');
      if (msgEl) {
        msgEl.style.color = '#8B6914';
        msgEl.innerHTML = '⚠ EmailJS não configurado.<br><a href="' + link + '" style="color:#1D4ED8;word-break:break-all;font-size:.72rem">' + link + '</a>';
      }
    } else {
      if (msgEl) { msgEl.style.color = '#C05050'; msgEl.textContent = 'Erro: ' + m; }
    }
    if (btn) { btn.disabled = false; btn.textContent = 'Enviar link'; }
  }
}

/**
 * Verifica se o URL tem ?recover=TOKEN&e=EMAIL.
 * Se sim, mostra UI de redefinição de senha.
 * @param {function} onNewPassword(ek, newPw) — callback chamado após validação do token
 */
async function checkRecoveryUrl(onNewPassword) {
  const p = new URLSearchParams(window.location.search);
  const token = p.get('recover');
  const email = p.get('e');
  if (!token || !email) return false;

  const ek = emailToKey(email);
  const valid = await authVerifyRecovery(ek, token);

  // Remove parâmetros do URL sem recarregar
  const clean = window.location.pathname + (p.get('e') ? `?e=${encodeURIComponent(email)}` : '');
  history.replaceState({}, '', clean);

  if (!valid) {
    alert('Link de recuperação inválido ou expirado. Solicite um novo.');
    return false;
  }

  // Mostra UI de nova senha
  _showNewPasswordUI(email, ek, token, onNewPassword);
  return true;
}

function _showNewPasswordUI(email, ek, token, onNewPassword) {
  const existing = document.getElementById('_figoo_newpw_modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '_figoo_newpw_modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:8000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';
  overlay.innerHTML = `
    <div style="background:var(--white);border-radius:14px;padding:28px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);border:.5px solid var(--border)">
      <h3 style="font-size:1rem;font-weight:600;color:var(--text);margin-bottom:5px">Nova senha</h3>
      <p style="font-size:.79rem;color:var(--text2);line-height:1.65;margin-bottom:18px">Crie uma nova senha para <strong>${email}</strong>.</p>
      <div style="margin-bottom:10px">
        <label style="font-size:.7rem;font-weight:500;color:var(--text2);display:block;margin-bottom:4px">Nova senha</label>
        <input id="_npw_pw1" type="password" placeholder="Mínimo 4 caracteres" autocomplete="new-password"
          style="width:100%;border:.5px solid var(--border);border-radius:8px;padding:11px 13px;font-size:.9rem;font-family:inherit;outline:none;color:var(--text);background:var(--white);box-sizing:border-box"
          onkeydown="if(event.key==='Enter')document.getElementById('_npw_pw2').focus()" />
      </div>
      <div style="margin-bottom:12px">
        <label style="font-size:.7rem;font-weight:500;color:var(--text2);display:block;margin-bottom:4px">Confirmar senha</label>
        <input id="_npw_pw2" type="password" placeholder="Repita a senha" autocomplete="new-password"
          style="width:100%;border:.5px solid var(--border);border-radius:8px;padding:11px 13px;font-size:.9rem;font-family:inherit;outline:none;color:var(--text);background:var(--white);box-sizing:border-box"
          onkeydown="if(event.key==='Enter')_npwSave()" />
      </div>
      <div id="_npw_msg" style="font-size:.75rem;min-height:18px;margin-bottom:10px;color:#C05050"></div>
      <button id="_npw_btn" onclick="_npwSave()" style="width:100%;padding:12px;border:none;border-radius:8px;background:var(--primary);color:#fff;font-size:.9rem;font-weight:500;cursor:pointer;font-family:inherit">
        Salvar nova senha
      </button>
    </div>`;
  document.body.appendChild(overlay);

  window._npw_email = email;
  window._npw_ek = ek;
  window._npw_token = token;
  window._npw_cb = onNewPassword;

  setTimeout(() => { const el = document.getElementById('_npw_pw1'); if (el) el.focus(); }, 80);
}

async function _npwSave() {
  const pw1 = (document.getElementById('_npw_pw1') || {}).value || '';
  const pw2 = (document.getElementById('_npw_pw2') || {}).value || '';
  const msg = document.getElementById('_npw_msg');
  const btn = document.getElementById('_npw_btn');
  if (!pw1) { if (msg) msg.textContent = 'Informe a nova senha.'; return; }
  if (pw1.length < 4) { if (msg) msg.textContent = 'Mínimo 4 caracteres.'; return; }
  if (pw1 !== pw2) { if (msg) msg.textContent = 'As senhas não coincidem.'; return; }
  if (btn) { btn.disabled = true; btn.textContent = 'Salvando…'; }
  try {
    const v = await _encryptStr('figoo-auth-ok', pw1);
    authSaveVerifier(window._npw_ek, v);
    authSetSession(window._npw_ek);
    await authClearRecovery(window._npw_ek);
    const overlay = document.getElementById('_figoo_newpw_modal');
    if (overlay) overlay.remove();
    if (window._npw_cb) window._npw_cb(window._npw_ek, pw1);
  } catch (e) {
    if (msg) msg.textContent = 'Erro: ' + e.message;
    if (btn) { btn.disabled = false; btn.textContent = 'Salvar nova senha'; }
  }
}


// ─── Barra de navegação inferior (mobile) ────────────────────
// Injeta <nav class="fgnav"> em toda página que carrega figoo-ui.js.
// Visível apenas em @media(max-width:680px). Propaga ?e=<email> do URL atual.
(function _figooBottomNav() {
  const _NAV_ICONS = {
    inicio:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>',
    pendencias: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="17" rx="2.5"/><path d="M9 4.5V3h6v1.5"/><path d="M8.5 10h7M8.5 14h7M8.5 18h4"/></svg>',
    mensal:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v9M14.6 9.2c-.5-.9-1.5-1.4-2.6-1.4-1.5 0-2.7.9-2.7 2.1 0 2.9 5.4 1.4 5.4 4.2 0 1.2-1.2 2.1-2.7 2.1-1.1 0-2.1-.5-2.6-1.4"/></svg>'
  };

  function _navEmailQ() {
    try {
      const e = new URLSearchParams(window.location.search).get('e');
      return e ? ('?e=' + encodeURIComponent(e)) : '';
    } catch (err) { return ''; }
  }

  function _navActiveId() {
    try {
      const m = (typeof _getModuleId === 'function') ? _getModuleId() : '';
      if (m) return m;
      const p = window.location.pathname.toLowerCase();
      if (p === '' || p.endsWith('/') || p.includes('index')) return 'inicio';
    } catch (e) {}
    return 'inicio';
  }

  function _injectNav() {
    if (document.getElementById('figoo-bottom-nav') || !document.body) return;
    const q = _navEmailQ();
    const items = [
      { id: 'inicio',     label: 'Início',     href: 'index.html' + q },
      { id: 'pendencias', label: 'Pendências', href: 'pendencias.html' + q },
      { id: 'mensal',     label: 'Mensal',     href: 'pagamentos.html' + q }
    ];
    const act = _navActiveId();
    const nav = document.createElement('nav');
    nav.id = 'figoo-bottom-nav';
    nav.className = 'fgnav';
    nav.setAttribute('aria-label', 'Navegação principal');
    nav.innerHTML = items.map(t =>
      `<a class="fgnav-item${t.id === act ? ' active' : ''}" href="${t.href}" title="${t.label}">${_NAV_ICONS[t.id]}<span>${t.label}</span></a>`
    ).join('');
    document.body.appendChild(nav);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectNav);
  else _injectNav();
})();
