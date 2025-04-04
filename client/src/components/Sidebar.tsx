import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDevice } from './DeviceContext';
import SetCreationModal from './SetCreationModal';
import { formatDate } from '@/lib/helpers';
import type { FlashcardSet } from '@shared/schema';
import { useTheme } from '../contexts/ThemeContext';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  MoreVertical, 
  Settings, 
  HelpCircle, 
  Menu, 
  Download, 
  Moon, 
  Sun,
  Plus
} from '@/components/ui/icons';
import { ShareApp } from './ShareApp';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const [setModalOpen, setSetModalOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
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
        className={`fixed md:relative z-30 w-64 h-full bg-background border-r border-border transition-transform duration-300 ease-in-out transform ${
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
                <Plus className="h-4 w-4 mr-1" />
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
                    <div className={`flex items-center w-full px-3 py-2 text-sm rounded-md cursor-pointer ${
                      isActive(`/sets/${set.id}`) 
                        ? 'bg-black/10 text-black font-medium' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                      <i className="ri-flashcard-line mr-2"></i>
                      {set.title}
                    </div>
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
                      <div className="flex items-center justify-between w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md cursor-pointer">
                        <div className="flex items-center">
                          <i className="ri-history-line mr-2"></i>
                          <span className="truncate">{set.title}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDate(set.lastAccessed)}
                        </span>
                      </div>
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
                      className="px-2 py-1 text-xs bg-black/10 text-black rounded hover:bg-black/20 cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</span>
              
              <div className="space-y-1">
                <Link href="/settings" className="w-full">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Button>
                </Link>
                
                <Link href="/help" className="w-full">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <HelpCircle className="mr-2 h-4 w-4" />
                    <span>Help & Support</span>
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-start"
                  onClick={toggleTheme}
                >
                  {theme === 'dark' ? (
                    <Sun className="mr-2 h-4 w-4" />
                  ) : (
                    <Moon className="mr-2 h-4 w-4" />
                  )}
                  <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </Button>
                
                <Link href="/settings?tab=export" className="w-full">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <i className="ri-file-text-line mr-2 h-4 w-4" />
                    <span>Export All Sets to PDF</span>
                  </Button>
                </Link>
                
                <ShareApp />
              </div>
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
