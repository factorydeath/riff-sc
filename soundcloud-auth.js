'use strict';

// SoundCloud account session for the local user.
//
// How this actually works in 2025/2026 (verified against the live API and
// yt-dlp's soundcloud extractor):
//
// 1. The user signs in inside a dedicated BrowserWindow on a persistent
//    partition, so cookies survive restarts. Google/Apple/Facebook sign-in
//    popups are allowed because they are part of SoundCloud's login flow.
// 2. A successful login is detected by the presence of the `oauth_token`
//    cookie on .soundcloud.com. Its VALUE is the OAuth access token.
// 3. API calls go to https://api-v2.soundcloud.com with both
//    `client_id=<web client id>` and `Authorization: OAuth <token>`.
// 4. Endpoints (live-checked):
//      GET /me                                  -> profile (requires OAuth)
//      GET /users/{uid}/likes                   -> unified likes; items have
//           kind === 'track' -> { track }, kind === 'playlist' -> { playlist }
//      GET /users/{uid}/playlists               -> own playlists
//      GET /playlists/{id}                      -> playlist with embedded
//           tracks (bare ids for big playlists; resolve via GET /tracks?ids=)
//
// The token is never written to disk by us; it lives in the partition cookie
// jar only.

const electron = (function () {
  try { return require('electron'); } catch (e) { return null; }
})();

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
const PARTITION = 'persist:riff-sc-auth';
const API_V2 = 'https://api-v2.soundcloud.com';
const PROFILE_TTL_MS = 10 * 60 * 1000;

// Domains that participate in the sign-in flow (embedded OAuth popups).
const AUTH_POPUP_HOSTS = [
  'soundcloud.com',
  'sndcdn.com',
  'accounts.google.com',
  'google.com',
  'gstatic.com',
  'recaptcha.net',
  'googleusercontent.com',
  'youtube.com',
  'appleid.apple.com',
  'apple.com',
  'facebook.com',
  'login.live.com',
  'login.microsoftonline.com'
];

let deps = { getClientId: null, getCachedIdSet: null };
let cachedProfile = null;
let loginWindow = null;
let loginInFlight = null;

class ScAuthError extends Error {
  constructor(code, message) {
    super(message || code);
    this.name = 'ScAuthError';
    this.code = code;
  }
}

function isAvailable() {
  return !!(electron && electron.session && electron.BrowserWindow && electron.ipcMain);
}

function init({ getClientId, getCachedIdSet }) {
  if (getClientId) deps.getClientId = getClientId;
  if (getCachedIdSet) deps.getCachedIdSet = getCachedIdSet;
  registerIpc();
}

function scSession() {
  return electron.session.fromPartition(PARTITION);
}

// ---- token handling -------------------------------------------------------

async function getOauthToken() {
  if (!isAvailable()) return null;
  try {
    const cookies = await scSession().cookies.get({ name: 'oauth_token' });
    const hit = cookies.find((c) => (c.domain || '').includes('soundcloud.com') && c.value);
    return hit ? hit.value : null;
  } catch (e) {
    return null;
  }
}

async function requireClientId() {
  if (typeof deps.getClientId !== 'function') {
    throw new ScAuthError('NOT_INITIALIZED', 'SoundCloud client_id is unavailable');
  }
  const cid = await deps.getClientId();
  if (!cid) throw new ScAuthError('NO_CLIENT_ID', 'Could not resolve the SoundCloud client_id');
  return cid;
}

async function apiGet(pathOrUrl, { requireAuth = false } = {}) {
  const cid = await requireClientId();
  let token = await getOauthToken();
  if (requireAuth && !token) {
    throw new ScAuthError('NOT_AUTHENTICATED', 'SoundCloud account is not connected');
  }

  const buildUrl = () => {
    const path = String(pathOrUrl).replace(/^https:\/\/api-v2\.soundcloud\.com/i, '');
    const url = path.startsWith('http') ? path : `${API_V2}${path.startsWith('/') ? '' : '/'}${path}`;
    return url + (url.includes('?') ? '&' : '?') + 'client_id=' + encodeURIComponent(cid);
  };
  const headers = { 'User-Agent': UA, Accept: 'application/json' };
  if (token) headers.Authorization = `OAuth ${token}`;

  const attempt = async () => {
    const res = await fetch(buildUrl(), { headers, signal: AbortSignal.timeout(15000) });
    if (res.status === 401 && token) {
      // cookie may have rotated; re-read once and retry
      const fresh = await getOauthToken();
      if (fresh && fresh !== token) {
        token = fresh;
        headers.Authorization = `OAuth ${token}`;
        return fetch(buildUrl(), { headers, signal: AbortSignal.timeout(15000) });
      }
    }
    return res;
  };

  let res;
  try {
    res = await attempt();
  } catch (e) {
    throw new ScAuthError('NETWORK', `Could not reach SoundCloud: ${e.message}`);
  }
  if (res.status === 401) throw new ScAuthError('NOT_AUTHENTICATED', 'SoundCloud session expired — sign in again');
  if (res.status === 403) throw new ScAuthError('SC_HTTP_403', 'SoundCloud refused the request (403)');
  if (!res.ok) throw new ScAuthError('SC_HTTP_' + res.status, `SoundCloud API HTTP ${res.status}`);
  try {
    return await res.json();
  } catch (e) {
    throw new ScAuthError('BAD_JSON', 'SoundCloud returned an unexpected response');
  }
}

// ---- mapping --------------------------------------------------------------

async function cachedIdSetSafe() {
  if (typeof deps.getCachedIdSet !== 'function') return null;
  try { return await deps.getCachedIdSet(); } catch (e) { return null; }
}

function mapScTrack(t, cachedIds) {
  if (!t || t.id == null || !t.title) return null;
  const artwork = t.artwork_url
    ? String(t.artwork_url).replace(/-(large|t\d+x\d+)\.(jpg|png)$/, '-t200x200.jpg')
    : '';
  return {
    id: String(t.id),
    title: String(t.title),
    artist: (t.user && (t.user.username || t.user.full_name)) || 'unknown artist',
    duration: Math.round((t.duration || 0) / 1000),
    thumbnail: artwork,
    url: t.permalink_url || '',
    platform: 'soundcloud',
    isCached: cachedIds ? cachedIds.has(String(t.id)) : false
  };
}

function mapScPlaylist(pl) {
  if (!pl || pl.id == null || !pl.title) return null;
  return {
    id: String(pl.id),
    name: String(pl.title),
    cover: pl.artwork_url || '',
    trackCount: pl.track_count != null ? pl.track_count : (Array.isArray(pl.tracks) ? pl.tracks.length : 0),
    permalinkUrl: pl.permalink_url || '',
    kind: 'own'
  };
}

async function fetchPaged(firstPath, maxItems, pick) {
  const out = [];
  let href = firstPath;
  while (href && out.length < maxItems) {
    const data = await apiGet(href);
    const items = Array.isArray(data) ? data : (Array.isArray(data.collection) ? data.collection : []);
    for (const item of items) {
      if (out.length >= maxItems) break;
      const mapped = pick(item);
      if (mapped) out.push(mapped);
    }
    if (items.length === 0) break;
    href = data.next_href
      ? String(data.next_href).replace(/^https?:\/\/api-v2\.soundcloud\.com/i, '')
      : null;
  }
  return out;
}

// ---- profile / status -----------------------------------------------------

async function getProfile(force = false) {
  if (!force && cachedProfile && Date.now() - cachedProfile.fetchedAt < PROFILE_TTL_MS) {
    return cachedProfile;
  }
  const me = await apiGet('/me', { requireAuth: true });
  const profile = {
    uid: String((me && me.id) || ''),
    username: (me && (me.username || me.full_name)) || 'SoundCloud user',
    avatarUrl: (me && me.avatar_url) || '',
    permalinkUrl: (me && me.permalink_url) || '',
    fetchedAt: Date.now()
  };
  cachedProfile = profile;
  return profile;
}

async function requireUid() {
  const profile = await getProfile(false);
  if (!profile.uid) throw new ScAuthError('NO_UID', 'SoundCloud did not return a user id');
  return profile.uid;
}

async function getStatus() {
  if (!isAvailable()) {
    return { authenticated: false, profile: null, error: 'SoundCloud sign in is only available in the desktop app' };
  }
  const token = await getOauthToken();
  if (!token) return { authenticated: false, profile: null };
  try {
    const profile = await getProfile(false);
    return {
      authenticated: true,
      profile: { uid: profile.uid, username: profile.username, avatarUrl: profile.avatarUrl, permalinkUrl: profile.permalinkUrl }
    };
  } catch (e) {
    if (e && (e.code === 'NOT_AUTHENTICATED' || e.code === 'NO_UID')) {
      return { authenticated: false, profile: null, error: e.message };
    }
    return { authenticated: false, profile: null, error: e && e.message ? e.message : String(e) };
  }
}

// ---- data -----------------------------------------------------------------

// Unified likes: /users/{uid}/likes returns {collection:[{created_at, kind, track|playlist}]}
async function getLikes(max = 5000) {
  const limit = Math.max(1, Math.min(max, 10000));
  const uid = await requireUid();
  const cachedIds = await cachedIdSetSafe();
  return fetchPaged(`/users/${uid}/likes?limit=200&linked_partitioning=1`, limit, (item) => {
    if (!item || item.kind === 'playlist' || item.playlist) return null;
    return mapScTrack(item.track || item, cachedIds);
  });
}

async function getLikedPlaylists(max = 1000) {
  const limit = Math.max(1, Math.min(max, 2000));
  const uid = await requireUid();
  return fetchPaged(`/users/${uid}/likes?limit=200&linked_partitioning=1`, limit, (item) => {
    const pl = item && (item.playlist || (item.kind === 'playlist' ? item : null));
    if (!pl) return null;
    const mapped = mapScPlaylist(pl);
    if (mapped) mapped.kind = 'liked';
    return mapped;
  });
}

async function getOwnPlaylists(max = 1000) {
  const limit = Math.max(1, Math.min(max, 2000));
  const uid = await requireUid();
  return fetchPaged(`/users/${uid}/playlists?limit=50&linked_partitioning=1`, limit, mapScPlaylist);
}

async function getPlaylistTracks(playlistId) {
  const cleanId = String(playlistId || '').replace(/[^\w-]/g, '');
  if (!cleanId) throw new ScAuthError('BAD_REQUEST', 'Invalid playlist id');
  const data = await apiGet(`/playlists/${cleanId}`);
  if (!data || !Array.isArray(data.tracks)) {
    throw new ScAuthError('SC_HTTP_404', 'Playlist not found');
  }
  const cachedIds = await cachedIdSetSafe();

  const result = new Array(data.tracks.length);
  const partial = [];
  data.tracks.forEach((t, i) => {
    if (t && t.title) {
      result[i] = mapScTrack(t, cachedIds);
    } else if (t && t.id != null) {
      partial.push([i, String(t.id)]);
    }
  });
  // Big playlists embed some tracks as bare ids; resolve them in batches of
  // 50 while keeping the original ordering.
  for (let i = 0; i < partial.length; i += 50) {
    const chunk = partial.slice(i, i + 50);
    try {
      const batch = await apiGet(`/tracks?ids=${chunk.map(([, id]) => id).join(',')}`);
      const byId = new Map();
      if (Array.isArray(batch)) {
        for (const t of batch) {
          const mapped = mapScTrack(t, cachedIds);
          if (mapped) byId.set(mapped.id, mapped);
        }
      }
      for (const [idx, id] of chunk) {
        const mapped = byId.get(id);
        if (mapped) result[idx] = mapped;
      }
    } catch (e) {}
  }

  return {
    id: String(data.id || cleanId),
    name: String(data.title || 'Imported playlist'),
    cover: data.artwork_url || '',
    tracks: result.filter(Boolean)
  };
}

// ---- session management ---------------------------------------------------

async function logout() {
  cachedProfile = null;
  if (isAvailable()) {
    try {
      await scSession().clearStorageData({ storages: ['cookies', 'localstorage', 'indexdb', 'cachestorage', 'serviceworkers'] });
    } catch (e) {}
  }
  return { ok: true };
}

function isAuthPopupUrl(rawUrl) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return AUTH_POPUP_HOSTS.some((h) => host === h || host.endsWith('.' + h));
  } catch (e) {
    return false;
  }
}

function startLogin() {
  if (loginInFlight) return loginInFlight;
  loginInFlight = new Promise((resolve) => {
    if (!isAvailable()) {
      resolve({ ok: false, error: 'unavailable' });
      return;
    }
    if (loginWindow && !loginWindow.isDestroyed()) {
      try { loginWindow.focus(); } catch (e) {}
      resolve({ ok: false, error: 'already_open' });
      return;
    }

    let settled = false;
    let pollTimer = null;
    let timeoutTimer = null;
    // OAuth providers (notably Google) reject embedded windows that identify
    // as Electron. Give every window/pop-up of this flow a plain Chrome UA.
    const prevUA = electron.app.userAgentFallback;
    try { electron.app.userAgentFallback = UA; } catch (e) {}

    const win = new electron.BrowserWindow({
      width: 460,
      height: 720,
      title: 'SoundCloud sign in',
      backgroundColor: '#131214',
      autoHideMenuBar: true,
      webPreferences: {
        partition: PARTITION,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        spellcheck: false
      }
    });
    loginWindow = win;
    try { win.webContents.setUserAgent(UA); } catch (e) {}

    const settle = async (ok) => {
      if (settled) return;
      settled = true;
      if (pollTimer) clearInterval(pollTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      try { electron.app.userAgentFallback = prevUA; } catch (e) {}
      let profile = null;
      if (ok) {
        try {
          cachedProfile = null;
          profile = await getProfile(true);
        } catch (e) {
          profile = null;
        }
      }
      if (!profile) {
        // The window may have been closed right after sign-in completed but
        // before the poll fired — decide by the cookie, not by the flag.
        try {
          const token = await getOauthToken();
          if (token) {
            cachedProfile = null;
            profile = await getProfile(true);
          }
        } catch (e) {}
      }
      try { if (!win.isDestroyed()) win.close(); } catch (e) {}
      resolve({ ok: !!profile, profile });
    };

    // Google / Apple / Facebook sign-in open popups — they must run inside
    // this window, otherwise those providers can never complete.
    win.webContents.setWindowOpenHandler(({ url }) => {
      if (isAuthPopupUrl(url)) return { action: 'allow' };
      try { electron.shell.openExternal(url); } catch (e) {}
      return { action: 'deny' };
    });
    win.webContents.on('will-navigate', (e, url) => {
      if (url.startsWith('file://')) e.preventDefault();
    });

    const check = async () => {
      try {
        const token = await getOauthToken();
        if (token) {
          clearInterval(pollTimer);
          pollTimer = null;
          await settle(true);
        }
      } catch (e) {}
    };

    pollTimer = setInterval(check, 800);
    timeoutTimer = setTimeout(() => settle(false), 10 * 60 * 1000);
    win.on('closed', () => {
      if (loginWindow === win) loginWindow = null;
      // The user may finish sign-in in an OAuth popup that later closes the
      // opener; give the cookie a moment before deciding it failed.
      setTimeout(() => settle(false), 0);
    });

    win.loadURL('https://soundcloud.com/signin').catch(() => {});
  });

  const result = loginInFlight;
  result.finally(() => { loginInFlight = null; });
  return result;
}

function registerIpc() {
  if (!isAvailable()) return;
  electron.ipcMain.removeHandler('sc-login');
  electron.ipcMain.handle('sc-login', async () => {
    const result = await startLogin();
    return result || { ok: false, profile: null, error: 'unknown' };
  });
  electron.ipcMain.removeHandler('sc-logout');
  electron.ipcMain.handle('sc-logout', async () => logout());
}

module.exports = {
  init,
  startLogin,
  logout,
  getStatus,
  getLikes,
  getOwnPlaylists,
  getLikedPlaylists,
  getPlaylistTracks,
  isAvailable,
  ScAuthError
};
