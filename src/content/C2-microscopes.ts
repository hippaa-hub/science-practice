import type { Topic } from './types';
import { pick } from './util';

const TIMES = ['x', 'X', '×', 'times'];
const OBJECTIVES = [4, 10, 40];

export const topic: Topic = {
  id: 'C2',
  unit: 'Cells',
  title: 'Microscopes',
  learn: [
    { title: 'Before microscopes', photo: 'c2-water-drop-lens', text: 'Long ago, people made things look bigger with curved glass and drops of water.' },
    { title: 'The first compound microscope', photo: 'c2-janssen', picture: 'timeline', text: 'In 1590, Zacharias and Hans Janssen made the first compound microscope (a microscope with two lenses). It magnified about 10× (made things look 10 times bigger).' },
    { title: 'Hooke names the cell', photo: 'c2-hooke-cork', picture: 'cork', text: 'In 1665, Robert Hooke looked at cork at about 50×. He saw lots of little boxes.' },
    { title: 'Why "cells"?', photo: 'c2-monk-rooms', text: 'Hooke called the boxes "cells". The name comes from cellae: the small rooms monks lived in.' },
    { title: 'Leeuwenhoek sees life', photo: 'c2-leeuwenhoek', picture: 'animalcules', text: 'Around 1670, Antonie van Leeuwenhoek made lenses up to about 200×. He was the first person to see living bacteria, yeast and blood cells. He called them "animalcules" (tiny animals).' },
    { title: 'Parts of the microscope', photo: 'c2-student-microscope', picture: 'microscope', labels: ['eyepiece', 'nosepiece', 'objectives', 'stage', 'clips', 'diaphragm', 'light', 'coarse', 'fine'], text: 'You look through the eyepiece (usually 10×). The revolving nosepiece turns round. It holds the 4×, 10× and 40× objective lenses. To focus, turn the coarse (big) knob first. Then turn the fine (small) knob.' },
    { title: 'Total magnification', picture: 'magnify', text: 'Magnification means how many times bigger something looks. To find the total, multiply the eyepiece by the objective lens.', example: '10× eyepiece and 40× objective: 10 × 40 = 400×.' },
    { title: 'Plant and animal cells under the microscope', photo: 'c2-plant-animal-view', picture: 'plant-vs-animal', text: 'Plant cells look like boxes. They have a thick cell wall and green chloroplasts. Animal cells are rounded or irregular (not a neat shape). They have only a thin membrane on the outside. Animal cells are stained blue or pink so you can see the nucleus.' },
  ],
  items: [
    {
      id: 'C2-janssen', topic: 'C2', type: 'choice', photo: 'c2-janssen',
      prompt: 'Who made the first compound microscope, in 1590?',
      options: ['Zacharias and Hans Janssen', 'Robert Hooke', 'Antonie van Leeuwenhoek'],
      answer: 'Zacharias and Hans Janssen',
      explain: 'Zacharias and Hans Janssen made it in 1590. It magnified about 10× (made things look 10 times bigger).',
    },
    {
      id: 'C2-hooke-cork', topic: 'C2', type: 'choice', photo: 'c2-hooke-cork',
      prompt: 'What did Robert Hooke look at in 1665, when he named cells?',
      options: ['Cork', 'Blood', 'Yeast', 'Pond water'],
      answer: 'Cork',
      explain: 'Hooke looked at cork at about 50×. He saw little boxes and called them cells.',
    },
    {
      id: 'C2-leeuwenhoek', topic: 'C2', type: 'choice', photo: 'c2-leeuwenhoek',
      prompt: 'Who was the first person to see living bacteria, yeast and blood cells?',
      options: ['Antonie van Leeuwenhoek', 'Robert Hooke', 'Zacharias Janssen'],
      answer: 'Antonie van Leeuwenhoek',
      explain: 'Leeuwenhoek made lenses up to about 200×, around 1670. They were strong enough to see tiny living things.',
    },
    {
      id: 'C2-timeline', topic: 'C2', type: 'choice',
      prompt: 'Which list is in the right order, oldest first?',
      options: ['Janssen → Hooke → Leeuwenhoek', 'Hooke → Janssen → Leeuwenhoek', 'Leeuwenhoek → Hooke → Janssen', 'Janssen → Leeuwenhoek → Hooke'],
      answer: 'Janssen → Hooke → Leeuwenhoek',
      explain: 'Janssen 1590, Hooke 1665, Leeuwenhoek about 1670.',
    },
    {
      id: 'C2-who-did-what', topic: 'C2', type: 'match',
      prompt: 'Match each scientist to what they did.',
      pairs: [
        ['Janssen (1590)', 'Made the first compound microscope'],
        ['Hooke (1665)', 'Named cells after looking at cork'],
        ['Leeuwenhoek (about 1670)', 'First to see living bacteria'],
      ],
      explain: 'Janssen built the microscope. Hooke named cells. Leeuwenhoek saw living cells.',
    },
    {
      id: 'C2-animalcules', topic: 'C2', type: 'word', photo: 'c2-leeuwenhoek',
      prompt: 'Type the name Leeuwenhoek gave the tiny living things he saw. It means "tiny animals".',
      answer: 'animalcules', accept: ['animalcule'],
      explain: 'He called them animalcules, which means tiny animals.',
    },
    {
      id: 'C2-cellae', topic: 'C2', type: 'word', photo: 'c2-monk-rooms',
      prompt: 'Hooke named cells after the Latin word for the small rooms monks lived in. Type that Latin word.',
      answer: 'cellae',
      explain: 'Cellae were the small rooms monks lived in. The boxes in the cork reminded Hooke of those rooms.',
    },
    {
      id: 'C2-hooke-mag', topic: 'C2', type: 'choice', photo: 'c2-hooke-cork',
      prompt: 'About how much did Hooke\'s microscope magnify (make things look bigger)?',
      options: ['About 10×', 'About 50×', 'About 200×', 'About 400×'],
      answer: 'About 50×',
      explain: 'Janssen about 10×, Hooke about 50×, Leeuwenhoek about 200×.',
    },
    {
      id: 'C2-parts', topic: 'C2', type: 'match', photo: 'c2-student-microscope',
      prompt: 'Match each part of the microscope to what it does.',
      pairs: [
        ['Eyepiece (ocular lens)', 'The lens you look through, usually 10×'],
        ['Objective lenses', 'The 4×, 10× and 40× lenses, close to the slide'],
        ['Revolving nosepiece', 'Turns to change the objective lens'],
        ['Stage clips', 'Hold the slide still on the stage'],
      ],
      explain: 'You look through the eyepiece. Turn the nosepiece to pick the 4×, 10× or 40× objective. The clips hold the slide on the stage.',
    },
    {
      id: 'C2-parts-2', topic: 'C2', type: 'match', photo: 'c2-student-microscope',
      prompt: 'Match each part of the microscope to what it does.',
      pairs: [
        ['Stage', 'The flat platform the slide sits on'],
        ['Coarse focus knob', 'Big focus change'],
        ['Fine focus knob', 'Small, careful focus change'],
        ['Light source', 'Shines light up through the slide'],
      ],
      explain: 'The slide sits on the stage. Use coarse focus first, then fine focus. Light shines up through the slide.',
    },
    {
      id: 'C2-word-eyepiece', topic: 'C2', type: 'word', photo: 'c2-student-microscope',
      prompt: 'Type the name: the lens at the top that you look through.',
      answer: 'eyepiece', accept: ['ocular', 'ocular lens', 'eyepiece lens', 'eye piece'],
      explain: 'The eyepiece, also called the ocular lens. It is usually 10×.',
    },
    {
      id: 'C2-word-objective', topic: 'C2', type: 'word', photo: 'c2-student-microscope',
      prompt: 'Total magnification = eyepiece × ______ lens. Type the missing word.',
      answer: 'objective', accept: ['objective lens'],
      explain: 'Total magnification = eyepiece × objective.',
    },
    {
      id: 'C2-word-nosepiece', topic: 'C2', type: 'word', photo: 'c2-student-microscope',
      prompt: 'Type the name: the part you turn to change from the 4× lens to the 10× or 40× lens.',
      answer: 'nosepiece', accept: ['revolving nosepiece'],
      explain: 'The revolving nosepiece holds the objective lenses.',
    },
    {
      id: 'C2-word-diaphragm', topic: 'C2', type: 'word', photo: 'c2-student-microscope',
      prompt: 'Type the name: the part next to the light, under the stage (it starts with "d").',
      answer: 'diaphragm',
      explain: 'Diaphragm. Tricky spelling, with a silent g: d-i-a-p-h-r-a-g-m.',
    },
    {
      id: 'C2-total-mag', topic: 'C2', type: 'number', photo: 'c2-student-microscope',
      prompt: 'The eyepiece is 10× and the objective is 40×. What is the total magnification?',
      answer: 400, unit: '×', unitAccept: TIMES, tolerance: 0,
      steps: ['Total magnification = eyepiece × objective', '10 × 40 = 400', 'Answer: 400×'],
      make: (rand) => {
        const obj = pick(rand, OBJECTIVES);
        return {
          prompt: `The eyepiece is 10× and the objective is ${obj}×. What is the total magnification?`,
          answer: 10 * obj,
          steps: ['Total magnification = eyepiece × objective', `10 × ${obj} = ${10 * obj}`, `Answer: ${10 * obj}×`],
        };
      },
      explain: 'Multiply the eyepiece by the objective. Write × after your number.',
    },
    {
      id: 'C2-which-objective', topic: 'C2', type: 'number', photo: 'c2-student-microscope',
      prompt: 'The total magnification is 400×. The eyepiece is 10×. Which objective lens is being used?',
      answer: 40, unit: '×', unitAccept: TIMES, tolerance: 0,
      steps: ['Total = eyepiece × objective', 'So objective = total ÷ eyepiece', '400 ÷ 10 = 40', 'Answer: 40×'],
      make: (rand) => {
        // Not 10×: the answer would then be the same number as the eyepiece.
        const obj = pick(rand, [4, 40]);
        const total = obj * 10;
        return {
          prompt: `The total magnification is ${total}×. The eyepiece is 10×. Which objective lens is being used?`,
          answer: obj,
          steps: ['Total = eyepiece × objective', 'So objective = total ÷ eyepiece', `${total} ÷ 10 = ${obj}`, `Answer: ${obj}×`],
        };
      },
      explain: 'Divide the total by the eyepiece. That gives you the objective.',
    },
    {
      id: 'C2-compare-mag', topic: 'C2', type: 'number', photo: 'c2-leeuwenhoek',
      prompt: 'Janssen\'s microscope magnified about 10×. Leeuwenhoek\'s lenses magnified about 200×. How many times stronger were Leeuwenhoek\'s lenses?',
      answer: 20, unit: '×', unitAccept: TIMES, tolerance: 0,
      steps: ['Divide the bigger number by the smaller one', '200 ÷ 10 = 20', 'Answer: 20 times stronger (20×)'],
      explain: '200 ÷ 10 = 20. So about 20 times stronger.',
    },
    {
      id: 'C2-years', topic: 'C2', type: 'number',
      prompt: 'Janssen made his microscope in 1590. Hooke named cells in 1665. How many years later was Hooke?',
      answer: 75, unit: 'years', unitAccept: ['years', 'year', 'yrs', 'y'], tolerance: 0,
      steps: ['Take the earlier year away from the later one', '1665 − 1590 = 75', 'Answer: 75 years'],
      explain: '1665 − 1590 = 75 years.',
    },
    {
      id: 'C2-biggest-view', topic: 'C2', type: 'choice', photo: 'c2-student-microscope',
      prompt: 'The eyepiece is 10×. Which objective lens makes the cells look biggest?',
      options: ['4×', '10×', '40×'],
      answer: '40×',
      explain: '10 × 40 = 400×. That is the biggest of the three. 10 × 4 = 40× is the smallest.',
    },
    {
      id: 'C2-plant-animal-sort', topic: 'C2', type: 'sort', photo: 'c2-plant-animal-view',
      zones: { 'Plant cell': 'c3-plant-cell', 'Animal cell': 'c3-animal-cell' },
      prompt: 'Under the microscope: is this a plant cell or an animal cell?',
      bins: ['Plant cell', 'Animal cell'],
      cards: [
        { text: 'Box-shaped', bin: 'Plant cell' },
        { text: 'Thick cell wall', bin: 'Plant cell' },
        { text: 'Green chloroplasts', bin: 'Plant cell' },
        { text: 'Rounded or irregular shape', bin: 'Animal cell' },
        { text: 'Only a thin membrane on the outside', bin: 'Animal cell' },
      ],
      explain: 'Plant cells: box shape, thick wall, green chloroplasts. Animal cells: rounded or irregular shape, only a membrane.',
    },
    {
      id: 'C2-stain', topic: 'C2', type: 'choice', photo: 'c2-plant-animal-view',
      prompt: 'Animal cells on slides are often stained (coloured) blue or pink. Why?',
      options: ['To show the nucleus', 'To keep the cells alive', 'To make the cells bigger', 'To kill bacteria'],
      answer: 'To show the nucleus',
      explain: 'The stain makes the nucleus easy to see.',
    },
    {
      id: 'C2-slide-right', topic: 'C2', type: 'choice', from: '2026-11-18',
      prompt: 'You move the slide to the right. Which way does the image move?',
      options: ['Left', 'Right', 'Up', 'It does not move'],
      answer: 'Left',
      explain: 'The lenses flip the image. So it moves the opposite way: to the left.',
    },
    {
      id: 'C2-compare-cells', topic: 'C2', type: 'short', photo: 'c2-plant-animal-view',
      prompt: 'Compare a plant cell and an animal cell under a microscope. Give 3 differences.',
      mustInclude: [
        { idea: 'Plant cells have a cell wall; animal cells only a membrane', any: ['wall'] },
        { idea: 'Plant cells have green chloroplasts', any: ['chloroplast', 'green'] },
        { idea: 'Shape: plant cells box-shaped, animal cells rounded or irregular', any: ['box', 'rectang', 'square', 'round', 'irregular', 'shape'] },
      ],
      model: 'Plant cells are box-shaped, but animal cells are rounded or irregular. Plant cells have a thick cell wall, while animal cells have only a membrane. Plant cells have green chloroplasts; animal cells do not.',
      explain: 'Use "but" or "while" to compare in one sentence. Say both sides each time.',
    },
    {
      id: 'C2-why-leeuwenhoek', topic: 'C2', type: 'short', photo: 'c2-leeuwenhoek', explainWhy: true,
      prompt: 'Explain why Leeuwenhoek could see bacteria, but Janssen\'s first microscope could not show them.',
      mustInclude: [
        { idea: 'Leeuwenhoek\'s lenses magnified much more (about 200× vs about 10×)', any: ['200', 'magnif', 'stronger', 'more powerful', 'bigger'] },
        { idea: 'Bacteria are very small', any: ['small', 'tiny', 'little'] },
      ],
      model: 'Bacteria are very small. Janssen\'s microscope only magnified about 10×. That is not enough. Leeuwenhoek\'s lenses magnified up to about 200×, which is 20 times more. So he could see them.',
      explain: 'Explain = give the reason. Numbers (10× and 200×) make your reason stronger.',
    },
    {
      id: 'C2-how-total', topic: 'C2', type: 'short',
      prompt: 'Describe how to work out the total magnification of a microscope. Use an example.',
      mustInclude: [
        { idea: 'Multiply', any: ['multipl', 'times', '×', ' x '] },
        { idea: 'Eyepiece', any: ['eyepiece', 'ocular', 'eye piece'] },
        { idea: 'Objective lens', any: ['objective'] },
      ],
      model: 'Multiply the eyepiece magnification by the objective lens magnification. For example, a 10× eyepiece and a 40× objective: 10 × 40 = 400×.',
      explain: 'Name both lenses. Then show one worked example.',
    },
    {
      id: 'C2-label-top', topic: 'C2', type: 'label', photo: 'c2-student-microscope',
      prompt: 'Label the microscope.',
      picture: 'microscope', spots: ['eyepiece', 'nosepiece', 'objectives', 'stage', 'clips'],
      explain: 'From the top: eyepiece, revolving nosepiece, objective lenses. Then the stage with its clips.',
    },
    {
      id: 'C2-label-bottom', topic: 'C2', type: 'label', photo: 'c2-student-microscope',
      prompt: 'Label the lower parts of the microscope.',
      picture: 'microscope', spots: ['diaphragm', 'light', 'coarse', 'fine'],
      explain: 'The diaphragm sits under the stage, above the light. The big knob is coarse focus. The small knob is fine focus.',
    },
  ],
  words: [
    { word: 'microscope', meaning: 'A tool that makes very small things look much bigger', sentence: 'We used a microscope to look at human tissue.' },
    { word: 'magnification', meaning: 'How many times bigger something looks', sentence: 'The total magnification was 400×.' },
    { word: 'eyepiece', meaning: 'The lens you look through, usually 10×', sentence: 'Look through the eyepiece and turn the fine focus.' },
    { word: 'objective lens', meaning: 'The 4×, 10× or 40× glass near the slide', sentence: 'I switched to the 40× objective lens.' },
    { word: 'diaphragm', meaning: 'The part under the stage that changes how much light reaches the slide', sentence: 'I opened the diaphragm to let in more light.' },
    { word: 'animalcules', meaning: 'Leeuwenhoek\'s name for the tiny living things he saw', sentence: 'Leeuwenhoek called bacteria animalcules.' },
    { word: 'compound microscope', meaning: 'A tool for seeing tiny things that has two lenses: an eyepiece and an objective', sentence: 'Janssen made the first compound microscope in 1590.' },
    { word: 'chloroplast', meaning: 'The green part of a plant cell', sentence: 'The plant cells had green chloroplasts.' },
  ],
  can: [
    { text: "I can tell the story of the first microscopes", items: ['C2-janssen', 'C2-timeline', 'C2-who-did-what', 'C2-hooke-mag'] },
    { text: "I can explain how cells got their name", items: ['C2-hooke-cork', 'C2-cellae'] },
    { text: "I can describe what Leeuwenhoek discovered", items: ['C2-leeuwenhoek', 'C2-animalcules', 'C2-compare-mag', 'C2-why-leeuwenhoek'] },
    { text: "I can name the parts of a microscope", items: ['C2-parts', 'C2-parts-2', 'C2-word-eyepiece', 'C2-word-nosepiece', 'C2-word-diaphragm', 'C2-label-top', 'C2-label-bottom'] },
    { text: "I can work out total magnification", items: ['C2-total-mag', 'C2-which-objective', 'C2-biggest-view', 'C2-word-objective', 'C2-how-total'] },
    { text: "I can tell plant and animal cells apart under a microscope", items: ['C2-plant-animal-sort', 'C2-stain', 'C2-compare-cells'] },
  ],
};
