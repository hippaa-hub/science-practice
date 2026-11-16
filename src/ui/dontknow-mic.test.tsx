import { act, cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';
import { ALL_ITEMS } from '../content';
import { checkNumber, spokenToDigits } from '../engine/check';
import { memoryStore } from '../storage/db';
import { ItemView, dontKnowOutcome } from './ItemView';

afterEach(() => {
  cleanup();
  delete (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
});

describe('"I don\'t know"', () => {
  it('every question type gives an answer to show', () => {
    for (const item of ALL_ITEMS) {
      const o = dontKnowOutcome(item, 7);
      expect(o.correct, item.id).toBe(false);
      expect(o.dontKnow, item.id).toBe(true);
      expect(o.reveal?.length, item.id).toBeGreaterThan(0);
    }
  });

  it('shows the answer kindly, counts as not yet, and the question comes back at the end', async () => {
    const store = memoryStore();
    const user = userEvent.setup();
    render(<App store={store} now={() => new Date('2026-11-18T17:00:00').getTime()} />);
    await user.click(await screen.findByRole('button', { name: "Start today's mix" }));
    const first = (document.querySelector('fieldset[data-item]') as HTMLElement).dataset.item!;
    await user.click(screen.getByRole('button', { name: "I don't know: show me" }));
    expect(screen.getByText("Let's learn it")).toBeInTheDocument();
    expect(screen.getByText(/comes back at the end/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: "I don't know: show me" })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(store.current!.progress[first]).toMatchObject({ box: 1, timesWrong: 1 });
  });
});

describe('talking instead of typing', () => {
  it('turns spoken numbers into digits', () => {
    expect(spokenToDigits('four hundred times')).toBe('400 times');
    expect(spokenToDigits('seventy five years')).toBe('75 years');
    expect(spokenToDigits('three hundred thousand')).toBe('300000');
    expect(spokenToDigits('400 x')).toBe('400 x');
    expect(checkNumber({ unit: '×', unitAccept: ['x', '×', 'times'], tolerance: 0 }, 400, 'four hundred times')).toBe('correct');
  });

  it('shows a keyboard-microphone tip when the browser cannot listen', () => {
    const item = ALL_ITEMS.find((i) => i.id === 'C3-system')!;
    render(<ItemView item={item} seed={1} onDone={() => {}} />);
    expect(screen.getByText(/tap the 🎤 on your keyboard/)).toBeInTheDocument();
  });

  it('"Say it instead" puts her words into the answer box', async () => {
    class FakeRec {
      lang = ''; continuous = false; interimResults = false;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        setTimeout(() => {
          this.onresult?.({ resultIndex: 0, results: { length: 1, 0: { isFinal: true, 0: { transcript: 'a system is a group of parts that work together' } } } });
          this.onend?.();
        }, 0);
      }
      stop() { this.onend?.(); }
      abort() {}
    }
    (window as unknown as Record<string, unknown>).webkitSpeechRecognition = FakeRec;
    const item = ALL_ITEMS.find((i) => i.id === 'C3-system')!;
    const user = userEvent.setup();
    render(<ItemView item={item} seed={1} onDone={() => {}} />);
    await user.click(screen.getByRole('button', { name: /Say it instead/ }));
    await act(async () => { await new Promise((r) => setTimeout(r, 10)); });
    expect(screen.getByRole('textbox', { name: 'Your answer' })).toHaveValue('A system is a group of parts that work together');
    expect(screen.getByRole('button', { name: 'Compare' })).toBeEnabled();
  });
});
