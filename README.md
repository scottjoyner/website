# Kipnerter — legacy personal website

Historical personal website built from static HTML/CSS/JavaScript pages, with lightweight Node.js and Flask server experiments. **This repository is not evidence of the current production Kipnerter site.**

## Source layout

- `index.html` and other root `*.html` files — website pages, portfolio, blog, contact, and templates.
- `css/`, `js/`, `fonts/`, `font-awesome/` — frontend assets.
- `server.js` — hand-written Node.js static-file HTTP server.
- `fileserve.py` — separate Flask static-file server prototype.
- `package.json` — defines `start` and `test` as **the same command**: `node server.js`. **`npm test` is not an automated test suite.**
- `firebase-debug.log` — tracked historical debug log; inspect for private data before publication or mirroring.

## Local inspection

Use a source viewer to review static pages first. On the **hardening branch**, the Node.js server enforces a static-file allowlist, rejects traversal and escaped symlinks, serves only GET/HEAD requests, returns 404 for absent files, and binds to loopback by default. It is still a **legacy development server, not a recommended production deployment**. For public hosting, use a maintained, hardened static web server with explicitly reviewed routes, a production CSP, access logging, and independent security testing.

The Python alternative depends on Flask and has different static asset paths; no verified requirements file or runtime setup is documented.

## Hardened development-server candidate

On branch `hardening/static-server-path-20261022`, the Node.js static-server candidate is designed for **local-only** development:

```bash
npm start
# default: http://127.0.0.1:8125
node --test server.test.js
```

The server accepts `PORT` and `HOST` as environment settings; changing `HOST` to a non-loopback interface exposes the server and requires a separate security review. The server publishes root HTML pages and selected asset types from `css/`, `js/`, `fonts/`, `font-awesome/`, and `images/`; repository source, dotfiles, manifest JSON, logs, and other files are not public by default. There is no automated directory listing or query-driven file selection.

**Validation:** An isolated Node.js 22 run using the exact GitHub source/test blobs passed the regression harness on 2026-10-22, including unauthorized internal-source symlinks and directory escape attempts. This is not a penetration test or a proof of production readiness. No live site was restarted or deployed.


## Security and provenance

This is a legacy website/templating snapshot. Inspect inherited external templates, canonical URLs, third-party scripts, forms, and licenses before publishing it. Avoid embedding personal contact information, tokens, analytics secrets, debug logs, or private content in a publicly served directory.

**Status:** documentation grounded in tracked files and package scripts; no HTTP request, app test, security audit, or production deployment was performed.
