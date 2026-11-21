import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { SortItem } from '../content/types';
import { checkSort } from '../engine/check';
import { seeded, shuffle } from '../engine/rng';
import { play } from './sounds';
import type { Outcome } from './ItemView';

interface Drag { text: string; x: number; y: number; dx: number; dy: number; moved: boolean }

/**
 * A sort question she can play with her finger: drag each chip into a zone (or tap the chip, then the zone).
 * Each zone can show its own picture, so "Comes in" is the inside of a cell and "Goes out as waste" is
 * outside the membrane. Placed chips sit on the zone as small tags; tapping a tag sends it back.
 */
export function DragSort({ item, seed, onDone }: { item: SortItem; seed: number; onDone: (o: Outcome) => void }) {
  const cards = useMemo(() => shuffle(item.cards, seeded(seed)), [item, seed]);
  const [given, setGiven] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [over, setOver] = useState<string | null>(null);
  const [checked, setChecked] = useState<string[] | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);

  const place = (text: string, bin: string) => {
    play('tap');
    setGiven((g) => ({ ...g, [text]: bin }));
    setSelected(null);
  };
  const unplace = (text: string) => {
    if (checked) return;
    setGiven((g) => { const n = { ...g }; delete n[text]; return n; });
  };

  const zoneAt = (x: number, y: number): string | null => {
    const el = document.elementFromPoint?.(x, y)?.closest?.('[data-zone]') as HTMLElement | null;
    return el?.dataset.zone ?? null;
  };

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>, text: string) => {
    if (checked) return;
    const r = e.currentTarget.getBoundingClientRect();
    start.current = { x: e.clientX, y: e.clientY };
    setDrag({ text, x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moved: false });
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag || !start.current) return;
    const moved = drag.moved || Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 6;
    setDrag({ ...drag, x: e.clientX, y: e.clientY, moved });
    if (moved) setOver(zoneAt(e.clientX, e.clientY));
  };
  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    const d = drag;
    setDrag(null); setOver(null);
    if (!d.moved) { setSelected(selected === d.text ? null : d.text); return; } // a tap: select the chip
    const bin = zoneAt(e.clientX, e.clientY);
    if (bin) place(d.text, bin);
  };

  const tray = cards.filter((c) => !given[c.text]);
  const done = cards.every((c) => given[c.text]);
  const wrongSet = new Set(checked ?? []);

  return (
    <div className="stack">
      <p className="qtext">{item.prompt}</p>
      <p className="muted small">Drag each one into its place, or tap it and then tap the place.</p>
      <div className="zones" style={{ gridTemplateColumns: `repeat(${item.bins.length}, 1fr)` }}>
        {item.bins.map((b) => {
          const img = item.zones?.[b];
          return (
            <div key={b} data-zone={b} role="button" tabIndex={0} aria-label={`Zone: ${b}`}
              className={`zone${over === b ? ' over' : ''}${selected ? ' ready' : ''}`}
              style={img ? { backgroundImage: `url(./img/${img}.webp)` } : undefined}
              onClick={() => { if (selected) place(selected, b); }}
              onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && selected) { e.preventDefault(); place(selected, b); } }}>
              <span className="zone-label">{b}</span>
              <div className="zone-tags">
                {cards.filter((c) => given[c.text] === b).map((c) => (
                  <button key={c.text} type="button" className={`tag pop${wrongSet.has(c.text) ? ' wrong' : ''}`} onClick={(e) => { e.stopPropagation(); unplace(c.text); }} aria-label={`${c.text}, in ${b}. Tap to take it back`}>{c.text}</button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="tray" aria-label="Things to sort">
        {tray.length === 0 && <span className="muted small">All placed. Check your answer.</span>}
        {tray.map((c) => (
          <button key={c.text} type="button" className={`chip-btn drag-chip${selected === c.text ? ' selected' : ''}${drag?.text === c.text ? ' lifting' : ''}`}
            onPointerDown={(e) => onDown(e, c.text)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { setDrag(null); setOver(null); }}
            aria-pressed={selected === c.text}>{c.text}</button>
        ))}
      </div>
      {drag?.moved && (
        <span className="chip-btn drag-ghost" aria-hidden="true" style={{ left: drag.x - drag.dx, top: drag.y - drag.dy }}>{drag.text}</span>
      )}
      <button className="btn block big" disabled={!done || !!checked} onClick={() => {
        const wrong = checkSort(item.cards, given);
        setChecked(wrong);
        onDone({
          correct: wrong.length === 0,
          reveal: item.bins.map((b) => `${b}: ${item.cards.filter((c) => c.bin === b).map((c) => c.text).join(', ')}`).join('\n'),
          note: wrong.length ? `Not yet: ${wrong.join(', ')}` : undefined,
        });
      }}>Check</button>
    </div>
  );
}
