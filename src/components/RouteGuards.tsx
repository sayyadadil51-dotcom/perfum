import * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/context/AppStore';
import { EmptyState } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import type { Role } from '@/lib/types';

/** Blocks unauthenticated users; remembers where they were going. */
export function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: Role[] }) {
  const { currentUser } = useAppStore();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to={`/login?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (roles && !roles.includes(currentUser.role)) {
    return (
      <div className="container py-16">
        <EmptyState
          icon={ShieldAlert}
          title="You don't have access to this area"
          description={`This section is for ${roles.join(' / ')} accounts. You are signed in as a ${currentUser.role}.`}
          action={
            <Button asChild>
              <Link to={currentUser.role === 'admin' ? '/admin' : currentUser.role === 'seller' ? '/seller' : '/buyer'}>
                Go to my dashboard
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}

/** Simple full-page loading used while demo data hydrates. */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function NotFound() {
  return (
    <div className="container py-20">
      <div className="mx-auto max-w-md text-center">
        <p className="font-display text-7xl font-black text-primary/20">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold">This page has been recycled</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We could not find what you were looking for. It may have been moved or the listing removed.
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/rates">View scrap rates</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
