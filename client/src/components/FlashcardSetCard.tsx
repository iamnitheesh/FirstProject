import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/lib/ApiContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { MoreVertical, Pencil, Trash2, Image, UploadCloud } from '@/components/ui/icons';
import type { FlashcardSet, Flashcard } from '@shared/schema';
import { formatDate } from '@/lib/helpers';

interface FlashcardSetCardProps {
  set: FlashcardSet;
  onDelete?: (set: FlashcardSet) => void;
}

export default function FlashcardSetCard({ set, onDelete }: FlashcardSetCardProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const api = useApi();
  const queryClient = useQueryClient();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: set.title,
    description: set.description || '',
    tags: (set.tags || []).join(', '),
  });
  const [imageUrl, setImageUrl] = useState(set.imageUrl || '');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);

  // Fetch cards count
  const { data: cards = [] } = useQuery<Flashcard[]>({
    queryKey: [`/api/sets/${set.id}/cards`],
    enabled: !!set.id,
  });

  const handleEditSubmit = async () => {
    try {
      const tagsArray = editFormData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const updatedSet = await api.updateSetById(set.id, {
        title: editFormData.title,
        description: editFormData.description,
        tags: tagsArray,
      });

      if (updatedSet) {
        queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
        toast({
          title: 'Success',
          description: 'Flashcard set updated successfully',
        });
        setEditModalOpen(false);
      }
    } catch (error) {
      console.error('Error updating set:', error);
      toast({
        title: 'Error',
        description: 'Failed to update flashcard set',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSet = async () => {
    try {
      const success = await api.removeSet(set.id);
      if (success) {
        queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
        toast({
          title: 'Success',
          description: 'Flashcard set deleted successfully',
        });
        
        if (onDelete) {
          onDelete(set);
        }
        
        setDeleteModalOpen(false);
      }
    } catch (error) {
      console.error('Error deleting set:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete flashcard set',
        variant: 'destructive',
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic validation
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    setUploadedImage(file);
    
    // Create a local URL for preview
    const localUrl = URL.createObjectURL(file);
    setImageUrl(localUrl);
  };

  const handleImageSubmit = async () => {
    if (!uploadedImage) return;
    
    try {
      // In a real app, you would upload the image to a storage service
      // and get back a URL. For now, we'll simulate this by storing 
      // a data URL in our set.
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        
        const updatedSet = await api.updateSetById(set.id, {
          imageUrl: dataUrl,
        });
        
        if (updatedSet) {
          queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
          toast({
            title: 'Success',
            description: 'Image updated successfully',
          });
          setImageModalOpen(false);
        }
      };
      
      reader.readAsDataURL(uploadedImage);
    } catch (error) {
      console.error('Error updating image:', error);
      toast({
        title: 'Error',
        description: 'Failed to update image',
        variant: 'destructive',
      });
    }
  };

  const navigateToSet = () => navigate(`/sets/${set.id}`);

  const defaultImageUrl = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNlMmU4ZjAiIC8+CiAgPHRleHQgeD0iNTAiIHk9IjUwIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5NGEzYjgiPk5vIEltYWdlPC90ZXh0Pgo8L3N2Zz4=';

  return (
    <>
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <div className="relative">
          {/* Card header with image */}
          <div 
            className="h-40 bg-cover bg-center" 
            style={{ 
              backgroundImage: `url(${set.imageUrl || defaultImageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onClick={navigateToSet}
          />
          
          {/* Three dots menu */}
          <div className="absolute top-2 right-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 bg-black/20 backdrop-blur-sm hover:bg-black/30 text-white rounded-full"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Set Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setImageModalOpen(true)}>
                  <Image className="h-4 w-4 mr-2" />
                  Change Image
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setDeleteModalOpen(true)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Set
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <CardHeader className="p-4 pb-2" onClick={navigateToSet}>
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{set.title}</h3>
            {set.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {set.description}
              </p>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-2 pb-2" onClick={navigateToSet}>
          <div className="flex flex-wrap gap-1 mt-1">
            {(set.tags || []).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-2 flex items-center justify-between text-sm text-muted-foreground" onClick={navigateToSet}>
          <div>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'}
          </div>
          <div>
            {set.lastModified ? formatDate(set.lastModified) : ''}
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Flashcard Set</DialogTitle>
            <DialogDescription>
              Update the details of your flashcard set
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input 
                id="title" 
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                placeholder="e.g., Calculus Fundamentals"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={editFormData.description}
                onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                placeholder="Optional description of the flashcard set"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="tags">Tags (comma separated)</Label>
              <Input 
                id="tags" 
                value={editFormData.tags}
                onChange={(e) => setEditFormData({...editFormData, tags: e.target.value})}
                placeholder="e.g., math, calculus, derivatives"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit} className="bg-black hover:bg-gray-800 text-white">Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Flashcard Set</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{set.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteSet}>Delete Set</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Upload Modal */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Change Set Image</DialogTitle>
            <DialogDescription>
              Upload a new image for your flashcard set
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {imageUrl && (
              <div className="aspect-video relative overflow-hidden rounded-md">
                <img 
                  src={imageUrl} 
                  alt="Preview" 
                  className="object-cover w-full h-full"
                />
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="image">Upload Image</Label>
              <div className="flex items-center gap-2">
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Label 
                  htmlFor="image" 
                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full"
                >
                  <UploadCloud className="h-4 w-4 mr-2" />
                  Select image
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleImageSubmit}
              disabled={!uploadedImage}
              className="bg-black hover:bg-gray-800 text-white"
            >
              Save Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}