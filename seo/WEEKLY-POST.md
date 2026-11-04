# Weekly post (run by .github/workflows/weekly-blog.yml)

You are writing this week's ascii-cam blog post. It publishes automatically: the workflow checks it (one new post, complete front matter, no banned words or placeholder text, the build renders it), opens a PR and merges it, and Vercel deploys it. Nobody reads it before it goes live, so every sentence has to be one Erin would be happy to have her name on. One good post beats a long one.

Read these first, all of them: `seo/context.md`, `seo/voice.md`, `seo/keywords.md`, `seo/links.md`, `seo/site.json`, the goose-rank section of `CLAUDE.md`, and the published posts in `content/blog/` (match their voice and don't repeat them).

## 1. Pick the topic

Take the first row in `seo/topics.md` with status `queued`. Its Notes say what ranks now, what ascii-cam adds, and any claim to be careful with. Follow them.

If there isn't one, refill the queue. Pick candidates from `seo/keywords.md` (ideas and secondaries) and from what the product really does, WebSearch each one, and look at what ranks:

- Can a small site win? Forums, Reddit, small blogs or thin pages in the top 10 mean yes. All big brands means skip it.
- What type of page wins (list, how-to, comparison, definition)? Match it.
- What can ascii-cam add that they don't (the product doing the thing, real numbers from its code, firsthand experience building it)? If nothing, skip it.

Add the 3 best to `seo/topics.md` with status `queued` and that evidence in Notes, then carry on with the first one. Only queue a topic ascii-cam can say something true and useful about, and never one that another page in `seo/keywords.md` already targets.

## 2. Research

WebSearch the topic's primary keyword and open the top 3-5 results (WebFetch). Note what every top result covers (those are the sections a searcher expects), the questions people ask (People Also Ask, Reddit threads), and what this post can add that they can't.

## 3. Write

- **Title:** the words people search, says what's inside, under 50 characters (the site adds " | ascii-cam").
- **Answer:** 40-60 words that directly answer the title's question, no links. It goes in the `answer` front matter field and the page shows it first.
- **Body:** cover what the top results cover, then add the thing only ascii-cam can (usually the app doing it, with the real settings and numbers from `seo/context.md`). Use a table, numbered steps or a short FAQ where they fit, not by default. H2s and H3s only (the page renders the title as the H1).
- **Facts:** product claims only from `seo/context.md` > "What we can claim", and read its "Not claimable yet" list too. Anything else needs a link to a source you opened. Never estimate a number. If a claim can't be backed up, cut it.
- **Voice:** `seo/voice.md`. Write it the way Erin would explain it to a friend, not like a content mill. Erin built ascii-cam, so "I" is fine for things the code shows she built, but never invent an experience or a story.
- **Links:** at least 3 internal links using the anchors in `seo/links.md` (root-relative paths like `/` and `/blog/<slug>`), and one natural call to action pointing at the product doing what the post is about. Link to earlier posts where they really help.
- **Markdown:** the build has its own small renderer. It handles `##`/`###`/`####` headings, paragraphs, `-` and `1.` lists (one level), `>` quotes, fenced code blocks, pipe tables, `---`, and inline `**bold**`, `*italic*`, backtick code, `[links](/path)` and `![images](/path)`. An H1, raw HTML or a nested list fails the build, which holds the post for review.

Then check it, and rewrite until both are clean:

```bash
grep -n -E '—|genuinely|delve|leverage|robust|comprehensive|seamless|game-changer|unlock|cutting-edge|tapestry|foster|Moreover|Furthermore|Notably' content/blog/<slug>.md
grep -n -i -E 'lorem ipsum|\bTODO\b|\bTBD\b|\[insert|placeholder|as an ai' content/blog/<slug>.md
```

If the post isn't good enough to publish after one rewrite (it leans on claims you couldn't source, or it says nothing the top results don't), don't publish it: leave `content/blog/` untouched, mark the topic `held` in `seo/topics.md` with the reason in Notes, and write the PR files (step 5) titled `seo: held "<topic>" for review`. The workflow then leaves the PR open for Erin.

## 4. Publish into the site

Write `content/blog/<slug>.md` (lowercase letters, numbers and hyphens; make sure the file doesn't already exist):

```markdown
---
title: "<title>"
description: "<meta description, under 155 characters>"
answer: "<the 40-60 word answer>"
publishedAt: <today, YYYY-MM-DD>
updatedAt: <today, YYYY-MM-DD>
---

<body, starting with the first H2 or an intro paragraph>
```

Use straight double quotes around the three text fields, and write `\"` for a double quote inside them.

Run the build (`pnpm build`) and open the built page (`dist/blog/<slug>/index.html`): the title, canonical and answer must be in the HTML, and the build log must say `build-blog: N post(s)`. The build also adds the post to `/blog`, the sitemap, llms.txt and the homepage's newest-posts list, so don't edit `public/llms.txt`, `public/sitemap.xml` or `index.html`. Then update the records:

- `seo/keywords.md`: add the post's row with status `live`, and remove its keyword from "Queued in seo/topics.md"
- `seo/links.md`: add the post and its anchor
- `seo/topics.md`: mark the topic `published` with today's date
- `seo/tracker.md` change log: date, "New post", `/blog/<slug>`, primary keyword, Before = `none (new page)`

## 5. PR files

Write two files in `.weekly-pr/` (it is not committed; the workflow reads it):

- `.weekly-pr/title.txt`: one line, `blog: <post title>`
- `.weekly-pr/body.md`:
  - Target keyword, and the post's URL (`https://ascii-cam.com/blog/<slug>`)
  - What the top results cover, and what this post adds that they don't (two or three bullets)
  - **Facts and sources:** every factual claim in the post, each with its source
  - **To change it later:** edit `content/blog/<slug>.md` on main

Don't commit, push, or open the PR yourself. The workflow does that from your file changes.
