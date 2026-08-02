import { useMemo } from "react";

const COLORS = ["#FF6B4A", "#14B8A6", "#22C55E", "#F59E0B"];

// Lightweight celebration burst for "goal reached" moments — no external
// confetti library, just a handful of absolutely-positioned dots animated
// outward once (see .animate-confetti in index.css). Mounts only when the
// caller wants to celebrate; unmount it and the burst is gone.
export function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + Math.random() * 0.3;
        const distance = 60 + Math.random() * 60;
        return {
          id: i,
          color: COLORS[i % COLORS.length],
          tx: Math.cos(angle) * distance,
          ty: Math.sin(angle) * distance,
          rot: Math.random() * 360,
          delay: Math.random() * 120,
        };
      }),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti absolute h-2 w-2 rounded-full"
          style={
            {
              backgroundColor: p.color,
              "--tx": `${p.tx}px`,
              "--ty": `${p.ty}px`,
              "--rot": `${p.rot}deg`,
              animationDelay: `${p.delay}ms`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
