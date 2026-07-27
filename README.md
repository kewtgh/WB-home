# Witbacon website

Static bilingual website for Witbacon recruitment and organizational consulting.

## Structure

- `index.html` — English homepage
- `zh.html` — Simplified Chinese homepage
- `privacy.html` / `privacy-zh.html` — privacy and cookie information
- `assets/css/witbacon.css` — site styles
- `assets/js/main.js` — dependency-free site interactions
- `scripts/generate-sitemap.ps1` — deterministic sitemap generator
- `scripts/validate-site.ps1` — zero-dependency quality checks
- `docs/` — audit and implementation records
- `VERSION` — release version source of truth

## Local preview

The site has no build step. Serve the repository root with any static HTTP server, for example:

```powershell
node scripts/serve-site.mjs
```

Then open `http://127.0.0.1:4173/`.

## Validate

```powershell
node --check assets/js/main.js
pwsh -File scripts/generate-sitemap.ps1
pwsh -File scripts/validate-site.ps1
```

The validator checks heading structure, local assets, anchors, image metadata, bilingual section parity, privacy pages, version metadata, and sitemap coverage.

## Analytics and privacy

Google Analytics is optional. The Google Tag script is not requested until a visitor explicitly accepts analytics in the on-page privacy controls. The preference is stored only in the visitor's browser.

The inquiry brief form does not submit to a web server. It generates a `mailto:` URL and hands the composed message to the visitor's email application.

## Release checklist

1. Update `VERSION` and the matching `meta[name="generator"]` values.
2. Make equivalent changes to both language versions.
3. Regenerate `sitemap.xml`.
4. Run the syntax and validation commands above.
5. Review desktop and mobile renders before committing.
