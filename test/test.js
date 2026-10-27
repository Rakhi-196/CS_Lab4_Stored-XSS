/*
 * Automated tests. Run with:  npm test
 * Starts both versions on random local ports, sends real HTTP requests, and
 * checks the HTML the server sends to the browser.
 *   - vulnerable: payload arrives RAW  (<script>...)  -> a browser would run it
 *   - secure:     payload arrives ENCODED (&lt;script&gt;...) -> only text
 * These tests do not open a browser; the alert is shown in the manual demo.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const vulnerable = require('../server-vulnerable.js');
const secure = require('../server-secure.js');

const PAYLOAD = "<script>alert('Stored XSS demonstration')</script>";
const ENCODED = '&lt;script&gt;alert(&#39;Stored XSS demonstration&#39;)&lt;/script&gt;';

function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => resolve({ server, base: 'http://localhost:' + server.address().port }));
  });
}

async function post(base, path, text) {
  return fetch(base + path, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(text === undefined ? {} : { text }).toString(),
  });
}

async function home(base) {
  const res = await fetch(base + '/');
  return { res, html: await res.text() };
}

for (const [name, mod, isSecure] of [['VULNERABLE', vulnerable, false], ['SECURE', secure, true]]) {
  test(`${name}: normal notice is stored and shown again after reload`, async () => {
    const { server, base } = await listen(mod.app);
    try {
      let { res, html } = await home(base);
      assert.equal(res.status, 200);
      assert.match(html, /No notices yet/);
      assert.match(html, isSecure ? /SECURE VERSION/ : /VULNERABLE VERSION/);
      assert.match(res.headers.get('set-cookie'), /session=demo-session-12345/);

      const added = await post(base, '/add', 'Library closes at 8 PM today');
      assert.equal(added.status, 303);
      ({ html } = await home(base));
      assert.match(html, /<li>Library closes at 8 PM today<\/li>/);
      ({ html } = await home(base)); // a second, separate page load
      assert.match(html, /<li>Library closes at 8 PM today<\/li>/);

      await post(base, '/add', '   '); // empty notices are ignored
      ({ html } = await home(base));
      assert.equal((html.match(/<li>/g) || []).length, 1);

      await post(base, '/clear');
      ({ html } = await home(base));
      assert.match(html, /No notices yet/);
    } finally {
      server.close();
    }
  });

  test(`${name}: stored payload is rendered ${isSecure ? 'ENCODED (inert text)' : 'RAW (executable)'}`, async () => {
    const { server, base } = await listen(mod.app);
    try {
      await post(base, '/add', PAYLOAD);
      const { html } = await home(base);
      if (isSecure) {
        assert.ok(html.includes(`<li>${ENCODED}</li>`));
        assert.ok(!html.includes(PAYLOAD));
      } else {
        assert.ok(html.includes(`<li>${PAYLOAD}</li>`));
        assert.ok(!html.includes(ENCODED));
      }
      await post(base, '/clear');
    } finally {
      server.close();
    }
  });
}

test('escapeHtml encodes & < > " \' and does not double-encode in the wrong order', () => {
  assert.equal(secure.escapeHtml(`<>&"'`), '&lt;&gt;&amp;&quot;&#39;');
  assert.equal(secure.escapeHtml('&lt;'), '&amp;lt;');
});
