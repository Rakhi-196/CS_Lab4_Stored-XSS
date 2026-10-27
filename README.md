# Campus Notice Board — Stored XSS Lab

**Course:** Cyber Security (IT-30001)  
**Assignment:** Web Server Security  
**Category:** Cross-Site Scripting (XSS)  
**Variant:** Stored XSS

## 1. Project Overview

Campus Notice Board is a small web application built with Node.js and Express. Users can post notices, and everyone who opens the page can see them.

The project contains two versions:

| File | Purpose |
|---|---|
| `server-vulnerable.js` | Intentionally vulnerable version demonstrating Stored XSS |
| `server-secure.js` | Fixed version using HTML output encoding |

**Safety warning:** The vulnerable version is for local classroom demonstrations only. Do not deploy it publicly.

## 2. Ownership Declaration

| Member name        |  ROLL-NO  |     Category                 |     Variant implemented  |
|---|---|---|---|
| Rakhi Chauhan      |IIT2024269 |  Cross-Site Scripting (XSS)  |      Stored XSS          |
| Mogal Saith Sumayya|IIB2024032 |SQL INJECTION                 |   Authentication Bypass  |
| Bavya Shivani      |IIT2024275 | OS command Injection         |         IN-Band          |

## 3. Requirements and Setup

**Requirements:** Node.js and npm, VS Code, and a web browser.

1. Open the `noticeboard` folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Install dependencies:

   ```powershell
   npm install
   ```

4. Start the vulnerable version:

   ```powershell
   npm run vulnerable
   ```

5. Open `http://localhost:3000` in your browser.

To switch versions, stop the current server with `Ctrl + C`, then run:

```powershell
npm run secure
```

Open or refresh `http://localhost:3000` to view the secure version.

**Note:** Both versions use port 3000, so only one should run at a time. Notices are stored in an in-memory array and are cleared when the server restarts.

## 4. How the Application Works

1. A user enters a notice and clicks **Post**.
2. The `POST /add` route receives the input and stores it in the `notices` array.
3. The browser is redirected to the homepage.
4. The `GET /` route reads the stored notices and generates the HTML page.

In the vulnerable version, the stored input is inserted into HTML without encoding. The browser may interpret injected HTML or JavaScript as executable code.

This is called **Stored XSS** because the payload is stored before it executes when the page is displayed.

## 5. Vulnerability Demonstration

### A. Vulnerable implementation

File: `server-vulnerable.js`

The `POST /add` route stores the notice:

```js
notices.push(text.slice(0, 500));
```

The vulnerable rendering line is:

```js
.map((text) => `<li>${text}</li>`)
```

The user-controlled text is inserted directly into the HTML without output encoding.

### B. Working exploit

In the vulnerable version, enter this harmless test payload into the notice box and click **Post**:

```html
<script>alert('Stored XSS demonstration')</script>
```

**Expected result:** A JavaScript alert appears. Refreshing the page can trigger the alert again because the notice remains stored in the running server's memory.

This demonstrates that stored user input can execute as JavaScript when rendered as HTML.

### C. Root cause

The root cause is that untrusted user input is stored and later inserted into the HTML page without output encoding. As a result, the browser interprets the injected script as code rather than plain text.

## 6. Mitigation: HTML Output Encoding

File: `server-secure.js`

The secure version introduces the `escapeHtml()` function:

```js
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

The rendering line is changed to:

```js
.map((text) => `<li>${escapeHtml(text)}</li>`)
```

The function encodes special HTML characters before the notice is inserted into the page. For example, `<` becomes `&lt;` and `>` becomes `&gt;`.

The browser therefore displays the injected script as text instead of executing it.

### Secure-Version Verification

1. Stop the vulnerable server using `Ctrl + C`.
2. Start the secure version with `npm run secure`.
3. Submit the same test payload.
4. Confirm that the payload appears as plain text and no alert appears.
5. Refresh the page and confirm that the payload still does not execute.

**Expected result:** The same payload that executed in the vulnerable version is displayed as text in the secure version.

## 7. Other Mitigation Techniques

Output encoding is the primary mitigation demonstrated in this project. Other defences include:

- **Context-aware output encoding:** Encode untrusted data according to where it is placed, such as HTML text, attributes, JavaScript, or URLs.
- **Framework auto-escaping:** Use frameworks and template engines that escape output by default, avoiding unsafe raw HTML rendering.
- **HTML sanitisation:** Use a trusted sanitiser such as DOMPurify when users are allowed to submit limited HTML formatting.
- **Content Security Policy (CSP):** Restrict which scripts the browser is allowed to execute, providing an additional layer of protection.
- **HttpOnly cookies:** Prevent JavaScript from reading cookies marked `HttpOnly`, reducing the risk of cookie theft through XSS.
- **Safe DOM methods:** Prefer `textContent` over `innerHTML` when displaying untrusted text in client-side JavaScript.

These defences should be used together where appropriate. They provide additional protection, but they do not replace correct output encoding.

