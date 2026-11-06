# Fieldcards: North American bird flashcards

A static, Quizlet-style flashcard site for North American birds. It uses Vite, React and TypeScript, and has no backend: progress is stored in localStorage under the key `birdcards:v1`.

## Commands
- `npm run data`: rebuild `src/data/species.json` and `sets.json` from the seeds. This is slow on the first run because of rate limits. Responses are cached in `scripts/.cache/`.
- `npm run dev` / `npm run build` / `npm run preview`.

## How it fits together
- `scripts/content/*.ts` holds the hand-written content for each species: names, field marks, size, habitat, and `sets` tags. **These files are the source of truth.** To add a species, add a seed here and rerun `npm run data`.
  - Each scientific name appears in only one file. To put a bird in a second set, add another tag to its `sets` list; don't duplicate the entry.
- `scripts/sets.config.ts` holds each set's title, description and icon (`setMeta`) and the home-page sections (`setGroups`). To add a set, add its id to `SetId` in `scripts/types.ts`, give it an entry in `setMeta`, and place it in exactly one `setGroups` section; the build fails if a set is missing from `setGroups`.
- `scripts/build-data.ts` gathers media for each seed:
  - photos from iNaturalist
  - sounds from xeno-canto when `XC_API_KEY` is in `.env`, otherwise CC-licensed research-grade iNaturalist recordings. xeno-canto searches try US and Canadian recordings before widening to the Americas and then anywhere. If a bird has no local song but has local calls, it gets two local calls instead (e.g. Barn Owl).
  - range maps from Wikidata P181 and Wikimedia Commons
  - summaries from Wikipedia
- The three region sets (All Eastern / Central / Western) are not tagged in content. `regionMembership` in `build-data.ts` computes them from iNaturalist research-grade sighting counts for the states and provinces listed in `regions` (`sets.config.ts`). Counts are weighted by each region's total birding activity, and a species joins a region at ≥5 sightings and ≥5% share; the per-species shares are saved to `scripts/.cache/region-shares.json` for tuning.
- `src/data/*.json` is generated; don't edit it by hand. The app never calls APIs at runtime, it only loads media URLs.
- `src/lib/srs.ts` is the Leitner spaced-repetition scheduler with 5 boxes. The "Confident" list (`store.confident` in `src/lib/storage.ts`) holds species ids that are skipped in every set until the user restores them from the Confident tab on the set page. `src/pages/Study.tsx` runs a session: missed cards come back once more at the end, and keys 1/2/3 grade a card.

## Conventions
- Every photo, recording and map must show its credit through `Attribution` in `src/components/Media.tsx`.
- Names follow the AOS/eBird checklist. When iNaturalist's taxonomy differs, the build script falls back to searching by common name and logs a `~` warning.
- Where iNaturalist splits a bird so that the AOS name points to a non-American population, set `inatName` on the seed (e.g. Barn Owl → `Tyto furcata`, Whimbrel → `Numenius hudsonicus`, Yellow Warbler → `Setophaga aestiva`). The build logs `?` for species with few US/Canada sightings; most of those are just widespread or pelagic, but check any new ones.

## Scope rules for species
- Include native species that occur regularly in the US and Canada (ABA codes 1–2), including pelagic seabirds and Hawaiʻi's native birds.
- Leave out vagrants (codes 3–6) and introduced species. The exceptions are the four introduced backyard birds already in the sets: European Starling, House Sparrow, Eurasian Collared-Dove and Mute Swan.
- Subspecies are not separate cards. The Hawaiian Stilt, Pueo and Hawaiian Gallinule are covered by tagging Black-necked Stilt, Short-eared Owl and Common Gallinule with `hawaii`.
