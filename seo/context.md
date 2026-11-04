# ascii-cam.com: what it is

## One line
A free web app that turns your webcam, or a photo you upload, into live ASCII art in the browser, and saves the result as a PNG, a video or a GIF.

## Who searches for this
Not checked against search volumes (no Search Console access yet). These come from what the app does and what showed up in web searches on 2026-11-04. `/goose-rank:plan` checks them.

- People who want to see themselves as ASCII art, live, usually to make a clip or a profile picture: "ascii webcam", "webcam to ascii art", "ascii camera online", "ascii art camera"
- People turning one photo into ASCII art: "image to ascii", "photo to ascii art", "ascii art generator from photo"
- People making an animated version for a post or a chat: "ascii art gif", "ascii art video", "make an ascii video of yourself"
- Developers and curious people who want to know how it's done: "how does ascii art work", "ascii characters dark to light", "ascii art javascript canvas"

## What it actually does
Paths are relative to the repo root.

- **Webcam source:** asks for the front camera at an ideal 1280x720 with `getUserMedia` (`src/components/AsciiCanvas.tsx`, webcam lifecycle effect). The app starts on the webcam by default (`src/App.tsx`, `useState<SourceKind>('webcam')`).
- **Photo source:** "Upload image" opens a file picker for any image type (`accept="image/*"` in `src/components/Controls.tsx`). The file becomes a local object URL (`URL.createObjectURL` in `src/App.tsx` handlePickImage), so it isn't sent anywhere. There's no video-file upload.
- **Live rendering:** one `requestAnimationFrame` loop redraws the ASCII art every frame, and slider changes apply without restarting it (`src/components/AsciiCanvas.tsx`, "The render loop").
- **How the conversion works** (`src/utils/asciiConverter.ts`, `renderAscii`):
  - The source is drawn onto a hidden canvas that is one pixel per character cell (for example 120x70), so the browser's own image scaling averages each cell's color.
  - A character cell is 0.6 times as wide as it is tall (`charWidth = charHeight * 0.6`), and the font size sets the cell height.
  - Each cell's brightness uses the ITU-R BT.709 weights: `0.2126 * r + 0.7152 * g + 0.0722 * b`, applied straight to the 0-255 pixel values.
  - Contrast is a power curve around the midpoint: factor `2^(3 * contrast)`, so 0 is neutral, 1 is 8x and 2 is 64x. Brightness adds up to plus or minus 255.
  - Invert flips the mapping, then the value picks a character: `ramp[floor(lum / 255 * (ramp.length - 1))]`.
  - Each row is drawn with one `fillText` call, not one call per character.
- **Character sets** (`src/constants/charSets.ts`): nine presets plus a Custom box where you type your own characters, dark to light.

  | Preset | Characters |
  |---|---|
  | Blocks | `█▓▒░` and a space (5) |
  | Density, simple | `@%#*+=-:.` and a space (10, Paul Bourke's 10-level ramp, reversed) |
  | Density, complex | Paul Bourke's 70-character ramp, `$@B%8&WM#*oahkbd...` down to a space |
  | Binary | `1`, `0` and a space (3) |
  | Stars | `★✦✧··` and a space (6) |
  | Circles | `●◉○◌··` and a space (7) |
  | Hearts | `♥♡··` and a space (5) |
  | Dots | `●•··` and a space (5) |
  | Arrows | `↟↑⇡··` and a space (6) |

  The dropdown labels for the two density sets have an em dash between "Density" and "simple"/"complex", so write them as "Density (simple)" and "Density (complex)" in posts.
- **Controls** (`src/components/Controls.tsx`, mobile versions in `src/components/MobileControls.tsx`): text color and background color pickers, Contrast slider (-1 to 2), Brightness (-1 to 1), Char size (6 to 28 px), and Mirror, Invert, Portrait and Landscape toggles.
- **Defaults** (`src/App.tsx`, `DEFAULT_OPTIONS`): Circles, 12 px characters, contrast 0.15, green `#00ff88` text on `#0a0a0a`, Invert on (light text on a dark background needs the ramp flipped), Mirror on.
- **Framing** (`src/utils/asciiConverter.ts`): Portrait crops to 3:4 and Landscape to 16:9, with bars on the sides or top and bottom. The webcam fills the frame and is drawn 4% narrower than the source (`SLIM_FACTOR = 0.96`, described in the code as a front-camera-style slimming effect). Uploaded photos keep their whole frame and get black bars instead of being cropped.
- **Save PNG:** saves the visible area (no orientation bars) as a PNG (`screenshot` in `src/components/AsciiCanvas.tsx`).
- **Video:** records the canvas at 30 fps and 8 Mbps with `MediaRecorder`. It saves MP4 (H.264) when the browser can record it and WebM otherwise (the `candidates` list in `startRecording`). No time limit in the code.
- **GIF:** grabs a frame every 100 ms (10 fps), stops on its own at 15 seconds, scales down to at most 640 px wide, and encodes with gif.js in two Web Workers while showing "Encoding N%" (`GIF_FRAME_INTERVAL_MS`, `GIF_MAX_SECONDS`, `GIF_MAX_WIDTH`, `encodeAndDownload`). Video and GIF can't record at the same time (the buttons disable each other in `Controls.tsx`).
- **Saving on phones:** on touch devices it opens the share sheet (Web Share API) so a PNG or video can go straight to Photos, and falls back to a normal download (`saveFile` in `src/components/AsciiCanvas.tsx`, commit 72deba9 "Use Web Share API for exports so iOS can save to Photos").
- **After a save:** a "support your local dev" card links to erinkerr.me, buymeacoffee.com/ernkerr and cybergoose.org (`src/components/ThanksModal.tsx`).
- **No accounts, no server code:** there's no backend in the repo and no `fetch`, XHR or WebSocket call in `src/`. The page does load GA4 (`G-L3WH3B2S68`) and Cloudflare Web Analytics (`index.html`) and Vercel Web Analytics (`<Analytics />` in `src/App.tsx`).

## What we can claim
- Free, with no signup and no ads (no auth anywhere in the code; `ThanksModal.tsx` copy "free and always will be. no ads, no signups"; JSON-LD offer price 0 in `index.html`)
- Runs in the browser with nothing to install
- Your camera feed and uploaded photos are converted on your device and aren't uploaded (no network calls in `src/`, photos load from a local object URL). Say it about the images; the page itself does load analytics.
- Live: the art redraws every frame as you move (`requestAnimationFrame`)
- Nine character sets plus your own custom set, listed in the table above
- Text and background colors, contrast, brightness and character size (6 to 28 px) are adjustable
- Exports: PNG; video as MP4 where the browser supports recording it, WebM otherwise; GIF up to 15 seconds at 10 fps, at most 640 px wide
- Portrait (3:4) and Landscape (16:9) crops
- The exact formulas above (BT.709 weights, `2^(3c)` contrast, 0.6 cell width, one `fillText` per row), quoted from the code
- Built by Erin Kerr (`public/llms.txt`, `ThanksModal.tsx`)

Not claimable yet:
- **Copyable text output.** Every export is an image or a video. There's no copy-as-text, `.txt` or HTML export, which many competitors have. Don't imply you can paste the result into a chat or a README.
- **"Export MP4" with no caveat.** The file is WebM in browsers whose `MediaRecorder` can't write MP4. Don't name which browsers without a source.
- **"Ten character sets"** (`index.html`, `public/llms.txt`). It's nine presets plus a custom box.
- **Converting a video file.** Only images can be uploaded.
- **Color ASCII** (each character in its source pixel's color). There's one text color for the whole frame.
- **A virtual camera** for Zoom, Meet or OBS. ascii-cam doesn't create one.
- **Smoothing between frames.** `AsciiCanvas.tsx` has a `prevPixelsRef` "for temporal smoothing", but the renderer never reads it.
- **Tested on specific phones or browsers.** The code has a mobile layout and an iOS-minded share sheet path, but nothing in the repo records device testing.
- **Any number about users, visits, ratings or reviews.** There's no usage data in the repo.

## What's different about it
Most of the webcam tools that show up are demos or single-purpose pages. asciiart.eu's webcam page exports text, image, ANSI and more, but fullscreen and PDF export are premium. Jasper Bernaers' ASCII Webcam is the closest match: no upload, video up to 2 minutes (MP4 or WebM), a 3-second looping GIF up to 480 px wide, and .txt, .html and ANSI exports. The rest are GitHub demos, itch.io pages, terminal tools and App Store apps (both checked 2026-11-04). ascii-cam puts a webcam and a photo upload, nine character sets (blocks, binary, stars, circles, hearts, dots, arrows and two density ramps) plus your own, color pickers, and PNG, video and 15-second GIF export in one free page with no account. Its blog can also show the real code behind each step, which tool pages don't.

## Who ranks now (web search, 2026-11-04)
- **"ascii webcam online":** GitHub repos (astroforgit/ascii-camera, XorcodeYt/Webcam-to-ASCII), lib.rs ascii-webcam crate, asciiart.eu/webcam-to-ascii-art, nosense-3d.itch.io/webacm-ascii, jasperbernaers.com/ascii-webcam, salman-m-498.github.io/ascii-cam-web, plus old news posts (hipertextual, maketecheasier). Mostly small sites, so a small site can win.
- **"ascii-cam.com":** ascii-cam.com didn't appear, even for its own name. Results were similarly named projects: the ASCII Camera iOS app (Ambor), experiments.withgoogle.com/ascii-cam (2012), a Hackaday post, idevelop/ascii-camera.
- **"ascii art generator from photo free":** tool pages (asciiart.eu/image-to-ascii, textstudio.com, imageonline.io, codetap.org, madegooddesigns.com, goinnobuds.com), App Store apps and a Chrome extension.
- **"how does ascii art work brightness to characters":** a docs.rs crate, a Medium tutorial, GitHub marcoplaitano/image-to-ascii-art, codeshack.io, and small explainer pages (asciiforge.pages.dev/how-it-works, pixotter.pages.dev/blog/image-to-ascii-art, a dev.to post).
- **"ascii art javascript canvas tutorial webcam":** two Medium tutorials (Aleksandr Kubarskii, Mario Tacke), a GitHub gist (joeskeen), dev.to, collidingScopes/ascii.

Sources: https://asciiart.eu/webcam-to-ascii-art, https://jasperbernaers.com/ascii-webcam/, https://nosense-3d.itch.io/webacm-ascii, https://salman-m-498.github.io/ascii-cam-web, https://apps.apple.com/us/app/id6748850196, https://experiments.withgoogle.com/ascii-cam, https://asciiforge.pages.dev/how-it-works, https://pixotter.pages.dev/blog/image-to-ascii-art/, https://dev.to/linmingren/i-turned-photos-into-ascii-art-without-a-single-server-call-heres-how-59c4, https://medium.com/@mariotacke/building-a-real-time-ascii-camera-filter-in-plain-javascript-5b6e1f2f95f9, https://paulbourke.net/dataformats/asciiart/
