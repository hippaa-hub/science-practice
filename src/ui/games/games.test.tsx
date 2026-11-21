import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CELL_PARTS, EYEPIECES, OBJECTIVES, PREDICTIONS, TARGETS, cellReason } from '../../games/content';
import { BuildCell } from './BuildCell';
import { Dials } from './Dials';
import { Predict, PREDICT_ROUNDS } from './Predict';

afterEach(cleanup);

describe('game content', () => {
  it('predictions: the answer and the reason are among the options, ids unique', () => {
    const ids = PREDICTIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PREDICTIONS) {
      expect(p.options, p.id).toContain(p.answer);
      expect(p.whyOptions, p.id).toContain(p.why);
      expect(new Set(p.options).size, p.id).toBe(p.options.length);
    }
    expect(PREDICTIONS.length).toBeGreaterThanOrEqual(PREDICT_ROUNDS);
  });

  it('cell parts: 9 parts, plant-only ones are wall, chloroplasts and vacuole, every wrong choice has a reason', () => {
    expect(CELL_PARTS).toHaveLength(9);
    expect(CELL_PARTS.filter((p) => p.where === 'plant').map((p) => p.key).sort()).toEqual(['chloroplasts', 'vacuole', 'wall']);
    for (const p of CELL_PARTS) for (const c of ['animal', 'both', 'plant'] as const) expect(cellReason(p, c).length).toBeGreaterThan(10);
  });

  it('dial targets are all reachable', () => {
    for (const t of TARGETS) expect(EYEPIECES.some((e) => OBJECTIVES.some((o) => e * o === t)), String(t)).toBe(true);
    expect(TARGETS).toContain(400);
  });
});

describe('Build a cell', () => {
  it('places every part, bounces a wrong one with a reason, and reports first tries', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onDone = vi.fn();
    render(<BuildCell seed={1} onAnswer={onAnswer} onDone={onDone} onBack={() => {}} />);
    let bounced = false;
    for (let k = 0; k < 9; k++) {
      // Place the first part in the wrong cell on purpose, then right.
      if (k === 0) {
        await user.click(screen.getByRole('button', { name: 'Animal only' }));
        expect(screen.getByText('It bounced out')).toBeInTheDocument();
        bounced = true;
        await user.click(screen.getByRole('button', { name: 'Try again' }));
      }
      const name = screen.getByText(/./, { selector: '.chip-card b' }).textContent!;
      const part = CELL_PARTS.find((p) => p.name === name)!;
      await user.click(screen.getByRole('button', { name: part.where === 'plant' ? 'Plant only' : 'Both' }));
      expect(screen.getByText('Placed!')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: k === 8 ? 'Finish' : 'Next part' }));
    }
    expect(bounced).toBe(true);
    expect(onAnswer).toHaveBeenCalledTimes(9);
    expect(onAnswer.mock.calls.filter(([, ok]) => ok)).toHaveLength(8);
    expect(onDone).toHaveBeenCalledWith(8, 9);
    expect(screen.getByText('Cells built!')).toBeInTheDocument();
    expect(screen.getByText(/\+\d+ XP/)).toBeInTheDocument();
  }, 20000);
});

describe('Magnification dials', () => {
  it('locks in when eyepiece × objective = target, and explains a miss', async () => {
    const user = userEvent.setup();
    const onAnswer = vi.fn();
    const onDone = vi.fn();
    render(<Dials seed={2} onAnswer={onAnswer} onDone={onDone} onBack={() => {}} />);
    for (let k = 0; k < 6; k++) {
      const target = Number(screen.getByText(/^\d+×$/, { selector: '.target' }).textContent!.replace('×', ''));
      const eye = EYEPIECES.find((e) => OBJECTIVES.some((o) => e * o === target))!;
      const obj = OBJECTIVES.find((o) => eye * o === target)!;
      if (k === 0) {
        // Wrong on purpose: 15 × 4 = 60 is never 400, and 5 × 4 = 20 only equals a target of 20.
        const wrongEye = target === 20 ? 15 : 5;
        await user.click(within(screen.getByRole('radiogroup', { name: 'Eyepiece' })).getByRole('radio', { name: `${wrongEye}×` }));
        await user.click(within(screen.getByRole('radiogroup', { name: 'Objective' })).getByRole('radio', { name: '4×' }));
        await user.click(screen.getByRole('button', { name: 'Lock in' }));
        expect(screen.getByText('Not yet')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Turn the dials' }));
      }
      await user.click(within(screen.getByRole('radiogroup', { name: 'Eyepiece' })).getByRole('radio', { name: `${eye}×` }));
      await user.click(within(screen.getByRole('radiogroup', { name: 'Objective' })).getByRole('radio', { name: `${obj}×` }));
      await user.click(screen.getByRole('button', { name: 'Lock in' }));
      expect(screen.getByText('Locked in!')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: k === 5 ? 'Finish' : 'Next target' }));
    }
    expect(onDone).toHaveBeenCalledWith(5, 6);
    expect(screen.getByText('Dials done!')).toBeInTheDocument();
  }, 20000);
});

describe('Predict it!', () => {
  it('predict, watch, explain, through a whole game', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onAnswer = vi.fn();
    const onDone = vi.fn();
    render(<Predict seed={3} onAnswer={onAnswer} onDone={onDone} onBack={() => {}} />);
    for (let k = 0; k < PREDICT_ROUNDS; k++) {
      const q = screen.getByText(/./, { selector: '.qtext' }).textContent!;
      const p = PREDICTIONS.find((x) => x.question === q)!;
      await user.click(screen.getByRole('button', { name: k === 0 ? p.options.find((o) => o !== p.answer)! : p.answer }));
      await user.click(screen.getByRole('button', { name: 'Predict!' }));
      expect(screen.getByText('Watch…')).toBeInTheDocument();
      await vi.advanceTimersByTimeAsync(3000);
      expect(screen.getByText(p.observed)).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: p.why }));
      await user.click(screen.getByRole('button', { name: 'Check' }));
      expect(screen.getByText('Yes, that is why.')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: k === PREDICT_ROUNDS - 1 ? 'Finish' : 'Next prediction' }));
    }
    expect(onAnswer).toHaveBeenCalledTimes(PREDICT_ROUNDS);
    expect(onDone).toHaveBeenCalledWith(PREDICT_ROUNDS - 1, PREDICT_ROUNDS);
    vi.useRealTimers();
  }, 30000);
});
