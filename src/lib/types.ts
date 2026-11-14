/**
 * ScrapKart domain types.
 * These mirror the Supabase Postgres schema in `supabase/schema.sql` 1:1,
 * so the demo repository layer and the live Supabase layer are interchangeable.
 */

export type Role = 'seller' | 'buyer' | 'admin';

export type CategorySlug =
  | 'plastic'
  | 'paper'
  | 'cardboard'
  | 'steel'
  | 'iron'
  | 'aluminium'
  | 'copper'
  | 'ewaste'
  | 'glass'
  | 'other';

export type Condition = 'clean' | 'mixed' | 'dirty';

export type Unit = 'kg' | 'tonne' | 'piece';

export interface Category {
  slug: CategorySlug;
  name: string;
  nameHi: string;
  nameMr: string;
  icon: string;          // lucide icon key, mapped in components/CategoryIcon.tsx
  tint: string;          // tailwind classes for the icon tile
  description: string;
  unit: Unit;
  active: boolean;
  sortOrder: number;
}

export interface ScrapRate {
  id: string;
  category: CategorySlug;
  ratePerKg: number;     // ₹ per kg
  changePct: number;     // vs yesterday, for the sparkline chip
  updatedAt: string;
  history: { date: string; rate: number }[]; // last 14 days
}

export type ListingStatus =
  | 'listed'        // waiting for offers
  | 'accepted'      // a dealer accepted / seller accepted an offer
  | 'scheduled'     // pickup scheduled
  | 'picked_up'     // collected by dealer
  | 'paid'          // payment settled
  | 'cancelled';

export interface GeoPoint {
  lat: number;
  lng: number;
  address: string;
  city: string;
  pincode: string;
}

export interface Listing {
  id: string;
  sellerId: string;
  category: CategorySlug;
  title: string;
  description: string;
  weightKg: number;
  condition: Condition;
  images: string[];         // data URLs (demo) or storage URLs (supabase)
  pickup: GeoPoint;
  preferredDate: string;    // ISO date
  preferredSlot: TimeSlot;
  askingPrice: number | null; // null → use live rate estimate
  estimatedPrice: number;
  status: ListingStatus;
  views: number;
  offerCount: number;
  createdAt: string;
  updatedAt: string;
  acceptedBuyerId?: string | null;
  orderId?: string | null;
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export type OrderStatus =
  | 'accepted'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'paid'
  | 'cancelled'
  | 'disputed';

export type PaymentMode = 'upi' | 'razorpay' | 'cash';

export interface Order {
  id: string;
  code: string;              // human-friendly e.g. SK-24817
  listingId: string;
  sellerId: string;
  buyerId: string;
  category: CategorySlug;
  agreedRate: number;        // ₹/kg agreed
  declaredWeightKg: number;
  finalWeightKg: number | null;
  amount: number;            // final amount payable
  status: OrderStatus;
  pickupDate: string;
  pickupSlot: TimeSlot;
  paymentMode: PaymentMode | null;
  paymentId: string | null;
  scheduledAt?: string | null;
  pickedUpAt?: string | null;
  paidAt?: string | null;
  createdAt: string;
  timeline: { status: OrderStatus | 'created'; at: string; note?: string }[];
}

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'countered';

export interface Offer {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  ratePerKg: number;
  amount: number;
  message: string;
  pickupDate: string;
  status: OfferStatus;
  createdAt: string;
}

export interface Review {
  id: string;
  orderId: string;
  authorId: string;
  authorName: string;
  authorRole: Role;
  targetId: string;       // user being reviewed
  rating: number;         // 1..5
  comment: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  orderId: string;
  userId: string;         // payee (seller) or payer
  amount: number;
  mode: PaymentMode;
  status: 'pending' | 'success' | 'failed' | 'refunded';
  reference: string;
  createdAt: string;
}

export type NotificationKind =
  | 'offer'
  | 'order'
  | 'pickup'
  | 'payment'
  | 'chat'
  | 'system'
  | 'approval';

export interface AppNotification {
  id: string;
  userId: string;        // recipient
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;       // `${listingId}:${sellerId}:${buyerId}` sorted
  senderId: string;
  body: string;
  createdAt: string;
  readAt?: string | null;
}

export interface Profile {
  id: string;
  role: Role;
  name: string;
  phone: string;
  email: string | null;
  avatarUrl?: string | null;
  city: string;
  state: string;
  language: 'en' | 'hi' | 'mr';
  // buyer-only business fields
  businessName?: string | null;
  gstin?: string | null;
  serviceAreas?: string[];
  verificationStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  rating?: number;
  ratingCount?: number;
  listingsCount?: number;
  completedOrders?: number;
  walletBalance?: number;
  rewardPoints?: number;
  referralCode: string;
  referredBy?: string | null;
  createdAt: string;
  status: 'active' | 'suspended';
  suspendedReason?: string | null;
}

export interface Dispute {
  id: string;
  orderId: string;
  raisedBy: string;
  against: string;
  reason: string;
  details: string;
  status: 'open' | 'resolved' | 'rejected';
  resolution?: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: 'open' | 'closed';
  createdAt: string;
}
