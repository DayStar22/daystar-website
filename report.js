/* ============================================================
   DAYSTAR CANNABIS EDUCATION & CONSULTING
   AI Report Pipeline — report.js
   ============================================================ */

var DS_SYSTEM_PROMPT = "You are a cannabis grow assessment expert. Score the following grow data using this 7-category rubric totaling 100 points: Lighting (20pts), Environment & VPD (20pts), Nutrition & Water Quality (15pts), Growing Medium & Root Zone (10pts), Genetics & Strain Fit (10pts), Pest/Disease/Contamination Risk (15pts), Harvest Readiness & Post-Harvest (10pts). Return a structured report with: overall score, letter grade, per-category scores, and top 3 actionable recommendations. Format cleanly using markdown with headers (##), bold, and bullet points.";

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
          content: 'Here are the 52 grow assessment answers from a cannabis cultivator. Please analyze and score them:\n\n' + answersText
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
 * Convert markdown report text to HTML.
 */
function markdownToHtml(md) {
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
