import { Flashcard } from '@shared/schema';
import { useClipboard } from '@/lib/clipboard';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Copy, Scissors, MoreVertical, Edit, Trash, PanelRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CardActionsProps {
  card: Flashcard;
  onEdit: (card: Flashcard) => void;
  onDelete: (card: Flashcard) => void;
}

export function CardActions({ card, onEdit, onDelete }: CardActionsProps) {
  const { addCard } = useClipboard();
  const { toast } = useToast();

  const handleCopy = () => {
    addCard(card, 'copy');
    toast({
      title: "Card copied!",
      description: "You can now paste this card into another set."
    });
  };

  const handleCut = () => {
    addCard(card, 'cut');
    toast({
      title: "Card cut!",
      description: "You can now paste this card into another set."
    });
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(card)}>
          <Edit className="mr-2 h-4 w-4" />
          <span>Edit</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          <span>Copy</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCut}>
          <Scissors className="mr-2 h-4 w-4" />
          <span>Cut</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onDelete(card)}>
          <Trash className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SetPasteProps {
  setId: number;
  onPaste: (setId: number) => void;
  showLabel?: boolean;
  isPasting?: boolean;
}

export function SetPasteButton({ setId, onPaste, showLabel = false, isPasting = false }: SetPasteProps) {
  const { hasItems, operation, cards } = useClipboard();
  
  if (!hasItems()) {
    return null;
  }

  const count = cards.length;
  const opText = operation === 'cut' ? 'cut' : 'copied';

  return (
    <Button 
      variant={showLabel ? "default" : "outline"}
      size={showLabel ? "default" : "sm"}
      onClick={() => onPaste(setId)}
      className={`flex items-center gap-1 ${showLabel ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
      disabled={isPasting}
    >
      {isPasting ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Pasting...</span>
        </>
      ) : (
        <>
          <PanelRight className="h-4 w-4" />
          {showLabel && (
            <span>Paste {count} {opText} card{count > 1 ? 's' : ''}</span>
          )}
        </>
      )}
    </Button>
  );
}