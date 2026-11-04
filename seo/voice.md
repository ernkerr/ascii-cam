# Voice

Distilled from Erin's voice files (`~/code/build-in-public/data/local/voice/` and `data/voice/`) for web pages and posts. Copied here so cloud runs have it. If the source files change, re-run `/goose-rank:init` to refresh this.

## How it should sound

- Written the way Erin would explain it out loud to a friend who codes. Warm run-ons joined with "and" beat clipped, polished sentences.
- Explain with an analogy first ("think of it like..."), then the mechanism. A stepwise breakdown with no analogy reads as skippable.
- Receipts over adjectives: real numbers, real commands, real file names. "pulls your commit count from the GitHub API every hour" beats "powerful syncing".
- "really" is the intensifier. Parentheticals for warmth are fine: "(especially for solo projects)".
- Capital "I" always.
- One real question is allowed as a call to action. No reply-farming questions.

## Never

- **Em dashes.** Use " - " with spaces, a comma, or a new sentence.
- **Words:** genuinely (as an intensifier), chaos, clarity, delve, foster, tapestry, leverage, robust, comprehensive, seamless, game-changer, unlock, cutting-edge, Furthermore, Moreover, Notably, In summary.
- **Cadences:** runs of three-word sentences; dramatic fragments ("And that changes everything."); "It's not X. It's Y."; "Not because X. Because Y."; "Here's the trick."; "That's it. That's the whole thing."; "Excited to share"; "Here's why this matters".
- **Marketing filler:** "take your X to the next level", "in today's fast-paced world", "whether you're a beginner or a pro".

## Self-check before shipping

```bash
grep -n -E '—|genuinely|delve|leverage|robust|comprehensive|seamless|game-changer|unlock|cutting-edge|tapestry|foster|Moreover|Furthermore|Notably' <file>
```
Zero hits, or rewrite.
