import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';
import { DAY } from '../engine/boxes';
import { emptySaved, memoryStore } from '../storage/db';

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
  } else if (fs.querySelector('.chips')) {
    for (const b of [...fs.querySelectorAll('.chip-btn')]) await user.click(b as HTMLElement);
    await user.click(q.getByRole('button', { name: 'Check' }));
  } else if (fs.querySelector('.match-grid')) {
    for (const b of [...fs.querySelectorAll('.pair-right')]) await user.click(b as HTMLElement);
    await user.click(q.getByRole('button', { name: 'Check' }));
  } else if (fs.querySelector('.tray')) {
    // Drag sort: tap a chip, then tap the first zone, until the tray is empty.
    for (let n = 0; n < 12; n++) {
      const chip = fs.querySelector('.drag-chip') as HTMLElement | null;
      if (!chip) break;
      await user.click(chip);
      await user.click(fs.querySelector('[data-zone]') as HTMLElement);
    }
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

describe('Phase 2 screens', () => {
  it('Topics → Learn cards → check questions, saved to progress', async () => {
    const store = memoryStore();
    const user = userEvent.setup();
    render(<App store={store} now={() => DAY1} />);
    await user.click(await screen.findByRole('button', { name: /Topics/ }));
    await user.click(screen.getByRole('button', { name: /Cells and stem cells/ }));
    await user.click(screen.getByRole('button', { name: 'Learn' }));
    for (let k = 0; k < 10 && !screen.queryByRole('button', { name: 'Check yourself' }); k++) {
      expect(document.querySelector('.pic svg, .photo img')).not.toBeNull();
      await user.click(screen.getByRole('button', { name: 'Next' }));
    }
    await user.click(screen.getByRole('button', { name: 'Check yourself' }));
    for (let n = 0; n < 10 && !screen.queryByText('Check done!'); n++) await answerOne(user);
    expect(screen.getByText('Check done!')).toBeInTheDocument();
    expect(Object.keys(store.current!.progress).every((id) => id.startsWith('C1-'))).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Back to Cells and stem cells' }));
    expect(screen.getByRole('button', { name: 'Practise this topic' })).toBeInTheDocument();
  }, 30000);

  it('spelling: a misspelt word from a mix comes first and leaves the list when spelled right', async () => {
    const store = memoryStore({ ...emptySaved(), spelling: ['mitochondria'] });
    const user = userEvent.setup();
    render(<App store={store} now={() => DAY1} />);
    await user.click(await screen.findByRole('button', { name: /Words/ }));
    expect(screen.getByText(/to practise: mitochondria/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Start spelling' }));
    expect(screen.getByText('Where respiration happens and energy is released')).toBeInTheDocument();
    await user.type(screen.getByRole('textbox', { name: 'Your spelling' }), 'mitocondria');
    await user.click(screen.getByRole('button', { name: 'Check' }));
    expect(screen.getByText('Almost!')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(store.current!.spelling).toEqual(['mitochondria']);
    // Answer the rest; mitochondria comes back once at the end.
    for (let n = 0; n < 20 && !screen.queryByText('Spelling done!'); n++) {
      const meaning = document.querySelector('.qtext')!.textContent!;
      const isMito = meaning.startsWith('Where respiration');
      await user.type(screen.getByRole('textbox', { name: 'Your spelling' }), isMito ? 'mitochondria' : 'zz');
      await user.click(screen.getByRole('button', { name: 'Check' }));
      await user.click(screen.getByRole('button', { name: 'Continue' }));
    }
    expect(screen.getByText('Spelling done!')).toBeInTheDocument();
    expect(store.current!.spelling).not.toContain('mitochondria');
    expect(store.current!.progress['word:mitochondria'].box).toBe(1);
  }, 30000);
});

describe('motivation on screen', () => {
  it('a finished mix shows XP, the avatar, the first-mix badge, and Home shows level and things I can do', async () => {
    const store = memoryStore();
    const user = userEvent.setup();
    render(<App store={store} now={() => DAY1} />);
    expect(await screen.findByText(/things you can do/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Level 1/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: "Start today's mix" }));
    for (let n = 0; n < 40 && !screen.queryByText('Mix done!'); n++) await answerOne(user);
    expect(screen.getByText(/\+\d+ XP/)).toBeInTheDocument();
    expect(screen.getByText('First mix')).toBeInTheDocument();
    expect(store.current!.log.length).toBeGreaterThanOrEqual(10);
    await user.click(screen.getByRole('button', { name: 'Back home' }));
    await user.click(screen.getByRole('button', { name: /things you can do/ }));
    expect(screen.getByRole('heading', { name: 'My progress' })).toBeInTheDocument();
    expect(screen.getByText('I can explain Type 1 diabetes')).toBeInTheDocument();
  }, 30000);
});
