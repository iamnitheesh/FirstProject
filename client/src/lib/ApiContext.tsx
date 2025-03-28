import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAllSets, 
  getSetById, 
  createSet, 
  updateSet, 
  deleteSet,
  getCardsBySet,
  getCardById,
  createCard,
  updateCard,
  deleteCard,
  importFromLocalStorage
} from './db';
import type { FlashcardSet, Flashcard } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

interface ApiContextType {
  isOffline: boolean;
  isSyncing: boolean;
  // Sets operations
  fetchAllSets: () => Promise<FlashcardSet[]>;
  fetchSetById: (id: number) => Promise<FlashcardSet | undefined>;
  saveSet: (set: Partial<FlashcardSet>) => Promise<FlashcardSet>;
  updateSetById: (id: number, set: Partial<FlashcardSet>) => Promise<FlashcardSet | undefined>;
  removeSet: (id: number) => Promise<boolean>;
  // Cards operations
  fetchCardsBySet: (setId: number) => Promise<Flashcard[]>;
  fetchCardById: (id: number) => Promise<Flashcard | undefined>;
  saveCard: (card: Partial<Flashcard>) => Promise<Flashcard>;
  updateCardById: (id: number, card: Partial<Flashcard>) => Promise<Flashcard | undefined>;
  removeCard: (id: number) => Promise<boolean>;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [migrated, setMigrated] = useState(false);
  const { toast } = useToast();

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Migrate data from localStorage to IndexedDB on first load
  useEffect(() => {
    if (!migrated) {
      setIsSyncing(true);
      importFromLocalStorage()
        .then(success => {
          if (success) {
            console.log('Successfully migrated data from localStorage to IndexedDB');
          }
          setMigrated(true);
          setIsSyncing(false);
        })
        .catch(error => {
          console.error('Error migrating data:', error);
          setMigrated(true);
          setIsSyncing(false);
        });
    }
  }, [migrated]);

  // Sets operations
  const fetchAllSets = async (): Promise<FlashcardSet[]> => {
    try {
      return await getAllSets();
    } catch (error) {
      console.error('Error fetching sets:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch flashcard sets',
        variant: 'destructive'
      });
      return [];
    }
  };

  const fetchSetById = async (id: number): Promise<FlashcardSet | undefined> => {
    try {
      return await getSetById(id);
    } catch (error) {
      console.error(`Error fetching set ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch flashcard set',
        variant: 'destructive'
      });
      return undefined;
    }
  };

  const saveSet = async (set: Partial<FlashcardSet>): Promise<FlashcardSet> => {
    try {
      if ('id' in set && set.id) {
        const updatedSet = await updateSet(set.id, set);
        if (!updatedSet) {
          throw new Error(`Set with ID ${set.id} not found`);
        }
        return updatedSet;
      } else {
        return await createSet(set as FlashcardSet);
      }
    } catch (error) {
      console.error('Error saving set:', error);
      toast({
        title: 'Error',
        description: 'Failed to save flashcard set',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateSetById = async (id: number, set: Partial<FlashcardSet>): Promise<FlashcardSet | undefined> => {
    try {
      return await updateSet(id, set);
    } catch (error) {
      console.error(`Error updating set ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update flashcard set',
        variant: 'destructive'
      });
      return undefined;
    }
  };

  const removeSet = async (id: number): Promise<boolean> => {
    try {
      return await deleteSet(id);
    } catch (error) {
      console.error(`Error deleting set ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete flashcard set',
        variant: 'destructive'
      });
      return false;
    }
  };

  // Cards operations
  const fetchCardsBySet = async (setId: number): Promise<Flashcard[]> => {
    try {
      return await getCardsBySet(setId);
    } catch (error) {
      console.error(`Error fetching cards for set ${setId}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch flashcards',
        variant: 'destructive'
      });
      return [];
    }
  };

  const fetchCardById = async (id: number): Promise<Flashcard | undefined> => {
    try {
      return await getCardById(id);
    } catch (error) {
      console.error(`Error fetching card ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to fetch flashcard',
        variant: 'destructive'
      });
      return undefined;
    }
  };

  const saveCard = async (card: Partial<Flashcard>): Promise<Flashcard> => {
    try {
      if ('id' in card && card.id) {
        const updatedCard = await updateCard(card.id, card);
        if (!updatedCard) {
          throw new Error(`Card with ID ${card.id} not found`);
        }
        return updatedCard;
      } else {
        return await createCard(card as Flashcard);
      }
    } catch (error) {
      console.error('Error saving card:', error);
      toast({
        title: 'Error',
        description: 'Failed to save flashcard',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const updateCardById = async (id: number, card: Partial<Flashcard>): Promise<Flashcard | undefined> => {
    try {
      return await updateCard(id, card);
    } catch (error) {
      console.error(`Error updating card ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to update flashcard',
        variant: 'destructive'
      });
      return undefined;
    }
  };

  const removeCard = async (id: number): Promise<boolean> => {
    try {
      return await deleteCard(id);
    } catch (error) {
      console.error(`Error deleting card ${id}:`, error);
      toast({
        title: 'Error',
        description: 'Failed to delete flashcard',
        variant: 'destructive'
      });
      return false;
    }
  };

  const value = {
    isOffline,
    isSyncing,
    fetchAllSets,
    fetchSetById,
    saveSet,
    updateSetById,
    removeSet,
    fetchCardsBySet,
    fetchCardById,
    saveCard,
    updateCardById,
    removeCard
  };

  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>;
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};