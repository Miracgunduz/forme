import type { DashboardResponse, FavoriteMeal, Food, MealType, NutritionSearchResult, WeightLog } from "../types";

const BASE_URL = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  getDashboard: (userId: number, date?: string) =>
    request<DashboardResponse>(`/dashboard?userId=${userId}${date ? `&date=${date}` : ""}`),

  getFoods: (query?: string) => request<Food[]>(`/foods${query ? `?q=${encodeURIComponent(query)}` : ""}`),

  // Live USDA lookup — works for any food, not just the bundled mock list.
  searchNutrition: (query: string) => request<NutritionSearchResult[]>(`/foods/search?q=${encodeURIComponent(query)}`),

  // Persists a picked USDA result into our local Food table so it gets a
  // stable id usable by addMealItem. Idempotent: re-importing the same
  // fdcId returns the existing row instead of duplicating it.
  importFood: (result: NutritionSearchResult) =>
    request<Food>(`/foods/import`, { method: "POST", body: JSON.stringify(result) }),

  addMealItem: (params: { userId: number; mealType: MealType; foodId: number; quantityGrams: number }) =>
    request(`/meals/items`, { method: "POST", body: JSON.stringify(params) }),

  deleteMealItem: (id: number) => request<void>(`/meals/items/${id}`, { method: "DELETE" }),

  getFavorites: (userId: number) => request<FavoriteMeal[]>(`/favorites?userId=${userId}`),

  logFavorite: (favoriteId: number, params: { userId: number; mealType: MealType }) =>
    request(`/favorites/${favoriteId}/log`, { method: "POST", body: JSON.stringify(params) }),

  deleteFavorite: (id: number) => request<void>(`/favorites/${id}`, { method: "DELETE" }),

  addWeightLog: (userId: number, weightKg: number) =>
    request<WeightLog>(`/users/${userId}/weight-logs`, { method: "POST", body: JSON.stringify({ weightKg }) }),

  deleteWeightLog: (userId: number, logId: number) =>
    request<void>(`/users/${userId}/weight-logs/${logId}`, { method: "DELETE" }),
};
