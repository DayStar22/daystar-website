const https = require('https');

/* ── Rate limiting (in-memory, per Vercel instance) ────────── */
const rateMap = {};
const RATE_LIMIT = 10;       // max requests per window
const RATE_WINDOW = 60000;   // 60 seconds

function isRateLimited(ip) {
  var now = Date.now();
  if (!rateMap[ip] || now - rateMap[ip].start > RATE_WINDOW) {
    rateMap[ip] = { start: now, count: 1 };
    return false;
  }
  rateMap[ip].count++;
  return rateMap[ip].count > RATE_LIMIT;
}

/* ── System prompt (hardcoded server-side so clients cannot override) ── */
const SYSTEM_PROMPT = "You are a cannabis cultivation education expert. Analyze the following grow data using a 7-category framework: Lighting, Environment & VPD, Nutrition & Water Quality, Growing Medium & Root Zone, Genetics & Strain Fit, Pest/Disease/Contamination Risk, Harvest Readiness & Post-Harvest. Do NOT use numerical scores, letter grades, pass/fail language, or any grading terminology. Instead, use growth-stage indicators for each category: Seedling (just starting), Vegetative (building foundations), Flowering (strong and developing), Harvest Ready (fully optimized). For each category, describe the current growth stage and identify specific optimizations. Provide a Growth Progress Snapshot summarizing how many of the 7 categories are fully optimized (e.g., '5 of 7 categories optimized'). For each category, use language like 'Strong Foundation — 2 key optimizations identified' rather than point values. Return a structured report with: Growth Progress Snapshot, per-category growth stage and analysis, and top 3 actionable recommendations with forward-looking language (e.g., 'On your next run, try [X] to move from [current] to [target]'). End each recommendation with encouragement to come back after implementing changes to track progress. If pH, runoff pH, or runoff EC/PPM fields are blank or missing, the grower likely uses no-till living soil or organic methods — skip those sub-evaluations and redistribute your analysis proportionally across the remaining data points for that category. Do not penalize blank pH/runoff fields. If the grower specifies genetics type (Autoflower vs Photoperiod), tailor recommendations accordingly: for autoflowers, adjust light schedule advice (18/6 or 20/4 throughout, no flip needed), note shorter timelines, and consider DLI implications of extended photoperiods; for photoperiods, provide standard veg/flower transition guidance. If genetics type is blank or 'Unknown', provide general recommendations that cover both. Format cleanly using markdown with headers (##), bold, and bullet points.";

module.exports = function (req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  /* ── Origin check ─────────────────────────────────────────── */
  var origin = (req.headers.origin || req.headers.referer || '');
  var allowedOrigins = ['daystarconsulting.com', 'daystar-', 'vercel.app', 'localhost', '127.0.0.1'];
  var originAllowed = allowedOrigins.some(function (o) { return origin.indexOf(o) !== -1; });
  if (origin && !originAllowed) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  /* ── Rate limiting ────────────────────────────────────────── */
  var clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    res.status(429).json({ error: 'Too many requests. Please wait a minute and try again.' });
    return;
  }

  var apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured on server' });
    return;
  }

  /* ── Validate & rebuild payload (never forward raw client body) ── */
  var body = req.body;
  if (!body || !body.messages || !Array.isArray(body.messages) || body.messages.length < 1) {
    res.status(400).json({ error: 'Invalid request body' });
    return;
  }

  var userContent = String(body.messages[0].content || '').substring(0, 15000);
  var postData = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userContent }]
  });

  var options = {
    hostname: 'api.anthropic.com',
    path: '/v1/messages',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  var apiReq = https.request(options, function (apiRes) {
    var data = '';
    apiRes.on('data', function (chunk) { data += chunk; });
    apiRes.on('end', function () {
      try {
        res.status(apiRes.statusCode).json(JSON.parse(data));
      } catch (e) {
        console.error('API response parse error:', data.substring(0, 200));
        res.status(502).json({ error: 'Report generation failed. Please try again.' });
      }
    });
  });

  apiReq.on('error', function (err) {
    console.error('Upstream API error:', err.message);
    res.status(502).json({ error: 'Report generation failed. Please try again.' });
  });

  apiReq.write(postData);
  apiReq.end();
};
