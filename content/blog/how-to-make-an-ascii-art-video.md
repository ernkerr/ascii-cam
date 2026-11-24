---
title: "How to make an ASCII art video of yourself"
description: "Record an ASCII art video of yourself from your webcam in the browser: steps, the real settings (30 fps, MP4 or WebM), and how to save it on a phone."
answer: "To make an ASCII art video of yourself, open a tool that reads your webcam, pick a character set and colors, press the record button, move around, then stop. In ascii-cam the video records at 30 frames per second and saves as MP4 when your browser can record it, or WebM when it can't."
publishedAt: 2026-11-24
updatedAt: 2026-11-24
---

Most of what comes up for this is either a command line script that converts a video file you already have, or a Python project you run locally. Those work, but they start from a file. This post is the other route: no install, you point your webcam at yourself and record.

There are a few browser tools that do it, like Jasper Bernaers' ASCII Webcam and the JavaInuse video converter. I built [ascii-cam](/) for the same job, so everything below is what the app really does, with the numbers from its code.

## Record the video in five steps

1. Open [ascii-cam](/) and allow the camera when your browser asks. It starts on the webcam by default.
2. Pick a character set from the dropdown (nine presets plus a Custom box). [ASCII characters from dark to light](/blog/ascii-characters-dark-to-light) shows what each one looks like.
3. Set the colors, contrast and character size until the preview looks right. The art redraws every frame, so you see each change right away.
4. Choose Portrait (3:4) or Landscape (16:9). The framing is locked in the moment you start recording, so pick it first.
5. Press the record button (it says **MP4** on desktop). It turns into **Stop** with a running timer. Move around, then press **Stop** and the file saves.

## What you get

| Setting | Value |
|---|---|
| Frame rate | 30 fps |
| Bitrate | 8 Mbps |
| Format | MP4 (H.264) when the browser can record it, WebM otherwise |
| Framing | Cropped to your Portrait or Landscape choice, with no bars |
| Length | No limit in the code |

I set the bitrate to 8 Mbps on purpose. The default is around 2.5 Mbps, and bright neon text on a black background smears when it's compressed that hard.

Two things worth knowing. The video has no sound, because the recorder captures the canvas and not your microphone. And whether you get MP4 or WebM depends on your browser, so check the file extension after you save.

## Tips for a video that looks good

- **Pick a ramp with fewer characters.** Blocks or Density (simple) stay readable when you move. The 70 character ramp turns busy.
- **Raise Contrast a little.** Faces in flat light come out as one gray, and a bit of contrast gives the characters something to separate.
- **Use a bigger Char size** (the range is 6 to 28 px) if you want the effect to read on a small screen.
- **Light the front of your face.** Brightness is what picks each character, so a window behind you makes a dark blob.

## Saving it on a phone

On a touch device, the finished video goes through the share sheet, so you can send it straight to Photos or a chat. On a laptop it's a normal download.

## Things to know

- You can't record a video and a GIF at the same time, because the two buttons disable each other.
- Your camera feed is converted on your device and isn't uploaded. The video is built in your browser.
- Only the webcam and photos work as a source. ascii-cam can't convert a video file you already have.

## FAQ

### How long can the video be?

The code has no time limit. The recording is held in memory until you stop, so a very long clip is limited by your device.

### Can I add sound?

No. The recording is the picture only.

### Should I make a video or a GIF?

A video is smoother (30 fps) and sharper. A [GIF](/blog/how-to-make-an-ascii-art-gif) is 10 fps, at most 640 px wide and 15 seconds, but plays anywhere and loops by itself.

## Try it

Open [ascii-cam](/), pick a ramp and press record. If you're curious how each frame turns into characters, [how ASCII art works](/blog/how-ascii-art-works) walks through the code.
