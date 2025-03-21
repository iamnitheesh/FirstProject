import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

interface SetCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SetCreationModal({ isOpen, onClose }: SetCreationModalProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  
  const createSetMutation = useMutation({
    mutationFn: async (newSet: { 
      title: string; 
      description?: string; 
      tags?: string[];
      primaryColor?: string;
    }) => {
      const response = await apiRequest('POST', '/api/sets', newSet);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
      toast({
        title: 'Success!',
        description: `"${data.title}" set has been created.`,
      });
      onClose();
      setLocation(`/sets/${data.id}`);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Failed to create set',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a title for your flashcard set.',
        variant: 'destructive',
      });
      return;
    }
    
    createSetMutation.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      primaryColor
    });
  };
  
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };
  
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setTags([]);
    setTagInput('');
    setPrimaryColor('#3b82f6');
  };
  
  // Color options
  const colorOptions = [
    '#3b82f6', // blue
    '#10b981', // green
    '#8b5cf6', // purple
    '#ef4444', // red
    '#f59e0b', // yellow
  ];
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Set</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1">
            <Label htmlFor="setTitle">Set Title</Label>
            <Input
              id="setTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Calculus Derivatives"
              required
            />
          </div>
          
          <div className="space-y-1">
            <Label htmlFor="setDescription">Description (optional)</Label>
            <Textarea
              id="setDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this set"
              rows={3}
            />
          </div>
          
          <div className="space-y-1">
            <Label>Tags</Label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, index) => (
                  <div 
                    key={index}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md flex items-center"
                  >
                    {tag}
                    <button 
                      type="button"
                      className="ml-1 text-blue-600 hover:text-blue-800"
                      onClick={() => removeTag(tag)}
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add a tag..."
                className="rounded-r-none"
              />
              <Button 
                type="button"
                onClick={addTag}
                className="rounded-l-none"
                variant="secondary"
              >
                Add
              </Button>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label>Appearance</Label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-full h-8 rounded ${primaryColor === color ? 'ring-2 ring-offset-2' : 'hover:ring-2 hover:ring-offset-1'}`}
                  style={{ backgroundColor: color, ringColor: color }}
                  onClick={() => setPrimaryColor(color)}
                />
              ))}
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={createSetMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createSetMutation.isPending}
            >
              {createSetMutation.isPending ? 'Creating...' : 'Create Set'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
