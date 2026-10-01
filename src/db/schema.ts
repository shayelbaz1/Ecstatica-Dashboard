import { relations } from 'drizzle-orm';
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Users table (Firebase Auth linked)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Camp Members table
export const members = pgTable('members', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  gender: text('gender'),
  email: text('email'),
  idNumber: text('id_number'),
  city: text('city'),
  phone: text('phone'),
  insta: text('insta'),
  gifts: text('gifts'),
  status: text('status'),
  allocationSource: text('allocation_source'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Creation and Midburn Events table
export const events = pgTable('events', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  subTitle: text('sub_title'),
  dateStr: text('date_str').notNull(),
  category: text('category').notNull(),
  location: text('location'),
  description: text('description'),
  targetParticipants: integer('target_participants'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Attendance Registrations table
export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  eventId: text('event_id')
    .references(() => events.id)
    .notNull(),
  memberId: text('member_id')
    .references(() => members.id)
    .notNull(),
  status: text('status').notNull(), // 'attending' | 'not_attending' | 'maybe'
  needsRide: boolean('needs_ride').default(false),
  rideFrom: text('ride_from'),
  note: text('note'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Carpool and Ride Offers table
export const rides = pgTable('rides', {
  id: text('id').primaryKey(),
  eventId: text('event_id')
    .references(() => events.id)
    .notNull(),
  memberId: text('member_id').notNull(),
  memberName: text('member_name').notNull(),
  fromCity: text('from_city').notNull(),
  departureTime: text('departure_time'),
  totalSeats: integer('total_seats').notNull(),
  availableSeats: integer('available_seats').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const eventsRelations = relations(events, ({ many }) => ({
  attendance: many(attendance),
  rides: many(rides),
}));

export const membersRelations = relations(members, ({ many }) => ({
  attendance: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  event: one(events, {
    fields: [attendance.eventId],
    references: [events.id],
  }),
  member: one(members, {
    fields: [attendance.memberId],
    references: [members.id],
  }),
}));

export const ridesRelations = relations(rides, ({ one }) => ({
  event: one(events, {
    fields: [rides.eventId],
    references: [events.id],
  }),
}));
