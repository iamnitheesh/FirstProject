import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import SetCreationModal from '@/components/SetCreationModal';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/helpers';
import type { FlashcardSet } from '@shared/schema';
import FlashcardSetCard from '@/components/FlashcardSetCard';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/input';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'lastEdited' | 'recentlyUsed'>('lastEdited');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
    // Load auto-save preference from localStorage
    const savedPreference = localStorage.getItem('autoSaveEnabled');
    return savedPreference ? JSON.parse(savedPreference) : true;
  });
  
  // Fetch all flashcard sets
  const { data: sets = [], isLoading } = useQuery<FlashcardSet[]>({
    queryKey: ['/api/sets'],
  });
  
  // Toggle auto-save functionality
  const toggleAutoSave = () => {
    const newValue = !autoSaveEnabled;
    setAutoSaveEnabled(newValue);
    localStorage.setItem('autoSaveEnabled', JSON.stringify(newValue));
    
    toast({
      title: newValue ? 'Auto-save enabled' : 'Auto-save disabled',
      description: newValue 
        ? 'Your flashcards will be automatically saved to local storage' 
        : 'Changes will only be saved when you manually save',
    });
  };
  
  // Effect to store sets in localStorage whenever they change (auto-save)
  useEffect(() => {
    if (autoSaveEnabled && sets.length > 0) {
      try {
        localStorage.setItem('savedFlashcardSets', JSON.stringify(sets));
        console.log('Auto-saved flashcard sets to local storage');
      } catch (error) {
        console.error('Error auto-saving to localStorage:', error);
      }
    }
  }, [sets, autoSaveEnabled]);
  
  // Manually save all data to local storage
  const saveAllData = () => {
    try {
      localStorage.setItem('savedFlashcardSets', JSON.stringify(sets));
      toast({
        title: 'Data saved',
        description: 'All flashcard sets have been saved to your device storage',
      });
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      toast({
        title: 'Save failed',
        description: 'Failed to save data to device storage. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Filter and sort flashcard sets
  const filteredAndSortedSets = sets
    .filter(set => {
      if (!searchQuery) return true;
      return (
        set.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (set.description && set.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (set.tags && set.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      );
    })
    .sort((a, b) => {
      if (sortBy === 'alphabetical') {
        return a.title.localeCompare(b.title);
      } else if (sortBy === 'lastEdited') {
        // Use createdAt since updatedAt is not available in the current schema
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      } else {
        const dateA = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
        const dateB = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
        return dateB - dateA;
      }
    });

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-white hover:bg-blue-500/30"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="ri-menu-line text-xl"></i>
            </Button>
            <div className="flex items-center space-x-2">
              <div className="bg-white/20 p-1.5 rounded-lg">
                <i className="ri-book-open-line text-white text-lg"></i>
              </div>
              <h1 className="text-xl font-bold">
                FormulaNote
              </h1>
            </div>
            <div className="hidden md:flex text-sm text-blue-100 bg-blue-500/30 rounded-full px-3 py-1 items-center ml-4">
              <span><i className="ri-checkbox-circle-line text-xs mr-1"></i> Offline Ready</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              onClick={() => setSetModalOpen(true)} 
              className="bg-white text-blue-700 hover:bg-blue-50 shadow-sm font-medium"
            >
              <i className="ri-add-line mr-1.5"></i> New Set
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="text-white hover:bg-blue-500/30 rounded-full">
                <i className="ri-settings-3-line text-lg"></i>
              </Button>
            </Link>
            <div className="w-9 h-9 rounded-full bg-white text-blue-700 flex items-center justify-center shadow-sm">
              <span className="font-semibold text-sm">JS</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50">
          {/* Welcome State / Dashboard */}
          {sets.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full mx-auto">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-2xl mb-2">
                    <i className="ri-book-open-line text-3xl"></i>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-800">Welcome to FormulaNote</h2>
                  <p className="text-gray-600 max-w-xl mx-auto">
                    Create customizable mathematical flashcards with rich LaTeX formatting to 
                    master complex formulas and concepts.
                  </p>
                  <div className="pt-4">
                    <Button 
                      onClick={() => setSetModalOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-5 h-auto rounded-lg font-semibold shadow-md"
                      size="lg"
                    >
                      <i className="ri-add-line mr-2"></i> Create Your First Set
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Your Flashcard Sets</h2>
                
                {/* Auto-save toggle */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={saveAllData}
                  >
                    <i className="ri-save-line mr-1"></i> Save All
                  </Button>
                  
                  <Button 
                    variant={autoSaveEnabled ? "default" : "outline"} 
                    size="sm" 
                    className="flex items-center gap-1"
                    onClick={toggleAutoSave}
                  >
                    {autoSaveEnabled ? (
                      <>
                        <i className="ri-checkbox-circle-line"></i> Auto-save On
                      </>
                    ) : (
                      <>
                        <i className="ri-checkbox-blank-circle-line"></i> Auto-save Off
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Search and Filter Controls */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <i className="ri-search-line text-gray-400"></i>
                    </div>
                    <Input
                      type="text"
                      placeholder="Search flashcard sets..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Select 
                      value={sortBy} 
                      onValueChange={(value) => setSortBy(value as any)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alphabetical">Alphabetical</SelectItem>
                        <SelectItem value="lastEdited">Last Edited</SelectItem>
                        <SelectItem value="recentlyUsed">Recently Used</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex rounded-md overflow-hidden">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        size="icon"
                        className="rounded-none rounded-l-md"
                        onClick={() => setViewMode('grid')}
                      >
                        <i className="ri-grid-fill"></i>
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'outline'}
                        size="icon"
                        className="rounded-none rounded-r-md"
                        onClick={() => setViewMode('list')}
                      >
                        <i className="ri-list-check"></i>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Flashcard Sets Grid/List */}
              <div className="mt-4">
                {isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {Array(6).fill(0).map((_, idx) => (
                      <div key={idx} className="bg-white rounded-md shadow-sm overflow-hidden">
                        <Skeleton className="h-40 w-full" />
                        <div className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6" 
                    : "space-y-4 sm:space-y-5"
                  }>
                    {filteredAndSortedSets.map((set) => (
                      <FlashcardSetCard
                        key={set.id}
                        set={set}
                        onDelete={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <SetCreationModal 
        isOpen={setModalOpen} 
        onClose={() => setSetModalOpen(false)} 
      />
    </div>
  );
}