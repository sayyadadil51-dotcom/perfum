import * as React from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Recycle,
  ShoppingBag,
  Sun,
  User,
  X,
  Home as HomeIcon,
  IndianRupee,
  Plus,
  Truck,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/misc';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAppStore } from '@/context/AppStore';
import { useTheme } from '@/context/ThemeContext';
import { LANGUAGES } from '@/lib/i18n';
import { cn, timeAgo } from '@/lib/utils';
import { Footer } from '@/components/Footer';
import { Brand } from '@/components/Brand';

/* ── Language switcher ───────────────────────────────────────────────────── */
function LanguageSwitcher() {
  const { lang, setLang } = useAppStore();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 px-2.5" aria-label="Change language">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{LANGUAGES.find((l) => l.code === lang)?.native}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        {LANGUAGES.map((l) => (
          <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)}>
            <span className={cn(lang === l.code && 'font-semibold text-primary')}>{l.native}</span>
            <span className="ml-auto text-xs text-muted-foreground">{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Notifications bell ──────────────────────────────────────────────────── */
function NotificationsBell() {
  const { state, currentUser, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const navigate = useNavigate();
  const items = state.notifications
    .filter((n) => currentUser && n.userId === currentUser.id)
    .slice(0, 8);
  const unread = items.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(92vw,22rem)] p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">Notifications</p>
          {unread > 0 && (
            <button onClick={markAllNotificationsRead} className="text-xs font-medium text-primary hover:underline">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 && (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">You're all caught up 🌿</p>
          )}
          {items.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                markNotificationRead(n.id);
                if (n.href) navigate(n.href);
              }}
              className={cn(
                'flex w-full gap-2.5 border-b border-border/60 px-3 py-2.5 text-left transition hover:bg-muted',
                !n.read && 'bg-primary/[0.04]',
              )}
            >
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-border' : 'bg-primary')} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{n.title}</span>
                <span className="mt-0.5 line-clamp-2 block text-xs text-muted-foreground">{n.body}</span>
                <span className="mt-1 block text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── User menu ───────────────────────────────────────────────────────────── */
function UserMenu() {
  const { currentUser, logout, t } = useAppStore();
  const navigate = useNavigate();
  if (!currentUser) return null;
  const dash =
    currentUser.role === 'seller' ? '/seller' : currentUser.role === 'buyer' ? '/buyer' : '/admin';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 rounded-full p-0.5 pr-1 transition hover:bg-muted" aria-label="Account menu">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback name={currentUser.name} />
          </Avatar>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold">{currentUser.name}</p>
          <p className="truncate text-xs capitalize text-muted-foreground">
            {currentUser.role}
            {currentUser.businessName ? ` · ${currentUser.businessName}` : ''}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate(dash)}>
          <LayoutDashboard /> {t('nav.dashboard')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User /> Profile & settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(currentUser.role === 'buyer' ? '/buyer/messages' : '/seller/messages')}>
          <MessageCircle /> Messages
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut /> {t('nav.logout')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Navbar ──────────────────────────────────────────────────────────────── */
function Navbar() {
  const { currentUser, t } = useAppStore();
  const { theme, toggle } = useTheme();
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => setOpen(false), [location.pathname]);

  const links = [
    { to: '/', label: t('nav.home') },
    { to: '/rates', label: t('nav.rates') },
    { to: '/how-it-works', label: t('nav.how') },
    { to: '/support', label: 'Support' },
  ];

  const dash =
    currentUser?.role === 'seller' ? '/seller' : currentUser?.role === 'buyer' ? '/buyer' : '/admin';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b transition-all duration-300',
        scrolled
          ? 'border-border/80 bg-background/85 shadow-sm backdrop-blur-lg'
          : 'border-transparent bg-background/60 backdrop-blur-sm',
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-2">
        <div className="flex items-center gap-1 lg:gap-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-xs p-0">
              <div className="border-b border-border p-4">
                <Brand />
              </div>
              <nav className="flex flex-col gap-1 p-3">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className={({ isActive }) =>
                      cn(
                        'rounded-xl px-3 py-2.5 text-sm font-medium transition',
                        isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
                <div className="my-2 h-px bg-border" />
                {currentUser ? (
                  <>
                    <NavLink to={dash} className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted">
                      {t('nav.dashboard')}
                    </NavLink>
                    <NavLink to="/profile" className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted">
                      Profile & settings
                    </NavLink>
                  </>
                ) : (
                  <>
                    <NavLink to="/login" className="rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-muted">
                      {t('nav.login')}
                    </NavLink>
                    <Button asChild className="mt-1">
                      <Link to="/signup">{t('nav.signup')}</Link>
                    </Button>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>

          <Brand className="shrink-0" />
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-foreground/70 hover:bg-muted hover:text-foreground',
                  )
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1">
          <LanguageSwitcher />
          <Button variant="ghost" size="icon" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          {currentUser ? (
            <>
              <NotificationsBell />
              <UserMenu />
            </>
          ) : (
            <div className="ml-1 hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/login">{t('nav.login')}</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/signup">{t('nav.signup')}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

/* ── Mobile bottom nav (thumb-friendly) ──────────────────────────────────── */
function MobileNav() {
  const { currentUser } = useAppStore();
  if (!currentUser) return null;
  const role = currentUser.role;
  const dash = role === 'seller' ? '/seller' : role === 'buyer' ? '/buyer' : '/admin';
  const items =
    role === 'seller'
      ? [
          { to: '/', label: 'Home', icon: HomeIcon },
          { to: '/seller', label: 'Listings', icon: ShoppingBag },
          { to: '/seller/new', label: 'Sell', icon: Plus, primary: true },
          { to: '/seller/orders', label: 'Orders', icon: Truck },
          { to: '/seller/earnings', label: 'Earnings', icon: Wallet },
        ]
      : role === 'buyer'
        ? [
            { to: '/', label: 'Home', icon: HomeIcon },
            { to: '/buyer', label: 'Browse', icon: ShoppingBag },
            { to: '/buyer/offers', label: 'Offers', icon: IndianRupee },
            { to: '/buyer/orders', label: 'Orders', icon: Truck },
            { to: '/buyer/messages', label: 'Chat', icon: MessageCircle },
          ]
        : [
            { to: '/', label: 'Home', icon: HomeIcon },
            { to: '/admin', label: 'Overview', icon: LayoutDashboard },
            { to: '/admin/buyers', label: 'Buyers', icon: User },
            { to: '/admin/rates', label: 'Rates', icon: IndianRupee },
            { to: '/admin/disputes', label: 'Disputes', icon: MessageCircle },
          ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      aria-label="Quick navigation"
    >
      <div className="grid grid-cols-5">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === dash || it.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            {it.primary ? (
              <span className="grid h-9 w-9 -translate-y-2 place-items-center rounded-full bg-primary text-primary-foreground shadow-lift">
                <it.icon className="h-5 w-5" />
              </span>
            ) : (
              <it.icon className="h-5 w-5" />
            )}
            <span>{it.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

/* ── Scroll to top on route change ───────────────────────────────────────── */
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export function Layout() {
  const { currentUser } = useAppStore();
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <Navbar />
      <main className={cn('flex-1', currentUser && 'pb-16 lg:pb-0')}>
        <Outlet />
      </main>
      <Footer />
      <MobileNav />
    </div>
  );
}
