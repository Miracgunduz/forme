# forme

Kilo hedefi olan kullanıcılar için günlük öğün ve kalori/makro takip uygulaması. Backend + frontend altyapısının ilk sürümü.

Görsel kimlik `/design-consultation` ile kuruldu — detaylar ve gerekçeler için **[DESIGN.md](./DESIGN.md)**'ye bakın (mercan+turkuaz palet, Fredoka/Plus Jakarta Sans/DM Sans tipografi, streak/konfeti mikro-etkileşimleri).

## Klasör Yapısı

```
forme/
├── backend/                     Node.js + Express + TypeScript API
│   ├── prisma/
│   │   ├── schema.prisma        Veritabanı şeması (SQLite)
│   │   └── seed.ts              Mock besin verisi + demo kullanıcı + "Fix Shake" favorisi
│   └── src/
│       ├── data/foods.json              Bundled starter foods (seed data, "Fix Shake" vb.)
│       ├── data/tr-en-food-terms.json   Türkçe→İngilizce yiyecek terimi sözlüğü (USDA aramaları için)
│       ├── db/client.ts                 Paylaşılan Prisma client
│       ├── types/mealType.ts            MealType union + validasyon (SQLite enum desteklemiyor)
│       ├── services/
│       │   ├── calorieService.ts        ⟵ Sistemin belkemiği: kalori/makro hesaplama, öğün ekleme, günlük özet
│       │   ├── nutritionApiService.ts   USDA FoodData Central (çiğ/temel gıdalar) + Türkçe çeviri
│       │   ├── openFoodFactsService.ts  Open Food Facts (paketli/market ürünleri, Türkiye dahil)
│       │   └── foodSearchService.ts     İkisini birleştirip tek arama sonucu döner
│       ├── routes/
│       │   ├── users.routes.ts      Kullanıcı hedefi + kilo geçmişi
│       │   ├── foods.routes.ts      Yerel besin listesi + birleşik arama/import
│       │   ├── meals.routes.ts      Öğüne yiyecek ekleme
│       │   ├── favorites.routes.ts  Favori öğün oluşturma + tek tık loglama
│       │   └── dashboard.routes.ts  Özet endpoint (progress bar + grafik verisi)
│       └── index.ts              Express giriş noktası
│
└── frontend/                    React + Vite + TypeScript + Tailwind
    └── src/
        ├── api/client.ts        Backend'e tip güvenli fetch sarmalayıcı
        ├── types/index.ts       Backend ile paylaşılan tipler
        ├── components/
        │   ├── CalorieProgressBar.tsx
        │   ├── WeightLineChart.tsx     (Recharts)
        │   ├── AddMealForm.tsx
        │   └── FavoriteMeals.tsx       (tek tıkla favori ekleme)
        └── pages/Dashboard.tsx   Ana özet ekranı
```

## Veritabanı Şeması (özet)

- **User** — email, name, `startWeightKg`, `targetWeightKg`, `dailyCalorieGoal`
- **WeightLog** — kullanıcı başına zaman serisi kilo kaydı (çizgi grafiği besler)
- **Food** — yerel besin önbelleği; `caloriesPer100g`/`proteinPer100g`/`carbsPer100g`/`fatPer100g`, `source` (`mock`|`usda`|`off`), `fdcId` (USDA) ve `barcode` (Open Food Facts) alanlarıyla
- **Meal** — bir kullanıcının bir günkü bir öğün slotu (`BREAKFAST`/`LUNCH`/`DINNER`/`SNACK`), `@@unique([userId, date, mealType])`
- **MealItem** — bir öğüne eklenen yiyecek; makrolar **eklendiği anda snapshot'lanır** (Food kaydı sonradan değişse bile geçmiş bozulmaz)
- **FavoriteMeal** / **FavoriteMealItem** — kullanıcının kayıtlı kombinasyonları (örn. "Fix Shake": yulaf+süt+fıstık ezmesi+muz+ceviz), tek istekle günün öğününe loglanır

SQLite Prisma'da native enum desteklemediği için `MealType` `String` olarak saklanır ve uygulama katmanında (`src/types/mealType.ts`) doğrulanır — ileride Postgres'e geçişte gerçek enum'a çevrilebilir.

## Yiyecek Verisi: USDA + Open Food Facts Entegrasyonu

Kullanıcı artık sadece önceden tanımlı 12 yiyecekle sınırlı değil — arama kutusuna **herhangi bir** yemek, sebze, meyve ya da markette satılan paketli ürünü yazabilir. `AddMealForm` her tuş vuruşunda (400ms debounce ile) `GET /api/foods/search?q=` çağırır; bu da `foodSearchService.ts` üzerinden iki kaynağı paralel sorgular:

- **USDA FoodData Central** (`nutritionApiService.ts`) — çiğ/temel gıdalar için (meyve, sebze, et, süt ürünü, tahıl): ücretsiz, resmi, laboratuvar analizli (Foundation/SR Legacy) ABD kamu veritabanı.
- **Open Food Facts** (`openFoodFactsService.ts`) — paketli/markalı ürünler için: ücretsiz, anahtar gerektirmeyen, küresel/kullanıcı katkılı ürün veritabanı. **USDA'nın markalı ürün verisi neredeyse tamamen ABD merkezli olduğundan Ülker, Torku, Eti gibi Türk marketi ürünlerini bulamıyordu** — Open Food Facts bu boşluğu dolduruyor (test: "Torku" araması gerçek Torku ürünlerini, kalorileriyle birlikte buluyor; USDA'da bu marka hiç yok).

Sonuçlar birleştirilip döner: USDA'nın çiğ/jenerik eşleşmesi (varsa) önce, market ürünleri sonra listelenir — böylece "elma" yazınca önce gerçek elmayı, "Torku Banada" yazınca gerçek ürünü görürsün.

**Dürüstlük notu — "%100 doğru" hakkında:** Hiçbir veritabanı, elinizdeki gerçek bir muzun kalorisinin *tam olarak* kaç olduğunu garanti edemez; doğal ürünler olgunluğa, çeşide, pişirme yöntemine göre değişir. Paketli ürünlerde ise veri üreticinin etiketinden geliyor (USDA'da resmi, Open Food Facts'te kullanıcı girişi — bu yüzden ara sıra eksik/hatalı kayıt olabilir; `openFoodFactsService.ts` kalori verisi olmayan/sıfır olan kayıtları otomatik eliyor). Sistemin garanti ettiği şey: sayıların bir tahminden değil, **gerçek bir referans kaynağından** geldiğidir — pratikte ulaşılabilecek en güvenilir yöntem budur.

**Sıralama kalitesi:** USDA ham metin eşleşmesine göre sıralıyor, bu da "elma" aramasında düz elmayı değil "Croissants, apple" gibi bileşik yemekleri öne çıkarabiliyordu (5 kata varan kalori hatası riski). `nutritionApiService.ts` içindeki `rankGenericResults` bunu düzeltmek için jenerik/çiğ girdileri (az tanımlayıcılı, "raw" içeren) öne alan bir puanlama uyguluyor.

**Türkçe girdi desteği:** USDA sadece İngilizce içerik indeksliyor; Open Food Facts sorguyu olduğu gibi (Türkçe) alıyor çünkü ürün isimleri zaten Türkçe kayıtlı. Bu yüzden USDA'ya giden sorgu önce `src/data/tr-en-food-terms.json` sözlüğünden (~90 yaygın Türkçe yiyecek terimi) İngilizceye çevriliyor, Open Food Facts'e giden sorgu ise orijinal haliyle gidiyor.

**Akış:** arama sonucundan bir öğe seçilince `POST /api/foods/import` o kaydı (`source`+`externalId` ile — USDA için `fdcId`, Open Food Facts için barkod) yerel `Food` tablosuna alır (aynı ürün tekrar seçilirse yeni satır açmaz), ardından normal `addMealItem` akışı üzerinden makrolar hesaplanıp öğüne eklenir — `calorieService.ts` hiç değişmedi.

**Önemli — DEMO_KEY sınırı (sadece USDA için):** `.env`'de anahtar verilmezse USDA'nın herkese açık `DEMO_KEY`'i kullanılır; bu **saatte 30, günde 50 istekle** sınırlıdır. Open Food Facts anahtar gerektirmediği için bu sınır ondan etkilenmez. Ücretsiz kendi USDA anahtarınızı almak 1 dakika sürer:

1. https://fdc.nal.usda.gov/api-key-signup adresinden ücretsiz kayıt olun
2. Gelen anahtarı `backend/.env` dosyasında `USDA_API_KEY=...` olarak ayarlayın
3. Backend'i yeniden başlatın

## Kurulum ve Çalıştırma

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma migrate dev --name init   # DB oluşturur + seed çalıştırır
npm run dev                          # http://localhost:4000

# Frontend (ayrı terminalde)
cd frontend
npm install
npm run dev                          # http://localhost:5173 (proxy: /api -> :4000)
```

Seed sonrası demo kullanıcı: `demo@forme.app` (id=1), başlangıç 95kg → hedef 80kg, günlük 2500 kcal hedefi, 5 haftalık kilo geçmişi ve "Fix Shake" favorisi hazır gelir.

## API Uç Noktaları

| Method | Path | Açıklama |
|---|---|---|
| POST | `/api/users` | Yeni kullanıcı + başlangıç/hedef kilo |
| GET/POST | `/api/users/:id/weight-logs` | Kilo geçmişi okuma/ekleme |
| GET | `/api/foods?q=` | Yerel besin önbelleğinde arama (mock + daha önce içe aktarılanlar) |
| GET | `/api/foods/search?q=` | USDA + Open Food Facts'ta canlı serbest metin arama (Türkçe ve market ürünleri destekli) |
| POST | `/api/foods/import` | Seçilen sonucu yerel `Food` tablosuna al (idempotent, `source`+`externalId` ile) |
| POST | `/api/meals/items` | Bir öğüne yiyecek ekle (kalori/makro otomatik hesaplanır) |
| GET/POST | `/api/favorites` | Favori öğün listeleme/oluşturma |
| POST | `/api/favorites/:id/log` | Favoriyi tek istekle bugüne logla |
| GET | `/api/dashboard?userId=&date=` | Progress bar + grafik için günlük özet |

## Sonraki Adımlar (bilinçli olarak kapsam dışı bırakıldı)

- Kimlik doğrulama / oturum yönetimi (şu an tek demo kullanıcı üzerinden çalışıyor)
- USDA arama sonuçlarının önbelleklenmesi (aynı sorgu tekrar tekrar sorulduğunda DEMO_KEY kotasını hızlı tüketiyor)
- Prisma 5 → 7 majör sürüm güncellemesi (migrate sırasında uyarı verdi)
