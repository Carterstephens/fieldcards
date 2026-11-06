import type { RegionSetId, SetId } from './types.ts';

/**
 * Display metadata for each pre-built set. Membership comes from the `sets` tags in scripts/content/*.ts,
 * except the region sets, which are computed from iNaturalist sightings (see `regions` below).
 */
export const setMeta: Record<SetId, { title: string; description: string; icon: string }> = {
  'region-east': {
    title: 'All Eastern Birds',
    description: 'Every regular native species east of the Mississippi and in eastern Canada.',
    icon: '🍁',
  },
  'region-central': {
    title: 'All Central Birds',
    description: 'Every regular native species of the Great Plains, Texas, Manitoba, and Saskatchewan.',
    icon: '🌾',
  },
  'region-west': {
    title: 'All Western Birds',
    description: 'Every regular native species from the Rockies to the Pacific, plus Alaska and western Canada.',
    icon: '🏔️',
  },
  'backyard-east': {
    title: 'Backyard Birds: East',
    description: 'Feeder and yard regulars east of the Rockies.',
    icon: '🏡',
  },
  'backyard-west': {
    title: 'Backyard Birds: West',
    description: 'Feeder and yard regulars of the western states and provinces.',
    icon: '🌵',
  },
  warblers: {
    title: 'Wood-Warblers',
    description: 'The colorful, flighty stars of spring migration.',
    icon: '🌿',
  },
  sparrows: {
    title: 'Sparrows & Towhees',
    description: 'Little brown jobs, sorted out.',
    icon: '🌾',
  },
  raptors: {
    title: 'Hawks, Eagles & Falcons',
    description: 'Diurnal raptors and vultures.',
    icon: '🦅',
  },
  owls: {
    title: 'Owls',
    description: 'Night hunters, many best learned by ear.',
    icon: '🦉',
  },
  woodpeckers: {
    title: 'Woodpeckers',
    description: 'Drummers, sapsuckers, and flickers.',
    icon: '🌲',
  },
  waterfowl: {
    title: 'Ducks, Geese & Swans',
    description: 'Dabblers, divers, sea ducks, and more.',
    icon: '🦆',
  },
  shorebirds: {
    title: 'Shorebirds',
    description: 'Plovers, sandpipers, and their kin.',
    icon: '🌊',
  },
  'gulls-terns': {
    title: 'Gulls & Terns',
    description: 'Coastal and lakeshore regulars.',
    icon: '🐚',
  },
  waterbirds: {
    title: 'Loons, Grebes, Cormorants & Pelicans',
    description: 'Diving and fishing waterbirds of lakes and coasts.',
    icon: '🛶',
  },
  pelagic: {
    title: 'Pelagic Seabirds',
    description: 'Albatrosses, shearwaters, storm-petrels, alcids, jaegers, and more, the birds of offshore boat trips.',
    icon: '🚢',
  },
  'herons-cranes': {
    title: 'Herons, Ibises, Cranes & Rails',
    description: 'Waders of marshes, mudflats, and wet meadows.',
    icon: '🪶',
  },
  gamebirds: {
    title: 'Grouse, Quail & Turkey',
    description: 'Native gamebirds, from ptarmigan to bobwhite.',
    icon: '🍂',
  },
  'doves-cuckoos': {
    title: 'Doves, Cuckoos & Kingfishers',
    description: 'Pigeons, doves, cuckoos, roadrunner, anis, kingfishers, and trogon.',
    icon: '🕊️',
  },
  'hummingbirds-swifts': {
    title: 'Hummingbirds, Swifts & Nightjars',
    description: 'Aerial specialists, by day and by night.',
    icon: '🌺',
  },
  flycatchers: {
    title: 'Tyrant Flycatchers',
    description: 'Pewees, Empidonax, kingbirds, phoebes, and more. Listen closely.',
    icon: '🪰',
  },
  'vireos-corvids': {
    title: 'Vireos, Shrikes, Jays & Crows',
    description: 'Vireos, shrikes, and the clever corvid family.',
    icon: '🐦‍⬛',
  },
  'chickadees-wrens': {
    title: 'Chickadees, Nuthatches, Wrens & Kinglets',
    description: 'Small, busy birds of woods and thickets.',
    icon: '🍃',
  },
  'swallows-open-country': {
    title: 'Swallows, Larks, Pipits & Longspurs',
    description: 'Birds of open sky and open country.',
    icon: '☁️',
  },
  'thrushes-mimids': {
    title: 'Thrushes, Thrashers & Waxwings',
    description: 'Thrushes, bluebirds, mockingbirds, thrashers, and waxwings.',
    icon: '🎶',
  },
  finches: {
    title: 'Finches',
    description: 'Goldfinches, crossbills, redpolls, rosy-finches, and grosbeaks.',
    icon: '🌻',
  },
  'tanagers-grosbeaks': {
    title: 'Tanagers, Grosbeaks & Buntings',
    description: "The cardinal family's brightly colored members.",
    icon: '❤️',
  },
  'blackbirds-orioles': {
    title: 'Blackbirds & Orioles',
    description: 'Orioles, meadowlarks, grackles, cowbirds, and kin.',
    icon: '🎵',
  },
  hawaii: {
    title: 'Native Birds of Hawaiʻi',
    description: 'Honeycreepers, ʻElepaio, Nēnē, and the seabirds that nest on the islands.',
    icon: '🌋',
  },
};

/** Home-page sections, in display order. Every SetId must appear exactly once. */
export const setGroups: { title: string; sets: SetId[] }[] = [
  {
    title: 'By region',
    sets: ['region-east', 'region-central', 'region-west', 'backyard-east', 'backyard-west', 'hawaii'],
  },
  {
    title: 'Waterbirds & seabirds',
    sets: ['waterfowl', 'waterbirds', 'pelagic', 'herons-cranes', 'shorebirds', 'gulls-terns'],
  },
  {
    title: 'Land birds',
    sets: ['gamebirds', 'raptors', 'owls', 'doves-cuckoos', 'hummingbirds-swifts', 'woodpeckers'],
  },
  {
    title: 'Songbirds',
    sets: [
      'flycatchers',
      'vireos-corvids',
      'chickadees-wrens',
      'swallows-open-country',
      'thrushes-mimids',
      'warblers',
      'sparrows',
      'finches',
      'tanagers-grosbeaks',
      'blackbirds-orioles',
    ],
  },
];

/**
 * States and provinces in each region set. A species joins a region when it is seen there
 * regularly, not just as a stray (see regionMembership in build-data.ts).
 */
export const regions: Record<RegionSetId, { us: string[]; ca: string[] }> = {
  'region-east': {
    us: [
      'Alabama', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Illinois',
      'Indiana', 'Kentucky', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Mississippi',
      'New Hampshire', 'New Jersey', 'New York', 'North Carolina', 'Ohio', 'Pennsylvania',
      'Rhode Island', 'South Carolina', 'Tennessee', 'Vermont', 'Virginia', 'West Virginia', 'Wisconsin',
    ],
    ca: ['Ontario', 'Québec', 'New Brunswick', 'Nova Scotia', 'Prince Edward Island', 'Newfoundland and Labrador'],
  },
  'region-central': {
    us: [
      'Arkansas', 'Iowa', 'Kansas', 'Louisiana', 'Minnesota', 'Missouri', 'Nebraska', 'North Dakota',
      'Oklahoma', 'South Dakota', 'Texas',
    ],
    ca: ['Manitoba', 'Saskatchewan'],
  },
  'region-west': {
    us: [
      'Alaska', 'Arizona', 'California', 'Colorado', 'Idaho', 'Montana', 'Nevada', 'New Mexico', 'Oregon',
      'Utah', 'Washington', 'Wyoming',
    ],
    ca: ['Alberta', 'British Columbia', 'Yukon', 'Northwest Territories', 'Nunavut'],
  },
};
