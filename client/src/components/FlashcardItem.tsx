import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useLatex } from '@/hooks/useLatex';
import { getOptionLetter } from '@/lib/helpers';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Flashcard } from '@shared/schema';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { CardActions } from '@/components/CardActions';

interface FlashcardItemProps {
  card: Flashcard;
  onEdit: (card: Flashcard) => void;
}

export default function FlashcardItem({ card, onEdit }: FlashcardItemProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { renderLatex } = useLatex(cardRef);
  const { toast } = useToast();

  useEffect(() => {
    renderLatex();
  }, [card, renderLatex]);

  const deleteCardMutation = useMutation({
    mutationFn: async (cardId: number) => {
      await apiRequest('DELETE', `/api/cards/${cardId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sets/${card.setId}/cards`] });
      toast({
        title: 'Card deleted',
        description: 'The card has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete card',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const handleDelete = () => {
    deleteCardMutation.mutate(card.id);
    setConfirmDelete(false);
  };

  return (
    <>
      <Card className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden" ref={cardRef}>
        <CardContent className="p-0">
          <div className="p-5 border-b border-gray-100">
            <div className="flex justify-between items-start mb-4">
              <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-xs font-medium">
                Card #{card.id}
              </div>
              <CardActions 
                card={card} 
                onEdit={onEdit} 
                onDelete={() => setConfirmDelete(true)} 
              />
            </div>
            <div 
              className="text-gray-800 mb-2" 
              dangerouslySetInnerHTML={{ __html: card.question }}
            ></div>
            {card.imageUrl && (
              <div className="mt-3 mb-2">
                <img 
                  src={card.imageUrl} 
                  alt="Card illustration" 
                  className="max-w-full rounded-md border border-gray-200"
                />
              </div>
            )}
          </div>
          <div className="p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2">Options:</div>
            <div className="text-xs space-y-1">
              {card.options[0]?.isMultipleSelect ? (
                <div className="space-y-2">
                  {card.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox id={`option-${index}`} />
                      <div className="flex-grow">
                        <label 
                          htmlFor={`option-${index}`} 
                          className="text-sm font-medium leading-none cursor-pointer"
                          dangerouslySetInnerHTML={{ __html: option.text }}
                        ></label>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup>
                  {card.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <div className="flex-grow">
                        <label 
                          htmlFor={`option-${index}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          dangerouslySetInnerHTML={{ __html: option.text }}
                        ></label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This card will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}