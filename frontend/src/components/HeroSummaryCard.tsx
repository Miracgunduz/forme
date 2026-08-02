import { useEffect, useRef, useState } from "react";
import { useCountUp } from "../hooks/useCountUp";
import { Confetti } from "./Confetti";
import type { Macros } from "../types";

interface Props {
  goalCalories: number;
  consumedCalories: number;
  totals: Macros;
  streakDays: number;
  targetWeightKg?: number;
}

// The "celebration zone" from DESIGN.md: calorie ring + streak badge +
// macro row, all in the coral hero card. Replaces the plain progress bar —
// this is where the app's gamified identity actually lives.
export function HeroSummaryCard({ goalCalories, consumedCalories, totals, streakDays, targetWeightKg }: Props) {
  const pct = Math.min(100, Math.round((consumedCalories / goalCalories) * 100));
  const animatedCalories = useCountUp(consumedCalories);
  const remaining = Math.round(goalCalories - consumedCalories);

  const [showConfetti, setShowConfetti] = useState(false);
  const prevPctRef = useRef(pct);
  useEffect(() => {
    if (prevPctRef.current < 100 && pct >= 100) {
      setShowConfetti(true);
      const t = setTimeout(() => setShowConfetti(false), 1000);
      return () => clearTimeout(t);
    }
    prevPctRef.current = pct;
  }, [pct]);

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-coral to-coral-dark p-7 text-white shadow-lift">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10" aria-hidden />
      {showConfetti && <Confetti />}

      <div className="flex items-start justify-between">
        <p className="text-sm text-white/85">Bugün</p>
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-sm font-bold">
            <span className="animate-flame inline-block">🔥</span>
            {streakDays} günlük seri
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-5">
        <div
          className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(white 0% ${pct}%, rgba(255,255,255,0.25) ${pct}% 100%)` }}
        >
          <div className="flex h-[84px] w-[84px] flex-col items-center justify-center rounded-full bg-coral">
            <span className="font-display text-2xl font-semibold leading-none">{Math.round(animatedCalories)}</span>
            <span className="mt-1 text-[10px] text-white/85">/ {goalCalories} kcal</span>
          </div>
        </div>

        <div>
          <p className="text-sm text-white/85">{remaining >= 0 ? "Kalan" : "Hedefi aştın"}</p>
          <p className="font-display text-xl font-semibold">{Math.abs(remaining)} kcal</p>
          {targetWeightKg != null && (
            <>
              <p className="mt-2 text-sm text-white/85">Hedef Kilo</p>
              <p className="font-display text-xl font-semibold">{targetWeightKg} kg</p>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <MacroStat label="Protein" value={totals.protein} accentClass="text-teal-dark" />
        <MacroStat label="Karb." value={totals.carbs} accentClass="text-coral-dark" />
        <MacroStat label="Yağ" value={totals.fat} accentClass="text-amber-700" />
      </div>
    </div>
  );
}

function MacroStat({ label, value, accentClass }: { label: string; value: number; accentClass: string }) {
  return (
    <div className="rounded-md bg-cream/95 px-3 py-3 text-center">
      <div className={`font-data text-xl font-bold tabular-nums ${accentClass}`}>{Math.round(value)}g</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-faint">{label}</div>
    </div>
  );
}
