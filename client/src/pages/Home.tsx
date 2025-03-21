import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/Sidebar';
import SetCreationModal from '@/components/SetCreationModal';
import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDate } from '@/lib/helpers';
import type { FlashcardSet } from '@shared/schema';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [setModalOpen, setSetModalOpen] = useState(false);
  
  // Fetch all flashcard sets
  const { data: sets = [], isLoading } = useQuery<FlashcardSet[]>({
    queryKey: ['/api/sets'],
  });

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
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Flashcard Sets</h2>
              
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sets.map((set) => (
                    <Link key={set.id} href={`/sets/${set.id}`}>
                      <a className="block">
                        <Card 
                          className="shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
                        >
                          <CardContent className="p-0">
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
                          </CardContent>
                        </Card>
                      </a>
                    </Link>
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
    </div>
  );
}
