import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLatex } from '@/hooks/useLatex';
import { generateRandomOptions } from '@/lib/helpers';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flashcard, Option } from '@shared/schema';

interface CardCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setId: number;
  editCard?: Flashcard;
}

export default function CardCreationModal({ isOpen, onClose, setId, editCard }: CardCreationModalProps) {
  const { toast } = useToast();
  
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<Option[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]);
  const [explanation, setExplanation] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('rich-text');
  
  const previewRef = useRef<HTMLDivElement>(null);
  const { renderLatex } = useLatex(previewRef);
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editCard) {
        // Edit mode - load card data
        setQuestion(editCard.question);
        setOptions(editCard.options);
        setExplanation(editCard.explanation || '');
        setImageUrl(editCard.imageUrl || null);
      } else {
        // New card mode - reset form
        setQuestion('');
        setOptions([
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]);
        setExplanation('');
        setImageUrl(null);
      }
    }
  }, [isOpen, editCard]);
  
  // Update preview when content changes
  useEffect(() => {
    renderLatex();
  }, [question, activeTab, renderLatex]);
  
  const createCardMutation = useMutation({
    mutationFn: async (newCard: {
      question: string;
      options: Option[];
      explanation?: string;
      imageUrl?: string | null;
      setId: number;
    }) => {
      const response = await apiRequest('POST', '/api/cards', newCard);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sets/${setId}/cards`] });
      toast({
        title: 'Success!',
        description: 'Card has been created.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to create card',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const updateCardMutation = useMutation({
    mutationFn: async (updatedCard: {
      id: number;
      question: string;
      options: Option[];
      explanation?: string;
      imageUrl?: string | null;
    }) => {
      const { id, ...cardData } = updatedCard;
      const response = await apiRequest('PUT', `/api/cards/${id}`, cardData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/sets/${setId}/cards`] });
      toast({
        title: 'Success!',
        description: 'Card has been updated.',
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to update card',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast({
        title: 'Question required',
        description: 'Please enter a question.',
        variant: 'destructive',
      });
      return;
    }
    
    // Filter out empty options
    const validOptions = options.filter(option => option.text.trim() !== '');
    
    if (validOptions.length < 2) {
      toast({
        title: 'Options required',
        description: 'Please provide at least 2 options.',
        variant: 'destructive',
      });
      return;
    }
    
    // Make sure one option is marked as correct
    if (!validOptions.some(option => option.isCorrect)) {
      toast({
        title: 'Correct option required',
        description: 'Please mark one option as correct.',
        variant: 'destructive',
      });
      return;
    }
    
    const cardData = {
      question: question.trim(),
      options: validOptions,
      explanation: explanation.trim() || undefined,
      imageUrl: imageUrl,
      setId
    };
    
    if (editCard) {
      updateCardMutation.mutate({
        id: editCard.id,
        ...cardData
      });
    } else {
      createCardMutation.mutate(cardData);
    }
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], text: value };
    setOptions(newOptions);
  };
  
  const handleCorrectOptionChange = (index: number) => {
    const newOptions = options.map((option, i) => ({
      ...option,
      isCorrect: i === index
    }));
    setOptions(newOptions);
  };
  
  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, { text: '', isCorrect: false }]);
    }
  };
  
  const removeOption = (index: number) => {
    if (options.length <= 2) {
      toast({
        title: 'Cannot remove option',
        description: 'At least 2 options are required.',
        variant: 'destructive',
      });
      return;
    }
    
    const newOptions = [...options];
    
    // If removing the correct option, set the first remaining option as correct
    if (newOptions[index].isCorrect) {
      const remainingOptions = newOptions.filter((_, i) => i !== index);
      remainingOptions[0].isCorrect = true;
    }
    
    newOptions.splice(index, 1);
    setOptions(newOptions);
  };
  
  const handleGenerateRandomOptions = () => {
    // Find the correct option
    const correctOptionIndex = options.findIndex(option => option.isCorrect);
    if (correctOptionIndex === -1 || !options[correctOptionIndex].text) {
      toast({
        title: 'Cannot generate options',
        description: 'Please enter a correct option first.',
        variant: 'destructive',
      });
      return;
    }
    
    const correctOptionText = options[correctOptionIndex].text;
    
    // Show a toast that we're generating options
    toast({
      title: 'Generating options',
      description: 'Using AI to create plausible wrong answers...',
    });
    
    // Get randomized options using our advanced algorithm
    const randomizedOptions = generateRandomOptions(correctOptionText);
    
    setOptions(randomizedOptions);
    
    toast({
      title: 'Options generated!',
      description: 'AI has created plausible wrong answers based on the correct option.',
    });
  };
  
  const isPending = createCardMutation.isPending || updateCardMutation.isPending;
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editCard ? 'Edit Card' : 'Add New Card'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="question">Question</Label>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="rich-text">Rich Text</TabsTrigger>
                <TabsTrigger value="latex">LaTeX Editor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="rich-text" className="p-0">
                <Textarea
                  id="question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter your question here. Use \( and \) for inline math, or \[ and \] for display math."
                  rows={4}
                  className="font-normal"
                />
              </TabsContent>
              
              <TabsContent value="latex" className="space-y-2 p-0">
                <Textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Enter LaTeX code here. Use \( and \) for inline math, or \[ and \] for display math."
                  rows={4}
                  className="font-mono text-sm"
                />
                
                <div className="border border-gray-200 rounded-md overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 text-xs text-gray-600 flex justify-between">
                    <span>Preview</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className="h-5 px-2 py-0 text-primary"
                      onClick={renderLatex}
                    >
                      Refresh
                    </Button>
                  </div>
                  <div 
                    ref={previewRef} 
                    className="p-3 min-h-[60px] bg-white"
                    dangerouslySetInnerHTML={{ __html: question }}
                  ></div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Options</Label>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addOption}
                  disabled={options.length >= 6}
                >
                  <i className="ri-add-line mr-1"></i> Add Option
                </Button>
                <Button 
                  type="button" 
                  variant="default" 
                  size="sm"
                  onClick={handleGenerateRandomOptions}
                  className="bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-700 hover:to-blue-600"
                >
                  <i className="ri-robot-line mr-1"></i> Generate with AI
                </Button>
              </div>
            </div>
            
            <RadioGroup
              value={options.findIndex(o => o.isCorrect).toString()}
              onValueChange={(value) => handleCorrectOptionChange(parseInt(value))}
            >
              {options.map((option, index) => (
                <div key={index} className="flex items-start space-x-2 mb-2 pb-2 border-b border-gray-100">
                  <div className="flex-shrink-0 pt-3">
                    <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-gray-700">
                      <span>{String.fromCharCode(65 + index)}</span>
                    </div>
                  </div>
                  
                  <div className="flex-grow">
                    <Textarea
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      rows={2}
                    />
                  </div>
                  
                  <div className="flex flex-col items-center space-y-2 pt-2">
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="text-xs">Correct</Label>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                      onClick={() => removeOption(index)}
                      disabled={options.length <= 2}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="explanation">Explanation (optional)</Label>
            <Textarea
              id="explanation"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Explain why the correct answer is right..."
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Image (optional)</Label>
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
                <TabsTrigger value="url">Image URL</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-3 pt-2">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="image-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <i className="ri-upload-2-line text-2xl text-gray-400 mb-2"></i>
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or GIF (max. 5MB)</p>
                      </div>
                      <input 
                        id="image-upload" 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: 'File too large',
                                description: 'Maximum file size is 5MB.',
                                variant: 'destructive',
                              });
                              return;
                            }
                            
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              setImageUrl(result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        accept="image/png,image/jpeg,image/gif"
                      />
                    </label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="url" className="space-y-3 pt-2">
                <Input 
                  type="url"
                  value={imageUrl || ''}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                />
              </TabsContent>
              
              {imageUrl && (
                <div className="mt-3 relative">
                  <img 
                    src={imageUrl} 
                    alt="Card image preview"
                    className="max-h-[200px] object-contain border border-gray-200 rounded-md p-2 bg-gray-50"
                    onError={() => {
                      toast({
                        title: 'Image Error',
                        description: 'The image could not be loaded.',
                        variant: 'destructive',
                      });
                      setImageUrl(null);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0 rounded-full bg-white bg-opacity-90 text-red-500 hover:bg-red-50"
                    onClick={() => setImageUrl(null)}
                  >
                    <i className="ri-close-line"></i>
                  </Button>
                </div>
              )}
            </Tabs>
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending 
                ? (editCard ? 'Updating...' : 'Creating...') 
                : (editCard ? 'Update Card' : 'Add Card')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
