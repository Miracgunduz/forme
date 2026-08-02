-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Food" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "caloriesPer100g" REAL NOT NULL,
    "proteinPer100g" REAL NOT NULL,
    "carbsPer100g" REAL NOT NULL,
    "fatPer100g" REAL NOT NULL,
    "fdcId" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'mock'
);
INSERT INTO "new_Food" ("caloriesPer100g", "carbsPer100g", "fatPer100g", "id", "name", "proteinPer100g") SELECT "caloriesPer100g", "carbsPer100g", "fatPer100g", "id", "name", "proteinPer100g" FROM "Food";
DROP TABLE "Food";
ALTER TABLE "new_Food" RENAME TO "Food";
CREATE UNIQUE INDEX "Food_fdcId_key" ON "Food"("fdcId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
