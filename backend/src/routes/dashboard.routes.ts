import { Router } from "express";
import { getCurrentStreak, getDailySummary } from "../services/calorieService";
import { prisma } from "../db/client";

export const dashboardRouter = Router();

// Dashboard: hedef kalori vs alınan kalori (progress bar) + kilo geçmişi (line chart) + seri (streak).
dashboardRouter.get("/", async (req, res) => {
  const userId = Number(req.query.userId);
  if (!userId) return res.status(400).json({ error: "userId query param is required" });

  const date = req.query.date ? new Date(String(req.query.date)) : new Date();

  const [summary, weightLogs, streakDays, user] = await Promise.all([
    getDailySummary(userId, date),
    prisma.weightLog.findMany({ where: { userId }, orderBy: { loggedAt: "asc" } }),
    getCurrentStreak(userId, date),
    prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { name: true, targetWeightKg: true } }),
  ]);

  res.json({ summary, weightLogs, streakDays, user });
});
