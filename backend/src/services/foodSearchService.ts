import { searchUsda } from "./nutritionApiService";
import { searchOpenFoodFacts } from "./openFoodFactsService";
import type { NutritionSearchResult } from "../types/nutrition";

// Combines the two nutrition sources: USDA for raw/generic foods (fruit,
// veg, meat, dairy — lab-analyzed, most trustworthy for those), Open Food
// Facts for branded/packaged products (where USDA's US-only Branded tier
// leaves Turkish market snacks essentially uncovered). Run in parallel so
// total latency is one round-trip, not two. USDA results are listed first
// since a generic ingredient match is usually what a plain query like
// "elma" means; branded hits follow.
export async function searchFoods(query: string, limit = 10): Promise<NutritionSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  let usdaError: Error | null = null;
  const [usdaResults, offResults] = await Promise.all([
    searchUsda(trimmed, limit).catch((err: Error) => {
      usdaError = err;
      return [] as NutritionSearchResult[];
    }),
    searchOpenFoodFacts(trimmed, limit),
  ]);

  const merged = [...usdaResults, ...offResults].slice(0, limit);

  // Only surface the USDA error (e.g. rate limit) if it actually cost the
  // user something — if Open Food Facts still turned up results, let those
  // through silently instead of blocking on USDA's hiccup.
  if (merged.length === 0 && usdaError) throw usdaError;

  return merged;
}
