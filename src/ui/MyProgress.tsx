import { TOPICS } from '../content';
import type { ProgressMap } from '../engine/boxes';
import { CAN_AT, allCans, canReached, canShare, weekGain, weeklyCounts, type MasteryLog } from '../engine/motivation';
import { Badges } from './Badges';
import { Mascot } from './Mascot';

const shortDate = (day: string) => {
  const [, m, d] = day.split('-').map(Number);
  return `${d}/${m}`;
};

/** "My progress": what she can do now, and how it grows. */
export function MyProgress({ progress, masteryLog, now, today, earned, onBack }: {
  progress: ProgressMap;
  masteryLog: MasteryLog;
  now: number;
  today: string;
  earned: Set<string>;
  onBack: () => void;
}) {
  const cans = allCans(TOPICS);
  const count = cans.filter((c) => canReached(c, progress, now)).length;
  const gain = weekGain(masteryLog, count, today);
  const weeks = weeklyCounts(masteryLog, count, today, 6);
  const top = Math.max(5, ...weeks.map((w) => w.count));

  return (
    <div className="screen">
      <div className="topbar">
        <button type="button" className="iconbtn" aria-label="Back home" onClick={onBack}>←</button>
        <h1 className="grow">My progress</h1>
      </div>

      <div className="hero">
        <Mascot mood={gain > 0 ? 'cheer' : 'happy'} size={84} />
        <div className="cando-hero">
          <div className="big-number">{count}</div>
          <div>
            <b>thing{count === 1 ? '' : 's'} you can do</b>
            <span className="muted small">
              of {cans.length} · {gain > 0 ? <strong className="good">+{gain} this week</strong> : 'practise to add more this week'}
            </span>
          </div>
        </div>
      </div>
      <p className="muted small">
        An "I can" becomes yours when you get most of its questions right on different days. If you stop practising, it
        pauses until you review it, so this number is real.
      </p>

      <div className="card stack">
        <h2>Week by week</h2>
        <div className="week-bars" role="img" aria-label="Things you could do at the end of each week">
          {weeks.map((w, i) => (
            <div key={w.week} className="week-bar">
              <span className="n">{w.count}</span>
              <i style={{ height: `${Math.max(4, (w.count / top) * 100)}%` }} className={i === weeks.length - 1 ? 'now' : ''} />
              <small>{i === weeks.length - 1 ? 'now' : shortDate(w.week)}</small>
            </div>
          ))}
        </div>
      </div>

      {TOPICS.map((t) => (
        <section key={t.id} className="stack tight">
          <h2>{t.title}</h2>
          {t.can.map((c) => {
            const share = canShare(c, progress, now);
            const done = canReached(c, progress, now);
            return (
              <div key={c.text} className={`level ${done ? 'done' : ''}`}>
                <div className="level-badge" style={{ background: done ? 'var(--yellow)' : 'var(--blue)' }}>{done ? '⭐' : '…'}</div>
                <div className="level-text">
                  <b>{c.text}</b>
                  <small className="muted">{done ? 'Yours!' : `${c.items.filter((id) => (progress[id]?.box ?? 0) >= 3).length} of ${c.items.length} questions strong`}</small>
                  <span className="level-bar">
                    <i style={{ width: `${Math.max(3, Math.round(share * 100))}%`, background: done ? 'var(--yellow)' : 'var(--blue)' }} />
                    <em style={{ left: `${CAN_AT * 100}%` }} />
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      ))}

      <h2>Badges</h2>
      <Badges earned={earned} />
    </div>
  );
}
