/**
 * Builds src/data/species.json and src/data/sets.json from the curated seeds in scripts/content/.
 *
 *   npm run data            # uses cached responses where available
 *   XC_API_KEY=... npm run data   # use xeno-canto for songs/calls instead of iNaturalist sounds
 *
 * Sources: iNaturalist (photos, fallback sounds), xeno-canto (sounds), Wikipedia (summary),
 * Wikidata + Wikimedia Commons (range maps). All responses are cached in scripts/.cache/.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { RegionSetId, SetId, SpeciesSeed } from './types.ts';
import { regions, setGroups, setMeta } from './sets.config.ts';
import type { BirdSet, Photo, RangeMap, Recording, Species } from '../src/types.ts';

const here = dirname(fileURLToPath(import.meta.url));
const cacheDir = join(here, '.cache');
const outDir = join(here, '..', 'src', 'data');
mkdirSync(cacheDir, { recursive: true });

loadDotEnv(join(here, '..', '.env'));
const XC_KEY = process.env.XC_API_KEY;
/** `npm run data -- --offline` uses cached iNaturalist/xeno-canto data only (skipping species not fetched yet); Wikimedia is still queried. */
const OFFLINE = process.argv.includes('--offline');
const USER_AGENT = 'bird-flashcards/0.1 (personal birding study app)';
const NORTH_AMERICA_PLACE_ID = 97394;
const OPEN_LICENSES = 'cc0,cc-by,cc-by-nc,cc-by-sa,cc-by-nc-sa,cc-by-nd,cc-by-nc-nd';

// ---------- fetching ----------

/** Minimum gap between uncached requests to the same host, in ms. */
const hostGap: Record<string, number> = {
  'api.inaturalist.org': 1100,
  'xeno-canto.org': 1100,
  // Wikimedia answers bursts with "You are making too many requests".
  'en.wikipedia.org': 1000,
  'www.wikidata.org': 1000,
  'commons.wikimedia.org': 1000,
};
const lastHit = new Map<string, Promise<void>>();

async function throttle(host: string) {
  const gap = hostGap[host] ?? 250;
  const prev = lastHit.get(host) ?? Promise.resolve();
  const next = prev.then(() => new Promise<void>((r) => setTimeout(r, gap)));
  lastHit.set(host, next);
  await prev;
}

async function getJson<T = any>(url: string): Promise<T | null> {
  const file = join(cacheDir, createHash('sha1').update(url).digest('hex') + '.json');
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  const host = new URL(url).host;
  // Offline skips the slow per-species APIs; the batched Wikimedia lookups are cheap enough to run.
  if (OFFLINE && !/wiki/.test(host)) return null;
  const attempts = 5;
  for (let attempt = 0; attempt < attempts; attempt++) {
    await throttle(host);
    try {
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
      if (res.status === 404) {
        writeFileSync(file, 'null');
        return null;
      }
      if (res.status === 429 || res.status >= 500) throw new Error(`${res.status} (rate limited or server error)`);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      writeFileSync(file, JSON.stringify(data));
      return data as T;
    } catch (err) {
      if (attempt === attempts - 1) {
        // Not cached, so the next run retries it.
        console.warn(`  ! gave up on ${url.slice(0, 120)}: ${(err as Error).message}`);
        return null;
      }
      await new Promise((r) => setTimeout(r, 5000 * 2 ** attempt));
    }
  }
  return null;
}

// ---------- sources ----------

function licenseLabel(code: string | null | undefined): string {
  if (!code) return 'All rights reserved';
  if (code === 'cc0') return 'CC0';
  return code.toUpperCase().replace(/^CC-/, 'CC ');
}

async function inatTaxon(scientific: string, common: string) {
  const search = await getJson(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(scientific)}&rank=species&is_active=true&per_page=10`,
  );
  let hit =
    search?.results?.find((t: any) => t.name === scientific) ??
    search?.results?.find((t: any) => t.matched_term === scientific);
  if (!hit) {
    // Taxonomy differs between AOS and iNaturalist for some genera; fall back to the common name.
    const byCommon = await getJson(
      `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(common)}&rank=species&is_active=true&iconic_taxa=Aves&per_page=10`,
    );
    hit =
      byCommon?.results?.find((t: any) => t.preferred_common_name?.toLowerCase() === common.toLowerCase()) ??
      search?.results?.[0] ??
      byCommon?.results?.[0];
  }
  if (!hit) return null;
  const detail = await getJson(`https://api.inaturalist.org/v1/taxa/${hit.id}`);
  return detail?.results?.[0] ?? hit;
}

function inatPhotos(taxon: any): Photo[] {
  const photos: Photo[] = [];
  for (const tp of taxon?.taxon_photos ?? []) {
    const p = tp.photo;
    if (!p?.license_code || !p.url) continue;
    photos.push({
      url: p.url.replace('/square.', '/medium.'),
      large: p.url.replace('/square.', '/large.'),
      author: p.attribution_name ?? p.attribution?.replace(/^\(c\)\s*/, '').replace(/,.*$/, '') ?? 'Unknown',
      license: licenseLabel(p.license_code),
      source: `https://www.inaturalist.org/photos/${p.id}`,
    });
    if (photos.length === 4) break;
  }
  return photos;
}

/** Fallback when a taxon's featured photos aren't openly licensed: CC photos from research-grade observations. */
async function inatObservationPhotos(taxonId: number): Promise<Photo[]> {
  const data = await getJson(
    `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}&photos=true&quality_grade=research` +
      `&photo_license=${OPEN_LICENSES}&order_by=votes&per_page=10`,
  );
  const photos: Photo[] = [];
  for (const obs of data?.results ?? []) {
    const p = obs.photos?.find((p: any) => p.license_code && p.url);
    if (!p) continue;
    photos.push({
      url: p.url.replace('/square.', '/medium.'),
      large: p.url.replace('/square.', '/large.'),
      author: obs.user?.name || obs.user?.login || 'iNaturalist user',
      license: licenseLabel(p.license_code),
      source: obs.uri,
    });
    if (photos.length === 4) break;
  }
  return photos;
}

/** `names`: the AOS name first, then any alternate (xeno-canto follows IOC taxonomy, which splits some birds differently). */
async function xenoCanto(names: string[]): Promise<Recording[]> {
  const out: Recording[] = [];
  for (const kind of ['song', 'call'] as const) {
    // Widen the search step by step: top-quality American recordings first, then anywhere
    // (Hawaiʻi and at-sea recordings fall outside "america"), then any quality.
    let rec: any;
    search: for (const filters of ['q:A area:america', 'q:A', '']) {
      for (const name of names) {
        const query = encodeURIComponent(`sp:"${name}" type:${kind} ${filters}`.trim());
        const data = await getJson(`https://xeno-canto.org/api/3/recordings?query=${query}&key=${XC_KEY}&per_page=50`);
        rec = data?.recordings?.[0];
        if (rec) break search;
      }
    }
    if (!rec) continue;
    out.push({
      url: rec.file,
      kind,
      author: rec.rec,
      license: xcLicense(rec.lic),
      source: rec.url.startsWith('//') ? `https:${rec.url}` : rec.url,
      location: [rec.loc, rec.cnt].filter(Boolean).join(', '),
    });
  }
  if (!out.length) {
    // Some rarely recorded birds only have recordings typed "other", "flight call", etc.
    const query = encodeURIComponent(`sp:"${names[0]}"`);
    const data = await getJson(`https://xeno-canto.org/api/3/recordings?query=${query}&key=${XC_KEY}&per_page=50`);
    for (const rec of (data?.recordings ?? []).slice(0, 2)) {
      out.push({
        url: rec.file,
        kind: 'recording',
        author: rec.rec,
        license: xcLicense(rec.lic),
        source: rec.url.startsWith('//') ? `https:${rec.url}` : rec.url,
        location: [rec.loc, rec.cnt].filter(Boolean).join(', '),
      });
    }
  }
  return out;
}

function xcLicense(url: string): string {
  // e.g. //creativecommons.org/licenses/by-nc-sa/4.0/
  const m = url?.match(/licenses\/([a-z-]+)\/([\d.]+)/);
  return m ? `CC ${m[1].toUpperCase()} ${m[2]}` : 'See source';
}

async function inatSounds(taxonId: number): Promise<Recording[]> {
  const query =
    `https://api.inaturalist.org/v1/observations?taxon_id=${taxonId}&sounds=true&quality_grade=research` +
    `&sound_license=${OPEN_LICENSES}&order_by=votes&per_page=20`;
  // Prefer North American recordings; iNaturalist places Hawaiʻi in Oceania, so fall back to anywhere.
  let data = await getJson(`${query}&place_id=${NORTH_AMERICA_PLACE_ID}`);
  if (!data?.results?.length) data = await getJson(query);
  const out: Recording[] = [];
  for (const obs of data?.results ?? []) {
    const s = obs.sounds?.find((s: any) => s.file_url && /audio\/(mpeg|mp4|x-m4a|wav|x-wav)/.test(s.file_content_type ?? ''));
    if (!s) continue;
    out.push({
      url: s.file_url,
      kind: 'recording',
      author: obs.user?.name || obs.user?.login || 'iNaturalist user',
      license: licenseLabel(s.license_code),
      source: obs.uri,
      location: obs.place_guess ?? undefined,
    });
    if (out.length === 2) break;
  }
  return out;
}

// Wikimedia rate-limits per-request traffic hard, so all Wikipedia/Wikidata/Commons lookups
// run after the iNaturalist pass, batched 20–50 titles per request.

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function stripHtml(s: string | undefined): string {
  return (s ?? '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function firstParagraph(text: string): string {
  const para = text.split('\n').find((p) => p.trim().length > 40) ?? text;
  return para.length > 700 ? para.slice(0, para.lastIndexOf('. ', 700) + 1) || para.slice(0, 700) : para;
}

interface WikiPage {
  title: string;
  qid?: string;
  extract: string;
}

/** Resolve many article titles at once (following redirects); returns intro text and Wikidata id. */
async function wikiPages(titles: string[]): Promise<Map<string, WikiPage>> {
  const out = new Map<string, WikiPage>();
  for (const batch of chunk([...new Set(titles)].sort(), 20)) {
    const data = await getJson(
      'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1' +
        '&prop=extracts|pageprops&exintro=1&explaintext=1&exlimit=20&ppprop=wikibase_item|disambiguation' +
        `&titles=${encodeURIComponent(batch.join('|'))}`,
    );
    if (!data?.query) continue;
    const alias = new Map<string, string>();
    for (const r of [...(data.query.normalized ?? []), ...(data.query.redirects ?? [])]) alias.set(r.from, r.to);
    const pages = new Map<string, any>((data.query.pages ?? []).map((p: any) => [p.title, p]));
    for (const t of batch) {
      let name = t;
      for (let hops = 0; alias.has(name) && hops < 3; hops++) name = alias.get(name)!;
      const p = pages.get(name);
      if (!p || p.missing || p.pageprops?.disambiguation !== undefined) continue;
      out.set(t, { title: p.title, qid: p.pageprops?.wikibase_item, extract: firstParagraph(p.extract ?? '') });
    }
  }
  return out;
}

/** Wikidata P181 ("taxon range map image") file names, keyed by item id. */
async function rangeMapFiles(qids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const batch of chunk([...new Set(qids)].sort(), 50)) {
    const data = await getJson(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${batch.join('|')}&props=claims&format=json`,
    );
    for (const [qid, entity] of Object.entries<any>(data?.entities ?? {})) {
      const file = entity?.claims?.P181?.[0]?.mainsnak?.datavalue?.value;
      if (file) out.set(qid, file);
    }
  }
  return out;
}

/** Fallback when Wikidata has no P181: the `range_map` parameter of the article's taxobox, keyed by title. */
async function infoboxRangeMaps(titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  for (const batch of chunk([...new Set(titles)].sort(), 50)) {
    const data = await getJson(
      'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&prop=revisions&rvprop=content&rvslots=main' +
        `&titles=${encodeURIComponent(batch.join('|'))}`,
    );
    for (const page of data?.query?.pages ?? []) {
      const text: string = page.revisions?.[0]?.slots?.main?.content ?? '';
      const m = text.match(/\|\s*range_map\s*=\s*(?:\[\[)?(?:File:|Image:)?([^|\]\n<]+?\.(?:svg|png|jpe?g|gif))/i);
      if (m) out.set(page.title, m[1].trim());
    }
  }
  return out;
}

/** Commons thumbnail URL plus author/license credit for each file name. */
async function commonsImages(files: string[]): Promise<Map<string, RangeMap>> {
  const out = new Map<string, RangeMap>();
  const key = (f: string) => f.replace(/_/g, ' ').replace(/^File:/, '');
  for (const batch of chunk([...new Set(files)].sort(), 50)) {
    const data = await getJson(
      'https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo' +
        `&iiprop=url|extmetadata&iiurlwidth=800&titles=${encodeURIComponent(batch.map((f) => 'File:' + f).join('|'))}`,
    );
    for (const page of data?.query?.pages ?? []) {
      const ii = page.imageinfo?.[0];
      if (!ii) continue;
      const meta = ii.extmetadata ?? {};
      out.set(key(page.title), {
        url: (ii.thumburl ?? ii.url).split('?')[0],
        author: stripHtml(meta.Artist?.value) || 'Wikimedia Commons',
        license: stripHtml(meta.LicenseShortName?.value) || 'See source',
        source: ii.descriptionurl,
      });
    }
  }
  // Map back from the requested names (Commons normalizes underscores and capitalization of the first letter).
  const byRequested = new Map<string, RangeMap>();
  for (const f of files) {
    const k = key(f);
    const hit = out.get(k) ?? out.get(k.charAt(0).toUpperCase() + k.slice(1));
    if (hit) byRequested.set(f, hit);
  }
  return byRequested;
}

/** Candidate article titles per species id, tried in order (iNaturalist's link often redirects). */
const wikiCandidates = new Map<string, string[]>();

async function addWikiData(species: Species[]) {
  const found = new Map<string, WikiPage>();
  for (let round = 0; round < 3; round++) {
    const pending = species.filter((s) => !found.has(s.id) && wikiCandidates.get(s.id)?.[round]);
    if (!pending.length) continue;
    const pages = await wikiPages(pending.map((s) => wikiCandidates.get(s.id)![round]));
    for (const s of pending) {
      const page = pages.get(wikiCandidates.get(s.id)![round]);
      if (page) found.set(s.id, page);
    }
  }
  const wikidataFiles = await rangeMapFiles([...found.values()].flatMap((p) => (p.qid ? [p.qid] : [])));
  const fileFor = (p: WikiPage) => (p.qid ? wikidataFiles.get(p.qid) : undefined);
  const infoboxFiles = await infoboxRangeMaps([...found.values()].filter((p) => !fileFor(p)).map((p) => p.title));
  const images = await commonsImages([...wikidataFiles.values(), ...infoboxFiles.values()]);
  for (const s of species) {
    const page = found.get(s.id);
    if (!page) continue;
    s.summary = page.extract;
    s.wikiUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`;
    const file = fileFor(page) ?? infoboxFiles.get(page.title);
    if (file) s.rangeMap = images.get(file);
  }
}

// ---------- region sets ----------

/** iNaturalist taxon id per species id, filled in by build(). */
const inatIds = new Map<string, number>();
/** iNaturalist all-time observation count per species id, for the taxonomy sanity check. */
const inatObsCounts = new Map<string, number>();

/** A species belongs to a region if it has at least this many research-grade sightings there… */
const REGION_MIN_SIGHTINGS = 5;
/** …and the region holds at least this share of its sightings across all three regions (filters out strays). */
const REGION_MIN_SHARE = 0.05;

async function placeId(name: string, country: 'US' | 'CA'): Promise<number | undefined> {
  const data = await getJson(`https://api.inaturalist.org/v1/places/autocomplete?q=${encodeURIComponent(name)}&per_page=10`);
  const place = data?.results?.find((p: any) => p.admin_level === 10 && p.display_name === `${name}, ${country}`);
  if (!place) console.warn(`  ! no iNaturalist place found for ${name}, ${country}`);
  return place?.id;
}

/** Research-grade sighting counts per bird taxon id across a set of places. */
async function birdCounts(placeIds: number[]): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  for (let page = 1; ; page++) {
    const data = await getJson(
      `https://api.inaturalist.org/v1/observations/species_counts?taxon_id=3&quality_grade=research` +
        `&place_id=${placeIds.join(',')}&per_page=500&page=${page}`,
    );
    for (const r of data?.results ?? []) counts.set(r.taxon.id, r.count);
    if (!data || page * 500 >= data.total_results) break;
  }
  return counts;
}

async function regionMembership(speciesIds: string[], hawaiiOnly: Set<string>): Promise<Map<RegionSetId, Set<string>>> {
  const countsByRegion = new Map<RegionSetId, Map<number, number>>();
  for (const [region, { us, ca }] of Object.entries(regions) as [RegionSetId, { us: string[]; ca: string[] }][]) {
    const ids: number[] = [];
    for (const name of us) ids.push(...[await placeId(name, 'US')].filter((x): x is number => !!x));
    for (const name of ca) ids.push(...[await placeId(name, 'CA')].filter((x): x is number => !!x));
    countsByRegion.set(region, await birdCounts(ids));
  }
  // The East has far more birders than the West, so raw counts make strays look common there.
  // Compare each region's sightings as a fraction of all bird sightings in that region instead.
  const regionTotals = new Map([...countsByRegion].map(([r, counts]) => [r, [...counts.values()].reduce((a, b) => a + b, 0)]));
  const members = new Map<RegionSetId, Set<string>>([...countsByRegion.keys()].map((r) => [r, new Set<string>()]));
  const shares: Record<string, Record<string, number>> = {};
  for (const id of speciesIds) {
    const taxonId = inatIds.get(id);
    if (!taxonId) continue;
    const perRegion = [...countsByRegion].map(([r, counts]) => {
      const n = counts.get(taxonId) ?? 0;
      return { region: r, n, freq: n / regionTotals.get(r)! };
    });
    const totalFreq = perRegion.reduce((sum, x) => sum + x.freq, 0);
    // If most of the taxon's sightings are outside the US and Canada, iNaturalist may have matched a
    // population that AOS lumps with ours (e.g. Barn Owl). Widespread species trip this too, so it only warns.
    const regional = perRegion.reduce((sum, x) => sum + x.n, 0);
    const allTime = inatObsCounts.get(id) ?? 0;
    if (allTime > 500 && regional / allTime < 0.15 && !hawaiiOnly.has(id)) {
      console.warn(`  ? ${id}: only ${Math.round((100 * regional) / allTime)}% of iNaturalist sightings are in the US/Canada; check the taxon`);
    }
    shares[id] = {};
    for (const { region, n, freq } of perRegion) {
      const share = totalFreq ? freq / totalFreq : 0;
      shares[id][region] = Math.round(share * 1000) / 1000;
      if (n >= REGION_MIN_SIGHTINGS && share >= REGION_MIN_SHARE) members.get(region)!.add(id);
    }
  }
  // Saved for tuning the thresholds; not used by the app.
  writeFileSync(join(cacheDir, 'region-shares.json'), JSON.stringify(shares, null, 1));
  return members;
}

// ---------- main ----------

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function loadSeeds(): Promise<SpeciesSeed[]> {
  const dir = join(here, 'content');
  const byName = new Map<string, SpeciesSeed>();
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.ts')).sort()) {
    const mod = await import(pathToFileURL(join(dir, f)).href);
    for (const seed of mod.species as SpeciesSeed[]) {
      const existing = byName.get(seed.scientific);
      if (existing) {
        console.warn(`  ~ ${seed.common} appears in more than one content file; merging set tags`);
        existing.sets = [...new Set([...existing.sets, ...seed.sets])];
      } else {
        byName.set(seed.scientific, { ...seed });
      }
    }
  }
  return [...byName.values()];
}

async function build(seed: SpeciesSeed): Promise<Species> {
  const taxon = await inatTaxon(seed.inatName ?? seed.scientific, seed.common);
  if (taxon && taxon.name !== (seed.inatName ?? seed.scientific)) {
    console.warn(`  ~ ${seed.common}: iNaturalist resolved "${seed.scientific}" to "${taxon.name}"`);
  }
  if (taxon) {
    inatIds.set(slug(seed.common), taxon.id);
    inatObsCounts.set(slug(seed.common), taxon.observations_count ?? 0);
  }
  const audio = XC_KEY ? await xenoCanto([seed.scientific, seed.inatName].filter((n): n is string => !!n)) : taxon ? await inatSounds(taxon.id) : [];
  // Fall back to iNaturalist sounds if xeno-canto had nothing.
  const sounds = audio.length || !taxon ? audio : await inatSounds(taxon.id);
  const id = slug(seed.common);
  const inatTitle: string | undefined = taxon?.wikipedia_url && decodeURIComponent(taxon.wikipedia_url.split('/wiki/')[1] ?? '');
  wikiCandidates.set(id, [inatTitle, seed.common, seed.scientific].filter(Boolean).map((t) => t!.replace(/_/g, ' ')));
  return {
    id,
    common: seed.common,
    scientific: seed.scientific,
    family: seed.family,
    size: seed.size,
    habitat: seed.habitat,
    marks: seed.marks,
    summary: '',
    photos: inatPhotos(taxon).length || !taxon ? inatPhotos(taxon) : await inatObservationPhotos(taxon.id),
    audio: sounds,
  };
}

async function pool<T, R>(items: T[], size: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i], i);
      }
    }),
  );
  return results;
}

function loadDotEnv(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const seeds = await loadSeeds();
console.log(`Building ${seeds.length} species (sounds from ${XC_KEY ? 'xeno-canto' : 'iNaturalist'})…`);

const built = await pool(seeds, 4, async (seed, i) => {
  const s = await build(seed);
  console.log(`[${i + 1}/${seeds.length}] ${s.common}: ${s.photos.length} photos, ${s.audio.length} audio${s.rangeMap ? ', map' : ''}`);
  return s;
});
console.log('Fetching Wikipedia summaries and range maps (batched)…');
await addWikiData(built);
const species = OFFLINE ? built.filter((s) => s.photos.length) : built;
const included = new Set(species.map((s) => s.id));

const grouped = setGroups.flatMap((g) => g.sets);
const ungrouped = (Object.keys(setMeta) as SetId[]).filter((id) => !grouped.includes(id));
if (ungrouped.length) throw new Error(`Sets missing from setGroups: ${ungrouped.join(', ')}`);

console.log('Computing regional sets from iNaturalist sightings…');
// Hawaiʻi has its own set; its endemics never reach the mainland regions anyway.
const hawaiiOnly = new Set(seeds.filter((s) => s.sets.length === 1 && s.sets[0] === 'hawaii').map((s) => slug(s.common)));
const regionMembers = await regionMembership(species.map((s) => s.id), hawaiiOnly);
const inSet = (id: SetId, seed: SpeciesSeed) =>
  regionMembers.has(id as RegionSetId) ? regionMembers.get(id as RegionSetId)!.has(slug(seed.common)) : seed.sets.includes(id);

const sets: BirdSet[] = setGroups.flatMap((group) =>
  group.sets.map((id) => ({
    id,
    ...setMeta[id],
    group: group.title,
    species: seeds
      .filter((s) => inSet(id, s))
      .sort((a, b) => a.common.localeCompare(b.common))
      .map((s) => slug(s.common))
      .filter((id) => included.has(id)),
  })),
);

writeFileSync(join(outDir, 'species.json'), JSON.stringify(species, null, 1));
writeFileSync(join(outDir, 'sets.json'), JSON.stringify(sets, null, 1));

const missing = (label: string, pred: (s: Species) => boolean) => {
  const list = species.filter(pred).map((s) => s.common);
  console.log(`${label}: ${list.length}${list.length ? ' (' + list.join(', ') + ')' : ''}`);
};
console.log('\nDone. Sets:', sets.map((s) => `${s.id}=${s.species.length}`).join(', '));
missing('Missing photos', (s) => s.photos.length === 0);
missing('Missing audio', (s) => s.audio.length === 0);
missing('Missing range map', (s) => !s.rangeMap);
missing('Missing summary', (s) => !s.summary);
