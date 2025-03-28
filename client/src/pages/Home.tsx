import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import SetCreationModal from '@/components/SetCreationModal';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/helpers';
import type { FlashcardSet } from '@shared/schema';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Pencil, 
  Trash, 
  Copy, 
  MoveRight, 
  Search, 
  SortAsc, 
  Clock, 
  Grid3X3, 
  List, 
  Save,
  BookMarked,
  Download,
  Upload
} from 'lucide-react';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [setModalOpen, setSetModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    primaryColor: '',
  });
  const [, navigate] = useLocation();
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
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      } else {
        const dateA = a.lastAccessed ? new Date(a.lastAccessed) : new Date(0);
        const dateB = b.lastAccessed ? new Date(b.lastAccessed) : new Date(0);
        return dateB.getTime() - dateA.getTime();
      }
    });
  
  // Function to handle editing a set
  const handleEditSet = (set: FlashcardSet, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSet(set);
    setEditForm({
      title: set.title,
      description: set.description || '',
      primaryColor: set.primaryColor || '#3b82f6',
    });
    setEditModalOpen(true);
  };
  
  // Function to handle deleting a set
  const handleDeleteSet = (set: FlashcardSet, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSet(set);
    setDeleteDialogOpen(true);
  };
  
  // Function to save edited set
  const saveEditedSet = async () => {
    if (!selectedSet) return;
    
    try {
      const response = await fetch(`/api/sets/${selectedSet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update set');
      }
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
      
      toast({
        title: 'Set updated',
        description: 'The flashcard set has been updated successfully.',
      });
      
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating set:', error);
      toast({
        title: 'Error',
        description: 'Failed to update the flashcard set. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Function to confirm deletion of a set
  const confirmDeleteSet = async () => {
    if (!selectedSet) return;
    
    try {
      const response = await fetch(`/api/sets/${selectedSet.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete set');
      }
      
      // Invalidate cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
      
      toast({
        title: 'Set deleted',
        description: 'The flashcard set has been deleted.',
      });
      
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting set:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete the flashcard set. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="ri-menu-line text-xl"></i>
            </Button>
            <h1 className="text-xl font-semibold text-primary flex items-center">
              <i className="ri-flashcard-line mr-2 text-2xl"></i>
              MathCards
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => setSetModalOpen(true)} className="bg-primary hover:bg-blue-700">
              <i className="ri-add-line mr-1"></i> New Set
            </Button>
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <i className="ri-settings-3-line text-lg"></i>
              </Button>
            </Link>
            <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center">
              <span className="font-medium">JS</span>
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
            <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)]">
              <div className="text-center max-w-md mx-auto">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-primary rounded-full mb-4">
                  <i className="ri-flashcard-line text-3xl"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to MathCards</h2>
                <p className="text-gray-600 mb-6">
                  Create customizable math flashcard sets with LaTeX support
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button 
                    onClick={() => setSetModalOpen(true)}
                    className="bg-primary hover:bg-blue-700"
                  >
                    <i className="ri-add-line mr-1"></i> Create New Set
                  </Button>
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
                    <Save className="h-4 w-4" /> Save All
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
              
              {/* Search and sort controls */}
              <div className="bg-white p-3 rounded-lg shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search flashcard sets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-full"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select
                      value={sortBy}
                      onValueChange={(value: any) => setSortBy(value)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <div className="flex items-center gap-1">
                          <SortAsc className="h-4 w-4" />
                          <span>Sort by</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alphabetical">A-Z (Alphabetical)</SelectItem>
                        <SelectItem value="lastEdited">Last Edited</SelectItem>
                        <SelectItem value="recentlyUsed">Recently Used</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex border rounded-md overflow-hidden">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-none"
                        onClick={() => setViewMode('grid')}
                      >
                        <Grid3X3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? 'default' : 'ghost'}
                        size="sm"
                        className="rounded-none"
                        onClick={() => setViewMode('list')}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {filteredAndSortedSets.length === 0 && searchQuery && (
                  <div className="mt-2 text-sm text-gray-500">
                    No flashcard sets found matching "{searchQuery}". Try a different search term.
                  </div>
                )}
                
                {searchQuery && filteredAndSortedSets.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="px-2 py-1">
                      {filteredAndSortedSets.length} {filteredAndSortedSets.length === 1 ? 'result' : 'results'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={() => setSearchQuery('')}
                    >
                      Clear search
                    </Button>
                  </div>
                )}
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(3).fill(0).map((_, i) => (
                    <Card key={i} className="shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <div className="p-5">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-between">
                          <Skeleton className="h-4 w-1/4" />
                          <Skeleton className="h-4 w-1/4" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" 
                  : "space-y-4"
                }>
                  {filteredAndSortedSets.map((set) => (
                    <Card 
                      key={set.id}
                      className={`shadow-sm hover:shadow-md transition-all overflow-hidden relative group ${
                        viewMode === 'list' ? 'flex' : ''
                      }`}
                    >
                      <div className="absolute top-2 right-2 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => handleEditSet(set, e)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              <span>Rename Set</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDeleteSet(set, e)}>
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Delete Set</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toast({
                                title: "Feature Coming Soon",
                                description: "Copying sets will be available in a future update.",
                              });
                            }}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate Set</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toast({
                                title: "Feature Coming Soon",
                                description: "Moving cards between sets will be available in a future update.",
                              });
                            }}>
                              <MoveRight className="mr-2 h-4 w-4" />
                              <span>Move Cards</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <Link href={`/sets/${set.id}`} className={viewMode === 'list' ? 'flex-1' : ''}>
                        <CardContent className={`p-0 cursor-pointer ${viewMode === 'list' ? 'flex' : ''}`}>
                          {viewMode === 'grid' ? (
                            <>
                              <div 
                                className="h-2 w-full" 
                                style={{ backgroundColor: set.primaryColor || '#3b82f6' }}
                              ></div>
                              <div className="p-5">
                                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                                  {set.title}
                                </h3>
                                {set.description && (
                                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                    {set.description}
                                  </p>
                                )}
                                {set.tags && set.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {set.tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="p-4 bg-gray-50 flex justify-between text-xs text-gray-500">
                                <span>Created: {formatDate(set.createdAt)}</span>
                                <span>Last used: {set.lastAccessed ? formatDate(set.lastAccessed) : 'Never'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div 
                                className="w-2 h-full flex-shrink-0" 
                                style={{ backgroundColor: set.primaryColor || '#3b82f6' }}
                              ></div>
                              <div className="p-4 flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                      {set.title}
                                    </h3>
                                    {set.description && (
                                      <p className="text-sm text-gray-600 line-clamp-1 mt-1">
                                        {set.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 flex flex-col items-end">
                                    <span>Created: {formatDate(set.createdAt)}</span>
                                    <span className="mt-1">Last used: {set.lastAccessed ? formatDate(set.lastAccessed) : 'Never'}</span>
                                  </div>
                                </div>
                                
                                {set.tags && set.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {set.tags.map((tag, i) => (
                                      <span
                                        key={i}
                                        className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <SetCreationModal 
        isOpen={setModalOpen} 
        onClose={() => setSetModalOpen(false)} 
      />
      
      {/* Edit Set Dialog */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Flashcard Set</DialogTitle>
            <DialogDescription>
              Update the title, description, or color of your flashcard set.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="col-span-3"
                placeholder="Enter a title for your set"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="col-span-3"
                placeholder="Optional description of your flashcard set"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <div className="col-span-3 flex space-x-2">
                {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((color) => (
                  <div
                    key={color}
                    className={`w-8 h-8 rounded-full cursor-pointer transition-all ${
                      editForm.primaryColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setEditForm({ ...editForm, primaryColor: color })}
                  ></div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveEditedSet} disabled={!editForm.title.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Flashcard Set</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this flashcard set? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedSet && (
              <div className="p-4 border rounded-md bg-red-50">
                <p className="font-medium text-gray-900">{selectedSet.title}</p>
                {selectedSet.description && (
                  <p className="text-sm text-gray-500 mt-1">{selectedSet.description}</p>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteSet}>
              Delete Set
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
