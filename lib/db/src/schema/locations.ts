import { pgTable, serial, integer, real, timestamp } from "drizzle-orm/pg-core";
import { farmersTable } from "./farmers";

export const locationsTable = pgTable("locations", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id, { onDelete: "cascade" }),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export type Location = typeof locationsTable.$inferSelect;
