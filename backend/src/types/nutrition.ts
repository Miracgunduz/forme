// Shared shape for any live nutrition-lookup hit, regardless of which
// external database it came from. `externalId` + `source` together form the
// provenance key used by /api/foods/import to upsert into the local Food
// table without duplicating rows on repeat imports.
export type NutritionSource = "usda" | "off";

export interface NutritionSearchResult {
  source: NutritionSource;
  externalId: string;
  name: string;
  dataType: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}
