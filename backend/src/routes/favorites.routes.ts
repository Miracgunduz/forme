import { Router } from "express";
import { prisma } from "../db/client";
import { logFavoriteMeal } from "../services/calorieService";
import { MEAL_TYPES, isMealType } from "../types/mealType";

export const favoritesRouter = Router();

// Hızlı Ekleme: kullanıcının kayıtlı favori öğünlerini listeler.
favoritesRouter.get("/", async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId query param is required" });

  const favorites = await prisma.favoriteMeal.findMany({
    where: { userId },
    include: { items: { include: { food: true } } },
  });
  res.json(favorites);
});

// Yeni bir favori öğün tarifi kaydeder (örn. "Fix Shake").
favoritesRouter.post("/", async (req, res) => {
  const { userId, name, items } = req.body as {
    userId: number;
    name: string;
    items: { foodId: number; quantityGrams: number }[];
  };

  if (!userId || !name || !items?.length) {
    return res.status(400).json({ error: "userId, name, items[] are required" });
  }

  const favorite = await prisma.favoriteMeal.create({
    data: {
      userId,
      name,
      items: { create: items },
    },
    include: { items: { include: { food: true } } },
  });

  res.status(201).json(favorite);
});

// Tek tıkla ekleme: favori öğünün tüm içeriğini bugünün belirtilen
// öğün slotuna loglar.
favoritesRouter.post("/:id/log", async (req, res) => {
  const { userId, mealType, date } = req.body;
  if (!userId || !mealType) {
    return res.status(400).json({ error: "userId, mealType are required" });
  }
  if (!isMealType(mealType)) {
    return res.status(400).json({ error: `mealType must be one of ${MEAL_TYPES.join(", ")}` });
  }

  const created = await logFavoriteMeal({
    userId: Number(userId),
    favoriteMealId: Number(req.params.id),
    mealType,
    date: date ? new Date(date) : new Date(),
  });

  res.status(201).json(created);
});

// Kayıtlı bir favoriyi kaldırır (FavoriteMealItem satırları schema'daki
// onDelete: Cascade sayesinde otomatik silinir).
favoritesRouter.delete("/:id", async (req, res) => {
  await prisma.favoriteMeal.deleteMany({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
