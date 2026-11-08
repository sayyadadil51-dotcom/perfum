import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Optional Supabase wiring.
 *
 * ScrapKart runs fully offline out of the box using the local demo backend
 * (`store.tsx` + localStorage). If you supply the two env vars below the app
 * will use Supabase for Auth / Postgres / Storage / Realtime instead:
 *
 *   VITE_SUPABASE_URL=https://xxxx.supabase.co
 *   VITE_SUPABASE_ANON_KEY=eyJ...
 *
 * Run `supabase/schema.sql` in the SQL editor first — it creates the tables,
 * triggers and Row Level Security policies that match `lib/types.ts`.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

if (import.meta.env.DEV && !isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.info(
    '%c[ScrapKart] Running with the local demo backend (localStorage). ' +
      'Add VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY to use Supabase.',
    'color:#16a34a;font-weight:600',
  );
}
