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

Use a source viewer to review static pages first. A development-only launch with Node.js would use `npm start`, but the Node server constructs filesystem paths from request URLs. **Do not expose that experimental server to the public Internet or deploy it as-is.** Use a maintained, hardened static web server with explicit document-root confinement and access logging instead.

The Python alternative depends on Flask and has different static asset paths; no verified requirements file or runtime setup is documented.

## Security and provenance

This is a legacy website/templating snapshot. Inspect inherited external templates, canonical URLs, third-party scripts, forms, and licenses before publishing it. Avoid embedding personal contact information, tokens, analytics secrets, debug logs, or private content in a publicly served directory.

**Status:** documentation grounded in tracked files and package scripts; no HTTP request, app test, security audit, or production deployment was performed.
