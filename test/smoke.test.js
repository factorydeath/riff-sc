'use strict';

const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const https = require('node:https');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { PassThrough } = require('node:stream');

const { startServer, stopServer, getServerToken } = require('../server');

function request(port, path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.get({ host: '127.0.0.1', port, path, headers }, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => resolve({ statusCode: res.statusCode, body }));
    });
    req.on('error', reject);
  });
}

test('startServer resolves the real bound port (regression)', async () => {
  const port = await startServer(0);
  try {
    assert.ok(Number.isInteger(port) && port > 0, `expected a real port, got ${port}`);
    assert.ok(port <= 65535);
  } finally {
    await stopServer();
  }
});

test('server responds and rejects untrusted routes', async () => {
  const port = await startServer(0);
  try {
    const missing = await request(port, '/');
    assert.strictEqual(missing.statusCode, 404);

    const guarded = await request(port, '/api/tools-status');
    assert.strictEqual(guarded.statusCode, 403, 'token-protected route must reject requests without a token');

    const authorized = await request(port, '/api/tools-status', { 'x-riff-token': getServerToken() });
    assert.strictEqual(authorized.statusCode, 200);
    assert.doesNotThrow(() => JSON.parse(authorized.body));
  } finally {
    await stopServer();
  }
});

test('requests with a foreign Origin are rejected', async () => {
  const port = await startServer(0);
  try {
    const res = await request(port, '/', { origin: 'https://evil.example.com' });
    assert.strictEqual(res.statusCode, 403);
  } finally {
    await stopServer();
  }
});

test('soundcloud account endpoints require the token and report not-authenticated without a session', async () => {
  const port = await startServer(0);
  try {
    const noToken = await request(port, '/api/sc-status');
    assert.strictEqual(noToken.statusCode, 403, 'sc-status must be token protected');

    const status = await request(port, '/api/sc-status', { 'x-riff-token': getServerToken() });
    assert.strictEqual(status.statusCode, 200);
    const statusData = JSON.parse(status.body);
    assert.strictEqual(statusData.success, true);
    assert.strictEqual(statusData.authenticated, false);

    const likes = await request(port, '/api/sc-likes', { 'x-riff-token': getServerToken() });
    assert.strictEqual(likes.statusCode, 200);
    const likesData = JSON.parse(likes.body);
    assert.strictEqual(likesData.success, false);
    assert.match(likesData.error, /not connected/i);

    const playlists = await request(port, '/api/sc-playlists', { 'x-riff-token': getServerToken() });
    assert.strictEqual(playlists.statusCode, 200);
    assert.strictEqual(JSON.parse(playlists.body).success, false);

    const logout = await request(port, '/api/sc-logout', { 'x-riff-token': getServerToken() });
    // GET is not a registered method for sc-logout: only POST is handled.
    assert.strictEqual(logout.statusCode, 404);
  } finally {
    await stopServer();
  }
});
