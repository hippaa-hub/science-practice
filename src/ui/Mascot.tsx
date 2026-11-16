import cheer from '../assets/lola-cheer.png';
import happy from '../assets/lola-happy.png';
import think from '../assets/lola-think.png';
import wave from '../assets/lola-wave.png';

export type Mood = 'happy' | 'think' | 'cheer' | 'wave';
const FACES: Record<Mood, string> = { happy, think, cheer, wave };

/** Lola the sphynx cat, the same guide as in the maths app. */
export function Mascot({ mood = 'happy', size = 96 }: { mood?: Mood; size?: number }) {
  return (
    <span className={`mascot ${mood}`} style={{ width: size, height: size }} aria-hidden="true">
      <img src={FACES[mood]} alt="" width={size} height={size} draggable={false} className={mood === 'cheer' ? 'pop' : ''} />
    </span>
  );
}
