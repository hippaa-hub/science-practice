import { useEffect, useRef, useState } from 'react';
import cheer from '../assets/adele-cheer.webp';
import happy from '../assets/adele-happy.webp';
import think from '../assets/adele-think.webp';
import wave from '../assets/adele-wave.webp';

export type Mood = 'happy' | 'think' | 'cheer' | 'wave';
const FACES: Record<Mood, string> = { happy, think, cheer, wave };

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Adele's own avatar, made from her character picture (cut out with BiRefNet; moods with gpt-image-2.5 low).
 * `animate` plays the short waving clip (LTX Video) once, then rests on its last frame; tap to play again.
 */
export function Mascot({ mood = 'happy', size = 96, animate = false }: { mood?: Mood; size?: number; animate?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [useVideo, setUseVideo] = useState(animate && !reducedMotion());
  useEffect(() => { setUseVideo(animate && !reducedMotion()); }, [animate]);

  const replay = () => {
    const v = video.current;
    if (!v) return;
    v.currentTime = 0;
    void v.play().catch(() => {});
  };

  return (
    <span className={`mascot avatar ${mood}`} style={{ width: size, height: size }} aria-hidden="true">
      {useVideo ? (
        <video ref={video} src="./avatar/wave.mp4" poster="./avatar/wave-poster.webp" autoPlay muted playsInline
          preload="auto" width={size} height={size} onClick={replay} onError={() => setUseVideo(false)} />
      ) : (
        <img src={FACES[mood]} alt="" width={size} height={size} draggable={false} className={mood === 'cheer' ? 'pop' : ''} />
      )}
    </span>
  );
}
