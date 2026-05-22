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

const FIGOO_DB  = 'https://ferramentasbrasil-default-rtdb.firebaseio.com';
const AUTH_TTL  = 24 * 60 * 60 * 1000; // 24 h em ms

// ═══════════════════════════════════════════════════════════════
//  REST HELPERS (sem SDK — evita hang do WebSocket)
// ═══════════════════════════════════════════════════════════════
async function fbGet(path, ms = 7000) {
  const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), ms);
  try {
    const r = await fetch(`${FIGOO_DB}/${path}.json`, { signal: ctrl.signal });
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
