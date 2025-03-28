import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { useLatex } from '@/hooks/useLatex';
import { useToast } from '@/hooks/use-toast';
import { getOptionLetter } from '@/lib/helpers';
import { Skeleton } from '@/components/ui/skeleton';
import type { FlashcardSet, Flashcard } from '@shared/schema';

export default function StudyMode() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [completed, setCompleted] = useState(false);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const { renderLatex } = useLatex(cardRef);
  
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
    error: cardsError
  } = useQuery<Flashcard[]>({
    queryKey: [`/api/sets/${id}/cards`],
    enabled: !!id
  });
  
  // Get current card
  const currentCard = cards[currentCardIndex];
  
  // Handle errors
  useEffect(() => {
    if (setError || cardsError) {
      toast({
        title: 'Error loading study materials',
        description: 'Could not load the flashcard set or cards.',
        variant: 'destructive',
      });
      setLocation('/');
    }
  }, [setError, cardsError, toast, setLocation]);
  
  // Render LaTeX when card changes
  useEffect(() => {
    renderLatex();
  }, [currentCard, cardFlipped, renderLatex]);
  
  // Check if there are no cards
  useEffect(() => {
    if (!isLoadingCards && cards.length === 0) {
      toast({
        title: 'No flashcards available',
        description: 'This set does not contain any flashcards to study.',
      });
      setLocation(`/sets/${id}`);
    }
  }, [isLoadingCards, cards, id, toast, setLocation]);
  
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setSelectedOption(null);
      setCardFlipped(false);
    }
  };
  
  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setSelectedOption(null);
      setCardFlipped(false);
    } else if (!completed) {
      setCompleted(true);
    }
  };
  
  const handleSelectOption = (index: number) => {
    setSelectedOption(index);
    
    // If the selected option is correct, display success message
    const option = currentCard?.options[index];
    if (option?.isCorrect) {
      toast({
        title: 'Correct!',
        description: 'You selected the right answer.',
        variant: 'default',
        className: 'bg-green-50 border-green-200 text-green-800',
      });
    }
  };
  
  const handleFlipCard = () => {
    setCardFlipped(!cardFlipped);
  };
  
  const handleExitStudy = () => {
    setLocation(`/sets/${id}`);
  };
  
  if (isLoadingSet || isLoadingCards) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 flex justify-center">
        <div className="max-w-2xl w-full mt-12">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-64 mb-6" />
          <Skeleton className="h-2 w-full mb-6" />
          
          <div className="rounded-xl overflow-hidden">
            <Skeleton className="h-64 w-full mb-6" />
          </div>
          
          <div className="flex justify-between mt-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      </div>
    );
  }
  
  // Handle completion screen
  if (completed) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 flex justify-center items-center">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
            <i className="ri-check-line text-3xl"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Congratulations!</h2>
          <p className="text-gray-600 mb-6">
            You've completed studying all cards in "{set?.title}".
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => {
                setCurrentCardIndex(0);
                setSelectedOption(null);
                setCardFlipped(false);
                setCompleted(false);
              }}
              className="bg-primary hover:bg-blue-700"
            >
              <i className="ri-restart-line mr-1"></i> Study Again
            </Button>
            <Button 
              onClick={handleExitStudy}
              variant="outline"
            >
              Return to Set
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 flex justify-center">
      <div className="max-w-2xl w-full mt-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-800">{set?.title}</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setLocation('/')}
            >
              <i className="ri-home-line"></i> Home
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExitStudy}
            >
              <i className="ri-close-line mr-1"></i> Exit
            </Button>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Card {currentCardIndex + 1} of {cards.length}</span>
            <span>{Math.round(((currentCardIndex + 1) / cards.length) * 100)}%</span>
          </div>
          <Progress value={((currentCardIndex + 1) / cards.length) * 100} />
        </div>
        
        {/* Flashcard */}
        <div className={`card-flip ${cardFlipped ? 'card-flipped' : ''} mb-6`}>
          <div ref={cardRef}>
            {/* Front Side */}
            <Card className="card-front bg-white rounded-xl shadow-md transition-shadow relative">
              <CardContent className="p-6 sm:p-8">
                <div className="absolute top-3 right-3 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    onClick={handleFlipCard}
                  >
                    <i className="ri-refresh-line text-lg"></i>
                  </Button>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Question:</h3>
                  <div 
                    className="text-gray-800 p-3 bg-blue-50 rounded border border-blue-100"
                    dangerouslySetInnerHTML={{ __html: currentCard?.question || '' }}
                  ></div>
                </div>
                
                {/* Answer options */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select the correct answer:</h3>
                  <div className="space-y-2">
                    {currentCard?.options.map((option, index) => (
                      <button
                        key={index}
                        className={`w-full text-left p-3 rounded border transition-colors flex items-start ${
                          selectedOption === index 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => handleSelectOption(index)}
                      >
                        <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full border mr-2 ${
                          selectedOption === index 
                            ? 'bg-primary border-primary text-white' 
                            : 'border-gray-300'
                        }`}>
                          <span>{getOptionLetter(index)}</span>
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: option.text }}></span>
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Back Side (Answer & Explanation) */}
            <Card className="card-back bg-white rounded-xl shadow-md transition-shadow absolute inset-0">
              <CardContent className="p-6 sm:p-8">
                <div className="absolute top-3 right-3 flex space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                    onClick={handleFlipCard}
                  >
                    <i className="ri-refresh-line text-lg"></i>
                  </Button>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 mb-2">Answer:</h3>
                {currentCard?.options.map((option, index) => (
                  option.isCorrect && (
                    <div key={index} className="p-4 bg-green-50 border border-green-100 rounded mb-4">
                      <div 
                        className="font-medium text-gray-800"
                        dangerouslySetInnerHTML={{ __html: option.text }}
                      ></div>
                    </div>
                  )
                ))}
                
                {currentCard?.explanation && (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded">
                    <h4 className="font-medium text-gray-900 mb-1">Explanation:</h4>
                    <div 
                      className="text-gray-700"
                      dangerouslySetInnerHTML={{ __html: currentCard.explanation }}
                    ></div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
            className="gap-1"
          >
            <i className="ri-arrow-left-s-line"></i> Previous
          </Button>
          
          <Button
            className="bg-primary hover:bg-blue-700 gap-1"
            onClick={handleNextCard}
          >
            {currentCardIndex < cards.length - 1 ? (
              <>Next <i className="ri-arrow-right-s-line"></i></>
            ) : (
              <>Finish <i className="ri-check-line"></i></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
