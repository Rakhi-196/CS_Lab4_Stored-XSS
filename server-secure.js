/**
 * Campus Notice Board - SECURE version (Stored XSS fixed)
 * -----------------------------------------------------------------------
 * Run:   npm run secure      then open  http://localhost:3000
 *
 * This is the SAME app as server-vulnerable.js. Only two things changed:
 *   (1) the new helper function escapeHtml()          <-- the mitigation
 *   (2) the render line now calls escapeHtml(text)
 * (Compare the two files in VS Code: right-click one > "Select for Compare".)
 */
'use strict';

const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

// ---- (A) WHERE DATA IS STORED -------------------------------------------
// Still stored exactly as typed. We fix the problem when DISPLAYING, not here.
const notices = [];

// ---- (E) THE MITIGATION: HTML ENTITY (OUTPUT) ENCODING --------------------
// Replaces the characters HTML treats as special with harmless text codes:
//     &  ->  &amp;     <  ->  &lt;     >  ->  &gt;     "  ->  &quot;     '  ->  &#39;
// So   <script>alert(1)</script>   is sent to the browser as
//      &lt;script&gt;alert(1)&lt;/script&gt;
// The browser can no longer find a "<script>" tag. It shows the characters as
// plain text and never runs them. ("&" must be replaced first.)
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---- (B) THE ROUTE THAT RENDERS STORED NOTICES --------------------------
app.get('/', (req, res) => {
  // Same demo cookie as the vulnerable version, so the only difference is the fix.
  res.setHeader('Set-Cookie', 'session=demo-session-12345; Path=/');

  const items = notices
    .map((text) => `<li>${escapeHtml(text)}</li>`) // <-- (C) FIXED LINE: text is encoded first
    .join('');

  res.type('html').send(renderPage(items));
});

// ---- (D) THE ROUTE THAT ACCEPTS AND STORES A NEW NOTICE -----------------
app.post('/add', (req, res) => {
  const text = String(req.body.text || '').trim();
  if (text) {
    notices.push(text.slice(0, 500)); // stored exactly as typed
  }
  res.redirect(303, '/');
});

// Demo helper: remove every stored notice.
app.post('/clear', (req, res) => {
  notices.length = 0;
  res.redirect(303, '/');
});

function renderPage(items) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Campus Notice Board</title>
<style>
  body{margin:0;font-family:"Segoe UI",Arial,sans-serif;background:#0b1130;color:#e8ebff}
  .banner{padding:10px;text-align:center;font-weight:700;background:#14532d;color:#bbf7d0}
  main{max-width:640px;margin:32px auto;padding:0 16px}
  h1{margin:0 0 4px} p.sub{margin:0 0 20px;color:#a0a9d6}
  form.add{display:flex;gap:8px;margin-bottom:12px}
  input[type=text]{flex:1;padding:11px 12px;border-radius:10px;border:1px solid #2c3878;background:#0e1642;color:#fff;font-size:1rem}
  button{padding:11px 18px;border:0;border-radius:10px;background:#7c3aed;color:#fff;font-weight:700;font-size:1rem;cursor:pointer}
  button.clear{background:transparent;border:1px solid #f43f5e;color:#fda4af;font-weight:600;padding:8px 14px;font-size:.9rem}
  ul{list-style:none;padding:0;margin:20px 0}
  li{background:#151e52;border:1px solid #2c3878;border-left:4px solid #8b5cf6;border-radius:10px;padding:12px 14px;margin-bottom:10px;overflow-wrap:anywhere}
  .empty{color:#a0a9d6}
</style></head>
<body>
<div class="banner">SECURE VERSION - output encoding is ON</div>
<main>
  <h1>Campus Notice Board</h1>
  <p class="sub">Post a notice and everyone who opens this page will see it.</p>
  <form class="add" method="post" action="/add">
    <input type="text" name="text" maxlength="500" placeholder="Write a notice..." required autofocus>
    <button type="submit">Post</button>
  </form>
  <ul>${items || '<li class="empty">No notices yet.</li>'}</ul>
  <form method="post" action="/clear"><button class="clear" type="submit">Clear all notices</button></form>
</main>
</body></html>`;
}

if (require.main === module) {
  app.listen(3000, '127.0.0.1', () => {
    console.log('SECURE notice board running at http://localhost:3000');
  });
}

module.exports = { app, escapeHtml };
