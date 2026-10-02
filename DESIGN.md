# DNORA — Brand Design System & Aesthetic Specification

DNORA expresses quiet luxury through disciplined architecture, restrained neutral tonality, generous whitespace, and tactile micro-interactions.

---

## 1. Color Palette

```
Primary Surfaces:
#FAF9F6 — Alabaster / Soft Ivory (Main background)
#FFFFFF — Pure Studio White (Cards, dialogue surfaces)
#F5F3EF — Warm Sand / Cream (Secondary blocks, badge backings, image frames)
#E8E5DE — Architectural Subtle Border (Divider lines, structural hairpins)

Text & Contrast:
#0E0E0E — Deep Obsidian Black (Brand logo, primary headlines, active buttons)
#1C1B1A — Charcoal (Subheadings, luxury footers)
#3A3835 — Warm Graphite (Body descriptions, specifications)
#73706A — Muted Stone (Metadata labels, SKUs, breadcrumbs)

Luxury Accent:
#C5A880 — Brushed Champagne Gold (Hardware accents, subheadings, subtle highlights)
#A9895E — Dark Antique Gold (Hover state transitions)
```

---

## 2. Typography Rules

### Prohibited Fonts
Strictly **NO traditional serif fonts**:
- Times New Roman
- Garamond
- Georgia
- Baskerville
- Didot

### Approved Sans-Serif System
- **Editorial Headlines**: `Plus Jakarta Sans` (`font-heading`, `font-extrabold` / `font-bold`). Clean geometric balance with high optical legibility.
- **Body & Pricing**: `Inter` (`font-sans`, `font-normal` / `font-medium` / `font-semibold`). Industry standard for crisp screen rendering and tabular price clarity.

### Typographic Scale
- **Hero Title**: `text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08]`
- **Section Heading**: `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight`
- **Sub-heading / Category Label**: `text-xs uppercase tracking-[0.25em] font-semibold text-[#C5A880]`
- **Body Text**: `text-sm sm:text-base leading-relaxed text-[#3A3835]`
- **Badges / Micro Labels**: `text-[10px] sm:text-xs uppercase tracking-[0.18em] font-bold`

---

## 3. Micro-Interactions & Animation Guidelines

- **Subtle Image Hover Zoom**: Handbag card imagery applies a smooth `transform: scale(1.05)` over `700ms` with a cubic-bezier easing curve (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Secondary Image Cross-Fade**: When hovering a handbag card with multiple angles, the secondary image dissolves in seamlessly over `700ms`.
- **Hero Carousel Navigation**: Transparent `<` and `>` chevron buttons with backdrop blur (`backdrop-blur-sm bg-black/20 hover:bg-black/50`) ensure complete visual immersion without bulky chrome.
- **Glassmorphism Header**: The navigation header subtly transitions on scroll from transparent to `rgba(250, 249, 246, 0.85)` with a 16px blur backdrop and single-pixel bottom border.
