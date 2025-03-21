import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertFlashcardSetSchema, insertFlashcardSchema } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes for flashcard sets
  app.get("/api/sets", async (_req: Request, res: Response) => {
    try {
      const sets = await storage.getFlashcardSets();
      res.json(sets);
    } catch (error) {
      res.status(500).json({ message: "Error fetching flashcard sets" });
    }
  });

  app.get("/api/sets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const set = await storage.getFlashcardSet(id);
      if (!set) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }

      // Update last accessed timestamp
      await storage.updateLastAccessed(id);
      res.json(set);
    } catch (error) {
      res.status(500).json({ message: "Error fetching flashcard set" });
    }
  });

  app.post("/api/sets", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFlashcardSetSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newSet = await storage.createFlashcardSet(validatedData.data);
      res.status(201).json(newSet);
    } catch (error) {
      res.status(500).json({ message: "Error creating flashcard set" });
    }
  });

  app.put("/api/sets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Partial validation of the update data
      const validatedData = insertFlashcardSetSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedSet = await storage.updateFlashcardSet(id, validatedData.data);
      if (!updatedSet) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }
      
      res.json(updatedSet);
    } catch (error) {
      res.status(500).json({ message: "Error updating flashcard set" });
    }
  });

  app.delete("/api/sets/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteFlashcardSet(id);
      if (!success) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting flashcard set" });
    }
  });

  // API routes for flashcards
  app.get("/api/sets/:setId/cards", async (req: Request, res: Response) => {
    try {
      const setId = parseInt(req.params.setId);
      if (isNaN(setId)) {
        return res.status(400).json({ message: "Invalid set ID format" });
      }

      const cards = await storage.getFlashcards(setId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Error fetching flashcards" });
    }
  });

  app.get("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const card = await storage.getFlashcard(id);
      if (!card) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Error fetching flashcard" });
    }
  });

  app.post("/api/cards", async (req: Request, res: Response) => {
    try {
      const validatedData = insertFlashcardSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const newCard = await storage.createFlashcard(validatedData.data);
      res.status(201).json(newCard);
    } catch (error) {
      res.status(500).json({ message: "Error creating flashcard" });
    }
  });

  app.put("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      // Partial validation of the update data
      const validatedData = insertFlashcardSchema.partial().safeParse(req.body);
      
      if (!validatedData.success) {
        const errorMessage = fromZodError(validatedData.error).message;
        return res.status(400).json({ message: errorMessage });
      }
      
      const updatedCard = await storage.updateFlashcard(id, validatedData.data);
      if (!updatedCard) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      
      res.json(updatedCard);
    } catch (error) {
      res.status(500).json({ message: "Error updating flashcard" });
    }
  });

  app.delete("/api/cards/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const success = await storage.deleteFlashcard(id);
      if (!success) {
        return res.status(404).json({ message: "Flashcard not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Error deleting flashcard" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
