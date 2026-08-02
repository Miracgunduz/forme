import { useEffect, useState } from "react";
import { api } from "../api/client";
import { MEAL_TYPE_LABELS, MEAL_TYPES, type FavoriteMeal, type MealType } from "../types";

interface Props {
  userId: number;
  onLogged: () => void;
}

// Hızlı Ekleme: kayıtlı favori öğünleri listeler, tek tıkla bugüne loglar.
export function FavoriteMeals({ userId, onLogged }: Props) {
  const [favorites, setFavorites] = useState<FavoriteMeal[]>([]);
  const [mealType, setMealType] = useState<MealType>("BREAKFAST");
  const [loadingId, setLoadingId] = useState<number | null>(null);

  useEffect(() => {
    api.getFavorites(userId).then(setFavorites);
  }, [userId]);

  async function handleLog(favoriteId: number) {
    setLoadingId(favoriteId);
    try {
      await api.logFavorite(favoriteId, { userId, mealType });
      onLogged();
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(favoriteId: number) {
    await api.deleteFavorite(favoriteId);
    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  }

  if (favorites.length === 0) return null;

  return (
    <div className="rounded-lg bg-cream-card p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Hızlı Ekle</h3>
        <select
          value={mealType}
          onChange={(e) => setMealType(e.target.value as MealType)}
          className="rounded-md border border-line bg-cream px-2 py-1 text-xs focus:border-teal focus:outline-none"
        >
          {MEAL_TYPES.map((mt) => (
            <option key={mt} value={mt}>
              {MEAL_TYPE_LABELS[mt]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {favorites.map((fav) => (
          <div
            key={fav.id}
            className="group flex items-center overflow-hidden rounded-full border-[1.5px] border-teal text-sm font-bold text-teal-dark"
          >
            <button
              onClick={() => handleLog(fav.id)}
              disabled={loadingId === fav.id}
              className="px-4 py-2 transition group-hover:bg-teal group-hover:text-white disabled:opacity-50"
            >
              + {fav.name}
            </button>
            <button
              onClick={() => handleDelete(fav.id)}
              aria-label={`${fav.name} favorisini sil`}
              className="px-2.5 py-2 text-teal-dark/60 transition hover:bg-red-500 hover:text-white"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
