import { create } from 'zustand';
import { type Flashcard } from '@shared/schema';

type ClipboardOperation = 'copy' | 'cut';

interface ClipboardState {
  operation: ClipboardOperation | null;
  cards: Flashcard[];
  sourceSetId: number | null;
  hasItems: () => boolean;
  addCard: (card: Flashcard, operation: ClipboardOperation) => void;
  addCards: (cards: Flashcard[], operation: ClipboardOperation) => void;
  clear: () => void;
}

export const useClipboard = create<ClipboardState>((set, get) => ({
  operation: null,
  cards: [],
  sourceSetId: null,
  hasItems: () => get().cards.length > 0,
  addCard: (card, operation) => set({ 
    cards: [card],
    operation,
    sourceSetId: card.setId 
  }),
  addCards: (cards, operation) => set({ 
    cards,
    operation,
    sourceSetId: cards.length > 0 ? cards[0].setId : null
  }),
  clear: () => set({ cards: [], operation: null, sourceSetId: null })
}));