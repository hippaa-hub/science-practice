import { BADGES } from '../engine/motivation';

export function Badges({ earned, highlight = [], onlyEarned = false }: { earned: Set<string>; highlight?: string[]; onlyEarned?: boolean }) {
  const got = BADGES.filter((b) => earned.has(b.id));
  const next = onlyEarned ? [] : BADGES.filter((b) => !earned.has(b.id)).slice(0, 3);
  return (
    <div className="stack">
      {got.length === 0 && <p className="muted small">No badges yet. The first one comes with your first finished mix.</p>}
      <div className="badge-grid">
        {got.map((b) => (
          <div key={b.id} className={`badge ${highlight.includes(b.id) ? 'new pop' : ''}`} title={b.how}>
            <span className="badge-icon" aria-hidden="true">{b.icon}</span>
            <b>{b.title}</b>
            <span className="small muted">{b.how}</span>
          </div>
        ))}
        {next.map((b) => (
          <div key={b.id} className="badge locked" title={b.how}>
            <span className="badge-icon" aria-hidden="true">{b.icon}</span>
            <b>{b.title}</b>
            <span className="small muted">{b.how}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
