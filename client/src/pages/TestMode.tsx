import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLatex } from '@/hooks/useLatex';
import { getOptionLetter } from '@/lib/helpers';
import { apiRequest } from '@/lib/queryClient';
import type { Flashcard, FlashcardSet } from '@shared/schema';

export default function TestMode() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Test state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number | null>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testStartTime, setTestStartTime] = useState<Date>(new Date());
  const [timeSpent, setTimeSpent] = useState(0);
  const [timerIntervalId, setTimerIntervalId] = useState<NodeJS.Timeout | null>(null);
  
  // Results tracking
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [incorrectAnswers, setIncorrectAnswers] = useState(0);
  const [skippedAnswers, setSkippedAnswers] = useState(0);
  
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
  
  // Start timer when test begins
  useEffect(() => {
    if (!isLoadingCards && cards.length > 0) {
      const intervalId = setInterval(() => {
        setTimeSpent(prev => prev + 1);
      }, 1000);
      
      setTimerIntervalId(intervalId);
      return () => clearInterval(intervalId);
    }
  }, [isLoadingCards, cards.length]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalId) {
        clearInterval(timerIntervalId);
      }
    };
  }, [timerIntervalId]);
  
  // Get current card
  const currentCard = cards[currentCardIndex];
  
  // Render LaTeX when card changes
  useEffect(() => {
    renderLatex();
  }, [currentCard, renderLatex]);
  
  // Handle errors
  useEffect(() => {
    if (setError || cardsError) {
      toast({
        title: 'Error loading test materials',
        description: 'Could not load the flashcard set or cards.',
        variant: 'destructive',
      });
      setLocation('/');
    }
  }, [setError, cardsError, toast, setLocation]);
  
  // Check if there are no cards
  useEffect(() => {
    if (!isLoadingCards && cards.length === 0) {
      toast({
        title: 'No flashcards available',
        description: 'This set does not contain any flashcards to test on.',
      });
      setLocation(`/sets/${id}`);
    }
  }, [isLoadingCards, cards, id, toast, setLocation]);
  
  const handleSelectOption = (cardId: number, optionIndex: number) => {
    if (isSubmitted) return;
    
    setSelectedOptions(prev => ({
      ...prev,
      [cardId]: optionIndex
    }));
  };
  
  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
    }
  };
  
  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };
  
  const handleSubmitTest = () => {
    // Stop timer
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
      setTimerIntervalId(null);
    }
    
    // Calculate results
    let correct = 0;
    let incorrect = 0;
    let skipped = 0;
    
    cards.forEach(card => {
      const selectedOption = selectedOptions[card.id];
      
      if (selectedOption === null || selectedOption === undefined) {
        skipped++;
      } else if (card.options[selectedOption]?.isCorrect) {
        correct++;
      } else {
        incorrect++;
      }
    });
    
    setCorrectAnswers(correct);
    setIncorrectAnswers(incorrect);
    setSkippedAnswers(skipped);
    setIsSubmitted(true);
    
    // Save test results (could be implemented to send to server)
    const endTime = new Date();
    const totalTimeMs = endTime.getTime() - testStartTime.getTime();
    
    toast({
      title: 'Test Complete!',
      description: `You got ${correct} out of ${cards.length} questions correct.`,
      variant: 'default',
      className: 'bg-blue-50 border-blue-200 text-blue-800',
    });
  };
  
  const handleExitTest = () => {
    // Clean up timer
    if (timerIntervalId) {
      clearInterval(timerIntervalId);
    }
    setLocation(`/sets/${id}`);
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  const getScorePercentage = () => {
    if (cards.length === 0) return 0;
    return Math.round((correctAnswers / cards.length) * 100);
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
  
  // Show results when test is submitted
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 flex justify-center">
        <div className="max-w-2xl w-full mt-12">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-xl font-bold text-gray-800">Test Results: {set?.title}</h1>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExitTest}
            >
              <i className="ri-close-line mr-1"></i> Exit
            </Button>
          </div>
          
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 text-blue-600 rounded-full mb-4 text-3xl font-bold">
                  {getScorePercentage()}%
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Test Complete!</h2>
                <p className="text-gray-600">
                  You completed the test in {formatTime(timeSpent)}.
                </p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">{correctAnswers}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-red-600 mb-1">{incorrectAnswers}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-3xl font-bold text-gray-600 mb-1">{skippedAnswers}</div>
                  <div className="text-sm text-gray-600">Skipped</div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => {
                    setCurrentCardIndex(0);
                    setSelectedOptions({});
                    setIsSubmitted(false);
                    setTestStartTime(new Date());
                    setTimeSpent(0);
                    setTimerIntervalId(setInterval(() => {
                      setTimeSpent(prev => prev + 1);
                    }, 1000));
                  }}
                  className="bg-primary hover:bg-blue-700"
                >
                  <i className="ri-restart-line mr-1"></i> Retake Test
                </Button>
                <Button 
                  onClick={handleExitTest}
                  variant="outline"
                >
                  Return to Set
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Analysis</h2>
          
          {cards.map((card, index) => {
            const selectedOption = selectedOptions[card.id];
            const isCorrect = selectedOption !== undefined && selectedOption !== null && card.options[selectedOption]?.isCorrect;
            const isSkipped = selectedOption === undefined || selectedOption === null;
            const correctOptionIndex = card.options.findIndex(opt => opt.isCorrect);
            
            return (
              <Card key={card.id} className={`mb-4 ${
                isCorrect ? 'border-green-200' : (isSkipped ? 'border-gray-200' : 'border-red-200')
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs ${
                      isCorrect ? 'bg-green-100 text-green-600' :
                      (isSkipped ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600')
                    }`}>
                      {isCorrect ? '✓' : (isSkipped ? '–' : '✗')}
                    </div>
                    <div className="font-medium text-gray-800">Question {index + 1}</div>
                  </div>
                  
                  <div className="mb-3 text-gray-800">{card.question}</div>
                  
                  <div className="space-y-2 mb-3">
                    {card.options.map((option, optIdx) => (
                      <div 
                        key={optIdx}
                        className={`p-2 rounded-md ${
                          option.isCorrect ? 'bg-green-50 border border-green-200' :
                          (selectedOption === optIdx && !option.isCorrect ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-200')
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-2 text-xs font-medium ${
                            option.isCorrect ? 'bg-green-100 text-green-600' :
                            (selectedOption === optIdx && !option.isCorrect ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600')
                          }`}>
                            {getOptionLetter(optIdx)}
                          </div>
                          <div>{option.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {card.explanation && (
                    <div className="bg-blue-50 p-3 rounded-md text-sm text-gray-700">
                      <div className="font-medium mb-1">Explanation:</div>
                      <div>{card.explanation}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 flex justify-center">
      <div className="max-w-2xl w-full mt-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Test: {set?.title}</h1>
            <div className="flex items-center text-sm text-gray-600">
              <div className="flex items-center mr-3">
                <i className="ri-time-line mr-1"></i> {formatTime(timeSpent)}
              </div>
              <div>
                Question {currentCardIndex + 1} of {cards.length}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExitTest}
          >
            <i className="ri-close-line mr-1"></i> Exit
          </Button>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-1">
            <span>Answered: {Object.keys(selectedOptions).length} of {cards.length}</span>
            <span>{Math.round((Object.keys(selectedOptions).length / cards.length) * 100)}% Complete</span>
          </div>
          <Progress value={(Object.keys(selectedOptions).length / cards.length) * 100} />
        </div>
        
        {/* Question Card */}
        <Card className="bg-white rounded-xl shadow-md mb-6">
          <CardContent className="p-6 sm:p-8" ref={cardRef}>
            <div className="text-sm text-gray-500 mb-2">Question {currentCardIndex + 1}</div>
            <div className="text-xl font-medium text-gray-800 mb-6">{currentCard?.question}</div>
            
            <div className="space-y-3 mb-4">
              {currentCard?.options.map((option, index) => (
                <div 
                  key={index}
                  onClick={() => handleSelectOption(currentCard.id, index)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedOptions[currentCard.id] === index 
                      ? 'bg-blue-50 border-blue-300' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full mr-3 text-xs font-medium ${
                      selectedOptions[currentCard.id] === index 
                        ? 'bg-blue-200 text-blue-700' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {getOptionLetter(index)}
                    </div>
                    <div>{option.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
          >
            <i className="ri-arrow-left-line mr-1"></i> Previous
          </Button>
          
          <div className="flex gap-2">
            {currentCardIndex === cards.length - 1 ? (
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleSubmitTest}
              >
                <i className="ri-check-double-line mr-1"></i> Submit Test
              </Button>
            ) : (
              <Button 
                className="bg-primary hover:bg-blue-700"
                onClick={handleNextCard}
              >
                Next <i className="ri-arrow-right-line ml-1"></i>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}