# DayStar Cannabis Education & Consulting — Marketing Website

**Tagline:** Your Growth, Guided.

Plain HTML/CSS/JS marketing site. No build step. No dependencies. Open in a browser or serve with any static file server.

---

## File Structure

```
/
├── index.html          → Home (landing page)
├── assessment.html     → Assessment order page
├── intake-form.html    → 52-question grow assessment intake form
├── results.html        → AI-generated report display page
├── sample.html         → Sample report viewer (4-page mock)
├── about.html          → About Lance + DayStar
├── contact.html        → Contact form
├── blog.html           → Content hub (6 placeholder posts)
├── styles.css          → All styles (CSS variables, components, responsive)
├── script.js           → Mobile nav, FAQ accordion, form handler, scroll reveal
├── report.js           → AI report pipeline (form collection, API call, markdown→HTML)
├── server.js           → Node.js dev server with /api/report proxy to Anthropic API
├── .claude/
│   └── launch.json     → Dev server configurations
└── README.md
```

---

## Running Locally

**Option A — Node server with AI reports (recommended)**
```bash
ANTHROPIC_API_KEY=sk-ant-... node server.js
```
Then open: http://localhost:3000
This enables the `/api/report` proxy so the intake form → AI report pipeline works.

**Option B — Static only (no AI reports)**
```bash
npx serve . --listen 3000
```
or
```bash
python -m http.server 8080
```
The marketing pages work, but the intake form won't generate AI reports without the server proxy.

**Option C — VS Code**
Install the "Live Server" extension, right-click `index.html` → Open with Live Server. (Static pages only.)

> Do not open HTML files directly via `file://` — some browsers restrict font/asset loading from local file paths.

---

## Before Launch: Replace All Placeholders

Search for `TODO` comments and `[PLACEHOLDER]` text throughout the files.

### Prices
| Location | What to replace |
|---|---|
| `index.html` — hero CTA button | `$[PRICE]` |
| `index.html` — pricing card | `$[PRICE]` |
| `assessment.html` — payhip block | `$[PRICE]` |

### Payhip Integration
In `assessment.html`, replace the placeholder button with the real Payhip embed:
```html
<!-- Replace this: -->
<a href="#payhip-placeholder" class="payhip-btn">Get My Assessment Now</a>

<!-- With this (Payhip overlay button): -->
<a href="https://payhip.com/b/YOUR_PRODUCT_ID" class="payhip-btn payhip-button" data-theme="none">
  Get My Assessment Now
</a>
<script src="https://payhip.com/payhip.js"></script>
```

### Contact Email
In `contact.html`, replace `[EMAIL PLACEHOLDER]` with your real contact email address.

### Contact Form Backend
The form in `contact.html` currently shows a success message on submit but does not send data.
Wire it to a backend before launch:

- **Formspree:** Add `action="https://formspree.io/f/YOUR_ID" method="POST"` to the `<form>` tag
- **Netlify Forms:** Add `data-netlify="true"` to the `<form>` tag (if deploying to Netlify)
- **EmailJS:** Integrate via the EmailJS JS SDK in `script.js`

### OG / Social Images
Each page has:
```html
<meta property="og:image" content="<!-- TODO: Replace with real OG image URL -->">
<meta property="og:url"   content="<!-- TODO: Replace with production URL -->">
```
Replace with your actual domain and a 1200×630px OG image once the site is live.

### Testimonials
In `index.html`, three testimonial cards are marked `[PLACEHOLDER]`. Replace with real customer quotes before launch.

---

## Brand Colors (CSS Variables)

Defined in `styles.css` `:root` — change once, updates everywhere:

```css
--color-bg:        #1B1F1C   /* Dark background */
--color-gold:      #D4AF37   /* Primary accent — headlines, CTAs */
--color-green:     #2D5A27   /* Secondary accent — CTA strips, labels */
--color-parchment: #F4F1EA   /* Body text on dark */
```

---

## Fonts

- **Headlines:** Poppins Bold — loaded via Google Fonts CDN
- **Body/Data:** DejaVu Sans Mono (with Courier New fallback) — system font stack

To use self-hosted fonts instead, download Poppins from Google Fonts, place in a `/fonts/` directory, and replace the `@import` in `styles.css` with `@font-face` declarations.

---

## Deploying

### Netlify (recommended — free tier)
1. Drag and drop this folder into app.netlify.com/drop
2. Done. Netlify assigns a URL instantly.
3. Add your custom domain in Site Settings → Domain Management.

### GitHub Pages
1. Push this folder to a GitHub repo
2. Settings → Pages → Source: main branch / root
3. Site is live at `https://yourusername.github.io/repo-name`

### Cloudflare Pages
1. Connect your GitHub repo at pages.cloudflare.com
2. No build command needed — output directory is `/`

---

## Adding Real Blog Posts

Each blog post should be a new HTML file (e.g., `blog/vpd-guide.html`) using the same nav/footer pattern. Update the `href` links in `blog.html` to point to the real post files.

For SEO, each post needs:
- Unique `<title>` and `<meta name="description">`
- Proper heading hierarchy (one `<h1>` per page)
- Internal links back to `/assessment.html` as CTA

---

## SEO Checklist (pre-launch)

- [ ] Replace all `og:url` and `og:image` meta tags
- [ ] Set real canonical URLs if using a CMS
- [ ] Submit `sitemap.xml` to Google Search Console (create manually or via a tool)
- [ ] Add `robots.txt` (allow all for marketing site)
- [ ] Verify Google Analytics or privacy-friendly analytics (Plausible, Fathom) is installed
- [ ] Run Lighthouse audit — target 90+ on Performance, Accessibility, SEO
