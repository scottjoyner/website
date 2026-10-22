'use strict';

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
});
const ASSET_DIRS = new Set(['css', 'js', 'fonts', 'font-awesome', 'images']);

function inside(root, file) {
  const relative = path.relative(root, file);
  return relative !== '..' && !relative.startsWith('..' + path.sep) &&
    !path.isAbsolute(relative);
}

function requestedFile(root, requestUrl) {
  if (typeof requestUrl !== 'string' || !requestUrl.startsWith('/') ||
      requestUrl.length > 4096) return null;
  const raw = requestUrl.split(/[?#]/, 1)[0];
  // Never let encoded separators change path segment boundaries.
  if (/%2f|%5c/i.test(raw)) return null;
  let decoded;
  try { decoded = decodeURIComponent(raw); } catch (_) { return null; }
  if (decoded.includes('\\') || decoded.includes('\0')) return null;
  let parts = decoded.split('/').filter(Boolean);
  if (parts.length === 0) parts = ['index.html'];
  if (parts.some(p => p === '.' || p === '..' || p.startsWith('.'))) return null;

  const basename = parts[parts.length - 1];
  const ext = path.extname(basename).toLowerCase();
  if (!Object.hasOwn(MIME, ext)) return null;
  const rootPage = parts.length === 1 &&
    (ext === '.html' || basename === 'favicon.ico');
  const asset = parts.length > 1 && ASSET_DIRS.has(parts[0]) &&
    ext !== '.html';
  if (!rootPage && !asset) return null;
  const target = path.resolve(root, ...parts);
  return inside(root, target) ? { target, ext } : null;
}

function createStaticServer(documentRoot = __dirname) {
  const root = fs.realpathSync(documentRoot);
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Frame-Options': 'SAMEORIGIN',
    'Cache-Control': 'no-store',
  };
  function error(res, status, message, extra = {}) {
    res.writeHead(status, { ...headers, 'Content-Type': 'text/plain; charset=utf-8', ...extra });
    res.end(message + '\n');
  }
  return http.createServer(async (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return error(res, 405, 'Method not allowed', { Allow: 'GET, HEAD' });
    }
    const resolved = requestedFile(root, req.url);
    if (!resolved) return error(res, 403, 'Forbidden');
    try {
      const actual = await fs.promises.realpath(resolved.target);
      if (!inside(root, actual)) return error(res, 403, 'Forbidden');
      const effectiveUrl = '/' + path.relative(root, actual).split(path.sep).join('/');
      if (!requestedFile(root, effectiveUrl)) return error(res, 403, 'Forbidden');
      const info = await fs.promises.stat(actual);
      if (!info.isFile()) return error(res, 404, 'Not found');
      const body = await fs.promises.readFile(actual);
      res.writeHead(200, {
        ...headers,
        'Content-Type': MIME[resolved.ext],
        'Content-Length': body.length,
      });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch (e) {
      if (e && ['ENOENT', 'ENOTDIR'].includes(e.code)) {
        return error(res, 404, 'Not found');
      }
      return error(res, 500, 'Internal server error');
    }
  });
}

module.exports = { createStaticServer };

if (require.main === module) {
  // Safe default: this legacy demo is local-only unless HOST is explicitly set.
  const host = process.env.HOST || '127.0.0.1';
  const port = Number(process.env.PORT || 8125);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    process.stderr.write('Invalid PORT\n');
    process.exitCode = 1;
  } else {
    createStaticServer().listen(port, host, () => {
      process.stdout.write('Local static server listening on ' + host + ':' + port + '\n');
    });
  }
}
