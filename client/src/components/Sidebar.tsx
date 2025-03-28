import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import SetCreationModal from './SetCreationModal';
import { formatDate } from '@/lib/helpers';
import type { FlashcardSet } from '@shared/schema';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [setModalOpen, setSetModalOpen] = useState(false);
  
  // Fetch all flashcard sets
  const { data: sets = [], isLoading } = useQuery<FlashcardSet[]>({
    queryKey: ['/api/sets'],
  });

  // Sort sets by last accessed time for the history section
  const recentSets = [...sets]
    .filter(set => set.lastAccessed)
    .sort((a, b) => {
      const dateA = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
      const dateB = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5); // Show only the 5 most recent

  // Close sidebar on mobile when changing routes
  useEffect(() => {
    if (isMobile) {
      onClose();
    }
  }, [location, isMobile, onClose]);

  // Extract unique tags from all sets
  const allTags = sets.flatMap(set => set.tags || []);
  const uniqueTags = Array.from(new Set(allTags));

  const isActive = (path: string) => location === path;

  return (
    <>
      <aside 
        className={`fixed md:relative z-30 w-64 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <ScrollArea className="h-full">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Sets</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2"
                onClick={() => setSetModalOpen(true)}
              >
                <i className="ri-add-line mr-1"></i>
                New
              </Button>
            </div>
            
            <div className="space-y-1 mb-6">
              {isLoading ? (
                Array(3).fill(0).map((_, idx) => (
                  <div key={idx} className="h-9 bg-gray-100 animate-pulse rounded-md mb-1"></div>
                ))
              ) : sets.length > 0 ? (
                sets.map((set) => (
                  <Link 
                    key={set.id} 
                    href={`/sets/${set.id}`}
                  >
                    <a className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                      isActive(`/sets/${set.id}`) 
                        ? 'bg-blue-50 text-primary' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                      <i className="ri-flashcard-line mr-2"></i>
                      {set.title}
                    </a>
                  </Link>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-500">
                  No sets found. Create one!
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Recent History</h2>
              </div>
              
              <div className="space-y-1">
                {recentSets.length > 0 ? (
                  recentSets.map((set) => (
                    <Link key={set.id} href={`/sets/${set.id}`}>
                      <a className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md">
                        <div className="flex items-center">
                          <i className="ri-history-line mr-2"></i>
                          <span className="truncate">{set.title}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(set.lastAccessed)}
                        </span>
                      </a>
                    </Link>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-500">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
            
            {uniqueTags.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {uniqueTags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="space-y-1">
              <Link href="/settings">
                <a className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                  isActive(`/settings`) 
                    ? 'bg-blue-50 text-primary' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <i className="ri-settings-4-line mr-2"></i>
                  Settings
                </a>
              </Link>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-gray-700"
              >
                <i className="ri-question-line mr-2"></i>
                Help & Support
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
      
      {/* Backdrop for mobile */}
      {isOpen && isMobile && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 md:hidden"
          onClick={onClose}
        />
      )}
      
      <SetCreationModal 
        isOpen={setModalOpen} 
        onClose={() => setSetModalOpen(false)} 
      />
    </>
  );
}
