import type {
  AppNotification,
  CategorySlug,
  Listing,
  Message,
  Offer,
  Order,
  Payment,
  Profile,
  Review,
  ScrapRate,
  Dispute,
  SupportTicket,
} from '@/lib/types';
import { CATEGORIES } from './categories';

/* ── helpers ─────────────────────────────────────────────────────────────── */
const now = new Date();
const day = (offset: number) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  return d.toISOString();
};
const dateOnly = (offset: number) => day(offset).slice(0, 10);

/** Deterministic-ish pseudo random so charts don't jitter between reloads. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return s / 2147483647;
  };
}

/* ── categories + live scrap rates ───────────────────────────────────────── */
const BASE_RATES: Record<CategorySlug, number> = {
  plastic: 28,
  paper: 12,
  cardboard: 9,
  steel: 34,
  iron: 26,
  aluminium: 132,
  copper: 545,
  ewaste: 48,
  glass: 5,
  other: 8,
};

const CHANGES: Record<CategorySlug, number> = {
  plastic: 2.4,
  paper: -1.2,
  cardboard: 0.8,
  steel: 1.6,
  iron: -0.6,
  aluminium: 3.1,
  copper: 4.2,
  ewaste: -2.1,
  glass: 0,
  other: 0.5,
};

export const SEED_RATES: ScrapRate[] = CATEGORIES.map((c, i) => {
  const rnd = seeded(1000 + i * 37);
  const history = Array.from({ length: 14 }).map((_, idx) => {
    const drift = (rnd() - 0.45) * BASE_RATES[c.slug] * 0.06;
    const rate = Math.max(1, Math.round((BASE_RATES[c.slug] + drift) * 10) / 10);
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - idx));
    return { date: d.toISOString().slice(0, 10), rate };
  });
  // make the final point match today's rate exactly
  history[history.length - 1].rate = BASE_RATES[c.slug];
  return {
    id: `rate_${c.slug}`,
    category: c.slug,
    ratePerKg: BASE_RATES[c.slug],
    changePct: CHANGES[c.slug],
    updatedAt: day(0),
    history,
  };
});

export const RATE_MAP = Object.fromEntries(SEED_RATES.map((r) => [r.category, r.ratePerKg])) as Record<
  CategorySlug,
  number
>;

/* ── demo users ──────────────────────────────────────────────────────────── */
export const DEMO_PASSWORD = 'scrap1234';

export const SEED_USERS: (Profile & { password: string })[] = [
  {
    id: 'u_seller_demo',
    role: 'seller',
    name: 'Ananya Deshmukh',
    phone: '9876543210',
    email: 'ananya@scrapkart.demo',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'en',
    verificationStatus: 'approved',
    rating: 4.8,
    ratingCount: 21,
    listingsCount: 4,
    completedOrders: 12,
    walletBalance: 12480,
    rewardPoints: 340,
    referralCode: 'ANANYA25',
    createdAt: day(-160),
    status: 'active',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u_buyer_demo',
    role: 'buyer',
    name: 'Rakesh Verma',
    phone: '9812345678',
    email: 'rakesh@verma-recyclers.demo',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'en',
    businessName: 'Verma Scrap & Recycling Co.',
    gstin: '27AABCV1234M1Z5',
    serviceAreas: ['Nagpur', 'Kamptee', 'Wadi'],
    verificationStatus: 'approved',
    rating: 4.7,
    ratingCount: 64,
    completedOrders: 186,
    walletBalance: 86500,
    rewardPoints: 120,
    referralCode: 'VERMA10',
    createdAt: day(-400),
    status: 'active',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u_admin_demo',
    role: 'admin',
    name: 'ScrapKart Admin',
    phone: '9000000001',
    email: 'admin@scrapkart.demo',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'en',
    verificationStatus: 'approved',
    referralCode: 'ADMIN01',
    createdAt: day(-500),
    status: 'active',
    password: DEMO_PASSWORD,
  },
  // Additional sellers
  {
    id: 'u_seller_2',
    role: 'seller',
    name: 'Imran Sheikh',
    phone: '9765432109',
    email: 'imran@shop.demo',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'en',
    verificationStatus: 'approved',
    rating: 4.6,
    ratingCount: 8,
    listingsCount: 2,
    completedOrders: 5,
    walletBalance: 3120,
    rewardPoints: 90,
    referralCode: 'IMRAN90',
    createdAt: day(-90),
    status: 'active',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u_seller_3',
    role: 'seller',
    name: 'Sunita Patil',
    phone: '9123456780',
    email: 'sunita@factory.demo',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'mr',
    verificationStatus: 'approved',
    rating: 4.9,
    ratingCount: 15,
    listingsCount: 1,
    completedOrders: 9,
    walletBalance: 21890,
    rewardPoints: 210,
    referralCode: 'SUNITA50',
    createdAt: day(-220),
    status: 'active',
    password: DEMO_PASSWORD,
  },
  // Pending buyers for the admin approval queue
  {
    id: 'u_buyer_pending_1',
    role: 'buyer',
    name: 'Mohd Arif',
    phone: '9090909091',
    email: 'arif@greenearth.demo',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'en',
    businessName: 'Green Earth Traders',
    gstin: '27AAGCG4567K1ZK',
    serviceAreas: ['Nagpur', 'Butibori'],
    verificationStatus: 'pending',
    rating: 0,
    ratingCount: 0,
    completedOrders: 0,
    walletBalance: 0,
    rewardPoints: 0,
    referralCode: 'ARIF70',
    createdAt: day(-2),
    status: 'active',
    password: DEMO_PASSWORD,
  },
  {
    id: 'u_buyer_pending_2',
    role: 'buyer',
    name: 'Kavita Joshi',
    phone: '9090909092',
    email: 'kavita@metalhub.demo',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'hi',
    businessName: 'MetalHub Industries',
    serviceAreas: ['Nagpur', 'Hingna', 'Wanadongri'],
    verificationStatus: 'pending',
    rating: 0,
    ratingCount: 0,
    completedOrders: 0,
    walletBalance: 0,
    rewardPoints: 0,
    referralCode: 'KAVITA30',
    createdAt: day(-1),
    status: 'active',
    password: DEMO_PASSWORD,
  },
  // Another approved buyer, for offer variety
  {
    id: 'u_buyer_2',
    role: 'buyer',
    name: 'Deepak Kulkarni',
    phone: '9555123456',
    email: 'deepak@nagpurscrap.demo',
    city: 'Nagpur',
    state: 'Maharashtra',
    language: 'mr',
    businessName: 'Nagpur Scrap House',
    gstin: '27AAECN8901P1Z2',
    serviceAreas: ['Nagpur', 'Pardi', 'Kalamna'],
    verificationStatus: 'approved',
    rating: 4.4,
    ratingCount: 39,
    completedOrders: 97,
    walletBalance: 24100,
    rewardPoints: 60,
    referralCode: 'DEEPAK20',
    createdAt: day(-310),
    status: 'active',
    password: DEMO_PASSWORD,
  },
];

/* Food-scrap-ish placeholder images. We use inline SVG data URIs so the demo
   works offline with no external asset dependency, while still looking real. */
export function placeholderImage(label: string, from = '#dcfce7', to = '#86efac') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <g fill="#0f172a" opacity="0.07">
      <circle cx="640" cy="120" r="120"/><circle cx="150" cy="500" r="160"/>
    </g>
    <text x="50%" y="50%" text-anchor="middle" font-family="Outfit, Arial, sans-serif" font-size="52" font-weight="700" fill="#14532d" opacity="0.75">${label}</text>
    <text x="50%" y="58%" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#166534" opacity="0.6">ScrapKart</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ── listings ────────────────────────────────────────────────────────────── */
const NAGPUR_POINTS: { lat: number; lng: number; address: string; pincode: string }[] = [
  { lat: 21.1458, lng: 79.0882, address: 'Flat 402, Shivaji Nagar, Near SBI Bank', pincode: '440010' },
  { lat: 21.1245, lng: 79.0023, address: 'Shop 12, Khamla Road, Pande Layout', pincode: '440025' },
  { lat: 21.1613, lng: 79.0952, address: 'Plot 7, Industrial Estate, Butibori MIDC', pincode: '441122' },
  { lat: 21.1123, lng: 79.0581, address: 'House 24, Manish Nagar, Beltarodi Road', pincode: '440037' },
  { lat: 21.1789, lng: 79.0412, address: 'Warehouse 3, Hingna Road, Wanadongri', pincode: '441110' },
  { lat: 21.1371, lng: 79.1211, address: 'Bungalow 9, Wardha Road, Chhatrapati Square', pincode: '440015' },
];

function mkListing(p: Partial<Listing> & Pick<Listing, 'id' | 'sellerId' | 'category' | 'weightKg'>): Listing {
  const idx = Math.abs(p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)) % NAGPUR_POINTS.length;
  const point = NAGPUR_POINTS[idx];
  const rate = RATE_MAP[p.category];
  return {
    title: `${CATEGORIES.find((c) => c.slug === p.category)!.name} scrap`,
    description: '',
    condition: 'mixed',
    images: [],
    pickup: { ...point, city: 'Nagpur' },
    preferredDate: dateOnly(2),
    preferredSlot: 'morning',
    askingPrice: null,
    estimatedPrice: Math.round(p.weightKg * rate),
    status: 'listed',
    views: Math.floor(Math.random() * 60) + 4,
    offerCount: 0,
    createdAt: day(-1),
    updatedAt: day(-1),
    ...p,
  } as Listing;
}

export const SEED_LISTINGS: Listing[] = [
  mkListing({
    id: 'l_1001',
    sellerId: 'u_seller_demo',
    category: 'plastic',
    weightKg: 24,
    title: '24 kg PET bottles & HDPE containers',
    description:
      'Monthly household collection — water bottles, milk jugs and shampoo bottles. All rinsed and caps removed. Ready for pickup any morning this week.',
    condition: 'clean',
    images: [placeholderImage('PET Bottles', '#dbeafe', '#93c5fd'), placeholderImage('HDPE Jugs', '#e0f2fe', '#7dd3fc')],
    status: 'listed',
    offerCount: 2,
    createdAt: day(-1),
    updatedAt: day(-1),
  }),
  mkListing({
    id: 'l_1002',
    sellerId: 'u_seller_2',
    category: 'cardboard',
    weightKg: 85,
    title: '85 kg flattened corrugated cartons',
    description: 'Shop clearance stock. Boxes flattened and bundled, dry storage, no plastic tape.',
    condition: 'clean',
    images: [placeholderImage('Cartons', '#ffedd5', '#fdba74')],
    preferredDate: dateOnly(3),
    status: 'listed',
    offerCount: 1,
    createdAt: day(-2),
    updatedAt: day(-2),
  }),
  mkListing({
    id: 'l_1003',
    sellerId: 'u_seller_3',
    category: 'aluminium',
    weightKg: 46,
    title: '46 kg aluminium window frames & sections',
    description:
      'Removed during factory renovation. Mostly powder-coated sections, some anodised. We can help load onto a tempo.',
    condition: 'mixed',
    images: [placeholderImage('Aluminium', '#f1f5f9', '#cbd5e1'), placeholderImage('Frames', '#e2e8f0', '#94a3b8')],
    status: 'listed',
    offerCount: 3,
    createdAt: day(-3),
    updatedAt: day(-3),
  }),
  mkListing({
    id: 'l_1004',
    sellerId: 'u_seller_demo',
    category: 'paper',
    weightKg: 18,
    title: '18 kg old newspapers & magazines',
    description: 'Neatly stacked, tied bundles. Stored indoors, completely dry.',
    condition: 'clean',
    images: [placeholderImage('Newspapers', '#fef3c7', '#fcd34d')],
    status: 'accepted',
    acceptedBuyerId: 'u_buyer_demo',
    orderId: 'o_5001',
    offerCount: 1,
    createdAt: day(-6),
    updatedAt: day(-4),
  }),
  mkListing({
    id: 'l_1005',
    sellerId: 'u_seller_2',
    category: 'ewaste',
    weightKg: 32,
    title: '32 kg e-waste — 4 TVs, 2 laptops, cables',
    description:
      'Old CRT televisions, non-working laptops, assorted chargers and cables. Requesting certified recycling only.',
    condition: 'mixed',
    images: [placeholderImage('E-Waste', '#ede9fe', '#c4b5fd')],
    status: 'listed',
    offerCount: 2,
    createdAt: day(-4),
    updatedAt: day(-4),
  }),
  mkListing({
    id: 'l_1006',
    sellerId: 'u_seller_3',
    category: 'copper',
    weightKg: 9.5,
    title: '9.5 kg copper wire & motor windings',
    description: 'Stripped wire bundles from old pumps. Small quantity of armature windings included.',
    condition: 'mixed',
    images: [placeholderImage('Copper Wire', '#ffe4e6', '#fda4af')],
    status: 'picked_up',
    acceptedBuyerId: 'u_buyer_demo',
    orderId: 'o_5002',
    offerCount: 4,
    createdAt: day(-12),
    updatedAt: day(-7),
  }),
  mkListing({
    id: 'l_1007',
    sellerId: 'u_seller_demo',
    category: 'iron',
    weightKg: 150,
    title: '150 kg iron grills & old gate',
    description: 'Demolished gate and window grills. Requires 2 people to shift.',
    condition: 'dirty',
    images: [placeholderImage('Iron Scrap', '#e7e5e4', '#a8a29e')],
    status: 'paid',
    acceptedBuyerId: 'u_buyer_2',
    orderId: 'o_5003',
    offerCount: 5,
    createdAt: day(-25),
    updatedAt: day(-18),
  }),
  mkListing({
    id: 'l_1008',
    sellerId: 'u_seller_2',
    category: 'glass',
    weightKg: 60,
    title: '60 kg clear glass bottles (jars + beer bottles)',
    description: 'Sorted by colour, packed in crates. Some broken pieces, handled carefully.',
    condition: 'mixed',
    images: [placeholderImage('Glass Bottles', '#ccfbf1', '#5eead4')],
    status: 'listed',
    offerCount: 0,
    createdAt: day(-1),
    updatedAt: day(-1),
  }),
  mkListing({
    id: 'l_1009',
    sellerId: 'u_seller_3',
    category: 'steel',
    weightKg: 210,
    title: '210 kg MS steel offcuts & sheets',
    description: 'Fabrication unit offcuts, mixed thickness. Loaded on pallets, forklift available.',
    condition: 'clean',
    images: [placeholderImage('Steel Offcuts', '#e2e8f0', '#cbd5e1')],
    status: 'listed',
    offerCount: 1,
    createdAt: day(-2),
    updatedAt: day(-2),
  }),
  mkListing({
    id: 'l_1010',
    sellerId: 'u_seller_demo',
    category: 'ewaste',
    weightKg: 7,
    title: '7 kg old mobile phones & chargers',
    description: 'Approx 22 phones of mixed vintage, chargers and earbuds. Batteries removed and bagged separately.',
    condition: 'mixed',
    images: [placeholderImage('Old Phones', '#ede9fe', '#a78bfa')],
    status: 'scheduled',
    acceptedBuyerId: 'u_buyer_demo',
    orderId: 'o_5004',
    offerCount: 2,
    createdAt: day(-9),
    updatedAt: day(-2),
  }),
];

/* ── orders ──────────────────────────────────────────────────────────────── */
export const SEED_ORDERS: Order[] = [
  {
    id: 'o_5001',
    code: 'SK-5001',
    listingId: 'l_1004',
    sellerId: 'u_seller_demo',
    buyerId: 'u_buyer_demo',
    category: 'paper',
    agreedRate: 13.5,
    declaredWeightKg: 18,
    finalWeightKg: null,
    amount: 243,
    status: 'pickup_scheduled',
    pickupDate: dateOnly(1),
    pickupSlot: 'morning',
    paymentMode: null,
    paymentId: null,
    scheduledAt: day(-1),
    createdAt: day(-4),
    timeline: [
      { status: 'created', at: day(-4), note: 'Listing published' },
      { status: 'accepted', at: day(-4), note: 'Offer of ₹13.5/kg accepted' },
      { status: 'pickup_scheduled', at: day(-1), note: 'Pickup booked for tomorrow, 9–12' },
    ],
  },
  {
    id: 'o_5002',
    code: 'SK-5002',
    listingId: 'l_1006',
    sellerId: 'u_seller_3',
    buyerId: 'u_buyer_demo',
    category: 'copper',
    agreedRate: 560,
    declaredWeightKg: 9.5,
    finalWeightKg: 9.2,
    amount: 5152,
    status: 'picked_up',
    pickupDate: dateOnly(-6),
    pickupSlot: 'afternoon',
    paymentMode: 'upi',
    paymentId: null,
    pickedUpAt: day(-6),
    createdAt: day(-10),
    timeline: [
      { status: 'created', at: day(-10), note: 'Listing published' },
      { status: 'accepted', at: day(-9), note: 'Offer of ₹560/kg accepted' },
      { status: 'pickup_scheduled', at: day(-8) },
      { status: 'picked_up', at: day(-6), note: 'Weighed 9.2 kg at site' },
    ],
  },
  {
    id: 'o_5003',
    code: 'SK-5003',
    listingId: 'l_1007',
    sellerId: 'u_seller_demo',
    buyerId: 'u_buyer_2',
    category: 'iron',
    agreedRate: 27,
    declaredWeightKg: 150,
    finalWeightKg: 148,
    amount: 3996,
    status: 'paid',
    pickupDate: dateOnly(-16),
    pickupSlot: 'evening',
    paymentMode: 'upi',
    paymentId: 'p_9003',
    pickedUpAt: day(-16),
    paidAt: day(-16),
    createdAt: day(-20),
    timeline: [
      { status: 'created', at: day(-20) },
      { status: 'accepted', at: day(-19) },
      { status: 'pickup_scheduled', at: day(-18) },
      { status: 'picked_up', at: day(-16) },
      { status: 'paid', at: day(-16), note: 'UPI transfer · ₹3,996' },
    ],
  },
  {
    id: 'o_5004',
    code: 'SK-5004',
    listingId: 'l_1010',
    sellerId: 'u_seller_demo',
    buyerId: 'u_buyer_demo',
    category: 'ewaste',
    agreedRate: 52,
    declaredWeightKg: 7,
    finalWeightKg: null,
    amount: 364,
    status: 'pickup_scheduled',
    pickupDate: dateOnly(2),
    pickupSlot: 'evening',
    paymentMode: 'cash',
    paymentId: null,
    scheduledAt: day(-2),
    createdAt: day(-7),
    timeline: [
      { status: 'created', at: day(-7) },
      { status: 'accepted', at: day(-6) },
      { status: 'pickup_scheduled', at: day(-2), note: 'Pickup in 2 days, 4–7 pm' },
    ],
  },
  // Older completed history — powers seller earnings charts
  ...Array.from({ length: 6 }).map((_, i): Order => {
    const cats: CategorySlug[] = ['plastic', 'cardboard', 'steel', 'aluminium', 'paper', 'ewaste'];
    const cat = cats[i];
    const weight = [40, 120, 75, 30, 22, 15][i];
    const rate = RATE_MAP[cat];
    const d = -(30 + i * 9);
    return {
      id: `o_hist_${i}`,
      code: `SK-50${10 + i}`,
      listingId: `l_hist_${i}`,
      sellerId: 'u_seller_demo',
      buyerId: i % 2 === 0 ? 'u_buyer_demo' : 'u_buyer_2',
      category: cat,
      agreedRate: rate,
      declaredWeightKg: weight,
      finalWeightKg: weight,
      amount: Math.round(weight * rate),
      status: 'paid',
      pickupDate: dateOnly(d),
      pickupSlot: 'morning',
      paymentMode: i % 3 === 0 ? 'cash' : 'upi',
      paymentId: `p_hist_${i}`,
      pickedUpAt: day(d),
      paidAt: day(d),
      createdAt: day(d - 3),
      timeline: [
        { status: 'created', at: day(d - 3) },
        { status: 'accepted', at: day(d - 2) },
        { status: 'pickup_scheduled', at: day(d - 1) },
        { status: 'picked_up', at: day(d) },
        { status: 'paid', at: day(d) },
      ],
    };
  }),
];

/* ── offers ──────────────────────────────────────────────────────────────── */
export const SEED_OFFERS: Offer[] = [
  {
    id: 'of_1',
    listingId: 'l_1001',
    buyerId: 'u_buyer_demo',
    sellerId: 'u_seller_demo',
    ratePerKg: 30,
    amount: 720,
    message: 'Can pick up tomorrow morning. Rate is ₹2 above today’s market.',
    pickupDate: dateOnly(1),
    status: 'pending',
    createdAt: day(0),
  },
  {
    id: 'of_2',
    listingId: 'l_1001',
    buyerId: 'u_buyer_2',
    sellerId: 'u_seller_demo',
    ratePerKg: 27.5,
    amount: 660,
    message: 'Interested, but can only collect on the weekend.',
    pickupDate: dateOnly(3),
    status: 'pending',
    createdAt: day(-1),
  },
  {
    id: 'of_3',
    listingId: 'l_1003',
    buyerId: 'u_buyer_demo',
    sellerId: 'u_seller_3',
    ratePerKg: 128,
    amount: 5888,
    message: 'Slightly below market because sections are coated.',
    pickupDate: dateOnly(2),
    status: 'pending',
    createdAt: day(-1),
  },
  {
    id: 'of_4',
    listingId: 'l_1004',
    buyerId: 'u_buyer_demo',
    sellerId: 'u_seller_demo',
    ratePerKg: 13.5,
    amount: 243,
    message: 'Accepting at ₹13.50/kg, pickup tomorrow 9–12.',
    pickupDate: dateOnly(1),
    status: 'accepted',
    createdAt: day(-4),
  },
  {
    id: 'of_5',
    listingId: 'l_1007',
    buyerId: 'u_buyer_2',
    sellerId: 'u_seller_demo',
    ratePerKg: 27,
    amount: 4050,
    message: 'Bulk rate for 150 kg iron.',
    pickupDate: dateOnly(-16),
    status: 'accepted',
    createdAt: day(-19),
  },
];

/* ── payments ────────────────────────────────────────────────────────────── */
export const SEED_PAYMENTS: Payment[] = SEED_ORDERS.filter((o) => o.status === 'paid').map((o) => ({
  id: `pay_${o.id}`,
  orderId: o.id,
  userId: o.sellerId,
  amount: o.amount,
  mode: o.paymentMode ?? 'upi',
  status: 'success',
  reference: `UPI${o.code.replace(/\D/g, '')}${Math.floor(Math.random() * 900 + 100)}`,
  createdAt: o.paidAt ?? o.createdAt,
}));

/* ── reviews ─────────────────────────────────────────────────────────────── */
export const SEED_REVIEWS: Review[] = [
  {
    id: 'r_1',
    orderId: 'o_5003',
    authorId: 'u_seller_demo',
    authorName: 'Ananya Deshmukh',
    authorRole: 'seller',
    targetId: 'u_buyer_2',
    rating: 5,
    comment: 'Weighing was transparent and payment hit my UPI before the truck left. Highly recommended.',
    createdAt: day(-16),
  },
  {
    id: 'r_2',
    orderId: 'o_5002',
    authorId: 'u_seller_3',
    authorName: 'Sunita Patil',
    authorRole: 'seller',
    targetId: 'u_buyer_demo',
    rating: 5,
    comment: 'Rakesh bhai sent two helpers and handled the copper carefully. Fair rate too.',
    createdAt: day(-6),
  },
  {
    id: 'r_3',
    orderId: 'o_hist_1',
    authorId: 'u_seller_demo',
    authorName: 'Ananya Deshmukh',
    authorRole: 'seller',
    targetId: 'u_buyer_2',
    rating: 4,
    comment: 'Good service, slightly late but informed in advance.',
    createdAt: day(-45),
  },
  {
    id: 'r_4',
    orderId: 'o_hist_2',
    authorId: 'u_seller_2',
    authorName: 'Imran Sheikh',
    authorRole: 'seller',
    targetId: 'u_buyer_demo',
    rating: 5,
    comment: 'Second pickup with them. Always on time.',
    createdAt: day(-70),
  },
];

/* ── notifications ───────────────────────────────────────────────────────── */
export const SEED_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n_1',
    userId: 'u_seller_demo',
    kind: 'offer',
    title: 'New offer on PET bottles',
    body: 'Verma Scrap & Recycling offered ₹30/kg for your 24 kg listing.',
    href: '/seller/listings/l_1001',
    read: false,
    createdAt: day(0),
  },
  {
    id: 'n_2',
    userId: 'u_seller_demo',
    kind: 'pickup',
    title: 'Pickup reminder',
    body: 'Your paper pickup is scheduled for tomorrow, 9:00 am – 12:00 pm.',
    href: '/seller/orders',
    read: false,
    createdAt: day(-1),
  },
  {
    id: 'n_3',
    userId: 'u_seller_demo',
    kind: 'payment',
    title: '₹3,996 received',
    body: 'Payment for order SK-5003 was credited via UPI.',
    href: '/seller/earnings',
    read: true,
    createdAt: day(-16),
  },
  {
    id: 'n_4',
    userId: 'u_buyer_demo',
    kind: 'order',
    title: 'New listing near you',
    body: '24 kg PET bottles listed 3.2 km away in Shivaji Nagar.',
    href: '/buyer',
    read: false,
    createdAt: day(0),
  },
  {
    id: 'n_5',
    userId: 'u_buyer_demo',
    kind: 'system',
    title: 'KYC approved',
    body: 'Your business verification is complete. You can now bid on all listings.',
    href: '/buyer',
    read: true,
    createdAt: day(-30),
  },
  {
    id: 'n_6',
    userId: 'u_admin_demo',
    kind: 'approval',
    title: '2 buyer registrations pending',
    body: 'Green Earth Traders and MetalHub Industries are awaiting approval.',
    href: '/admin/buyers',
    read: false,
    createdAt: day(-1),
  },
];

/* ── messages ────────────────────────────────────────────────────────────── */
export const THREAD_ID = (listingId: string, a: string, b: string) =>
  [listingId, ...[a, b].sort()].join(':');

export const SEED_MESSAGES: Message[] = [
  {
    id: 'm_1',
    threadId: THREAD_ID('l_1001', 'u_seller_demo', 'u_buyer_demo'),
    senderId: 'u_buyer_demo',
    body: 'Namaste! Are the bottles already rinsed? Our rate assumes clean PET.',
    createdAt: day(-1),
    readAt: day(-1),
  },
  {
    id: 'm_2',
    threadId: THREAD_ID('l_1001', 'u_seller_demo', 'u_buyer_demo'),
    senderId: 'u_seller_demo',
    body: 'Yes, all rinsed and dried. Caps removed and kept separately.',
    createdAt: day(-1),
    readAt: day(-1),
  },
  {
    id: 'm_3',
    threadId: THREAD_ID('l_1001', 'u_seller_demo', 'u_buyer_demo'),
    senderId: 'u_buyer_demo',
    body: 'Perfect. I have sent an offer at ₹30/kg. Can collect tomorrow morning.',
    createdAt: day(0),
  },
];

/* ── admin extras ────────────────────────────────────────────────────────── */
export const SEED_DISPUTES: Dispute[] = [
  {
    id: 'd_1',
    orderId: 'o_5002',
    raisedBy: 'u_seller_3',
    against: 'u_buyer_demo',
    reason: 'Weight mismatch',
    details: 'Buyer recorded 9.2 kg but my shop scale showed 9.6 kg. Requesting ₹224 adjustment.',
    status: 'open',
    createdAt: day(-5),
  },
];

export const SEED_TICKETS: SupportTicket[] = [
  {
    id: 't_1',
    name: 'Prakash Rane',
    phone: '9888877777',
    subject: 'Pickup did not arrive',
    message: 'Dealer did not show up on the scheduled slot. Please reschedule.',
    status: 'open',
    createdAt: day(-3),
  },
];

/** Daily collections, used by the admin analytics chart. */
export function collectionsSeries(days = 14) {
  const rnd = seeded(42);
  return Array.from({ length: days }).map((_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (days - 1 - i));
    const kg = Math.round(420 + rnd() * 780);
    return {
      date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      kg,
      revenue: Math.round(kg * (22 + rnd() * 30)),
    };
  });
}

/** Weekly signups, used by the admin user-growth chart. */
export function signupSeries(weeks = 8) {
  const rnd = seeded(7);
  return Array.from({ length: weeks }).map((_, i) => ({
    week: `W${i + 1}`,
    sellers: Math.round(18 + rnd() * 26),
    buyers: Math.round(4 + rnd() * 10),
  }));
}

export { dateOnly, day };
