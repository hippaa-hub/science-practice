import { levelFor } from '../engine/motivation';

export function XpBar({ xp }: { xp: number }) {
  const { level, into, needed } = levelFor(xp);
  return (
    <div className="xpbar grow" aria-label={`Level ${level}, ${into} of ${needed} XP to the next level`}>
      <span className="xp-level">Lv {level}</span>
      <div className="xp-track"><div style={{ width: `${Math.min(100, (into / needed) * 100)}%` }} /></div>
      <span className="xp-text">{xp} XP</span>
    </div>
  );
}
