"use client";

import { useEffect, useState } from "react";

/** Returns 0–1 pulse phase for flashing Deck.gl layers (~8 Hz). */
export function usePulseAnimation(active = true): number {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) return;

    let frame = 0;
    const interval = window.setInterval(() => {
      frame = (frame + 1) % 60;
      setPhase((Math.sin((frame / 60) * Math.PI * 2) + 1) / 2);
    }, 80);

    return () => window.clearInterval(interval);
  }, [active]);

  return phase;
}
