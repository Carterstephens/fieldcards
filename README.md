# Fieldcards

Quizlet-style flashcards for learning the birds of North America by sight and by sound.

- About 700 native North American species in 25 pre-built sets: backyard birds (East and West), Hawaiʻi, pelagic seabirds, waterfowl, shorebirds, raptors, owls, warblers, sparrows, flycatchers, and more
- Each card has photos, songs and calls, field marks, size and habitat, a range map, and a short summary
- The card front can be a photo, a sound, or a mix of both
- Spaced repetition: rate each card "Missed", "Hard" or "Got it", and birds you miss come back sooner
- Mark a bird **✓ Confident** (or press C) to take it out of rotation in every set. Restore birds from the **Confident** tab on any set page.
- Progress is saved in your browser, with no account needed

## Run it

```sh
npm install
npm run dev        # open the printed localhost URL
```

To build a static site for any host (GitHub Pages, Netlify, or a folder on disk):

```sh
npm run build      # output goes to dist/
npm run preview
```

## Refresh the bird data

```sh
npm run data
```

This fetches media for every species listed in `scripts/content/` and writes `src/data/`. For xeno-canto recordings, which are labeled as songs and calls, put a free API key from <https://xeno-canto.org/account> in `.env`:

```
XC_API_KEY=your-key
```

Without a key, the build uses research-grade recordings from iNaturalist instead.

## Credits and licenses

Photos and recordings come from iNaturalist and xeno-canto contributors. Range maps come from Wikimedia Commons, and summaries come from Wikipedia. Every item is credited on its card with its author and Creative Commons license, and links to its original page. Some media uses non-commercial (NC) licenses, so this project is meant for personal and educational use. Check the licenses before using it commercially.

Media is shown unmodified and loaded from its original host; this repository doesn't store copies of any photos, recordings or maps. Wikipedia summaries are used under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). The app's own code and hand-written field notes carry no third-party license.

The media is the work of its creators. If you're one of them and want something removed, open an issue.
