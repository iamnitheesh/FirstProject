import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useLatex, useLatexString } from '@/hooks/useLatex';
import { useIsMobile } from '@/hooks/use-mobile';

interface LaTeXOptionEditorProps {
  initialValue: string;
  onSave: (value: string) => void;
}

export default function LaTeXOptionEditor({ initialValue, onSave }: LaTeXOptionEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [latexCode, setLatexCode] = useState(initialValue);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);
  
  const { renderLatexString } = useLatexString(latexCode);
  const { renderLatex } = useLatex(previewRef);
  const isMobile = useIsMobile();

  const handleOpen = () => {
    setLatexCode(initialValue);
    setIsOpen(true);
    
    // Generate preview when opening
    setTimeout(() => {
      const html = renderLatexString(latexCode);
      setPreviewHTML(html);
      
      // Force re-render after HTML is updated
      if (previewRef.current) {
        renderLatex();
      }
    }, 100);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleSave = () => {
    onSave(latexCode);
    setIsOpen(false);
  };

  const handleContentChange = (value: string) => {
    setLatexCode(value);
    
    // Update preview
    const html = renderLatexString(value);
    setPreviewHTML(html);
    
    // Force re-render after HTML is updated
    setTimeout(() => {
      if (previewRef.current) {
        renderLatex();
      }
    }, 0);
  };

  const handleInsertTemplate = (template: string) => {
    setLatexCode(prev => prev + template);
    
    // Update preview after template insertion
    setTimeout(() => {
      const html = renderLatexString(latexCode + template);
      setPreviewHTML(html);
      
      if (previewRef.current) {
        renderLatex();
      }
    }, 0);
  };

  return (
    <>
      <Button 
        type="button" 
        size="sm" 
        variant="outline" 
        className="h-8 text-xs px-2 flex items-center"
        onClick={handleOpen}
      >
        <span className="mr-1">∑</span> LaTeX
      </Button>
      
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>LaTeX Option Editor</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-wrap gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => handleInsertTemplate('\\frac{a}{b}')}
              >
                Fraction
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => handleInsertTemplate('\\sqrt{x}')}
              >
                √
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => handleInsertTemplate('\\sum_{i=1}^{n}')}
              >
                ∑
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => handleInsertTemplate('\\int_{a}^{b}')}
              >
                ∫
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => handleInsertTemplate('\\alpha')}
              >
                α
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => handleInsertTemplate('\\beta')}
              >
                β
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs"
                onClick={() => handleInsertTemplate('\\pi')}
              >
                π
              </Button>
            </div>
            
            <Textarea
              value={latexCode}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter LaTeX code here..."
              rows={4}
              className="font-mono text-sm"
            />
            
            <div className="border rounded-md p-3 bg-gray-50">
              <div className="text-xs text-gray-500 mb-2">Preview</div>
              <div 
                ref={previewRef}
                className="latex-preview min-h-[40px] bg-white p-2 rounded border"
                dangerouslySetInnerHTML={{ __html: previewHTML }}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={handleClose}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              size="sm"
              onClick={handleSave}
            >
              Insert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}