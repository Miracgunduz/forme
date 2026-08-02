import type { NutritionSearchResult } from "../types/nutrition";

// Open Food Facts: free, no API key, crowd-sourced global product database —
// this is what covers Turkish market packaged snacks (Ülker, Torku, Eti...)
// that USDA (US-centric) essentially doesn't have. Data comes straight off
// product packaging/labels, contributed by users worldwide, so quality
// varies more than USDA's curated data — we filter out entries missing
// calorie data and dedupe obvious repeats, but can't fully guarantee every
// listing is typo-free or up to date.
//
// Uses the modern search-a-licious API (search.openfoodfacts.org), not the
// legacy cgi/search.pl endpoint. Measured live: the legacy endpoint fails
// ~20% of the time (transient 503s) AND doesn't fold Turkish diacritics
// ("Ülker" → 0 hits, "Ulker" → 3 hits, same data). search-a-licious was 5/5
// reliable in testing and matches "Ülker Çikolatalı Gofret" correctly as-is.
const OFF_SEARCH_URL = "https://search.openfoodfacts.org/search";

interface OffHit {
  code: string;
  product_name?: string;
  brands?: string[];
  nutriments?: Record<string, number>;
}

// OFF's own relevance order isn't stable — the same query against the same
// data returned different top results across consecutive calls in testing
// (likely load-balanced replicas / query-time randomization on their end).
// Re-rank client-side towards results whose brand or name actually contains
// a word from the query, so "Ülker Çikolatalı Gofret" reliably surfaces an
// Ülker product first regardless of which replica answered.
function rankByQueryMatch(hits: OffHit[], query: string): OffHit[] {
  const queryWords = query
    .toLocaleLowerCase("tr")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  function score(hit: OffHit): number {
    const brand = (hit.brands?.[0] ?? "").toLocaleLowerCase("tr");
    const name = (hit.product_name ?? "").toLocaleLowerCase("tr");
    let s = 0;
    if (brand && queryWords.some((w) => brand.includes(w))) s += 50;
    s += queryWords.filter((w) => name.includes(w)).length * 10;
    return s;
  }

  return [...hits].sort((a, b) => score(b) - score(a));
}

function normalize(p: OffHit): NutritionSearchResult {
  const brand = p.brands?.[0]?.trim();
  return {
    source: "off",
    externalId: p.code,
    name: brand ? `${p.product_name} (${brand})` : p.product_name!,
    dataType: "Open Food Facts",
    caloriesPer100g: p.nutriments?.["energy-kcal_100g"] ?? 0,
    proteinPer100g: p.nutriments?.["proteins_100g"] ?? 0,
    carbsPer100g: p.nutriments?.["carbohydrates_100g"] ?? 0,
    fatPer100g: p.nutriments?.["fat_100g"] ?? 0,
  };
}

export async function searchOpenFoodFacts(query: string, limit = 10): Promise<NutritionSearchResult[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const url = new URL(OFF_SEARCH_URL);
  url.searchParams.set("q", trimmed);
  // Over-fetch generously: OFF's relevance ordering is inconsistent across
  // calls, so a wider candidate pool gives rankByQueryMatch better odds of
  // actually having the true best (brand-matching) entry to promote.
  url.searchParams.set("page_size", "50");
  url.searchParams.set("fields", "code,product_name,brands,nutriments");

  let body: { hits?: OffHit[] } | null = null;
  for (let attempt = 0; attempt < 2 && body === null; attempt++) {
    try {
      // Fail soft (empty list) rather than breaking the whole search — the
      // USDA half of foodSearchService can still return results.
      const res = await fetch(url, { headers: { "User-Agent": "forme-app/1.0 (calorie tracker)" } });
      if (res.ok) body = (await res.json()) as { hits?: OffHit[] };
    } catch {
      // fall through to retry / soft-fail below
    }
  }
  if (body === null) return [];

  const ranked = rankByQueryMatch(body.hits ?? [], trimmed);

  const seen = new Set<string>();
  const out: NutritionSearchResult[] = [];
  for (const p of ranked) {
    const calories = p.nutriments?.["energy-kcal_100g"];
    if (!p.code || !p.product_name || !calories || calories <= 0) continue;

    const dedupeKey = `${p.product_name.trim().toLowerCase()}|${(p.brands?.[0] ?? "").trim().toLowerCase()}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    out.push(normalize(p));
    if (out.length >= limit) break;
  }
  return out;
}
