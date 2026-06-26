import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const staffRoleEnum = ["admin", "counsellor", "centre_head"] as const;
export type StaffRole = (typeof staffRoleEnum)[number];

export const staffTable = pgTable("staff", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("counsellor"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Staff = typeof staffTable.$inferSelect;
