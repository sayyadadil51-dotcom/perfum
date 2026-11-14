import type { Category, CategorySlug } from '@/lib/types';

/**
 * Scrap categories supported by ScrapKart.
 * `icon` maps to a lucide icon name in `components/CategoryIcon.tsx`.
 */
export const CATEGORIES: Category[] = [
  {
    slug: 'plastic',
    name: 'Plastic',
    nameHi: 'प्लास्टिक',
    nameMr: 'प्लास्टिक',
    icon: 'bottle',
    tint: 'bg-sky-100 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    description: 'PET bottles, HDPE containers, caps, buckets, pipes',
    unit: 'kg',
    active: true,
    sortOrder: 1,
  },
  {
    slug: 'paper',
    name: 'Paper',
    nameHi: 'कागज़',
    nameMr: 'कागद',
    icon: 'newspaper',
    tint: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    description: 'Newspapers, notebooks, magazines, office paper',
    unit: 'kg',
    active: true,
    sortOrder: 2,
  },
  {
    slug: 'cardboard',
    name: 'Cardboard',
    nameHi: 'गत्ता',
    nameMr: 'पुठ्ठा',
    icon: 'package',
    tint: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
    description: 'Cartons, shipping boxes, brown board, kraft rolls',
    unit: 'kg',
    active: true,
    sortOrder: 3,
  },
  {
    slug: 'steel',
    name: 'Steel',
    nameHi: 'स्टील',
    nameMr: 'स्टील',
    icon: 'anvil',
    tint: 'bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300',
    description: 'Steel rods, sheets, utensils, industrial offcuts',
    unit: 'kg',
    active: true,
    sortOrder: 4,
  },
  {
    slug: 'iron',
    name: 'Iron',
    nameHi: 'लोहा',
    nameMr: 'लोखंड',
    icon: 'wrench',
    tint: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300',
    description: 'Scrap iron, old machinery, gates, grills, pipes',
    unit: 'kg',
    active: true,
    sortOrder: 5,
  },
  {
    slug: 'aluminium',
    name: 'Aluminium',
    nameHi: 'एल्युमिनियम',
    nameMr: 'अ‍ॅल्युमिनियम',
    icon: 'layers',
    tint: 'bg-gray-100 text-gray-700 dark:bg-gray-500/15 dark:text-gray-300',
    description: 'Cans, foil, window frames, profiles, utensils',
    unit: 'kg',
    active: true,
    sortOrder: 6,
  },
  {
    slug: 'copper',
    name: 'Copper',
    nameHi: 'तांबा',
    nameMr: 'तांबे',
    icon: 'nut',
    tint: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    description: 'Copper wire, pipes, motors, brass fittings',
    unit: 'kg',
    active: true,
    sortOrder: 7,
  },
  {
    slug: 'ewaste',
    name: 'E-waste',
    nameHi: 'ई-कचरा',
    nameMr: 'ई-कचरा',
    icon: 'cpu',
    tint: 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    description: 'Phones, laptops, TVs, PCBs, batteries, cables',
    unit: 'kg',
    active: true,
    sortOrder: 8,
  },
  {
    slug: 'glass',
    name: 'Glass',
    nameHi: 'कांच',
    nameMr: 'काच',
    icon: 'wine',
    tint: 'bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
    description: 'Bottles, jars, window panes, broken glassware',
    unit: 'kg',
    active: true,
    sortOrder: 9,
  },
  {
    slug: 'other',
    name: 'Other',
    nameHi: 'अन्य',
    nameMr: 'इतर',
    icon: 'recycle',
    tint: 'bg-lime-100 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300',
    description: 'Rubber, textiles, mixed scrap, anything else',
    unit: 'kg',
    active: true,
    sortOrder: 10,
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, Category>;

export function categoryName(slug: CategorySlug, lang: 'en' | 'hi' | 'mr' = 'en') {
  const c = CATEGORY_MAP[slug];
  if (!c) return slug;
  return lang === 'hi' ? c.nameHi : lang === 'mr' ? c.nameMr : c.name;
}

/**
 * CO2 saved per kg of recycled material (kg CO₂e / kg material).
 * Figures approximate published recycling-benefit studies — shown as
 * "impact" only, clearly labelled as estimates in the UI.
 */
export const CO2_FACTOR: Record<CategorySlug, number> = {
  plastic: 2.5,
  paper: 1.1,
  cardboard: 0.9,
  steel: 1.9,
  iron: 1.5,
  aluminium: 9.2,
  copper: 3.8,
  ewaste: 6.1,
  glass: 0.6,
  other: 0.5,
};

export function co2Saved(weightKg: number, category: CategorySlug) {
  return Math.round(weightKg * (CO2_FACTOR[category] ?? 0.5) * 10) / 10;
}
