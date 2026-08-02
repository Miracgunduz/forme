import { Router } from "express";
import { addFoodToMeal } from "../services/calorieService";
import { MEAL_TYPES, isMealType } from "../types/mealType";
import { prisma } from "../db/client";

export const mealsRouter = Router();

// Günlük Kalori ve Öğün Takibi: bir yiyeceği gün içindeki bir öğün
// slotuna (sabah/öğle/akşam/ara öğün) ekler.
mealsRouter.post("/items", async (req, res) => {
  const { userId, mealType, foodId, quantityGrams, date } = req.body;

  if (!userId || !foodId || !quantityGrams || !mealType) {
    return res.status(400).json({ error: "userId, mealType, foodId, quantityGrams are required" });
  }
  if (!isMealType(mealType)) {
    return res.status(400).json({ error: `mealType must be one of ${MEAL_TYPES.join(", ")}` });
  }

  const item = await addFoodToMeal({
    userId: Number(userId),
    mealType,
    foodId: Number(foodId),
    quantityGrams: Number(quantityGrams),
    date: date ? new Date(date) : new Date(),
  });

  res.status(201).json(item);
});

// Yanlışlıkla eklenen bir yiyeceği günlük listeden kaldırır. deleteMany
// (id ile eşleşen 0 veya 1 satır) kullanılır ki id zaten yoksa hata atmasın —
// silme işlemi doğası gereği idempotent olmalı.
mealsRouter.delete("/items/:id", async (req, res) => {
  await prisma.mealItem.deleteMany({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});
