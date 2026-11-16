---
title: "How to make an ASCII art GIF from your webcam"
description: "Make an ASCII art GIF from your webcam in the browser: five steps, the settings that matter, and the real limits (10 fps, 15 seconds, 640 px wide)."
answer: "To make an ASCII art GIF, open a tool that reads your webcam, pick a character set and colors, press the GIF button to record, then stop and wait for the encode. In ascii-cam the GIF records at 10 frames per second for up to 15 seconds and downloads when encoding finishes."
publishedAt: 2026-11-16
updatedAt: 2026-11-16
---

Search for this and most of what comes up is command line tools. Asciinator, ascii-image-converter and monochora (a Rust crate) all turn an existing GIF into an ASCII GIF, and they work well if you're happy in a terminal. This post is the other route: no install, no file to start from, you just point your webcam at yourself and record.

I built [ascii-cam](/) to do exactly that, so the steps below are what the app really does, with the real numbers from its code.

## Make the GIF in five steps

1. Open [ascii-cam](/) and allow the camera when your browser asks. It starts on the webcam by default.
2. Pick a character set from the dropdown. There are nine presets plus a Custom box (see [ASCII characters from dark to light](/blog/ascii-characters-dark-to-light) for what each one looks like).
3. Set the colors, contrast and character size until you like the preview. The art redraws every frame, so you see changes as you make them.
4. Press **GIF**. The button turns into **Stop** with a running timer. Move around, wave, make a face.
5. Press **Stop** (or wait, because it stops on its own at 15 seconds). The button shows "Encoding N%" while the GIF is built, and the file downloads when it hits 100%.

On a phone the finished file goes through the share sheet, so you can send it to Photos or a chat. Elsewhere it's a normal download.

## What you get

| Setting | Value |
|---|---|
| Frame rate | 10 frames per second (a frame every 100 ms) |
| Longest clip | 15 seconds |
| Width | At most 640 px (scaled down if the canvas is wider) |
| Framing | Cropped to your Portrait (3:4) or Landscape (16:9) choice, with no bars |
| Encoding | gif.js, in two Web Workers, with a progress readout |

Ten frames a second is why a GIF looks choppier than the live preview, which redraws on every animation frame. ASCII art suits that fine, since the characters already read as a bit retro. If you want smooth motion instead, record a video (it captures at 30 fps).

## Tips for a GIF that looks good

- **Bigger characters survive better.** A GIF is capped at 640 px wide, so tiny characters turn to mush. Raise Char size (the range is 6 to 28 px) if the text looks fuzzy.
- **Use fewer characters.** A short ramp like Blocks or Density (simple) holds up better at low resolution than the 70 character ramp.
- **Add contrast.** Faces in flat light come out as one gray. A little more Contrast gives the characters something to separate.
- **Keep it short.** GIFs are big files. Five seconds of a loop is usually all you need.
- **Pick the orientation first.** Portrait or Landscape is locked in when you start recording, so choose before you press GIF.

## Things to know

You can't record a GIF and a video at the same time, because the two buttons disable each other. The photo upload works too, but a still photo makes a very boring GIF, so for a photo [save a PNG](/) instead.

The camera feed and your photos are converted on your device and aren't uploaded anywhere. The GIF is built in your browser too.

## FAQ

### How long can an ASCII art GIF be?

In ascii-cam, 15 seconds. It stops on its own at that point and starts encoding.

### Can I turn an existing GIF into ASCII art here?

No. ascii-cam takes a live webcam or a single photo, and doesn't read GIF or video files. For converting a file you'd want one of the command line tools above.

### Does the GIF have a transparent background?

No. The background color you picked is part of the image.

### Should I make a GIF or a video?

A GIF plays anywhere and loops by itself, but it's 10 fps and capped at 640 px wide. A video is smoother (30 fps) and can run longer. Pick the GIF for chats and posts that autoplay, and the video when you want it to look good.

## Try it

Open [ascii-cam](/), pick a ramp and press GIF. If you want to know how each frame becomes characters, [how ASCII art works](/blog/how-ascii-art-works) walks through the code.
