# ascii-cam

Live ASCII art from your webcam or photos (https://ascii-cam.com). Vite + React 19 single-page app, built with pnpm (`pnpm build`), deployed on Vercel from main.

- The blog is static HTML: posts are `content/blog/<slug>.md`, and `scripts/build-blog.mjs` renders them after `vite build` (see the comment at the top of that script). A weekly GitHub Action writes and publishes one post (`.github/workflows/weekly-blog.yml`, `seo/WEEKLY-POST.md`).

<!-- goose-rank:start -->
## SEO and content rules (goose-rank)

Applies to any public copy: pages, posts, titles, meta descriptions, schema.

1. **Read first:** `seo/context.md`, `seo/voice.md`, `seo/keywords.md`, `seo/links.md`. Publishing mechanics (where pages go, sitemap, llms.txt) are in `seo/site.json`.
2. **One primary keyword per page.** Check `seo/keywords.md` so two pages never target the same query. Update it when a page ships.
3. **Titles say what's inside**, lead with the words people search, and stay under 60 characters including the brand.
4. **Answer first.** Every new post or guide opens with a 40-60 word block that directly answers the title's question, with no links. AI answers and featured snippets pull from it.
5. **Use the shapes answers get lifted from**, only where they fit: a one-sentence definition, a comparison table, numbered steps, a short FAQ of real questions.
6. **At least 3 internal links** per new page, using anchors from `seo/links.md`, and link to the new page from 2+ existing pages.
7. **Only claim what's true.** No invented stats, users, reviews or features. Facts come from `seo/context.md` > "What we can claim". Schema only describes what's visible on the page.
8. **Voice:** `seo/voice.md`. No em dashes, ever.
9. **Every new page ships wired up:** its own title, description, canonical and OG tags, a sitemap entry with a real lastmod, and a line in llms.txt.
10. **Log it:** add a row to the change log in `seo/tracker.md` with the before snapshot.
<!-- goose-rank:end -->
