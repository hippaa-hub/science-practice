import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';
import { DAY } from '../engine/boxes';
import { memoryStore } from '../storage/db';

const DAY1 = new Date('2026-11-18T17:00:00').getTime();

/** Answer whatever is on screen, deliberately wrong-ish (first options / nonsense). Returns the item id. */
async function answerOne(user: ReturnType<typeof userEvent.setup>): Promise<string> {
  const fs = document.querySelector('fieldset[data-item]') as HTMLElement;
  const id = fs.dataset.item!;
  const q = within(fs);
  const text = q.queryByRole('textbox');
  if (text && text.tagName === 'TEXTAREA') {
    await user.type(text, 'I am not sure yet');
    await user.click(q.getByRole('button', { name: 'Compare' }));
    await user.click(q.getByRole('button', { name: 'Done' }));
  } else if (text) {
    await user.type(text, '1');
    await user.click(q.getByRole('button', { name: 'Check' }));
  } else if (fs.querySelector('.match-grid')) {
    for (const b of [...fs.querySelectorAll('.pair-right')]) await user.click(b as HTMLElement);
    await user.click(q.getByRole('button', { name: 'Check' }));
  } else if (fs.querySelector('.sort-row')) {
    for (const row of [...fs.querySelectorAll('.sort-row')]) await user.click(row.querySelector('.bin') as HTMLElement);
    await user.click(q.getByRole('button', { name: 'Check' }));
  } else {
    await user.click(fs.querySelector('.choice') as HTMLElement);
    await user.click(q.getByRole('button', { name: 'Check' }));
  }
  await user.click(await screen.findByRole('button', { name: 'Continue' }));
  return id;
}

afterEach(cleanup);

describe('Daily Mix, end to end', () => {
  it('runs a full mix, saves progress, and brings wrong items back the next day', async () => {
    const store = memoryStore();
    const user = userEvent.setup();
    const { unmount } = render(<App store={store} now={() => DAY1} />);
    await user.click(await screen.findByRole('button', { name: "Start today's mix" }));

    const seen: string[] = [];
    for (let n = 0; n < 40 && !screen.queryByText('Mix done!'); n++) seen.push(await answerOne(user));
    expect(screen.getByText('Mix done!')).toBeInTheDocument();
    expect(new Set(seen).size).toBe(10);

    const saved = store.current!;
    expect(saved.days).toEqual(['2026-11-18']);
    expect(Object.keys(saved.progress)).toHaveLength(10);
    const wrong = Object.entries(saved.progress).filter(([, p]) => p.box === 1 && p.timesWrong === 1).map(([id]) => id);
    expect(wrong.length).toBeGreaterThan(0);
    // Every wrong item was shown a second time in the same mix.
    for (const id of wrong) expect(seen.filter((s) => s === id).length).toBe(2);
    unmount();

    // Close and reopen the next day: the wrong items come back.
    render(<App store={store} now={() => DAY1 + DAY} />);
    await screen.findByRole('button', { name: "Start today's mix" });
    expect(document.querySelector('.stat b')!.textContent).toBe('1');
    await user.click(await screen.findByRole('button', { name: "Start today's mix" }));
    const next: string[] = [];
    for (let n = 0; n < 40 && !screen.queryByText('Mix done!'); n++) next.push(await answerOne(user));
    // 5 or 6 due reviews per mix (the rest wait for the next day).
    expect(wrong.filter((id) => next.includes(id)).length).toBeGreaterThanOrEqual(Math.min(5, wrong.length));
  }, 30000);

  it('asks for the unit instead of marking a right number wrong', async () => {
    const store = memoryStore();
    const user = userEvent.setup();
    render(<App store={store} now={() => DAY1} />);
    await act(async () => {});
    await user.click(await screen.findByRole('button', { name: "Start today's mix" }));
    // Walk until a magnification number question appears.
    for (let n = 0; n < 40 && !screen.queryByText('Mix done!'); n++) {
      const fs = document.querySelector('fieldset[data-item]') as HTMLElement;
      const p = fs.querySelector('.qtext')!.textContent ?? '';
      const m = p.match(/eyepiece is 10× and the objective is (\d+)×/);
      if (m) {
        await user.type(within(fs).getByRole('textbox'), String(10 * Number(m[1])));
        await user.click(within(fs).getByRole('button', { name: 'Check' }));
        expect(screen.getByText(/Now add the unit/)).toBeInTheDocument();
        await user.type(within(fs).getByRole('textbox'), 'x');
        await user.click(within(fs).getByRole('button', { name: 'Check' }));
        expect(await screen.findByText('Yes! Correct.')).toBeInTheDocument();
        return;
      }
      await answerOne(user);
    }
  }, 30000);
});
