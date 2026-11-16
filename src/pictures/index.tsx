import type { ReactElement } from 'react';

/**
 * All pictures are inline SVG drawn in code (no downloads, works offline).
 * Diagrams with `parts` can be labelled: each part has an anchor on the drawing (ax, ay)
 * and a marker position in the margin (mx, my), joined by a thin line.
 */
export interface Part { name: string; ax: number; ay: number; mx: number; my: number }
interface PictureDef { viewBox: string; alt: string; draw: () => ReactElement; parts?: Record<string, Part> }

const INK = '#4b4b4b';
const T = { fontFamily: 'Nunito, sans-serif', fontWeight: 800, fill: INK } as const;

function Mito({ x, y, rot = 0, s = 1 }: { x: number; y: number; rot?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <ellipse rx="22" ry="11" fill="#ffc9bf" stroke="#e0604d" strokeWidth="2.5" />
      <polyline points="-15,0 -11,-6 -7,6 -3,-6 1,6 5,-6 9,6 13,-4 15,0" fill="none" stroke="#e0604d" strokeWidth="1.8" />
    </g>
  );
}

function Chloro({ x, y, rot = 0 }: { x: number; y: number; rot?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <ellipse rx="16" ry="8" fill="#58cc02" stroke="#3d8c02" strokeWidth="2" />
      <line x1="-8" y1="-3" x2="-8" y2="3" stroke="#2f6e01" strokeWidth="2" />
      <line x1="0" y1="-4" x2="0" y2="4" stroke="#2f6e01" strokeWidth="2" />
      <line x1="8" y1="-3" x2="8" y2="3" stroke="#2f6e01" strokeWidth="2" />
    </g>
  );
}

const RIBOSOMES = [[100, 95], [118, 72], [215, 200], [230, 130], [125, 158], [280, 135], [205, 60], [85, 152], [150, 205], [196, 178]];

const PICTURES: Record<string, PictureDef> = {
  'animal-cell': {
    viewBox: '0 0 360 260',
    alt: 'Diagram of an animal cell',
    draw: () => (
      <g>
        <path d="M60,130 C60,60 125,28 185,30 C255,33 305,68 302,130 C299,195 250,232 180,230 C110,228 60,200 60,130Z" fill="#fff4e0" stroke="#e08600" strokeWidth="4" />
        <circle cx="170" cy="125" r="42" fill="#eadcff" stroke="#a568cc" strokeWidth="3" />
        <circle cx="158" cy="116" r="13" fill="#a568cc" />
        <Mito x={250} y={88} rot={-25} />
        <Mito x={112} y={192} rot={20} />
        <Mito x={252} y={178} rot={15} s={0.85} />
        {RIBOSOMES.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3.5" fill="#1899d6" />)}
      </g>
    ),
    parts: {
      membrane: { name: 'Cell membrane', ax: 63, ay: 108, mx: 22, my: 78 },
      cytoplasm: { name: 'Cytoplasm', ax: 100, ay: 124, mx: 22, my: 168 },
      nucleus: { name: 'Nucleus', ax: 190, ay: 98, mx: 205, my: 12 },
      nucleolus: { name: 'Nucleolus', ax: 152, ay: 124, mx: 22, my: 236 },
      mitochondria: { name: 'Mitochondria', ax: 264, ay: 82, mx: 338, my: 52 },
      ribosomes: { name: 'Ribosomes', ax: 280, ay: 135, mx: 338, my: 150 },
    },
  },

  'plant-cell': {
    viewBox: '0 0 360 260',
    alt: 'Diagram of a plant cell',
    draw: () => (
      <g>
        <rect x="60" y="25" width="240" height="210" rx="14" fill="#c9f2a7" stroke="#46a302" strokeWidth="10" />
        <rect x="70" y="35" width="220" height="190" rx="8" fill="#f3ffe9" stroke="#e08600" strokeWidth="2.5" />
        <rect x="105" y="70" width="150" height="110" rx="40" fill="#ddf4ff" stroke="#1cb0f6" strokeWidth="3" />
        <circle cx="252" cy="196" r="20" fill="#eadcff" stroke="#a568cc" strokeWidth="2.5" />
        <circle cx="247" cy="191" r="6" fill="#a568cc" />
        <Chloro x={98} y={55} rot={-10} />
        <Chloro x={272} y={58} rot={15} />
        <Chloro x={92} y={204} rot={10} />
        <Chloro x={168} y={206} rot={-5} />
        <Chloro x={276} y={122} rot={80} />
        <Chloro x={88} y={125} rot={85} />
        <Mito x={200} y={52} rot={10} s={0.65} />
      </g>
    ),
    parts: {
      wall: { name: 'Cell wall', ax: 300, ay: 92, mx: 340, my: 92 },
      membrane: { name: 'Cell membrane', ax: 71, ay: 160, mx: 22, my: 182 },
      vacuole: { name: 'Large permanent vacuole', ax: 172, ay: 112, mx: 150, my: 10 },
      nucleus: { name: 'Nucleus', ax: 265, ay: 205, mx: 338, my: 220 },
      chloroplasts: { name: 'Chloroplasts', ax: 88, ay: 118, mx: 22, my: 108 },
      mitochondria: { name: 'Mitochondria', ax: 206, ay: 52, mx: 250, my: 10 },
      cytoplasm: { name: 'Cytoplasm', ax: 128, ay: 192, mx: 110, my: 252 },
    },
  },

  microscope: {
    viewBox: '0 0 360 300',
    alt: 'Diagram of a compound light microscope',
    draw: () => (
      <g>
        <rect x="110" y="262" width="170" height="24" rx="8" fill="#9aa4ad" />
        <path d="M148,264 L148,200 C148,150 172,118 198,92 L214,106 C194,130 172,160 172,205 L172,264Z" fill="#7a8691" />
        <rect x="196" y="84" width="38" height="26" rx="6" fill="#7a8691" />
        <rect x="207" y="42" width="16" height="44" fill="#9aa4ad" />
        <rect x="203" y="12" width="24" height="32" rx="4" fill="#555" />
        <rect x="195" y="108" width="48" height="14" rx="5" fill="#555" />
        <rect x="200" y="122" width="10" height="22" rx="2" fill="#c0c8cf" stroke="#555" strokeWidth="1.5" />
        <rect x="214" y="122" width="10" height="32" rx="2" fill="#c0c8cf" stroke="#555" strokeWidth="1.5" />
        <rect x="228" y="122" width="10" height="18" rx="2" fill="#c0c8cf" stroke="#555" strokeWidth="1.5" />
        <rect x="175" y="168" width="102" height="9" rx="2" fill="#444" />
        <rect x="200" y="164" width="50" height="4" fill="#bfe6ff" />
        <rect x="186" y="161" width="22" height="5" rx="2" fill="#999" />
        <rect x="244" y="161" width="22" height="5" rx="2" fill="#999" />
        <rect x="207" y="181" width="28" height="7" rx="2" fill="#666" />
        <circle cx="221" cy="249" r="10" fill="#ffc800" stroke="#e6b400" strokeWidth="3" />
        <circle cx="160" cy="205" r="14" fill="#666" />
        <circle cx="160" cy="236" r="8" fill="#999" />
      </g>
    ),
    parts: {
      eyepiece: { name: 'Eyepiece (ocular lens)', ax: 222, ay: 26, mx: 310, my: 26 },
      nosepiece: { name: 'Revolving nosepiece', ax: 238, ay: 114, mx: 318, my: 92 },
      objectives: { name: 'Objective lenses', ax: 236, ay: 136, mx: 322, my: 134 },
      stage: { name: 'Stage', ax: 270, ay: 172, mx: 330, my: 172 },
      clips: { name: 'Stage clips', ax: 192, ay: 163, mx: 96, my: 140 },
      diaphragm: { name: 'Diaphragm', ax: 232, ay: 185, mx: 322, my: 210 },
      light: { name: 'Light source', ax: 230, ay: 250, mx: 322, my: 248 },
      coarse: { name: 'Coarse focus knob', ax: 147, ay: 205, mx: 70, my: 200 },
      fine: { name: 'Fine focus knob', ax: 153, ay: 238, mx: 70, my: 242 },
    },
  },

  timeline: {
    viewBox: '0 0 360 150',
    alt: 'Timeline: Janssen 1590, Hooke 1665, Leeuwenhoek about 1670',
    draw: () => (
      <g {...T} fontSize="14" textAnchor="middle">
        <line x1="20" y1="70" x2="340" y2="70" stroke="#ccc" strokeWidth="6" strokeLinecap="round" />
        {[[60, '1590', 'Janssen', 'about 10×'], [200, '1665', 'Hooke', 'about 50×'], [300, 'c. 1670', 'Leeuwenhoek', 'about 200×']].map(([x, y, n, m]) => (
          <g key={String(n)}>
            <circle cx={Number(x)} cy="70" r="11" fill="#1cb0f6" stroke="#fff" strokeWidth="3" />
            <text x={Number(x)} y="44">{y}</text>
            <text x={Number(x)} y="104">{n}</text>
            <text x={Number(x)} y="124" fontWeight={600} fill="#777">{m}</text>
          </g>
        ))}
      </g>
    ),
  },

  cork: {
    viewBox: '0 0 360 170',
    alt: 'Cork seen through a microscope: rows of empty boxes',
    draw: () => (
      <g>
        <circle cx="180" cy="85" r="80" fill="#f5e6cf" stroke="#4b4b4b" strokeWidth="4" />
        <clipPath id="cork-clip"><circle cx="180" cy="85" r="78" /></clipPath>
        <g clipPath="url(#cork-clip)" stroke="#a0784a" strokeWidth="3" fill="none">
          {Array.from({ length: 7 }, (_, r) => Array.from({ length: 9 }, (_, c) => (
            <rect key={`${r}-${c}`} x={95 + c * 22 + (r % 2) * 11} y={5 + r * 24} width="20" height="22" rx="2" />
          )))}
        </g>
      </g>
    ),
  },

  animalcules: {
    viewBox: '0 0 360 170',
    alt: 'Tiny living things seen in a drop of water',
    draw: () => (
      <g>
        <circle cx="180" cy="85" r="80" fill="#e6f7ff" stroke="#4b4b4b" strokeWidth="4" />
        <g fill="#58cc02" stroke="#3d8c02" strokeWidth="2">
          <rect x="140" y="50" width="30" height="12" rx="6" transform="rotate(-20 155 56)" />
          <rect x="200" y="100" width="34" height="12" rx="6" transform="rotate(30 217 106)" />
          <rect x="150" y="110" width="26" height="11" rx="5.5" />
        </g>
        <g fill="#ffc800" stroke="#e6b400" strokeWidth="2">
          <ellipse cx="215" cy="55" rx="12" ry="9" /><ellipse cx="226" cy="64" rx="7" ry="5" />
          <ellipse cx="125" cy="90" rx="11" ry="8" />
        </g>
        <path d="M110,60 q8,-10 16,0 q8,10 16,0" fill="none" stroke="#ce82ff" strokeWidth="4" strokeLinecap="round" />
        <path d="M200,135 q7,-9 14,0 q7,9 14,0" fill="none" stroke="#ce82ff" strokeWidth="4" strokeLinecap="round" />
      </g>
    ),
  },

  magnify: {
    viewBox: '0 0 360 120',
    alt: 'Eyepiece 10× times objective 40× equals 400×',
    draw: () => (
      <g {...T} textAnchor="middle">
        {[[55, '10×', 'eyepiece', '#ddf4ff', '#1cb0f6'], [180, '40×', 'objective', '#f1e3ff', '#ce82ff'], [305, '400×', 'total', '#d7ffb8', '#58cc02']].map(([x, big, small, f, s]) => (
          <g key={String(small)}>
            <rect x={Number(x) - 50} y="15" width="100" height="70" rx="16" fill={String(f)} stroke={String(s)} strokeWidth="3" />
            <text x={Number(x)} y="58" fontSize="28">{big}</text>
            <text x={Number(x)} y="108" fontSize="15" fontWeight={700} fill="#777">{small}</text>
          </g>
        ))}
        <text x="117" y="60" fontSize="28">×</text>
        <text x="242" y="60" fontSize="28">=</text>
      </g>
    ),
  },

  'plant-vs-animal': {
    viewBox: '0 0 360 160',
    alt: 'Plant cells look like green boxes; animal cells look rounded, with a stained nucleus',
    draw: () => (
      <g>
        <g>
          {Array.from({ length: 3 }, (_, r) => Array.from({ length: 4 }, (_, c) => (
            <g key={`${r}-${c}`}>
              <rect x={12 + c * 38} y={14 + r * 40} width="36" height="38" fill="#e3fbd0" stroke="#46a302" strokeWidth="3.5" />
              <circle cx={22 + c * 38} cy={24 + r * 40} r="3.5" fill="#58cc02" />
              <circle cx={38 + c * 38} cy={42 + r * 40} r="3.5" fill="#58cc02" />
            </g>
          )))}
        </g>
        <g>
          {[[225, 40, 24], [290, 35, 20], [330, 80, 18], [255, 100, 26], [205, 115, 18], [315, 130, 17]].map(([x, y, r]) => (
            <g key={`${x}`}>
              <ellipse cx={x} cy={y} rx={r} ry={r * 0.82} fill="#ffe0ee" stroke="#e66a9a" strokeWidth="2.5" />
              <circle cx={x - 2} cy={y} r={r * 0.32} fill="#5a6fd8" />
            </g>
          ))}
        </g>
      </g>
    ),
  },

  mitochondrion: {
    viewBox: '0 0 360 150',
    alt: 'A mitochondrion with a folded inner membrane',
    draw: () => (
      <g>
        <ellipse cx="180" cy="72" rx="150" ry="58" fill="#ffc9bf" stroke="#e0604d" strokeWidth="5" />
        <path d="M45,72 L65,30 L85,112 L105,30 L125,112 L145,30 L165,112 L185,30 L205,112 L225,30 L245,112 L265,30 L285,112 L305,40 L318,72" fill="none" stroke="#e0604d" strokeWidth="4" strokeLinejoin="round" />
      </g>
    ),
  },

  respiration: {
    viewBox: '0 0 360 130',
    alt: 'glucose + oxygen → carbon dioxide + water + energy',
    draw: () => (
      <g {...T} fontSize="15" textAnchor="middle">
        <rect x="8" y="20" width="96" height="40" rx="12" fill="#fff3c4" /><text x="56" y="45">glucose</text>
        <text x="116" y="45">+</text>
        <rect x="128" y="20" width="90" height="40" rx="12" fill="#ddf4ff" /><text x="173" y="45">oxygen</text>
        <text x="180" y="88" fontSize="26">↓</text>
        <rect x="8" y="98" width="120" height="30" rx="10" fill="#eee" /><text x="68" y="118">carbon dioxide</text>
        <text x="138" y="118">+</text>
        <rect x="148" y="98" width="72" height="30" rx="10" fill="#ddf4ff" /><text x="184" y="118">water</text>
        <text x="230" y="118">+</text>
        <rect x="240" y="98" width="86" height="30" rx="10" fill="#ffe8c2" /><text x="283" y="118">energy</text>
        <text x="300" y="50" fontSize="13" fontWeight={700} fill="#777">in the</text>
        <text x="300" y="66" fontSize="13" fontWeight={700} fill="#777">mitochondria</text>
      </g>
    ),
  },

  'beta-cell': {
    viewBox: '0 0 360 150',
    alt: 'A pancreatic beta-cell releasing insulin',
    draw: () => (
      <g>
        <ellipse cx="140" cy="75" rx="95" ry="62" fill="#fff4e0" stroke="#e08600" strokeWidth="4" />
        <circle cx="120" cy="72" r="26" fill="#eadcff" stroke="#a568cc" strokeWidth="3" />
        {[[180, 50], [190, 90], [200, 70], [168, 108]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#1cb0f6" />)}
        {[[255, 50], [280, 80], [300, 45], [270, 115], [320, 95]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="6" fill="#1cb0f6" />)}
        <path d="M236,75 L250,75" stroke="#777" strokeWidth="3" />
        <text x="300" y="140" {...T} fontSize="14" textAnchor="middle">insulin</text>
      </g>
    ),
  },

  'cells-variety': {
    viewBox: '0 0 360 140',
    alt: 'Different cell shapes: blood, skin, muscle and heart cells',
    draw: () => (
      <g>
        <g transform="translate(45 60)">
          <ellipse rx="30" ry="30" fill="#ff8b8b" stroke="#d94848" strokeWidth="3" />
          <ellipse rx="13" ry="13" fill="#ffb3b3" />
        </g>
        <g transform="translate(130 60)" fill="#ffe0c2" stroke="#d99a5e" strokeWidth="2.5">
          <polygon points="-30,-14 -15,-28 15,-28 30,-14 15,0 -15,0" />
          <polygon points="-30,16 -15,2 15,2 30,16 15,30 -15,30" />
        </g>
        <g transform="translate(222 60)">
          <path d="M-45,0 C-20,-16 20,-16 45,0 C20,16 -20,16 -45,0Z" fill="#ffc9d6" stroke="#d9667f" strokeWidth="3" />
          <ellipse rx="7" ry="4" fill="#a568cc" />
        </g>
        <g transform="translate(315 60)" fill="#ffd6d6" stroke="#c04848" strokeWidth="2.5">
          <path d="M-28,-14 L10,-14 L18,-28 L26,-24 L20,-12 L28,-6 L28,10 L-6,10 L-14,26 L-22,22 L-16,8 L-28,4Z" />
        </g>
        <g {...T} fontSize="14" textAnchor="middle">
          <text x="45" y="125">blood</text><text x="130" y="125">skin</text><text x="222" y="125">muscle</text><text x="315" y="125">heart</text>
        </g>
      </g>
    ),
  },

  'stem-cell': {
    viewBox: '0 0 360 170',
    alt: 'A stem cell can become many kinds of cell',
    draw: () => (
      <g>
        <circle cx="70" cy="85" r="42" fill="#f1e3ff" stroke="#a568cc" strokeWidth="4" />
        <circle cx="70" cy="85" r="15" fill="#ce82ff" />
        {[[30], [85], [140]].map(([y]) => <path key={y} d={`M118,85 Q180,85 230,${y}`} fill="none" stroke="#bbb" strokeWidth="4" markerEnd="url(#arrow)" />)}
        <defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8Z" fill="#bbb" /></marker></defs>
        <ellipse cx="272" cy="30" rx="22" ry="22" fill="#ff8b8b" stroke="#d94848" strokeWidth="3" />
        <path d="M232,85 C252,72 292,72 316,85 C292,98 252,98 232,85Z" fill="#ffc9d6" stroke="#d9667f" strokeWidth="3" />
        <polygon points="248,128 262,116 288,116 300,128 288,142 262,142" fill="#ffe0c2" stroke="#d99a5e" strokeWidth="2.5" />
        <g {...T} fontSize="13" textAnchor="middle">
          <text x="70" y="148">stem cell</text>
          <text x="322" y="35">blood</text><text x="340" y="90">muscle</text><text x="328" y="134">skin</text>
        </g>
      </g>
    ),
  },

  medicine: {
    viewBox: '0 0 360 140',
    alt: 'Cells in medicine: cancer drugs, bacteria making insulin, stem cells repairing tissue',
    draw: () => (
      <g>
        <g transform="translate(60 55)">
          <rect x="-30" y="-14" width="60" height="28" rx="14" fill="#fff" stroke="#e66a9a" strokeWidth="3" />
          <rect x="0" y="-14" width="30" height="28" rx="0" fill="#e66a9a" />
          <rect x="16" y="-14" width="14" height="28" rx="14" fill="#e66a9a" />
        </g>
        <g transform="translate(180 55)">
          <rect x="-34" y="-12" width="68" height="24" rx="12" fill="#58cc02" stroke="#3d8c02" strokeWidth="2.5" />
          {[[-44, -22], [44, -18], [40, 22]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="5" fill="#1cb0f6" />)}
        </g>
        <g transform="translate(300 55)">
          <path d="M0,22 C-30,0 -28,-26 -12,-26 C-4,-26 0,-18 0,-14 C0,-18 4,-26 12,-26 C28,-26 30,0 0,22Z" fill="#ff8b8b" stroke="#d94848" strokeWidth="3" />
        </g>
        <g {...T} fontSize="13" textAnchor="middle">
          <text x="60" y="110">targeted</text><text x="60" y="126">cancer drugs</text>
          <text x="180" y="110">bacteria make</text><text x="180" y="126">human insulin</text>
          <text x="300" y="110">stem cells</text><text x="300" y="126">repair tissue</text>
        </g>
      </g>
    ),
  },

  scales: {
    viewBox: '0 0 360 160',
    alt: 'A balance: new cures on one side, strict rules on the other',
    draw: () => (
      <g>
        <rect x="174" y="30" width="12" height="110" fill="#9aa4ad" />
        <rect x="130" y="138" width="100" height="12" rx="6" fill="#9aa4ad" />
        <rect x="50" y="28" width="260" height="8" rx="4" fill="#7a8691" />
        <path d="M70,36 L50,80 L130,80 L110,36" fill="none" stroke="#bbb" strokeWidth="2" />
        <path d="M250,36 L230,80 L310,80 L290,36" fill="none" stroke="#bbb" strokeWidth="2" />
        <rect x="45" y="80" width="90" height="10" rx="5" fill="#58cc02" />
        <rect x="225" y="80" width="90" height="10" rx="5" fill="#ff9600" />
        <g {...T} fontSize="14" textAnchor="middle">
          <text x="90" y="112">new cures</text>
          <text x="270" y="112">strict rules</text>
        </g>
      </g>
    ),
  },
};

export function hasPicture(name: string): boolean {
  return name in PICTURES;
}

export function partsOf(name: string): Record<string, Part> {
  return PICTURES[name]?.parts ?? {};
}

/**
 * Draws a picture. `spots` = part keys to mark with numbers 1, 2, 3… (in that order).
 * `legend` shows the part names under the picture (Learn mode only — never in a question).
 */
export function Picture({ name, spots, active, legend, onSpot }: {
  name: string;
  spots?: string[];
  active?: number | null;
  legend?: boolean;
  onSpot?: (index: number) => void;
}) {
  const def = PICTURES[name];
  if (!def) return null;
  const parts = def.parts ?? {};
  const marks = (spots ?? []).map((k) => parts[k]).filter(Boolean);
  return (
    <figure className="pic">
      <svg viewBox={def.viewBox} role="img" aria-label={def.alt} width="100%">
        {def.draw()}
        {marks.map((p, i) => (
          <g key={p.name} className={`spot${active === i ? ' on' : ''}`} onClick={onSpot ? () => onSpot(i) : undefined} style={onSpot ? { cursor: 'pointer' } : undefined}>
            <line x1={p.mx} y1={p.my} x2={p.ax} y2={p.ay} stroke="#4b4b4b" strokeWidth="1.8" />
            <circle cx={p.ax} cy={p.ay} r="3.5" fill="#4b4b4b" />
            <circle cx={p.mx} cy={p.my} r="12" fill={active === i ? '#1cb0f6' : '#4b4b4b'} stroke="#fff" strokeWidth="2.5" />
            <text x={p.mx} y={p.my + 5} textAnchor="middle" fontSize="14" fontWeight="900" fill="#fff" fontFamily="Nunito, sans-serif">{i + 1}</text>
          </g>
        ))}
      </svg>
      {legend && marks.length > 0 && (
        <ol className="legend">{marks.map((p) => <li key={p.name}>{p.name}</li>)}</ol>
      )}
    </figure>
  );
}
