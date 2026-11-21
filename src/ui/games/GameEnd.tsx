import { useEffect, useMemo } from 'react';
import { XP } from '../../engine/motivation';
import { Mascot } from '../Mascot';
import { play } from '../sounds';

/** The end card every game shares: a cheer, the score, the XP it earned, play again or back. */
export function GameEnd({ title, right, total, line, onAgain, onBack }: {
  title: string;
  right: number;
  total: number;
  /** One specific sentence about what she did. */
  line: string;
  onAgain: () => void;
  onBack: () => void;
}) {
  const xp = right * XP.correct + (total - right) * XP.effort + XP.practiceDone;
  const confetti = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    left: `${(i * 41) % 100}%`, delay: `${(i % 8) * 0.25}s`, color: ['#58cc02', '#1cb0f6', '#ff9600', '#ce82ff', '#ffc800'][i % 5],
  })), []);
  useEffect(() => { play('done'); }, []);
  return (
    <div className="screen">
      <div className="summary-hero">
        <div className="confetti" aria-hidden="true">{confetti.map((c, i) => <i key={i} style={{ left: c.left, animationDelay: c.delay, background: c.color }} />)}</div>
        <Mascot mood="cheer" size={110} />
        <h1>{title}</h1>
        <p className="xp-gain pop">+{xp} XP</p>
      </div>
      <div className="card bold coach-says">{line}</div>
      <div className="row">
        <div className="stat"><b>{right}</b><span className="small muted">right first time</span></div>
        <div className="stat"><b>{total}</b><span className="small muted">in this game</span></div>
      </div>
      <button className="btn block big" onClick={onAgain}>Play again</button>
      <button className="btn ghost block" onClick={onBack}>Back to games</button>
    </div>
  );
}

/** XP a game earns, the same sum the end card shows, for the record. */
export function gameXp(right: number, total: number): number {
  return right * XP.correct + (total - right) * XP.effort + XP.practiceDone;
}
