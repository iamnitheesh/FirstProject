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
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Settings, HelpCircle, FileText, Share2, Menu } from 'lucide-react';

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
                    <div className={`flex items-center w-full px-3 py-2 text-sm rounded-md cursor-pointer ${
                      isActive(`/sets/${set.id}`) 
                        ? 'bg-blue-50 text-primary' 
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
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 cursor-pointer"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <Separator className="my-4" />
            
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menu</span>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2 h-8">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  
                  <Link href="/settings" className="w-full">
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </Link>
                  
                  <Link href="/help" className="w-full">
                    <DropdownMenuItem>
                      <HelpCircle className="mr-2 h-4 w-4" />
                      <span>Help & Support</span>
                    </DropdownMenuItem>
                  </Link>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => {
                    const theme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                    if (theme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                    localStorage.setItem('theme', theme);
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="5"></circle>
                      <line x1="12" y1="1" x2="12" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="23"></line>
                      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                      <line x1="1" y1="12" x2="3" y2="12"></line>
                      <line x1="21" y1="12" x2="23" y2="12"></line>
                      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                    </svg>
                    <span>Toggle Dark Mode</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <Link href="/settings?tab=export" className="w-full">
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>Export All Sets to PDF</span>
                    </DropdownMenuItem>
                  </Link>
                  
                  <DropdownMenuItem onClick={() => {
                    alert("In a production environment, this would build and generate an Android APK file that includes all your current flashcard sets. The APK would be configured to request storage permissions for saving updates and new sets.");
                  }}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share App (APK)</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
