import { Router } from "express";
import { prisma } from "../db/client";
import { searchFoods } from "../services/foodSearchService";
import type { NutritionSource } from "../types/nutrition";

export const foodsRouter = Router();

// Locally cached foods (bundled mock set + anything already imported from
// USDA/Open Food Facts for a previous meal). This is what the "Favorites"
// builder and any quick local list draw from — no external call.
foodsRouter.get("/", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : undefined;
  const foods = await prisma.food.findMany({
    where: q ? { name: { contains: q } } : undefined,
    orderBy: { name: "asc" },
  });
  res.json(foods);
});

// Free-text search across USDA FoodData Central (raw/generic foods) and
// Open Food Facts (branded/packaged products, including Turkish market
// snacks USDA doesn't cover) — lets a user look up ANY food, not just the
// bundled mock list. Results are not persisted here; the client calls
// /import for whichever one it picks.
foodsRouter.get("/search", async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q : "";
  if (!q.trim()) return res.status(400).json({ error: "q query param is required" });

  try {
    const results = await searchFoods(q);
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: err instanceof Error ? err.message : "Food lookup failed" });
  }
});

// Imports one search result (USDA or Open Food Facts) into the local Food
// table so it gets a stable local id that MealItem/FavoriteMealItem can
// reference, exactly like the bundled mock foods. Idempotent per source:
// re-importing the same fdcId/barcode returns the existing row.
foodsRouter.post("/import", async (req, res) => {
  const { source, externalId, name, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g } = req.body as {
    source: NutritionSource;
    externalId: string;
    name: string;
    caloriesPer100g: number;
    proteinPer100g?: number;
    carbsPer100g?: number;
    fatPer100g?: number;
  };

  if (!source || !externalId || !name || caloriesPer100g == null) {
    return res.status(400).json({ error: "source, externalId, name, caloriesPer100g are required" });
  }
  if (source !== "usda" && source !== "off") {
    return res.status(400).json({ error: "source must be 'usda' or 'off'" });
  }

  const data = {
    name,
    caloriesPer100g,
    proteinPer100g: proteinPer100g ?? 0,
    carbsPer100g: carbsPer100g ?? 0,
    fatPer100g: fatPer100g ?? 0,
    source,
  };

  const food =
    source === "usda"
      ? await prisma.food.upsert({
          where: { fdcId: Number(externalId) },
          update: {},
          create: { ...data, fdcId: Number(externalId) },
        })
      : await prisma.food.upsert({
          where: { barcode: externalId },
          update: {},
          create: { ...data, barcode: externalId },
        });

  res.status(201).json(food);
});
