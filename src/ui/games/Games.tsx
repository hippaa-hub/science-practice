export type GameId = 'cell' | 'predict' | 'dials';

export const GAMES: { id: GameId; title: string; icon: string; blurb: string; minutes: number }[] = [
  { id: 'cell', title: 'Build a cell', icon: '🧫', blurb: 'Put each organelle in the animal cell, the plant cell, or both.', minutes: 3 },
  { id: 'predict', title: 'Predict it!', icon: '🔮', blurb: 'Guess what happens, watch it, then explain why.', minutes: 4 },
  { id: 'dials', title: 'Magnification dials', icon: '🔬', blurb: 'Turn the eyepiece and objective to hit the target magnification.', minutes: 3 },
];

/** The Games tab: three big tiles. */
export function GamesTab({ played, onPlay }: { played: Record<GameId, number>; onPlay: (g: GameId) => void }) {
  return (
    <div className="screen">
      <h1>Games</h1>
      <p className="muted">Short games that count as practice. Nothing to lose, only XP to gain.</p>
      <div className="stack">
        {GAMES.map((g) => (
          <button key={g.id} className="game-tile" onClick={() => onPlay(g.id)}>
            <span className="game-icon" aria-hidden="true">{g.icon}</span>
            <span className="grow">
              <span className="bold block">{g.title}</span>
              <span className="small muted block">{g.blurb}</span>
              <span className="small muted block">About {g.minutes} min{played[g.id] ? ` · played ${played[g.id]} ${played[g.id] === 1 ? 'time' : 'times'}` : ''}</span>
            </span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
