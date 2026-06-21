import { pgTable, serial, integer, text, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { farmersTable } from "./farmers";

export const lightningAlertsTable = pgTable("lightning_alerts", {
  id: serial("id").primaryKey(),
  district: text("district").notNull(),
  severity: text("severity").notNull(), // low, medium, high, critical
  message: text("message").notNull(),
  messageTe: text("message_te"),        // Telugu translation (optional)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type LightningAlert = typeof lightningAlertsTable.$inferSelect;

export const emergencyAlertsTable = pgTable("emergency_alerts", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // lightning_strike, medical, missing, other
  message: text("message").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  isResolved: boolean("is_resolved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type EmergencyAlert = typeof emergencyAlertsTable.$inferSelect;
