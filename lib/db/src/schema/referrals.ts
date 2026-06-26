import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { bookingsTable } from "./bookings";

export const referralRewardsTable = pgTable("referral_rewards", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id")
    .notNull()
    .references(() => bookingsTable.id, { onDelete: "cascade" }),
  referrerName: text("referrer_name").notNull(),
  referrerPhone: text("referrer_phone").notNull(),
  referrerEmail: text("referrer_email"),
  rewardStatus: text("reward_status").notNull().default("pending"), // "pending", "eligible", "claimed"
  rewardDetails: text("reward_details"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type ReferralReward = typeof referralRewardsTable.$inferSelect;
export type InsertReferralReward = typeof referralRewardsTable.$inferInsert;
