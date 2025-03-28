import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { FlashcardSet, Flashcard } from '@shared/schema';

interface FlashcardDB extends DBSchema {
  'flashcard-sets': {
    key: number;
    value: FlashcardSet;
    indexes: {
      'by-title': string;
      'by-lastAccessed': number;
    };
  };
  'flashcards': {
    key: number;
    value: Flashcard;
    indexes: {
      'by-setId': number;
    };
  };
  'pending-operations': {
    key: string;
    value: PendingOperation;
    indexes: {
      'by-timestamp': number;
    };
  };
  'app-state': {
    key: string;
    value: {
      value: any;
    };
  };
}

interface PendingOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  storeName: 'flashcard-sets' | 'flashcards';
  timestamp: number; 
  payload: any;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
}

let db: IDBPDatabase<FlashcardDB>;

export async function initDB() {
  if (db) return db;
  
  db = await openDB<FlashcardDB>('flashcard-app', 1, {
    upgrade(db) {
      // Create stores for sets
      const setsStore = db.createObjectStore('flashcard-sets', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      setsStore.createIndex('by-title', 'title');
      setsStore.createIndex('by-lastAccessed', 'lastAccessed');
      
      // Create stores for cards
      const cardsStore = db.createObjectStore('flashcards', { 
        keyPath: 'id', 
        autoIncrement: true 
      });
      cardsStore.createIndex('by-setId', 'setId');
      
      // Create store for pending operations
      const pendingStore = db.createObjectStore('pending-operations', {
        keyPath: 'id'
      });
      pendingStore.createIndex('by-timestamp', 'timestamp');
      
      // Create store for app state
      db.createObjectStore('app-state', { keyPath: 'key' });
    }
  });
  
  return db;
}

// Sets operations
export async function getAllSets(): Promise<FlashcardSet[]> {
  await initDB();
  return db.getAll('flashcard-sets');
}

export async function getSetsByUser(userId: number): Promise<FlashcardSet[]> {
  await initDB();
  const allSets = await db.getAll('flashcard-sets');
  return allSets.filter(set => set.userId === userId);
}

export async function getSetById(id: number): Promise<FlashcardSet | undefined> {
  await initDB();
  return db.get('flashcard-sets', id);
}

export async function createSet(set: FlashcardSet): Promise<FlashcardSet> {
  await initDB();
  
  // Set default values
  const now = new Date();
  const newSet: FlashcardSet = {
    ...set,
    createdAt: set.createdAt || now,
    lastAccessed: set.lastAccessed || now,
    userId: set.userId || 1, // Default user ID
  };
  
  // Auto-assign ID if not provided
  if (!newSet.id) {
    // Get the highest ID and increment by 1
    const sets = await getAllSets();
    const maxId = sets.reduce((max, set) => Math.max(max, set.id || 0), 0);
    newSet.id = maxId + 1;
  }
  
  const id = await db.put('flashcard-sets', newSet);
  
  // Add pending operation
  await addPendingOperation({
    operation: 'create',
    storeName: 'flashcard-sets',
    payload: newSet,
    endpoint: '/api/sets',
    method: 'POST'
  });
  
  return { ...newSet, id: newSet.id };
}

export async function updateSet(id: number, updates: Partial<FlashcardSet>): Promise<FlashcardSet | undefined> {
  await initDB();
  
  const existingSet = await getSetById(id);
  if (!existingSet) return undefined;
  
  const updatedSet: FlashcardSet = { 
    ...existingSet, 
    ...updates,
    lastAccessed: new Date() // Update last accessed time
  };
  
  await db.put('flashcard-sets', updatedSet);
  
  // Add pending operation
  await addPendingOperation({
    operation: 'update',
    storeName: 'flashcard-sets',
    payload: updatedSet,
    endpoint: `/api/sets/${id}`,
    method: 'PUT'
  });
  
  return updatedSet;
}

export async function deleteSet(id: number): Promise<boolean> {
  await initDB();
  
  // First, get all cards for this set and delete them
  const cards = await getCardsBySet(id);
  for (const card of cards) {
    await deleteCard(card.id);
  }
  
  // Then delete the set
  await db.delete('flashcard-sets', id);
  
  // Add pending operation
  await addPendingOperation({
    operation: 'delete',
    storeName: 'flashcard-sets',
    payload: { id },
    endpoint: `/api/sets/${id}`,
    method: 'DELETE'
  });
  
  return true;
}

export async function updateLastAccessed(id: number): Promise<boolean> {
  await initDB();
  
  const set = await getSetById(id);
  if (!set) return false;
  
  set.lastAccessed = new Date();
  await db.put('flashcard-sets', set);
  
  // Add pending operation
  await addPendingOperation({
    operation: 'update',
    storeName: 'flashcard-sets',
    payload: set,
    endpoint: `/api/sets/${id}`,
    method: 'PUT'
  });
  
  return true;
}

// Cards operations
export async function getAllCards(): Promise<Flashcard[]> {
  await initDB();
  return db.getAll('flashcards');
}

export async function getCardsBySet(setId: number): Promise<Flashcard[]> {
  await initDB();
  const index = db.transaction('flashcards').store.index('by-setId');
  return index.getAll(setId);
}

export async function getCardById(id: number): Promise<Flashcard | undefined> {
  await initDB();
  return db.get('flashcards', id);
}

export async function createCard(card: Flashcard): Promise<Flashcard> {
  await initDB();
  
  // Set default values
  const now = new Date();
  const newCard: Flashcard = {
    ...card,
    createdAt: card.createdAt || now
  };
  
  // Auto-assign ID if not provided
  if (!newCard.id) {
    // Get the highest ID and increment by 1
    const cards = await getAllCards();
    const maxId = cards.reduce((max, card) => Math.max(max, card.id || 0), 0);
    newCard.id = maxId + 1;
  }
  
  const id = await db.put('flashcards', newCard);
  
  // Add pending operation
  await addPendingOperation({
    operation: 'create',
    storeName: 'flashcards',
    payload: newCard,
    endpoint: '/api/cards',
    method: 'POST'
  });
  
  return { ...newCard, id: newCard.id };
}

export async function updateCard(id: number, updates: Partial<Flashcard>): Promise<Flashcard | undefined> {
  await initDB();
  
  const existingCard = await getCardById(id);
  if (!existingCard) return undefined;
  
  // Don't add updatedAt as it's not in the schema
  const updatedCard: Flashcard = { 
    ...existingCard, 
    ...updates
  };
  
  await db.put('flashcards', updatedCard);
  
  // Add pending operation
  await addPendingOperation({
    operation: 'update',
    storeName: 'flashcards',
    payload: updatedCard,
    endpoint: `/api/cards/${id}`,
    method: 'PUT'
  });
  
  return updatedCard;
}

export async function deleteCard(id: number): Promise<boolean> {
  await initDB();
  await db.delete('flashcards', id);
  
  // Add pending operation
  await addPendingOperation({
    operation: 'delete',
    storeName: 'flashcards',
    payload: { id },
    endpoint: `/api/cards/${id}`,
    method: 'DELETE'
  });
  
  return true;
}

// Pending operations
async function addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp'>): Promise<void> {
  await initDB();
  
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const timestamp = Date.now();
  
  const pendingOp: PendingOperation = {
    ...operation,
    id,
    timestamp
  };
  
  await db.put('pending-operations', pendingOp);
  
  // Store last changes timestamp
  try {
    await db.put('app-state', { value: timestamp }, 'lastChangedAt');
  } catch (error) {
    console.error('Error updating lastChangedAt:', error);
  }
}

export async function getPendingOperations(): Promise<PendingOperation[]> {
  await initDB();
  return db.getAll('pending-operations');
}

export async function removePendingOperation(id: string): Promise<void> {
  await initDB();
  await db.delete('pending-operations', id);
}

// Local Storage Import
export async function importFromLocalStorage(): Promise<boolean> {
  try {
    // Try to get legacy data from localStorage
    const setsJson = localStorage.getItem('flashcard-sets');
    const cardsJson = localStorage.getItem('flashcards');
    
    if (!setsJson && !cardsJson) {
      return false; // Nothing to import
    }
    
    // Parse the data
    const sets = setsJson ? JSON.parse(setsJson) : [];
    const cards = cardsJson ? JSON.parse(cardsJson) : [];
    
    // Import into IndexedDB
    await initDB();
    
    // Import sets
    for (const set of sets) {
      // Skip if already exists
      const existingSet = await getSetById(set.id);
      if (!existingSet) {
        await db.put('flashcard-sets', set);
      }
    }
    
    // Import cards
    for (const card of cards) {
      // Skip if already exists
      const existingCard = await getCardById(card.id);
      if (!existingCard) {
        await db.put('flashcards', card);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error importing from localStorage:', error);
    return false;
  }
}

// Data Export/Import
export async function exportData(): Promise<{ sets: FlashcardSet[], cards: Flashcard[] }> {
  await initDB();
  
  const sets = await getAllSets();
  const cards = await getAllCards();
  
  return { sets, cards };
}

export async function importData(data: { sets: FlashcardSet[], cards: Flashcard[] }): Promise<boolean> {
  try {
    await initDB();
    
    // Clear existing data
    const tx = db.transaction(['flashcard-sets', 'flashcards'], 'readwrite');
    await tx.objectStore('flashcard-sets').clear();
    await tx.objectStore('flashcards').clear();
    await tx.done;
    
    // Import sets
    const setsTx = db.transaction('flashcard-sets', 'readwrite');
    for (const set of data.sets) {
      await setsTx.store.put(set);
    }
    await setsTx.done;
    
    // Import cards
    const cardsTx = db.transaction('flashcards', 'readwrite');
    for (const card of data.cards) {
      await cardsTx.store.put(card);
    }
    await cardsTx.done;
    
    return true;
  } catch (error) {
    console.error('Error importing data:', error);
    return false;
  }
}

// Sync Status
export async function getSyncStatus(): Promise<{
  lastSynced: number | null;
  lastChanged: number | null;
  pending: number;
}> {
  await initDB();
  
  try {
    const pendingOps = await getPendingOperations();
    const lastSyncedEntry = await db.get('app-state', 'lastSyncedAt');
    const lastChangedEntry = await db.get('app-state', 'lastChangedAt');
    
    return {
      lastSynced: lastSyncedEntry ? lastSyncedEntry.value : null,
      lastChanged: lastChangedEntry ? lastChangedEntry.value : null,
      pending: pendingOps.length
    };
  } catch (error) {
    console.error('Error getting sync status:', error);
    return {
      lastSynced: null,
      lastChanged: null,
      pending: 0
    };
  }
}

export function updateLastSynced(): void {
  initDB().then(db => {
    db.put('app-state', { value: Date.now() }, 'lastSyncedAt').catch(error => {
      console.error('Error updating lastSyncedAt:', error);
    });
  });
}

// Sync with server
export async function syncWithServer(): Promise<boolean> {
  if (!navigator.onLine) {
    console.log('Cannot sync while offline');
    return false;
  }
  
  // Check if service worker is ready
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      // Just implement our own sync mechanism instead of using background sync
      console.log('Using manual sync mechanism');
    } catch (error) {
      console.error('Error checking service worker:', error);
    }
  }
  
  // Otherwise, do a manual sync
  return performManualSync();
}

async function performManualSync(): Promise<boolean> {
  try {
    const pendingOps = await getPendingOperations();
    
    if (pendingOps.length === 0) {
      console.log('No pending operations to sync');
      return true;
    }
    
    console.log(`Syncing ${pendingOps.length} operations...`);
    
    // Sort operations by timestamp (oldest first)
    pendingOps.sort((a, b) => a.timestamp - b.timestamp);
    
    let success = true;
    
    for (const op of pendingOps) {
      try {
        const result = await fetch(op.endpoint, {
          method: op.method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: op.method !== 'DELETE' ? JSON.stringify(op.payload) : undefined
        });
        
        if (result.ok) {
          // Remove the pending operation if successful
          await removePendingOperation(op.id);
        } else {
          console.error(`Failed to sync operation ${op.id}: ${result.statusText}`);
          success = false;
        }
      } catch (error) {
        console.error(`Error syncing operation ${op.id}:`, error);
        success = false;
      }
    }
    
    // Update last synced timestamp
    if (success) {
      updateLastSynced();
    }
    
    return success;
  } catch (error) {
    console.error('Error during manual sync:', error);
    return false;
  }
}