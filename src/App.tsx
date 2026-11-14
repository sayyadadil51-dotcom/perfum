import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/misc';
import { Layout } from '@/components/Layout';
import { AppStoreProvider } from '@/context/AppStore';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/context/ToastContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { NotFound, PageLoader, RequireAuth } from '@/components/RouteGuards';

// ── Public pages (eager: part of the first paint) ──────────────────────────
import Home from '@/pages/Home';
import Rates from '@/pages/Rates';
import HowItWorks from '@/pages/HowItWorks';
import { LoginPage, SignupPage } from '@/pages/Auth';
import ListingDetail from '@/pages/ListingDetail';
import Profile from '@/pages/Profile';
import Support from '@/pages/Support';
import OrderDetail from '@/pages/OrderDetail';
import MessagesPage from '@/pages/MessagesPage';

// ── Dashboards (code-split per role) ───────────────────────────────────────
const SellerLayout = lazy(() => import('@/pages/seller/SellerLayout'));
const SellerDashboard = lazy(() => import('@/pages/seller/SellerDashboard'));
const NewListing = lazy(() => import('@/pages/seller/NewListing'));
const SellerListings = lazy(() => import('@/pages/seller/SellerListings'));
const SellerListingDetail = lazy(() => import('@/pages/seller/SellerListingDetail'));
const EditListing = lazy(() => import('@/pages/seller/EditListing'));
const SellerOrders = lazy(() => import('@/pages/seller/SellerOrders'));
const SellerEarnings = lazy(() => import('@/pages/seller/SellerEarnings'));
const Referrals = lazy(() => import('@/pages/seller/Referrals'));

const BuyerLayout = lazy(() => import('@/pages/buyer/BuyerLayout'));
const BrowseListings = lazy(() => import('@/pages/buyer/BrowseListings'));
const BuyerListingDetail = lazy(() => import('@/pages/buyer/BuyerListingDetail'));
const BuyerOffers = lazy(() => import('@/pages/buyer/BuyerOffers'));
const BuyerOrders = lazy(() => import('@/pages/buyer/BuyerOrders'));
const BuyerWallet = lazy(() => import('@/pages/buyer/BuyerWallet'));

const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('@/pages/admin/AdminOverview'));
const AdminBuyers = lazy(() => import('@/pages/admin/AdminBuyers'));
const AdminRates = lazy(() => import('@/pages/admin/AdminRates'));
const AdminCategories = lazy(() => import('@/pages/admin/AdminCategories'));
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'));
const AdminListings = lazy(() => import('@/pages/admin/AdminListings'));
const AdminDisputes = lazy(() => import('@/pages/admin/AdminDisputes'));
const AdminSupport = lazy(() => import('@/pages/admin/AdminSupport'));

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppStoreProvider>
          <ToastProvider>
            <TooltipProvider delayDuration={200}>
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route element={<Layout />}>
                      {/* ── public ── */}
                      <Route index element={<Home />} />
                      <Route path="rates" element={<Rates />} />
                      <Route path="how-it-works" element={<HowItWorks />} />
                      <Route path="login" element={<LoginPage />} />
                      <Route path="signup" element={<SignupPage />} />
                      <Route path="listing/:id" element={<ListingDetail />} />
                      <Route path="support" element={<Support />} />

                      {/* ── shared authenticated ── */}
                      <Route
                        path="profile"
                        element={
                          <RequireAuth>
                            <Profile />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="seller/orders/:id"
                        element={
                          <RequireAuth roles={['seller']}>
                            <OrderDetail />
                          </RequireAuth>
                        }
                      />
                      <Route
                        path="buyer/orders/:id"
                        element={
                          <RequireAuth roles={['buyer']}>
                            <OrderDetail />
                          </RequireAuth>
                        }
                      />

                      {/* ── seller ── */}
                      <Route
                        path="seller"
                        element={
                          <RequireAuth roles={['seller']}>
                            <SellerLayout />
                          </RequireAuth>
                        }
                      >
                        <Route index element={<SellerDashboard />} />
                        <Route path="listings" element={<SellerListings />} />
                        <Route path="listings/:id" element={<SellerListingDetail />} />
                        <Route path="listings/:id/edit" element={<EditListing />} />
                        <Route path="orders" element={<SellerOrders />} />
                        <Route path="earnings" element={<SellerEarnings />} />
                        <Route path="messages" element={<MessagesPage role="seller" />} />
                        <Route path="referrals" element={<Referrals />} />
                      </Route>
                      <Route
                        path="seller/new"
                        element={
                          <RequireAuth roles={['seller']}>
                            <NewListing />
                          </RequireAuth>
                        }
                      />

                      {/* ── buyer / dealer ── */}
                      <Route
                        path="buyer"
                        element={
                          <RequireAuth roles={['buyer']}>
                            <BuyerLayout />
                          </RequireAuth>
                        }
                      >
                        <Route index element={<BrowseListings />} />
                        <Route path="listing/:id" element={<BuyerListingDetail />} />
                        <Route path="offers" element={<BuyerOffers />} />
                        <Route path="orders" element={<BuyerOrders />} />
                        <Route path="wallet" element={<BuyerWallet />} />
                        <Route path="messages" element={<MessagesPage role="buyer" />} />
                      </Route>

                      {/* ── admin ── */}
                      <Route
                        path="admin"
                        element={
                          <RequireAuth roles={['admin']}>
                            <AdminLayout />
                          </RequireAuth>
                        }
                      >
                        <Route index element={<AdminOverview />} />
                        <Route path="buyers" element={<AdminBuyers />} />
                        <Route path="rates" element={<AdminRates />} />
                        <Route path="categories" element={<AdminCategories />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="listings" element={<AdminListings />} />
                        <Route path="disputes" element={<AdminDisputes />} />
                        <Route path="support" element={<AdminSupport />} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </ToastProvider>
        </AppStoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
