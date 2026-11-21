/**
 * Content for the three games. Everything here comes from her class notes (SCIENCE_STUDIED.md):
 * the cell parts from the organelles lessons, the predictions from the energy and cells lessons,
 * and the microscope lenses from "How do we see cells?" (eyepiece 10×, objectives 4×, 10×, 40×).
 */

// ---------- Build a cell ----------

export type Where = 'both' | 'plant';

export interface CellPart {
  key: string;
  name: string;
  where: Where;
  /** Shown when she places it right. */
  fact: string;
}

export const CELL_PARTS: CellPart[] = [
  { key: 'membrane', name: 'Cell membrane', where: 'both', fact: 'Selectively permeable: it lets some things through, but not others. Protein channels control what goes in and out.' },
  { key: 'cytoplasm', name: 'Cytoplasm', where: 'both', fact: 'Jelly-like fluid. Reactions happen here.' },
  { key: 'nucleus', name: 'Nucleus', where: 'both', fact: 'Holds DNA and controls the cell. It stains blue.' },
  { key: 'nucleolus', name: 'Nucleolus', where: 'both', fact: 'Sits inside the nucleus. It makes ribosomes.' },
  { key: 'ribosomes', name: 'Ribosomes', where: 'both', fact: 'They make proteins.' },
  { key: 'mitochondria', name: 'Mitochondria', where: 'both', fact: 'Respiration happens here. It releases energy.' },
  { key: 'wall', name: 'Cell wall', where: 'plant', fact: 'Made of cellulose. It gives the plant cell a rigid (stiff) shape.' },
  { key: 'chloroplasts', name: 'Chloroplasts', where: 'plant', fact: 'Green chlorophyll inside. Photosynthesis happens here.' },
  { key: 'vacuole', name: 'Large permanent vacuole', where: 'plant', fact: 'Full of cell sap. It keeps the cell firm.' },
];

export type CellChoice = 'animal' | 'both' | 'plant';

/** Why a wrong placement is wrong, in one line. */
export function cellReason(part: CellPart, choice: CellChoice): string {
  if (part.where === 'plant') {
    return `Only plant cells have ${part.name === 'Cell wall' ? 'a cell wall' : part.name.toLowerCase()}. Animal cells do not.`;
  }
  if (choice === 'animal') return `Plant cells have ${part.name.toLowerCase()} too. It belongs in both.`;
  return `Animal cells have ${part.name.toLowerCase()} too. It belongs in both.`;
}

// ---------- Predict it! ----------

export interface Prediction {
  id: string;
  /** The picture scene the game animates. */
  scene: 'ice' | 'slide' | 'objective' | 'vacuole' | 'beta' | 'kettle' | 'toaster' | 'cork';
  situation: string;
  question: string;
  options: string[];
  answer: string;
  /** What the animation showed, in one line. */
  observed: string;
  whyOptions: string[];
  why: string;
}

export const PREDICTIONS: Prediction[] = [
  {
    id: 'ice', scene: 'ice',
    situation: 'Two ice cubes of the same size sit in a room. One is on a metal plate. One is on a wooden plate.',
    question: 'Which ice cube melts first?',
    options: ['The one on metal', 'The one on wood', 'Both at the same time'],
    answer: 'The one on metal',
    observed: 'The ice on the metal plate melted much faster.',
    whyOptions: [
      'Metal conducts (carries) heat from the room into the ice faster than wood',
      'Metal is colder than wood',
      'Wood makes its own heat',
    ],
    why: 'Metal conducts (carries) heat from the room into the ice faster than wood',
  },
  {
    id: 'slide', scene: 'slide',
    situation: 'You are looking at a cell through a compound microscope (a microscope with two lenses).',
    question: 'You move the slide to the RIGHT. Which way does the image move?',
    options: ['To the left', 'To the right', 'It does not move'],
    answer: 'To the left',
    observed: 'The image slid to the left.',
    whyOptions: [
      'The lenses flip the image, so everything looks the wrong way round',
      'The stage is heavier on one side',
      'The light pushes the image away',
    ],
    why: 'The lenses flip the image, so everything looks the wrong way round',
  },
  {
    id: 'objective', scene: 'objective',
    situation: 'The eyepiece is 10×. You turn the nosepiece from the 10× objective lens to the 40× objective lens.',
    question: 'How does the cell look now?',
    options: ['4 times bigger', '30 times bigger', 'The same size'],
    answer: '4 times bigger',
    observed: 'The cell looked 4 times bigger.',
    whyOptions: [
      'Total magnification = eyepiece × objective. 10 × 40 = 400×, instead of 10 × 10 = 100×',
      'The 40× lens adds 30 to the magnification',
      'Only the eyepiece changes the size',
    ],
    why: 'Total magnification = eyepiece × objective. 10 × 40 = 400×, instead of 10 × 10 = 100×',
  },
  {
    id: 'vacuole', scene: 'vacuole',
    situation: 'A plant has not been watered for days. Its cells lose water. So each large permanent vacuole shrinks.',
    question: 'What happens to the leaf?',
    options: ['It droops and goes floppy', 'It stands up stiffer', 'Nothing changes'],
    answer: 'It droops and goes floppy',
    observed: 'As the vacuoles shrank, the leaf drooped.',
    whyOptions: [
      'A full vacuole pushes outwards and keeps the cell firm. An empty one does not',
      'The cell wall dissolves (melts away) without water',
      'Chloroplasts hold the leaf up',
    ],
    why: 'A full vacuole pushes outwards and keeps the cell firm. An empty one does not',
  },
  {
    id: 'beta', scene: 'beta',
    situation: 'In Type 1 diabetes, the beta-cells in the pancreas are destroyed.',
    question: 'What happens to the insulin in that person?',
    options: ['The body stops making insulin', 'The body makes more insulin', 'The liver makes the insulin instead'],
    answer: 'The body stops making insulin',
    observed: 'With no beta-cells, no insulin was released.',
    whyOptions: [
      'Beta-cells are the cells that make insulin. Without them, none is made',
      'Insulin is made in the stomach',
      'Insulin comes from food',
    ],
    why: 'Beta-cells are the cells that make insulin. Without them, none is made',
  },
  {
    id: 'kettle', scene: 'kettle',
    situation: 'A kettle takes in 500 J (joules) of electrical energy. 400 J turns into useful heat in the water.',
    question: 'How much energy is wasted?',
    options: ['100 J', '900 J', '0 J'],
    answer: '100 J',
    observed: 'The Sankey arrow (energy arrow) split: 400 J useful, 100 J wasted.',
    whyOptions: [
      'Energy is conserved (none disappears): 500 J in = 400 J useful + 100 J wasted',
      'Kettles never waste energy',
      'The wasted energy is added to the input',
    ],
    why: 'Energy is conserved (none disappears): 500 J in = 400 J useful + 100 J wasted',
  },
  {
    id: 'toaster', scene: 'toaster',
    situation: 'You hold your hands above a hot toaster. You do not touch it.',
    question: 'What do you predict?',
    options: ['Your hands feel warm air rising', 'Your hands feel nothing', 'Your hands get cold'],
    answer: 'Your hands feel warm air rising',
    observed: 'Warm air rose from the toaster to your hands.',
    whyOptions: [
      'Convection: the heated air expands (spreads out), becomes less dense (lighter) and rises',
      'Conduction: the metal touches your hands',
      'Cold air falls onto your hands',
    ],
    why: 'Convection: the heated air expands (spreads out), becomes less dense (lighter) and rises',
  },
  {
    id: 'cork', scene: 'cork',
    situation: 'In 1665, Robert Hooke puts a thin slice of cork under his microscope at about 50×.',
    question: 'What does he see?',
    options: ['Rows of empty little boxes', 'Tiny swimming animals', 'One big green blob'],
    answer: 'Rows of empty little boxes',
    observed: 'Rows of empty boxes appeared, like a honeycomb.',
    whyOptions: [
      'Cork is dead plant tissue (material), so only the empty cell walls are left',
      'Cork cells are full of swimming animalcules',
      'Cork has no cells at all',
    ],
    why: 'Cork is dead plant tissue (material), so only the empty cell walls are left',
  },
];

// ---------- Magnification dials ----------

export const EYEPIECES = [5, 10, 15];
export const OBJECTIVES = [4, 10, 40];

/** Every magnification the dials can make, so a target is always reachable. */
export const TARGETS = [...new Set(EYEPIECES.flatMap((e) => OBJECTIVES.map((o) => e * o)))].sort((a, b) => a - b);
