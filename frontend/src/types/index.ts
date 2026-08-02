export const MEAL_TYPES = ["BREAKFAST", "LUNCH", "DINNER", "SNACK"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: "Sabah",
  LUNCH: "Öğle",
  DINNER: "Akşam",
  SNACK: "Ara Öğün",
};

export interface Food {
  id: number;
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

// A live USDA/Open Food Facts search hit — not yet in our local Food table
// (no `id` until /api/foods/import is called with source+externalId).
export type NutritionSource = "usda" | "off";

export interface NutritionSearchResult {
  source: NutritionSource;
  externalId: string;
  name: string;
  dataType: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealItem extends Macros {
  id: number;
  mealId: number;
  foodId: number;
  quantityGrams: number;
  food: Food;
}

export interface DailySummary {
  date: string;
  goalCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  totals: Macros;
  meals: Record<MealType, { items: MealItem[]; subtotal: Macros }>;
}

export interface WeightLog {
  id: number;
  userId: number;
  weightKg: number;
  loggedAt: string;
}

export interface DashboardResponse {
  summary: DailySummary;
  weightLogs: WeightLog[];
  streakDays: number;
  user: { name: string; targetWeightKg: number };
}

export interface FavoriteMealItem {
  id: number;
  favoriteMealId: number;
  foodId: number;
  quantityGrams: number;
  food: Food;
}

export interface FavoriteMeal {
  id: number;
  userId: number;
  name: string;
  items: FavoriteMealItem[];
}
