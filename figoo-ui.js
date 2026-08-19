// figoo-ui.js — Topbar e footer consistentes em todas as páginas
// Portal figoo · v2.1 · 2026-08-14
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
    .topbar{background:var(--bg,#F6F7F9);border-bottom:1.5px solid color-mix(in srgb, var(--secondary,#5EAD24) 45%, var(--border,#E8EAED));padding-top:env(safe-area-inset-top);height:calc(52px + env(safe-area-inset-top));display:flex;justify-content:center;flex-shrink:0;position:sticky;top:0;z-index:9990;box-sizing:border-box;box-shadow:0 2px 10px rgba(0,0,0,0.04)}
    .topbar-dropdown{position:relative;display:inline-block}
    .topbar-dropdown-btn{cursor:pointer;background:none;border:none;font-family:inherit}
    .topbar-dropdown-menu{position:absolute;top:calc(100% + 6px);right:0;background:var(--white,#fff);border:1px solid var(--border,#E8EAED);border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.15);display:none;flex-direction:column;min-width:170px;z-index:9999;padding:6px}
    .topbar-dropdown-menu.open{display:flex}
    .topbar-dropdown-item{display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;color:var(--text,#1B1F1D);text-decoration:none;font-size:0.84rem;font-weight:500;transition:background 0.15s}
    .topbar-dropdown-item:hover{background:var(--bg,#F6F7F9);color:var(--primary,#2D5016)}
    .topbar-dropdown-item.active{background:color-mix(in srgb, var(--secondary,#5EAD24) 15%, var(--white,#fff));color:var(--primary,#2D5016);font-weight:600}
    .topbar-inner{width:100%;max-width:1200px;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 24px;box-sizing:border-box;margin:0 auto;position:relative}
    /* ── Moldura Global de Alinhamento (Topbar + Conteúdo Principal) ── */
    .topbar-inner, .page-wrap, .main-body, .ia-layout, .container-main {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      box-sizing: border-box;
    }
    @media (min-width: 1400px) {
      .topbar-inner, .page-wrap, .main-body, .ia-layout, .container-main { max-width: 1440px; }
    }
    @media (min-width: 1600px) {
      .topbar-inner, .page-wrap, .main-body, .ia-layout, .container-main { max-width: 1600px; }
    }
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

    /* Modal global */
    .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(3px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px}
    .modal-overlay.hidden{display:none!important}
    .modal-card{background:var(--white,#fff);border-radius:14px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto;padding:20px;border:1px solid var(--border,#E8EAED);box-shadow:0 20px 60px rgba(0,0,0,0.2)}
    .modal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;border-bottom:1px solid var(--border,#E8EAED);padding-bottom:8px}
    .modal-head h3{margin:0;font-size:1.05rem;font-weight:700;color:var(--primary,#2D5016)}
    .modal-close{background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--text2,#4A544E)}

    /* ── Override "app moderno" da topbar ── */
    #topbar.topbar{background:var(--bg,#F6F7F9);border-bottom:1.5px solid color-mix(in srgb, var(--secondary,#5EAD24) 45%, var(--border,#E8EAED));color:var(--text,#1B1F1D)}
    #topbar .logo-link{color:var(--text,#1B1F1D)}
    #topbar .divider-v{background:var(--border,#E8EAED)}
    #topbar .page-title,#topbar .page-title-tb{color:var(--text,#1B1F1D)}
    #topbar .page-sub{color:var(--text2,#67716B)}
    #topbar .status-badge{color:var(--text2,#67716B)}
    #topbar .status-badge.online{color:var(--secondary,#5EAD24)}
    #topbar .status-badge.local{color:#B7791F}
    #topbar .tbtn{background:rgba(127,127,127,.08);border:.5px solid var(--border,#E8EAED);color:var(--text,#1B1F1D);border-radius:8px}
    #topbar .tbtn:hover{background:rgba(127,127,127,.16)}

    /* ── Slim Scrollbars ── */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(127,127,127,0.22); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(127,127,127,0.4); }

    /* ── Form Inputs Focus Glow ── */
    input:focus, select:focus, textarea:focus {
      outline: none!important;
      border-color: var(--secondary, #5EAD24)!important;
      box-shadow: 0 0 0 3px rgba(94, 173, 36, 0.14)!important;
    }

    /* ── Bento Grid Summary Chips ── */
    .summary-strip, .kpi-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 12px;
    }
    @media (max-width: 800px) {
      .summary-strip, .kpi-bar { grid-template-columns: repeat(2, 1fr); }
    }
    .sum-chip {
      background: var(--white, #fff);
      border: 1px solid var(--border, #E8EAED);
      border-radius: 12px;
      padding: 10px 14px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px rgba(0,0,0,0.02);
    }
    .sum-chip:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.06);
    }
    .sum-chip-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 6px;
    }
    .sum-lbl {
      font-size: 0.68rem;
      font-weight: 700;
      color: var(--text2, #4A544E);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .sum-icon-badge {
      width: 26px;
      height: 26px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    .sum-chip.abertas .sum-icon-badge { background: rgba(94, 173, 36, 0.15); color: #2D5016; }
    .sum-chip.atrasadas .sum-icon-badge { background: rgba(180, 41, 27, 0.15); color: #B4291B; }
    .sum-chip.hoje .sum-icon-badge { background: rgba(183, 121, 31, 0.15); color: #B7791F; }
    .sum-chip.urgentes .sum-icon-badge { background: rgba(108, 52, 131, 0.15); color: #6C3483; }
    .sum-chip.concluidas .sum-icon-badge { background: rgba(94, 173, 36, 0.12); color: #2D5016; }
    .sum-num {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--primary, #2D5016);
      line-height: 1.2;
      margin-top: 4px;
    }

    /* ── FAB Botão Flutuante ── */
    .figoo-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9000;
      background: var(--primary, #2D5016);
      color: #FFFFFF;
      border: none;
      border-radius: 99px;
      padding: 12px 20px;
      font-size: 0.86rem;
      font-weight: 600;
      font-family: inherit;
      cursor: pointer;
      box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .figoo-fab:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 8px 24px rgba(0,0,0,0.25);
      background: #234010;
    }

    /* ── Empty State Card ── */
    .figoo-empty-card {
      background: var(--white, #fff);
      border: 1px solid var(--border, #E8EAED);
      border-radius: 14px;
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 20px 0;
      box-shadow: 0 2px 8px rgba(0,0,0,0.02);
    }
    .figoo-empty-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: color-mix(in srgb, var(--primary, #2D5016) 8%, var(--white, #fff));
      color: var(--primary, #2D5016);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    .figoo-empty-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text, #1B1F1D);
      margin: 0;
    }
    .figoo-empty-sub {
      font-size: 0.8rem;
      color: var(--text2, #4A544E);
      max-width: 360px;
      margin: 0;
    }

    /* ── Padrão A: filtro multi-seleção em popover (createMultiSelectFilter) ── */
    .mun-chip { display:inline-flex; align-items:center; gap:4px; background:var(--white,#fff); border:.5px solid var(--border,#E8EAED); border-radius:99px; padding:3px 10px; font-size:var(--fs-xs,0.8rem); font-weight:600; color:var(--primary,#2D5016); box-shadow:0 1px 2px rgba(0,0,0,0.04); }
    .mun-chip button { background:none; border:none; color:var(--text2,#4A544E); cursor:pointer; font-size:0.8rem; padding:0 2px; line-height:1; }
    .mun-chip button:hover { color:var(--c-danger,#c0392b); }
    .mun-pop-list::-webkit-scrollbar { width:6px; }
    .mun-item:hover { background:var(--bg,#F5F6F4); border-radius:6px; }

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
      gap: 3px;
      padding: 3px 8px;
      margin: 0 auto;
      background: color-mix(in srgb, var(--border, #E8EAED) 40%, var(--bg, #F6F7F9));
      border: 1px solid var(--border, #E8EAED);
      border-radius: 999px;
      box-shadow: inset 0 1px 2px rgba(0,0,0,0.03);
      flex-shrink: 0;
    }
    .topbar-center::-webkit-scrollbar { display: none; }

    .tnav-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 5px 10px;
      border-radius: 20px;
      font-size: 0.74rem;
      font-weight: 500;
      color: var(--text2, #4A544E);
      text-decoration: none;
      white-space: nowrap;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid transparent;
      background: transparent;
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
      max-width: 130px;
      opacity: 1;
      margin-left: 5px;
    }

    .tnav-pill:hover {
      background: color-mix(in srgb, var(--primary, #2D5016) 12%, var(--white, #FFF));
      color: var(--primary, #2D5016);
      border-color: var(--border, #E8EAED);
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
    }
    /* ─── Autocomplete / Combobox Customizado ─── */
    .fg-ac-wrap { position: relative; width: 100%; display: flex; align-items: center; box-sizing: border-box; }
    .fg-ac-wrap input { padding-right: 28px !important; }
    .fg-ac-arrow { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 0.72rem; color: var(--text2, #67716B); pointer-events: none; opacity: 0.7; }
    .fg-ac-menu {
      position: absolute; top: calc(100% + 4px); left: 0;
      min-width: 100%; width: max-content; max-width: min(450px, 90vw);
      background: var(--white, #ffffff); border: 1px solid var(--border, #E8EAED);
      border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.18);
      max-height: 240px; overflow-y: auto; z-index: 10050; display: none;
      flex-direction: column; padding: 4px 0; box-sizing: border-box;
    }
    .fg-ac-menu.open { display: flex; }
    .fg-ac-item {
      padding: 9px 14px; font-size: 0.88rem; line-height: 1.4 !important; min-height: 36px;
      display: flex; align-items: center; color: var(--text, #1B1F1D); cursor: pointer;
      transition: background 0.12s, color 0.12s; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; text-align: left; box-sizing: border-box;
    }
    .fg-ac-item:hover, .fg-ac-item.active { background: color-mix(in srgb, var(--secondary, #5EAD24) 15%, var(--white, #ffffff)); color: var(--primary, #2D5016); font-weight: 600; }
    .fg-ac-item mark { background: color-mix(in srgb, var(--secondary, #5EAD24) 30%, transparent); color: inherit; font-weight: 700; border-radius: 2px; padding: 0 2px; }
    .fg-ac-empty { padding: 12px 14px; font-size: 0.84rem; color: var(--text2, #67716B); text-align: center; font-style: italic; line-height: 1.4; }
    .fg-ac-create-item {
      padding: 10px 14px; font-size: 0.86rem; color: var(--primary, #2D5016);
      background: color-mix(in srgb, var(--secondary, #5EAD24) 10%, var(--white, #ffffff));
      border-top: 1px dashed var(--border, #E8EAED); cursor: pointer; font-weight: 600;
      transition: background 0.12s; display: flex; align-items: center; gap: 6px; text-align: left;
    }
    .fg-ac-create-item:hover, .fg-ac-create-item.active {
      background: color-mix(in srgb, var(--secondary, #5EAD24) 22%, var(--white, #ffffff));
      color: var(--primary, #2D5016);
    }
  `;
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
  list:   _ic('<path d="m9 11 3 3 7-7"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'),
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
  acoesProgramadas: _ic('<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/><path d="m9 14 2 2 4-4"/>')
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
    { id: 'auditoria ia',      icon: FIG_ICON.sparkles,         label: 'Central de IA',       href: `auditoria-ia.html?e=${enc}` }
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
        <span class="tbtn-ico">${isSecondaryActive ? activeSecondary.icon : _ic('<circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/>')}</span>
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
  tb.classList.add('topbar');

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
        <button class="tbtn" id="btn-topbar-ai" type="button" onclick="openFigooChatDrawer()" title="Assistente IA (Painel Lateral)">
          <span class="tbtn-ico">✨</span>
          <span class="tbtn-label">IA</span>
        </button>
        <button class="tbtn" id="figoo-theme-btn" type="button" onclick="event.stopPropagation();if(window.openThemePicker) openThemePicker(this); else if(window.figooTheme && window.figooTheme.togglePop) window.figooTheme.togglePop(this);" title="Tema e cores">
          <span class="tbtn-ico">${(window.FIG_ICON && window.FIG_ICON.theme) || '🎨'}</span>
          <span class="tbtn-label">Tema</span>
        </button>
        <button class="tbtn" id="btn-topbar-refresh" onclick="_figoo_refreshBtn(this)" title="Atualizar dados (sem recarregar a página)">
          <span class="tbtn-ico" id="topbar-refresh-ico">${FIG_ICON.refresh}</span>
          <span class="tbtn-label">Atualizar</span>
        </button>
        ${extraButtons}
        ${(onPassword || email)
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
function _figoo_pwBtn() {
  if (typeof window._figoo_passwordCb === 'function') {
    window._figoo_passwordCb();
  } else if (typeof window.openPwModal === 'function') {
    window.openPwModal();
  } else {
    _ensureUniversalPwModal();
  }
}

async function _ensureUniversalPwModal() {
  let modal = document.getElementById('pw-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'pw-modal';
    modal.className = 'modal-overlay hidden';
    modal.innerHTML = `
      <div class="modal-card" style="max-width:440px">
        <div class="modal-head">
          <h3>🔑 Gerenciar Senha</h3>
          <button class="modal-close" onclick="document.getElementById('pw-modal').classList.add('hidden')">&times;</button>
        </div>
        <div class="modal-body" style="display:flex;flex-direction:column;gap:12px">
          <p id="pw-modal-error" style="color:var(--c-danger,#B4291B);font-size:0.8rem;min-height:18px;margin:0"></p>
          <div class="form-field">
            <label>Senha Atual</label>
            <input type="password" id="pm-change-old" placeholder="Sua senha atual" />
          </div>
          <div class="form-field">
            <label>Nova Senha</label>
            <input type="password" id="pm-change-new" placeholder="Mínimo 4 caracteres" />
          </div>
          <div class="form-field">
            <label>Confirmar Nova Senha</label>
            <input type="password" id="pm-change-new2" placeholder="Repita a nova senha" />
          </div>
          <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
            <button type="button" class="tbtn" onclick="document.getElementById('pw-modal').classList.add('hidden')">Cancelar</button>
            <button type="button" class="tbtn success" id="pw-modal-confirm-btn" onclick="_universalConfirmPwModal()">Salvar Nova Senha</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  document.getElementById('pm-change-old').value = '';
  document.getElementById('pm-change-new').value = '';
  document.getElementById('pm-change-new2').value = '';
  document.getElementById('pw-modal-error').textContent = '';
  modal.classList.remove('hidden');
}

async function _universalConfirmPwModal() {
  const err = document.getElementById('pw-modal-error');
  const btn = document.getElementById('pw-modal-confirm-btn');
  const old = document.getElementById('pm-change-old').value;
  const pw = document.getElementById('pm-change-new').value;
  const pw2 = document.getElementById('pm-change-new2').value;
  err.textContent = '';
  if (!old) { err.textContent = 'Informe a senha atual.'; return; }
  if (pw.length < 4) { err.textContent = 'Nova senha: mínimo 4 caracteres.'; return; }
  if (pw !== pw2) { err.textContent = 'As senhas não coincidem.'; return; }
  btn.disabled = true; btn.textContent = 'Alterando…';
  try {
    const p = new URLSearchParams(window.location.search);
    const eml = p.get('e') || localStorage.getItem('figoo_email') || '';
    const ek = emailToKey(eml);
    const verifier = await authGetVerifier(ek);
    if (!verifier) throw new Error('Nenhuma senha cadastrada.');
    await _decryptStr(verifier, old);
    const v = await _encryptStr('figoo-auth-ok', pw);
    authSaveVerifier(ek, v);
    await dataReencryptAll(ek, pw);
    authSetSession(ek);
    document.getElementById('pw-modal').classList.add('hidden');
    _figooToast('Senha alterada com sucesso! 🔒');
  } catch (e) {
    err.textContent = 'Erro: ' + (e.message || 'Senha atual incorreta.');
  } finally {
    btn.disabled = false; btn.textContent = 'Salvar Nova Senha';
  }
}
window._universalConfirmPwModal = _universalConfirmPwModal;

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

// ─── Injeção do Chat IA (Painel Lateral via Topbar) ──────────────
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

function openFigooChatDrawer() {
  if (typeof window.toggleFigooChat === 'function') {
    window.toggleFigooChat(true);
    return;
  }
  let s = document.getElementById('figoo-chat-script');
  if (!s) {
    s = document.createElement('script');
    s.id = 'figoo-chat-script';
    s.src = 'figoo-chat.js?v=' + Date.now();
    document.body.appendChild(s);
  }
  let tries = 0;
  let timer = setInterval(() => {
    tries++;
    if (typeof window.toggleFigooChat === 'function') {
      clearInterval(timer);
      window.toggleFigooChat(true);
    } else if (tries > 25) {
      clearInterval(timer);
      const enc = (typeof emailKey !== 'undefined') ? emailKey : '';
      window.location.href = `auditoria-ia.html?e=${enc}`;
    }
  }, 80);
}
window.openFigooChatDrawer = openFigooChatDrawer;

// ─── Componente Global Autocomplete / Combobox ────────────────────
function attachAutocomplete(input, getItems, opts = {}) {
  const inp = typeof input === 'string' ? document.querySelector(input) : input;
  if (!inp) return;
  if (inp._fgAcAttached) return;
  inp._fgAcAttached = true;
  inp.removeAttribute('list');

  let wrap = inp.parentElement;
  if (!wrap || !wrap.classList.contains('fg-ac-wrap')) {
    const parent = inp.parentNode;
    wrap = document.createElement('div');
    wrap.className = 'fg-ac-wrap';
    parent.insertBefore(wrap, inp);
    wrap.appendChild(inp);
  }

  if (!wrap.querySelector('.fg-ac-arrow')) {
    const arrow = document.createElement('span');
    arrow.className = 'fg-ac-arrow';
    arrow.innerHTML = '▼';
    wrap.appendChild(arrow);
  }

  let menu = wrap.querySelector('.fg-ac-menu');
  if (!menu) {
    menu = document.createElement('div');
    menu.className = 'fg-ac-menu';
    wrap.appendChild(menu);
  }

  let selectedIndex = -1;

  // Itens podem ser string (comportamento original) ou {id,label} (permite
  // gravar um id/FK real ao selecionar, usado por ex. em acoes-programadas.html).
  function _fgItemLabel(item) { return (item && typeof item === 'object') ? String(item.label != null ? item.label : '') : String(item); }
  function _fgItemId(item) { return (item && typeof item === 'object' && item.id != null) ? String(item.id) : ''; }

  function renderList(filter = '') {
    const rawItems = typeof getItems === 'function' ? getItems() : getItems;
    const itemsArray = Array.isArray(rawItems) ? rawItems : [];
    const query = (filter || '').trim();
    const queryLower = query.toLowerCase();

    const filtered = queryLower
      ? itemsArray.filter(item => figooMatchTerms(_fgItemLabel(item), queryLower))
      : itemsArray;

    let createType = opts.createType;
    if (!createType) {
      const idStr = (inp.id || '').toLowerCase();
      const placeStr = (inp.placeholder || '').toLowerCase();
      if (idStr.includes('ent') || placeStr.includes('prefeitura') || placeStr.includes('conta')) createType = 'entidade';
      else if (idStr.includes('cli') || idStr.includes('contato') || placeStr.includes('cliente')) createType = 'cliente';
      else if (idStr.includes('colab') || idStr.includes('resp') || idStr.includes('quem')) createType = 'colaborador';
    }

    let createHtml = '';
    if (query && createType) {
      const typeLabel = createType === 'entidade' ? 'Conta / Entidade' : (createType === 'cliente' ? 'Cliente / Contato' : 'Colaborador');
      createHtml = `
        <div class="fg-ac-create-item" data-create-type="${createType}" data-create-val="${_escapeAttr(query)}">
          <span>➕ Cadastrar <strong>"${_escapeHtml(query)}"</strong> como ${typeLabel}</span>
        </div>
      `;
    }

    if (!filtered.length) {
      menu.innerHTML = `
        <div class="fg-ac-empty">Nenhum resultado encontrado</div>
        ${createHtml}
      `;
      menu.classList.add('open');
      selectedIndex = -1;
      return;
    }

    const max = opts.maxItems || 60;
    const list = filtered.slice(0, max);

    menu.innerHTML = list.map((item, idx) => `
      <div class="fg-ac-item ${idx === selectedIndex ? 'active' : ''}" data-val="${_escapeAttr(_fgItemLabel(item))}" data-id="${_escapeAttr(_fgItemId(item))}">
        ${_highlightMatch(_fgItemLabel(item), queryLower)}
      </div>
    `).join('') + createHtml;

    menu.classList.add('open');
  }

  function _escapeAttr(s) {
    return String(s || '').replace(/"/g, '&quot;');
  }

  function _highlightMatch(text, query) {
    if (!query) return _escapeHtml(text);
    const idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return _escapeHtml(text);
    const before = _escapeHtml(text.slice(0, idx));
    const match = _escapeHtml(text.slice(idx, idx + query.length));
    const after = _escapeHtml(text.slice(idx + query.length));
    return `${before}<mark>${match}</mark>${after}`;
  }

  function _escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function selectItem(val, id) {
    inp.value = val;
    menu.classList.remove('open');
    selectedIndex = -1;
    if (typeof opts.onSelect === 'function') opts.onSelect(val, id);
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  }

  // Ao abrir (focar/clicar), começa sempre do zero: lista completa, nada
  // destacado — igual a um <select> nativo. Filtrar só entra em ação quando
  // o usuário digita (ver listener de 'input' abaixo).
  inp.addEventListener('focus', () => {
    selectedIndex = -1;
    renderList('');
  });

  inp.addEventListener('click', () => {
    selectedIndex = -1;
    renderList('');
  });

  inp.addEventListener('input', () => {
    selectedIndex = -1;
    renderList(inp.value);
  });

  inp.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('open')) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        renderList(inp.value);
        return;
      }
    }
    const items = menu.querySelectorAll('.fg-ac-item, .fg-ac-create-item');
    if (!items.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % items.length;
      updateActive(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + items.length) % items.length;
      updateActive(items);
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && items[selectedIndex]) {
        e.preventDefault();
        const activeItem = items[selectedIndex];
        if (activeItem.classList.contains('fg-ac-create-item')) {
          const cType = activeItem.getAttribute('data-create-type');
          const cVal = activeItem.getAttribute('data-create-val');
          menu.classList.remove('open');
          _openQuickCreateModal(cType, cVal, (newVal, newId) => selectItem(newVal, newId));
        } else {
          selectItem(activeItem.getAttribute('data-val'), activeItem.getAttribute('data-id'));
        }
      }
    } else if (e.key === 'Escape') {
      menu.classList.remove('open');
    }
  });

  function updateActive(items) {
    items.forEach((it, i) => {
      if (i === selectedIndex) {
        it.classList.add('active');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('active');
      }
    });
  }

  menu.addEventListener('mousedown', (e) => {
    const createItem = e.target.closest('.fg-ac-create-item');
    if (createItem) {
      e.preventDefault();
      const cType = createItem.getAttribute('data-create-type');
      const cVal = createItem.getAttribute('data-create-val');
      menu.classList.remove('open');
      _openQuickCreateModal(cType, cVal, (newVal, newId) => selectItem(newVal, newId));
      return;
    }
    const item = e.target.closest('.fg-ac-item');
    if (item) {
      e.preventDefault();
      selectItem(item.getAttribute('data-val'), item.getAttribute('data-id'));
    }
  });

  document.addEventListener('click', (e) => {
    if (!wrap.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
}

// ─── Combobox com busca sobre um <select> nativo ──────────────────
// Esconde o <select> e coloca um <input> proxy no lugar, reaproveitando
// attachAutocomplete (mesma busca multi-termo/teclado/"nenhum resultado").
// Ao escolher, grava em select.value e dispara 'change' — os onchange="..."
// que a tela já tinha continuam funcionando sem precisar editá-los.
function attachSelectAutocomplete(select) {
  const sel = typeof select === 'string' ? document.querySelector(select) : select;
  if (!sel || sel.tagName !== 'SELECT') return;
  if (sel._fgSelAttached) return;
  sel._fgSelAttached = true;

  const originalStyle = sel.getAttribute('style') || '';
  sel.style.display = 'none';
  const proxy = document.createElement('input');
  proxy.type = 'text';
  proxy.autocomplete = 'off';
  proxy.className = sel.className;
  if (originalStyle) proxy.setAttribute('style', originalStyle);
  sel.parentNode.insertBefore(proxy, sel.nextSibling);

  function currentLabel() {
    const opt = sel.options[sel.selectedIndex];
    return opt ? opt.text : '';
  }
  proxy.value = currentLabel();

  attachAutocomplete(proxy, function () {
    return Array.from(sel.options).map(o => ({ id: o.value, label: o.text }));
  }, {
    onSelect: function (label, value) {
      sel.value = value != null ? value : '';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  // Sincronização passiva: se algo externo mudar sel.value direto (ex.:
  // botão "Limpar filtros"), reflete no proxy no próximo tick do
  // auto-attach (ver autoAttachAllAutocompletes) — ponytail: folga de até
  // 2s aceita como teto conhecido, trocar por MutationObserver se incomodar.
  sel._fgSelSync = function () {
    const lbl = currentLabel();
    if (proxy.value !== lbl && document.activeElement !== proxy) proxy.value = lbl;
  };
}

// Agrupa nomes equivalentes (mesmo texto ignorando acento/caixa) e devolve
// um representante por grupo — usado para não repetir "Água Doce" e
// "ÁGUA DOCE" como duas opções na mesma lista de sugestões.
function figooDedupeLabels(list) {
  const groups = {};
  (list || []).forEach(name => {
    if (!name) return;
    const key = figooSearchNorm(name);
    if (!groups[key]) groups[key] = {};
    groups[key][name] = (groups[key][name] || 0) + 1;
  });
  return Object.keys(groups).map(key => {
    const variants = groups[key];
    return Object.keys(variants).sort((a, b) => variants[b] - variants[a])[0];
  }).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}
window.figooDedupeLabels = figooDedupeLabels;

// ─── Modal Global de Cadastro Rápido ──────────────────────────────
function _openQuickCreateModal(type, prefillVal, onCreated) {
  let modalEl = document.getElementById('fg-quick-create-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'fg-quick-create-modal';
    modalEl.className = 'modal-overlay';
    modalEl.style.zIndex = '100000';
    document.body.appendChild(modalEl);
  }

  const typeLabels = {
    entidade: 'Conta / Entidade',
    cliente: 'Cliente / Contato',
    colaborador: 'Colaborador Responsável'
  };

  const labelName = typeLabels[type] || 'Registro';
  const cleanVal = (prefillVal || '').replace(/"/g, '&quot;');

  modalEl.innerHTML = `
    <div class="modal-card" style="max-width: 480px;">
      <div class="modal-head">
        <h3>➕ Cadastrar Novo(a) ${labelName}</h3>
        <button class="modal-close" type="button" onclick="_closeQuickCreateModal()">&times;</button>
      </div>
      <form id="fg-quick-create-form" onsubmit="_submitQuickCreate(event)">
        <input type="hidden" id="fg-qc-type" value="${type}" />
        <div class="form-field">
          <label>Nome / Identificação *</label>
          <input type="text" id="fg-qc-name" value="${cleanVal}" required placeholder="Ex.: ${cleanVal}" />
        </div>
        ${type === 'entidade' ? `
          <div class="form-field">
            <label>Município (Opcional)</label>
            <input type="text" id="fg-qc-extra" placeholder="Ex.: Videira" />
          </div>
        ` : ''}
        ${type === 'cliente' ? `
          <div class="form-field">
            <label>Conta / Entidade Vinculada (Opcional)</label>
            <input type="text" id="fg-qc-extra" placeholder="Ex.: Prefeitura de Videira" />
          </div>
          <div class="form-field">
            <label>WhatsApp / Telefone (Opcional)</label>
            <input type="tel" id="fg-qc-fone" placeholder="Ex.: 554999669064" />
          </div>
        ` : ''}
        <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;padding-top:12px;border-top:0.5px solid var(--border);">
          <button type="button" class="btn-edit-cancel" onclick="_closeQuickCreateModal()">Cancelar</button>
          <button type="submit" class="btn-edit-save" id="fg-qc-btn-save">Salvar e Selecionar</button>
        </div>
      </form>
    </div>
  `;

  modalEl.classList.remove('hidden');
  modalEl.style.display = 'flex';
  
  setTimeout(() => {
    const nameInp = document.getElementById('fg-qc-name');
    if (nameInp) nameInp.focus();
  }, 100);

  window._fgQcCallback = onCreated;
}

function _closeQuickCreateModal() {
  const modalEl = document.getElementById('fg-quick-create-modal');
  if (modalEl) {
    modalEl.classList.add('hidden');
    modalEl.style.display = 'none';
  }
}

async function _submitQuickCreate(e) {
  e.preventDefault();
  const btn = document.getElementById('fg-qc-btn-save');
  if (btn) btn.disabled = true;

  const type = document.getElementById('fg-qc-type').value;
  const name = (document.getElementById('fg-qc-name').value || '').trim();
  const extra = document.getElementById('fg-qc-extra') ? document.getElementById('fg-qc-extra').value.trim() : '';
  const fone = document.getElementById('fg-qc-fone') ? document.getElementById('fg-qc-fone').value.trim() : '';

  if (!name) return;

  const emailKey = (typeof window.emailKey !== 'undefined') ? window.emailKey : (localStorage.getItem('figoo_email_key') || '');
  const nowMs = Date.now();
  const id = 'qc_' + nowMs + '_' + Math.random().toString(36).substr(2, 4);

  try {
    if (type === 'entidade') {
      const item = { id, nome: name, municipio: extra, createdAt: nowMs, updatedAt: nowMs };
      if (typeof fbSetEnc === 'function') await fbSetEnc(`entidades/${emailKey}/e/${id}`, item);
      else if (typeof fbSet === 'function') await fbSet(`entidades/${emailKey}/e/${id}`, item);
      if (window.dbContext && Array.isArray(window.dbContext.entidades)) {
        window.dbContext.entidades.unshift(name);
      }
    } else if (type === 'cliente') {
      const item = { id, nome: name, entidade: extra, fone, createdAt: nowMs, updatedAt: nowMs };
      if (typeof fbSetEnc === 'function') await fbSetEnc(`clientes/${emailKey}/c/${id}`, item);
      else if (typeof fbSet === 'function') await fbSet(`clientes/${emailKey}/c/${id}`, item);
      if (window.dbContext && Array.isArray(window.dbContext.clientes)) {
        window.dbContext.clientes.unshift(name);
      }
    } else if (type === 'colaborador') {
      const item = { id, nome: name, createdAt: nowMs, updatedAt: nowMs };
      if (typeof fbSetEnc === 'function') await fbSetEnc(`colaboradores/${emailKey}/items/${id}`, item);
      else if (typeof fbSet === 'function') await fbSet(`colaboradores/${emailKey}/items/${id}`, item);
      if (window.dbContext && Array.isArray(window.dbContext.colaboradores)) {
        window.dbContext.colaboradores.unshift(name);
      }
    }

    _closeQuickCreateModal();

    if (typeof window._fgQcCallback === 'function') {
      window._fgQcCallback(name, id);
    }
  } catch (err) {
    console.error('Erro ao cadastrar rápido:', err);
    _closeQuickCreateModal();
    if (typeof window._fgQcCallback === 'function') {
      window._fgQcCallback(name);
    }
  }
}

// ─── Auto-detecção de todos os <input list="..."> e <select class="select-busca"> ────
function autoAttachAllAutocompletes() {
  const inputs = document.querySelectorAll('input[list]');
  inputs.forEach(inp => {
    if (inp._fgAcAttached) return;
    const listId = inp.getAttribute('list');
    if (!listId) return;

    const getOptions = () => {
      const dl = document.getElementById(listId);
      if (!dl) return [];
      const opts = dl.querySelectorAll('option');
      const vals = [];
      opts.forEach(o => {
        const v = o.getAttribute('value') || o.textContent;
        if (v && v.trim()) vals.push(v.trim());
      });
      return vals;
    };

    attachAutocomplete(inp, getOptions);
  });

  document.querySelectorAll('select.select-busca').forEach(sel => {
    if (sel._fgSelAttached) { if (sel._fgSelSync) sel._fgSelSync(); return; }
    attachSelectAutocomplete(sel);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(autoAttachAllAutocompletes, 400);
    setInterval(autoAttachAllAutocompletes, 2000);
  });
} else {
  setTimeout(autoAttachAllAutocompletes, 400);
  setInterval(autoAttachAllAutocompletes, 2000);
}

// ═══════════════════════════════════════════════════════════════
//  GERENCIADOR DE TIPOS DE AÇÕES PROGRAMADAS (GLOBAL)
// ═══════════════════════════════════════════════════════════════
//  GERENCIADOR DE TIPOS DE AÇÕES PROGRAMADAS (GLOBAL)
// ═══════════════════════════════════════════════════════════════
const DEFAULT_ACTION_TYPES = [
  { id: 't_1', label: 'Treinamento', color: '#5EAD24' },
  { id: 't_2', label: 'Implantação', color: '#2D5016' },
  { id: 't_3', label: 'Consultoria Presencial', color: '#1A5276' },
  { id: 't_4', label: 'Auditoria', color: '#8B6914' },
  { id: 't_5', label: 'Suporte Técnico', color: '#6C3483' },
  { id: 't_6', label: 'Alinhamento CS', color: '#C05050' }
];

const ACTION_TYPE_PALETTE = [
  '#5EAD24', '#2D5016', '#1A5276', '#8B6914',
  '#6C3483', '#C05050', '#1D4ED8', '#BE185D'
];

let _atEk = '';
let _atTypes = [];
let _atOnSave = null;
let _atColor = ACTION_TYPE_PALETTE[0];

async function openActionTypesModal(ek, currentTypes, onSave) {
  _atEk = ek || (typeof emailKey !== 'undefined' ? emailKey : '') || localStorage.getItem('figoo_email_key') || (typeof emailToKey === 'function' ? emailToKey(localStorage.getItem('figoo_email') || '') : '');
  _atOnSave = onSave;

  if (currentTypes && Array.isArray(currentTypes) && currentTypes.length > 0) {
    _atTypes = JSON.parse(JSON.stringify(currentTypes));
  } else if (_atEk) {
    try {
      let raw = typeof fbGetEnc === 'function' ? await fbGetEnc('acoes_programadas_types/' + _atEk, 5000).catch(() => null) : null;
      if (!raw) {
        const local = localStorage.getItem('acoes_types_' + _atEk);
        if (local) raw = JSON.parse(local);
      }
      _atTypes = (raw && Array.isArray(raw) && raw.length > 0) ? raw : JSON.parse(JSON.stringify(DEFAULT_ACTION_TYPES));
    } catch(e) {
      _atTypes = JSON.parse(JSON.stringify(DEFAULT_ACTION_TYPES));
    }
  } else {
    _atTypes = JSON.parse(JSON.stringify(DEFAULT_ACTION_TYPES));
  }

  const old = document.getElementById('_figoo_action_types_modal');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = '_figoo_action_types_modal';
  overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;box-sizing:border-box';

  overlay.innerHTML = `
    <div style="background:var(--white,#fff);border-radius:14px;padding:24px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.25);border:0.5px solid var(--border,#E8EAED);box-sizing:border-box">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
        <h3 style="font-size:1.05rem;font-weight:700;color:var(--text,#1B1F1D);margin:0;display:flex;align-items:center;gap:6px">⚙️ Tipos de Ações Programadas</h3>
        <button onclick="_atClose()" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:var(--text2,#4A544E);line-height:1">&times;</button>
      </div>
      <p style="font-size:0.8rem;color:var(--text2,#4A544E);margin:0 0 16px 0;line-height:1.5">
        Cadastre novos tipos de ações ou remova categorias existentes. As alterações aplicam-se a todas as ações programadas.
      </p>
      
      <div style="background:var(--bg,#F6F7F9);border-radius:10px;padding:12px;margin-bottom:16px;border:1px solid var(--border,#E8EAED)">
        <label style="font-size:0.75rem;font-weight:600;color:var(--text2,#4A544E);display:block;margin-bottom:6px">Novo Tipo de Ação</label>
        <input id="_at_label" placeholder="Ex.: Workshop, Visita Técnica..." maxlength="50" autocomplete="off"
          style="width:100%;border:1px solid var(--border,#E8EAED);border-radius:8px;padding:8px 12px;font-size:0.86rem;font-family:inherit;outline:none;color:var(--text,#1B1F1D);background:var(--white,#fff);margin-bottom:10px;box-sizing:border-box"
          oninput="document.getElementById('_at_btn').disabled=!this.value.trim();document.getElementById('_at_btn').style.opacity=this.value.trim()?'1':'0.5'"
          onkeydown="if(event.key==='Enter'){event.preventDefault();_atCreate(event);}" />
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px">
          <div id="_at_colors" style="display:flex;gap:6px;flex-wrap:wrap"></div>
          <button id="_at_btn" onclick="_atCreate(event)" disabled
            style="padding:7px 16px;border:none;border-radius:8px;background:var(--primary,#2D5016);color:#fff;font-size:0.82rem;font-weight:600;cursor:pointer;font-family:inherit;opacity:0.5;transition:opacity .15s">
            + Adicionar
          </button>
        </div>
      </div>

      <div style="font-size:0.75rem;font-weight:600;color:var(--text2,#4A544E);margin-bottom:6px" id="_at_count_label">Tipos Cadastrados (${_atTypes.length}):</div>
      <div id="_at_list" style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;margin-bottom:18px;padding-right:2px"></div>

      <div style="display:flex;justify-content:flex-end;gap:8px">
        <button onclick="_atClose()"
          style="padding:8px 18px;border:1px solid var(--border,#E8EAED);border-radius:8px;background:none;color:var(--text2,#4A544E);font-size:0.84rem;font-weight:500;cursor:pointer;font-family:inherit">
          Cancelar
        </button>
        <button onclick="_atSaveAndClose()"
          style="padding:8px 20px;border:none;border-radius:8px;background:var(--primary,#2D5016);color:#fff;font-size:0.84rem;font-weight:600;cursor:pointer;font-family:inherit">
          Salvar Alterações
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  _atRenderColors();
  _atRenderList();
  setTimeout(() => { const inp = document.getElementById('_at_label'); if(inp) inp.focus(); }, 80);
}

function _atRenderColors() {
  const cont = document.getElementById('_at_colors');
  if (!cont) return;
  cont.innerHTML = ACTION_TYPE_PALETTE.map(c => `
    <div onclick="_atSelectColor('${c}')" title="${c}"
      style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;flex-shrink:0;
             border:2.5px solid ${_atColor === c ? '#fff' : 'transparent'};
             outline:2px solid ${_atColor === c ? c : 'transparent'};
             transition:all .15s"></div>
  `).join('');
}

function _atSelectColor(c) { _atColor = c; _atRenderColors(); }

function _atRenderList() {
  const cont = document.getElementById('_at_list');
  const countLbl = document.getElementById('_at_count_label');
  if (countLbl) countLbl.textContent = `Tipos Cadastrados (${_atTypes.length}):`;
  if (!cont) return;
  if (!_atTypes.length) {
    cont.innerHTML = '<span style="font-size:0.8rem;color:var(--text2,#4A544E);padding:8px;text-align:center;display:block">Nenhum tipo cadastrado.</span>';
    return;
  }
  cont.innerHTML = _atTypes.map((t, idx) => `
    <div data-atidx="${idx}" style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg,#F6F7F9);border-radius:8px;border:1px solid var(--border,#E8EAED)">
      <div style="width:12px;height:12px;border-radius:50%;background:${t.color || '#2D5016'};flex-shrink:0"></div>
      <span style="flex:1;font-size:0.86rem;font-weight:500;color:var(--text,#1B1F1D)">${(t.label || '').replace(/</g, '&lt;')}</span>
      <button onclick="_atDelete(${idx})" title="Remover tipo"
        style="background:none;border:none;color:#999;cursor:pointer;font-size:1.1rem;padding:2px 6px;border-radius:4px;font-family:inherit;transition:color .15s;line-height:1"
        onmouseover="this.style.color='#B4291B'" onmouseout="this.style.color='#999'">&times;</button>
    </div>
  `).join('');
}

function _atCreate(evt) {
  if (evt && evt.preventDefault) evt.preventDefault();
  const inp = document.getElementById('_at_label');
  const label = inp ? inp.value.trim() : '';
  if (!label) return;

  if (_atTypes.some(t => (t.label || '').toLowerCase() === label.toLowerCase())) {
    alert('Este tipo de ação já está cadastrado!');
    return;
  }

  const newId = 't_' + Date.now().toString(36);
  _atTypes.push({ id: newId, label: label, color: _atColor });

  const idx = ACTION_TYPE_PALETTE.indexOf(_atColor);
  _atColor = ACTION_TYPE_PALETTE[(idx + 1) % ACTION_TYPE_PALETTE.length];

  if (inp) {
    inp.value = '';
    inp.focus();
  }
  const btn = document.getElementById('_at_btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.5'; }

  _atRenderColors();
  _atRenderList();
}

function _atDelete(idx) {
  if (idx < 0 || idx >= _atTypes.length) return;
  _atTypes.splice(idx, 1);
  _atRenderList();
}

async function _atSaveAndClose() {
  if (_atEk) {
    if (typeof fbSetEnc === 'function') {
      try {
        await fbSetEnc('acoes_programadas_types/' + _atEk, _atTypes);
      } catch(e) {
        console.error('Erro ao salvar tipos no Firebase:', e);
      }
    }
    try {
      localStorage.setItem('acoes_types_' + _atEk, JSON.stringify(_atTypes));
    } catch(e) {}
  }
  _atClose();
  if (typeof _atOnSave === 'function') {
    _atOnSave(_atTypes);
  }
}

function _atClose() {
  const overlay = document.getElementById('_figoo_action_types_modal');
  if (overlay) overlay.remove();
}

window._atCreate = _atCreate;
window._atSelectColor = _atSelectColor;
window._atDelete = _atDelete;
window._atSaveAndClose = _atSaveAndClose;
window._atClose = _atClose;
window._atRenderColors = _atRenderColors;
window._atRenderList = _atRenderList;

// ─── Cascade Rename (cliente / entidade / colaborador) ───────
// O Figoo não usa chaves estrangeiras: cada módulo guarda o nome do
// cliente/conta(entidade)/colaborador como texto solto. Ao renomear um
// desses cadastros, esta função varre todos os módulos que copiam esse
// nome e sincroniza (casamento por igualdade exata normalizada).
function figooNormName(s) { return (s || '').trim().toLowerCase().replace(/\s+/g, ' '); }
window.figooNormName = figooNormName;

// ─── Busca multi-termo (tipo "%termo1%termo2%...") ────────────
// Ignora acento e maiúscula/minúscula. Cada palavra digitada precisa
// aparecer em algum lugar do texto, em qualquer ordem — então buscar
// "santa cecilia" (sem acento, em qualquer ordem) acha "Câmara Municipal
// Santa Cecília".
function figooSearchNorm(s) {
  return (s == null ? '' : String(s)).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}
window.figooSearchNorm = figooSearchNorm;

function figooMatchTerms(haystack, query) {
  const terms = figooSearchNorm(query).split(' ').filter(Boolean);
  if (!terms.length) return true;
  const h = figooSearchNorm(haystack);
  return terms.every(t => h.indexOf(t) >= 0);
}
window.figooMatchTerms = figooMatchTerms;

async function figooCascadeRename(ek, kind, oldName, newName) {
  if (!ek || !oldName || !newName) return { changed: 0 };
  const oldN = figooNormName(oldName);
  if (oldN === figooNormName(newName)) return { changed: 0 };
  const eq = function (v) { return !!v && figooNormName(v) === oldN; };
  let changed = 0;

  // Array único cifrado (o blob inteiro é regravado se algo mudar).
  async function patchArrayPath(path, patchItem) {
    let raw;
    try { raw = await fbGetEnc(path, 10000); } catch (e) { return; }
    if (raw == null) return;
    let list = Array.isArray(raw) ? raw : Object.values(raw);
    let touched = false;
    list.forEach(function (item) {
      if (item && typeof item === 'object' && patchItem(item)) { touched = true; changed++; }
    });
    if (touched) { try { await fbSetEnc(path, list); } catch (e) {} }
  }

  // Array simples de strings, sem cifra (ex.: sugestões do autocomplete "quem").
  async function patchStringListPath(path) {
    let raw;
    try { raw = await fbGet(path, 8000); } catch (e) { return; }
    if (!Array.isArray(raw)) return;
    let touched = false;
    const list = raw.map(function (s) {
      if (eq(s)) { touched = true; changed++; return newName; }
      return s;
    });
    if (touched) { try { await fbSet(path, list); } catch (e) {} }
  }

  // Mapa por id (1 doc cifrado por chave) — só regrava os docs alterados.
  async function patchKeyedPath(basePath, patchItem) {
    let raw;
    try { raw = await fbGet(basePath, 12000); } catch (e) { return; }
    if (!raw || typeof raw !== 'object') return;
    for (const id in raw) {
      if (id.indexOf('__') === 0) continue;
      let item;
      try { item = await decData(raw[id]); } catch (e) { continue; }
      if (!item || typeof item !== 'object') continue;
      if (patchItem(item)) {
        changed++;
        try { await fbSetEnc(basePath + '/' + id, item); } catch (e) {}
      }
    }
  }

  function patchParticipantes(item) {
    let touched = false;
    if (Array.isArray(item.participantes)) {
      item.participantes.forEach(function (p) {
        if (p && eq(p.nome)) { p.nome = newName; touched = true; }
      });
    }
    return touched;
  }

  // 1. pendencias/{ek}/items — quem (colaborador), entidade, cliente
  await patchArrayPath('pendencias/' + ek + '/items', function (p) {
    let t = false;
    if (kind === 'colaborador' && eq(p.quem)) { p.quem = newName; t = true; }
    if (kind === 'entidade' && eq(p.entidade)) { p.entidade = newName; t = true; }
    if (kind === 'cliente' && eq(p.cliente)) { p.cliente = newName; t = true; }
    return t;
  });

  // 2. reunioes/{ek}/m — "cliente" é o nome da entidade; participantes[].nome pode ser cliente OU colaborador
  await patchKeyedPath('reunioes/' + ek + '/m', function (m) {
    let t = false;
    if (kind === 'entidade' && eq(m.cliente)) { m.cliente = newName; t = true; }
    if ((kind === 'cliente' || kind === 'colaborador') && patchParticipantes(m)) t = true;
    return t;
  });

  // 3. acoes_programadas/{ek}/items — entidade, cliente, responsavel
  await patchArrayPath('acoes_programadas/' + ek + '/items', function (a) {
    let t = false;
    if (kind === 'entidade' && eq(a.entidade)) { a.entidade = newName; t = true; }
    if (kind === 'cliente' && eq(a.cliente)) { a.cliente = newName; t = true; }
    if (kind === 'colaborador' && eq(a.responsavel)) { a.responsavel = newName; t = true; }
    return t;
  });

  // 4. clientes/{ek}/c — campo "entidade" (conta à qual o cliente pertence)
  if (kind === 'entidade') {
    await patchKeyedPath('clientes/' + ek + '/c', function (c) {
      if (eq(c.entidade)) { c.entidade = newName; return true; }
      return false;
    });
  }

  // 5. entidades/{ek}/e — cache "contatoNome" (pareado com contatoId, que não muda)
  if (kind === 'cliente') {
    await patchKeyedPath('entidades/' + ek + '/e', function (e) {
      if (eq(e.contatoNome)) { e.contatoNome = newName; return true; }
      return false;
    });
  }

  // 6. Lista de sugestões do autocomplete "quem"
  if (kind === 'colaborador') {
    await patchStringListPath('figoo/' + ek + '/__quem_list');
  }

  // 7. Mirrors legados lidos por municipios.html / auditoria-ia.html / figoo-chat.js
  await patchArrayPath('clientes/' + ek + '/items', function (c) {
    let t = false;
    if (kind === 'entidade' && eq(c.entidade)) { c.entidade = newName; t = true; }
    if (kind === 'cliente' && eq(c.nome)) { c.nome = newName; t = true; }
    return t;
  });
  await patchArrayPath('reunioes/' + ek + '/items', function (m) {
    let t = false;
    if (kind === 'entidade' && eq(m.cliente)) { m.cliente = newName; t = true; }
    if ((kind === 'cliente' || kind === 'colaborador') && patchParticipantes(m)) t = true;
    return t;
  });

  // 8. weekly/{ek}/w — 1 doc por segunda-feira; participantesAusentes é chaveado pelo nome
  await patchKeyedPath('weekly/' + ek + '/w', function (week) {
    let t = false;
    if ((kind === 'cliente' || kind === 'colaborador') && Array.isArray(week.topics)) {
      week.topics.forEach(function (topic) {
        if (Array.isArray(topic.pend)) {
          topic.pend.forEach(function (p) {
            if (p && eq(p.who)) { p.who = newName; t = true; }
          });
        }
      });
    }
    if (kind === 'colaborador' && week.participantesAusentes && typeof week.participantesAusentes === 'object') {
      for (const k in week.participantesAusentes) {
        if (eq(k)) {
          week.participantesAusentes[newName] = week.participantesAusentes[k];
          delete week.participantesAusentes[k];
          t = true;
        }
      }
    }
    return t;
  });

  // 9. calendario/{ek}/events — campo "entity" (texto livre)
  if (kind === 'entidade') {
    await patchArrayPath('calendario/' + ek + '/events', function (ev) {
      if (eq(ev.entity)) { ev.entity = newName; return true; }
      return false;
    });
  }

  return { changed: changed };
}
window.figooCascadeRename = figooCascadeRename;

// ─── Verifica se um cliente/colaborador está em uso antes de excluir ──
// kind: 'colaborador' (checa pendencias.quem + reunioes.participantes[].nome)
//     | 'contato'      (checa pendencias.cliente + reunioes.participantes[].nome)
// names: lista de variantes do nome a considerar (ex.: [nome, nomeCurto]).
async function figooCheckPersonInUse(ek, kind, names) {
  const wanted = (names || []).filter(Boolean).map(figooNormName);
  if (!ek || !wanted.length) return { used: false, count: 0 };
  let count = 0;

  try {
    const raw = await fbGetEnc('pendencias/' + ek + '/items', 10000);
    const list = raw ? (Array.isArray(raw) ? raw : Object.values(raw)) : [];
    list.forEach(function (p) {
      if (!p) return;
      const field = kind === 'colaborador' ? p.quem : p.cliente;
      if (field && wanted.indexOf(figooNormName(field)) >= 0) count++;
    });
  } catch (e) {}

  try {
    const raw = await fbGet('reunioes/' + ek + '/m', 10000);
    if (raw && typeof raw === 'object') {
      for (const id in raw) {
        if (id.indexOf('__') === 0) continue;
        let m;
        try { m = await decData(raw[id]); } catch (e) { continue; }
        if (m && Array.isArray(m.participantes)) {
          m.participantes.forEach(function (p) {
            if (p && p.nome && wanted.indexOf(figooNormName(p.nome)) >= 0) count++;
          });
        }
      }
    }
  } catch (e) {}

  return { used: count > 0, count: count };
}
window.figooCheckPersonInUse = figooCheckPersonInUse;

// ─── Padrão A: filtro multi-seleção em popover ────────────────
// Extraído do filtro de município de contas.html (referência documentada
// em figoopadraofiltroslistagem.md). Toda tela que precisa filtrar por
// "vários valores de uma lista longa" (município, tags, categorias) deve
// usar esta função em vez de reimplementar popover/Set/chips na mão.
// Ver AGENTS.md, item 10.
function _fgEsc(s) {
  return (s == null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createMultiSelectFilter(opts) {
  opts = opts || {};
  var selected = opts.selectedSet instanceof Set ? opts.selectedSet : new Set();
  var getAllItems = opts.getAllItems || function () { return []; };
  var itemLabel = opts.itemLabel || function (x) { return String(x); };
  var onChange = opts.onChange || function () {};
  var allLabel = opts.allLabel || 'Todos';
  var unitLabelPlural = opts.unitLabelPlural || 'selecionados';
  var emptyMsg = opts.emptyMsg || 'Nenhum item encontrado';

  function $id(id) { return id ? document.getElementById(id) : null; }
  function triggerEl() { return $id(opts.triggerId); }
  function popoverEl() { return $id(opts.popoverId); }
  function wrapEl() { return $id(opts.wrapId); }
  function labelEl() { return $id(opts.labelId); }
  function listEl() { return $id(opts.listId); }
  function searchEl() { return $id(opts.searchId); }
  function chipsEl() { return $id(opts.chipsBarId); }

  function openPop() { var p = popoverEl(); if (p) p.classList.remove('hidden'); }
  function closePop() { var p = popoverEl(); if (p) p.classList.add('hidden'); }
  function togglePop(ev) { if (ev) ev.stopPropagation(); var p = popoverEl(); if (p) p.classList.toggle('hidden'); }

  function updateLabel() {
    var lbl = labelEl();
    if (!lbl) return;
    if (selected.size === 0) lbl.textContent = allLabel;
    else if (selected.size === 1) lbl.textContent = Array.from(selected)[0];
    else lbl.textContent = selected.size + ' ' + unitLabelPlural;
  }

  function renderChips() {
    var bar = chipsEl();
    if (!bar) return;
    if (selected.size === 0) { bar.innerHTML = ''; return; }
    bar.innerHTML = Array.from(selected).map(function (v) {
      return '<div class="mun-chip">📍 ' + _fgEsc(v) + ' <button type="button" data-fgmsf-chip="' + _fgEsc(v) + '" title="Remover filtro de ' + _fgEsc(v) + '">✕</button></div>';
    }).join('');
    Array.prototype.forEach.call(bar.querySelectorAll('[data-fgmsf-chip]'), function (btn) {
      btn.addEventListener('click', function () { removeOne(btn.getAttribute('data-fgmsf-chip')); });
    });
  }

  function refreshList() {
    var el = listEl();
    if (!el) return;
    var all = getAllItems() || [];
    var sq = searchEl() ? (searchEl().value || '').trim() : '';
    var filtered = sq ? all.filter(function (it) { return figooMatchTerms(itemLabel(it), sq); }) : all;
    if (!filtered.length) {
      el.innerHTML = '<span style="font-size:var(--fs-2xs);color:var(--text2);padding:4px">' + _fgEsc(emptyMsg) + '</span>';
    } else {
      el.innerHTML = filtered.map(function (it) {
        var v = itemLabel(it);
        var checked = selected.has(v);
        return '<label class="mun-item" style="display:flex;align-items:center;gap:6px;padding:3px 4px;cursor:pointer;font-size:var(--fs-xs)">'
          + '<input type="checkbox" data-fgmsf-item="' + _fgEsc(v) + '" ' + (checked ? 'checked' : '') + '>'
          + '<span>' + _fgEsc(v) + '</span></label>';
      }).join('');
      Array.prototype.forEach.call(el.querySelectorAll('[data-fgmsf-item]'), function (cb) {
        cb.addEventListener('change', function () { toggleOne(cb.getAttribute('data-fgmsf-item')); });
      });
    }
    updateLabel();
    renderChips();
  }

  function toggleOne(v) {
    if (selected.has(v)) selected.delete(v); else selected.add(v);
    updateLabel();
    renderChips();
    onChange(selected);
  }

  function removeOne(v) {
    selected.delete(v);
    updateLabel();
    renderChips();
    refreshList();
    onChange(selected);
  }

  function selectAll(flag) {
    if (flag) (getAllItems() || []).forEach(function (it) { selected.add(itemLabel(it)); });
    else selected.clear();
    updateLabel();
    renderChips();
    refreshList();
    onChange(selected);
  }

  var t = triggerEl();
  if (t) t.addEventListener('click', togglePop);
  document.addEventListener('click', function (e) {
    var w = wrapEl();
    if (w && !w.contains(e.target)) closePop();
  });
  var s = searchEl();
  if (s) s.addEventListener('input', refreshList);
  if (opts.selectAllBtnId) { var b1 = $id(opts.selectAllBtnId); if (b1) b1.addEventListener('click', function () { selectAll(true); }); }
  if (opts.clearBtnId) { var b2 = $id(opts.clearBtnId); if (b2) b2.addEventListener('click', function () { selectAll(false); }); }
  (opts.closeBtnIds || []).forEach(function (id) { var b = $id(id); if (b) b.addEventListener('click', closePop); });

  refreshList();

  return {
    getSelected: function () { return selected; },
    setSelected: function (set) { selected.clear(); (set || []).forEach(function (v) { selected.add(v); }); updateLabel(); renderChips(); refreshList(); },
    clear: function () { selectAll(false); },
    refresh: refreshList,
    open: openPop,
    close: closePop
  };
}
window.createMultiSelectFilter = createMultiSelectFilter;

// ─── Padrão B (parcial): estado vazio padronizado ─────────────
// Injeta o card `.figoo-empty-card` (CSS global, já injetado por
// figoo-ui.js) — usar em toda listagem em vez de markup bespoke de "nada
// encontrado". Ver AGENTS.md, item 10.
function figooEmptyState(container, opts) {
  var el = typeof container === 'string' ? document.getElementById(container) : container;
  if (!el) return;
  opts = opts || {};
  var icon = opts.icon || '🔍';
  var title = opts.title || 'Nada encontrado';
  var hint = opts.hint || '';
  var actionHtml = opts.actionHtml || '';
  el.innerHTML = '<div class="figoo-empty-card">'
    + '<div class="figoo-empty-icon">' + icon + '</div>'
    + '<p class="figoo-empty-title">' + title + '</p>'
    + (hint ? '<p class="figoo-empty-sub">' + hint + '</p>' : '')
    + actionHtml
    + '</div>';
}
window.figooEmptyState = figooEmptyState;

window.openActionTypesModal = openActionTypesModal;
window.openAdminActionTypesModal = function(customEk) {
  let ek = customEk || (typeof window.emailKey !== 'undefined' ? window.emailKey : '') || (typeof emailKey !== 'undefined' ? emailKey : '');
  if (!ek) {
    const eml = localStorage.getItem('figoo_email') || localStorage.getItem('figoo_last_email') || '';
    if (eml && typeof emailToKey === 'function') ek = emailToKey(eml);
  }
  openActionTypesModal(ek, null, function(newTypes) {
    if (typeof toast === 'function') toast('Tipos de Ação salvos com sucesso ✓');
  });
};


