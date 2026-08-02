import trEnFoodTerms from "../data/tr-en-food-terms.json";
import type { NutritionSearchResult } from "../types/nutrition";

// Live nutrition lookup against USDA FoodData Central — the US government's
// public, lab-analyzed food composition database. Covers raw/generic foods
// (produce, meat, dairy, grains) extremely well. It does NOT meaningfully
// cover branded/packaged products outside the US market — see
// openFoodFactsService.ts for that half of the picture (Turkish market
// snacks etc.), combined together in foodSearchService.ts.
//
// Honesty note: no database can claim calories are "100% accurate" for a
// specific physical banana or steak — natural foods vary by ripeness, cut,
// cooking method, etc. What we CAN guarantee is that the numbers come from
// USDA's official reference data rather than a guess — the most accurate
// source realistically available without a lab.
//
// Get your own free key (DEMO_KEY is heavily rate-limited: 30/hr, 50/day):
// https://fdc.nal.usda.gov/api-key-signup

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const NUTRIENT_IDS = { calories: 1008, protein: 1003, carbs: 1005, fat: 1004 } as const;

// Foundation/SR Legacy = USDA lab-analyzed generic foods ("Bananas, raw").
// (USDA's edge/WAF 400s on literal parentheses in query params, which rules
// out also including "Survey (FNDDS)" here — Foundation+SR Legacy already
// covers raw produce/meat/dairy well.)
const GENERIC_DATA_TYPES = "Foundation,SR Legacy";

// USDA only indexes English. Users type in Turkish ("elma", "tavuk göğsü"),
// so we translate common food terms before querying — otherwise "elma"
// matches nothing meaningful and the user gets garbage results. Falls back
// to the raw query untouched (works for already-English/loanword input).
const FOOD_TERMS = trEnFoodTerms as Record<string, string>;

export function translateToEnglish(query: string): string {
  const normalized = query.trim().toLocaleLowerCase("tr");

  const exact = FOOD_TERMS[normalized];
  if (exact) return exact;

  const translatedWords = normalized.split(/\s+/).map((word) => FOOD_TERMS[word] ?? word);
  return translatedWords.join(" ");
}

interface UsdaFoodNutrient {
  nutrientId: number;
  value: number;
}

interface UsdaFoodSearchItem {
  fdcId: number;
  description: string;
  dataType: string;
  foodNutrients: UsdaFoodNutrient[];
}

function extractMacros(nutrients: UsdaFoodNutrient[]) {
  const byId = new Map(nutrients.map((n) => [n.nutrientId, n.value]));
  return {
    caloriesPer100g: byId.get(NUTRIENT_IDS.calories) ?? 0,
    proteinPer100g: byId.get(NUTRIENT_IDS.protein) ?? 0,
    carbsPer100g: byId.get(NUTRIENT_IDS.carbs) ?? 0,
    fatPer100g: byId.get(NUTRIENT_IDS.fat) ?? 0,
  };
}

// USDA ranks by raw text-match score, which often buries the plain generic
// food ("Apples, raw") under composite dishes that happen to mention it
// ("Croissants, apple", "Babyfood, juice, apple") — a real accuracy hazard,
// since picking the wrong one can be off by 5x on calories. USDA's own
// naming convention puts the base ingredient first ("Chicken, breast, ...",
// "Apples, raw, ..."), so we re-rank a wider candidate pool towards entries
// that (a) start with the query's head word, (b) have fewer comma-separated
// descriptors (more generic), and (c) say "raw" — while pushing down obvious
// prepared/dessert items. This is a heuristic, not a guarantee: it fixes the
// egregious mismatches, not every edge case.
const PREPARED_FOOD_KEYWORDS = [
  "croissant", "strudel", "pie", "cake", "muffin", "cookie", "candy", "jam",
  "juice", "sauce", "soup", "chips", "bar,", "extract", "syrup", "pudding",
  "canned", "babyfood", "pastry", "doughnut", "fritter", "pizza", "sandwich",
];

function rankGenericResults(items: UsdaFoodSearchItem[], headQuery: string): UsdaFoodSearchItem[] {
  const headWord = headQuery.trim().toLocaleLowerCase("tr").split(/\s+/)[0] ?? "";

  function score(item: UsdaFoodSearchItem): number {
    const desc = item.description.toLowerCase();
    let s = 0;
    if (headWord && desc.startsWith(headWord)) s += 100;
    s -= (item.description.match(/,/g)?.length ?? 0) * 5;
    if (/\braw\b/.test(desc)) s += 20;
    if (PREPARED_FOOD_KEYWORDS.some((k) => desc.includes(k))) s -= 30;
    return s;
  }

  // Array.prototype.sort is stable, so ties keep USDA's own relevance order.
  return [...items].sort((a, b) => score(b) - score(a));
}

function normalize(item: UsdaFoodSearchItem): NutritionSearchResult {
  return {
    source: "usda",
    externalId: String(item.fdcId),
    name: item.description,
    dataType: item.dataType,
    ...extractMacros(item.foodNutrients),
  };
}

async function searchByDataType(query: string, dataType: string, pageSize: number): Promise<UsdaFoodSearchItem[]> {
  const apiKey = process.env.USDA_API_KEY || "DEMO_KEY";
  const url = new URL(`${USDA_BASE_URL}/foods/search`);
  url.searchParams.set("query", query);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("api_key", apiKey);
  if (dataType) url.searchParams.set("dataType", dataType);

  const res = await fetch(url);
  if (res.status === 429) {
    throw new Error(
      "USDA API rate limit reached. Set USDA_API_KEY in .env with your own free key (see fdc.nal.usda.gov/api-key-signup)."
    );
  }
  if (!res.ok) {
    throw new Error(`USDA API error: ${res.status}`);
  }
  const body = (await res.json()) as { foods?: UsdaFoodSearchItem[] };
  return body.foods ?? [];
}

function dedupeAndNormalize(items: UsdaFoodSearchItem[], limit: number): NutritionSearchResult[] {
  const seen = new Set<number>();
  const out: NutritionSearchResult[] = [];
  for (const item of items) {
    if (seen.has(item.fdcId)) continue;
    if (!item.foodNutrients?.some((n) => n.nutrientId === NUTRIENT_IDS.calories)) continue;
    seen.add(item.fdcId);
    out.push(normalize(item));
    if (out.length >= limit) break;
  }
  return out;
}

// Pull a wider candidate pool than we need so rankGenericResults has enough
// to work with — same 1 API call either way, pageSize is free.
const CANDIDATE_POOL_SIZE = 25;

// Searches USDA's generic/raw tier (Foundation + SR Legacy) and re-ranks
// towards the plain/generic entry. Retries once with the raw (untranslated)
// query if translation produced zero hits. Deliberately does NOT query
// USDA's Branded tier — that's US-only and openFoodFactsService covers
// branded/packaged goods (including Turkish ones) far better.
export async function searchUsda(query: string, limit = 10): Promise<NutritionSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const translated = translateToEnglish(trimmed);

  let genericRaw = await searchByDataType(translated, GENERIC_DATA_TYPES, CANDIDATE_POOL_SIZE);
  let headQuery = translated;

  if (genericRaw.length === 0 && translated.toLocaleLowerCase("tr") !== trimmed.toLocaleLowerCase("tr")) {
    genericRaw = await searchByDataType(trimmed, GENERIC_DATA_TYPES, CANDIDATE_POOL_SIZE);
    headQuery = trimmed;
  }

  const ranked = rankGenericResults(genericRaw, headQuery);
  return dedupeAndNormalize(ranked, limit);
}
