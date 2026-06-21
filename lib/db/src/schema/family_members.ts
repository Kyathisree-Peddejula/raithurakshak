import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmersTable } from "./farmers";

export const familyMembersTable = pgTable("family_members", {
  id: serial("id").primaryKey(),
  farmerId: integer("farmer_id").notNull().references(() => farmersTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  relationship: text("relationship").notNull(),
  phone: text("phone").notNull(),
});

export const insertFamilyMemberSchema = createInsertSchema(familyMembersTable).omit({ id: true });
export type InsertFamilyMember = z.infer<typeof insertFamilyMemberSchema>;
export type FamilyMember = typeof familyMembersTable.$inferSelect;
