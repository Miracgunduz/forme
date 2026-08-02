import { Router } from "express";
import { prisma } from "../db/client";

export const usersRouter = Router();

// Kullanıcı Hedef Modülü: ilk giriş kilosu + hedef kilo kaydı.
usersRouter.post("/", async (req, res) => {
  const { email, name, startWeightKg, targetWeightKg, dailyCalorieGoal } = req.body;

  if (!email || !name || !startWeightKg || !targetWeightKg) {
    return res.status(400).json({ error: "email, name, startWeightKg, targetWeightKg are required" });
  }

  const user = await prisma.user.create({
    data: {
      email,
      name,
      startWeightKg,
      targetWeightKg,
      dailyCalorieGoal: dailyCalorieGoal ?? 2500,
      weightLogs: { create: { weightKg: startWeightKg } },
    },
  });

  res.status(201).json(user);
});

usersRouter.get("/:id", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: Number(req.params.id) } });
  if (!user) return res.status(404).json({ error: "not found" });
  res.json(user);
});

// New weigh-in point, feeds the weight-over-time line chart.
usersRouter.post("/:id/weight-logs", async (req, res) => {
  const { weightKg } = req.body;
  if (typeof weightKg !== "number") {
    return res.status(400).json({ error: "weightKg (number) is required" });
  }

  const log = await prisma.weightLog.create({
    data: { userId: Number(req.params.id), weightKg },
  });
  res.status(201).json(log);
});

usersRouter.get("/:id/weight-logs", async (req, res) => {
  const logs = await prisma.weightLog.findMany({
    where: { userId: Number(req.params.id) },
    orderBy: { loggedAt: "asc" },
  });
  res.json(logs);
});

// Yanlışlıkla eklenen bir kilo ölçümünü geçmişten kaldırır.
usersRouter.delete("/:id/weight-logs/:logId", async (req, res) => {
  await prisma.weightLog.deleteMany({
    where: { id: Number(req.params.logId), userId: Number(req.params.id) },
  });
  res.status(204).end();
});
