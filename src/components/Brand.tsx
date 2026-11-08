import { Link } from 'react-router-dom';
import { Recycle } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ── Brand ───────────────────────────────────────────────────────────────── */
export function Brand({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link to="/" className={cn('flex items-center gap-2', className)} aria-label="ScrapKart home">
      <span className="grid h-9 w-9 place-items-center rounded-xl gradient-leaf text-white shadow-soft">
        <Recycle className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="font-display text-lg font-extrabold tracking-tight">
          Scrap<span className="text-primary">Kart</span>
        </span>
      )}
    </Link>
  );
}

