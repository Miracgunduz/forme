# Design System — forme

## Product Context
- **What this is:** Günlük öğün ve kalori/makro takip uygulaması.
- **Who it's for:** Kilo hedefi olan kullanıcılar (kilo verme odaklı).
- **Space/industry:** Fitness / wellness / sağlık takibi.
- **Project type:** Web app (dashboard).
- **Memorable thing:** "Bunu her gün kullanmak istiyorum" — motive edici, oyunlaştırılmış, ilerleme hissi veren; bağımlılık yapmadan motive eden.

## Aesthetic Direction
- **Direction:** Playful/Toy-like (oyunlaştırılmış, enerjik)
- **Decoration level:** Intentional — yumuşak blob/gradient dekorasyon hero alanında; veri yoğun alanlar (makro tabloları) sade.
- **Mood:** Duolingo/Strava'nın "her aksiyon bir ödül gibi hissettirsin" felsefesi — ama altında ciddi, güvenilir veri sunumu var.
- **Reference sites:** Duolingo (gamification, yuvarlak tipografi, saturasyonlu renk), Strava (streak/rozet mekaniği), MyFitnessPal/Oura/Whoop (kategori standardı: ilerleme halkası, makro kartları, kilo grafiği).

## Typography
- **Display/Hero:** Fredoka (600/700) — büyük kalori sayıları ve başlıklar için; dolgun/yuvarlak form "skor tablosu" hissi veriyor, kategorinin beklenen ciddi/klinik fontlarından bilinçli sapma (RISK).
- **Body:** Plus Jakarta Sans (400/500/600) — sıcak, okunabilir, aşırı kullanılan Inter/Roboto'nun alternatifi.
- **UI/Labels:** Plus Jakarta Sans (aynı, 600-700 ağırlık labels için).
- **Data/Tables:** DM Sans, `font-variant-numeric: tabular-nums` — makro/kalori tablolarında sayılar hizalı kalsın diye.
- **Code:** JetBrains Mono (şu an kullanılmıyor, ileride gerekirse).
- **Loading:** Google Fonts CDN — `Fredoka:wght@500;600;700`, `Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500`, `DM+Sans:wght@400;500;700`.
- **Scale:** hero 44px/1.1, h2 22px/1.2, body 16px/1.6, label 12-13px uppercase tracking .06em, data 16px tabular.

## Color
- **Approach:** Expressive — renk temel tasarım aracı, ama semantik anlamlar korunuyor.
- **Primary (Momentum):** `#FF6B4A` (mercan) — CTA butonları, aksiyon, hero gradient. RISK: kategorinin beklenen "sağlık yeşili/klinik mavisi" yerine sıcak/enerjik bir renk.
- **Secondary (Progress):** `#14B8A6` (turkuaz) — ilerleme halkaları, grafik vurguları, ikincil butonlar.
- **Neutrals:** Sıcak krem `#FFFBF7` (zemin) → sıcak ink `#1C1917` (metin); ara tonlar `#57534E` (soft text), `#A8A29E` (faint text), `#F0E6DD` (border).
- **Semantic:** success `#22C55E` (sadece "hedef tutturuldu" anları — marka rengi değil), warning `#F59E0B`, error `#EF4444`, info `#14B8A6` (secondary ile paylaşılıyor).
- **Dark mode:** Zemin `#191512`, kart `#24201C`, metin `#FDF9F5`, border `#362F28` — mercan/turkuaz aynı kalıyor (koyu zeminde zaten kontrastlı), saturasyon düşürülmüyor çünkü marka renkleri zaten sıcak/dolgun.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Hybrid — hero alanı (kalori halkası + streak) kompozisyon-öncelikli/kutlama amaçlı; öğün listesi ve makro kartları disiplinli grid.
- **Grid:** Dashboard 2 kolon (hero+grafik / hızlı-ekle+öğün listesi) masaüstünde, mobilde tek kolon.
- **Max content width:** 1120px
- **Border radius (hiyerarşik, her yerde aynı değil):** sm 10px (chip/badge), md 16px (kart/input), lg 24px (hero kart/app shell), full 9999px (buton/pill/streak badge).

## Motion
- **Approach:** Intentional — hedefe ulaşınca konfeti/celebration, kalori halkası dolarken animasyon, sayılar count-up ile artıyor, streak alevi nabız gibi atıyor. RISK: temel akışa gömülü gamification, sonradan eklenen rozet sistemi değil.
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`
- **Duration:** micro 80ms, short 200ms, medium 350ms, long 600ms (ring fill / count-up gibi kutlama anları için)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-02 | Initial design system created | `/design-consultation` ile oluşturuldu — kullanıcı "premium ama enerjik/oyunlaştırılmış" yön istedi, Duolingo/Strava/MyFitnessPal/Oura araştırması + "her gün kullanmak istiyorum" hedefine dayanarak mercan+turkuaz palet, Fredoka+Plus Jakarta Sans+DM Sans tipografi, streak/konfeti mikro-etkileşimleri seçildi. |
