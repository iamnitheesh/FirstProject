import { FlashcardSet } from '@shared/schema';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash, Copy, Palette } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface SetActionsProps {
  set: FlashcardSet;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
}

const PRESET_COLORS = [
  '#f43f5e', // rose
  '#ec4899', // pink
  '#d946ef', // fuchsia
  '#a855f7', // purple
  '#8b5cf6', // violet
  '#6366f1', // indigo
  '#3b82f6', // blue
  '#0ea5e9', // sky
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#10b981', // emerald
  '#22c55e', // green
  '#84cc16', // lime
  '#eab308', // yellow
  '#f59e0b', // amber
  '#f97316', // orange 
  '#ef4444', // red
];

export function SetActions({ set, onEdit, onDelete }: SetActionsProps) {
  const [isColorDialogOpen, setIsColorDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [title, setTitle] = useState(set.title);
  const [description, setDescription] = useState(set.description || '');
  const [color, setColor] = useState(set.primaryColor || '#3b82f6');
  const { toast } = useToast();

  const handleColorUpdate = async () => {
    try {
      await apiRequest(`/api/sets/${set.id}`, 'PUT', { 
        primaryColor: color 
      });
      
      // Invalidate cache to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
      toast({
        title: 'Set color updated',
        description: 'The set color has been updated successfully.'
      });
      setIsColorDialogOpen(false);
    } catch (error) {
      console.error('Failed to update set color:', error);
      toast({
        title: 'Failed to update color',
        description: 'There was a problem updating the set color.',
        variant: 'destructive'
      });
    }
  };

  const handleRename = async () => {
    try {
      await apiRequest(`/api/sets/${set.id}`, 'PUT', { 
        title, 
        description: description || null
      });
      
      // Invalidate cache to refresh data
      await queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
      toast({
        title: 'Set updated',
        description: 'The set has been renamed successfully.'
      });
      setIsRenameDialogOpen(false);
    } catch (error) {
      console.error('Failed to rename set:', error);
      toast({
        title: 'Failed to update set',
        description: 'There was a problem renaming the set.',
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsRenameDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsColorDialogOpen(true)}>
            <Palette className="mr-2 h-4 w-4" />
            <span>Change color</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="text-red-600">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Color selection dialog */}
      <Dialog open={isColorDialogOpen} onOpenChange={setIsColorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change set color</DialogTitle>
            <DialogDescription>
              Select a color for this flashcard set.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-6 gap-2 py-4">
            {PRESET_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                className={cn(
                  "h-8 w-8 rounded-full border border-gray-200",
                  color === presetColor && "ring-2 ring-offset-2 ring-slate-900"
                )}
                style={{ backgroundColor: presetColor }}
                onClick={() => setColor(presetColor)}
              />
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsColorDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleColorUpdate}>
              Apply Color
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Set</DialogTitle>
            <DialogDescription>
              Update the name and description of this flashcard set.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Enter set title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Enter set description (optional)"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename} disabled={!title.trim()}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}