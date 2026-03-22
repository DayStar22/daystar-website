const https = require('https');
// Trigger redeploy — 2026-03-22

module.exports = function (req, res) {
  // DEBUG: Safe diagnostics for missing ANTHROPIC_API_KEY
  const apiKey = process.env.ANTHROPIC_API_KEY || '';
  console.log('[DEBUG] Available process.env keys:', Object.keys(process.env).sort().join(', '));
  console.log('[DEBUG] ANTHROPIC_API_KEY present:', apiKey.length > 0);
  console.log('[DEBUG] ANTHROPIC_API_KEY length:', apiKey.length);
  console.log('[DEBUG] ANTHROPIC_API_KEY starts with sk-ant-:', apiKey.startsWith('sk-ant-'));
  console.log('[DEBUG] ANTHROPIC_API_KEY typeof:', typeof process.env.ANTHROPIC_API_KEY);

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured on server' });
    return;
  }

  const postData = JSON.stringify(req.body);

  const options = {
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

  const apiReq = https.request(options, function (apiRes) {
    let data = '';
    apiRes.on('data', function (chunk) { data += chunk; });
    apiRes.on('end', function () {
      try {
        res.status(apiRes.statusCode).json(JSON.parse(data));
      } catch (e) {
        res.status(502).json({ error: 'Invalid response from API', detail: data.substring(0, 200) });
      }
    });
  });

  apiReq.on('error', function (err) {
    res.status(502).json({ error: 'Upstream API error: ' + err.message });
  });

  apiReq.write(postData);
  apiReq.end();
};
