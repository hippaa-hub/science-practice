import { useState } from 'react';
import type { Topic } from '../content/types';
import { Picture } from '../pictures';
import { Photo } from './Photo';

/** Short cards, one picture each, then a quick check. */
export function Learn({ topic, onClose, onCheck }: { topic: Topic; onClose: () => void; onCheck: () => void }) {
  const [i, setI] = useState(0);
  const card = topic.learn[i];
  const last = i === topic.learn.length - 1;
  return (
    <div className="screen">
      <div className="topbar">
        <button className="iconbtn" onClick={onClose} aria-label="Close">✕</button>
        <div className="progress" aria-label={`Card ${i + 1} of ${topic.learn.length}`}><div style={{ width: `${((i + 1) / topic.learn.length) * 100}%`, background: 'var(--blue)' }} /></div>
      </div>
      <p className="small muted">{topic.title} · card {i + 1} of {topic.learn.length}</p>
      <h2>{card.title}</h2>
      {card.photo && <Photo name={card.photo} alt={card.title} />}
      {card.picture && <Picture name={card.picture} spots={card.labels} legend />}
      <p className="learn-text">{card.text}</p>
      {card.example && (
        <div className="card green">
          <p className="small label muted">Example</p>
          <p className="bold">{card.example}</p>
        </div>
      )}
      <div className="row learn-nav">
        <button className="btn ghost grow" disabled={i === 0} onClick={() => setI(i - 1)}>Back</button>
        {last
          ? <button className="btn grow" onClick={onCheck}>Check yourself</button>
          : <button className="btn blue grow" onClick={() => setI(i + 1)}>Next</button>}
      </div>
    </div>
  );
}
