import {
  Anvil,
  Cpu,
  Layers,
  Newspaper,
  Nut,
  Package,
  Recycle,
  Wine,
  Wrench,
  CupSoda,
} from 'lucide-react';
import type { Category } from '@/lib/types';
import { CATEGORY_MAP } from '@/data/categories';
import type { CategorySlug } from '@/lib/types';
import { cn } from '@/lib/utils';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  bottle: CupSoda, // drink cup — closest lucide glyph to a bottle
  newspaper: Newspaper,
  package: Package,
  anvil: Anvil,
  wrench: Wrench,
  layers: Layers,
  nut: Nut,
  cpu: Cpu,
  wine: Wine,
  recycle: Recycle,
};

export function CategoryIcon({
  slug,
  className,
  size = 'md',
  withTile = true,
}: {
  slug: CategorySlug;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  withTile?: boolean;
}) {
  const cat = CATEGORY_MAP[slug];
  const Icon = ICONS[cat?.icon ?? 'recycle'] ?? Recycle;
  const tile = {
    sm: 'h-8 w-8 rounded-lg',
    md: 'h-11 w-11 rounded-xl',
    lg: 'h-16 w-16 rounded-2xl',
  }[size];
  const icon = { sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-8 w-8' }[size];

  if (!withTile) return <Icon className={cn(icon, className)} />;

  return (
    <span className={cn('grid shrink-0 place-items-center', tile, cat?.tint, className)} aria-hidden>
      <Icon className={icon} />
    </span>
  );
}

export function CategoryTile({
  category,
  selected,
  onClick,
  lang = 'en',
}: {
  category: Category;
  selected?: boolean;
  onClick?: () => void;
  lang?: 'en' | 'hi' | 'mr';
}) {
  const label = lang === 'hi' ? category.nameHi : lang === 'mr' ? category.nameMr : category.name;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'group flex flex-col items-center gap-2 rounded-2xl border-2 p-3 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-soft',
        selected
          ? 'border-primary bg-primary/5 shadow-soft ring-1 ring-primary/20'
          : 'border-transparent bg-card shadow-sm hover:border-primary/30',
      )}
    >
      <CategoryIcon slug={category.slug} size="lg" />
      <span className="text-xs font-semibold leading-tight">{label}</span>
    </button>
  );
}
