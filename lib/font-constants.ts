export interface FontOption {
  id: string;
  name: string;
  category: "Rounded" | "Modern Sans" | "Editorial Serif" | "Italian Luxury" | "Display" | "Classic";
  fontFamily: string;
}

export const FONT_OPTIONS: FontOption[] = [
  // 1. Rounded
  {
    id: "arial-rounded",
    name: "Arial Rounded MT Bold",
    category: "Rounded",
    fontFamily: "'Arial Rounded MT Bold', 'Arial Rounded', sans-serif",
  },
  // 2. Modern Sans
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    category: "Modern Sans",
    fontFamily: "var(--font-jakarta), -apple-system, sans-serif",
  },
  {
    id: "inter",
    name: "Inter",
    category: "Modern Sans",
    fontFamily: "var(--font-inter), sans-serif",
  },
  {
    id: "outfit",
    name: "Outfit",
    category: "Modern Sans",
    fontFamily: "'Outfit', sans-serif",
  },
  {
    id: "montserrat",
    name: "Montserrat",
    category: "Modern Sans",
    fontFamily: "'Montserrat', sans-serif",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    category: "Modern Sans",
    fontFamily: "'DM Sans', sans-serif",
  },
  {
    id: "urbanist",
    name: "Urbanist Geometric",
    category: "Modern Sans",
    fontFamily: "'Urbanist', sans-serif",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    category: "Modern Sans",
    fontFamily: "'Space Grotesk', sans-serif",
  },
  // 3. Editorial & Luxury Serif
  {
    id: "playfair",
    name: "Playfair Display",
    category: "Editorial Serif",
    fontFamily: "'Playfair Display', Georgia, serif",
  },
  {
    id: "cinzel",
    name: "Cinzel Roman",
    category: "Editorial Serif",
    fontFamily: "'Cinzel', Didot, 'Bodoni MT', serif",
  },
  {
    id: "cormorant",
    name: "Cormorant Garamond",
    category: "Editorial Serif",
    fontFamily: "'Cormorant Garamond', Garamond, Georgia, serif",
  },
  {
    id: "bodoni",
    name: "Bodoni Moda",
    category: "Editorial Serif",
    fontFamily: "'Bodoni Moda', 'Didot', 'Bodoni MT', serif",
  },
  {
    id: "lora",
    name: "Lora Contemporary Serif",
    category: "Editorial Serif",
    fontFamily: "'Lora', Georgia, serif",
  },
  // 4. Italian & French Luxury
  {
    id: "tenor-sans",
    name: "Tenor Sans (Luxury Atelier)",
    category: "Italian Luxury",
    fontFamily: "'Tenor Sans', sans-serif",
  },
  {
    id: "marcellus",
    name: "Marcellus (Roman High Luxury)",
    category: "Italian Luxury",
    fontFamily: "'Marcellus', serif",
  },
  {
    id: "italiana",
    name: "Italiana (Milano Couture)",
    category: "Italian Luxury",
    fontFamily: "'Italiana', serif",
  },
  {
    id: "prata",
    name: "Prata (Didone Editorial)",
    category: "Italian Luxury",
    fontFamily: "'Prata', serif",
  },
  // 5. Display & Architectural
  {
    id: "syne",
    name: "Syne Editorial",
    category: "Display",
    fontFamily: "'Syne', sans-serif",
  },
  {
    id: "oswald",
    name: "Oswald Condensed",
    category: "Display",
    fontFamily: "'Oswald', sans-serif",
  },
  {
    id: "bebas-neue",
    name: "Bebas Neue Impact",
    category: "Display",
    fontFamily: "'Bebas Neue', sans-serif",
  },
  // 6. Classic & Monospace
  {
    id: "classic-arial",
    name: "Classic Arial",
    category: "Classic",
    fontFamily: "Arial, Helvetica, sans-serif",
  },
  {
    id: "georgia",
    name: "Georgia",
    category: "Classic",
    fontFamily: "Georgia, 'Times New Roman', serif",
  },
  {
    id: "mono",
    name: "Atelier Monospace",
    category: "Classic",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, monospace",
  },
];

export const FONT_FAMILY_MAP: Record<string, string> = FONT_OPTIONS.reduce(
  (acc, opt) => {
    acc[opt.id] = opt.fontFamily;
    return acc;
  },
  {} as Record<string, string>
);
// Also include legacy aliases
FONT_FAMILY_MAP["serif"] = FONT_FAMILY_MAP["playfair"];
FONT_FAMILY_MAP["classic"] = FONT_FAMILY_MAP["classic-arial"];

export function getResolvedFontFamily(key?: string): string {
  if (!key) return FONT_FAMILY_MAP["arial-rounded"];
  return FONT_FAMILY_MAP[key] || key;
}
