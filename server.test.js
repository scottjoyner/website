'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createStaticServer } = require('./server');

async function request(port, uri, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1', port, path: uri, method,
    }, response => {
      const chunks = [];
      response.on('data', x => chunks.push(x));
      response.on('end', () => resolve({
        status: response.statusCode,
        headers: response.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('allowlisted static files only; deny sensitive paths and escaping symlinks', async () => {
  const parent = fs.mkdtempSync(path.join(os.tmpdir(), 'static-test-'));
  const root = path.join(parent, 'site');
  fs.mkdirSync(root);
  fs.mkdirSync(path.join(root, 'js'));
  fs.writeFileSync(path.join(root, 'index.html'), '<h1>OK</h1>');
  fs.writeFileSync(path.join(root, 'about.html'), 'About');
  fs.writeFileSync(path.join(root, 'js', 'app.js'), 'console.log(1);');
  fs.writeFileSync(path.join(root, 'server.js'), 'SECRET SOURCE');
  fs.writeFileSync(path.join(root, '.env'), 'SECRET ENV');
  fs.writeFileSync(path.join(root, 'firebase-debug.log'), 'SECRET LOG');
  fs.writeFileSync(path.join(root, 'package.json'), '{"secret":true}');
  fs.writeFileSync(path.join(parent, 'outside.js'), 'SECRET OUTSIDE');
  fs.symlinkSync(path.join(parent, 'outside.js'), path.join(root, 'js', 'outside.js'));
  const server = createStaticServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const port = server.address().port;
    const main = await request(port, '/');
    assert.equal(main.status, 200);
    assert.equal(main.body, '<h1>OK</h1>');
    assert.equal(main.headers['x-content-type-options'], 'nosniff');
    assert.equal((await request(port, '/about.html?foo=bar')).status, 200);
    assert.equal((await request(port, '/js/app.js')).status, 200);
    assert.match((await request(port, '/js/app.js')).headers['content-type'], /javascript/);
    const head = await request(port, '/', 'HEAD');
    assert.equal(head.status, 200);
    assert.equal(head.body, '');
    assert.equal((await request(port, '/', 'POST')).status, 405);
    assert.equal((await request(port, '/absent.html')).status, 404);
    for (const uri of [
      '/server.js', '/package.json', '/.env', '/firebase-debug.log',
      '/js/outside.js', '/../server.js', '/%2e%2e/server.js',
      '/js/%2e%2e/server.js', '/js/%2fapp.js', '/js/%5capp.js',
      '/js/.hidden.js', '/js/../../outside.js', '/js/bad%ZZ.js',
    ]) {
      const got = await request(port, uri);
      assert.equal(got.status, 403, uri);
      assert.doesNotMatch(got.body, /SECRET/);
    }
  } finally {
    await new Promise((resolve, reject) => server.close(err => err ? reject(err) : resolve()));
    fs.rmSync(parent, { recursive: true, force: true });
  }
});
