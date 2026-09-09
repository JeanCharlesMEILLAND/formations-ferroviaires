"use client";

import { useEffect, useRef, useState } from "react";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Vrai au-dessus du point de rupture `lg` de Tailwind (1024 px). */
export function useDesktop(): boolean {
  const [desktop, setDesktop] = useState(() => (typeof window === "undefined" ? true : window.matchMedia("(min-width: 1024px)").matches));
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const on = () => setDesktop(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desktop;
}

/** Fait « rouler » un nombre vers sa nouvelle valeur (compteur de résultats). */
export function useCountUp(target: number, duration = 650): number {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target) return;
    if (reducedMotion()) { from.current = target; setValue(target); return; }
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(start + (target - start) * eased);
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = target; };
  }, [target, duration]);
  return value;
}

/** Tape puis efface les suggestions l'une après l'autre, tant que `active` est vrai. */
export function useTypewriter(words: string[], active: boolean): string {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!active || words.length === 0) { setText(""); return; }
    if (reducedMotion()) { setText(words[0]); return; }
    let i = 0, pos = 0, deleting = false, timer = 0;
    const step = () => {
      const w = words[i];
      if (!deleting) {
        pos += 1;
        setText(w.slice(0, pos));
        if (pos >= w.length) { deleting = true; timer = window.setTimeout(step, 1900); return; }
        timer = window.setTimeout(step, 42 + Math.random() * 45);
      } else {
        pos -= 1;
        setText(w.slice(0, pos));
        if (pos <= 0) { deleting = false; i = (i + 1) % words.length; timer = window.setTimeout(step, 420); return; }
        timer = window.setTimeout(step, 20);
      }
    };
    timer = window.setTimeout(step, 600);
    return () => window.clearTimeout(timer);
  }, [words, active]);
  return text;
}
