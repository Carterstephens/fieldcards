import speciesJson from '../data/species.json';
import setsJson from '../data/sets.json';
import type { BirdSet, Species } from '../types.ts';

export const species = speciesJson as Species[];
export const sets = setsJson as BirdSet[];
export const speciesById = new Map(species.map((s) => [s.id, s]));
export const setById = new Map(sets.map((s) => [s.id, s]));
