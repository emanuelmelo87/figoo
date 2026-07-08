// figoo-theme.js — Tema (claro/escuro) + Paletas de cor, partilhado por todas as páginas
// Portal figoo · v1.0 · 2026
// ─────────────────────────────────────────────────────────────
// Escolhas persistidas em COOKIE (path=/ → valem em todas as ferramentas):
//   figoo_theme    = 'light' | 'dark'
//   figoo_palette  = 'verde' | 'oliva' | 'pinho' | 'terracota' | 'ambar' | 'ameixa'
//
// Como usar numa página: basta incluir <script src="figoo-theme.js"></script> no <head>.
// O motor aplica o tema ANTES da pintura (sem flash) e monta sozinho o botão 🎨 na topbar/navbar.
// ─────────────────────────────────────────────────────────────
(function () {
  'use strict';

  // ── Cookies ───────────────────────────────────────────────
  function setCookie(n, v, days) {
    var d = new Date(); d.setTime(d.getTime() + (days || 365) * 864e5);
    document.cookie = n + '=' + encodeURIComponent(v) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function getCookie(n) {
    var m = document.cookie.match('(?:^|; )' + n.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }

  // ── Paletas (apenas tokens de MARCA — neutros vêm do tema) ─
  // Todas no mesmo tom terroso/natural do figoo: muted, orgânicas.
  var PALETTES = {
    verde:     { label: 'Verde',     primary: '#2D5016', secondary: '#5EAD24', light: '#C0DD97', accent: '#8B6914' },
    oliva:     { label: 'Oliva',     primary: '#41481C', secondary: '#8C9A2B', light: '#DBE2AE', accent: '#97701B' },
    pinho:     { label: 'Pinho',     primary: '#14463A', secondary: '#1E9B73', light: '#A9E0CD', accent: '#B07B2A' },
    terracota: { label: 'Terracota', primary: '#6F3320', secondary: '#C0613A', light: '#ECC4AC', accent: '#6E7B33' },
    ambar:     { label: 'Âmbar',     primary: '#6B4D12', secondary: '#C39419', light: '#ECD592', accent: '#7C6A2C' },
    ameixa:    { label: 'Ameixa',    primary: '#45284A', secondary: '#8E4585', light: '#DCC2D9', accent: '#8A6E1E' }
  };
  var PALETTE_ORDER = ['verde', 'oliva', 'pinho', 'terracota', 'ambar', 'ameixa'];

  function normTheme(t)   { return t === 'dark' ? 'dark' : 'light'; }
  function normPalette(p) { return PALETTES[p] ? p : 'verde'; }

  // ── Estado inicial (lido do cookie) ───────────────────────
  var curTheme   = normTheme(getCookie('figoo_theme'));
  var curPalette = normPalette(getCookie('figoo_palette'));

  // ── CSS injetado ──────────────────────────────────────────
  function paletteRule(key) {
    var p = PALETTES[key];
    // verde é o default da própria página; ainda assim emitimos para garantir consistência
    return ':root[data-palette="' + key + '"]{' +
      '--primary:' + p.primary + ';--secondary:' + p.secondary + ';--light:' + p.light + ';--accent:' + p.accent + ';}';
  }

  function buildCss() {
    var palettes = PALETTE_ORDER.map(paletteRule).join('\n');
    return [
      // ——— TEMA CLARO "app moderno": neutros frios/limpos (override do creme das páginas) ———
      ':root[data-theme="light"]{color-scheme:light;' +
        '--bg:#F6F7F9;--white:#FFFFFF;--border:#E8EAED;--text:#1B1F1D;--text2:#67716B;--radius:14px;}',
      // ——— TEMA ESCURO: neutros modernos ———
      ':root[data-theme="dark"]{color-scheme:dark;' +
        '--bg:#0F1115;--white:#171A1F;--border:#262B33;--text:#E7EAEE;--text2:#9AA3AD;--radius:14px;}',
      // ——— Bloco "modern" global ———
      'body{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}',
      'input,select,textarea,button{border-radius:10px;}',
      // realces de marca/erro tornam-se relativos aos tokens → seguem paleta E tema:
      ':root[data-theme="dark"] input,:root[data-theme="dark"] textarea,:root[data-theme="dark"] select{background:var(--white);color:var(--text);}',
      palettes,
      // ——— Botão + painel do seletor (auto-contido, prefixo .fgt-) ———
      '.fgt-btn{background:rgba(127,127,127,.08);border:.5px solid var(--border,#E8EAED);color:var(--text,#1B1F1D);padding:5px 9px;border-radius:8px;font-size:.71rem;line-height:1;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-family:inherit;transition:background .15s;flex-shrink:0;}',
      '.fgt-btn:hover{background:rgba(127,127,127,.16);}',
      '.fgt-pop{position:fixed;z-index:9000;width:230px;background:var(--white,#fff);border:.5px solid var(--border,#E0DDD5);border-radius:12px;box-shadow:0 14px 44px rgba(0,0,0,.22);padding:14px;font-family:inherit;color:var(--text,#1A2E0A);}',
      '.fgt-pop[hidden]{display:none;}',
      '.fgt-title{font-size:.64rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--text2,#5A6B4A);margin:0 0 7px;}',
      '.fgt-seg{display:flex;gap:6px;margin-bottom:14px;}',
      '.fgt-seg button{flex:1;padding:7px 6px;border:.5px solid var(--border,#E0DDD5);border-radius:8px;background:transparent;color:var(--text,#1A2E0A);font-size:.76rem;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;transition:all .14s;}',
      '.fgt-seg button.on{background:var(--primary,#2D5016);border-color:var(--primary,#2D5016);color:#fff;}',
      '.fgt-swatches{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;}',
      '.fgt-sw{position:relative;height:42px;border-radius:9px;border:2px solid transparent;cursor:pointer;padding:0;overflow:hidden;transition:transform .12s;}',
      '.fgt-sw:hover{transform:translateY(-1px);}',
      '.fgt-sw.on{border-color:var(--text,#1A2E0A);box-shadow:0 0 0 2px var(--white,#fff) inset;}',
      '.fgt-sw span{position:absolute;left:0;right:0;bottom:0;font-size:.58rem;text-align:center;color:#fff;background:rgba(0,0,0,.32);padding:1px 0;font-weight:500;}',
      '.fgt-sw .on-mark{position:absolute;top:3px;right:4px;font-size:.7rem;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5);}'
    ].join('\n');
  }

  function injectCss() {
    if (document.getElementById('figoo-theme-css')) return;
    var s = document.createElement('style');
    s.id = 'figoo-theme-css';
    s.textContent = buildCss();
    (document.head || document.documentElement).appendChild(s);
  }

  // ── Aplicação ─────────────────────────────────────────────
  function applyAttrs() {
    var r = document.documentElement;
    r.setAttribute('data-theme', curTheme);
    r.setAttribute('data-palette', curPalette);
  }

  // PRÉ-PINTURA: aplica já (atributos) + injeta CSS assim que o <head> existir
  applyAttrs();
  injectCss();

  // ── API pública ───────────────────────────────────────────
  function setTheme(t) {
    curTheme = normTheme(t);
    setCookie('figoo_theme', curTheme, 365);
    applyAttrs(); syncUI();
  }
  function setPalette(p) {
    curPalette = normPalette(p);
    setCookie('figoo_palette', curPalette, 365);
    applyAttrs(); syncUI();
  }
  function toggleTheme() { setTheme(curTheme === 'dark' ? 'light' : 'dark'); }

  window.figooTheme = {
    setTheme: setTheme, setPalette: setPalette, toggle: toggleTheme,
    get theme() { return curTheme; }, get palette() { return curPalette; },
    palettes: PALETTES, mount: mountPicker
  };

  // ── Seletor (botão 🎨 + painel) ───────────────────────────
  var popEl = null;

  function buildPicker() {
    var btn = document.createElement('button');
    btn.className = 'fgt-btn'; btn.id = 'figoo-theme-btn';
    btn.type = 'button'; btn.title = 'Tema e cores'; btn.innerHTML = '🎨<span class="tbtn-label">Tema</span>';
    btn.addEventListener('click', function (e) { e.stopPropagation(); togglePop(btn); });
    return btn;
  }

  function buildPop() {
    var pop = document.createElement('div');
    pop.className = 'fgt-pop'; pop.id = 'figoo-theme-pop'; pop.hidden = true;
    var sw = PALETTE_ORDER.map(function (k) {
      var p = PALETTES[k];
      return '<button class="fgt-sw" data-pal="' + k + '" title="' + p.label + '" ' +
        'style="background:linear-gradient(135deg,' + p.primary + ' 0 50%,' + p.secondary + ' 50% 100%)">' +
        '<i class="on-mark">✓</i><span>' + p.label + '</span></button>';
    }).join('');
    pop.innerHTML =
      '<p class="fgt-title">Tema</p>' +
      '<div class="fgt-seg">' +
        '<button data-theme="light">☀️ Claro</button>' +
        '<button data-theme="dark">🌙 Escuro</button>' +
      '</div>' +
      '<p class="fgt-title">Cor</p>' +
      '<div class="fgt-swatches">' + sw + '</div>';
    pop.addEventListener('click', function (e) {
      // NB: usa 'button[...]' — senão closest sobe até <html data-theme=...> e captura tudo
      var b = e.target.closest('button[data-theme]'); if (b) { setTheme(b.getAttribute('data-theme')); return; }
      var s = e.target.closest('button[data-pal]');   if (s) { setPalette(s.getAttribute('data-pal')); }
    });
    return pop;
  }

  function positionPop(btn) {
    var r = btn.getBoundingClientRect();
    popEl.style.top = (r.bottom + 8) + 'px';
    var left = r.right - 230;
    popEl.style.left = Math.max(8, left) + 'px';
  }
  function openPop(btn)  { positionPop(btn); popEl.hidden = false; syncUI(); }
  function closePop()    { if (popEl) popEl.hidden = true; }
  function togglePop(btn){ if (!popEl) return; popEl.hidden ? openPop(btn) : closePop(); }

  function syncUI() {
    if (!popEl) return;
    popEl.querySelectorAll('[data-theme]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-theme') === curTheme);
    });
    popEl.querySelectorAll('[data-pal]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-pal') === curPalette);
    });
  }

  function findHost() {
    return document.querySelector('.topbar-right') ||
           document.querySelector('.nav-right') ||
           document.querySelector('.navbar') || null;
  }

  function mountPicker() {
    if (document.getElementById('figoo-theme-btn')) return true;
    var host = findHost();
    if (!host) return false;
    var btn = buildPicker();
    if (host.classList.contains('topbar-right')) host.insertBefore(btn, host.firstChild);
    else host.appendChild(btn);
    if (!popEl) { popEl = buildPop(); document.body.appendChild(popEl); }
    syncUI();
    return true;
  }

  // Fecha o painel ao clicar fora / Esc / rolar / redimensionar
  document.addEventListener('click', function (e) {
    if (popEl && !popEl.hidden && !popEl.contains(e.target) &&
        !(e.target.closest && e.target.closest('#figoo-theme-btn'))) closePop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
  window.addEventListener('resize', closePop);

  // Monta assim que a topbar/navbar existir; re-monta se for reconstruída
  // (ex.: pendencias.html usa renderTopbar() que recria o #topbar após o load).
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountPicker);
  } else {
    mountPicker();
  }
  try {
    var mo = new MutationObserver(function () {
      if (!document.getElementById('figoo-theme-btn')) mountPicker();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
