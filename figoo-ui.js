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
    .topbar{background:var(--white,#FFFFFF);border-bottom:.5px solid var(--border,#E8EAED);padding:0 18px;height:50px;display:flex;align-items:center;gap:10px;flex-shrink:0;position:sticky;top:0;z-index:100}
    .logo-link{display:flex;align-items:center;gap:7px;text-decoration:none;color:var(--text,#1B1F1D);font-weight:500;font-size:.88rem;flex-shrink:0}
    .divider-v{width:1px;height:18px;background:var(--border,#E8EAED);flex-shrink:0}
    .page-badge{width:26px;height:26px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:.82rem;color:#fff;flex-shrink:0}
    .page-meta{display:flex;flex-direction:column;gap:1px;min-width:0}
    .page-title{font-size:.82rem;font-weight:500;color:var(--text,#1B1F1D);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .page-sub{font-size:.59rem;color:var(--text2,#67716B);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
    .topbar-right{display:flex;align-items:center;gap:6px;margin-left:auto}
    .cloud-badge{font-size:.61rem;color:var(--text2,#67716B);opacity:.7;white-space:nowrap}
    .cloud-badge.online{color:var(--secondary,#5EAD24);opacity:1}
    .cloud-badge.local{color:#B7791F;opacity:1}
    .ver-badge{font-size:.68rem;color:var(--secondary,#5EAD24);white-space:nowrap;font-family:monospace;letter-spacing:.4px;font-weight:500;background:rgba(127,127,127,.08);padding:2px 7px;border-radius:99px}
    .tbtn{background:rgba(127,127,127,.08);border:.5px solid var(--border,#E8EAED);color:var(--text,#1B1F1D);padding:5px 12px;border-radius:8px;font-size:.71rem;font-weight:500;cursor:pointer;font-family:inherit;transition:background .15s;white-space:nowrap}
    .tbtn:hover{background:rgba(127,127,127,.16)}
    .tbtn.accent{border-color:var(--secondary,#5EAD24);color:var(--secondary,#5EAD24)}
    .tbtn.success{background:var(--secondary,#5EAD24);color:#fff;border-color:transparent}
    .figoo-footer{background:var(--bg,#F6F7F9);text-align:center;font-size:.7rem;color:var(--text2,#67716B);padding:14px 18px;border-top:.5px solid var(--border,#E8EAED);margin-top:auto;flex-shrink:0}

    /* ── Override "app moderno" da topbar (id vence o CSS local de cada página) ── */
    #topbar.topbar{background:var(--white,#FFFFFF);border-bottom:.5px solid var(--border,#E8EAED);color:var(--text,#1B1F1D)}
    #topbar .logo-link{color:var(--text,#1B1F1D)}
    #topbar .divider-v{background:var(--border,#E8EAED)}
    #topbar .page-title,#topbar .page-title-tb{color:var(--text,#1B1F1D)}
    #topbar .page-sub{color:var(--text2,#67716B)}
    #topbar .save-status{color:var(--text2,#67716B)}
    #topbar .save-status.saving,#topbar .save-status.saved{color:var(--secondary,#5EAD24)}
    #topbar .save-status.error{color:#C05050}
    #topbar .task-count{color:var(--text2,#67716B)}
    #topbar .cloud-badge{color:var(--text2,#67716B);opacity:.7}
    #topbar .cloud-badge.online{color:var(--secondary,#5EAD24);opacity:1}
    #topbar .cloud-badge.local{color:#B7791F;opacity:1}
    #topbar .ver-badge{color:var(--secondary,#5EAD24);background:rgba(127,127,127,.08)}
    #topbar .tbtn{background:rgba(127,127,127,.08);border:.5px solid var(--border,#E8EAED);color:var(--text,#1B1F1D);border-radius:8px}
    #topbar .tbtn:hover{background:rgba(127,127,127,.16)}
    #topbar .tbtn.accent{border-color:var(--secondary,#5EAD24);color:var(--secondary,#5EAD24)}
    #topbar .tbtn.success{background:var(--secondary,#5EAD24);color:#fff;border-color:transparent}
    #topbar .tbtn.status-open{background:color-mix(in srgb,var(--secondary,#5EAD24) 14%,transparent);border-color:var(--secondary,#5EAD24);color:var(--secondary,#5EAD24)}
    #topbar .tbtn.status-done{background:color-mix(in srgb,var(--accent,#8B6914) 16%,transparent);border-color:var(--accent,#8B6914);color:var(--accent,#8B6914)}
    #topbar .topbar-nav{border-left:.5px solid var(--border,#E8EAED)!important}

    /* ── Barra de navegação inferior (só mobile) ── */
    .fgnav{display:none;position:fixed;left:0;right:0;bottom:0;z-index:600;background:var(--white,#FFFFFF);border-top:.5px solid var(--border,#E8EAED);height:calc(58px + env(safe-area-inset-bottom));padding:0 4px env(safe-area-inset-bottom);box-shadow:0 -2px 12px rgba(0,0,0,.05)}
    .fgnav-item{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;text-decoration:none;color:var(--text2,#67716B);font-size:.62rem;font-weight:500;min-width:0;-webkit-tap-highlight-color:transparent}
    .fgnav-item svg{width:22px;height:22px;flex-shrink:0}
    .fgnav-item.active{color:var(--secondary,#5EAD24)}
    .fgnav-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100%;padding:0 2px}

    @media(max-width:680px){
      .fgnav{display:flex}
      body{padding-bottom:calc(58px + env(safe-area-inset-bottom))}
      input,select,textarea{font-size:16px!important}
      .tbtn,#topbar .tbtn{min-height:38px;padding:6px 11px}
      .toast{bottom:calc(70px + env(safe-area-inset-bottom))!important}
    }
    @media(max-width:600px){.topbar{padding:0 8px;gap:4px}.logo-link{font-size:0;gap:0}.divider-v,.page-badge,.cloud-badge,.ver-badge{display:none!important}.page-sub{display:none!important}.topbar-right{gap:2px}.tbtn{padding:4px 7px;font-size:.7rem}.topbar-nav{gap:1px;padding-left:5px;padding-right:4px}}`;
  document.head.appendChild(s);
})();

// SVG do logo figoo (folha)
const _FIGOO_LOGO = `<svg width="14" height="17" viewBox="0 0 22 26" fill="none">
  <path d="M11 23 C11 23 1 17 3 5 C8 2 11 13 11 23Z" fill="#C0DD97"/>
  <path d="M11 23 C11 23 21 17 19 5 C14 2 11 13 11 23Z" fill="#5EAD24" opacity="0.9"/>
  <circle cx="11" cy="25" r="2" fill="#8B6914"/>
</svg>`;

// ─── Navegação entre ferramentas ────────────────────────────

/** Detecta o id do módulo actual a partir do URL. */
function _getModuleId() {
  const path = window.location.pathname.toLowerCase();
  if (path.includes('tarefas'))   return 'tarefas';
  if (path.includes('notepad'))   return 'notas';
  if (path.includes('pagamentos')) return 'mensal';
  if (path.includes('pendencia')) return 'pendencias';
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
    { id: 'notas',      icon: '📝', label: 'Notas',      href: `notepad.html?e=${enc}` },
    { id: 'tarefas',    icon: '✓',  label: 'Tarefas',    href: `tarefas.html?e=${enc}` },
    { id: 'mensal',     icon: '💰', label: 'Mensal',     href: `pagamentos.html?e=${enc}` },
    { id: 'pendencias', icon: '📋', label: 'Pendências', href: `pendencias.html?e=${enc}` }
  ];
  return tools
    .filter(t => t.id !== currentId)
    .map(t => `<a href="${t.href}" class="tbtn" style="text-decoration:none;padding:5px 8px;display:inline-flex;align-items:center" title="${t.label}">${t.icon}</a>`)
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
    <a href="index.html" class="logo-link" title="Início · figoo" style="cursor:pointer" onclick="window.location.href='index.html'">
      ${_FIGOO_LOGO} figoo
    </a>
    <div class="divider-v"></div>
    ${badge ? `<div class="page-badge" style="background:${badgeColor}">${badge}</div>` : ''}
    <div class="page-meta">
      <div class="page-title" id="topbar-title">${module}</div>
      <div class="page-sub" id="topbar-email-sub">${email}</div>
    </div>
    <div class="topbar-right" id="topbar-right">
      <div class="cloud-badge" id="cloud-badge">●</div>
      ${version ? `<span class="ver-badge" id="ver-badge">${version}</span>` : ''}
      <div class="topbar-nav" style="display:flex;align-items:center;gap:3px;border-left:.5px solid var(--border,#E8EAED);padding-left:8px;margin-left:2px">${toolsNav}</div>
      ${extraButtons}
      ${onPassword
        ? `<button class="tbtn" id="btn-pw-mgmt" onclick="_figoo_pwBtn()" style="padding:5px 9px" title="Gerenciar senha">🔑</button>`
        : ''}
      <button class="tbtn" onclick="_figoo_logoutBtn()" style="padding:5px 9px" title="Sair">⏏</button>
    </div>`;

  window._figoo_logoutCb   = onLogout;
  window._figoo_passwordCb = onPassword;
}

function _figoo_logoutBtn()  { if (window._figoo_logoutCb)  window._figoo_logoutCb(); }
function _figoo_pwBtn()      { if (window._figoo_passwordCb) window._figoo_passwordCb(); }

/** Actualiza o sub-texto com o e-mail na topbar. */
function setTopbarEmail(email) {
  const el = document.getElementById('topbar-email-sub');
  if (el) el.textContent = email;
}

/** Define o estado do badge cloud ('online' | 'local' | ''). */
function setCloudBadge(state) {
  const el = document.getElementById('cloud-badge');
  if (!el) return;
  if (state === 'online') { el.textContent = '● nuvem'; el.className = 'cloud-badge online'; }
  else if (state === 'local') { el.textContent = '● local'; el.className = 'cloud-badge local'; }
  else { el.textContent = '●'; el.className = 'cloud-badge'; }
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
    <div style="background:#fff;border-radius:14px;padding:28px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);border:.5px solid #E0DDD5">
      <h3 style="font-size:1rem;font-weight:600;color:#1A2E0A;margin-bottom:5px">Recuperar senha</h3>
      <p style="font-size:.79rem;color:#5A6B4A;line-height:1.65;margin-bottom:18px">Informe o seu e-mail para receber um link de redefinição de senha.</p>
      <div style="margin-bottom:12px">
        <label style="font-size:.7rem;font-weight:500;color:#5A6B4A;display:block;margin-bottom:4px">E-mail</label>
        <input id="_fg_email" type="email" value="${email || ''}" placeholder="seu@email.com"
          style="width:100%;border:.5px solid #E0DDD5;border-radius:8px;padding:11px 13px;font-size:.9rem;font-family:inherit;outline:none;color:#1A2E0A;box-sizing:border-box"
          onkeydown="if(event.key==='Enter')_fgSend()" />
      </div>
      <div id="_fg_msg" style="font-size:.75rem;min-height:18px;margin-bottom:10px;color:#2D5016"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="this.closest('#_figoo_forgot_modal').remove()"
          style="padding:9px 16px;border:.5px solid #E0DDD5;border-radius:8px;background:none;color:#5A6B4A;font-size:.84rem;font-weight:500;cursor:pointer;font-family:inherit">
          Cancelar
        </button>
        <button id="_fg_btn" onclick="_fgSend()"
          style="padding:9px 20px;border:none;border-radius:8px;background:#2D5016;color:#fff;font-size:.84rem;font-weight:500;cursor:pointer;font-family:inherit">
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
    <div style="background:#fff;border-radius:14px;padding:28px;max-width:400px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);border:.5px solid #E0DDD5">
      <h3 style="font-size:1rem;font-weight:600;color:#1A2E0A;margin-bottom:5px">Nova senha</h3>
      <p style="font-size:.79rem;color:#5A6B4A;line-height:1.65;margin-bottom:18px">Crie uma nova senha para <strong>${email}</strong>.</p>
      <div style="margin-bottom:10px">
        <label style="font-size:.7rem;font-weight:500;color:#5A6B4A;display:block;margin-bottom:4px">Nova senha</label>
        <input id="_npw_pw1" type="password" placeholder="Mínimo 4 caracteres" autocomplete="new-password"
          style="width:100%;border:.5px solid #E0DDD5;border-radius:8px;padding:11px 13px;font-size:.9rem;font-family:inherit;outline:none;color:#1A2E0A;box-sizing:border-box"
          onkeydown="if(event.key==='Enter')document.getElementById('_npw_pw2').focus()" />
      </div>
      <div style="margin-bottom:12px">
        <label style="font-size:.7rem;font-weight:500;color:#5A6B4A;display:block;margin-bottom:4px">Confirmar senha</label>
        <input id="_npw_pw2" type="password" placeholder="Repita a senha" autocomplete="new-password"
          style="width:100%;border:.5px solid #E0DDD5;border-radius:8px;padding:11px 13px;font-size:.9rem;font-family:inherit;outline:none;color:#1A2E0A;box-sizing:border-box"
          onkeydown="if(event.key==='Enter')_npwSave()" />
      </div>
      <div id="_npw_msg" style="font-size:.75rem;min-height:18px;margin-bottom:10px;color:#C05050"></div>
      <button id="_npw_btn" onclick="_npwSave()" style="width:100%;padding:12px;border:none;border-radius:8px;background:#2D5016;color:#fff;font-size:.9rem;font-weight:500;cursor:pointer;font-family:inherit">
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
    tarefas:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8.5 12.2 2.4 2.4 4.8-5.2"/></svg>',
    notas:      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5h9L20 8.5V20.5a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 5 20.5v-16A1.5 1.5 0 0 1 6.5 3"/><path d="M14.5 3.5V9H20"/><path d="M8.5 13h7M8.5 17h5"/></svg>',
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
      { id: 'tarefas',    label: 'Tarefas',    href: 'tarefas.html' + q },
      { id: 'notas',      label: 'Notas',      href: 'notepad.html' + q },
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
