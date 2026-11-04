# SEO launch checklist – deutschcertify.com

## 1. Domain redirects (Coolify / nginx – not possible in the static export)
- `http://` → `https://` (Coolify: enable "Force HTTPS").
- `www.deutschcertify.com` → `https://deutschcertify.com` (301; add the www domain in Coolify with redirect to the apex).
- Verify with `curl -I http://www.deutschcertify.com/` – expect a single 301 hop to the apex over HTTPS, no loop.

## 2. Google Search Console
1. https://search.google.com/search-console → Add property → **Domain** → `deutschcertify.com`.
2. Add the shown TXT record at your DNS provider; wait for propagation; click Verify.
   (The HTML-tag verification token is also already in `app/layout.tsx` for URL-prefix properties.)
3. Sitemaps → submit `https://deutschcertify.com/sitemap.xml`.
4. URL Inspection → test the homepage, `/telc-b1-vorbereitung`, `/uebungen/telc-b1-lesen`; "Request indexing" for key pages.
5. Check Pages report for unintended "Excluded by noindex".

## 3. Validation after each deploy
- https://search.google.com/test/rich-results (homepage, a landing page)
- https://validator.schema.org
- https://pagespeed.web.dev (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1)
- `/robots.txt` and `/sitemap.xml` load; hreflang pairs reciprocal.

## 4. Content workflow
Blog posts are managed in `/admin/blog`; the sitemap is generated at build time, so **redeploy after publishing** new posts, articles or lessons.
