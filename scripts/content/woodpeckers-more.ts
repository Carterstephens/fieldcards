import type { SpeciesSeed } from '../types';

export const species: SpeciesSeed[] = [
  {
    common: 'Arizona Woodpecker',
    scientific: 'Dryobates arizonae',
    family: 'Picidae (Woodpeckers)',
    size: '19 cm (7.5 in)',
    habitat: 'Oak and pine-oak woodland in the mountains of southeastern Arizona and southwestern New Mexico.',
    marks: [
      'Only North American woodpecker with a solid brown back',
      'White face with a brown ear patch and a brown mustache stripe',
      'White underparts heavily spotted and barred with brown',
      'Male has a small red patch on the nape',
    ],
    sets: ['woodpeckers'],
  },
  {
    common: 'Gilded Flicker',
    scientific: 'Colaptes chrysoides',
    family: 'Picidae (Woodpeckers)',
    size: '29 cm (11 in)',
    habitat: 'Sonoran Desert with tall saguaro cacti in southern Arizona and southeastern California.',
    marks: [
      'Desert flicker with yellow underwings and undertail, like eastern "Yellow-shafted" Northern Flicker',
      'Cinnamon-brown crown and gray face, like western "Red-shafted" Northern Flicker',
      'Male has a red mustache stripe',
      'Less barring on the back and more extensive black on the tail than Northern Flicker; nests in saguaros',
    ],
    sets: ['woodpeckers'],
  },
];
