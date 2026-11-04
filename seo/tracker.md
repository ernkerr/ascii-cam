# SEO tracker: ascii-cam.com

Snapshots live in `seo/data/`. Compare any two with `node ~/code/goose-rank/scripts/data.mjs compare --before <a> --after <b> [--page <path>]`.

## Baseline (2026-11-04)

This run had no Search Console or GA4 API access, so there's no snapshot in `seo/data/` and no search numbers. The baseline is the live checks below. To add the real "before": check whether ascii-cam.com is in Search Console (if not, add a URL-prefix property `https://ascii-cam.com/` with the HTML file method and submit the sitemap), add `seo-reader@erin-seo-tracking-1015.iam.gserviceaccount.com` to it (Restricted) and as a Viewer in GA4, then run `node ~/code/goose-rank/scripts/data.mjs snapshot --site <property> --out seo/data`. Search Console backfills, so the "before" isn't lost.

| Metric | Value | Source |
|---|---|---|
| Search Console | Not checked (no API access in this run). Clicks, impressions, position and indexed pages unknown | |
| GA4 | Installed (`G-L3WH3B2S68`), page views only, no events in the code. Property ID unknown | index.html |
| Other analytics | Cloudflare Web Analytics beacon (index.html), Vercel Web Analytics component (src/App.tsx) | code |
| Primary host | https://ascii-cam.com serves 200. http://ascii-cam.com 308 → https://ascii-cam.com/ | curl |
| www | DNS points at Vercel, but www.ascii-cam.com isn't on the Vercel project, so HTTPS fails ("no alternative certificate subject name matches") | curl -v, Vercel project domains |
| HTTPS | Valid on the bare domain (CN=ascii-cam.com, expires 2027-01-18) | curl -v |
| robots.txt, sitemap.xml, llms.txt | All 200 | curl |
| Sitemap URLs | 1 (/), lastmod 2026-07-15 | sitemap.xml |
| Indexable pages | 1 (/) | sitemap.xml, live HTML |
| /blog | 404 (no blog yet) | curl |
| Unknown URLs | 404 (no SPA fallback rewrite) | curl /this-page-does-not-exist |
| Homepage title | "ascii-cam" + em dash + "live ASCII art from your webcam or photos", 53 characters | live HTML |
| Homepage description | 176 characters (results usually cut around 155-160), starts "Free online ASCII art generator." | index.html |
| Homepage text readable without JS | Yes: the static section inside `#root` (intro paragraph and "How it works" list) | curl |
| Homepage internal links | None to other pages | live HTML |
| Structured data | WebApplication only (creator "ern") | live HTML |
| OG image | /favicon.png (909x671). /og.png is 404 live; a 1200x630 og.png is committed on the local branch seo/og-image, not pushed | live HTML, git |
| Found in web search for "ascii-cam.com" | No, only similarly named projects | web search, 2026-11-04 |
| Bing Webmaster | No sign of verification (no BingSiteAuth.xml, no msvalidate tag) | curl |
| Last production deploy | 2026-07-15, 8d973c4 on main | Vercel |

## Change log

Every shipped change gets a row the day it ships. "Before" is the newest snapshot at ship time. `/goose-rank:check` fills in the 2w, 4w and 8w columns.

| Shipped | Change | Page | Target query | Before | 2w | 4w | 8w | Verdict |
|---|---|---|---|---|---|---|---|---|
| 2026-11-04 | Static blog (scripts/build-blog.mjs): /blog and /blog/<slug> as real HTML, added to the sitemap and llms.txt, linked from the homepage's static markup, plus the weekly-post workflow. On branch seo/weekly-blog, live once merged | /blog | | Baseline: /blog 404, 1 URL in the sitemap | | | | |
| 2026-11-04 | New post | /blog/how-ascii-art-works | how does ascii art work | none (new page) | | | | |

## Weekly checks

Newest first, three lines each: what moved, what didn't, what's next.
