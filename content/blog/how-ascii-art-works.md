---
title: "How ASCII art works: from pixels to characters"
description: "How a photo or webcam frame turns into ASCII art: the character grid, the brightness math, character ramps, aspect ratio and contrast, with real code."
answer: "ASCII art works by shrinking a picture into a grid with one cell per character, measuring how bright each cell is, and swapping in a character with about that much ink. Dense characters like @ fill the dark areas and light ones like . or a space fill the bright areas, so the text reads as the picture."
publishedAt: 2026-11-04
updatedAt: 2026-11-04
---

Think of it like a mosaic where every tile is a character. Up close you see `@`, `#` and `:`, and from a few steps back the heavy tiles and the light tiles turn into a face. An ASCII art generator is a fast way of picking those tiles, and the explainers from [ASCII Forge](https://asciiforge.pages.dev/how-it-works) and [Pixotter](https://pixotter.pages.dev/blog/image-to-ascii-art/) describe the same basic pipeline that ascii-cam uses.

I built [ascii-cam](/) to do this live on a webcam, so every step below comes with the real numbers from its code, and you can try each one in the app while you read.

## 1. Shrink the picture to one pixel per character

First you decide how many characters fit across and down, then you shrink the image to exactly that size, so every pixel that's left becomes one character.

In ascii-cam the font size sets the grid. Each character cell is as tall as the font size and 0.6 times as wide, so at the default 12 px a cell is 7.2 px wide, and a canvas 1,200 by 900 px fits 167 characters across and 75 rows down. The webcam frame gets drawn onto a hidden canvas that's exactly 167 by 75 pixels, and the browser's own image scaling blends the real pixels inside each cell into one color. Doing that yourself means looping over every pixel in every cell, and the browser does it for free.

The Char size slider goes from 6 to 28 px. Smaller means more characters and more detail, and at 28 px that same canvas only fits 72 characters across, which is a really different look.

## 2. Measure how bright each cell is

Next, each cell's color becomes one brightness number from 0 (black) to 255 (white). The simplest way is to average red, green and blue, and some converters do exactly that (like the one in [this dev.to write-up](https://dev.to/linmingren/i-turned-photos-into-ascii-art-without-a-single-server-call-heres-how-59c4)).

Your eyes don't see the three colors as equally bright, though, so most tools weight them. ascii-cam uses the ITU-R BT.709 weights:

```
brightness = 0.2126 * red + 0.7152 * green + 0.0722 * blue
```

Those are the same weights [relative luminance](https://en.wikipedia.org/wiki/Relative_luminance) uses for sRGB screens, where green is the biggest part of what we see as brightness and blue is the smallest. You'll also see `0.299 * R + 0.587 * G + 0.114 * B` in a lot of tutorials (Pixotter's guide uses it), which is the BT.601 version of the same idea. ascii-cam applies its weights straight to the 0 to 255 values without converting to linear light first, which keeps it to one line of math per cell.

## 3. Swap the brightness for a character

This is where the ramp comes in. A ramp is a string of characters sorted from the most ink to the least, ending in a space for pure white, and the brightness picks a spot along it:

```
character = ramp[floor(brightness / 255 * (ramp.length - 1))]
```

Two ramps that show up in a lot of generators, including the Pixotter and dev.to examples above, come from [Paul Bourke's page on ASCII art](https://paulbourke.net/dataformats/asciiart/). ascii-cam ships both, plus a set made from Unicode shading blocks:

| Set in ascii-cam | Characters, dark to light | Steps of gray |
|---|---|---|
| Density (simple) | `@%#*+=-:.` and a space | 10 |
| Density (complex) | `$@B%8&WM#*oahkbdpqwm` and 50 more, down to a space | 70 |
| Blocks | `█▓▒░` and a space | 5 |

A longer ramp has more steps of gray, so it can hold more detail, and Pixotter suggests the 70-character one for photos that are 150 or more characters wide. Switch between the two density sets in ascii-cam with your face in frame and you'll see the difference right away.

The ramp doesn't have to be letters at all. ascii-cam also has Binary (`1`, `0` and a space), Stars, Circles, Hearts, Dots and Arrows, plus a Custom box where you type your own characters, dark to light. The math only cares about the order, so anything works as long as it goes from heavy to light.

## 4. Keep the picture from stretching

Characters are taller than they are wide, so if every square pixel became one character, the picture would come out stretched tall. ASCII Forge and Pixotter both fix this by sampling about 0.55 rows for every column.

ascii-cam builds the grid out of character-shaped cells instead. It divides the canvas width by 0.6 times the font size and the height by the font size, and the crop math uses the same 0.6, so each cell already has the shape of the character that lands in it and your face keeps its proportions.

## 5. Push the contrast, and flip it for dark backgrounds

If a photo is mostly mid-tones, most cells land in the middle of the ramp and the picture turns into a gray wash of `+` and `=`. Contrast pushes values away from the middle so more cells reach the heavy and light ends.

ascii-cam's contrast is a power curve around middle gray (128). The factor is `2^(3 * contrast)`, so 0 changes nothing, 1 multiplies the distance from the middle by 8, and the slider's max of 2 multiplies it by 64, which is close to pure black and white. Brightness just adds or subtracts up to 255 from every cell.

Invert flips the ramp. Ramps assume dark ink on white paper, but ascii-cam draws bright green text on a near-black background, so a bright pixel needs a dense character. That's why Invert is on by default, and why you'd turn it off if you pick a light background color.

## 6. Draw the characters

The last step is writing the characters back out. ascii-cam builds each row as one string and draws it with a single `fillText` call, so that 167 by 75 grid is 75 draw calls instead of 12,525. On the webcam it runs all six steps again on every animation frame, which is why the art follows you when you move.

## Tips for better results

- **Light your face from the front and keep the background plain.** The picture only exists as differences in brightness, and Pixotter's guide says high-contrast images with clear edges convert best.
- **Reach for the Contrast slider when it looks flat.** It decides how much of the ramp actually gets used, so if the picture looks gray and mushy, push it up.
- **Go small on Char size for detail and big for a bold look.** 6 px gives you the most characters and 28 px the fewest.
- **Try a different ramp before a different photo.** Blocks look solid, Binary turns you into ones and zeros, and Stars, Hearts and Circles make a portrait look decorative.

## FAQ

### Is it still ASCII art if it uses █ or ★?

Strictly, no. ASCII is a set of 128 characters, 95 of them printable ([Wikipedia](https://en.wikipedia.org/wiki/ASCII)), and blocks, stars and hearts come from Unicode. People call it all ASCII art anyway, and the method is exactly the same for any character.

### Can ASCII art be in color?

Yes. Some generators draw each character in the color of the pixels it replaced (the dev.to tool above does). ascii-cam uses one text color and one background color that you pick, which is how you get green on black, or pink on white, or whatever you like.

### Can I copy the text out of ascii-cam?

Not today. ascii-cam saves pictures and video: a PNG, a video (MP4 when your browser can record it, WebM otherwise) or a GIF of up to 15 seconds. It's made for sharing the image, not for pasting characters into a chat.

The quickest way to get a feel for all of this is to open [ascii-cam](/), drag Char size down to 6 and Contrast up past 1, and watch your face turn into characters (nothing gets uploaded, it all runs in your browser). More posts like this one are on [the ascii-cam blog](/blog).
