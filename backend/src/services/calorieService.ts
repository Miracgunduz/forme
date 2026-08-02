import { prisma } from "../db/client";
import { MealType } from "../types/mealType";

export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Nutrition DB entries are stored per 100g; this scales them to the amount
// actually eaten. Kept pure/exported so it can be unit-tested in isolation.
export function calculateMacros(
  food: { caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number },
  quantityGrams: number
): Macros {
  const ratio = quantityGrams / 100;
  return {
    calories: round1(food.caloriesPer100g * ratio),
    protein: round1(food.proteinPer100g * ratio),
    carbs: round1(food.carbsPer100g * ratio),
    fat: round1(food.fatPer100g * ratio),
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Meals are grouped by calendar day; this strips the time component so
// "2026-08-01T14:32" and "2026-08-01T09:00" land in the same Meal row.
export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Finds (or creates) the Meal slot for a user/day/mealType, then logs one
// food item into it with its macros snapshotted at today's nutrition values.
// This is the backbone write-path: every "add food" and "add favorite" call
// in the app funnels through here.
export async function addFoodToMeal(params: {
  userId: number;
  date: Date;
  mealType: MealType;
  foodId: number;
  quantityGrams: number;
}) {
  const { userId, date, mealType, foodId, quantityGrams } = params;
  const day = startOfDay(date);

  const food = await prisma.food.findUniqueOrThrow({ where: { id: foodId } });
  const macros = calculateMacros(food, quantityGrams);

  const meal = await prisma.meal.upsert({
    where: { userId_date_mealType: { userId, date: day, mealType } },
    update: {},
    create: { userId, date: day, mealType },
  });

  return prisma.mealItem.create({
    data: {
      mealId: meal.id,
      foodId,
      quantityGrams,
      ...macros,
    },
    include: { food: true },
  });
}

// One-tap "Favorites" flow: replays every item of a saved favorite combo
// into today's meal slot via addFoodToMeal, so it goes through the same
// macro-snapshot logic as a manually logged food.
export async function logFavoriteMeal(params: {
  userId: number;
  favoriteMealId: number;
  date: Date;
  mealType: MealType;
}) {
  const favorite = await prisma.favoriteMeal.findUniqueOrThrow({
    where: { id: params.favoriteMealId },
    include: { items: true },
  });

  const created = [];
  for (const item of favorite.items) {
    created.push(
      await addFoodToMeal({
        userId: params.userId,
        date: params.date,
        mealType: params.mealType,
        foodId: item.foodId,
        quantityGrams: item.quantityGrams,
      })
    );
  }
  return created;
}

// Real (not decorative) streak count: consecutive days with at least one
// logged meal, ending today. If today has nothing logged yet, count from
// yesterday instead — otherwise every streak would show 0 first thing in
// the morning before breakfast is logged, which reads as a bug, not a UI
// choice. Backs the "🔥 N-day streak" badge in the dashboard.
export async function getCurrentStreak(userId: number, referenceDate: Date = new Date()): Promise<number> {
  const meals = await prisma.meal.findMany({
    where: { userId },
    select: { date: true },
    distinct: ["date"],
  });
  const loggedDays = new Set(meals.map((m) => startOfDay(m.date).getTime()));

  const cursor = startOfDay(referenceDate);
  if (!loggedDays.has(cursor.getTime())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (loggedDays.has(cursor.getTime())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface DailySummary {
  date: string;
  goalCalories: number;
  consumedCalories: number;
  remainingCalories: number;
  totals: Macros;
  meals: Record<MealType, { items: unknown[]; subtotal: Macros }>;
}

// Powers the Dashboard: totals for the progress bar plus a per-mealType
// breakdown, all computed from the macro snapshots (no re-lookup of Food).
export async function getDailySummary(userId: number, date: Date): Promise<DailySummary> {
  const day = startOfDay(date);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const meals = await prisma.meal.findMany({
    where: { userId, date: day },
    include: { items: { include: { food: true } } },
  });

  const emptyMacros = (): Macros => ({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const byType: DailySummary["meals"] = {
    BREAKFAST: { items: [], subtotal: emptyMacros() },
    LUNCH: { items: [], subtotal: emptyMacros() },
    DINNER: { items: [], subtotal: emptyMacros() },
    SNACK: { items: [], subtotal: emptyMacros() },
  };

  const totals = emptyMacros();
  for (const meal of meals) {
    for (const item of meal.items) {
      const bucket = byType[meal.mealType as MealType];
      bucket.items.push(item);
      bucket.subtotal.calories += item.calories;
      bucket.subtotal.protein += item.protein;
      bucket.subtotal.carbs += item.carbs;
      bucket.subtotal.fat += item.fat;

      totals.calories += item.calories;
      totals.protein += item.protein;
      totals.carbs += item.carbs;
      totals.fat += item.fat;
    }
  }

  return {
    date: day.toISOString().slice(0, 10),
    goalCalories: user.dailyCalorieGoal,
    consumedCalories: round1(totals.calories),
    remainingCalories: round1(user.dailyCalorieGoal - totals.calories),
    totals: {
      calories: round1(totals.calories),
      protein: round1(totals.protein),
      carbs: round1(totals.carbs),
      fat: round1(totals.fat),
    },
    meals: byType,
  };
}
