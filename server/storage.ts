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
  
  // Data persistence operations
  saveAllData(): Promise<boolean>;
  loadSavedData(): Promise<boolean>;

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

    // Load data from localStorage if available, otherwise initialize with examples
    const hasLoadedData = this.tryLoadingFromLocalStorage();
    if (!hasLoadedData) {
      // Initialize with example data only if no saved data exists
      this.initializeExampleData();
    }
  }
  
  private tryLoadingFromLocalStorage(): boolean {
    try {
      // Only run this code in a browser environment (when localStorage is available)
      if (typeof localStorage !== 'undefined') {
        const savedSetsData = localStorage.getItem('savedFlashcardSets');
        const savedCardsData = localStorage.getItem('savedFlashcards');
        
        if (savedSetsData) {
          const parsedSets = JSON.parse(savedSetsData) as FlashcardSet[];
          if (Array.isArray(parsedSets) && parsedSets.length > 0) {
            // Find the highest ID to update our counter
            let maxSetId = 0;
            parsedSets.forEach(set => {
              // Convert string dates to Date objects
              const convertedSet = {
                ...set,
                createdAt: set.createdAt ? new Date(set.createdAt) : null,
                lastAccessed: set.lastAccessed ? new Date(set.lastAccessed) : null
              };
              this.flashcardSets.set(set.id, convertedSet);
              maxSetId = Math.max(maxSetId, set.id);
            });
            
            this.currentSetId = maxSetId + 1;
            
            // If we have sets but no cards, try loading cards as well
            if (savedCardsData) {
              const parsedCards = JSON.parse(savedCardsData) as Flashcard[];
              if (Array.isArray(parsedCards) && parsedCards.length > 0) {
                let maxCardId = 0;
                parsedCards.forEach(card => {
                  // Convert string date to Date object
                  const convertedCard = {
                    ...card,
                    createdAt: card.createdAt ? new Date(card.createdAt) : new Date()
                  };
                  this.flashcards.set(card.id, convertedCard);
                  maxCardId = Math.max(maxCardId, card.id);
                });
                
                this.currentCardId = maxCardId + 1;
              }
            }
            
            return true; // Successfully loaded data
          }
        }
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
    }
    
    return false; // Failed to load or no data available
  }

  private initializeExampleData() {
    // Create an example set
    const calculusSet: FlashcardSet = {
      id: this.currentSetId++,
      title: "Calculus Fundamentals",
      description: "Basic concepts of calculus including derivatives and integrals",
      tags: ["calculus", "math", "derivatives"],
      primaryColor: "#3b82f6",
      backgroundImage: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=500&q=80",
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
        { text: "\\(f'(x) = 2x \\sin(x) + x^2 \\cos(x)\\)", isCorrect: true, isMultipleSelect: false },
        { text: "\\(f'(x) = 2x \\sin(x)\\)", isCorrect: false, isMultipleSelect: false },
        { text: "\\(f'(x) = x^2 \\cos(x)\\)", isCorrect: false, isMultipleSelect: false },
        { text: "\\(f'(x) = 2x \\sin(x) - x^2 \\cos(x)\\)", isCorrect: false, isMultipleSelect: false }
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
        { text: "\\(x e^x - e^x + C\\)", isCorrect: true, isMultipleSelect: false },
        { text: "\\(x e^x + C\\)", isCorrect: false, isMultipleSelect: false },
        { text: "\\(e^x(x-1) + C\\)", isCorrect: false, isMultipleSelect: false },
        { text: "\\(\\frac{x^2}{2}e^x + C\\)", isCorrect: false, isMultipleSelect: false }
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
    const sets = Array.from(this.flashcardSets.values());
    // Enrich with additional data
    return Promise.all(sets.map(async (set) => {
      const cards = await this.getFlashcards(set.id);
      const totalCards = cards.length;
      // Calculate a mock progress based on created date (for demo purposes)
      // In a real app, this would track actual study progress
      const progress = totalCards > 0 ? Math.min(0.75, Math.random() * 0.8) : 0;
      
      return {
        ...set,
        totalCards,
        progress
      } as any;
    }));
  }

  async getFlashcardSetsByUserId(userId: number): Promise<FlashcardSet[]> {
    return Array.from(this.flashcardSets.values()).filter(
      (set) => set.userId === userId,
    );
  }

  async getFlashcardSet(id: number): Promise<FlashcardSet | undefined> {
    const set = this.flashcardSets.get(id);
    if (!set) return undefined;
    
    // Enrich with additional data
    const cards = await this.getFlashcards(set.id);
    const totalCards = cards.length;
    // Calculate a mock progress based on created date (for demo purposes)
    const progress = totalCards > 0 ? Math.min(0.75, Math.random() * 0.8) : 0;
    
    return {
      ...set,
      totalCards,
      progress
    } as any;
  }

  async createFlashcardSet(set: InsertFlashcardSet): Promise<FlashcardSet> {
    const id = this.currentSetId++;
    const newSet: FlashcardSet = { 
      id, 
      title: set.title,
      description: set.description || null,
      tags: set.tags || null,
      primaryColor: set.primaryColor || null,
      backgroundImage: set.backgroundImage || null,
      userId: set.userId || null,
      createdAt: new Date(),
      lastAccessed: new Date() 
    };
    this.flashcardSets.set(id, newSet);
    
    // Return enriched data
    const enrichedSet = await this.getFlashcardSet(id);
    return enrichedSet as FlashcardSet;
  }

  async updateFlashcardSet(id: number, set: Partial<InsertFlashcardSet>): Promise<FlashcardSet | undefined> {
    const existingSet = this.flashcardSets.get(id);
    if (!existingSet) return undefined;

    const updatedSet: FlashcardSet = { ...existingSet, ...set };
    this.flashcardSets.set(id, updatedSet);
    
    // Return enriched data
    return this.getFlashcardSet(id);
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
    
    // Ensure options is properly typed as Option[]
    const safeOptions: Option[] = Array.isArray(card.options) 
      ? card.options.map((opt: unknown) => {
          const safeOpt = (typeof opt === 'object' && opt !== null) ? opt : {};
          return {
            text: (safeOpt as any).text || '',
            isCorrect: Boolean((safeOpt as any).isCorrect),
            isMultipleSelect: Boolean((safeOpt as any).isMultipleSelect)
          };
        })
      : [];
    
    const newCard: Flashcard = { 
      id, 
      question: card.question,
      options: safeOptions,
      explanation: card.explanation || null,
      imageUrl: card.imageUrl || null,
      setId: card.setId,
      createdAt: new Date() 
    };
    
    this.flashcards.set(id, newCard);
    
    // Update lastAccessed on the set
    this.updateLastAccessed(card.setId);
    
    return newCard;
  }

  async updateFlashcard(id: number, card: Partial<InsertFlashcard>): Promise<Flashcard | undefined> {
    const existingCard = this.flashcards.get(id);
    if (!existingCard) return undefined;

    // Process options safely if provided
    let updatedOptions = existingCard.options;
    if (card.options !== undefined) {
      // Ensure options is properly typed as Option[]
      updatedOptions = card.options.map((opt: unknown) => {
        const safeOpt = (typeof opt === 'object' && opt !== null) ? opt : {};
        return {
          text: (safeOpt as any).text || '',
          isCorrect: Boolean((safeOpt as any).isCorrect),
          isMultipleSelect: Boolean((safeOpt as any).isMultipleSelect)
        };
      });
    }

    // Handle each property explicitly
    const updatedCard: Flashcard = { 
      ...existingCard,
      question: card.question !== undefined ? card.question : existingCard.question,
      options: updatedOptions,
      explanation: card.explanation !== undefined ? card.explanation : existingCard.explanation,
      imageUrl: card.imageUrl !== undefined ? card.imageUrl : existingCard.imageUrl,
      setId: card.setId !== undefined ? card.setId : existingCard.setId,
    };
    
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
  
  // Data persistence methods
  async saveAllData(): Promise<boolean> {
    try {
      if (typeof localStorage !== 'undefined') {
        // Save flashcard sets
        const sets = Array.from(this.flashcardSets.values());
        localStorage.setItem('savedFlashcardSets', JSON.stringify(sets));
        
        // Save flashcards
        const cards = Array.from(this.flashcards.values());
        localStorage.setItem('savedFlashcards', JSON.stringify(cards));
        
        console.log('Saved all data to localStorage');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
      return false;
    }
  }
  
  async loadSavedData(): Promise<boolean> {
    return this.tryLoadingFromLocalStorage();
  }
}

export const storage = new MemStorage();
