// Simple static file server for DayStar website
// Usage: ANTHROPIC_API_KEY=sk-ant-... node server.js
const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = process.env.PORT || 3000;
const ROOT = path.resolve(__dirname);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const MIME = {
  '.html': 'text/html',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

/* ── System prompt (hardcoded server-side) ──────────────────── */
var SYSTEM_PROMPT = "You are a cannabis cultivation education expert. Analyze the following grow data using a 7-category framework: Lighting, Environment & VPD, Nutrition & Water Quality, Growing Medium & Root Zone, Genetics & Strain Fit, Pest/Disease/Contamination Risk, Harvest Readiness & Post-Harvest. Do NOT use numerical scores, letter grades, pass/fail language, or any grading terminology. Instead, use growth-stage indicators for each category: Seedling (just starting), Vegetative (building foundations), Flowering (strong and developing), Harvest Ready (fully optimized). For each category, describe the current growth stage and identify specific optimizations. Provide a Growth Progress Snapshot summarizing how many of the 7 categories are fully optimized. Return a structured report with: Growth Progress Snapshot, per-category growth stage and analysis, and top 3 actionable recommendations with forward-looking language. If pH, runoff pH, or runoff EC/PPM fields are blank or missing, skip those sub-evaluations gracefully. If the grower specifies genetics type (Autoflower vs Photoperiod), tailor recommendations accordingly: for autoflowers, adjust light schedule advice (18/6 or 20/4 throughout, no flip needed), note shorter timelines, and consider DLI implications; for photoperiods, provide standard veg/flower transition guidance. Format cleanly using markdown with headers (##), bold, and bullet points.";

/* ── Customer log (in-memory for dev) ────────────────────── */
var customersHandler = require('./api/customers');

http.createServer(function (req, res) {
  // --- API proxy endpoint ---
  if (req.method === 'POST' && req.url === '/api/report') {
    if (!ANTHROPIC_API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API key not configured on server' }));
      return;
    }

    let body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () {
      /* ── Parse safely ──────────────────────────────────── */
      var parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
        return;
      }

      /* ── Validate & rebuild payload ────────────────────── */
      if (!parsed || !parsed.messages || !Array.isArray(parsed.messages) || parsed.messages.length < 1) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid request body' }));
        return;
      }

      var userContent = String(parsed.messages[0].content || '').substring(0, 15000);
      const postData = JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }]
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'Content-Length': Buffer.byteLength(postData),
        },
      };

      const apiReq = https.request(options, function (apiRes) {
        let data = '';
        apiRes.on('data', function (chunk) { data += chunk; });
        apiRes.on('end', function () {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      apiReq.on('error', function (err) {
        console.error('Upstream API error:', err.message);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Report generation failed. Please try again.' }));
      });

      apiReq.write(postData);
      apiReq.end();
    });
    return;
  }

  // --- Customer log API ---
  if (req.url === '/api/customers' || req.url.indexOf('/api/customers?') === 0) {
    let body = '';
    req.on('data', function (chunk) { body += chunk; });
    req.on('end', function () {
      var fakeReq = {
        method: req.method,
        headers: req.headers,
        body: body ? JSON.parse(body) : {},
        query: Object.fromEntries(new URL(req.url, 'http://localhost').searchParams),
        socket: req.socket
      };
      var fakeRes = {
        statusCode: 200,
        headers: {},
        setHeader: function (k, v) { this.headers[k] = v; },
        status: function (code) { this.statusCode = code; return this; },
        json: function (data) {
          res.writeHead(this.statusCode, Object.assign({ 'Content-Type': 'application/json' }, this.headers));
          res.end(JSON.stringify(data));
        },
        send: function (data) {
          res.writeHead(this.statusCode, this.headers);
          res.end(data);
        }
      };
      customersHandler(fakeReq, fakeRes);
    });
    return;
  }

  // --- Static file serving ---
  let urlPath = req.url.split('?')[0];
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';

  const filePath = path.join(ROOT, urlPath);

  // Path traversal protection: ensure resolved path stays within ROOT
  if (!path.resolve(filePath).startsWith(ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 Forbidden</h1>');
    return;
  }

  const ext      = path.extname(filePath).toLowerCase();
  const ct       = MIME[ext] || 'application/octet-stream';

  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 Not Found</h1>');
      return;
    }
    res.writeHead(200, { 'Content-Type': ct });
    res.end(data);
  });
}).listen(PORT, function () {
  if (!ANTHROPIC_API_KEY) {
    console.warn('WARNING: ANTHROPIC_API_KEY is not set. Report generation will fail.');
  }
  console.log('DayStar dev server running at http://localhost:' + PORT);
});
