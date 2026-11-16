export type AppRole = 'user' | 'admin';

export type UserTab = 'home' | 'services' | 'game' | 'stillness' | 'profile';
export type ServiceSubTab = 'wednesday' | 'corporate' | 'life';
export type AdminTab = 'wednesdays' | 'corporate' | 'store' | 'content' | 'registrations';

export type PackageTier = 'Single' | 'Weekly' | 'Monthly';

export interface BrandSettings {
  logoUrl: string;
  organizationName: string;
  sanctuaryName: string;
  venueName: string;
  venueAddress: string;
  venueDirections: string;
  googleMapsUrl: string;
}

export interface WednesdaySession {
  id: string;
  weekLabel?: string;
  title: string;
  theme: string;
  description: string;
  date: string;
  time: string;
  facilitator: string;
  venue: string;
  mapLink: string;
  capacity: number;
  registeredCount: number;
  priceEtb: number;
  published: boolean;
  posterUrl?: string;
}

export interface WednesdayPackage {
  id: string;
  tier: PackageTier;
  name: string;
  priceEtb: number;
  cadenceLabel: string;
  audienceLabel: string;
  benefits: string[];
}

export interface SessionRegistration {
  id: string;
  memberName: string;
  memberEmail: string;
  memberPhone: string;
  sessionId: string;
  sessionTitle: string;
  sessionDate: string;
  packageTier: PackageTier;
  amountEtb: number;
  passCode: string;
  attendanceStatus: 'Confirmed' | 'Checked In' | 'Pending';
  createdAt: string;
}

export interface CorporateProgram {
  id: string;
  name: string;
  duration: string;
  idealFor: string;
  summary: string;
  outcomes: string[];
}

export interface CorporateInquiry {
  id: string;
  organizationName: string;
  contactName: string;
  contactEmail: string;
  teamSize: string;
  programInterest: string;
  goals: string;
  status: 'New Inquiry' | 'Discovery Scheduled' | 'Proposal Sent';
  submittedAt: string;
}

export type ProductCategory = 'Journals & Books' | 'Herbal Blends' | 'Practice Tools' | 'Atmosphere';

export interface KhulProduct {
  id: string;
  name: string;
  category: ProductCategory;
  priceEtb: number;
  description: string;
  inStock: boolean;
  visualKey: 'journal' | 'tea' | 'cushion' | 'chime' | 'book' | 'candle' | 'custom';
  customImageUrl?: string;
}

export interface BagItem {
  productId: string;
  quantity: number;
}

export interface StoreOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  fulfillmentMethod: 'Center Pickup (Bole Rwanda)' | 'Addis Delivery';
  deliveryAddress?: string;
  items: {
    productId: string;
    name: string;
    quantity: number;
    priceEtb: number;
  }[];
  totalEtb: number;
  status: 'Reserved' | 'Ready for Pickup' | 'Out for Delivery' | 'Completed';
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  category: 'Announcement' | 'Self-Awareness' | 'Community Update';
  body: string;
  publishedAt: string;
  author: string;
}

export interface WeeklyGameConfig {
  weekLabel: string;
  title: string;
  prompt: string;
  checklistLabel: string;
  durationLabel: string;
  rewardNote: string;
  imageUrl?: string;
}

export type VirtueCardTheme = 'orange' | 'green' | 'yellow';

export interface ReflectionWord {
  id: string;
  word: string;
  amharicWord: string;
  reflection: string;
  amharicReflection: string;
  practiceHint: string;
  cardTheme: VirtueCardTheme;
}

export interface CollectedWordEntry {
  id: string;
  word: string;
  amharicWord?: string;
  reflection: string;
  amharicReflection?: string;
  cardTheme?: VirtueCardTheme;
  earnedAt: string;
}

export interface CommunityMember {
  id: string;
  name: string;
  email: string;
  activePackage: PackageTier;
  currentStreak: number;
  totalDaysPracticed: number;
  weekDaysCompleted: boolean[]; // Mon..Sun (7 items)
  awardedBadge?: string;
  isCurrentUser?: boolean;
}

export interface SanctuaryState {
  brand: BrandSettings;
  sessions: WednesdaySession[];
  packages: WednesdayPackage[];
  registrations: SessionRegistration[];
  corporatePrograms: CorporateProgram[];
  corporateInquiries: CorporateInquiry[];
  products: KhulProduct[];
  bag: BagItem[];
  orders: StoreOrder[];
  announcements: Announcement[];
  weeklyGame: WeeklyGameConfig;
  reflectionWords: ReflectionWord[];
  collectedWords: CollectedWordEntry[];
  members: CommunityMember[];
  currentUserId: string;
  checkedInToday: boolean;
  stillnessIntention: string;
}
