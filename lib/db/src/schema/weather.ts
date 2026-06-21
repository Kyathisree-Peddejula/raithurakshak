import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";

export const weatherDataTable = pgTable("weather_data", {
  id: serial("id").primaryKey(),
  district: text("district").notNull().unique(),
  temperature: real("temperature").notNull(),
  humidity: real("humidity").notNull(),
  windSpeed: real("wind_speed").notNull(),
  lightningRisk: text("lightning_risk").notNull(), // low, medium, high, critical
  condition: text("condition").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type WeatherData = typeof weatherDataTable.$inferSelect;
