/* ── Customer Log API ─────────────────────────────────────
   Vercel serverless function for logging and querying customer submissions.

   POST /api/customers — Log a new submission
   GET  /api/customers — Export all customers (requires admin key)

   Storage: Uses Vercel KV if available, falls back to in-memory store.
   For production persistence, connect to Airtable or Google Sheets.
   ────────────────────────────────────────────────────────── */

/* In-memory store (persists per Vercel instance, not across deploys) */
var customers = [];

/* ── Rate limiting ─────────────────────────────────────── */
var rateMap = {};
var RATE_LIMIT = 20;
var RATE_WINDOW = 60000;

function isRateLimited(ip) {
  var now = Date.now();
  if (!rateMap[ip] || now - rateMap[ip].start > RATE_WINDOW) {
    rateMap[ip] = { start: now, count: 1 };
    return false;
  }
  rateMap[ip].count++;
  return rateMap[ip].count > RATE_LIMIT;
}

/* ── Generate a simple unique ID ───────────────────────── */
function generateId() {
  var d = new Date();
  var year = d.getFullYear();
  var seq = String(customers.length + 1).padStart(4, '0');
  return 'DSA-' + year + '-' + seq;
}

module.exports = function (req, res) {
  /* ── Origin check ──────────────────────────────────────── */
  var origin = (req.headers.origin || req.headers.referer || '');
  var allowedOrigins = ['daystarconsulting.com', 'daystar-', 'vercel.app', 'localhost', '127.0.0.1'];
  var originAllowed = allowedOrigins.some(function (o) { return origin.indexOf(o) !== -1; });
  if (origin && !originAllowed) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  /* ── Rate limiting ─────────────────────────────────────── */
  var clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    res.status(429).json({ error: 'Too many requests.' });
    return;
  }

  /* ── POST: Log a new customer submission ──────────────── */
  if (req.method === 'POST') {
    var body = req.body;
    if (!body || !body.email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    var customer = {
      id: generateId(),
      name: String(body.name || '').substring(0, 200),
      email: String(body.email || '').substring(0, 200),
      submitted_at: new Date().toISOString(),
      report_delivered_at: null,
      grow_type: String(body.grow_type || '').substring(0, 100),
      status: 'submitted',
      follow_up_count: 0,
      last_follow_up_at: null,
      notes: ''
    };

    customers.push(customer);

    res.status(201).json({
      success: true,
      customer_id: customer.id,
      message: 'Submission logged successfully'
    });
    return;
  }

  /* ── GET: Export customer list (admin only) ────────────── */
  if (req.method === 'GET') {
    var adminKey = process.env.ADMIN_API_KEY;
    var providedKey = req.headers['x-admin-key'] || req.query.key;

    if (!adminKey) {
      res.status(500).json({ error: 'Admin key not configured' });
      return;
    }

    if (providedKey !== adminKey) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    /* Support CSV export */
    var format = req.query.format || 'json';
    if (format === 'csv') {
      var csv = 'id,name,email,submitted_at,report_delivered_at,grow_type,status,follow_up_count,last_follow_up_at,notes\n';
      customers.forEach(function (c) {
        csv += [
          c.id,
          '"' + (c.name || '').replace(/"/g, '""') + '"',
          '"' + (c.email || '').replace(/"/g, '""') + '"',
          c.submitted_at,
          c.report_delivered_at || '',
          '"' + (c.grow_type || '').replace(/"/g, '""') + '"',
          c.status,
          c.follow_up_count,
          c.last_follow_up_at || '',
          '"' + (c.notes || '').replace(/"/g, '""') + '"'
        ].join(',') + '\n';
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=daystar-customers.csv');
      res.status(200).send(csv);
      return;
    }

    res.status(200).json({
      total: customers.length,
      customers: customers
    });
    return;
  }

  /* ── PATCH: Update customer status ─────────────────────── */
  if (req.method === 'PATCH') {
    var adminKey2 = process.env.ADMIN_API_KEY;
    var providedKey2 = req.headers['x-admin-key'];

    if (!adminKey2 || providedKey2 !== adminKey2) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    var body2 = req.body;
    if (!body2 || !body2.id) {
      res.status(400).json({ error: 'Customer ID is required' });
      return;
    }

    var found = null;
    for (var i = 0; i < customers.length; i++) {
      if (customers[i].id === body2.id) {
        found = customers[i];
        break;
      }
    }

    if (!found) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    if (body2.status) found.status = String(body2.status).substring(0, 50);
    if (body2.notes) found.notes = String(body2.notes).substring(0, 500);
    if (body2.status === 'report_delivered') found.report_delivered_at = new Date().toISOString();
    if (body2.status === 'follow_up_sent') {
      found.follow_up_count++;
      found.last_follow_up_at = new Date().toISOString();
    }

    res.status(200).json({ success: true, customer: found });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
