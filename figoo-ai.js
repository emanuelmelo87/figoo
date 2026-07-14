// figoo-ai.js — Assistente de escrita (Gemini) para os editores do figoo
// ─────────────────────────────────────────────────────────────
// Config no localStorage (figoo_ai_cfg): { model, key }
// A chave fica SÓ neste navegador e é enviada por header (nunca na URL).
//
// API pública:
//   figooAI.configModal()                 — abre a configuração
//   figooAI.improveEditor(el, sanitize)   — sugere reescrita p/ um contenteditable
(function () {
  'use strict';

  var LS_KEY = 'figoo_ai_cfg';
  var MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'];

  function getCfg() {
    try { return JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { return {}; }
  }
  function setCfg(c) { localStorage.setItem(LS_KEY, JSON.stringify(c)); }

  // ── Chamada Gemini ────────────────────────────────────────
  function callGemini(prompt) {
    var cfg = getCfg();
    if (!cfg.key) return Promise.reject(new Error('no-key'));
    var model = cfg.model || MODELS[0];
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }).then(function (r) {
      if (!r.ok) return r.json().catch(function(){return {};}).then(function (j) {
        throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
      });
      return r.json();
    }).then(function (j) {
      var t = j && j.candidates && j.candidates[0] && j.candidates[0].content &&
              j.candidates[0].content.parts && j.candidates[0].content.parts[0] &&
              j.candidates[0].content.parts[0].text;
      if (!t) throw new Error('Resposta vazia da IA.');
      // remove cercas de markdown se vierem
      return t.replace(/^\s*```(?:html)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    });
  }

  function rewritePrompt(html) {
    return 'Reescreva o texto abaixo de forma mais clara, objetiva e bem escrita, ' +
      'mantendo o idioma original (português), o significado e o tom de registro de pendência/tarefa. ' +
      'Preserve a formatação HTML simples se houver (b, strong, ul, ol, li, br) e a estrutura de listas. ' +
      'Não invente informações novas. ' +
      'Responda APENAS com o texto/HTML reescrito, sem comentários, sem markdown, sem aspas.\n\n' + html;
  }

  // ── UI base ───────────────────────────────────────────────
  function overlay(id, inner, maxw) {
    var old = document.getElementById(id); if (old) old.remove();
    var ov = document.createElement('div');
    ov.id = id;
    ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9500;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';
    ov.innerHTML = '<div style="background:var(--white,#fff);border-radius:14px;padding:24px;max-width:' + (maxw || 460) + 'px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.2);border:.5px solid var(--border,#E8EAED);max-height:85vh;overflow-y:auto">' + inner + '</div>';
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
    return ov;
  }
  var LBL = 'font-size:.7rem;font-weight:500;color:var(--text2,#67716B);display:block;margin-bottom:4px';
  var INP = 'width:100%;border:.5px solid var(--border,#E8EAED);border-radius:8px;padding:10px 12px;font-size:.88rem;font-family:inherit;outline:none;color:var(--text,#1B1F1D);background:var(--white,#fff);box-sizing:border-box';
  var BTN_P = 'padding:9px 18px;border:none;border-radius:8px;background:var(--primary,#2D5016);color:#fff;font-size:.84rem;font-weight:500;cursor:pointer;font-family:inherit';
  var BTN_S = 'padding:9px 14px;border:.5px solid var(--border,#E8EAED);border-radius:8px;background:none;color:var(--text2,#67716B);font-size:.84rem;font-weight:500;cursor:pointer;font-family:inherit';

  // ── Modal de configuração ─────────────────────────────────
  function configModal(onSaved) {
    var cfg = getCfg();
    var opts = MODELS.map(function (m) {
      return '<option value="' + m + '"' + ((cfg.model || MODELS[0]) === m ? ' selected' : '') + '>' + m + '</option>';
    }).join('');
    var ov = overlay('_figoo_ai_cfg', [
      '<h3 style="font-size:1rem;font-weight:600;color:var(--text,#1B1F1D);margin:0 0 5px">✨ Assistente de IA</h3>',
      '<p style="font-size:.78rem;color:var(--text2,#67716B);line-height:1.6;margin:0 0 16px">Usa o Google Gemini para sugerir melhorias de texto. Crie/copie sua chave gratuita em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener" style="color:var(--secondary,#5EAD24)">aistudio.google.com/apikey</a>. A chave fica salva apenas neste navegador.</p>',
      '<div style="margin-bottom:12px"><label style="' + LBL + '">Chave de API (Gemini)</label>',
      '<input id="_ai_key" type="password" placeholder="AIza…" value="' + (cfg.key || '') + '" style="' + INP + '" autocomplete="off"></div>',
      '<div style="margin-bottom:14px"><label style="' + LBL + '">Modelo</label>',
      '<select id="_ai_model" style="' + INP + ';cursor:pointer">' + opts + '</select></div>',
      '<div id="_ai_msg" style="font-size:.75rem;min-height:18px;margin-bottom:12px;color:var(--text2,#67716B)"></div>',
      '<div style="display:flex;gap:8px;justify-content:flex-end">',
      '<button style="' + BTN_S + '" onclick="document.getElementById(\'_figoo_ai_cfg\').remove()">Cancelar</button>',
      '<button id="_ai_test" style="' + BTN_S + '">Testar</button>',
      '<button id="_ai_save" style="' + BTN_P + '">Salvar</button>',
      '</div>'
    ].join(''));

    function readForm() {
      return { key: document.getElementById('_ai_key').value.trim(), model: document.getElementById('_ai_model').value };
    }
    var msg = ov.querySelector('#_ai_msg');
    ov.querySelector('#_ai_test').addEventListener('click', function () {
      var f = readForm();
      if (!f.key) { msg.textContent = 'Informe a chave primeiro.'; return; }
      setCfg(f); msg.textContent = 'Testando…';
      callGemini('Responda apenas: ok').then(function () {
        msg.style.color = 'var(--secondary,#5EAD24)'; msg.textContent = '✓ Funcionando!';
      }).catch(function (e) {
        msg.style.color = '#C05050'; msg.textContent = 'Falhou: ' + e.message;
      });
    });
    ov.querySelector('#_ai_save').addEventListener('click', function () {
      var f = readForm();
      if (!f.key) { msg.textContent = 'Informe a chave.'; return; }
      setCfg(f); ov.remove();
      if (onSaved) onSaved();
    });
  }

  // ── Modal de sugestão ─────────────────────────────────────
  function improveEditor(el, sanitize) {
    if (!el) return;
    var original = el.innerHTML;
    var plain = (el.textContent || '').trim();
    if (!plain) { alert('Escreva algo primeiro — a IA reescreve o texto existente.'); return; }
    if (!getCfg().key) { configModal(function () { improveEditor(el, sanitize); }); return; }

    var ov = overlay('_figoo_ai_sug', [
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">',
      '<h3 style="font-size:1rem;font-weight:600;color:var(--text,#1B1F1D);margin:0;flex:1">✨ Sugestão da IA</h3>',
      '<button title="Configurar IA" style="' + BTN_S + ';padding:5px 9px" onclick="figooAI.configModal()">⚙</button>',
      '</div>',
      '<div id="_ai_out" style="border:.5px solid var(--border,#E8EAED);border-radius:10px;padding:12px 14px;font-size:.88rem;line-height:1.55;color:var(--text,#1B1F1D);background:var(--bg,#F6F7F9);min-height:70px;margin-bottom:14px">Gerando sugestão…</div>',
      '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">',
      '<button style="' + BTN_S + '" onclick="document.getElementById(\'_figoo_ai_sug\').remove()">Cancelar</button>',
      '<button id="_ai_retry" style="' + BTN_S + '" disabled>↻ Tentar de novo</button>',
      '<button id="_ai_use" style="' + BTN_P + '" disabled>Usar sugestão</button>',
      '</div>'
    ].join(''), 560);

    var out = ov.querySelector('#_ai_out');
    var btnUse = ov.querySelector('#_ai_use');
    var btnRetry = ov.querySelector('#_ai_retry');
    var suggestion = '';

    function run() {
      btnUse.disabled = true; btnRetry.disabled = true;
      out.textContent = 'Gerando sugestão…';
      callGemini(rewritePrompt(original)).then(function (t) {
        suggestion = sanitize ? sanitize(t) : t;
        out.innerHTML = suggestion;
        btnUse.disabled = false; btnRetry.disabled = false;
      }).catch(function (e) {
        out.textContent = (e.message === 'no-key') ? 'Configure a chave de API (⚙).' : 'Erro: ' + e.message;
        btnRetry.disabled = false;
      });
    }
    btnRetry.addEventListener('click', run);
    btnUse.addEventListener('click', function () {
      el.innerHTML = suggestion;
      ov.remove();
      el.focus();
    });
    run();
  }

  window.figooAI = { configModal: configModal, improveEditor: improveEditor };
})();
