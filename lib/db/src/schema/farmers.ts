import { pgTable, serial, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const farmersTable = pgTable("farmers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  aadhaar: text("aadhaar"),
  village: text("village").notNull(),
  district: text("district").notNull(),
  state: text("state").notNull(),
  lat: real("lat"),
  lng: real("lng"),
  isActive: boolean("is_active").notNull().default(true),
  registeredAt: timestamp("registered_at").notNull().defaultNow(),
});

export const insertFarmerSchema = createInsertSchema(farmersTable).omit({ id: true, registeredAt: true });
export type InsertFarmer = z.infer<typeof insertFarmerSchema>;
export type Farmer = typeof farmersTable.$inferSelect;
