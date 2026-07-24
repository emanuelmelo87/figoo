// figoo-auth.js — Auth unificado, REST helpers e Crypto
// Portal figoo · v1.0 · 2026-05
// ─────────────────────────────────────────────────────────────
// Expõe globalmente:
//   FIGOO_DB, AUTH_TTL
//   fbGet, fbSet, fbPatch, fbDel
//   emailToKey, uid, _b64e, _b64d, _key, _encryptStr, _decryptStr, _checkCrypto
//   authHasSession, authSetSession, authClearSession
//   authGetVerifier, authSaveVerifier, authRemoveVerifier
//   authSendRecovery, authVerifyRecovery, authClearRecovery
//   dataKeyFromPassword, dataKeyStore, dataKeyLoad, dataKeyClear
//   encData, decData, fbGetEnc, fbSetEnc, dataReencryptAll, dataDecryptAll

const FIGOO_DB  = 'https://ferramentasbrasil-default-rtdb.firebaseio.com';
const AUTH_TTL  = 24 * 60 * 60 * 1000; // 24 h em ms

// ═══════════════════════════════════════════════════════════════
//  REST HELPERS (sem SDK — evita hang do WebSocket)
// ═══════════════════════════════════════════════════════════════
async function fbGet(path, ms = 7000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try {
    // no-store: sem isto o navegador servia a resposta em cache e uma 2ª guia
    // (ou um F5) continuava a ver os dados antigos depois de a 1ª gravar.
    const r = await fetch(`${FIGOO_DB}/${path}.json`, { signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch (e) {
    clearTimeout(t);
    if (e.name === 'AbortError') throw new Error('timeout');
    throw e;
  }
}

async function fbSet(path, data, ms = 8000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${FIGOO_DB}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch (e) {
    clearTimeout(t);
    if (e.name === 'AbortError') throw new Error('timeout');
    throw e;
  }
}

async function fbPatch(path, data, ms = 8000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${FIGOO_DB}/${path}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      signal: ctrl.signal
    });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch (e) {
    clearTimeout(t);
    if (e.name === 'AbortError') throw new Error('timeout');
    throw e;
  }
}

async function fbDel(path, ms = 5000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${FIGOO_DB}/${path}.json`, { method: 'DELETE', signal: ctrl.signal });
    clearTimeout(t);
    if (!r.ok) throw new Error('HTTP ' + r.status);
  } catch (e) {
    clearTimeout(t);
    if (e.name === 'AbortError') throw new Error('timeout');
    throw e;
  }
}

// ═══════════════════════════════════════════════════════════════
//  CRYPTO  (PBKDF2 + AES-GCM 256-bit)
// ═══════════════════════════════════════════════════════════════
function _checkCrypto() {
  if (!window.crypto?.subtle)
    throw new Error('Contexto inseguro: abra pelo HTTPS, não via arquivo local.');
}

// _b64e usa loop para evitar stack overflow em dados grandes
function _b64e(a) {
  const b = new Uint8Array(a); let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}
const _b64d = s => new Uint8Array([...atob(s)].map(c => c.charCodeAt(0)));

async function _key(pw, salt) {
  const r = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(pw), { name: 'PBKDF2' }, false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' },
    r, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
  );
}

async function _encryptStr(text, pw) {
  _checkCrypto();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv   = crypto.getRandomValues(new Uint8Array(12));
  const k    = await _key(pw, salt);
  const buf  = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, k, new TextEncoder().encode(text));
  return { cipher: _b64e(buf), salt: _b64e(salt), iv: _b64e(iv) };
}

async function _decryptStr({ cipher, salt, iv }, pw) {
  _checkCrypto();
  const k   = await _key(pw, _b64d(salt));
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: _b64d(iv) }, k, _b64d(cipher));
  return new TextDecoder().decode(buf);
}

// ═══════════════════════════════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════
function emailToKey(e) { return e.toLowerCase().replace(/[^a-z0-9]/g, '_'); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ═══════════════════════════════════════════════════════════════
//  AUTH COM TTL DIÁRIO
// ═══════════════════════════════════════════════════════════════
// localStorage keys:
//   figoo_auth_${ek}       — '1' se sessão activa
//   figoo_auth_ts_${ek}    — timestamp do último login (ms)
//   figoo_auth_ver_${ek}   — verifier cifrado {cipher,salt,iv}

function authHasSession(ek) {
  if (localStorage.getItem(`figoo_auth_${ek}`) !== '1') return false;
  const ts = parseInt(localStorage.getItem(`figoo_auth_ts_${ek}`) || '0', 10);
  return (Date.now() - ts) < AUTH_TTL;
}

function authSetSession(ek) {
  localStorage.setItem(`figoo_auth_${ek}`, '1');
  localStorage.setItem(`figoo_auth_ts_${ek}`, Date.now().toString());
}

function authClearSession(ek) {
  localStorage.removeItem(`figoo_auth_${ek}`);
  localStorage.removeItem(`figoo_auth_ts_${ek}`);
  localStorage.removeItem(`figoo_auth_ver_${ek}`);
  dataKeyClear(ek);
  fbDel(`figoo/${ek}/__auth`).catch(() => {});
}

async function authGetVerifier(ek) {
  const loc = localStorage.getItem(`figoo_auth_ver_${ek}`);
  if (loc) { try { return JSON.parse(loc); } catch (e) {} }
  try {
    const d = await fbGet(`figoo/${ek}/__auth`, 3000);
    if (d && d.cipher) {
      localStorage.setItem(`figoo_auth_ver_${ek}`, JSON.stringify(d));
      return d;
    }
  } catch (e) {}
  return null;
}

function authSaveVerifier(ek, v) {
  localStorage.setItem(`figoo_auth_ver_${ek}`, JSON.stringify(v));
  fbSet(`figoo/${ek}/__auth`, v).catch(() => {});
}

function authRemoveVerifier(ek) {
  localStorage.removeItem(`figoo_auth_ver_${ek}`);
  fbDel(`figoo/${ek}/__auth`).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════
//  PASSWORD RECOVERY (EmailJS)
// ═══════════════════════════════════════════════════════════════
// Preencha as constantes abaixo com os dados do seu projecto EmailJS:
const FIGOO_EMAILJS_SVC = 'COLE_AQUI';   // Service ID
const FIGOO_EMAILJS_TPL = 'COLE_AQUI';   // Template ID (variáveis: {{to_email}}, {{recovery_link}})
const FIGOO_EMAILJS_KEY = 'COLE_AQUI';   // Public Key

/**
 * Gera token, guarda em Firebase e envia e-mail de recuperação.
 * Devolve o link gerado (útil para testes quando EmailJS não está configurado).
 */
async function authSendRecovery(email, ek) {
  // Token de 32 bytes em base64url
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  const expiry = Date.now() + 2 * 60 * 60 * 1000; // 2 h
  await fbSet(`figoo/${ek}/__recovery`, { token, expiry, email });

  // Link aponta para a página atual (com parâmetros de recuperação)
  const base = window.location.href.split('?')[0];
  const link = `${base}?recover=${encodeURIComponent(token)}&e=${encodeURIComponent(email)}`;

  if (FIGOO_EMAILJS_SVC !== 'COLE_AQUI' && window.emailjs) {
    emailjs.init(FIGOO_EMAILJS_KEY);
    await emailjs.send(FIGOO_EMAILJS_SVC, FIGOO_EMAILJS_TPL, {
      to_email: email,
      recovery_link: link
    });
  } else {
    // EmailJS não configurado — devolve link para debug/fallback
    console.info('[figoo recovery] link gerado:', link);
    throw new Error('__NO_EMAILJS__:' + link);
  }
  return link;
}

/**
 * Valida token de recuperação no Firebase.
 * Retorna true se token válido e não expirado.
 */
async function authVerifyRecovery(ek, token) {
  try {
    const d = await fbGet(`figoo/${ek}/__recovery`, 5000);
    if (!d || d.token !== token) return false;
    if (Date.now() > d.expiry) return false;
    return true;
  } catch (e) {
    return false;
  }
}

/** Remove o registo de recovery do Firebase. */
async function authClearRecovery(ek) {
  await fbDel(`figoo/${ek}/__recovery`).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════
//  DATA ENCRYPTION (v1) — cifra os DADOS gravados no Firebase
// ═══════════════════════════════════════════════════════════════
// Chave derivada da senha do utilizador (PBKDF2 250k → AES-GCM-256)
// com salt partilhado em figoo/${ek}/__salt. A chave fica em
// localStorage (figoo_dk_${ek}) enquanto a sessão durar.
// Formato do payload cifrado: { __enc: 1, iv: b64, cipher: b64 }
let _figooDataKey = null;

async function dataKeyFromPassword(ek, pw) {
  let saltB64 = null;
  try { saltB64 = await fbGet(`figoo/${ek}/__salt`, 4000); } catch (e) {}
  let salt;
  if (saltB64) salt = _b64d(saltB64);
  else { salt = crypto.getRandomValues(new Uint8Array(16)); await fbSet(`figoo/${ek}/__salt`, _b64e(salt)); }
  const raw = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), { name: 'PBKDF2' }, false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, raw, 256);
}

async function dataKeyStore(ek, bits) {
  localStorage.setItem(`figoo_dk_${ek}`, _b64e(bits));
  _figooDataKey = await crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function dataKeyLoad(ek) {
  if (_figooDataKey) return true;
  const b = localStorage.getItem(`figoo_dk_${ek}`);
  if (!b) return false;
  _figooDataKey = await crypto.subtle.importKey('raw', _b64d(b), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  return true;
}

function dataKeyClear(ek) { localStorage.removeItem(`figoo_dk_${ek}`); _figooDataKey = null; }

async function encData(obj) {
  if (!_figooDataKey) throw new Error('Chave de criptografia ausente — faça login novamente.');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const buf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, _figooDataKey, new TextEncoder().encode(JSON.stringify(obj)));
  return { __enc: 1, iv: _b64e(iv), cipher: _b64e(buf) };
}

async function decData(v) {
  if (v == null || typeof v !== 'object' || !v.__enc) return v; // dado antigo (texto puro) — migração transparente
  if (!_figooDataKey) throw new Error('Chave de criptografia ausente — faça login novamente.');
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: _b64d(v.iv) }, _figooDataKey, _b64d(v.cipher));
  return JSON.parse(new TextDecoder().decode(buf));
}

async function fbGetEnc(path, ms) {
  const raw = await fbGet(path, ms);
  fbGetEnc.lastWasPlain = raw != null && !(raw && raw.__enc);
  return decData(raw);
}

async function fbSetEnc(path, obj, ms) { return fbSet(path, await encData(obj), ms); }

/**
 * Recolhe todos os blobs de dados do utilizador (pendências, listas de
 * tarefas e meses de pagamentos) já decifrados com a chave ACTUAL.
 * Blobs que não puderem ser decifrados são ignorados (ficam como estão).
 * Nós __idx/__tags/__quem_list/__salt/__auth não são tocados.
 */
async function _dataCollectAll(ek) {
  const jobs = [];
  try {
    const v = await fbGet(`pendencias/${ek}/items`, 8000);
    if (v != null) { try { jobs.push({ path: `pendencias/${ek}/items`, data: await decData(v) }); } catch (e) {} }
  } catch (e) {}
  try {
    const t = await fbGet(`tarefas/${ek}`, 8000);
    if (t) for (const k of Object.keys(t)) {
      if (k.indexOf('__') === 0) continue; // __idx fica em texto puro (Etapa 2)
      try { jobs.push({ path: `tarefas/${ek}/${k}`, data: await decData(t[k]) }); } catch (e) {}
    }
  } catch (e) {}
  try {
    const g = await fbGet(`pagamentos/${ek}`, 8000);
    if (g) for (const k of Object.keys(g)) {
      if (k.indexOf('__') === 0) continue;
      try { jobs.push({ path: `pagamentos/${ek}/${k}`, data: await decData(g[k]) }); } catch (e) {}
    }
  } catch (e) {}
  return jobs;
}

/** Troca de senha: re-cifra TODOS os dados do utilizador com a nova senha. */
async function dataReencryptAll(ek, newPw) {
  const jobs = await _dataCollectAll(ek);
  await dataKeyStore(ek, await dataKeyFromPassword(ek, newPw));
  for (const j of jobs) { try { await fbSet(j.path, await encData(j.data)); } catch (e) {} }
}

/** Remoção de senha: volta a gravar os dados em texto puro e limpa a chave. */
async function dataDecryptAll(ek) {
  const jobs = await _dataCollectAll(ek);
  for (const j of jobs) { try { await fbSet(j.path, j.data); } catch (e) {} }
  dataKeyClear(ek);
}

// ═══════════════════════════════════════════════════════════════
//  LOGIN COM GOOGLE (adicional — convive com o e-mail+senha)
// ═══════════════════════════════════════════════════════════════
// O Google prova a identidade (o e-mail). Os dados continuam cifrados
// pela senha: se a chave já estiver neste aparelho, entra direto; senão,
// pede a senha uma vez para destravar. Não substitui a criptografia.
const FIGOO_GOOGLE_CLIENT_ID = '727110895348-8rnrl5ci6elktuc4m2q3d9qv86fsp87j.apps.googleusercontent.com';

function _figGoogleDecode(jwt) {
  let b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return JSON.parse(decodeURIComponent(escape(atob(b64))));
}

async function _figGoogleOnCredential(resp) {
  let email = '';
  try { email = (_figGoogleDecode(resp.credential) || {}).email || ''; } catch (e) {}
  if (!email) return;
  localStorage.setItem('figoo_email', email);
  const ek = emailToKey(email);
  let hasKey = false;
  try { hasKey = await dataKeyLoad(ek); } catch (e) {}
  if (hasKey) {                                   // já destravado aqui → Google renova a sessão e entra
    authSetSession(ek);
    window.location.href = window.location.pathname + '?e=' + encodeURIComponent(email);
    return;
  }
  // precisa da senha uma vez: pré-preenche o e-mail e avança para o passo da senha
  const emIn = document.getElementById('setup-email');
  if (emIn) emIn.value = email;
  if (typeof window.setupEmailNext === 'function') window.setupEmailNext();
  else window.location.href = window.location.pathname + '?e=' + encodeURIComponent(email);
}

function figooMountGoogle() {
  const host = document.getElementById('figoo-google-btn');
  if (!host || host._figMounted) return;
  if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) return;
  try {
    google.accounts.id.initialize({ client_id: FIGOO_GOOGLE_CLIENT_ID, callback: _figGoogleOnCredential });
    const w = Math.min(340, Math.max(220, host.clientWidth || 260));
    google.accounts.id.renderButton(host, { theme: 'outline', size: 'large', text: 'signin_with', locale: 'pt-BR', width: w });
    host._figMounted = true;
  } catch (e) {}
}

(function _figGoogleBoot() {
  // CSS do divisor "ou" + centragem do botão
  const st = document.createElement('style');
  st.textContent = ".figoo-or{display:flex;align-items:center;gap:10px;margin:16px 0;color:var(--text2,#67716B);font-size:.74rem}"
    + ".figoo-or::before,.figoo-or::after{content:'';flex:1;height:1px;background:var(--border,#E8EAED)}"
    + "#figoo-google-btn{display:flex;justify-content:center;min-height:40px}";
  (document.head || document.documentElement).appendChild(st);
  // carrega a biblioteca do Google e monta o botão quando houver container
  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
  s.onload = function () { figooMountGoogle(); setTimeout(figooMountGoogle, 400); };
  (document.head || document.documentElement).appendChild(s);
  const kick = function () { setTimeout(figooMountGoogle, 400); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kick); else kick();
  // re-tenta se o container aparecer depois (setup renderizado dinamicamente)
  try {
    const mo = new MutationObserver(function () { if (document.getElementById('figoo-google-btn')) figooMountGoogle(); });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch (e) {}
})();
