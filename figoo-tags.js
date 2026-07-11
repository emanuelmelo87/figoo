// figoo-tags.js — Gestor de tags partilhado entre todas as ferramentas
// Portal figoo · v1.0 · 2026-05
// ─────────────────────────────────────────────────────────────
// Requer: figoo-auth.js (fbGet, fbSet, emailToKey)
//
// Firebase path único: figoo/${ek}/__tags
// Estrutura de uma tag: { id, name, color, createdAt }
//
// Funções públicas:
//   loadTags(ek) → Promise<tags{}>
//   saveTags(ek, tags)
//   buildTagChipsHtml(tags, tagIds) → string HTML
//   renderTagFilterBar(container, tags, activeTag, onChangeFn)
//   renderTagPicker(container, tags, selectedIds, onToggleFn)
//   openTagsModal(ek, tags, onSave)

// ─── Paleta de 8 cores ───────────────────────────────────────
const TAG_PALETA = [
  '#2D5016', '#5EAD24', '#8B6914', '#065F46',
  '#1D4ED8', '#7C3AED', '#BE185D', '#C0392B'
];

// Injeta CSS de chips de tags (uma vez)
(function _injectTagCSS() {
  if (document.getElementById('_figoo_tag_css')) return;
  const s = document.createElement('style');
  s.id = '_figoo_tag_css';
  s.textContent = `
    .tag-chip{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:99px;font-size:.71rem;font-weight:500;border:0.5px solid transparent;white-space:nowrap}
    .tag-chip .tc-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0}
    .qadd-tag-chip{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:99px;border:0.5px solid;font-size:.73rem;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s;background:none}
    .qadd-tag-chip.selected{font-weight:600}
    .qadd-tag-chip .tc-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
    .tag-fchip{padding:4px 11px;border:0.5px solid var(--border,#E0DDD5);border-radius:99px;background:none;color:var(--text2,#5A6B4A);font-size:.73rem;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:5px}
    .tag-fchip:hover{border-color:var(--secondary,#5EAD24);color:var(--primary,#2D5016);background:#F0FAF0}
    .tag-fchip.active{background:var(--primary,#2D5016);border-color:var(--primary,#2D5016);color:#fff}
    .tfc-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  `;
  document.head.appendChild(s);
})();

function _escT(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ═══════════════════════════════════════════════════════════════
//  LOAD / SAVE  (nomes prefixados para evitar conflito com páginas)
// ═══════════════════════════════════════════════════════════════

/** Carrega tags do Firebase (com fallback localStorage). */
async function loadFigooTags(ek) {
  const cache = localStorage.getItem(`figoo_tags_${ek}`);
  let tags = {};
  if (cache) { try { tags = JSON.parse(cache); } catch (e) { tags = {}; } }
  try {
    const d = await fbGet(`figoo/${ek}/__tags`, 5000);
    if (d && typeof d === 'object') {
      tags = d;
      localStorage.setItem(`figoo_tags_${ek}`, JSON.stringify(d));
    }
  } catch (e) { /* usa cache */ }
  return tags;
}

/** Guarda tags no localStorage e no Firebase (background). */
async function saveFigooTags(ek, tags) {
  localStorage.setItem(`figoo_tags_${ek}`, JSON.stringify(tags));
  fbSet(`figoo/${ek}/__tags`, tags).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════
//  RENDER HELPERS
// ═══════════════════════════════════════════════════════════════

/** Gera string HTML com chips de tags para uso em listas. */
function buildTagChipsHtml(tags, tagIds) {
  if (!tagIds || !tags) return '';
  const ids = Array.isArray(tagIds) ? tagIds : Object.values(tagIds || {});
  return ids
    .filter(id => tags[id])
    .map(id => {
      const t = tags[id];
      return `<span class="tag-chip" style="background:${t.color}1A;color:${t.color};border-color:${t.color}55"><span class="tc-dot" style="background:${t.color}"></span>${_escT(t.name)}</span>`;
    })
    .join('');
}

/**
 * Renderiza barra de filtro por tag num container.
 * @param {HTMLElement} container
 * @param {object} tags  — mapa { id: {id,name,color} }
 * @param {string|null} activeTag
 * @param {string} onChangeFnName — nome da função global a chamar com o id (ou null)
 */
function renderTagFilterBar(container, tags, activeTag, onChangeFnName) {
  const keys = Object.keys(tags || {});
  if (!keys.length) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  container.innerHTML =
    `<button class="tag-fchip${!activeTag ? ' active' : ''}" onclick="${onChangeFnName}(null)">Todas</button>` +
    keys.map(id => {
      const t = tags[id], sel = activeTag === id;
      return `<button class="tag-fchip${sel ? ' active' : ''}" onclick="${onChangeFnName}('${id}')"><div class="tfc-dot" style="background:${sel ? 'rgba(255,255,255,0.8)' : t.color}"></div>${_escT(t.name)}</button>`;
    }).join('');
}

/**
 * Renderiza picker de tags (seleção múltipla) num container.
 * @param {HTMLElement} container
 * @param {object} tags
 * @param {string[]} selectedIds
 * @param {string} onToggleFnName — nome da função global a chamar com o id
 */
function renderTagPicker(container, tags, selectedIds, onToggleFnName) {
  const keys = Object.keys(tags || {});
  if (!keys.length) { container.style.display = 'none'; return; }
  container.style.display = 'flex';
  container.style.flexWrap = 'wrap';
  container.style.gap = '5px';
  container.innerHTML = keys.map(id => {
    const t = tags[id], sel = selectedIds.includes(id);
    return `<button class="qadd-tag-chip${sel ? ' selected' : ''}" onclick="${onToggleFnName}('${id}')" style="border-color:${t.color};color:${t.color};background:${sel ? t.color + '1A' : 'none'}"><span class="tc-dot" style="background:${t.color};opacity:${sel ? '1' : '0.55'}"></span>${_escT(t.name)}</button>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
//  MODAL DE GESTÃO DE TAGS (injectado dinamicamente)
// ═══════════════════════════════════════════════════════════════
let _tmEk = '', _tmTags = {}, _tmOnSave = null, _tmColor = TAG_PALETA[0];

/**
 * Abre o modal partilhado de gestão de tags.
 * Nome único para evitar conflito com funções locais das páginas.
 * @param {string} ek        — emailKey
 * @param {object} tags      — tags actuais
 * @param {function} onSave  — callback(newTags) chamado ao fechar
 */
function openFigooTagsModal(ek, tags, onSave) {
  _tmEk = ek;
  _tmTags = Object.assign({}, tags);
  _tmOnSave = onSave;
  _tmColor = TAG_PALETA[0];

  const existing = document.getElementById('_figoo_tags_modal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '_figoo_tags_modal';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)';
  overlay.innerHTML = `
    <div style="background:var(--white);border-radius:14px;padding:28px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,0.2);border:0.5px solid var(--border)">
      <h3 style="font-size:1rem;font-weight:600;color:var(--text);margin-bottom:5px">Gerir tags</h3>
      <p style="font-size:0.78rem;color:var(--text2);margin-bottom:18px;line-height:1.6">Tags partilhadas entre Notas, Tarefas, Controle Mensal e Pendências.</p>
      <div style="margin-bottom:16px">
        <input id="_tm_name" placeholder="Tag… (separe por ; para criar várias)" maxlength="200"
          style="width:100%;border:0.5px solid var(--border);border-radius:8px;padding:9px 12px;font-size:0.88rem;font-family:inherit;outline:none;color:var(--text);background:var(--white);margin-bottom:8px;box-sizing:border-box"
          oninput="document.getElementById('_tm_btn').disabled=!this.value.trim();document.getElementById('_tm_btn').style.opacity=this.value.trim()?'1':'0.4'"
          onkeydown="if(event.key==='Enter')_tmCreate()" />
        <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <div id="_tm_colors" style="display:flex;gap:5px;flex-wrap:wrap;flex:1"></div>
          <button id="_tm_btn" onclick="_tmCreate()" disabled
            style="padding:7px 16px;border:none;border-radius:7px;background:var(--primary);color:#fff;font-size:0.82rem;font-weight:500;cursor:pointer;font-family:inherit;opacity:0.4">
            + Criar
          </button>
        </div>
      </div>
      <div id="_tm_list" style="display:flex;flex-direction:column;gap:6px;max-height:240px;overflow-y:auto;margin-bottom:18px;padding-right:2px"></div>
      <div style="display:flex;justify-content:flex-end">
        <button onclick="_tmClose()"
          style="padding:9px 22px;border:0.5px solid var(--border);border-radius:8px;background:none;color:var(--text2);font-size:0.84rem;font-weight:500;cursor:pointer;font-family:inherit;transition:all .15s"
          onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background='none'">
          Fechar
        </button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  _tmRenderColors();
  _tmRenderList();
  setTimeout(() => { const n = document.getElementById('_tm_name'); if (n) n.focus(); }, 80);
}

function _tmRenderColors() {
  const cont = document.getElementById('_tm_colors');
  if (!cont) return;
  cont.innerHTML = TAG_PALETA.map(c =>
    `<div onclick="_tmSelectColor('${c}')" title="${c}"
      style="width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;flex-shrink:0;
             border:2.5px solid ${_tmColor === c ? '#fff' : 'transparent'};
             outline:2px solid ${_tmColor === c ? c : 'transparent'};
             transition:all .15s"></div>`
  ).join('');
}

function _tmSelectColor(c) { _tmColor = c; _tmRenderColors(); }

function _tmRenderList() {
  const cont = document.getElementById('_tm_list');
  if (!cont) return;
  const keys = Object.keys(_tmTags);
  if (!keys.length) {
    cont.innerHTML = '<span style="font-size:.75rem;color:var(--text2);padding:4px 0;display:block">Nenhuma tag ainda.</span>';
    return;
  }
  cont.innerHTML = keys.map(id => {
    const t = _tmTags[id];
    return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--bg);border-radius:8px">
      <div style="width:12px;height:12px;border-radius:50%;background:${t.color};flex-shrink:0"></div>
      <span style="flex:1;font-size:.84rem;color:var(--text)">${_escT(t.name)}</span>
      <button onclick="_tmDelete('${id}')" title="Remover"
        style="background:none;border:none;color:#aaa;cursor:pointer;font-size:.8rem;padding:2px 6px;border-radius:4px;font-family:inherit;transition:color .15s"
        onmouseover="this.style.color='#C05050'" onmouseout="this.style.color='#aaa'">✕</button>
    </div>`;
  }).join('');
}

async function _tmCreate() {
  const inp = document.getElementById('_tm_name');
  const raw = inp ? inp.value.trim() : '';
  if (!raw) return;
  // Suporte a múltiplas tags separadas por ";"
  const names = raw.split(';').map(s => s.trim()).filter(Boolean);
  for (const name of names) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 4);
    _tmTags[id] = { id, name, color: _tmColor, createdAt: Date.now() };
    // Avança cor para cada tag criada
    const idx = TAG_PALETA.indexOf(_tmColor);
    _tmColor = TAG_PALETA[(idx + 1) % TAG_PALETA.length];
  }
  await saveFigooTags(_tmEk, _tmTags);
  if (inp) { inp.value = ''; }
  const btn = document.getElementById('_tm_btn');
  if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }
  _tmRenderColors();
  _tmRenderList();
}

async function _tmDelete(id) {
  if (!confirm('Remover esta tag? Os itens que a usam ficam sem ela.')) return;
  delete _tmTags[id];
  await saveFigooTags(_tmEk, _tmTags);
  _tmRenderList();
}

function _tmClose() {
  const overlay = document.getElementById('_figoo_tags_modal');
  if (overlay) overlay.remove();
  if (_tmOnSave) _tmOnSave(_tmTags);
}
