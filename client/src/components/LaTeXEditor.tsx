import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useLatex, useLatexString } from '@/hooks/useLatex';
import { useIsMobile } from '@/hooks/use-mobile';

interface LaTeXEditorProps {
  initialValue?: string;
  onSave?: (value: string) => void;
}

export default function LaTeXEditor({ initialValue = '', onSave }: LaTeXEditorProps) {
  const [latexCode, setLatexCode] = useState(initialValue);
  const [previewHTML, setPreviewHTML] = useState<string>('');
  const previewRef = useRef<HTMLDivElement>(null);
  
  const { renderLatexString } = useLatexString(latexCode);
  const { renderLatex } = useLatex(previewRef);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Generate preview when latex code changes
    const html = renderLatexString(latexCode);
    setPreviewHTML(html);
    
    // Force re-render after HTML is updated
    setTimeout(() => {
      if (previewRef.current) {
        renderLatex();
      }
    }, 0);
  }, [latexCode, renderLatexString]);

  const handleSave = () => {
    if (onSave) {
      onSave(latexCode);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(latexCode)
      .then(() => {
        // You could use toast here if you have a toast component
        console.log('LaTeX code copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  const handleInsertTemplate = (template: string) => {
    setLatexCode(prev => prev + template);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2' : ''} gap-4`}>
        <div>
          <h3 className="text-lg font-medium mb-2">LaTeX Editor</h3>
          <div className="mb-2 flex flex-wrap gap-1">
            <Button 
              variant="outline" 
              size="sm"
              className={isMobile ? "h-7 text-xs px-2" : ""} 
              onClick={() => handleInsertTemplate('$$\\frac{a}{b}$$')}
            >
              {isMobile ? "a/b" : "Fraction"}
            </Button>
            <Button 
              variant="outline" 
              size={isMobile ? "xs" : "sm"}
              className={isMobile ? "h-7 text-xs px-2" : ""} 
              onClick={() => handleInsertTemplate('$$\\sqrt{x}$$')}
            >
              √
            </Button>
            <Button 
              variant="outline" 
              size={isMobile ? "xs" : "sm"}
              className={isMobile ? "h-7 text-xs px-2" : ""} 
              onClick={() => handleInsertTemplate('$$\\sum_{i=1}^{n}$$')}
            >
              ∑
            </Button>
            <Button 
              variant="outline" 
              size={isMobile ? "xs" : "sm"}
              className={isMobile ? "h-7 text-xs px-2" : ""} 
              onClick={() => handleInsertTemplate('$$\\int_{a}^{b}$$')}
            >
              ∫
            </Button>
            <Button 
              variant="outline" 
              size={isMobile ? "xs" : "sm"}
              className={isMobile ? "h-7 text-xs px-2" : ""} 
              onClick={() => handleInsertTemplate('$$\\lim_{x \\to \\infty}$$')}
            >
              lim
            </Button>
          </div>
          <Textarea
            value={latexCode}
            onChange={(e) => setLatexCode(e.target.value)}
            placeholder="Enter LaTeX code here... (e.g., $$\frac{1}{2}$$)"
            rows={isMobile ? 6 : 10}
            className="font-mono text-sm"
          />
          <div className="flex justify-between mt-2">
            <Button variant="outline" size={isMobile ? "sm" : "default"} onClick={handleCopy}>
              Copy Code
            </Button>
            <Button size={isMobile ? "sm" : "default"} onClick={handleSave}>
              Insert
            </Button>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Preview</h3>
          <Card className="p-4 min-h-[180px] bg-white border overflow-auto">
            <div 
              ref={previewRef}
              className="latex-preview"
              dangerouslySetInnerHTML={{ __html: previewHTML }}
            />
          </Card>
          {!isMobile && (
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Tips:</p>
              <ul className="list-disc list-inside">
                <li>Use $...$ for inline math</li>
                <li>Use $$...$$ for display math</li>
                <li>For fractions: \frac{"{"}num{"}"}{"{"}denom{"}"}</li>
                <li>For exponents: x^{"{"}power{"}"}</li>
                <li>For subscripts: x_{"{"}index{"}"}</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}