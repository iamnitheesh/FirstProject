import { 
  users, 
  flashcardSets, 
  flashcards, 
  type User, 
  type InsertUser, 
  type FlashcardSet, 
  type InsertFlashcardSet,
  type Flashcard,
  type InsertFlashcard,
  type Option
} from "@shared/schema";

export interface IStorage {
  // User operations (keeping from original)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // FlashcardSet operations
  getFlashcardSets(): Promise<FlashcardSet[]>;
  getFlashcardSetsByUserId(userId: number): Promise<FlashcardSet[]>;
  getFlashcardSet(id: number): Promise<FlashcardSet | undefined>;
  createFlashcardSet(set: InsertFlashcardSet): Promise<FlashcardSet>;
  updateFlashcardSet(id: number, set: Partial<InsertFlashcardSet>): Promise<FlashcardSet | undefined>;
  deleteFlashcardSet(id: number): Promise<boolean>;
  updateLastAccessed(id: number): Promise<boolean>;

  // Flashcard operations
  getFlashcards(setId: number): Promise<Flashcard[]>;
  getFlashcard(id: number): Promise<Flashcard | undefined>;
  createFlashcard(card: InsertFlashcard): Promise<Flashcard>;
  updateFlashcard(id: number, card: Partial<InsertFlashcard>): Promise<Flashcard | undefined>;
  deleteFlashcard(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private flashcardSets: Map<number, FlashcardSet>;
  private flashcards: Map<number, Flashcard>;
  currentUserId: number;
  currentSetId: number;
  currentCardId: number;

  constructor() {
    this.users = new Map();
    this.flashcardSets = new Map();
    this.flashcards = new Map();
    this.currentUserId = 1;
    this.currentSetId = 1;
    this.currentCardId = 1;

    // Initialize with example data
    this.initializeExampleData();
  }

  private initializeExampleData() {
    // Create an example set
    const calculusSet: FlashcardSet = {
      id: this.currentSetId++,
      title: "Calculus Fundamentals",
      description: "Basic concepts of calculus including derivatives and integrals",
      tags: ["calculus", "math", "derivatives"],
      primaryColor: "#3b82f6",
      createdAt: new Date(),
      lastAccessed: new Date(),
      userId: null
    };
    this.flashcardSets.set(1, calculusSet);

    // Create example flashcards for the set
    const card1: Flashcard = {
      id: this.currentCardId++,
      question: "Find the derivative of \\(f(x) = x^2 \\sin(x)\\).",
      options: [
        { text: "\\(f'(x) = 2x \\sin(x) + x^2 \\cos(x)\\)", isCorrect: true },
        { text: "\\(f'(x) = 2x \\sin(x)\\)", isCorrect: false },
        { text: "\\(f'(x) = x^2 \\cos(x)\\)", isCorrect: false },
        { text: "\\(f'(x) = 2x \\sin(x) - x^2 \\cos(x)\\)", isCorrect: false }
      ],
      explanation: "Using the product rule: \\(f'(x) = 2x \\sin(x) + x^2 \\cos(x)\\)",
      imageUrl: null,
      setId: 1,
      createdAt: new Date()
    };
    this.flashcards.set(1, card1);

    const card2: Flashcard = {
      id: this.currentCardId++,
      question: "Evaluate the indefinite integral \\(\\int x e^x dx\\).",
      options: [
        { text: "\\(x e^x - e^x + C\\)", isCorrect: true },
        { text: "\\(x e^x + C\\)", isCorrect: false },
        { text: "\\(e^x(x-1) + C\\)", isCorrect: false },
        { text: "\\(\\frac{x^2}{2}e^x + C\\)", isCorrect: false }
      ],
      explanation: "Using integration by parts with \\(u = x\\) and \\(dv = e^x dx\\)",
      imageUrl: null,
      setId: 1,
      createdAt: new Date()
    };
    this.flashcards.set(2, card2);
  }

  // User methods (from original)
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // FlashcardSet methods
  async getFlashcardSets(): Promise<FlashcardSet[]> {
    return Array.from(this.flashcardSets.values());
  }

  async getFlashcardSetsByUserId(userId: number): Promise<FlashcardSet[]> {
    return Array.from(this.flashcardSets.values()).filter(
      (set) => set.userId === userId,
    );
  }

  async getFlashcardSet(id: number): Promise<FlashcardSet | undefined> {
    return this.flashcardSets.get(id);
  }

  async createFlashcardSet(set: InsertFlashcardSet): Promise<FlashcardSet> {
    const id = this.currentSetId++;
    const newSet: FlashcardSet = { 
      ...set, 
      id, 
      createdAt: new Date(),
      lastAccessed: new Date() 
    };
    this.flashcardSets.set(id, newSet);
    return newSet;
  }

  async updateFlashcardSet(id: number, set: Partial<InsertFlashcardSet>): Promise<FlashcardSet | undefined> {
    const existingSet = this.flashcardSets.get(id);
    if (!existingSet) return undefined;

    const updatedSet: FlashcardSet = { ...existingSet, ...set };
    this.flashcardSets.set(id, updatedSet);
    return updatedSet;
  }

  async deleteFlashcardSet(id: number): Promise<boolean> {
    // Delete associated flashcards first
    const associatedCards = Array.from(this.flashcards.values()).filter(
      card => card.setId === id
    );
    
    for (const card of associatedCards) {
      this.flashcards.delete(card.id);
    }
    
    return this.flashcardSets.delete(id);
  }

  async updateLastAccessed(id: number): Promise<boolean> {
    const set = this.flashcardSets.get(id);
    if (!set) return false;
    
    set.lastAccessed = new Date();
    this.flashcardSets.set(id, set);
    return true;
  }

  // Flashcard methods
  async getFlashcards(setId: number): Promise<Flashcard[]> {
    return Array.from(this.flashcards.values()).filter(
      card => card.setId === setId
    );
  }

  async getFlashcard(id: number): Promise<Flashcard | undefined> {
    return this.flashcards.get(id);
  }

  async createFlashcard(card: InsertFlashcard): Promise<Flashcard> {
    const id = this.currentCardId++;
    const newCard: Flashcard = { ...card, id, createdAt: new Date() };
    this.flashcards.set(id, newCard);
    
    // Update lastAccessed on the set
    this.updateLastAccessed(card.setId);
    
    return newCard;
  }

  async updateFlashcard(id: number, card: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    const existingCard = this.flashcards.get(id);
    if (!existingCard) return undefined;

    const updatedCard: Flashcard = { ...existingCard, ...card };
    this.flashcards.set(id, updatedCard);
    
    // Update lastAccessed on the set
    if (existingCard.setId) {
      this.updateLastAccessed(existingCard.setId);
    }
    
    return updatedCard;
  }

  async deleteFlashcard(id: number): Promise<boolean> {
    const card = this.flashcards.get(id);
    if (card && card.setId) {
      this.updateLastAccessed(card.setId);
    }
    
    return this.flashcards.delete(id);
  }
}

export const storage = new MemStorage();
