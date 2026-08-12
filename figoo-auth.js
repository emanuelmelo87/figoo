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
//   adminHasKeypair, adminSetupKeypair, adminGetUserDataKey, decDataWithKey

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

function authSetSession(ek, email) {
  localStorage.setItem(`figoo_auth_${ek}`, '1');
  localStorage.setItem(`figoo_auth_ts_${ek}`, Date.now().toString());
  if (email) authRegisterUser(email);
}

function authClearSession(ek) {
  localStorage.removeItem(`figoo_auth_${ek}`);
  localStorage.removeItem(`figoo_auth_ts_${ek}`);
  localStorage.removeItem(`figoo_auth_ver_${ek}`);
  dataKeyClear(ek);
  fbDel(`figoo/${ek}/__auth`).catch(() => {});
}

// ═══════════════════════════════════════════════════════════════
//  REGISTRO DE USUÁRIOS E PERMISSÕES (figoo_users)
// ═══════════════════════════════════════════════════════════════

const ADMIN_EMAILS = ['emanuel.alexandre@betha.com.br', 'emanuel.melo87@gmail.com'];

function isAdminEmail(email) {
  if (!email) return false;
  const e = email.toLowerCase().trim();
  return ADMIN_EMAILS.some(a => a.toLowerCase() === e) || e.includes('emanuel.alexandre') || e.includes('emanuel_alexandre') || e.includes('emanuel.melo87') || e.includes('emanuel_melo87');
}

const ADMIN_EMAIL = 'emanuel.alexandre@betha.com.br';

async function authRegisterUser(email) {
  if (!email) return;
  const ek = emailToKey(email);
  const path = `figoo_users/${ek}`;
  try {
    const existing = await fbGet(path, 4000).catch(() => null);
    const isAdmin = isAdminEmail(email);
    const now = Date.now();
    const defaultPerms = {
      pendencias: 'rw',
      reunioes: 'rw',
      clientes: 'rw',
      contas: 'rw',
      municipios: 'rw',
      pagamentos: 'rw'
    };
    const record = {
      email: email.toLowerCase().trim(),
      role: isAdmin ? 'admin' : (existing?.role || 'user'),
      status: 'ativo',
      createdAt: existing?.createdAt || now,
      lastLoginAt: now,
      permissions: isAdmin ? defaultPerms : (existing?.permissions || defaultPerms)
    };
    await fbSet(path, record, 4000).catch(() => {});
    return record;
  } catch (e) {
    return null;
  }
}

async function authGetUsersList() {
  try {
    const raw = await fbGet('figoo_users', 6000);
    if (!raw || typeof raw !== 'object') return [];
    const list = [];
    for (const key in raw) {
      if (key.indexOf('__') === 0) continue;
      if (raw[key] && raw[key].email) list.push(raw[key]);
    }
    return list.sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0));
  } catch (e) {
    return [];
  }
}

async function authSaveUserPermissions(targetEmailKey, permissions, role) {
  const path = `figoo_users/${targetEmailKey}`;
  try {
    const existing = await fbGet(path, 4000).catch(() => null);
    if (!existing) return false;
    existing.permissions = permissions;
    if (role) existing.role = role;
    existing.updatedAt = Date.now();
    await fbSet(path, existing, 5000);
    return true;
  } catch (e) {
    return false;
  }
}

async function authGetUserPermissions(ek) {
  try {
    const record = await fbGet(`figoo_users/${ek}`, 4000);
    if (record) return record;
  } catch (e) {}
  return {
    role: (ek && (ek.includes('emanuel_alexandre') || ek.includes('emanuel_melo87'))) ? 'admin' : 'user',
    permissions: { pendencias: 'rw', reunioes: 'rw', clientes: 'rw', contas: 'rw', pagamentos: 'rw' }
  };
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
  // Não trocar falha de rede por "salt não existe": se trocar, este aparelho gera
  // um salt novo e SOBRESCREVE o salt real no Firebase, trocando a chave de
  // criptografia de todos os aparelhos para sempre (dados antigos ficam ilegíveis).
  let saltB64;
  try { saltB64 = await fbGet(`figoo/${ek}/__salt`, 4000); }
  catch (e) { throw new Error('Não foi possível confirmar a chave de criptografia (rede instável). Tente novamente.'); }
  let salt;
  if (saltB64) salt = _b64d(saltB64);
  else { salt = crypto.getRandomValues(new Uint8Array(16)); await fbSet(`figoo/${ek}/__salt`, _b64e(salt)); }
  const raw = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), { name: 'PBKDF2' }, false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 250000, hash: 'SHA-256' }, raw, 256);
}

async function dataKeyStore(ek, bits) {
  localStorage.setItem(`figoo_dk_${ek}`, _b64e(bits));
  _figooDataKey = await crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
  _escrowKeyForAdmin(ek, bits); // melhor-esforço, nunca bloqueia o login
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
 * Recolhe TODOS os blobs cifrados do utilizador, em qualquer módulo do figoo,
 * já decifrados com a chave ACTUAL. Blobs que não puderem ser decifrados são
 * ignorados (ficam como estão). Nós __idx/__tags/__quem_list/__salt/__auth
 * não são tocados.
 */
async function _dataCollectAll(ek) {
  const jobs = [];
  // Blobs únicos (uma leitura = um documento cifrado)
  const singles = [`pendencias/${ek}/items`, `colaboradores/${ek}/items`, `calendario/${ek}/events`];
  for (const path of singles) {
    try {
      const v = await fbGet(path, 8000);
      if (v != null) { try { jobs.push({ path, data: await decData(v) }); } catch (e) {} }
    } catch (e) {}
  }
  // Nós com um registo cifrado por sub-chave
  const collections = [`tarefas/${ek}`, `pagamentos/${ek}`, `clientes/${ek}/c`, `entidades/${ek}/e`, `reunioes/${ek}/m`, `weekly/${ek}/w`];
  for (const base of collections) {
    try {
      const node = await fbGet(base, 8000);
      if (node) for (const k of Object.keys(node)) {
        if (k.indexOf('__') === 0) continue; // __idx/__labels ficam em texto puro
        try { jobs.push({ path: `${base}/${k}`, data: await decData(node[k]) }); } catch (e) {}
      }
    } catch (e) {}
  }
  return jobs;
}

// ═══════════════════════════════════════════════════════════════
//  ESCROW DE CHAVE PARA O ADMIN (ECDH P-256 — chave pública real)
// ═══════════════════════════════════════════════════════════════
// O código deste site é público (GitHub Pages) — qualquer "senha mestra"
// escrita aqui seria visível a qualquer pessoa. Por isso usamos um par de
// chaves assimétrico de verdade: a pública fica no Firebase sem risco (só
// serve para TRANCAR), a privada nunca sai do aparelho do admin e só é
// reconstruída ali, decifrada com a própria senha do admin.
//
// Toda vez que a chave de dados de QUALQUER utilizador é criada/recarregada
// (dataKeyStore), o próprio navegador dele tranca uma cópia dela com a
// chave pública do admin e guarda em figoo/{ek}/__admin_escrow. Só a chave
// privada do admin abre essa cápsula — nem quem a criou consegue reabri-la.
const ADMIN_EK = emailToKey(ADMIN_EMAIL);
let _adminPrivKey = null; // CryptoKey ECDH, cache em memória desta aba

async function adminHasKeypair() {
  try { return !!(await fbGet('figoo/__admin_pubkey', 4000)); } catch (e) { return false; }
}

/** Roda uma vez, logado como admin: gera o par e guarda a privada cifrada com a própria senha dele. */
async function adminSetupKeypair() {
  if (!_figooDataKey) throw new Error('Faça login com senha antes de criar as chaves de admin.');
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const pubJwk = await crypto.subtle.exportKey('jwk', kp.publicKey);
  const privJwk = await crypto.subtle.exportKey('jwk', kp.privateKey);
  await fbSet('figoo/__admin_pubkey', pubJwk);
  await fbSetEnc(`figoo/${ADMIN_EK}/__admin_privkey`, privJwk);
  _adminPrivKey = null; // força reimportar na próxima leitura
}

/** Best-effort: tranca uma cópia da chave de dados deste utilizador com a chave pública do admin. */
async function _escrowKeyForAdmin(ek, rawBits) {
  try {
    const pubJwk = await fbGet('figoo/__admin_pubkey', 4000);
    if (!pubJwk) return; // admin ainda não configurou o par de chaves
    const adminPub = await crypto.subtle.importKey('jwk', pubJwk, { name: 'ECDH', namedCurve: 'P-256' }, [], []);
    const eph = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: adminPub }, eph.privateKey, 256);
    const wrapKey = await crypto.subtle.importKey('raw', shared, { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrapKey, rawBits);
    const ephPubJwk = await crypto.subtle.exportKey('jwk', eph.publicKey);
    await fbSet(`figoo/${ek}/__admin_escrow`, { ephPub: ephPubJwk, iv: _b64e(iv), cipher: _b64e(cipher) });
  } catch (e) { /* nunca deve travar o login do utilizador por causa disto */ }
}

async function _adminLoadPrivateKey() {
  if (_adminPrivKey) return _adminPrivKey;
  if (!_figooDataKey) throw new Error('Faça login com sua senha de admin primeiro.');
  const privJwk = await fbGetEnc(`figoo/${ADMIN_EK}/__admin_privkey`, 5000);
  if (!privJwk) throw new Error('Nenhum par de chaves de admin configurado ainda.');
  _adminPrivKey = await crypto.subtle.importKey('jwk', privJwk, { name: 'ECDH', namedCurve: 'P-256' }, [], ['deriveBits']);
  return _adminPrivKey;
}

/** Usa a chave privada do admin para recuperar a chave de dados (AES-GCM) de OUTRO utilizador. */
async function adminGetUserDataKey(targetEk) {
  const priv = await _adminLoadPrivateKey();
  const blob = await fbGet(`figoo/${targetEk}/__admin_escrow`, 5000);
  if (!blob) throw new Error('Este utilizador ainda não gerou uma cápsula de acesso (precisa logar de novo).');
  const ephPub = await crypto.subtle.importKey('jwk', blob.ephPub, { name: 'ECDH', namedCurve: 'P-256' }, [], []);
  const shared = await crypto.subtle.deriveBits({ name: 'ECDH', public: ephPub }, priv, 256);
  const unwrapKey = await crypto.subtle.importKey('raw', shared, { name: 'AES-GCM' }, false, ['decrypt']);
  const bits = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: _b64d(blob.iv) }, unwrapKey, _b64d(blob.cipher));
  return crypto.subtle.importKey('raw', bits, { name: 'AES-GCM' }, false, ['decrypt']);
}

/** decData com uma chave explícita — usado pelo admin para ler dados de outro utilizador. */
async function decDataWithKey(v, key) {
  if (v == null || typeof v !== 'object' || !v.__enc) return v;
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: _b64d(v.iv) }, key, _b64d(v.cipher));
  return JSON.parse(new TextDecoder().decode(buf));
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

  email = email.toLowerCase().trim();
  const ek = emailToKey(email);

  localStorage.setItem('figoo_email', email);
  localStorage.setItem('figoo_last_email', email);
  authSetSession(ek, email);

  try {
    let hasKey = await dataKeyLoad(ek);
    if (!hasKey) {
      const verifier = await authGetVerifier(ek);
      if (verifier) {
        // Já existe senha cadastrada para este e-mail: o Google só provou a
        // identidade, os DADOS continuam trancados por ela. Pede a senha real.
        let ok = false;
        for (let tries = 0; tries < 3 && !ok; tries++) {
          const pw = prompt('Este e-mail já tem uma senha cadastrada no figoo.\nDigite sua senha para destravar os dados:');
          if (pw == null) break; // cancelou
          try {
            await _decryptStr(verifier, pw);
            await dataKeyStore(ek, await dataKeyFromPassword(ek, pw));
            ok = true;
          } catch (e) { alert('Senha incorreta.'); }
        }
        if (!ok) return; // sem a senha certa, não navega — evita abrir com chave errada
      } else {
        // Primeira vez deste e-mail no figoo: cria uma senha "de sistema" ligada ao Google.
        const pass = 'google_auth_key_' + ek;
        const v = await _encryptStr('figoo-auth-ok', pass);
        await authSaveVerifier(ek, v);
        await dataKeyStore(ek, await dataKeyFromPassword(ek, pass));
      }
    }
  } catch (e) {
    console.warn('[figoo google datakey error]', e);
  }

  const curPath = window.location.pathname;
  const isHome = curPath.endsWith('index.html') || curPath === '/' || curPath.endsWith('/') || curPath === '';
  const target = isHome ? 'pendencias.html' : curPath;
  window.location.href = target + (target.includes('?') ? '&' : '?') + 'e=' + encodeURIComponent(email);
}

let _figGoogleInit = false;
function figooMountGoogle() {
  const slots = document.querySelectorAll('.figoo-google-slot');
  if (!slots.length) return;

  if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
    if (!_figGoogleInit) {
      try {
        google.accounts.id.initialize({
          client_id: FIGOO_GOOGLE_CLIENT_ID,
          callback: _figGoogleOnCredential,
          auto_select: false
        });
        _figGoogleInit = true;
      } catch (e) {
        console.warn('[figoo google init error]', e);
      }
    }
    slots.forEach(function (host) {
      if (host.childElementCount > 0) return;
      try {
        const parentW = host.parentElement ? host.parentElement.clientWidth : 280;
        const w = Math.min(360, Math.max(220, host.clientWidth || parentW || 280));
        google.accounts.id.renderButton(host, {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          locale: 'pt-BR',
          width: w
        });
      } catch (e) {
        console.warn('[figoo google render error]', e);
      }
    });
  }
}

(function _figGoogleBoot() {
  const st = document.createElement('style');
  st.textContent = ".figoo-or{display:flex;align-items:center;gap:10px;margin:16px 0;color:var(--text2,#67716B);font-size:.74rem}"
    + ".figoo-or::before,.figoo-or::after{content:'';flex:1;height:1px;background:var(--border,#E8EAED)}"
    + ".figoo-google-slot{display:flex;justify-content:center;min-height:48px;width:100%}";
  (document.head || document.documentElement).appendChild(st);

  const s = document.createElement('script');
  s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.defer = true;
  s.onload = function () { figooMountGoogle(); };
  (document.head || document.documentElement).appendChild(s);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', figooMountGoogle);
  } else {
    figooMountGoogle();
  }

  setInterval(function () { figooMountGoogle(); }, 500);
})();
