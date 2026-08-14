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
    .topbar{background:var(--white,#FFFFFF);border-bottom:1.5px solid color-mix(in srgb, var(--secondary,#5EAD24) 45%, var(--border,#E8EAED));padding-top:env(safe-area-inset-top);height:calc(52px + env(safe-area-inset-top));display:flex;justify-content:center;flex-shrink:0;position:sticky;top:0;z-index:9990;box-sizing:border-box;box-shadow:0 2px 10px rgba(0,0,0,0.04)}
    .topbar-dropdown{position:relative;display:inline-block}
    .topbar-dropdown-btn{cursor:pointer;background:none;border:none;font-family:inherit}
    .topbar-dropdown-menu{position:absolute;top:calc(100% + 6px);right:0;background:var(--white,#fff);border:1px solid var(--border,#E8EAED);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.15);display:none;flex-direction:column;min-width:170px;z-index:9999;padding:6px}
    .topbar-dropdown-menu.open{display:flex}
    .topbar-dropdown-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--text,#1B1F1D);text-decoration:none;font-size:0.84rem;font-weight:500;transition:background 0.15s}
    .topbar-dropdown-item:hover{background:var(--bg,#F6F7F9);color:var(--primary,#2D5016)}
    .topbar-dropdown-item.active{background:color-mix(in srgb, var(--secondary,#5EAD24) 15%, var(--white,#fff));color:var(--primary,#2D5016);font-weight:600}
    .topbar-inner{width:100%;max-width:1200px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 24px;box-sizing:border-box;margin:0 auto;position:relative}
    @media (min-width: 1400px) { .topbar-inner { max-width: 1440px; } }
    @media (min-width: 1600px) { .topbar-inner { max-width: 1600px; } }
    .topbar-left{display:flex;align-items:center;gap:8px;min-width:0;flex-shrink:0}
    .logo-link{display:flex;align-items:center;gap:6px;text-decoration:none;color:var(--text,#1B1F1D);font-weight:700;font-size:.9rem;flex-shrink:0}
    .divider-v{width:1px;height:18px;background:var(--border,#E8EAED);flex-shrink:0}
    .page-badge{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.82rem;color:#fff;flex-shrink:0}
    .page-badge svg{width:15px;height:15px;display:block}
    .page-meta{display:flex;flex-direction:column;gap:1px;min-width:0}
    .page-title{font-size:.86rem;font-weight:700;color:var(--text,#1B1F1D);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .page-sub{font-size:.75rem;color:var(--text2,#4A544E);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
    
    .topbar-right{display:flex;align-items:center;gap:6px;margin-left:auto;flex-shrink:0}
    .status-badge{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;flex-shrink:0;color:var(--text2,#4A544E)}
    .status-badge svg{width:17px;height:17px;display:block}
    .status-badge.online{color:var(--secondary,#5EAD24)}
    .status-badge.saving{color:var(--text2,#4A544E)}
    .status-badge.local{color:#B7791F}
    .status-badge.saving svg{animation:fig-spin 1s linear infinite}
    @keyframes fig-spin{to{transform:rotate(360deg)}}
    @media(prefers-reduced-motion:reduce){.status-badge.saving svg{animation:none}}
    .tbtn{background:rgba(127,127,127,.08);border:.5px solid var(--border,#E8EAED);color:var(--text,#1B1F1D);padding:5px 10px;border-radius:8px;font-size:.75rem;font-weight:500;cursor:pointer;font-family:inherit;transition:background .15s;white-space:nowrap;display:inline-flex;align-items:center;gap:5px;text-decoration:none}
    .tbtn:hover{background:rgba(127,127,127,.16)}
    .tbtn:focus-visible,.fgt-btn:focus-visible{outline:2px solid var(--secondary,#5EAD24);outline-offset:2px}
    .tbtn.accent{border-color:var(--secondary,#5EAD24);color:var(--secondary,#5EAD24)}
    .tbtn.success{background:var(--secondary,#5EAD24);color:#fff;border-color:transparent}
    .tbtn-ico{display:inline-flex!important;align-items:center!important;justify-content:center!important;width:15px!important;height:15px!important;max-width:16px!important;max-height:16px!important;flex-shrink:0!important;line-height:1!important}
    .tbtn-ico svg{width:15px!important;height:15px!important;max-width:15px!important;max-height:15px!important;display:block!important}
    .figoo-footer{background:var(--bg,#F6F7F9);text-align:center;font-size:.75rem;color:var(--text2,#4A544E);padding:14px 18px;border-top:.5px solid var(--border,#E8EAED);margin-top:auto;flex-shrink:0}

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

    /* ── Drawer / Menu Lateral Deslizante ── */
    .fg-drawer-backdrop{position:fixed;inset:0;z-index:9990;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);opacity:0;pointer-events:none;transition:opacity .25s ease}
    .fg-drawer-backdrop.open{opacity:1;pointer-events:auto}

    .fg-drawer-panel{position:absolute;top:0;left:0;bottom:0;width:290px;max-width:85vw;background:var(--white,#FFFFFF);box-shadow:4px 0 24px rgba(0,0,0,0.18);transform:translateX(-100%);transition:transform .25s cubic-bezier(0.16,1,0.3,1);display:flex;flex-direction:column;z-index:9991;padding:16px;gap:12px;box-sizing:border-box}
    .fg-drawer-backdrop.open .fg-drawer-panel{transform:translateX(0)}

    .fg-drawer-header{display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border,#E8EAED);padding-bottom:10px}
    .fg-drawer-user{font-size:.75rem;color:var(--text2,#67716B);background:var(--bg,#F6F7F9);padding:8px 12px;border-radius:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}

    .fg-drawer-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:4px;padding-right:2px}
    .fg-drawer-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;font-size:.84rem;font-weight:600;color:var(--text,#1B1F1D);text-decoration:none;transition:background .15s,color .15s;border:.5px solid transparent;text-align:left}
    .fg-drawer-item:hover{background:rgba(127,127,127,0.08)}
    .fg-drawer-item.active{background:var(--primary,#2D5016);color:#FFFFFF;font-weight:700;border-color:var(--primary,#2D5016);box-shadow:0 2px 8px rgba(45,80,22,0.22)}
    .fg-drawer-item .tbtn-ico{width:18px!important;height:18px!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-shrink:0!important}
    .fg-drawer-item .tbtn-ico svg{width:18px!important;height:18px!important;display:block!important}
    .fg-drawer-act-tag{margin-left:auto;font-size:.68rem;font-weight:700;background:rgba(255,255,255,0.25);padding:2px 6px;border-radius:99px}

    .fg-drawer-footer{border-top:1px solid var(--border,#E8EAED);padding-top:10px}

    /* ── Estilos da barra de módulos no topo (Pílulas Compactas / Expand no Hover) ── */
    .topbar-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      padding: 0 8px;
      margin: 0 auto;
      flex: 1;
      min-width: 0;
    }
    .topbar-center::-webkit-scrollbar { display: none; }

    .tnav-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 5px 9px;
      border-radius: 20px;
      font-size: 0.74rem;
      font-weight: 500;
      color: var(--text2, #4A544E);
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid var(--border, #E8EAED);
      background: var(--bg, #F8FAFC);
      flex-shrink: 0;
      position: relative;
      cursor: pointer;
    }
    
    .tnav-pill .tbtn-ico {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.92rem;
    }

    .tnav-pill .tnav-txt {
      max-width: 0;
      opacity: 0;
      overflow: hidden;
      white-space: nowrap;
      transition: max-width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, margin 0.2s ease;
      margin-left: 0;
      font-weight: 600;
    }

    /* No hover ou quando a pílula é a página ativa, expande o texto do módulo! */
    .tnav-pill:hover .tnav-txt,
    .tnav-pill.active .tnav-txt {
      max-width: 120px;
      opacity: 1;
      margin-left: 5px;
    }

    .tnav-pill:hover {
      background: color-mix(in srgb, var(--primary, #2D5016) 12%, var(--white, #FFF));
      color: var(--primary, #2D5016);
      border-color: var(--primary, #2D5016);
      box-shadow: 0 2px 6px rgba(0,0,0,0.06);
    }

    .tnav-pill.active {
      background: var(--primary, #2D5016);
      color: #FFFFFF;
      font-weight: 600;
      border-color: var(--primary, #2D5016);
      box-shadow: 0 2px 8px rgba(45,80,22,0.22);
      padding: 5px 12px;
    }

    /* Badge Elegante do Usuário Logado no Cabeçalho */
    .topbar-user-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px 3px 5px;
      background: color-mix(in srgb, var(--primary, #2D5016) 10%, var(--white, #FFF));
      border: 1px solid color-mix(in srgb, var(--primary, #2D5016) 28%, transparent);
      border-radius: 20px;
      font-size: 0.74rem;
      font-weight: 600;
      color: var(--text, #1B1F1D);
      white-space: nowrap;
      transition: all 0.15s;
      margin-right: 4px;
    }
    .topbar-user-avatar {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--primary, #2D5016);
      color: #FFFFFF;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 0.68rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .topbar-user-email {
      max-width: 170px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* ── Adaptabilidade Responsiva Avançada ── */
    @media (min-width: 900px) {
      .topbar-center { display: flex !important; }
      #btn-topbar-drawer { display: none !important; }
      #topbar-email-sub { display: none !important; }
    }
    @media (max-width: 899px) {
      .topbar-center { display: none !important; }
      #btn-topbar-drawer { display: inline-flex !important; }
      #topbar-email-sub { display: block; }
    }

    @media(max-width:680px){
      html, body { max-width:100vw; overflow-x:hidden; }
      input,select,textarea{font-size:16px!important}
      .tbtn,#topbar .tbtn,.topbar-right .fgt-btn{min-height:40px;padding:6px 12px;touch-action:manipulation}
    }
    @media(max-width:600px){
      .topbar-inner{padding:0 12px;gap:6px}
      .logo-link{font-size:0.92rem!important;gap:4px!important;font-weight:700!important}
      .divider-v,.page-badge,.status-badge{display:none!important}
      .page-sub,.tbtn-label{display:none!important}
      .topbar-right{gap:4px}
      .topbar-user-pill{display:none!important}
      .tbtn,.topbar-right .fgt-btn{padding:5px 9px;font-size:0.78rem;min-height:38px}
    }`;
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
  mapPin:  _ic('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'),
  saved:  _ic('<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>'),
  saving: _ic('<path d="M21 12a9 9 0 1 1-6.219-8.56"/>'),
  unsaved:_ic('<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>'),
  merge:  _ic('<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>'),
  weekly: _ic('<path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><path d="m9 16 2 2 4-4"/>'),
  refresh:_ic('<path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>'),
  sparkles:_ic('<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/><path d="M5 3 4.2 5.5A1 1 0 0 1 3.5 6.2L1 7l2.5.8a1 1 0 0 1 .7.7L5 11l.8-2.5a1 1 0 0 1 .7-.7L9 7l-2.5-.8a1 1 0 0 1-.7-.7Z"/>'),
  menu:   _ic('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>'),
  acoesProgramadas: _ic('<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="3.5"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/><path d="M2 21v-2a4 4 0 0 1 3-3.87"/><path d="M4 3.13a4 4 0 0 1 0 7.75"/>')
};
if (typeof window !== 'undefined') window.FIG_ICON = FIG_ICON;

// ─── Navegação entre ferramentas ────────────────────────────

/** Detecta o id do módulo actual a partir do URL. */
function _getModuleId() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('admin')) return 'admin';
  if (path.includes('acoes-programadas') || path.includes('acoes_programadas')) return 'acoes programadas';
  if (path.includes('calendario') || path.includes('calendar')) return 'calendario';
  if (path.includes('weekly')) return 'weekly';
  if (path.includes('equipe')) return 'equipe';
  if (path.includes('pagamentos')) return 'mensal';
  if (path.includes('pendencia')) return 'pendencias';
  if (path.includes('reunio') || path.includes('reuniao')) return 'reunioes';
  if (path.includes('municip')) return 'municipios';
  if (path.includes('conta')) return 'contas';
  if (path.includes('cliente')) return 'clientes';
  if (path.includes('auditoria-ia')) return 'auditoria ia';
  return '';
}

/**
 * Gera HTML com botões de navegação para as outras ferramentas.
 * @param {string} currentId — id do módulo actual (não aparece na lista)
 * @param {string} email     — e-mail para passar como ?e=
 */
function _getToolsList(currentId, email) {
  const enc = encodeURIComponent(email || '');
  const tools = [
    { id: 'pendencias',        icon: FIG_ICON.list,             label: 'Pendências',         href: `pendencias.html?e=${enc}` },
    { id: 'acoes programadas', icon: FIG_ICON.acoesProgramadas, label: 'Ações Programadas',  href: `acoes-programadas.html?e=${enc}` },
    { id: 'clientes',          icon: FIG_ICON.users,            label: 'Clientes',           href: `clientes.html?e=${enc}` },
    { id: 'municipios',        icon: FIG_ICON.mapPin,           label: 'Municípios',         href: `municipios.html?e=${enc}` },
    { id: 'contas',            icon: FIG_ICON.building,         label: 'Contas',             href: `contas.html?e=${enc}` },
    { id: 'reunioes',          icon: FIG_ICON.calendar,         label: 'Reuniões',           href: `reunioes.html?e=${enc}` },
    { id: 'calendario',        icon: FIG_ICON.calendar,         label: 'Calendário',         href: `calendario.html?e=${enc}` },
    { id: 'equipe',            icon: FIG_ICON.users,            label: 'Equipe',             href: `equipe.html?e=${enc}` },
    { id: 'weekly',            icon: FIG_ICON.weekly,           label: 'Weekly',             href: `weekly.html?e=${enc}` },
    { id: 'unificacoes',       icon: FIG_ICON.merge,            label: 'Unificações',        href: `unificacoes.html?e=${enc}` },
    { id: 'mensal',            icon: FIG_ICON.wallet,           label: 'Mensal',             href: `pagamentos.html?e=${enc}` },
    { id: 'auditoria ia',      icon: FIG_ICON.sparkles,         label: 'IA',                 href: `auditoria-ia.html?e=${enc}` }
  ];
  const emLower = (email || '').toLowerCase();
  if (emLower.includes('emanuel.alexandre') || emLower.includes('emanuel_alexandre') || emLower.includes('emanuel.melo87') || emLower.includes('emanuel_melo87') || currentId === 'admin') {
    tools.push({ id: 'admin', icon: FIG_ICON.gear, label: 'Admin', href: `admin.html?e=${enc}` });
  }
  return tools;
}

function toggleTopbarMoreMenu(e) {
  if (e) e.stopPropagation();
  const m = document.getElementById('topbar-more-menu');
  if (m) m.classList.toggle('open');
}
window.toggleTopbarMoreMenu = toggleTopbarMoreMenu;

document.addEventListener('click', function(e) {
  const m = document.getElementById('topbar-more-menu');
  if (m && !m.contains(e.target) && !e.target.closest('#topbar-more-dropdown')) {
    m.classList.remove('open');
  }
});

function _buildToolsNav(currentId, email) {
  const allTools = _getToolsList(currentId, email);
  const secondaryIds = new Set(['admin', 'mensal', 'calendario', 'weekly', 'equipe', 'unificacoes']);
  
  const primaryTools = [];
  const secondaryTools = [];
  
  allTools.forEach(t => {
    if (secondaryIds.has(t.id)) {
      secondaryTools.push(t);
    } else {
      primaryTools.push(t);
    }
  });

  const isSecondaryActive = secondaryTools.some(t => t.id === currentId);
  const activeSecondary = secondaryTools.find(t => t.id === currentId);

  const primaryHtml = primaryTools.map(t => {
    const isAct = t.id === currentId;
    return `<a href="${t.href}" class="tnav-pill ${isAct ? 'active' : ''}" title="${t.label}"><span class="tbtn-ico">${t.icon}</span><span class="tnav-txt">${t.label}</span></a>`;
  }).join('');

  if (secondaryTools.length === 0) return primaryHtml;

  const secondaryDropdownHtml = `
    <div class="topbar-dropdown" id="topbar-more-dropdown">
      <button type="button" class="tnav-pill topbar-dropdown-btn ${isSecondaryActive ? 'active' : ''}" onclick="toggleTopbarMoreMenu(event)" title="Mais ferramentas">
        <span class="tbtn-ico">${isSecondaryActive ? activeSecondary.icon : FIG_ICON.menu}</span>
        <span class="tnav-txt">${isSecondaryActive ? activeSecondary.label : 'Mais'}</span>
        <span style="font-size:0.65rem;margin-left:2px">▾</span>
      </button>
      <div class="topbar-dropdown-menu" id="topbar-more-menu">
        ${secondaryTools.map(t => {
          const isAct = t.id === currentId;
          return `<a href="${t.href}" class="topbar-dropdown-item ${isAct ? 'active' : ''}">
            <span class="tbtn-ico">${t.icon}</span>
            <span>${t.label}</span>
          </a>`;
        }).join('')}
      </div>
    </div>
  `;

  return primaryHtml + secondaryDropdownHtml;
}

function _buildDrawerToolsNav(currentId, email) {
  return _getToolsList(currentId, email)
    .map(t => {
      const isAct = t.id === currentId;
      return `<a href="${t.href}" class="fg-drawer-item ${isAct ? 'active' : ''}">
        <span class="tbtn-ico">${t.icon}</span>
        <span>${t.label}</span>
        ${isAct ? '<span class="fg-drawer-act-tag">✓ Aberto</span>' : ''}
      </a>`;
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
    onPassword,
    onRefresh
  } = config;

  const tb = document.getElementById('topbar');
  if (!tb) return;

  const moduleId  = _getModuleId();
  const toolsNav  = _buildToolsNav(moduleId, email);
  const userInitials = email ? email.slice(0, 2).toUpperCase() : '👤';
  const userPillHtml = email
    ? `<div class="topbar-user-pill" title="Conectado como ${email}">
        <span class="topbar-user-avatar">${userInitials}</span>
        <span class="topbar-user-email">${email.split('@')[0]}</span>
       </div>`
    : '';

  tb.innerHTML = `
    <div class="topbar-inner">
      <div class="topbar-left">
        <button class="tbtn" id="btn-topbar-drawer" onclick="toggleNavDrawer(true)" title="Menu de Módulos">
          <span class="tbtn-ico">${FIG_ICON.menu}</span>
          <span class="tbtn-label">Menu</span>
        </button>
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
        ${userPillHtml}
        <span class="status-badge online" id="cloud-badge" title="Salvo na nuvem">${FIG_ICON.saved}</span>
        <button class="tbtn" id="figoo-theme-btn" type="button" onclick="event.stopPropagation();if(window.openThemePicker) openThemePicker(this); else if(window.figooTheme && window.figooTheme.togglePop) window.figooTheme.togglePop(this);" title="Tema e cores">
          <span class="tbtn-ico">${(window.FIG_ICON && window.FIG_ICON.theme) || '🎨'}</span>
          <span class="tbtn-label">Tema</span>
        </button>
        <button class="tbtn" id="btn-topbar-refresh" onclick="_figoo_refreshBtn(this)" title="Atualizar dados (sem recarregar a página)">
          <span class="tbtn-ico" id="topbar-refresh-ico">${FIG_ICON.refresh}</span>
          <span class="tbtn-label">Atualizar</span>
        </button>
        ${extraButtons}
        ${onPassword
          ? `<button class="tbtn" id="btn-pw-mgmt" onclick="_figoo_pwBtn()" title="Gerenciar senha"><span class="tbtn-ico">${FIG_ICON.key}</span><span class="tbtn-label">Senha</span></button>`
          : ''}
        <button class="tbtn" onclick="_figoo_logoutBtn()" title="Sair"><span class="tbtn-ico">${FIG_ICON.logout}</span><span class="tbtn-label">Sair</span></button>
      </div>
    </div>`;

  if (window.figooTheme && typeof window.figooTheme.mount === 'function') {
    setTimeout(window.figooTheme.mount, 10);
  }

  let drEl = document.getElementById('fg-drawer-backdrop');
  if (!drEl) {
    drEl = document.createElement('div');
    drEl.id = 'fg-drawer-backdrop';
    drEl.className = 'fg-drawer-backdrop';
    drEl.onclick = function() { toggleNavDrawer(false); };
    document.body.appendChild(drEl);
  }
  drEl.innerHTML = `
    <div class="fg-drawer-panel" onclick="event.stopPropagation()">
      <div class="fg-drawer-header">
        <a href="index.html" class="logo-link" style="font-size:1.05rem" onclick="window.location.href='index.html'">
          ${_FIGOO_LOGO} figoo
        </a>
        <button class="tbtn" onclick="toggleNavDrawer(false)" style="padding:4px 9px;min-height:auto" title="Fechar Menu">✕</button>
      </div>
      <div class="fg-drawer-user">
        👤 ${email || 'Usuário figoo'}
      </div>
      <div class="fg-drawer-body">
        <div style="font-size:0.65rem;font-weight:700;color:var(--text2,#67716B);text-transform:uppercase;letter-spacing:0.5px;padding:4px 6px">Módulos do Sistema</div>
        ${_buildDrawerToolsNav(moduleId, email)}
      </div>
      <div class="fg-drawer-footer" style="display:flex;flex-direction:column;gap:8px">
        <button class="tbtn" onclick="if(window.figooTheme && window.figooTheme.mount){ window.figooTheme.mount(); } var b=document.getElementById('figoo-theme-btn'); if(b) b.click(); toggleNavDrawer(false);" style="width:100%;justify-content:center;padding:8px 12px;gap:6px">
          <span class="tbtn-ico" style="width:15px!important;height:15px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important">${(window.FIG_ICON && window.FIG_ICON.theme) || '🎨'}</span>
          <span>Tema e Cores</span>
        </button>
        <button class="tbtn" onclick="_figoo_refreshBtn(this);toggleNavDrawer(false);" style="width:100%;justify-content:center;padding:8px 12px;gap:6px"><span class="tbtn-ico" style="width:15px!important;height:15px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important">${FIG_ICON.refresh}</span><span>Atualizar Dados</span></button>
      </div>
    </div>`;

  window._figoo_logoutCb   = onLogout;
  window._figoo_passwordCb = onPassword;
  window._figoo_refreshCb  = onRefresh;
}

function toggleNavDrawer(show) {
  const dr = document.getElementById('fg-drawer-backdrop');
  if (!dr) return;
  if (typeof show === 'boolean') {
    dr.classList.toggle('open', show);
  } else {
    dr.classList.toggle('open');
  }
}
window.toggleNavDrawer = toggleNavDrawer;

function _figoo_logoutBtn()  { if (window._figoo_logoutCb)  window._figoo_logoutCb(); }
function _figoo_pwBtn()      { if (window._figoo_passwordCb) window._figoo_passwordCb(); }

async function _figoo_refreshBtn(btnEl) {
  const ico = document.getElementById('topbar-refresh-ico') || (btnEl ? btnEl.querySelector('.tbtn-ico') : null);
  if (ico) ico.classList.add('saving');

  try {
    if (typeof window._figoo_refreshCb === 'function') {
      await window._figoo_refreshCb();
    } else {
      // Auto-detecta função de recarregamento sem recarregar a página
      if (typeof window.reloadAll === 'function') await window.reloadAll();
      else if (typeof window.loadItems === 'function') await window.loadItems();
      else if (typeof window.loadClientes === 'function') await window.loadClientes();
      else if (typeof window.loadMeetings === 'function') await window.loadMeetings();
      else if (typeof window.loadAllDatabaseRecords === 'function') await window.loadAllDatabaseRecords();
      else if (typeof window.loadData === 'function') await window.loadData();
      else if (typeof window.loadAllWeeks === 'function') {
        await window.loadAllWeeks();
        if (typeof window.loadGlobalPendencias === 'function') await window.loadGlobalPendencias();
      }
      else if (typeof window.loadUsersData === 'function') await window.loadUsersData();
    }
    _figooToast('✓ Dados atualizados com sucesso!');
  } catch (e) {
    console.error('[figoo refresh error]', e);
    _figooToast('Não foi possível atualizar os dados');
  } finally {
    setTimeout(() => {
      if (ico) ico.classList.remove('saving');
    }, 600);
  }
}

function _figooToast(msg) {
  let t = document.getElementById('toast') || document.getElementById('undo-toast');
  if (t) {
    const orig = t.innerHTML;
    t.innerHTML = `<span>${msg}</span>`;
    t.classList.add('show');
    setTimeout(() => {
      t.classList.remove('show');
      setTimeout(() => { t.innerHTML = orig; }, 300);
    }, 2400);
    return;
  }
  // Toast flutuante temporário
  let tmp = document.getElementById('_figoo_tmp_toast');
  if (!tmp) {
    tmp = document.createElement('div');
    tmp.id = '_figoo_tmp_toast';
    tmp.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1B1F1D;color:#fff;padding:10px 20px;border-radius:10px;font-size:.82rem;font-weight:500;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.25);transition:opacity .25s;opacity:0';
    document.body.appendChild(tmp);
  }
  tmp.textContent = msg;
  tmp.style.opacity = '1';
  setTimeout(() => { tmp.style.opacity = '0'; }, 2400);
}

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
  function _injectNav() {
    if (document.getElementById('figoo-bottom-nav') || document.getElementById('fgnav-bar')) return;
    const email = localStorage.getItem('figoo_email') || '';
    const moduleId = (typeof _getModuleId === 'function') ? _getModuleId() : '';
    const fgNavEl = document.createElement('nav');
    fgNavEl.id = 'fgnav-bar';
    fgNavEl.className = 'fgnav';
    fgNavEl.setAttribute('aria-label', 'Navegação principal');
    fgNavEl.innerHTML = (typeof _buildMobileNav === 'function') ? _buildMobileNav(moduleId, email) : '';
    document.body.appendChild(fgNavEl);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _injectNav);
  else _injectNav();
})();

// ─── Injeção do Chat IA Flutuante ────────────────────────────────
(function _injectFigooChat() {
  function inject() {
    if(!document.getElementById('figoo-ai-script') && typeof figooAI === 'undefined') {
      const s1 = document.createElement('script');
      s1.id = 'figoo-ai-script';
      s1.src = 'figoo-ai.js?v=' + Date.now();
      document.head.appendChild(s1);
    }
    
    if(document.getElementById('figoo-chat-script')) return;
    const s2 = document.createElement('script');
    s2.id = 'figoo-chat-script';
    s2.src = 'figoo-chat.js?v=' + Date.now();
    document.body.appendChild(s2);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
