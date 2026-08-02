import { PrismaClient } from "@prisma/client";
import foods from "../src/data/foods.json";

const prisma = new PrismaClient();

async function main() {
  for (const food of foods) {
    await prisma.food.upsert({
      where: { id: foods.indexOf(food) + 1 },
      update: {},
      create: food,
    });
  }

  const user = await prisma.user.upsert({
    where: { email: "demo@forme.app" },
    update: {},
    create: {
      email: "demo@forme.app",
      name: "Demo User",
      startWeightKg: 95,
      targetWeightKg: 80,
      dailyCalorieGoal: 2500,
    },
  });

  // Seed a few weight log points so the dashboard chart has something to draw.
  const today = new Date();
  const weighIns = [95, 94.4, 93.8, 93.1, 92.6];
  for (let i = 0; i < weighIns.length; i++) {
    const loggedAt = new Date(today);
    loggedAt.setDate(today.getDate() - (weighIns.length - 1 - i) * 7);
    await prisma.weightLog.create({
      data: { userId: user.id, weightKg: weighIns[i], loggedAt },
    });
  }

  // "Fix Shake" favorite: oats + milk + peanut butter + banana + walnuts.
  const byName = (name: string) =>
    prisma.food.findFirstOrThrow({ where: { name } });

  const [oats, milk, peanutButter, banana, walnuts] = await Promise.all([
    byName("Yulaf Ezmesi (Oats)"),
    byName("Tam Yağlı Süt"),
    byName("Fıstık Ezmesi (Peanut Butter)"),
    byName("Muz"),
    byName("Ceviz"),
  ]);

  const existingFavorite = await prisma.favoriteMeal.findFirst({
    where: { userId: user.id, name: "Fix Shake" },
  });

  if (!existingFavorite) {
    await prisma.favoriteMeal.create({
      data: {
        userId: user.id,
        name: "Fix Shake",
        items: {
          create: [
            { foodId: oats.id, quantityGrams: 80 },
            { foodId: milk.id, quantityGrams: 300 },
            { foodId: peanutButter.id, quantityGrams: 30 },
            { foodId: banana.id, quantityGrams: 120 },
            { foodId: walnuts.id, quantityGrams: 20 },
          ],
        },
      },
    });
  }

  console.log(`Seeded ${foods.length} foods, demo user #${user.id}, weight history, and "Fix Shake" favorite.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
