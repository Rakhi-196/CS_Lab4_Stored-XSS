
'use strict';

const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

// ---- (A) WHERE DATA IS STORED -------------------------------------------
// A plain array in memory. It is emptied when you restart the server.
const notices = [];

// ---- (B) THE ROUTE THAT RENDERS STORED NOTICES --------------------------
app.get('/', (req, res) => {
  
  res.setHeader('Set-Cookie', 'session=demo-session-12345; Path=/');

  const items = notices
    .map((text) => `<li>${text}</li>`) // <-- (C) THE VULNERABLE LINE: raw text goes into HTML
    .join('');

  res.type('html').send(renderPage(items));
});

// ---- (D) THE ROUTE THAT ACCEPTS AND STORES A NEW NOTICE -----------------
app.post('/add', (req, res) => {
  const text = String(req.body.text || '').trim();
  if (text) {
    notices.push(text.slice(0, 500)); // stored exactly as typed
  }
  res.redirect(303, '/'); // reload the homepage -> it is rebuilt from stored data
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
  .banner{padding:10px;text-align:center;font-weight:700;background:#7f1d36;color:#ffe4ea}
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
<!-- Vulnerable version banner hidden for the initial demo -->
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
    console.log('VULNERABLE notice board running at http://localhost:3000');
  });
}

module.exports = { app };
