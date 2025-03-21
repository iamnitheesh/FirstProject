import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    katex: any;
    renderMathInElement: (element: HTMLElement, options: any) => void;
  }
}

/**
 * Hook to render LaTeX content within a specified element
 * @param elementRef Reference to the element where LaTeX should be rendered
 */
export function useLatex(elementRef: React.RefObject<HTMLElement | null>) {
  const initialized = useRef(false);

  useEffect(() => {
    // Load KaTeX auto-render extension if not already loaded
    if (!window.renderMathInElement && !initialized.current) {
      initialized.current = true;
      
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.0/dist/contrib/auto-render.min.js';
      script.async = true;
      script.onload = () => renderLatex();
      document.head.appendChild(script);
    } else {
      renderLatex();
    }
  }, [elementRef.current]);

  const renderLatex = () => {
    if (elementRef.current && window.renderMathInElement) {
      try {
        window.renderMathInElement(elementRef.current, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          throwOnError: false
        });
      } catch (error) {
        console.error('Error rendering LaTeX:', error);
      }
    }
  };

  return { renderLatex };
}

/**
 * Hook to render LaTeX content in a string and return HTML
 * @param content String containing LaTeX content
 * @returns Object with rendered HTML content
 */
export function useLatexString(content: string) {
  const renderLatexString = (text: string): string => {
    try {
      // Replace LaTeX delimiters with HTML that KaTeX can process
      let processedContent = text;
      
      // Replace inline math delimiters
      processedContent = processedContent.replace(/\\\((.*?)\\\)/g, (match, content) => {
        try {
          return window.katex.renderToString(content, { displayMode: false });
        } catch (e) {
          console.error('Error rendering inline LaTeX:', e);
          return match;
        }
      });
      
      // Replace display math delimiters
      processedContent = processedContent.replace(/\\\[(.*?)\\\]/g, (match, content) => {
        try {
          return window.katex.renderToString(content, { displayMode: true });
        } catch (e) {
          console.error('Error rendering display LaTeX:', e);
          return match;
        }
      });
      
      return processedContent;
    } catch (error) {
      console.error('Error processing LaTeX string:', error);
      return text;
    }
  };

  return { renderLatexString };
}
