import * as React from 'react';
import type {
  AppNotification,
  Category,
  CategorySlug,
  Condition,
  Dispute,
  GeoPoint,
  Listing,
  Message,
  Offer,
  Order,
  OrderStatus,
  PaymentMode,
  Profile,
  Review,
  Role,
  ScrapRate,
  SupportTicket,
  TimeSlot,
  Payment,
} from '@/lib/types';
import {
  SEED_LISTINGS,
  SEED_MESSAGES,
  SEED_NOTIFICATIONS,
  SEED_OFFERS,
  SEED_ORDERS,
  SEED_PAYMENTS,
  SEED_REVIEWS,
  SEED_RATES,
  SEED_DISPUTES,
  SEED_TICKETS,
  SEED_USERS,
  THREAD_ID,
} from '@/data/seed';
import { CATEGORIES, co2Saved } from '@/data/categories';
import { RATE_MAP } from '@/data/seed';
import { isValidEmail, isValidPhone, uid } from '@/lib/utils';
import { translate, type Lang } from '@/lib/i18n';

/* ────────────────────────────────────────────────────────────────────────── *
 * Demo backend
 * ────────────────────────────────────────────────────────────────────────── *
 * All app state lives here and is persisted to localStorage so the app feels
 * fully functional without a server. Every mutation returns a result object
 * ({ ok, error }) so the UI can show validation errors inline.
 *
 * Swapping this for Supabase = replacing the mutation bodies with supabase
 * queries; the shapes already match `supabase/schema.sql`.
 * ────────────────────────────────────────────────────────────────────────── */

const STORAGE_KEY = 'scrapkart.state.v1';
// Bump this when the seed shape changes so old demo data is discarded.
const SCHEMA_VERSION = 3;

interface StoreUser extends Profile {
  password: string;
}

interface State {
  version: number;
  users: StoreUser[];
  currentUserId: string | null;
  categories: Category[];
  rates: ScrapRate[];
  listings: Listing[];
  orders: Order[];
  offers: Offer[];
  payments: Payment[];
  reviews: Review[];
  notifications: AppNotification[];
  messages: Message[];
  disputes: Dispute[];
  tickets: SupportTicket[];
  guestLang: Lang;
  /** phone → otp, only while an OTP flow is in progress */
  otp: Record<string, string>;
}

function seedState(): State {
  return {
    version: SCHEMA_VERSION,
    users: SEED_USERS,
    currentUserId: null,
    categories: CATEGORIES,
    rates: SEED_RATES,
    listings: SEED_LISTINGS,
    orders: SEED_ORDERS,
    offers: SEED_OFFERS,
    payments: SEED_PAYMENTS,
    reviews: SEED_REVIEWS,
    notifications: SEED_NOTIFICATIONS,
    messages: SEED_MESSAGES,
    disputes: SEED_DISPUTES,
    tickets: SEED_TICKETS,
    guestLang: 'en',
    otp: {},
  };
}

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedState();
    const parsed = JSON.parse(raw) as State;
    if (parsed.version !== SCHEMA_VERSION) return seedState();
    // Re-hydrate icon/tint data for categories & rates from source of truth,
    // so design tweaks don't need a version bump.
    return {
      ...seedState(),
      ...parsed,
      categories: parsed.categories?.length ? parsed.categories : CATEGORIES,
    };
  } catch {
    return seedState();
  }
}

export type Result<T = void> = { ok: true; data: T } | { ok: false; error: string };

const ok = <T,>(data: T): Result<T> => ({ ok: true, data });
const fail = (error: string): Result<never> => ({ ok: false, error });

/* ── types for the hook surface ──────────────────────────────────────────── */
export interface SignupInput {
  role: Role;
  name: string;
  phone: string;
  email?: string;
  password: string;
  city: string;
  state: string;
  language?: Lang;
  businessName?: string;
  gstin?: string;
  serviceAreas?: string[];
  referralCode?: string;
}

export interface ListingInput {
  category: CategorySlug;
  title: string;
  description: string;
  weightKg: number;
  condition: Condition;
  images: string[];
  pickup: GeoPoint;
  preferredDate: string;
  preferredSlot: TimeSlot;
  askingPrice: number | null;
}

interface AppStoreValue {
  state: State;
  currentUser: StoreUser | null;
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => string;
  /* auth */
  sendOtp: (phone: string) => Result<{ otp: string }>;
  verifyOtp: (phone: string, otp: string) => Result<StoreUser>;
  signup: (input: SignupInput) => Result<StoreUser>;
  login: (identifier: string, password: string) => Result<StoreUser>;
  loginAsDemo: (role: Role) => StoreUser | null;
  logout: () => void;
  /* profile */
  updateProfile: (patch: Partial<Profile>) => Result<void>;
  /* listings */
  createListing: (input: ListingInput) => Result<Listing>;
  updateListing: (id: string, patch: Partial<ListingInput>) => Result<Listing>;
  cancelListing: (id: string) => Result<void>;
  /* offers & orders */
  createOffer: (input: { listingId: string; ratePerKg: number; message: string; pickupDate: string }) => Result<Offer>;
  counterOffer: (offerId: string, ratePerKg: number) => Result<void>;
  acceptOffer: (offerId: string) => Result<Order>;
  rejectOffer: (offerId: string) => Result<void>;
  acceptListingAtRate: (listingId: string, ratePerKg: number) => Result<Order>;
  schedulePickup: (orderId: string, date: string, slot: TimeSlot) => Result<void>;
  markCollected: (orderId: string, finalWeightKg: number, paymentMode: PaymentMode) => Result<void>;
  payOrder: (orderId: string, mode: PaymentMode) => Result<void>;
  cancelOrder: (orderId: string, reason: string) => Result<void>;
  raiseDispute: (orderId: string, reason: string, details: string) => Result<void>;
  /* reviews */
  addReview: (input: { orderId: string; targetId: string; rating: number; comment: string }) => Result<void>;
  /* messaging */
  sendMessage: (input: { listingId: string; otherUserId: string; body: string }) => Result<Message>;
  markThreadRead: (threadId: string) => void;
  /* notifications */
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  /* admin */
  approveBuyer: (userId: string) => Result<void>;
  rejectBuyer: (userId: string, reason: string) => Result<void>;
  setRate: (category: CategorySlug, ratePerKg: number) => Result<void>;
  toggleCategory: (slug: CategorySlug) => Result<void>;
  suspendUser: (userId: string, reason: string) => Result<void>;
  reactivateUser: (userId: string) => Result<void>;
  resolveDispute: (disputeId: string, resolution: string, status: 'resolved' | 'rejected') => Result<void>;
  closeTicket: (ticketId: string) => Result<void>;
  createTicket: (input: Omit<SupportTicket, 'id' | 'status' | 'createdAt'>) => Result<void>;
  /* helpers */
  rateFor: (category: CategorySlug) => number;
  resetDemo: () => void;
}

const AppStoreContext = React.createContext<AppStoreValue | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = React.useState<State>(loadState);

  // Persist to localStorage on every change (debounced via microtask batching).
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full (large images) — fail silently, app still works in-memory */
    }
  }, [state]);

  const currentUser = React.useMemo(
    () => state.users.find((u) => u.id === state.currentUserId) ?? null,
    [state.users, state.currentUserId],
  );

  const lang: Lang = (currentUser?.language as Lang) ?? state.guestLang;

  const t = React.useCallback<AppStoreValue['t']>(
    (key, vars) => translate(lang, key, vars),
    [lang],
  );

  /* ── internal helpers ──────────────────────────────────────────────────── */
  const pushNotification = React.useCallback(
    (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
      setState((s) => ({
        ...s,
        notifications: [
          { ...n, id: uid('n'), createdAt: new Date().toISOString(), read: false },
          ...s.notifications,
        ],
      }));
    },
    [],
  );

  const rateFor = React.useCallback(
    (category: CategorySlug) => state.rates.find((r) => r.category === category)?.ratePerKg ?? RATE_MAP[category] ?? 0,
    [state.rates],
  );

  /** Create the order object shared by "accept offer" and "accept listing". */
  const buildOrder = React.useCallback(
    (
      listing: Listing,
      buyerId: string,
      ratePerKg: number,
      pickupDate: string,
      slot: TimeSlot,
    ): Order => ({
      id: uid('o'),
      code: `SK-${Math.floor(10000 + Math.random() * 89999)}`,
      listingId: listing.id,
      sellerId: listing.sellerId,
      buyerId,
      category: listing.category,
      agreedRate: ratePerKg,
      declaredWeightKg: listing.weightKg,
      finalWeightKg: null,
      amount: Math.round(ratePerKg * listing.weightKg * 100) / 100,
      status: 'accepted',
      pickupDate,
      pickupSlot: slot,
      paymentMode: null,
      paymentId: null,
      createdAt: new Date().toISOString(),
      timeline: [
        { status: 'created', at: new Date().toISOString(), note: 'Listing published' },
        { status: 'accepted', at: new Date().toISOString(), note: `Deal at ₹${ratePerKg}/kg` },
      ],
    }),
    [],
  );

  /* ── auth ──────────────────────────────────────────────────────────────── */
  const sendOtp = React.useCallback<AppStoreValue['sendOtp']>((phone) => {
    const digits = phone.replace(/\D/g, '');
    if (!isValidPhone(digits)) return fail('Enter a valid 10-digit Indian mobile number');
    // Demo mode: generate a 6-digit OTP and surface it in the UI.
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setState((s) => ({ ...s, otp: { ...s.otp, [digits]: otp } }));
    return ok({ otp });
  }, []);

  const verifyOtp = React.useCallback<AppStoreValue['verifyOtp']>(
    (phone, otp) => {
      const digits = phone.replace(/\D/g, '');
      const expected = state.otp[digits];
      if (!expected) return fail('Please request an OTP first');
      if (otp.trim() !== expected) return fail('Incorrect OTP. Please check and try again.');

      const existing = state.users.find((u) => u.phone === digits);
      if (!existing) return fail('No account found for this number. Please sign up first.');
      if (existing.status === 'suspended')
        return fail(existing.suspendedReason ?? 'This account is suspended. Contact support.');

      setState((s) => ({ ...s, currentUserId: existing.id }));
      return ok(existing);
    },
    [state.otp, state.users],
  );

  const signup = React.useCallback<AppStoreValue['signup']>(
    (input) => {
      const phone = input.phone.replace(/\D/g, '');
      if (!input.name.trim() || input.name.trim().length < 2) return fail('Please enter your full name');
      if (!isValidPhone(phone)) return fail('Enter a valid 10-digit Indian mobile number');
      if (input.email && !isValidEmail(input.email)) return fail('Enter a valid email address');
      if (input.password.length < 6) return fail('Password must be at least 6 characters');
      if (state.users.some((u) => u.phone === phone))
        return fail('An account with this phone number already exists. Please log in.');
      if (input.role === 'buyer' && !input.businessName?.trim())
        return fail('Business / shop name is required for dealers');
      if (input.role !== 'buyer' && input.role !== 'seller') return fail('Choose whether you are selling or buying');

      let rewardPoints = 0;
      if (input.referralCode) {
        const referrer = state.users.find(
          (u) => u.referralCode.toLowerCase() === input.referralCode!.trim().toLowerCase(),
        );
        if (!referrer) return fail('That referral code does not exist');
        rewardPoints = 50; // welcome bonus for referred user
      }

      const user: StoreUser = {
        id: uid('u'),
        role: input.role,
        name: input.name.trim(),
        phone,
        email: input.email?.trim() || null,
        city: input.city.trim() || 'Nagpur',
        state: input.state.trim() || 'Maharashtra',
        language: input.language ?? 'en',
        businessName: input.role === 'buyer' ? input.businessName?.trim() ?? null : null,
        gstin: input.gstin?.trim() || null,
        serviceAreas: input.serviceAreas ?? (input.role === 'buyer' ? [input.city || 'Nagpur'] : []),
        verificationStatus: input.role === 'buyer' ? 'pending' : 'approved',
        rating: 0,
        ratingCount: 0,
        listingsCount: 0,
        completedOrders: 0,
        walletBalance: 0,
        rewardPoints,
        referralCode: `${input.name.split(' ')[0].toUpperCase().slice(0, 6)}${Math.floor(10 + Math.random() * 89)}`,
        referredBy: input.referralCode?.trim().toUpperCase() || null,
        createdAt: new Date().toISOString(),
        status: 'active',
        password: input.password,
      };

      setState((s) => ({ ...s, users: [...s.users, user], currentUserId: user.id }));

      // Notify admins about new dealer applications.
      if (user.role === 'buyer') {
        const admins = state.users.filter((u) => u.role === 'admin');
        admins.forEach((a) =>
          pushNotification({
            userId: a.id,
            kind: 'approval',
            title: 'New dealer registration',
            body: `${user.businessName} applied for a dealer account in ${user.city}.`,
            href: '/admin/buyers',
          }),
        );
      }
      // Credit the referrer.
      if (input.referralCode) {
        setState((s) => ({
          ...s,
          users: s.users.map((u) =>
            u.referralCode.toLowerCase() === input.referralCode!.trim().toLowerCase()
              ? { ...u, rewardPoints: (u.rewardPoints ?? 0) + 100 }
              : u,
          ),
        }));
      }
      return ok(user);
    },
    [state.users, pushNotification],
  );

  const login = React.useCallback<AppStoreValue['login']>(
    (identifier, password) => {
      const id = identifier.trim().toLowerCase();
      const digits = identifier.replace(/\D/g, '');
      const user = state.users.find(
        (u) => u.phone === digits || (u.email && u.email.toLowerCase() === id),
      );
      if (!user) return fail('No account found with that phone number or email');
      if (user.password !== password) return fail('Incorrect password');
      if (user.status === 'suspended') return fail(user.suspendedReason ?? 'This account is suspended. Contact support.');
      setState((s) => ({ ...s, currentUserId: user.id }));
      return ok(user);
    },
    [state.users],
  );

  const loginAsDemo = React.useCallback<AppStoreValue['loginAsDemo']>(
    (role) => {
      const user =
        state.users.find((u) => u.id === `u_${role}_demo`) ??
        state.users.find((u) => u.role === role && u.status === 'active') ??
        null;
      if (user) setState((s) => ({ ...s, currentUserId: user.id }));
      return user;
    },
    [state.users],
  );

  const logout = React.useCallback(() => setState((s) => ({ ...s, currentUserId: null })), []);

  const updateProfile = React.useCallback<AppStoreValue['updateProfile']>(
    (patch) => {
      if (!currentUser) return fail('You must be logged in');
      if (patch.email && !isValidEmail(patch.email)) return fail('Enter a valid email address');
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === currentUser.id ? { ...u, ...patch } : u)),
      }));
      return ok(undefined);
    },
    [currentUser],
  );

  /* ── listings ──────────────────────────────────────────────────────────── */
  const createListing = React.useCallback<AppStoreValue['createListing']>(
    (input) => {
      if (!currentUser) return fail('Please log in to create a listing');
      if (currentUser.role !== 'seller') return fail('Only seller accounts can create listings');
      if (currentUser.status === 'suspended') return fail('Your account is suspended. Contact support.');
      if (!input.category) return fail('Choose a scrap category');
      if (!input.title.trim() || input.title.trim().length < 4) return fail('Add a short title (at least 4 characters)');
      if (!(input.weightKg > 0)) return fail('Enter the approximate weight in kg');
      if (input.weightKg > 50000) return fail('For over 50 tonnes please contact our bulk desk');
      if (input.images.length === 0) return fail('Add at least 1 photo so dealers can assess quality');
      if (input.images.length > 5) return fail('You can upload up to 5 photos');
      if (!input.pickup.address.trim()) return fail('Add your pickup address');
      if (input.pickup.address.trim().length < 8) return fail('Please add a more complete pickup address');
      if (!input.pickup.pincode || !/^\d{6}$/.test(input.pickup.pincode)) return fail('Enter a valid 6-digit pincode');
      if (!(input.pickup.lat && input.pickup.lng)) return fail('Drop a pin on the map for pickup location');
      if (!input.preferredDate) return fail('Choose a preferred pickup date');
      if (new Date(input.preferredDate) < new Date(new Date().toDateString()))
        return fail('Pickup date cannot be in the past');
      if (input.askingPrice !== null && !(input.askingPrice > 0))
        return fail('Asking price must be greater than zero');

      const rate = rateFor(input.category);
      const listing: Listing = {
        id: uid('l'),
        sellerId: currentUser.id,
        category: input.category,
        title: input.title.trim(),
        description: input.description.trim(),
        weightKg: input.weightKg,
        condition: input.condition,
        images: input.images.slice(0, 5),
        pickup: input.pickup,
        preferredDate: input.preferredDate,
        preferredSlot: input.preferredSlot,
        askingPrice: input.askingPrice,
        estimatedPrice: Math.round(input.weightKg * (input.askingPrice ?? rate)),
        status: 'listed',
        views: 0,
        offerCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setState((s) => ({
        ...s,
        listings: [listing, ...s.listings],
        users: s.users.map((u) => (u.id === currentUser.id ? { ...u, listingsCount: (u.listingsCount ?? 0) + 1 } : u)),
      }));

      // Notify nearby verified dealers.
      state.users
        .filter((u) => u.role === 'buyer' && u.verificationStatus === 'approved' && u.id !== currentUser.id)
        .slice(0, 3)
        .forEach((buyer) =>
          pushNotification({
            userId: buyer.id,
            kind: 'order',
            title: `New ${input.category} listing near you`,
            body: `${input.weightKg} kg in ${input.pickup.city} — ${input.title}`,
            href: `/buyer/listing/${listing.id}`,
          }),
        );

      return ok(listing);
    },
    [currentUser, rateFor, state.users, pushNotification],
  );

  const updateListing = React.useCallback<AppStoreValue['updateListing']>(
    (id, patch) => {
      const listing = state.listings.find((l) => l.id === id);
      if (!listing) return fail('Listing not found');
      if (!currentUser || listing.sellerId !== currentUser.id) return fail('You can only edit your own listings');
      if (!['listed', 'accepted'].includes(listing.status))
        return fail('This listing can no longer be edited because a pickup is in progress');
      if (patch.askingPrice !== undefined && patch.askingPrice !== null && !(patch.askingPrice > 0))
        return fail('Asking price must be greater than zero');
      if (patch.weightKg !== undefined && !(patch.weightKg > 0)) return fail('Weight must be greater than zero');

      const rate = rateFor(patch.category ?? listing.category);
      const weight = patch.weightKg ?? listing.weightKg;
      const asking = patch.askingPrice !== undefined ? patch.askingPrice : listing.askingPrice;
      const updated: Listing = {
        ...listing,
        ...patch,
        images: patch.images ? patch.images.slice(0, 5) : listing.images,
        estimatedPrice: Math.round(weight * (asking ?? rate)),
        updatedAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, listings: s.listings.map((l) => (l.id === id ? updated : l)) }));
      return ok(updated);
    },
    [currentUser, rateFor, state.listings],
  );

  const cancelListing = React.useCallback<AppStoreValue['cancelListing']>(
    (id) => {
      const listing = state.listings.find((l) => l.id === id);
      if (!listing) return fail('Listing not found');
      if (!currentUser) return fail('Please log in');
      const isAdmin = currentUser.role === 'admin';
      if (!isAdmin && listing.sellerId !== currentUser.id) return fail('You can only cancel your own listings');
      if (['picked_up', 'paid'].includes(listing.status))
        return fail('Collected listings cannot be cancelled');
      setState((s) => ({
        ...s,
        listings: s.listings.map((l) =>
          l.id === id ? { ...l, status: 'cancelled', updatedAt: new Date().toISOString() } : l,
        ),
        offers: s.offers.map((o) =>
          o.listingId === id && o.status === 'pending' ? { ...o, status: 'withdrawn' } : o,
        ),
      }));
      // Tell interested dealers the listing is gone.
      state.offers
        .filter((o) => o.listingId === id && o.status === 'pending')
        .forEach((o) =>
          pushNotification({
            userId: o.buyerId,
            kind: 'system',
            title: 'Listing withdrawn',
            body: `The seller cancelled "${listing.title}".`,
            href: '/buyer',
          }),
        );
      return ok(undefined);
    },
    [currentUser, state.listings, state.offers, pushNotification],
  );

  /* ── offers ────────────────────────────────────────────────────────────── */
  const createOffer = React.useCallback<AppStoreValue['createOffer']>(
    ({ listingId, ratePerKg, message, pickupDate }) => {
      if (!currentUser) return fail('Please log in as a dealer');
      if (currentUser.role !== 'buyer') return fail('Only dealer accounts can send offers');
      if (currentUser.verificationStatus !== 'approved')
        return fail('Your dealer account is pending approval. You can browse but not bid yet.');
      const listing = state.listings.find((l) => l.id === listingId);
      if (!listing) return fail('Listing not found');
      if (listing.sellerId === currentUser.id) return fail('You cannot bid on your own listing');
      if (listing.status !== 'listed') return fail('This listing is no longer open for offers');
      if (!(ratePerKg > 0)) return fail('Enter your rate per kg');
      // Guard against absurd offers (> 3x market) — usually a typo.
      const market = rateFor(listing.category);
      if (ratePerKg > market * 3 || ratePerKg < market * 0.2)
        return fail(`Rate looks off. Today's ${listing.category} rate is ₹${market}/kg.`);
      if (!pickupDate) return fail('Choose a pickup date you can commit to');
      if (state.offers.some((o) => o.listingId === listingId && o.buyerId === currentUser.id && o.status === 'pending'))
        return fail('You already have a pending offer on this listing');

      const offer: Offer = {
        id: uid('of'),
        listingId,
        buyerId: currentUser.id,
        sellerId: listing.sellerId,
        ratePerKg,
        amount: Math.round(ratePerKg * listing.weightKg),
        message: message.trim(),
        pickupDate,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        offers: [offer, ...s.offers],
        listings: s.listings.map((l) =>
          l.id === listingId ? { ...l, offerCount: l.offerCount + 1, updatedAt: new Date().toISOString() } : l,
        ),
      }));
      pushNotification({
        userId: listing.sellerId,
        kind: 'offer',
        title: `New offer on ${listing.title}`,
        body: `${currentUser.businessName ?? currentUser.name} offered ₹${ratePerKg}/kg.`,
        href: `/seller/listings/${listingId}`,
      });
      return ok(offer);
    },
    [currentUser, state.listings, state.offers, rateFor, pushNotification],
  );

  const counterOffer = React.useCallback<AppStoreValue['counterOffer']>(
    (offerId, ratePerKg) => {
      const offer = state.offers.find((o) => o.id === offerId);
      if (!offer) return fail('Offer not found');
      if (!currentUser || currentUser.id !== offer.sellerId) return fail('Only the seller can counter an offer');
      if (!(ratePerKg > 0)) return fail('Enter a valid rate');
      setState((s) => ({
        ...s,
        offers: s.offers.map((o) =>
          o.id === offerId
            ? {
                ...o,
                status: 'countered',
                ratePerKg,
                amount: Math.round(ratePerKg * (s.listings.find((l) => l.id === o.listingId)?.weightKg ?? 1)),
              }
            : o,
        ),
      }));
      pushNotification({
        userId: offer.buyerId,
        kind: 'offer',
        title: 'Counter offer received',
        body: `Seller proposed ₹${ratePerKg}/kg on your offer.`,
        href: `/buyer/listing/${offer.listingId}`,
      });
      return ok(undefined);
    },
    [currentUser, state.offers, state.listings, pushNotification],
  );

  const rejectOffer = React.useCallback<AppStoreValue['rejectOffer']>(
    (offerId) => {
      const offer = state.offers.find((o) => o.id === offerId);
      if (!offer) return fail('Offer not found');
      if (!currentUser || (currentUser.id !== offer.sellerId && currentUser.id !== offer.buyerId))
        return fail('Not allowed');
      setState((s) => ({
        ...s,
        offers: s.offers.map((o) => (o.id === offerId ? { ...o, status: 'rejected' } : o)),
      }));
      pushNotification({
        userId: currentUser.id === offer.sellerId ? offer.buyerId : offer.sellerId,
        kind: 'offer',
        title: 'Offer declined',
        body: `The offer on ${state.listings.find((l) => l.id === offer.listingId)?.title ?? 'a listing'} was declined.`,
        href: '/',
      });
      return ok(undefined);
    },
    [currentUser, state.offers, state.listings, pushNotification],
  );

  const acceptOffer = React.useCallback<AppStoreValue['acceptOffer']>(
    (offerId) => {
      const offer = state.offers.find((o) => o.id === offerId);
      if (!offer) return fail('Offer not found');
      if (!currentUser) return fail('Please log in');
      if (currentUser.id !== offer.sellerId) return fail('Only the seller can accept this offer');
      const listing = state.listings.find((l) => l.id === offer.listingId);
      if (!listing) return fail('Listing not found');
      if (listing.status !== 'listed') return fail('This listing already has an accepted deal');

      const order = buildOrder(listing, offer.buyerId, offer.ratePerKg, offer.pickupDate, listing.preferredSlot);
      setState((s) => ({
        ...s,
        orders: [order, ...s.orders],
        offers: s.offers.map((o) =>
          o.listingId === listing.id
            ? { ...o, status: o.id === offerId ? 'accepted' : o.status === 'pending' ? 'rejected' : o.status }
            : o,
        ),
        listings: s.listings.map((l) =>
          l.id === listing.id
            ? {
                ...l,
                status: 'accepted',
                acceptedBuyerId: offer.buyerId,
                orderId: order.id,
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      }));
      pushNotification({
        userId: offer.buyerId,
        kind: 'order',
        title: 'Offer accepted 🎉',
        body: `${listing.title} — you can now schedule the pickup.`,
        href: `/buyer/orders/${order.id}`,
      });
      return ok(order);
    },
    [currentUser, state.offers, state.listings, buildOrder, pushNotification],
  );

  const acceptListingAtRate = React.useCallback<AppStoreValue['acceptListingAtRate']>(
    (listingId, ratePerKg) => {
      if (!currentUser) return fail('Please log in as a dealer');
      if (currentUser.role !== 'buyer') return fail('Only dealers can accept listings');
      if (currentUser.verificationStatus !== 'approved') return fail('Your dealer account is pending approval');
      const listing = state.listings.find((l) => l.id === listingId);
      if (!listing) return fail('Listing not found');
      if (listing.status !== 'listed') return fail('This listing is no longer available');
      if (!(ratePerKg > 0)) return fail('Enter a valid rate');

      const order = buildOrder(listing, currentUser.id, ratePerKg, listing.preferredDate, listing.preferredSlot);
      setState((s) => ({
        ...s,
        orders: [order, ...s.orders],
        offers: s.offers.map((o) =>
          o.listingId === listingId && o.status === 'pending' ? { ...o, status: 'rejected' } : o,
        ),
        listings: s.listings.map((l) =>
          l.id === listingId
            ? {
                ...l,
                status: 'accepted',
                acceptedBuyerId: currentUser.id,
                orderId: order.id,
                updatedAt: new Date().toISOString(),
              }
            : l,
        ),
      }));
      pushNotification({
        userId: listing.sellerId,
        kind: 'order',
        title: 'Your listing was accepted',
        body: `${currentUser.businessName ?? currentUser.name} accepted at ₹${ratePerKg}/kg. Pickup ${listing.preferredDate}.`,
        href: `/seller/orders/${order.id}`,
      });
      return ok(order);
    },
    [currentUser, state.listings, state.offers, buildOrder, pushNotification],
  );

  /* ── orders ────────────────────────────────────────────────────────────── */
  const schedulePickup = React.useCallback<AppStoreValue['schedulePickup']>(
    (orderId, date, slot) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return fail('Order not found');
      if (!currentUser || ![order.sellerId, order.buyerId].includes(currentUser.id))
        return fail('Not allowed');
      if (!date) return fail('Choose a pickup date');
      if (new Date(date) < new Date(new Date().toDateString())) return fail('Pickup date cannot be in the past');
      if (['picked_up', 'paid', 'cancelled'].includes(order.status))
        return fail('This order can no longer be rescheduled');

      const ts = new Date().toISOString();
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'pickup_scheduled',
                pickupDate: date,
                pickupSlot: slot,
                scheduledAt: ts,
                timeline: [
                  ...o.timeline,
                  { status: 'pickup_scheduled', at: ts, note: `Pickup ${date} · ${slot}` },
                ],
              }
            : o,
        ),
        listings: s.listings.map((l) =>
          l.id === order.listingId
            ? { ...l, status: 'scheduled', preferredDate: date, preferredSlot: slot, updatedAt: ts }
            : l,
        ),
      }));
      pushNotification({
        userId: currentUser.id === order.sellerId ? order.buyerId : order.sellerId,
        kind: 'pickup',
        title: 'Pickup scheduled',
        body: `Order ${order.code} — ${date}, ${slot}.`,
        href: `/${currentUser.id === order.sellerId ? 'buyer' : 'seller'}/orders/${orderId}`,
      });
      return ok(undefined);
    },
    [currentUser, state.orders, pushNotification],
  );

  const markCollected = React.useCallback<AppStoreValue['markCollected']>(
    (orderId, finalWeightKg, paymentMode) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return fail('Order not found');
      if (!currentUser || currentUser.id !== order.buyerId) return fail('Only the dealer can mark a pickup as collected');
      if (!['accepted', 'pickup_scheduled'].includes(order.status))
        return fail('This order is not awaiting collection');
      if (!(finalWeightKg > 0)) return fail('Enter the final weighed quantity');
      if (finalWeightKg > order.declaredWeightKg * 2)
        return fail('Final weight looks too high — please recheck the scale');

      const ts = new Date().toISOString();
      const amount = Math.round(finalWeightKg * order.agreedRate * 100) / 100;

      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'picked_up',
                finalWeightKg,
                amount,
                paymentMode,
                pickedUpAt: ts,
                timeline: [
                  ...o.timeline,
                  { status: 'picked_up', at: ts, note: `Weighed ${finalWeightKg} kg · ₹${amount}` },
                ],
              }
            : o,
        ),
        listings: s.listings.map((l) => (l.id === order.listingId ? { ...l, status: 'picked_up', updatedAt: ts } : l)),
      }));
      pushNotification({
        userId: order.sellerId,
        kind: 'payment',
        title: 'Scrap collected — payment due',
        body: `${finalWeightKg} kg collected for order ${order.code}. Amount ₹${amount.toLocaleString('en-IN')}.`,
        href: `/seller/orders/${orderId}`,
      });
      return ok(undefined);
    },
    [currentUser, state.orders, pushNotification],
  );

  const payOrder = React.useCallback<AppStoreValue['payOrder']>(
    (orderId, mode) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return fail('Order not found');
      if (!currentUser || ![order.sellerId, order.buyerId].includes(currentUser.id))
        return fail('Not allowed');
      if (order.status !== 'picked_up') return fail('Payment is due only after collection');

      const ts = new Date().toISOString();
      const paymentId = uid('p');
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'paid',
                paymentMode: mode,
                paymentId,
                paidAt: ts,
                timeline: [
                  ...o.timeline,
                  {
                    status: 'paid',
                    at: ts,
                    note: mode === 'cash' ? 'Cash on pickup settled' : `Paid ₹${o.amount} via ${mode.toUpperCase()}`,
                  },
                ],
              }
            : o,
        ),
        payments: [
          {
            id: paymentId,
            orderId,
            userId: order.sellerId,
            amount: order.amount,
            mode,
            status: 'success',
            reference:
              mode === 'cash'
                ? `CASH-${order.code}`
                : `PAY-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
            createdAt: ts,
          },
          ...s.payments,
        ],
        listings: s.listings.map((l) => (l.id === order.listingId ? { ...l, status: 'paid', updatedAt: ts } : l)),
        users: s.users.map((u) => {
          if (u.id === order.sellerId)
            return {
              ...u,
              walletBalance: (u.walletBalance ?? 0) + order.amount,
              completedOrders: (u.completedOrders ?? 0) + 1,
              // 1 reward point per ₹20 earned
              rewardPoints: (u.rewardPoints ?? 0) + Math.floor(order.amount / 20),
            };
          if (u.id === order.buyerId)
            return { ...u, completedOrders: (u.completedOrders ?? 0) + 1 };
          return u;
        }),
      }));
      pushNotification({
        userId: order.sellerId,
        kind: 'payment',
        title: `₹${order.amount.toLocaleString('en-IN')} received`,
        body: `Payment for ${order.code} settled via ${mode === 'cash' ? 'cash' : mode.toUpperCase()}.`,
        href: '/seller/earnings',
      });
      return ok(undefined);
    },
    [currentUser, state.orders, pushNotification],
  );

  const cancelOrder = React.useCallback<AppStoreValue['cancelOrder']>(
    (orderId, reason) => {
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return fail('Order not found');
      if (!currentUser) return fail('Please log in');
      const isParty = [order.sellerId, order.buyerId].includes(currentUser.id);
      if (!isParty && currentUser.role !== 'admin') return fail('Not allowed');
      if (['picked_up', 'paid'].includes(order.status))
        return fail('Collected orders cannot be cancelled — raise a dispute instead');

      const ts = new Date().toISOString();
      setState((s) => ({
        ...s,
        orders: s.orders.map((o) =>
          o.id === orderId
            ? {
                ...o,
                status: 'cancelled',
                timeline: [...o.timeline, { status: 'cancelled', at: ts, note: reason || 'Cancelled' }],
              }
            : o,
        ),
        // Return the listing to the marketplace if the pickup had not happened.
        listings: s.listings.map((l) =>
          l.id === order.listingId && l.status !== 'picked_up'
            ? { ...l, status: 'listed', acceptedBuyerId: null, orderId: null, updatedAt: ts }
            : l,
        ),
      }));
      pushNotification({
        userId: currentUser.id === order.sellerId ? order.buyerId : order.sellerId,
        kind: 'order',
        title: 'Order cancelled',
        body: `${order.code} was cancelled. Reason: ${reason || 'not specified'}.`,
        href: '/',
      });
      return ok(undefined);
    },
    [currentUser, state.orders, pushNotification],
  );

  const raiseDispute = React.useCallback<AppStoreValue['raiseDispute']>(
    (orderId, reason, details) => {
      if (!currentUser) return fail('Please log in');
      const order = state.orders.find((o) => o.id === orderId);
      if (!order) return fail('Order not found');
      if (!details.trim()) return fail('Please describe the issue');
      const dispute: Dispute = {
        id: uid('d'),
        orderId,
        raisedBy: currentUser.id,
        against: currentUser.id === order.sellerId ? order.buyerId : order.sellerId,
        reason,
        details: details.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({
        ...s,
        disputes: [dispute, ...s.disputes],
        orders: s.orders.map((o) => (o.id === orderId ? { ...o, status: 'disputed' } : o)),
      }));
      state.users
        .filter((u) => u.role === 'admin')
        .forEach((a) =>
          pushNotification({
            userId: a.id,
            kind: 'system',
            title: 'Dispute raised',
            body: `${order.code}: ${reason}`,
            href: '/admin/disputes',
          }),
        );
      return ok(undefined);
    },
    [currentUser, state.orders, state.users, pushNotification],
  );

  /* ── reviews ───────────────────────────────────────────────────────────── */
  const addReview = React.useCallback<AppStoreValue['addReview']>(
    ({ orderId, targetId, rating, comment }) => {
      if (!currentUser) return fail('Please log in');
      if (!(rating >= 1 && rating <= 5)) return fail('Choose a rating');
      if (!comment.trim()) return fail('Please write a short review');
      if (state.reviews.some((r) => r.orderId === orderId && r.authorId === currentUser.id))
        return fail('You already reviewed this order');
      const review: Review = {
        id: uid('r'),
        orderId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        targetId,
        rating,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      };
      setState((s) => {
        const target = s.users.find((u) => u.id === targetId);
        const count = (target?.ratingCount ?? 0) + 1;
        const avg = ((target?.rating ?? 0) * (count - 1) + rating) / count;
        return {
          ...s,
          reviews: [review, ...s.reviews],
          users: s.users.map((u) =>
            u.id === targetId ? { ...u, rating: Math.round(avg * 10) / 10, ratingCount: count } : u,
          ),
        };
      });
      pushNotification({
        userId: targetId,
        kind: 'system',
        title: `New ${rating}★ review`,
        body: comment.trim().slice(0, 90),
        href: '/profile',
      });
      return ok(undefined);
    },
    [currentUser, state.reviews, pushNotification],
  );

  /* ── messaging ─────────────────────────────────────────────────────────── */
  const sendMessage = React.useCallback<AppStoreValue['sendMessage']>(
    ({ listingId, otherUserId, body }) => {
      if (!currentUser) return fail('Please log in to chat');
      if (!body.trim()) return fail('Type a message');
      const threadId = THREAD_ID(listingId, currentUser.id, otherUserId);
      const message: Message = {
        id: uid('m'),
        threadId,
        senderId: currentUser.id,
        body: body.trim(),
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, messages: [...s.messages, message] }));
      pushNotification({
        userId: otherUserId,
        kind: 'chat',
        title: `New message from ${currentUser.name.split(' ')[0]}`,
        body: body.trim().slice(0, 90),
        href: `/${currentUser.role === 'seller' ? 'buyer' : 'seller'}/messages`,
      });
      return ok(message);
    },
    [currentUser, pushNotification],
  );

  const markThreadRead = React.useCallback((threadId: string) => {
    setState((s) => ({
      ...s,
      messages: s.messages.map((m) =>
        m.threadId === threadId && !m.readAt ? { ...m, readAt: new Date().toISOString() } : m,
      ),
    }));
  }, []);

  /* ── notifications ─────────────────────────────────────────────────────── */
  const markNotificationRead = React.useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead = React.useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) =>
        !currentUser || n.userId === currentUser.id ? { ...n, read: true } : n,
      ),
    }));
  }, [currentUser]);

  /* ── admin ─────────────────────────────────────────────────────────────── */
  const approveBuyer = React.useCallback<AppStoreValue['approveBuyer']>(
    (userId) => {
      if (!currentUser || currentUser.role !== 'admin') return fail('Admin access required');
      const user = state.users.find((u) => u.id === userId);
      if (!user) return fail('User not found');
      setState((s) => ({
        ...s,
        users: s.users.map((u) => (u.id === userId ? { ...u, verificationStatus: 'approved' } : u)),
      }));
      pushNotification({
        userId,
        kind: 'approval',
        title: 'Dealer account approved ✅',
        body: 'You can now browse listings and send offers on ScrapKart.',
        href: '/buyer',
      });
      return ok(undefined);
    },
    [currentUser, state.users, pushNotification],
  );

  const rejectBuyer = React.useCallback<AppStoreValue['rejectBuyer']>(
    (userId, reason) => {
      if (!currentUser || currentUser.role !== 'admin') return fail('Admin access required');
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === userId ? { ...u, verificationStatus: 'rejected', suspendedReason: reason } : u,
        ),
      }));
      pushNotification({
        userId,
        kind: 'approval',
        title: 'Dealer application rejected',
        body: reason || 'Your documents could not be verified.',
        href: '/support',
      });
      return ok(undefined);
    },
    [currentUser, pushNotification],
  );

  const setRate = React.useCallback<AppStoreValue['setRate']>(
    (category, ratePerKg) => {
      if (!currentUser || currentUser.role !== 'admin') return fail('Admin access required');
      if (!(ratePerKg > 0)) return fail('Rate must be greater than zero');
      setState((s) => {
        const ts = new Date().toISOString();
        const today = ts.slice(0, 10);
        const exists = s.rates.some((r) => r.category === category);
        const rates = exists
          ? s.rates.map((r) =>
              r.category === category
                ? {
                    ...r,
                    ratePerKg,
                    changePct:
                      r.ratePerKg > 0
                        ? Math.round(((ratePerKg - r.ratePerKg) / r.ratePerKg) * 1000) / 10
                        : 0,
                    updatedAt: ts,
                    history: [...r.history.slice(1), { date: today, rate: ratePerKg }],
                  }
                : r,
            )
          : [
              ...s.rates,
              { id: uid('rate'), category, ratePerKg, changePct: 0, updatedAt: ts, history: [] },
            ];
        return { ...s, rates };
      });
      return ok(undefined);
    },
    [currentUser],
  );

  const toggleCategory = React.useCallback<AppStoreValue['toggleCategory']>(
    (slug) => {
      if (!currentUser || currentUser.role !== 'admin') return fail('Admin access required');
      setState((s) => ({
        ...s,
        categories: s.categories.map((c) => (c.slug === slug ? { ...c, active: !c.active } : c)),
      }));
      return ok(undefined);
    },
    [currentUser],
  );

  const suspendUser = React.useCallback<AppStoreValue['suspendUser']>(
    (userId, reason) => {
      if (!currentUser || currentUser.role !== 'admin') return fail('Admin access required');
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === userId ? { ...u, status: 'suspended', suspendedReason: reason } : u,
        ),
      }));
      return ok(undefined);
    },
    [currentUser],
  );

  const reactivateUser = React.useCallback<AppStoreValue['reactivateUser']>(
    (userId) => {
      if (!currentUser || currentUser.role !== 'admin') return fail('Admin access required');
      setState((s) => ({
        ...s,
        users: s.users.map((u) =>
          u.id === userId ? { ...u, status: 'active', suspendedReason: null } : u,
        ),
      }));
      return ok(undefined);
    },
    [currentUser],
  );

  const resolveDispute = React.useCallback<AppStoreValue['resolveDispute']>(
    (disputeId, resolution, status) => {
      if (!currentUser || currentUser.role !== 'admin') return fail('Admin access required');
      setState((s) => ({
        ...s,
        disputes: s.disputes.map((d) => (d.id === disputeId ? { ...d, resolution, status } : d)),
      }));
      return ok(undefined);
    },
    [currentUser],
  );

  const closeTicket = React.useCallback<AppStoreValue['closeTicket']>(
    (ticketId) => {
      setState((s) => ({
        ...s,
        tickets: s.tickets.map((t) => (t.id === ticketId ? { ...t, status: 'closed' } : t)),
      }));
      return ok(undefined);
    },
    [],
  );

  const createTicket = React.useCallback<AppStoreValue['createTicket']>(
    (input) => {
      if (!input.name.trim() || !input.phone.trim() || !input.subject.trim() || !input.message.trim())
        return fail('Please fill in all fields');
      if (!isValidPhone(input.phone)) return fail('Enter a valid 10-digit mobile number');
      if (input.message.trim().length < 10) return fail('Please describe your issue in a little more detail');
      const ticket: SupportTicket = {
        ...input,
        id: uid('t'),
        status: 'open',
        createdAt: new Date().toISOString(),
      };
      setState((s) => ({ ...s, tickets: [ticket, ...s.tickets] }));
      return ok(undefined);
    },
    [],
  );

  const resetDemo = React.useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setState(seedState());
  }, []);

  const setLang = React.useCallback(
    (l: Lang) => {
      setState((s) => ({
        ...s,
        guestLang: l,
        users: s.users.map((u) => (u.id === s.currentUserId ? { ...u, language: l } : u)),
      }));
    },
    [],
  );

  const value: AppStoreValue = {
    state,
    currentUser,
    lang,
    setLang,
    t,
    sendOtp,
    verifyOtp,
    signup,
    login,
    loginAsDemo,
    logout,
    updateProfile,
    createListing,
    updateListing,
    cancelListing,
    createOffer,
    counterOffer,
    acceptOffer,
    rejectOffer,
    acceptListingAtRate,
    schedulePickup,
    markCollected,
    payOrder,
    cancelOrder,
    raiseDispute,
    addReview,
    sendMessage,
    markThreadRead,
    markNotificationRead,
    markAllNotificationsRead,
    approveBuyer,
    rejectBuyer,
    setRate,
    toggleCategory,
    suspendUser,
    reactivateUser,
    resolveDispute,
    closeTicket,
    createTicket,
    rateFor,
    resetDemo,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const ctx = React.useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used inside <AppStoreProvider>');
  return ctx;
}

/* Re-export a few convenience selectors used across pages. */
export { co2Saved, CATEGORIES, RATE_MAP };
export type { StoreUser };
