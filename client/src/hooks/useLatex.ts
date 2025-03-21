import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    katex: any;
    renderMathInElement: (element: HTMLElement, options: any) => void;
    MathJax: {
      typesetPromise: (elements: HTMLElement[]) => Promise<any>;
      tex?: any;
      svg?: any;
      options?: any;
    };
  }
}

/**
 * Helper function to load scripts dynamically
 */
const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if script already exists to avoid duplicates
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
};

/**
 * Hook to render LaTeX content within a specified element
 * @param elementRef Reference to the element where LaTeX should be rendered
 */
export function useLatex(elementRef: React.RefObject<HTMLElement | null>) {
  const [isLoaded, setIsLoaded] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initialized.current) return;
    initialized.current = true;
    
    // Load KaTeX library and auto-render extension if not already loaded
    const loadKatex = async () => {
      try {
        // Load main KaTeX library first
        if (!window.katex) {
          await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js');
        }
        
        // Then load auto-render extension
        if (!window.renderMathInElement) {
          await loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js');
        }
        
        setIsLoaded(true);
        renderLatex();
      } catch (error) {
        console.error('Failed to load KaTeX:', error);
      }
    };
    
    loadKatex();
  }, []);

  // Re-render when element changes or library loads
  useEffect(() => {
    if (isLoaded && elementRef.current) {
      renderLatex();
    }
  }, [elementRef.current, isLoaded]);

  const renderLatex = () => {
    if (!elementRef.current || !window.renderMathInElement) return;
    
    try {
      window.renderMathInElement(elementRef.current, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false,
        output: 'html',
        trust: true
      });
      
      // MathJax fallback (only use if KaTeX fails)
      if (elementRef.current.querySelectorAll('.katex, .katex-error').length === 0 && 
          (elementRef.current.innerHTML.includes('\\') || 
           elementRef.current.innerHTML.includes('$'))) {
        if (typeof window.MathJax === 'undefined') {
          loadMathJax();
        } else {
          window.MathJax.typesetPromise([elementRef.current]).catch(err => 
            console.error('MathJax typesetting failed:', err)
          );
        }
      }
    } catch (error) {
      console.error('Error rendering LaTeX:', error);
    }
  };
  
  // Fallback to MathJax if KaTeX doesn't work well for some expressions
  const loadMathJax = async () => {
    try {
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
      configScript.text = `
        window.MathJax = {
          tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
            processEscapes: true
          },
          svg: {
            fontCache: 'global'
          },
          options: {
            skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre']
          }
        };
      `;
      document.head.appendChild(configScript);
      
      await loadScript('https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js');
      
      if (elementRef.current && window.MathJax) {
        window.MathJax.typesetPromise([elementRef.current]).catch(err => 
          console.error('MathJax typesetting failed:', err)
        );
      }
    } catch (error) {
      console.error('Failed to load MathJax:', error);
    }
  };

  return { renderLatex, isLoaded };
}

/**
 * Hook to render LaTeX content in a string and return HTML
 * @param content String containing LaTeX content
 * @returns Object with rendered HTML content
 */
export function useLatexString(content: string) {
  const [isKatexLoaded, setIsKatexLoaded] = useState(false);
  
  useEffect(() => {
    // Load KaTeX library if not already loaded
    if (!window.katex && !isKatexLoaded) {
      loadScript('https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js')
        .then(() => setIsKatexLoaded(true))
        .catch(err => console.error('Failed to load KaTeX:', err));
    } else {
      setIsKatexLoaded(true);
    }
  }, []);
  
  const renderLatexString = (text: string): string => {
    if (!window.katex) return text;
    
    try {
      // Replace LaTeX delimiters with HTML that KaTeX can process
      let processedContent = text;
      
      // Helper function for multi-line regex processing
      const replaceAllMatches = (
        str: string, 
        regex: RegExp, 
        callback: (match: string, captureGroup: string) => string
      ): string => {
        let result = str;
        let match;
        while ((match = regex.exec(result)) !== null) {
          const replacement = callback(match[0], match[1]);
          result = result.substring(0, match.index) + 
                  replacement + 
                  result.substring(match.index + match[0].length);
          // Reset regex after replacement to avoid infinite loops
          regex.lastIndex = 0;
        }
        return result;
      };
      
      // Replace $$ display math $$ - handling multi-line with custom function
      const displayMathRegex = /\$\$(.*?)\$\$/gm;
      processedContent = replaceAllMatches(
        processedContent,
        displayMathRegex,
        (match, content) => {
          try {
            return window.katex.renderToString(content.trim(), { displayMode: true });
          } catch (e) {
            console.error('Error rendering display math:', e);
            return match;
          }
        }
      );
      
      // Replace $ inline math $
      processedContent = processedContent.replace(/\$(.*?)\$/g, (match, content) => {
        // Skip if it's likely a currency symbol followed by a number
        if (/^\s*\d/.test(content) || /\d\s*$/.test(content)) return match;
        
        try {
          return window.katex.renderToString(content.trim(), { displayMode: false });
        } catch (e) {
          console.error('Error rendering inline math:', e);
          return match;
        }
      });
      
      // Replace \( inline math \) - handling multi-line with custom function
      const inlineMathRegex = /\\\((.*?)\\\)/gm;
      processedContent = replaceAllMatches(
        processedContent,
        inlineMathRegex,
        (match, content) => {
          try {
            return window.katex.renderToString(content.trim(), { displayMode: false });
          } catch (e) {
            console.error('Error rendering inline LaTeX:', e);
            return match;
          }
        }
      );
      
      // Replace \[ display math \] - handling multi-line with custom function
      const displayLatexRegex = /\\\[(.*?)\\\]/gm;
      processedContent = replaceAllMatches(
        processedContent,
        displayLatexRegex,
        (match, content) => {
          try {
            return window.katex.renderToString(content.trim(), { displayMode: true });
          } catch (e) {
            console.error('Error rendering display LaTeX:', e);
            return match;
          }
        }
      );
      
      return processedContent;
    } catch (error) {
      console.error('Error processing LaTeX string:', error);
      return text;
    }
  };

  return { renderLatexString, isKatexLoaded };
}
