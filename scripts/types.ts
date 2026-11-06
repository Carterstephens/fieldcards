/** Sets whose membership is computed from iNaturalist sightings rather than tagged in content. */
export type RegionSetId = 'region-east' | 'region-central' | 'region-west';

export type SetId =
  | RegionSetId
  | 'backyard-east'
  | 'backyard-west'
  | 'warblers'
  | 'sparrows'
  | 'raptors'
  | 'owls'
  | 'woodpeckers'
  | 'waterfowl'
  | 'shorebirds'
  | 'gulls-terns'
  | 'waterbirds'
  | 'pelagic'
  | 'herons-cranes'
  | 'gamebirds'
  | 'doves-cuckoos'
  | 'hummingbirds-swifts'
  | 'flycatchers'
  | 'vireos-corvids'
  | 'chickadees-wrens'
  | 'swallows-open-country'
  | 'thrushes-mimids'
  | 'finches'
  | 'tanagers-grosbeaks'
  | 'blackbirds-orioles'
  | 'hawaii';

/** Hand-curated species content. Media is fetched by scripts/build-data.ts. */
export interface SpeciesSeed {
  common: string;
  scientific: string;
  /**
   * iNaturalist's name for this bird, when its taxonomy splits differently from the AOS checklist
   * (e.g. Barn Owl: AOS Tyto alba = iNaturalist Tyto furcata). Used only for iNaturalist lookups.
   */
  inatName?: string;
  family: string;
  /** Length, e.g. "22 cm (8.7 in)" */
  size: string;
  habitat: string;
  /** 3–5 concise identification field marks */
  marks: string[];
  sets: SetId[];
}
