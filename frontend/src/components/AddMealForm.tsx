import { useEffect, useRef, useState } from "react";
import { api } from "../api/client";
import { MEAL_TYPE_LABELS, MEAL_TYPES, type MealType, type NutritionSearchResult } from "../types";

interface Props {
  userId: number;
  onAdded: () => void;
}

const DATA_TYPE_LABELS: Record<string, string> = {
  Foundation: "USDA · Doğal",
  "SR Legacy": "USDA · Doğal",
  "Open Food Facts": "Market Ürünü",
};

// Serbest metinle yiyecek arama: kullanıcı ne yazarsa yazsın (meyve, sebze,
// Türkiye'de satılan paketli/market ürünü, İngilizce ya da Türkçe) USDA
// FoodData Central + Open Food Facts'ta arar.
export function AddMealForm({ userId, onAdded }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NutritionSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<NutritionSearchResult | null>(null);
  const [quantityGrams, setQuantityGrams] = useState(100);
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [submitting, setSubmitting] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (selected) return; // don't re-search once a result is picked
    if (query.trim().length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const hits = await api.searchNutrition(query);
        setResults(hits);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Arama başarısız oldu");
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [query, selected]);

  function pickResult(result: NutritionSearchResult) {
    setSelected(result);
    setQuery(result.name);
    setResults([]);
  }

  function clearSelection() {
    setSelected(null);
    setQuery("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      const food = await api.importFood(selected);
      await api.addMealItem({ userId, mealType, foodId: food.id, quantityGrams });
      clearSelection();
      setQuantityGrams(100);
      onAdded();
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Eklenemedi");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-cream-card p-5 shadow-card">
      <p className="font-display text-lg font-semibold">Öğüne Ekle</p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col">
          <label className="text-xs font-medium text-ink-faint">Öğün</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value as MealType)}
            className="rounded-md border border-line bg-cream px-3 py-2 text-sm focus:border-teal focus:outline-none"
          >
            {MEAL_TYPES.map((mt) => (
              <option key={mt} value={mt}>
                {MEAL_TYPE_LABELS[mt]}
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex flex-1 min-w-[12rem] flex-col">
          <label className="text-xs font-medium text-ink-faint">Yiyecek ara (herhangi bir şey yazabilirsin)</label>
          <div className="flex items-center gap-2 rounded-full border border-line bg-cream px-4 py-2 focus-within:border-teal">
            <span aria-hidden>🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelected(null);
              }}
              placeholder="örn. elma, tavuk göğsü, Torku Banada..."
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-ink-faint"
            />
          </div>
          {(results.length > 0 || searching) && !selected && (
            <ul className="absolute top-full z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-line bg-cream-card shadow-lift">
              {searching && <li className="px-3 py-2 text-sm text-ink-faint">Aranıyor...</li>}
              {results.map((r) => (
                <li key={`${r.source}-${r.externalId}`}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-cream"
                  >
                    <span className="truncate">{r.name}</span>
                    <span className="shrink-0 font-data text-xs tabular-nums text-ink-faint">
                      {Math.round(r.caloriesPer100g)} kcal/100g · {DATA_TYPE_LABELS[r.dataType] ?? r.dataType}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col w-24">
          <label className="text-xs font-medium text-ink-faint">Miktar (g)</label>
          <input
            type="number"
            min={1}
            value={quantityGrams}
            onChange={(e) => setQuantityGrams(Number(e.target.value))}
            className="rounded-md border border-line bg-cream px-3 py-2 text-sm focus:border-teal focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={!selected || submitting}
          className="rounded-full bg-coral px-5 py-2 text-sm font-bold text-white shadow-card transition hover:bg-coral-dark disabled:opacity-40"
        >
          Ekle
        </button>
      </div>

      {selected && (
        <p className="text-xs text-ink-soft">
          Seçili: <span className="font-semibold text-ink">{selected.name}</span> ·{" "}
          <span className="font-data tabular-nums">{Math.round((selected.caloriesPer100g * quantityGrams) / 100)} kcal</span> ({quantityGrams}g için) ·{" "}
          <button type="button" onClick={clearSelection} className="underline">
            değiştir
          </button>
        </p>
      )}
      {searchError && <p className="text-xs font-medium text-red-600">{searchError}</p>}
    </form>
  );
}
