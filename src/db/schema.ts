import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('member'),
  activePackage: text('active_package').notNull().default('Single'),
  currentStreak: integer('current_streak').notNull().default(1),
  totalDaysPracticed: integer('total_days_practiced').notNull().default(1),
  weekDaysCompleted: jsonb('week_days_completed')
    .$type<boolean[]>()
    .notNull()
    .default([false, false, false, false, false, false, false]),
  awardedBadge: text('awarded_badge'),
  stillnessIntention: text('stillness_intention').notNull().default(''),
  checkedInDate: text('checked_in_date'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const admins = pgTable('admins', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull(),
  role: text('role').notNull().default('admin'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const appConfig = pgTable('app_config', {
  key: text('key').primaryKey(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const wednesdaySessions = pgTable('wednesday_sessions', {
  id: text('id').primaryKey(),
  weekLabel: text('week_label'),
  title: text('title').notNull(),
  theme: text('theme').notNull(),
  description: text('description').notNull().default(''),
  date: text('date').notNull(),
  time: text('time').notNull(),
  facilitator: text('facilitator').notNull(),
  venue: text('venue').notNull(),
  mapLink: text('map_link').notNull().default(''),
  capacity: integer('capacity').notNull().default(28),
  registeredCount: integer('registered_count').notNull().default(0),
  priceEtb: integer('price_etb').notNull().default(650),
  published: boolean('published').notNull().default(true),
  posterUrl: text('poster_url'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const wednesdayPackages = pgTable('wednesday_packages', {
  id: text('id').primaryKey(),
  tier: text('tier').notNull(),
  name: text('name').notNull(),
  priceEtb: integer('price_etb').notNull(),
  cadenceLabel: text('cadence_label').notNull(),
  audienceLabel: text('audience_label').notNull(),
  benefits: jsonb('benefits').$type<string[]>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const khulProducts = pgTable('khul_products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  priceEtb: integer('price_etb').notNull(),
  description: text('description').notNull(),
  inStock: boolean('in_stock').notNull().default(true),
  visualKey: text('visual_key').notNull(),
  customImageUrl: text('custom_image_url'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  body: text('body').notNull(),
  publishedAt: text('published_at').notNull(),
  author: text('author').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const virtueGifts = pgTable('virtue_gifts', {
  id: text('id').primaryKey(),
  word: text('word').notNull(),
  amharicWord: text('amharic_word').notNull(),
  reflection: text('reflection').notNull(),
  amharicReflection: text('amharic_reflection').notNull(),
  practiceHint: text('practice_hint').notNull().default(''),
  cardTheme: text('card_theme').notNull().default('yellow'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const sessionRegistrations = pgTable('session_registrations', {
  id: text('id').primaryKey(),
  ownerUid: text('owner_uid'),
  memberName: text('member_name').notNull(),
  memberEmail: text('member_email').notNull(),
  memberPhone: text('member_phone').notNull(),
  sessionId: text('session_id').notNull(),
  sessionTitle: text('session_title').notNull(),
  sessionDate: text('session_date').notNull(),
  packageTier: text('package_tier').notNull(),
  amountEtb: integer('amount_etb').notNull(),
  passCode: text('pass_code').notNull(),
  attendanceStatus: text('attendance_status').notNull().default('Confirmed'),
  createdAt: text('created_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const storeOrders = pgTable('store_orders', {
  id: text('id').primaryKey(),
  ownerUid: text('owner_uid'),
  customerName: text('customer_name').notNull(),
  customerPhone: text('customer_phone').notNull(),
  fulfillmentMethod: text('fulfillment_method').notNull(),
  deliveryAddress: text('delivery_address'),
  items: jsonb('items')
    .$type<{productId: string; name: string; quantity: number; priceEtb: number}[]>()
    .notNull(),
  totalEtb: integer('total_etb').notNull(),
  status: text('status').notNull().default('Reserved'),
  createdAt: text('created_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const corporateInquiries = pgTable('corporate_inquiries', {
  id: text('id').primaryKey(),
  ownerUid: text('owner_uid'),
  organizationName: text('organization_name').notNull(),
  contactName: text('contact_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  teamSize: text('team_size').notNull(),
  programInterest: text('program_interest').notNull(),
  goals: text('goals').notNull().default(''),
  status: text('status').notNull().default('New Inquiry'),
  submittedAt: text('submitted_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const leaderboardMembers = pgTable('leaderboard_members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().default(''),
  activePackage: text('active_package').notNull().default('Single'),
  currentStreak: integer('current_streak').notNull().default(1),
  totalDaysPracticed: integer('total_days_practiced').notNull().default(1),
  weekDaysCompleted: jsonb('week_days_completed').$type<boolean[]>().notNull(),
  awardedBadge: text('awarded_badge'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
