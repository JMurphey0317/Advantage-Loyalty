# Advantage-Loyalty

A static-site repository that serves assets for **Salesforce Lightning Out 2.0** and **Lightning Web Components (LWC)** via GitHub Pages.

---

## GitHub Pages

The site is published from the `docs/` folder on the `main` branch.

### Enabling GitHub Pages (one-time setup)

1. Go to **Settings → Pages** in this repository.
2. Under **Source**, select **Deploy from a branch**.
3. Choose **Branch: `main`** and **Folder: `/docs`**.
4. Click **Save**. GitHub will build and publish the site within a few minutes.

**Live URL (active after setup):** `https://jmurphey0317.github.io/Advantage-Loyalty/`

---

## Repository layout

```
docs/               ← GitHub Pages root (publish from here)
├── index.html      ← Site entry point
└── assets/
    ├── app.js      ← Example JS bundle; add additional bundles here
    └── styles.css  ← Base stylesheet; add additional CSS here
```

### Adding or updating hosted files

- Place JavaScript bundles, CSS files, and any other static resources inside `docs/assets/`.
- Reference them with a relative path from `index.html`, e.g. `<script src="assets/my-bundle.js"></script>`.
- Commit and push to `main`; GitHub Pages automatically redeploys.

---

## Consuming assets from Salesforce

### 1 · Load scripts and stylesheets via HTTPS

Use the absolute GitHub Pages URL to load assets in Salesforce:

```html
<!-- Visualforce / Lightning Out host page -->
<!-- Replace app.js with your actual application bundle(s) -->
<script src="https://jmurphey0317.github.io/Advantage-Loyalty/assets/app.js"></script>
<link rel="stylesheet" href="https://jmurphey0317.github.io/Advantage-Loyalty/assets/styles.css" />
```

### 2 · Add the domain to CSP Trusted Sites

In **Setup → CSP Trusted Sites**, add:

| Name | URL | Context |
|---|---|---|
| AdvantageLoyaltyPages | `https://jmurphey0317.github.io` | All (or Script, Style as needed) |

### 3 · Cross-origin considerations

GitHub Pages serves assets with permissive CORS headers (`Access-Control-Allow-Origin: *`), so scripts loaded via `<script src="…">` and CSS via `<link>` will work without additional configuration.

If you use `fetch()` or `XMLHttpRequest` against the Pages origin from within an LWC, no extra CORS setup is needed on the GitHub side.

### 4 · Lightning Out 2.0 integration notes

- Keep all JavaScript as **external files** (no inline scripts) to stay compatible with Salesforce's strict Content Security Policy.
- Reference Lightning Out bootstrap from your Salesforce org and load app-specific bundles from GitHub Pages.
- Test in a sandbox first; CSP Trusted Sites and Remote Site Settings may both need to be configured depending on your org edition.