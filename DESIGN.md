# Design System — forme

## Product Context
- **What this is:** A daily meal and calorie/macro tracking app.
- **Who it's for:** Users working toward a weight goal (weight-loss focused).
- **Space/industry:** Fitness / wellness / health tracking.
- **Project type:** Web app (dashboard).
- **Memorable thing:** "I want to use this every day" — motivating, gamified, gives a sense of progress; motivates without being addictive.

## Aesthetic Direction
- **Direction:** Playful/Toy-like (gamified, energetic)
- **Decoration level:** Intentional — soft blob/gradient decoration in the hero zone; data-dense areas (macro tables) stay plain.
- **Mood:** Duolingo/Strava's "every action should feel like a reward" philosophy — but backed by serious, trustworthy data presentation underneath.
- **Reference sites:** Duolingo (gamification, rounded typography, saturated color), Strava (streak/badge mechanics), MyFitnessPal/Oura/Whoop (category baseline: progress ring, macro cards, weight chart).

## Typography
- **Display/Hero:** Fredoka (600/700) — for large calorie numbers and headings; its plump/rounded form gives a "scoreboard" feel, a deliberate departure from the category's expected serious/clinical fonts (RISK).
- **Body:** Plus Jakarta Sans (400/500/600) — warm, readable, an alternative to the overused Inter/Roboto.
- **UI/Labels:** Plus Jakarta Sans (same family, 600-700 weight for labels).
- **Data/Tables:** DM Sans, `font-variant-numeric: tabular-nums` — keeps numbers aligned in macro/calorie tables.
- **Code:** JetBrains Mono (not currently used, reserved for future need).
- **Loading:** Google Fonts CDN — `Fredoka:wght@500;600;700`, `Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500`, `DM+Sans:wght@400;500;700`.
- **Scale:** hero 44px/1.1, h2 22px/1.2, body 16px/1.6, label 12-13px uppercase tracking .06em, data 16px tabular.

## Color
- **Approach:** Expressive — color is a primary design tool, but semantic meaning is preserved.
- **Primary (Momentum):** `#FF6B4A` (coral) — CTA buttons, actions, hero gradient. RISK: a warm/energetic color instead of the category's expected "health green / clinical blue."
- **Secondary (Progress):** `#14B8A6` (teal) — progress rings, chart accents, secondary buttons.
- **Neutrals:** warm cream `#FFFBF7` (background) → warm ink `#1C1917` (text); intermediate tones `#57534E` (soft text), `#A8A29E` (faint text), `#F0E6DD` (border).
- **Semantic:** success `#22C55E` (reserved for "goal reached" moments only — not a brand color), warning `#F59E0B`, error `#EF4444`, info `#14B8A6` (shared with secondary).
- **Dark mode:** background `#191512`, card `#24201C`, text `#FDF9F5`, border `#362F28` — coral/teal stay the same (already high-contrast on a dark background), saturation isn't reduced since the brand colors are already warm/saturated.

## Spacing
- **Base unit:** 8px
- **Density:** Comfortable
- **Scale:** 2xs(2) xs(4) sm(8) md(16) lg(24) xl(32) 2xl(48) 3xl(64)

## Layout
- **Approach:** Hybrid — the hero zone (calorie ring + streak) is composition-first/celebratory; the meal list and macro cards sit in a disciplined grid.
- **Grid:** Dashboard is 2 columns (hero+chart / quick-add+meal list) on desktop, single column on mobile.
- **Max content width:** 1120px
- **Border radius (hierarchical, not uniform everywhere):** sm 10px (chip/badge), md 16px (card/input), lg 24px (hero card/app shell), full 9999px (button/pill/streak badge).

## Motion
- **Approach:** Intentional — confetti/celebration on reaching the goal, an animated fill on the calorie ring, numbers count up rather than jump, the streak flame pulses. RISK: gamification baked into the core flow, not a badge system bolted on afterward.
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`
- **Duration:** micro 80ms, short 200ms, medium 350ms, long 600ms (for celebratory moments like the ring fill / count-up)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-08-02 | Initial design system created | Built via `/design-consultation` — the user wanted a "premium but energetic/gamified" direction. Based on Duolingo/Strava/MyFitnessPal/Oura research and the "I want to use this every day" goal, chose the coral+teal palette, Fredoka+Plus Jakarta Sans+DM Sans typography, and streak/confetti micro-interactions. |
