// Builds the blog as static HTML so crawlers can read it (the app itself is
// client-rendered). Runs after `vite build` (see the build script in package.json).
//
// Reads content/blog/*.md and writes:
//   dist/blog/<slug>/index.html   one page per post
//   dist/blog/index.html          the post list
// and adds the posts to dist/sitemap.xml, dist/llms.txt, and the homepage's
// static markup (the <!-- blog:latest --> marker in index.html), so every new
// post is linked from / and /blog without anyone editing those files.
// vercel.json routes /blog and /blog/<slug> to these files.
//
// Front matter (one `key: value` per line):
//   title, description, answer (the 40-60 word answer block), publishedAt,
//   updatedAt (YYYY-MM-DD), draft (true = skip)
//
// Markdown: there are no dependencies, so this renders the subset posts use:
// ## / ### / #### headings, paragraphs, - and 1. lists, > quotes, ``` code
// blocks, | tables |, --- rules, and inline **bold**, *italic*, `code`,
// [links](/path) and ![images](/path). Anything it can't render properly
// (an H1, raw HTML, nested lists) fails the build, so a broken post is held
// for review instead of going live.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://ascii-cam.com";
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "content/blog");
const DIST = join(ROOT, "dist");

// The 1200x630 card once public/og.png exists (branch seo/og-image), the
// favicon until then.
const OG = existsSync(join(ROOT, "public/og.png"))
  ? { url: `${SITE}/og.png`, width: 1200, height: 630, card: "summary_large_image" }
  : { url: `${SITE}/favicon.png`, card: "summary" };

const AUTHOR = { "@type": "Person", name: "Erin Kerr", url: "https://erinkerr.me" };
const BLOG = { name: "ascii-cam blog", url: `${SITE}/blog` };

const fail = (msg) => {
  console.error(`build-blog: ${msg}`);
  process.exit(1);
};

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// ---------- Front matter ----------

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function parse(file) {
  const slug = file.replace(/\.md$/, "");
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
    fail(`${file}: the file name must be lowercase letters, numbers and hyphens`);
  }
  const raw = readFileSync(join(SRC, file), "utf8").replace(/\r\n/g, "\n");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) fail(`${file}: missing front matter`);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.*)$/);
    if (!kv) continue;
    let value = kv[2].trim();
    if (/^".*"$/.test(value)) value = value.slice(1, -1).replace(/\\"/g, '"');
    else if (/^'.*'$/.test(value)) value = value.slice(1, -1);
    meta[kv[1]] = value;
  }
  for (const key of ["title", "description", "answer", "publishedAt"]) {
    if (!meta[key]) fail(`${file}: front matter needs "${key}"`);
  }
  meta.updatedAt ||= meta.publishedAt;
  for (const key of ["publishedAt", "updatedAt"]) {
    if (!DATE.test(meta[key]) || Number.isNaN(Date.parse(meta[key]))) {
      fail(`${file}: ${key} must be a date like 2026-11-04`);
    }
  }
  if (meta.updatedAt < meta.publishedAt) fail(`${file}: updatedAt is before publishedAt`);
  if (meta.description.length > 160) {
    fail(`${file}: description is ${meta.description.length} characters (max 160)`);
  }
  return { slug, ...meta, draft: meta.draft === "true", body: m[2] };
}

// ---------- Markdown (the subset described at the top) ----------

function inline(text) {
  // Code spans first, so nothing inside them gets formatted.
  return text
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (/^`[^`]+`$/.test(part)) return `<code>${esc(part.slice(1, -1))}</code>`;
      return esc(part)
        .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy" />')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<em>$2</em>");
    })
    .join("");
}

const headingId = (text) =>
  text.toLowerCase().replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const cells = (row) => row.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => c.trim());

function markdown(src, file) {
  const lines = src.split("\n");
  const out = [];
  let para = [];
  let list = null; // { tag, items: [] }

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(" "))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>\n${list.items.map((i) => `<li>${inline(i)}</li>`).join("\n")}\n</${list.tag}>`);
    list = null;
  };
  const flush = () => {
    flushPara();
    flushList();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const where = `${file} line ${i + 1}`;

    if (/^```/.test(line)) {
      flush();
      const code = [];
      for (i++; i < lines.length && !/^```\s*$/.test(lines[i]); i++) code.push(lines[i]);
      if (i >= lines.length) fail(`${where}: code block is never closed`);
      out.push(`<pre><code>${esc(code.join("\n"))}</code></pre>`);
      continue;
    }
    if (!line.trim()) {
      flush();
      continue;
    }
    if (/^# /.test(line)) fail(`${where}: no H1 in the body (the page renders the title as the H1)`);
    if (/^\s*<[a-zA-Z!/]/.test(line)) fail(`${where}: raw HTML isn't supported`);

    const h = line.match(/^(#{2,4}) (.+)$/);
    if (h) {
      flush();
      const level = h[1].length;
      const html = inline(h[2].trim());
      out.push(`<h${level} id="${headingId(html)}">${html}</h${level}>`);
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      flush();
      out.push("<hr />");
      continue;
    }
    if (/^>/.test(line)) {
      flush();
      const quote = [];
      for (; i < lines.length && /^>/.test(lines[i]); i++) quote.push(lines[i].replace(/^>\s?/, ""));
      i--;
      out.push(`<blockquote><p>${inline(quote.join(" "))}</p></blockquote>`);
      continue;
    }
    if (/^\|/.test(line) && /^\|?\s*:?-{3,}/.test(lines[i + 1] || "")) {
      flush();
      const head = cells(line);
      const rows = [];
      for (i += 2; i < lines.length && /^\|/.test(lines[i]); i++) rows.push(cells(lines[i]));
      i--;
      out.push(
        `<div class="table-wrap"><table>\n<thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>\n<tbody>\n` +
          rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("\n") +
          `\n</tbody>\n</table></div>`,
      );
      continue;
    }
    const item = line.match(/^([-*]|\d+\.) (.+)$/);
    if (item) {
      flushPara();
      const tag = /\d/.test(item[1]) ? "ol" : "ul";
      if (list && list.tag !== tag) flushList();
      list ||= { tag, items: [] };
      list.items.push(item[2]);
      continue;
    }
    if (/^\s+([-*]|\d+\.) /.test(line)) fail(`${where}: nested lists aren't supported`);
    if (list && /^\s+\S/.test(line)) {
      // An indented line continues the list item above it.
      list.items[list.items.length - 1] += ` ${line.trim()}`;
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flush();
  return out.join("\n");
}

// ---------- Page template (colors and fonts from src/index.css) ----------

const css = `
:root{--bg:#0a0a0a;--panel:#141414;--panel-2:#1c1c1c;--border:#262626;--text:#e6e6e6;--text-dim:#888;--accent:#00ff88;color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.7;-webkit-font-smoothing:antialiased}
header,main,footer{max-width:44rem;margin:0 auto;padding:0 1rem}
header{display:flex;justify-content:space-between;align-items:center;gap:1rem;height:3.5rem;border-bottom:1px solid var(--border)}
header a{color:var(--text);text-decoration:none;font-weight:600}
header .tag{color:var(--text-dim);font-weight:400;font-size:.85rem;margin-left:.5rem}
header nav{display:flex;gap:1.25rem;font-size:.9rem;white-space:nowrap}
@media (max-width:30rem){header .tag{display:none}}
a{color:var(--accent)}
main{padding-top:2.5rem;padding-bottom:3rem}
h1{font-size:2rem;line-height:1.2;margin:0 0 .5rem;letter-spacing:-.01em}
h2{font-size:1.35rem;line-height:1.3;margin:2.5rem 0 .75rem}
h3{font-size:1.1rem;line-height:1.4;margin:2rem 0 .5rem}
h4{font-size:1rem;margin:1.5rem 0 .5rem}
.meta{color:var(--text-dim);font-size:.9rem;margin:0 0 1.5rem}
.answer{background:var(--panel);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:8px;padding:1rem 1.25rem;margin:1.5rem 0 2rem}
.answer p{margin:0}
code{font-family:ui-monospace,'JetBrains Mono',Menlo,monospace;background:var(--panel-2);padding:.1rem .35rem;border-radius:4px;font-size:.9em;overflow-wrap:anywhere}
pre{background:var(--panel);border:1px solid var(--border);border-radius:8px;padding:1rem;overflow-x:auto;line-height:1.45}
pre code{background:none;padding:0;overflow-wrap:normal}
.table-wrap{overflow-x:auto;margin:1.5rem 0}
table{border-collapse:collapse;width:100%;font-size:.95rem}
th,td{border:1px solid var(--border);padding:.5rem .75rem;text-align:left;vertical-align:top}
th{background:var(--panel)}
blockquote{margin:1.5rem 0;padding:.25rem 1rem;border-left:3px solid var(--border);color:var(--text-dim)}
img{max-width:100%;height:auto;border-radius:8px}
hr{border:0;border-top:1px solid var(--border);margin:2.5rem 0}
.cta{display:inline-block;margin-top:2rem;background:var(--accent);color:#000;font-weight:600;padding:.75rem 1.25rem;border-radius:8px;text-decoration:none}
footer{border-top:1px solid var(--border);padding-top:1.5rem;padding-bottom:3rem;color:var(--text-dim);font-size:.9rem}
ul.posts{list-style:none;padding:0;margin:2rem 0 0}
ul.posts li{padding:1.25rem 0;border-bottom:1px solid var(--border)}
ul.posts a{font-weight:600;font-size:1.1rem}
ul.posts p{margin:.25rem 0 0;color:var(--text-dim)}`;

// Same analytics as index.html (GA4, Cloudflare Web Analytics, Vercel Web
// Analytics), so blog traffic shows up next to the app's.
const analytics = `<script async src="https://www.googletagmanager.com/gtag/js?id=G-L3WH3B2S68"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-L3WH3B2S68');</script>
<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "5dd883fc4e244ed9a49f5db2d5f5a7a1"}'></script>
<script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments);};</script>
<script defer src="/_vercel/insights/script.js"></script>`;

// JSON-LD can't contain a literal "</script>".
const ld = (data) => JSON.stringify(data).replace(/</g, "\\u003c");

function page({ title, description, url, type, extraMeta = "", body, jsonLd }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${url}" />
<meta name="theme-color" content="#0a0a0a" />
<link rel="icon" type="image/png" href="/favicon.png" />
<link rel="apple-touch-icon" href="/favicon.png" />
<meta property="og:type" content="${type}" />
<meta property="og:site_name" content="ascii-cam" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${OG.url}" />
${OG.width ? `<meta property="og:image:width" content="${OG.width}" />\n<meta property="og:image:height" content="${OG.height}" />\n` : ""}${extraMeta}<meta name="twitter:card" content="${OG.card}" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${OG.url}" />
<script type="application/ld+json">${ld(jsonLd)}</script>
${analytics}
<style>${css}</style>
</head>
<body>
<header><a href="/">ascii-cam<span class="tag">pixels → characters</span></a><nav><a href="/blog">Blog</a><a href="/">Open the app</a></nav></header>
<main>
${body}
</main>
<footer>ascii-cam is free, has no ads or signups, and is built by <a href="https://erinkerr.me">Erin Kerr</a>. <a href="/">Turn your webcam into ASCII art</a>.</footer>
</body>
</html>
`;
}

// ---------- Build ----------

if (!existsSync(join(DIST, "index.html"))) fail("run vite build first (dist/index.html is missing)");

const posts = existsSync(SRC)
  ? readdirSync(SRC)
      .filter((f) => f.endsWith(".md"))
      .map(parse)
      .filter((p) => !p.draft)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title))
  : [];

if (!posts.length) {
  console.log("build-blog: no published posts, skipping");
  process.exit(0);
}

const byline = (p) =>
  `By Erin Kerr · <time datetime="${p.publishedAt}">${p.publishedAt}</time>` +
  (p.updatedAt !== p.publishedAt ? ` · updated <time datetime="${p.updatedAt}">${p.updatedAt}</time>` : "");

for (const p of posts) {
  const url = `${SITE}/blog/${p.slug}`;
  const body = `<article>
<h1>${esc(p.title)}</h1>
<p class="meta">${byline(p)}</p>
<div class="answer"><p>${esc(p.answer)}</p></div>
${markdown(p.body, `content/blog/${p.slug}.md`)}
<a class="cta" href="/">Try it on your webcam in ascii-cam</a>
</article>`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: p.title,
    description: p.description,
    datePublished: p.publishedAt,
    dateModified: p.updatedAt,
    author: AUTHOR,
    image: OG.url,
    url,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: { "@type": "Blog", name: BLOG.name, url: BLOG.url },
  };
  mkdirSync(join(DIST, "blog", p.slug), { recursive: true });
  writeFileSync(
    join(DIST, "blog", p.slug, "index.html"),
    page({
      title: `${p.title} | ascii-cam`,
      description: p.description,
      url,
      type: "article",
      extraMeta: `<meta property="article:published_time" content="${p.publishedAt}" />\n<meta property="article:modified_time" content="${p.updatedAt}" />\n`,
      body,
      jsonLd,
    }),
  );
}

const list = posts
  .map((p) => `<li><a href="/blog/${p.slug}">${esc(p.title)}</a><p>${esc(p.description)}</p></li>`)
  .join("\n");
writeFileSync(
  join(DIST, "blog", "index.html"),
  page({
    title: "ascii-cam blog: making ASCII art from photos and video",
    description: "How ASCII art is made from photos and webcam video, and how to get good results with ascii-cam, the free in-browser ASCII art camera.",
    url: BLOG.url,
    type: "website",
    body: `<h1>ascii-cam blog</h1>\n<p class="meta">How ASCII art is made from photos and webcam video, and how to get good results.</p>\n<ul class="posts">\n${list}\n</ul>`,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: BLOG.name,
      url: BLOG.url,
      author: AUTHOR,
      blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: `${SITE}/blog/${p.slug}`, datePublished: p.publishedAt })),
    },
  }),
);

// Sitemap: /blog changes whenever a post does.
const newest = posts.map((p) => p.updatedAt).sort().at(-1);
const sitemapPath = join(DIST, "sitemap.xml");
const urls = [
  `  <url>\n    <loc>${SITE}/blog</loc>\n    <lastmod>${newest}</lastmod>\n  </url>`,
  ...posts.map((p) => `  <url>\n    <loc>${SITE}/blog/${p.slug}</loc>\n    <lastmod>${p.updatedAt}</lastmod>\n  </url>`),
].join("\n");
const sitemap = readFileSync(sitemapPath, "utf8");
if (!sitemap.includes("</urlset>")) fail("dist/sitemap.xml has no </urlset>");
writeFileSync(sitemapPath, sitemap.replace("</urlset>", `${urls}\n</urlset>`));

// llms.txt: replace any Blog section with the current list.
const llmsPath = join(DIST, "llms.txt");
const llms = readFileSync(llmsPath, "utf8").replace(/\n## Blog\n[\s\S]*?(?=\n## |$)/, "").trimEnd();
writeFileSync(
  llmsPath,
  `${llms}\n\n## Blog\n\n- [ascii-cam blog](${BLOG.url}): every post, newest first.\n${posts.map((p) => `- [${p.title}](${SITE}/blog/${p.slug}): ${p.description}`).join("\n")}\n`,
);

// Homepage: list the newest posts in the static markup crawlers read.
const homePath = join(DIST, "index.html");
const home = readFileSync(homePath, "utf8");
const MARKER = "<!-- blog:latest -->";
if (home.includes(MARKER)) {
  const latest = posts
    .slice(0, 3)
    .map((p) => `<li><a href="/blog/${p.slug}" style="color: #00ff88">${esc(p.title)}</a></li>`)
    .join("");
  writeFileSync(homePath, home.replace(MARKER, `<ul style="margin: 8px 0 0; padding-left: 1.4rem">${latest}</ul>`));
} else {
  console.warn(`build-blog: ${MARKER} isn't in index.html, so the homepage doesn't list the newest posts`);
}

console.log(`build-blog: ${posts.length} post(s) -> dist/blog`);
