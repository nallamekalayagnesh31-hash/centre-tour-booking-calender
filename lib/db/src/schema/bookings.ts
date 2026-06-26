import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingStatusEnum = [
  "enquiry",
  "tour_scheduled",
  "demo",
  "follow_up",
  "admission_confirmed",
  "cancelled",
] as const;

export type BookingStatus = (typeof bookingStatusEnum)[number];

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  parentName: text("parent_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  childName: text("child_name").notNull(),
  childAge: text("child_age").notNull(),
  date: text("date").notNull(),
  timeSlot: text("time_slot").notNull(),
  status: text("status").notNull().default("enquiry"),
  assignedTo: text("assigned_to"),
  message: text("message"),
  whatsapp: text("whatsapp"),
  preferredClass: text("preferred_class"),
  referralSource: text("referral_source"),
  followUpDate: text("follow_up_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;

export const statusHistoryTable = pgTable("status_history", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedBy: text("changed_by").notNull().default("system"),
  note: text("note"),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
});

export type StatusHistory = typeof statusHistoryTable.$inferSelect;

export const notesTable = pgTable("booking_notes", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  author: text("author").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type BookingNote = typeof notesTable.$inferSelect;
