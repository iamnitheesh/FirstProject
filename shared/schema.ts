import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema - keeping from the original
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// FlashcardSet schema
export const flashcardSets = pgTable("flashcard_sets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").array(),
  primaryColor: text("primary_color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
  lastAccessed: timestamp("last_accessed"),
  userId: integer("user_id").references(() => users.id),
});

export const insertFlashcardSetSchema = createInsertSchema(flashcardSets).omit({
  id: true,
  createdAt: true,
  lastAccessed: true,
});

// Option type for multiple choice
export const optionSchema = z.object({
  text: z.string(),
  isCorrect: z.boolean().default(false),
});

export type Option = z.infer<typeof optionSchema>;

// Flashcard schema
export const flashcards = pgTable("flashcards", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: jsonb("options").$type<Option[]>().notNull(),
  explanation: text("explanation"),
  imageUrl: text("image_url"),
  setId: integer("set_id").references(() => flashcardSets.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
  createdAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type FlashcardSet = typeof flashcardSets.$inferSelect;
export type InsertFlashcardSet = z.infer<typeof insertFlashcardSetSchema>;

export type Flashcard = typeof flashcards.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
