import { useCallback, useEffect, useState } from "react";
import { api } from "../api/client";
import { HeroSummaryCard } from "../components/HeroSummaryCard";
import { WeightLineChart } from "../components/WeightLineChart";
import { WeightLogList } from "../components/WeightLogList";
import { AddMealForm } from "../components/AddMealForm";
import { FavoriteMeals } from "../components/FavoriteMeals";
import { MEAL_TYPE_LABELS, MEAL_TYPES, type DashboardResponse } from "../types";

const DEMO_USER_ID = 1;

export function Dashboard() {
  const [data, setData] = useState<DashboardResponse | null>(null);

  const refresh = useCallback(() => {
    api.getDashboard(DEMO_USER_ID).then(setData);
  }, []);

  async function handleDeleteMealItem(id: number) {
    await api.deleteMealItem(id);
    refresh();
  }

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!data) return <div className="p-8 text-ink-faint">Yükleniyor...</div>;

  const { summary, weightLogs, streakDays, user } = data;

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-10 border-b border-line bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <span className="font-display text-xl font-semibold text-coral">forme</span>
          <span className="text-sm text-ink-faint">{summary.date}</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-6 lg:grid-cols-[1.15fr_1fr] lg:gap-8 lg:p-10">
        {/* Left column: today's celebration zone + weight trend */}
        <div className="space-y-6">
          <HeroSummaryCard
            goalCalories={summary.goalCalories}
            consumedCalories={summary.consumedCalories}
            totals={summary.totals}
            streakDays={streakDays}
            targetWeightKg={user.targetWeightKg}
          />

          <section className="rounded-lg bg-cream-card p-5 shadow-card">
            <h2 className="mb-2 font-display text-lg font-semibold">Kilo Değişimi</h2>
            <WeightLineChart weightLogs={weightLogs} />
            <WeightLogList userId={DEMO_USER_ID} weightLogs={weightLogs} onDeleted={refresh} />
          </section>

          <section className="space-y-3">
            {MEAL_TYPES.map((mt) => {
              const bucket = summary.meals[mt];
              if (bucket.items.length === 0) return null;
              return (
                <div key={mt} className="rounded-lg bg-cream-card p-5 shadow-card">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="font-display text-base font-semibold">{MEAL_TYPE_LABELS[mt]}</h3>
                    <span className="font-data text-sm font-bold tabular-nums text-coral-dark">
                      {Math.round(bucket.subtotal.calories)} kcal
                    </span>
                  </div>
                  <ul className="divide-y divide-line text-sm">
                    {bucket.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between py-2">
                        <span>
                          {item.food.name} <span className="text-ink-faint">({item.quantityGrams}g)</span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="font-data tabular-nums">{Math.round(item.calories)} kcal</span>
                          <button
                            onClick={() => handleDeleteMealItem(item.id)}
                            aria-label="Yiyeceği sil"
                            className="text-ink-faint transition hover:text-red-500"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </div>

        {/* Right column: logging actions */}
        <div className="space-y-6">
          <FavoriteMeals userId={DEMO_USER_ID} onLogged={refresh} />
          <AddMealForm userId={DEMO_USER_ID} onAdded={refresh} />
        </div>
      </div>
    </div>
  );
}
