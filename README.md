# forme

A full-stack daily meal and calorie/macro tracker for users working toward a weight goal.

The visual identity was built with `/design-consultation` — see **[DESIGN.md](./DESIGN.md)** for details and rationale (coral + teal palette, Fredoka/Plus Jakarta Sans/DM Sans typography, streak + confetti micro-interactions).

## Folder Structure

```
forme/
├── backend/                     Node.js + Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma        Database schema (SQLite)
│   │   └── seed.ts              Mock food data + demo user + "Fix Shake" favorite
│   └── src/
│       ├── data/foods.json              Bundled starter foods (seed data, "Fix Shake", etc.)
│       ├── data/tr-en-food-terms.json   Turkish→English food term dictionary (for USDA search)
│       ├── db/client.ts                 Shared Prisma client
│       ├── types/mealType.ts            MealType union + validation (SQLite has no native enum)
│       ├── services/
│       │   ├── calorieService.ts        ⟵ The backbone: calorie/macro calculation, logging meals, daily summary
│       │   ├── nutritionApiService.ts   USDA FoodData Central (raw/generic foods) + Turkish translation
│       │   ├── openFoodFactsService.ts  Open Food Facts (branded/packaged products, Turkey included)
│       │   └── foodSearchService.ts     Merges both sources into one ranked search result
│       ├── routes/
│       │   ├── users.routes.ts      User goal setup + weight history
│       │   ├── foods.routes.ts      Local food cache + combined search/import
│       │   ├── meals.routes.ts      Add/remove a food item on a meal
│       │   ├── favorites.routes.ts  Create/remove a favorite meal, one-tap logging
│       │   └── dashboard.routes.ts  Summary endpoint (progress bar + chart data + streak)
│       └── index.ts              Express entry point
│
└── frontend/                    React + Vite + TypeScript + Tailwind
    └── src/
        ├── api/client.ts        Type-safe fetch wrapper for the backend
        ├── types/index.ts       Types shared with the backend
        ├── hooks/useCountUp.ts  Animated number count-up for the calorie ring
        ├── components/
        │   ├── HeroSummaryCard.tsx  Calorie ring, streak badge, macro stats, confetti on goal
        │   ├── Confetti.tsx         Lightweight celebration burst (no external library)
        │   ├── WeightLineChart.tsx  Weight-over-time chart (Recharts)
        │   ├── WeightLogList.tsx    Recent weigh-ins with delete
        │   ├── AddMealForm.tsx      Free-text food search + add to a meal
        │   └── FavoriteMeals.tsx    One-tap favorite logging, with delete
        └── pages/Dashboard.tsx   Main summary screen
```

## Database Schema (summary)

- **User** — email, name, `startWeightKg`, `targetWeightKg`, `dailyCalorieGoal`
- **WeightLog** — per-user time series of weigh-ins (feeds the line chart)
- **Food** — local food cache; `caloriesPer100g`/`proteinPer100g`/`carbsPer100g`/`fatPer100g`, plus `source` (`mock`|`usda`|`off`), `fdcId` (USDA), and `barcode` (Open Food Facts)
- **Meal** — one meal slot (`BREAKFAST`/`LUNCH`/`DINNER`/`SNACK`) for one user on one day, `@@unique([userId, date, mealType])`
- **MealItem** — a food logged to a meal; macros are **snapshotted at insert time** so editing a Food later never rewrites history
- **FavoriteMeal** / **FavoriteMealItem** — a user's saved combos (e.g. "Fix Shake": oats + milk + peanut butter + banana + walnuts), logged to a day's meal in one request

SQLite has no native enum support in Prisma, so `MealType` is stored as a `String` and validated at the application layer (`src/types/mealType.ts`) — this can become a real enum after a future move to Postgres.

## Food Data: USDA + Open Food Facts Integration

Users aren't limited to a fixed list of 12 foods — the search box accepts **anything**: a fruit, a vegetable, a home-cooked dish, or a packaged product from the supermarket. On every keystroke (400ms debounced), `AddMealForm` calls `GET /api/foods/search?q=`, which fans out to two sources in parallel via `foodSearchService.ts`:

- **USDA FoodData Central** (`nutritionApiService.ts`) — for raw/generic foods (fruit, veg, meat, dairy, grains): a free, official, lab-analyzed (Foundation/SR Legacy) US government database.
- **Open Food Facts** (`openFoodFactsService.ts`) — for branded/packaged products: a free, keyless, global, crowd-sourced product database. **USDA's branded-product data is almost entirely US-centric, so it had no coverage of Turkish supermarket brands like Ülker, Torku, or Eti** — Open Food Facts fills that gap (verified live: searching "Torku" returns real Torku products with real calorie data; USDA has none of that brand at all).

Results are merged and returned together: USDA's raw/generic match (if any) comes first, packaged products follow — so typing "elma" (apple) surfaces the real fruit first, and "Torku Banada" surfaces the real product.

**Honesty note on "100% accurate":** no database can guarantee the *exact* calorie count of the specific banana in your hand — natural foods vary with ripeness, variety, and preparation. For packaged goods, the numbers come from the manufacturer's label (official on USDA, crowd-submitted on Open Food Facts — which occasionally means a missing or stale entry; `openFoodFactsService.ts` automatically filters out entries with no calorie data or zero calories). What this system does guarantee is that every number comes from a **real reference source**, not a guess — the most reliable approach realistically available.

**Ranking quality:** USDA ranks by raw text-match score, which could surface a composite dish like "Croissants, apple" ahead of a plain apple for a query like "elma" — a real risk of a 5x calorie error. `rankGenericResults` in `nutritionApiService.ts` re-ranks a wider candidate pool toward generic/raw entries (fewer descriptors, containing "raw") to fix this.

**Turkish input support:** USDA only indexes English content, while Open Food Facts takes the query as-is since product names are already stored in Turkish. So the query sent to USDA is first translated via `src/data/tr-en-food-terms.json` (~90 common Turkish food terms), while the query sent to Open Food Facts goes through unchanged.

**Flow:** picking a search result calls `POST /api/foods/import`, which upserts that record (keyed by `source`+`externalId` — `fdcId` for USDA, barcode for Open Food Facts) into the local `Food` table (re-selecting the same product never creates a duplicate row), then the normal `addMealItem` flow computes macros and logs it — `calorieService.ts` never had to change.

**Note — USDA `DEMO_KEY` limit:** without a key in `.env`, USDA's public `DEMO_KEY` is used, which is capped at **30 requests/hour, 50/day**. Open Food Facts needs no key, so it's unaffected by this limit. Getting your own free USDA key takes about a minute:

1. Sign up for free at https://fdc.nal.usda.gov/api-key-signup
2. Set the key in `backend/.env` as `USDA_API_KEY=...`
3. Restart the backend

## Setup & Running

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init   # creates the DB + runs the seed
npm run dev                          # http://localhost:4000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev                          # http://localhost:5173 (proxy: /api -> :4000)
```

After seeding, a demo user is ready: `demo@forme.app` (id=1), starting weight 95kg → target 80kg, 2500 kcal daily goal, 5 weeks of weight history, and a "Fix Shake" favorite.

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/users` | Create a user with starting/target weight |
| GET/POST | `/api/users/:id/weight-logs` | Read/add weight history |
| DELETE | `/api/users/:id/weight-logs/:logId` | Remove a weigh-in |
| GET | `/api/foods?q=` | Search the local food cache (mock + previously imported) |
| GET | `/api/foods/search?q=` | Live free-text search across USDA + Open Food Facts (Turkish and packaged products supported) |
| POST | `/api/foods/import` | Import a picked search result into the local `Food` table (idempotent, keyed by `source`+`externalId`) |
| POST | `/api/meals/items` | Log a food to a meal (calories/macros computed automatically) |
| DELETE | `/api/meals/items/:id` | Remove a logged food item |
| GET/POST | `/api/favorites` | List/create favorite meals |
| POST | `/api/favorites/:id/log` | Log a favorite's full contents to today in one request |
| DELETE | `/api/favorites/:id` | Remove a favorite meal |
| GET | `/api/dashboard?userId=&date=` | Daily summary for the progress bar, macro breakdown, chart, and streak |

## Next Steps (deliberately out of scope)

- Authentication / session management (currently runs on a single demo user)
- Caching USDA search results (repeated identical queries burn through the `DEMO_KEY` quota quickly)
- Prisma 5 → 7 major version upgrade (flagged a warning during migration)
