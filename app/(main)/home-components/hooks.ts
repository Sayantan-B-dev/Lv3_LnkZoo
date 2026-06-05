'use client';

import { useState, useEffect, useRef } from 'react';

export function useScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handler = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return progress;
}

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const rng = seededRand(42);
export const RANDOM_OFFSETS = Array.from({ length: 20 }, () => ({
  x: (rng() - 0.5) * 40,
  y: 20 + rng() * 40,
  dur: 0.5 + rng() * 0.6,
  del: rng() * 0.3,
  dir: (['translateY', 'translateX', 'scale'] as const)[Math.floor(rng() * 3)] as 'translateY' | 'translateX' | 'scale',
}));

export function useScrollReveal(index: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [exiting, setExiting] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          setExiting(false);
        } else if (revealed) {
          setExiting(true);
        }
      },
      { threshold: [0, 0.12, 0.3] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [revealed]);
  const off = RANDOM_OFFSETS[index % RANDOM_OFFSETS.length];
  return { ref, revealed, exiting, offset: off };
}

export function useCountUp(target: number, start: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();
    const duration = 1500;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setCount(Math.floor(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target]);
  return count;
}

let _revealCounter = 0;
export function getNextRevealIndex() {
  return _revealCounter++;
}
