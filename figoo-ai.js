// figoo-ai.js — Assistente de escrita (Gemini / Claude / ChatGPT) para o figoo
// ─────────────────────────────────────────────────────────────
// Config no localStorage (figoo_ai_cfg): { provider, gemini:{key,model}, claude:{key,model}, openai:{key,model} }
// As chaves ficam SÓ neste navegador e são enviadas por header (nunca na URL).
//
// API pública:
//   figooAI.configModal()                     — abre as configurações
//   figooAI.improveEditor(el, sanitize)       — sugere reescrita p/ um contenteditable
//   figooAI.improveText(html, onApply, san)   — sugere reescrita p/ um texto qualquer
(function () {
  'use strict';

  var LS_KEY = 'figoo_ai_cfg';

  var PROVIDERS = {
    gemini: {
      label: 'Gemini (Google)',
      models: ['gemini-flash-latest', 'gemini-pro-latest'],
      keyHint: 'AIza…',
      keyUrl: 'https://aistudio.google.com/apikey',
      keyUrlLabel: 'aistudio.google.com/apikey (tem cota gratuita)'
    },
    claude: {
      label: 'Claude (Anthropic)',
      models: ['claude-opus-4-8', 'claude-sonnet-5', 'claude-haiku-4-5'],
      keyHint: 'sk-ant-…',
      keyUrl: 'https://console.anthropic.com/settings/keys',
      keyUrlLabel: 'console.anthropic.com'
    },
    openai: {
      label: 'ChatGPT (OpenAI)',
      models: ['gpt-5.1', 'gpt-5-mini', 'gpt-4o-mini'],
      keyHint: 'sk-…',
      keyUrl: 'https://platform.openai.com/api-keys',
      keyUrlLabel: 'platform.openai.com'
    }
  };

  function getCfg() {
    var c;
    try { c = JSON.parse(localStorage.getItem(LS_KEY)) || {}; } catch (e) { c = {}; }
    // migração do formato antigo (só Gemini): {model,key} → {provider:'gemini',gemini:{...}}
    if (c.key && !c.provider) c = { provider: 'gemini', gemini: { key: c.key, model: c.model } };
    if (!c.provider) c.provider = 'gemini';
    // modelos Gemini aposentados p/ contas novas → alias rolante equivalente
    if (c.gemini && /^gemini-2\.\d-(flash|pro)/.test(c.gemini.model || '')) {
      c.gemini.model = c.gemini.model.indexOf('pro') >= 0 ? 'gemini-pro-latest' : 'gemini-flash-latest';
    }
    return c;
  }
  function setCfg(c) { localStorage.setItem(LS_KEY, JSON.stringify(c)); }
  function activeCred(cfg) {
    var p = cfg.provider;
    var sub = cfg[p] || {};
    return { provider: p, key: sub.key || '', model: sub.model || PROVIDERS[p].models[0] };
  }

  // ── Chamadas por provedor ─────────────────────────────────
  function callGemini(cred, prompt) {
    return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(cred.model) + ':generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cred.key },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    }).then(okJson).then(function (j) {
      var t = j && j.candidates && j.candidates[0] && j.candidates[0].content &&
              j.candidates[0].content.parts && j.candidates[0].content.parts[0] &&
              j.candidates[0].content.parts[0].text;
      if (!t) throw new Error('Resposta vazia da IA.');
      return t;
    });
  }

  function callClaude(cred, prompt) {
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cred.key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({ model: cred.model, max_tokens: 2048, messages: [{ role: 'user', content: prompt }] })
    }).then(okJson).then(function (j) {
      if (j.stop_reason === 'refusal') throw new Error('A IA recusou esta solicitação.');
      var t = '';
      (j.content || []).forEach(function (b) { if (b.type === 'text') t += b.text; });
      if (!t) throw new Error('Resposta vazia da IA.');
      return t;
    });
  }

  function callOpenAI(cred, prompt) {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + cred.key },
      body: JSON.stringify({ model: cred.model, messages: [{ role: 'user', content: prompt }] })
    }).then(okJson).then(function (j) {
      var t = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (!t) throw new Error('Resposta vazia da IA.');
      return t;
    });
  }

  // ── Listagem de modelos disponíveis (por chave) ───────────
  function listModels(provider, key) {
    if (provider === 'gemini') {
      return fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', {
        headers: { 'x-goog-api-key': key }
      }).then(okJson).then(function (j) {
        return (j.models || [])
          .filter(function (m) { return (m.supportedGenerationMethods || []).indexOf('generateContent') >= 0; })
          .map(function (m) { return m.name.replace(/^models\//, ''); })
          .filter(function (id) { return !/embedding|imagen|veo|tts|audio|image|live/i.test(id); });
      });
    }
    if (provider === 'claude') {
      return fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      }).then(okJson).then(function (j) {
        return (j.data || []).map(function (m) { return m.id; });
      });
    }
    // openai
    return fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': 'Bearer ' + key }
    }).then(okJson).then(function (j) {
      return (j.data || []).map(function (m) { return m.id; })
        .filter(function (id) { return /^(gpt|o\d)/.test(id) && !/audio|realtime|image|tts|transcribe|embedding|moderation|search|instruct/i.test(id); })
        .sort().reverse();
    });
  }

  // ── Webhook (Google Chat) ─────────────────────────────────
  function notifyChat(url, text) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({ text: text })
    }).then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return true; });
  }

  function okJson(r) {
    if (!r.ok) return r.json().catch(function () { return {}; }).then(function (j) {
      var m = (j.error && (j.error.message || j.error.type)) || ('HTTP ' + r.status);
      throw new Error(m);
    });
    return r.json();
  }

  function callAI(prompt) {
    var cred = activeCred(getCfg());
    if (!cred.key) return Promise.reject(new Error('no-key'));
    var fn = { gemini: callGemini, claude: callClaude, openai: callOpenAI }[cred.provider];
    return fn(cred, prompt).then(function (t) {
      // remove cercas de markdown se vierem
      return t.replace(/^\s*```(?:html)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    });
  }

  function rewritePrompt(html, instruction) {
    return 'Reescreva o texto abaixo de forma mais clara, objetiva e bem escrita, ' +
      'mantendo o idioma original (português), o significado e o tom de registro de pendência/tarefa. ' +
      'Preserve a formatação HTML simples se houver (b, strong, ul, ol, li, br) e a estrutura de listas. ' +
      'Não invente informações novas. ' +
      (instruction ? 'Siga também este pedido do usuário: ' + instruction + '. ' : '') +
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

  // ── Modal de configurações ────────────────────────────────
  function configModal(onSaved) {
    var cfg = getCfg();
    var ov = overlay('_figoo_ai_cfg', [
      '<h3 style="font-size:1rem;font-weight:600;color:var(--text,#1B1F1D);margin:0 0 5px">⚙ Configurações</h3>',
      '<p style="font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text2,#67716B);margin:16px 0 8px">✨ Assistente de IA</p>',
      '<p style="font-size:.78rem;color:var(--text2,#67716B);line-height:1.6;margin:0 0 14px">Escolha a IA e informe a chave de API. A chave fica salva apenas neste navegador.</p>',
      '<div style="margin-bottom:12px"><label style="' + LBL + '">Provedor</label>',
      '<select id="_ai_provider" style="' + INP + ';cursor:pointer">',
      Object.keys(PROVIDERS).map(function (p) {
        return '<option value="' + p + '"' + (cfg.provider === p ? ' selected' : '') + '>' + PROVIDERS[p].label + '</option>';
      }).join(''),
      '</select></div>',
      '<div style="margin-bottom:12px"><label style="' + LBL + '">Chave de API</label>',
      '<input id="_ai_key" type="password" style="' + INP + '" autocomplete="off">',
      '<div id="_ai_keyhelp" style="font-size:.72rem;color:var(--text2,#67716B);margin-top:5px"></div></div>',
      '<div style="margin-bottom:14px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">',
      '<label style="' + LBL + ';margin-bottom:0">Modelo</label>',
      '<button id="_ai_refresh" type="button" style="background:none;border:none;color:var(--secondary,#5EAD24);font-size:.72rem;font-weight:500;cursor:pointer;font-family:inherit;padding:0">↻ Buscar modelos da API</button>',
      '</div><select id="_ai_model" style="' + INP + ';cursor:pointer"></select></div>',
      '<hr style="border:none;border-top:0.5px solid var(--border,#E8EAED);margin:18px 0">',
      '<p style="font-size:.68rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--text2,#67716B);margin:0 0 8px">🔔 Alertas · Google Chat</p>',
      '<p style="font-size:.78rem;color:var(--text2,#67716B);line-height:1.6;margin:0 0 10px">Cole a URL do webhook do seu espaço para receber o resumo diário de vencimentos ao abrir. Fica salva só neste navegador.</p>',
      '<input id="_ai_webhook" type="password" placeholder="https://chat.googleapis.com/v1/spaces/…" style="' + INP + '" autocomplete="off">',
      '<div style="display:flex;justify-content:flex-end;margin-top:8px"><button id="_ai_webhook_test" style="' + BTN_S + '">Testar envio</button></div>',
      '<div id="_ai_msg" style="font-size:.75rem;min-height:18px;margin:12px 0;color:var(--text2,#67716B)"></div>',
      '<div style="display:flex;gap:8px;justify-content:flex-end">',
      '<button style="' + BTN_S + '" onclick="document.getElementById(\'_figoo_ai_cfg\').remove()">Cancelar</button>',
      '<button id="_ai_test" style="' + BTN_S + '">Testar IA</button>',
      '<button id="_ai_save" style="' + BTN_P + '">Salvar</button>',
      '</div>'
    ].join(''));
    ov.querySelector('#_ai_webhook').value = cfg.chatWebhook || '';

    var selP = ov.querySelector('#_ai_provider');
    var inpK = ov.querySelector('#_ai_key');
    var selM = ov.querySelector('#_ai_model');
    var help = ov.querySelector('#_ai_keyhelp');
    var msg = ov.querySelector('#_ai_msg');

    var curP = cfg.provider; // provedor cujos campos estão no formulário agora

    function fillForm() {
      curP = selP.value;
      var meta = PROVIDERS[curP], sub = cfg[curP] || {};
      inpK.value = sub.key || '';
      inpK.placeholder = meta.keyHint;
      selM.innerHTML = meta.models.map(function (m) {
        return '<option value="' + m + '"' + ((sub.model || meta.models[0]) === m ? ' selected' : '') + '>' + m + '</option>';
      }).join('');
      help.innerHTML = 'Crie/copie sua chave em <a href="' + meta.keyUrl + '" target="_blank" rel="noopener" style="color:var(--secondary,#5EAD24)">' + meta.keyUrlLabel + '</a>.';
      msg.textContent = '';
    }
    function readForm() {
      cfg[curP] = { key: inpK.value.trim(), model: selM.value }; // campos pertencem a curP
      cfg.provider = selP.value;
      cfg.chatWebhook = (ov.querySelector('#_ai_webhook').value || '').trim();
      return cfg;
    }
    ov.querySelector('#_ai_webhook_test').addEventListener('click', function () {
      var wh = ov.querySelector('#_ai_webhook').value.trim();
      if (!wh) { msg.style.color = '#C05050'; msg.textContent = 'Cole a URL do webhook primeiro.'; return; }
      msg.style.color = 'var(--text2,#67716B)'; msg.textContent = 'Enviando teste…';
      notifyChat(wh, '🔔 figoo — teste de alerta (webhook configurado ✓)').then(function () {
        msg.style.color = 'var(--secondary,#5EAD24)'; msg.textContent = '✓ Enviado! Confira no Google Chat.';
      }).catch(function (e) { msg.style.color = '#C05050'; msg.textContent = 'Falhou: ' + e.message; });
    });
    selP.addEventListener('change', function () { readForm(); fillForm(); });
    fillForm();

    ov.querySelector('#_ai_refresh').addEventListener('click', function () {
      var key = inpK.value.trim();
      if (!key) { msg.style.color = '#C05050'; msg.textContent = 'Informe a chave primeiro.'; return; }
      msg.style.color = 'var(--text2,#67716B)'; msg.textContent = 'Buscando modelos…';
      var wanted = selM.value;
      listModels(curP, key).then(function (ids) {
        if (!ids.length) throw new Error('nenhum modelo retornado');
        selM.innerHTML = ids.map(function (m) {
          return '<option value="' + m + '"' + (m === wanted ? ' selected' : '') + '>' + m + '</option>';
        }).join('');
        msg.style.color = 'var(--secondary,#5EAD24)';
        msg.textContent = '✓ ' + ids.length + ' modelos disponíveis para esta chave.';
      }).catch(function (e) {
        msg.style.color = '#C05050'; msg.textContent = 'Falhou: ' + e.message;
      });
    });

    ov.querySelector('#_ai_test').addEventListener('click', function () {
      setCfg(readForm());
      if (!activeCred(cfg).key) { msg.style.color = '#C05050'; msg.textContent = 'Informe a chave primeiro.'; return; }
      msg.style.color = 'var(--text2,#67716B)'; msg.textContent = 'Testando…';
      callAI('Responda apenas: ok').then(function () {
        msg.style.color = 'var(--secondary,#5EAD24)'; msg.textContent = '✓ Funcionando!';
      }).catch(function (e) {
        msg.style.color = '#C05050'; msg.textContent = 'Falhou: ' + e.message;
      });
    });
    ov.querySelector('#_ai_save').addEventListener('click', function () {
      setCfg(readForm());
      if (!activeCred(cfg).key) { msg.style.color = '#C05050'; msg.textContent = 'Informe a chave.'; return; }
      ov.remove();
      if (onSaved) onSaved();
    });
  }

  // ── Modal de sugestão (genérico) ──────────────────────────
  function improveText(originalHtml, onApply, sanitize) {
    var plain = (function () { var d = document.createElement('div'); d.innerHTML = originalHtml; return (d.textContent || '').trim(); })();
    if (!plain) { alert('Escreva algo primeiro — a IA reescreve o texto existente.'); return; }
    if (!activeCred(getCfg()).key) { configModal(function () { improveText(originalHtml, onApply, sanitize); }); return; }

    var ov = overlay('_figoo_ai_sug', [
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">',
      '<h3 style="font-size:1rem;font-weight:600;color:var(--text,#1B1F1D);margin:0;flex:1">✨ Sugestão da IA</h3>',
      '<button title="Configurações" style="' + BTN_S + ';padding:5px 9px" onclick="figooAI.configModal()">⚙</button>',
      '</div>',
      '<div id="_ai_out" style="border:.5px solid var(--border,#E8EAED);border-radius:10px;padding:12px 14px;font-size:.88rem;line-height:1.55;color:var(--text,#1B1F1D);background:var(--bg,#F6F7F9);min-height:70px;margin-bottom:12px">Gerando sugestão…</div>',
      '<div style="display:flex;gap:8px;margin-bottom:14px">',
      '<input id="_ai_instr" style="' + INP + ';flex:1" placeholder="Pedido para a IA… (ex.: mais formal, resuma em tópicos)">',
      '<button id="_ai_apply_instr" style="' + BTN_S + ';flex-shrink:0" title="Gerar de novo com este pedido">➤</button>',
      '</div>',
      '<div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">',
      '<button style="' + BTN_S + '" onclick="document.getElementById(\'_figoo_ai_sug\').remove()">Cancelar</button>',
      '<button id="_ai_retry" style="' + BTN_S + '" disabled>↻ Tentar de novo</button>',
      '<button id="_ai_use" style="' + BTN_P + '" disabled>Usar sugestão</button>',
      '</div>'
    ].join(''), 560);

    var out = ov.querySelector('#_ai_out');
    var btnUse = ov.querySelector('#_ai_use');
    var btnRetry = ov.querySelector('#_ai_retry');
    var inpInstr = ov.querySelector('#_ai_instr');
    var suggestion = '';

    function run() {
      btnUse.disabled = true; btnRetry.disabled = true;
      out.textContent = 'Gerando sugestão…';
      callAI(rewritePrompt(originalHtml, inpInstr.value.trim())).then(function (t) {
        suggestion = sanitize ? sanitize(t) : t;
        out.innerHTML = suggestion;
        btnUse.disabled = false; btnRetry.disabled = false;
      }).catch(function (e) {
        out.textContent = (e.message === 'no-key') ? 'Configure a chave de API (⚙).' : 'Erro: ' + e.message;
        btnRetry.disabled = false;
      });
    }
    btnRetry.addEventListener('click', run);
    ov.querySelector('#_ai_apply_instr').addEventListener('click', run);
    inpInstr.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    btnUse.addEventListener('click', function () {
      ov.remove();
      onApply(suggestion);
    });
    run();
  }

  function improveEditor(el, sanitize) {
    if (!el) return;
    improveText(el.innerHTML, function (html) { el.innerHTML = html; el.focus(); }, sanitize);
  }

  window.figooAI = {
    configModal: configModal, improveEditor: improveEditor, improveText: improveText,
    getChatWebhook: function () { return getCfg().chatWebhook || ''; },
    notifyChat: function (text) { var wh = getCfg().chatWebhook; return wh ? notifyChat(wh, text) : Promise.reject(new Error('sem webhook')); }
  };
})();
