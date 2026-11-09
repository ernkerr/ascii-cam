---
title: "ASCII characters from dark to light: every ramp"
description: "ASCII characters sorted dark to light: Paul Bourke's 10 and 70 level ramps, block and Unicode sets, and how to build your own ramp. Try each one live."
answer: "ASCII characters sorted from dark to light go roughly @ % # * + = - : . and then a space, with the heaviest characters first. That 10 character ramp is the short classic. Paul Bourke's longer 70 character ramp starts $ @ B % 8 & W M and adds finer steps of gray for detailed photos."
publishedAt: 2026-11-09
updatedAt: 2026-11-09
---

A ramp is a string of characters sorted by how much ink each one puts on the screen, with the heaviest first and a space last. An ASCII art tool turns each bit of the picture into a brightness number and picks a spot along that string. Think of it like a paint-by-numbers set where every number is a character instead of a color.

The order is the whole trick. This post is the reference list: the classic ramps, the Unicode ones, and how to make your own. For the math that picks the character, see [how ASCII art works](/blog/how-ascii-art-works).

## The classic ramps

Most generators use one of two ramps from [Paul Bourke's page on ASCII art](https://paulbourke.net/dataformats/asciiart/). He gives a 70 level ramp as the standard one for gray scale pictures, and a shorter 10 level one that he calls more convincing for its size.

| Ramp | Characters, dark to light | Levels |
|---|---|---|
| Short (10 levels) | `@%#*+=-:.` and a space | 10 |
| Long (Bourke, 70 levels) | `$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\|()1{}[]?-_+~<>i!lI;:,"^` followed by a backtick, `'`, `.` and a space | 70 |

Bourke's page lists the short one the other way around (light to dark, starting with a space), so if you copy a ramp from somewhere, check which end is which. A search for these ramps turns up sources that label the same string both ways.

The reason a letter like `@` is dark and a `.` is light is simple: [as Marmelab puts it](https://marmelab.com/blog/2018/02/20/convert-image-to-ascii-art-masterpiece.html), `@` is darker than `.` because it takes up more space on screen. That also means a ramp depends on the font. Bourke notes the apparent density of some characters changes from one typeface to another.

## Which one should you use?

- **The short ramp** is good for faces and high contrast pictures, and it stays readable when the characters are small.
- **The long ramp** has more steps of gray, so it holds smooth gradients, but [Pixotter's guide](https://pixotter.pages.dev/blog/image-to-ascii-art/) says it needs about 150 or more columns before the extra characters help instead of adding noise.
- **Fewer than 10 characters** works too. Pixotter suggests picking 8 to 15 for your own ramp.

## Every ramp in ascii-cam

I built [ascii-cam](/) with nine presets plus a Custom box. Here they are in the order the code stores them, dark to light:

| Preset | Characters | Levels |
|---|---|---|
| Blocks | `█▓▒░` and a space | 5 |
| Density (simple) | `@%#*+=-:.` and a space | 10 |
| Density (complex) | Bourke's 70 character ramp | 70 |
| Binary | `1`, `0` and a space | 3 |
| Stars | `★✦✧··` and a space | 6 |
| Circles | `●◉○◌··` and a space | 7 |
| Hearts | `♥♡··` and a space | 5 |
| Dots | `●•··` and a space | 5 |
| Arrows | `↟↑⇡··` and a space | 6 |

A few things about these:

- **Density (simple)** is Bourke's short ramp, written heavy to light.
- **Blocks** use the Unicode shading characters, which go from a solid block through three shades to a space. They look clean and poster-like.
- **Binary** only has three levels, so it's more of a Matrix effect than a likeness.
- **Stars, Circles, Hearts, Dots and Arrows** are decorative. They have a few levels each, so they work best on a portrait with a lot of contrast.- **Custom** takes whatever you type, dark to light.

Strictly, only the density ramps are ASCII. Blocks, stars and hearts are Unicode, and the method is exactly the same.

## Make your own ramp

1. Pick 8 to 15 characters. Letters, digits, punctuation and symbols all work.
2. Sort them by how much ink they use, heaviest first. A quick way is to type them in a monospace font and squint: the ones that look darkest go on the left.
3. End with a space so pure white is blank.
4. Open ascii-cam, choose Custom in the character set menu and type the string in.
5. Check it on a face. If the middle of the picture looks muddy, two of your characters are probably in the wrong order.

The converter only looks at the order, so a ramp of `#=-.` and a space works just fine. The font matters, so what looks right in one typeface can look off in another.

## Dark backgrounds need the ramp flipped

Ramps assume dark ink on white paper, where a dark pixel gets a dense character. On a black background it's the other way around: bright areas should get the dense characters. Pixotter points this out too, and tools like jp2a have an invert flag for it.

ascii-cam draws bright text on a dark background by default, so Invert is on to flip the mapping. If you pick a light background color, turn Invert off.

## FAQ

### What is the best character set for ASCII art?

For photos at 150 or more columns, the 70 character ramp gives the most detail. For faces at a normal size, the 10 character ramp is cleaner. Try both on the same picture in ascii-cam and keep whichever you like.

### Why does the ramp end with a space?

A space has no ink, so it's what pure white looks like. Without it, the brightest areas would still get a visible character.

### Can I use my own characters in a ramp?

Letters and symbols work as long as you order them by how heavy they look. ascii-cam's Custom box takes the characters you type, dark to light.

Open [ascii-cam](/), pick a preset and then try your own string in Custom while your face is in frame. It runs in your browser, and nothing you point the camera at gets uploaded. More posts are on [the ascii-cam blog](/blog).
