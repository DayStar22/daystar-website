/* ============================================================
   DAYSTAR CANNABIS EDUCATION & CONSULTING
   AI Report Pipeline — report.js
   ============================================================ */

var DS_SYSTEM_PROMPT = "You are a cannabis cultivation education expert. Analyze the following grow data using a 7-category framework: Lighting, Environment & VPD, Nutrition & Water Quality, Growing Medium & Root Zone, Genetics & Strain Fit, Pest/Disease/Contamination Risk, Harvest Readiness & Post-Harvest. Do NOT use numerical scores, letter grades, pass/fail language, or any grading terminology. Instead, use growth-stage indicators for each category: Seedling (just starting), Vegetative (building foundations), Flowering (strong and developing), Harvest Ready (fully optimized). For each category, describe the current growth stage and identify specific optimizations. Provide a Growth Progress Snapshot summarizing how many of the 7 categories are fully optimized (e.g., '5 of 7 categories optimized'). For each category, use language like 'Strong Foundation — 2 key optimizations identified' rather than point values. Return a structured report with: Growth Progress Snapshot, per-category growth stage and analysis, and top 3 actionable recommendations with forward-looking language (e.g., 'On your next run, try [X] to move from [current] to [target]'). End each recommendation with encouragement to come back after implementing changes to track progress. If pH, runoff pH, or runoff EC/PPM fields are blank or missing, the grower likely uses no-till living soil or organic methods — skip those sub-evaluations and redistribute your analysis proportionally across the remaining data points for that category. Do not penalize blank pH/runoff fields. If the grower specifies genetics type (Autoflower vs Photoperiod), tailor recommendations accordingly: for autoflowers, adjust light schedule advice (18/6 or 20/4 throughout, no flip needed), note shorter timelines, and consider DLI implications of extended photoperiods; for photoperiods, provide standard veg/flower transition guidance. If genetics type is blank or 'Unknown', provide general recommendations that cover both. Format cleanly using markdown with headers (##), bold, and bullet points.";

/**
 * Collect all form answers into a readable string for the AI prompt.
 */
function collectFormAnswers(form) {
  var data = new FormData(form);
  var lines = [];

  // Get all unique field names
  var seen = {};
  var entries = [];
  for (var pair of data.entries()) {
    var key = pair[0];
    var val = pair[1];
    if (key.startsWith('_')) continue; // skip hidden Formspree fields
    if (seen[key]) {
      // Checkbox: append value
      seen[key].val += ', ' + val;
    } else {
      var entry = { key: key, val: val };
      seen[key] = entry;
      entries.push(entry);
    }
  }

  entries.forEach(function (e) {
    // Convert field name to readable label
    var label = e.key
      .replace(/^q\d+_/, '')
      .replace(/^grower_/, '')
      .replace(/_/g, ' ')
      .replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    lines.push(label + ': ' + e.val);
  });

  return lines.join('\n');
}

/**
 * Send answers to Claude API and return the report text.
 */
function generateReport(answersText) {
  return fetch('/api/report', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: DS_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: 'Here are the 52 grow analysis answers from a cannabis cultivator. Please analyze them and provide a personalized growth report:\n\n' + answersText
        }
      ]
    })
  })
  .then(function (resp) {
    if (!resp.ok) {
      return resp.text().then(function (t) { throw new Error('API error: ' + t); });
    }
    return resp.json();
  })
  .then(function (json) {
    // Extract text from the response
    var text = '';
    if (json.content && json.content.length > 0) {
      json.content.forEach(function (block) {
        if (block.type === 'text') text += block.text;
      });
    }
    if (!text) throw new Error('Empty response from AI');
    return text;
  });
}

/**
 * Escape HTML entities to prevent XSS.
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Convert markdown report text to HTML.
 * Input is escaped first to prevent XSS from AI-generated content.
 */
function markdownToHtml(md) {
  md = escapeHtml(md);
  return md
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr>')
    // Unordered lists
    .replace(/^[-*] (.+)$/gm, '<li>$1</li>')
    // Wrap consecutive <li> in <ul>
    .replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Paragraphs (double newlines)
    .replace(/\n\n/g, '</p><p>')
    // Single newlines within paragraphs
    .replace(/\n/g, '<br>');
}

/**
 * Extract plain text from markdown for email body.
 */
function markdownToPlainText(md) {
  return md
    .replace(/^#{1,3} /gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^---$/gm, '————————————————')
    .replace(/^[-*] /gm, '• ');
}
