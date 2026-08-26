// figoo-fontsize.js — Tamanho do texto, partilhado por todas as páginas
// Portal figoo · v1.0 · 2026
// ─────────────────────────────────────────────────────────────
// Escolha persistida em localStorage + cookie de reserva + nuvem (mesmo
// mecanismo de figoo-theme.js): figoo_fontscale = '85' | '100' | '115' | '130'
//
// Como usar numa página: basta incluir <script src="figoo-fontsize.js"></script>
// no <head>. Todos os tamanhos do app usam `rem` (relativo à raiz), então
// mudar o font-size do <html> escala o app inteiro — nenhuma tela precisa
// de ajuste próprio.
// ─────────────────────────────────────────────────────────────
(function () {
  'use strict';

  var STEPS = [
    { v: '85',  label: 'A⁻' },
    { v: '100', label: 'A' },
    { v: '115', label: 'A⁺' },
    { v: '130', label: 'A⁺⁺' }
  ];
  var DEFAULT_SCALE = '100';

  // ── Persistência (mesmo esquema de figoo-theme.js) ────────
  function setCookie(n, v, days) {
    var d = new Date(); d.setTime(d.getTime() + (days || 365) * 864e5);
    document.cookie = n + '=' + encodeURIComponent(v) + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function getCookie(n) {
    var m = document.cookie.match('(?:^|; )' + n.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)');
    return m ? decodeURIComponent(m[1]) : '';
  }
  function remember(n, v) {
    try { localStorage.setItem(n, v); } catch (e) {}
    setCookie(n, v, 365);
  }
  function recall(n) {
    var v = '';
    try { v = localStorage.getItem(n) || ''; } catch (e) {}
    if (v) return v;
    v = getCookie(n);
    if (v) { try { localStorage.setItem(n, v); } catch (e) {} }
    return v;
  }
  function normScale(v) {
    return STEPS.some(function (s) { return s.v === v; }) ? v : DEFAULT_SCALE;
  }

  var curScale = normScale(recall('figoo_fontscale') || DEFAULT_SCALE);

  // ── Aplicação (pré-pintura, sem flash) ─────────────────────
  function applyScale() {
    document.documentElement.style.fontSize = curScale + '%';
  }
  applyScale();

  // ── Sincronização em nuvem (mesmo padrão de figoo-theme.js) ─
  function getUserEmailKey() {
    var email = (localStorage.getItem('figoo_email') || localStorage.getItem('figoo_last_email') || '').toLowerCase().trim();
    if (!email || !email.includes('@')) return null;
    if (window.emailToKey) return window.emailToKey(email);
    return email.replace(/[@.]/g, '_');
  }
  async function syncCloudSave() {
    var ek = getUserEmailKey();
    if (!ek || typeof window.fbSet !== 'function') return;
    try { await window.fbSet('figoo/' + ek + '/__fontscale_cfg', { scale: curScale, updatedAt: Date.now() }, 4000).catch(function () {}); } catch (e) {}
  }
  async function syncCloudLoad() {
    var ek = getUserEmailKey();
    if (!ek || typeof window.fbGet !== 'function') return;
    try {
      var cfg = await window.fbGet('figoo/' + ek + '/__fontscale_cfg', 4000).catch(function () { return null; });
      if (cfg && cfg.scale && normScale(cfg.scale) !== curScale) {
        curScale = normScale(cfg.scale);
        remember('figoo_fontscale', curScale);
        applyScale(); syncUI();
      }
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(syncCloudLoad, 500); });
  } else {
    setTimeout(syncCloudLoad, 500);
  }

  // ── API pública ─────────────────────────────────────────────
  function setScale(v) {
    curScale = normScale(v);
    remember('figoo_fontscale', curScale);
    applyScale(); syncUI();
    syncCloudSave();
  }
  window.figooFontSize = {
    setScale: setScale, openPicker: function (b) { togglePop(b); }, get scale() { return curScale; }
  };

  // ── Seletor (popover, reaproveita o CSS .fgt-* de figoo-theme.js) ──
  var popEl = null;

  function buildPop() {
    var pop = document.createElement('div');
    pop.className = 'fgt-pop'; pop.id = 'figoo-fontsize-pop'; pop.hidden = true;
    var seg = STEPS.map(function (s) {
      return '<button data-scale="' + s.v + '">' + s.label + '</button>';
    }).join('');
    pop.innerHTML =
      '<p class="fgt-title">Tamanho do texto</p>' +
      '<div class="fgt-seg">' + seg + '</div>';
    pop.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-scale]');
      if (b) setScale(b.getAttribute('data-scale'));
    });
    return pop;
  }

  function ensurePopBuilt() {
    if (!popEl) { popEl = buildPop(); document.body.appendChild(popEl); }
    return popEl;
  }

  function positionPop(btn) {
    ensurePopBuilt();
    var targetBtn = btn || document.getElementById('figoo-fontsize-btn');
    if (!targetBtn) return;
    var r = targetBtn.getBoundingClientRect();
    popEl.style.position = 'fixed';
    popEl.style.zIndex = '99999';
    popEl.style.top = (r.bottom + 8) + 'px';
    popEl.style.left = Math.max(8, r.right - 240) + 'px';
  }

  function openPop(btn) { ensurePopBuilt(); positionPop(btn); popEl.hidden = false; syncUI(); }
  function closePop() { if (popEl) popEl.hidden = true; }
  function togglePop(btn) {
    ensurePopBuilt();
    if (popEl.hidden) openPop(btn); else closePop();
  }

  function syncUI() {
    if (!popEl) return;
    popEl.querySelectorAll('[data-scale]').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-scale') === curScale);
    });
  }

  document.addEventListener('click', function (e) {
    if (popEl && !popEl.hidden && !popEl.contains(e.target) &&
      !(e.target.closest && e.target.closest('#figoo-fontsize-btn'))) closePop();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closePop(); });
  window.addEventListener('resize', closePop);
})();
