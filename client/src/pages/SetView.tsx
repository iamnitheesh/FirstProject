import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import CardCreationModal from '@/components/CardCreationModal';
import FlashcardItem from '@/components/FlashcardItem';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import type { FlashcardSet, Flashcard } from '@shared/schema';

export default function SetView() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | undefined>(undefined);
  const [confirmDelete, setConfirmDelete] = useState(false);
  
  // Fetch set details
  const { 
    data: set,
    isLoading: isLoadingSet,
    error: setError
  } = useQuery<FlashcardSet>({
    queryKey: [`/api/sets/${id}`],
  });
  
  // Fetch cards in the set
  const { 
    data: cards = [],
    isLoading: isLoadingCards,
  } = useQuery<Flashcard[]>({
    queryKey: [`/api/sets/${id}/cards`],
    enabled: !!id
  });
  
  // Delete set mutation
  const deleteSetMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', `/api/sets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
      toast({
        title: 'Set deleted',
        description: 'The flashcard set has been deleted successfully.',
      });
      setLocation('/');
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete set',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleOpenCardModal = () => {
    setEditingCard(undefined);
    setCardModalOpen(true);
  };
  
  const handleEditCard = (card: Flashcard) => {
    setEditingCard(card);
    setCardModalOpen(true);
  };
  
  const handleDeleteSet = () => {
    deleteSetMutation.mutate();
  };
  
  const handleStartStudy = () => {
    setLocation(`/sets/${id}/study`);
  };
  
  // Handle errors
  if (setError) {
    toast({
      title: 'Error loading flashcard set',
      description: 'The requested set could not be found or loaded.',
      variant: 'destructive',
    });
    setLocation('/');
    return null;
  }
  
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
            <Button onClick={handleOpenCardModal} className="bg-primary hover:bg-blue-700">
              <i className="ri-add-line mr-1"></i> Add Card
            </Button>
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
          {/* Set Header */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                {isLoadingSet ? (
                  <>
                    <Skeleton className="h-8 w-64 mb-2" />
                    <Skeleton className="h-4 w-40" />
                  </>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-800">{set?.title}</h1>
                    <p className="text-sm text-gray-600">
                      {set?.description || 'No description'}
                      {set?.createdAt && ` • Created on ${new Date(set.createdAt).toLocaleDateString()}`}
                      {` • ${cards.length} cards`}
                    </p>
                  </>
                )}
              </div>
              
              <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
                <Button 
                  onClick={handleOpenCardModal}
                  className="bg-primary hover:bg-blue-700"
                  disabled={isLoadingSet}
                >
                  <i className="ri-add-line mr-1"></i> Add Card
                </Button>
                <Button 
                  onClick={handleStartStudy}
                  className="bg-secondary hover:bg-green-700"
                  disabled={isLoadingSet || cards.length === 0}
                >
                  <i className="ri-play-line mr-1"></i> Study
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" disabled={isLoadingSet}>
                      <i className="ri-more-2-fill"></i>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Set Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <i className="ri-edit-line mr-2"></i> Edit Set
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <i className="ri-download-line mr-2"></i> Export Set
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <i className="ri-delete-bin-line mr-2"></i> Delete Set
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {set?.tags && set.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
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

          {/* Cards Grid */}
          {isLoadingCards ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                      <Skeleton className="h-6 w-16" />
                      <div className="flex space-x-1">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                    </div>
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="p-4 bg-gray-50">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : cards.length === 0 ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 text-gray-400 rounded-full mb-4">
                <i className="ri-inbox-line text-3xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No flashcards yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first flashcard to this set.</p>
              <Button onClick={handleOpenCardModal} className="bg-primary hover:bg-blue-700">
                <i className="ri-add-line mr-1"></i> Add First Card
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cards.map((card) => (
                <FlashcardItem 
                  key={card.id} 
                  card={card}
                  onEdit={handleEditCard}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <CardCreationModal 
        isOpen={cardModalOpen} 
        onClose={() => setCardModalOpen(false)}
        setId={parseInt(id)}
        editCard={editingCard}
      />
      
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the flashcard set
              and all cards within it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteSet} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteSetMutation.isPending}
            >
              {deleteSetMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
