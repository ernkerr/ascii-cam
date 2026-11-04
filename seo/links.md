# Internal links

Use these anchors when linking between pages. Add every new page here the day it ships, and link to it from at least 2 existing pages.

In posts, link with root-relative paths (`/`, `/blog`, `/blog/<slug>`). New posts get two links in automatically: the build lists every post on `/blog` and the 3 newest in the homepage's static markup.

| Page | URL | Anchor text | Linked from |
|---|---|---|---|
| Home (the app) | https://ascii-cam.com/ | ascii-cam, turn your webcam into ASCII art | every blog page (header, footer, end-of-post button), llms.txt |
| Blog | https://ascii-cam.com/blog | the ascii-cam blog | homepage static markup inside `#root`, every blog page header, llms.txt, sitemap |
| How ASCII art works | https://ascii-cam.com/blog/how-ascii-art-works | how ASCII art works | /blog, homepage newest-posts list (added by the build), llms.txt |

The React app itself (what visitors see after the JavaScript loads) doesn't link to the blog yet. The link above is in the static HTML that crawlers read and React replaces on load.
