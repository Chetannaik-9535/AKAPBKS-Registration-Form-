import { useEffect, useState } from "react";

import { OFFICE_BEARERS } from "@/lib/org";
import { cn } from "@/lib/utils";

const MODES = ["coverflow", "fade-zoom", "slide"] as const;

/** Persistent auto-advancing carousel of state office-bearers (no labels). */
export function BearersCarousel() {
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % OFFICE_BEARERS.length;
        if (next === 0) setMode((m) => (m + 1) % MODES.length);
        return next;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const style = MODES[mode];

  return (
    <div className="relative mx-auto w-full max-w-4xl overflow-hidden px-2 py-6">
      <div className="relative flex h-56 items-center justify-center sm:h-72" style={{ perspective: "1200px" }}>
        {OFFICE_BEARERS.map((bearer, i) => {
          const offset = i - index;
          const wrapped =
            Math.abs(offset) > OFFICE_BEARERS.length / 2
              ? offset - Math.sign(offset) * OFFICE_BEARERS.length
              : offset;
          const active = wrapped === 0;
          const abs = Math.abs(wrapped);

          let transform = "";
          let opacity = 0;
          if (style === "coverflow") {
            transform = `translateX(${wrapped * 46}%) translateZ(${active ? 0 : -170}px) rotateY(${wrapped * -34}deg) scale(${active ? 1 : 0.82})`;
            opacity = abs > 2 ? 0 : 1 - abs * 0.28;
          } else if (style === "fade-zoom") {
            transform = `scale(${active ? 1 : 0.7})`;
            opacity = active ? 1 : 0;
          } else {
            transform = `translateX(${wrapped * 100}%)`;
            opacity = abs > 1 ? 0 : active ? 1 : 0.35;
          }

          return (
            <figure
              key={bearer.photo}
              className={cn(
                "absolute h-52 w-40 overflow-hidden rounded-xl border-4 border-gold bg-card shadow-[var(--shadow-temple)] transition-all duration-700 ease-out sm:h-68 sm:w-52",
                active ? "z-20" : "z-10",
              )}
              style={{ transform, opacity }}
            >
              <img src={bearer.photo} alt="" className="size-full object-cover object-top" />
            </figure>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {OFFICE_BEARERS.map((bearer, i) => (
          <span
            key={bearer.photo}
            className={cn(
              "size-2 rounded-full transition-colors",
              i === index ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
    </div>
  );
}
