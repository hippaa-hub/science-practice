import { TOPICS, currentTopic } from '../content';
import type { Topic } from '../content/types';
import type { ProgressMap } from '../engine/boxes';
import { topicStrength } from '../engine/practice';
import { topicStatus, type TopicStatus } from '../engine/status';
import { Picture } from '../pictures';

const STATUS_TEXT: Record<TopicStatus, string> = { new: 'new', learning: 'learning', secure: 'secure' };

export function StatusChip({ status }: { status: TopicStatus }) {
  return <span className={`chip ${status === 'secure' ? 'mastered' : status === 'learning' ? 'learning' : ''}`}>{STATUS_TEXT[status]}</span>;
}

/** The units and topics as a map. */
export function Topics({ progress, today, onOpen }: { progress: ProgressMap; today: string; onOpen: (t: Topic) => void }) {
  const units = [...new Set(TOPICS.map((t) => t.unit))];
  return (
    <div className="screen">
      <h1>Topics</h1>
      {units.map((u) => (
        <section key={u} className="stack">
          <h2>Unit: {u}</h2>
          <ol className="topic-map">
            {TOPICS.filter((t) => t.unit === u).map((t, i) => {
              const st = topicStatus(t, progress, today);
              const pct = Math.round(topicStrength(t, progress, today) * 100);
              return (
                <li key={t.id}>
                  <button className={`topic-node ${st}`} onClick={() => onOpen(t)}>
                    <span className="topic-num" aria-hidden="true">{i + 1}</span>
                    <span className="grow">
                      <span className="bold block">{t.title}</span>
                      <span className="small muted block">{t.id === currentTopic ? 'In class now · ' : ''}{pct}% strong</span>
                      <span className="mini-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
                    </span>
                    <StatusChip status={st} />
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function TopicPage({ topic, progress, today, onBack, onLearn, onPractise }: {
  topic: Topic;
  progress: ProgressMap;
  today: string;
  onBack: () => void;
  onLearn: () => void;
  onPractise: () => void;
}) {
  const st = topicStatus(topic, progress, today);
  const pct = Math.round(topicStrength(topic, progress, today) * 100);
  const cover = topic.learn.find((c) => c.picture)?.picture;
  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onBack} aria-label="Back to topics">←</button>
        <p className="small muted grow">Unit: {topic.unit}</p>
        <StatusChip status={st} />
      </div>
      <h1>{topic.title}</h1>
      {cover && <Picture name={cover} />}
      <p className="muted">{pct}% of questions strong · {topic.learn.length} learn cards · {topic.words.length} words</p>
      <button className="btn block big blue" onClick={onLearn}>Learn</button>
      <button className="btn block big" onClick={onPractise}>Practise this topic</button>
    </div>
  );
}
