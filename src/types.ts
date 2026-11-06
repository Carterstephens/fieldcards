/** Shapes of the generated JSON in src/data/ (written by scripts/build-data.ts). */

export interface Credit {
  /** Author / photographer / recordist */
  author: string;
  /** Short license name, e.g. "CC BY-NC 4.0" */
  license: string;
  /** Page the media came from */
  source: string;
}

export interface Photo extends Credit {
  /** ~500px image for the card face */
  url: string;
  /** ~1000px image for the expanded view */
  large: string;
}

export interface Recording extends Credit {
  url: string;
  kind: 'song' | 'call' | 'recording';
  location?: string;
}

export interface RangeMap extends Credit {
  url: string;
}

export interface Species {
  id: string;
  common: string;
  scientific: string;
  family: string;
  size: string;
  habitat: string;
  marks: string[];
  summary: string;
  wikiUrl?: string;
  photos: Photo[];
  audio: Recording[];
  rangeMap?: RangeMap;
}

export interface BirdSet {
  id: string;
  title: string;
  description: string;
  icon: string;
  /** Home-page section title */
  group: string;
  species: string[];
}
