import { Option } from "@shared/schema";

/**
 * Generate random options for a flashcard based on the correct answer
 * Uses multiple strategies to create plausible wrong answers
 */
export function generateRandomOptions(correctOption: string): Option[] {
  const correctOptionObj = { text: correctOption, isCorrect: true };
  const wrongOptions: Option[] = [];
  
  // Try to determine if the correct answer has a specific format
  const isMathEquation = correctOption.includes('=');
  const isMultipleWords = correctOption.split(' ').filter(w => w.length > 1).length > 1;
  const isNumeric = !isNaN(parseFloat(correctOption)) && isFinite(Number(correctOption));
  const hasMathSymbols = /[\+\-\*\/\^\(\)\[\]\{\}]/.test(correctOption);
  const hasLatexMath = /\\[\(\[\{]|\\[\)\]\}]/.test(correctOption);
  
  // Strategy 1: For math equations or numeric answers
  if (isMathEquation || isNumeric || hasMathSymbols || hasLatexMath) {
    for (let i = 0; i < 3; i++) {
      let wrongText = correctOption;
      
      if (isMathEquation) {
        // For equations like "x = 5"
        const parts = correctOption.split('=');
        const leftSide = parts[0].trim();
        const rightSide = parts[1].trim();
        
        // Try to parse right side as a number
        const numValue = parseFloat(rightSide);
        if (!isNaN(numValue)) {
          // For small numbers (0-10), use close values
          // For larger numbers, use percentage variations
          let variation;
          if (Math.abs(numValue) <= 10) {
            variation = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
          } else {
            variation = numValue * (0.1 + Math.random() * 0.3) * (Math.random() > 0.5 ? 1 : -1);
          }
          
          // Make sure we don't generate the same value
          if (numValue + variation === numValue) {
            variation = variation === 0 ? 1 : variation * 2;
          }
          
          // Format the result to match the original precision
          const rightSideDecimals = rightSide.includes('.') ? rightSide.split('.')[1].length : 0;
          wrongText = `${leftSide} = ${(numValue + variation).toFixed(rightSideDecimals)}`;
        } else {
          // Handle algebraic expressions or complex formulas
          // Change variable names or operators
          const operators = ['+', '-', '*', '/', '^'];
          const variables = ['x', 'y', 'z', 'a', 'b', 'c'];
          
          if (rightSide.length > 0) {
            if (/[a-zA-Z]/.test(rightSide)) {
              // Replace variables
              const varsInExpression = rightSide.match(/[a-zA-Z]/g) || [];
              if (varsInExpression.length > 0) {
                const varToReplace = varsInExpression[Math.floor(Math.random() * varsInExpression.length)];
                const newVar = variables.find(v => v !== varToReplace) || 'n';
                wrongText = `${leftSide} = ${rightSide.replace(varToReplace, newVar)}`;
              }
            } else if (/[\+\-\*\/\^]/.test(rightSide)) {
              // Change operators if present
              const opsInExpression = rightSide.match(/[\+\-\*\/\^]/g) || [];
              if (opsInExpression.length > 0) {
                const opToReplace = opsInExpression[Math.floor(Math.random() * opsInExpression.length)];
                const newOp = operators.find(o => o !== opToReplace) || '+';
                wrongText = `${leftSide} = ${rightSide.replace(opToReplace, newOp)}`;
              }
            } else {
              // Add a small term
              wrongText = `${leftSide} = ${rightSide} ${Math.random() > 0.5 ? '+' : '-'} ${1 + Math.floor(Math.random() * 5)}`;
            }
          }
        }
      } else if (isNumeric) {
        // For plain numbers
        const numValue = parseFloat(correctOption);
        let variation;
        
        // Scale variation based on magnitude
        if (Math.abs(numValue) < 10) {
          variation = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
        } else if (Math.abs(numValue) < 100) {
          variation = (Math.random() > 0.5 ? 1 : -1) * (5 + Math.floor(Math.random() * 10));
        } else {
          variation = numValue * (0.05 + Math.random() * 0.2) * (Math.random() > 0.5 ? 1 : -1);
        }
        
        // Make sure we don't generate the same value
        if (numValue + variation === numValue) {
          variation = variation === 0 ? 1 : variation * 2;
        }
        
        // Match original format (decimals)
        const decimals = correctOption.includes('.') ? correctOption.split('.')[1].length : 0;
        wrongText = (numValue + variation).toFixed(decimals);
      } else if (hasLatexMath || hasMathSymbols) {
        // For LaTeX math expressions or math symbols
        // Try to replace operators or numbers
        
        if (correctOption.includes('sin')) {
          wrongText = correctOption.replace('sin', 'cos');
        } else if (correctOption.includes('cos')) {
          wrongText = correctOption.replace('cos', 'sin');
        } else if (correctOption.includes('tan')) {
          wrongText = correctOption.replace('tan', 'cot');
        } else {
          // Change + to -, * to /, etc.
          const replacements: Record<string, string> = {
            '+': '-',
            '-': '+',
            '*': '/',
            '/': '*',
            '<': '>',
            '>': '<',
            '\\leq': '\\geq',
            '\\geq': '\\leq',
            '\\times': '\\div',
            '\\div': '\\times',
            '\\cup': '\\cap',
            '\\cap': '\\cup'
          };
          
          let replaced = false;
          for (const [symbol, replacement] of Object.entries(replacements)) {
            if (correctOption.includes(symbol)) {
              wrongText = correctOption.replace(symbol, replacement);
              replaced = true;
              break;
            }
          }
          
          // If no operators were replaced, try changing a number
          if (!replaced) {
            const numbers = correctOption.match(/\d+/g);
            if (numbers && numbers.length > 0) {
              const numToReplace = numbers[Math.floor(Math.random() * numbers.length)];
              const numValue = parseInt(numToReplace);
              const newNum = numValue + (Math.random() > 0.5 ? 1 : -1) * (1 + Math.floor(Math.random() * 3));
              wrongText = correctOption.replace(numToReplace, String(newNum));
            }
          }
        }
      }
      
      // Ensure the wrong option is actually different
      if (wrongText === correctOption) {
        if (isNumeric) {
          wrongText = (parseFloat(correctOption) * 2).toString();
        } else {
          wrongText += " + 1";
        }
      }
      
      wrongOptions.push({ text: wrongText, isCorrect: false });
    }
  } 
  // Strategy 2: For text answers with multiple words
  else if (isMultipleWords) {
    // For text with multiple words, try various transformations
    const words = correctOption.split(' ');
    
    for (let i = 0; i < 3; i++) {
      let wrongText = correctOption;
      const strategy = Math.floor(Math.random() * 5);
      
      switch (strategy) {
        case 0: // Replace a word with a similar one
          if (words.length > 1) {
            const wordIdx = Math.floor(Math.random() * words.length);
            const word = words[wordIdx];
            
            // Simple word substitutions (could be expanded)
            const substitutions: Record<string, string[]> = {
              'increase': ['decrease', 'reduce', 'lower'],
              'decrease': ['increase', 'raise', 'elevate'],
              'high': ['low', 'small', 'minimal'],
              'low': ['high', 'large', 'maximum'],
              'positive': ['negative', 'inverse', 'opposite'],
              'negative': ['positive', 'direct', 'normal'],
              'input': ['output', 'result', 'return'],
              'output': ['input', 'source', 'origin'],
              'voltage': ['current', 'resistance', 'power'],
              'current': ['voltage', 'power', 'energy'],
              'power': ['energy', 'voltage', 'current'],
              'series': ['parallel', 'sequential', 'linear'],
              'parallel': ['series', 'sequential', 'concurrent'],
              'watt': ['volt', 'ampere', 'ohm'],
              'volt': ['watt', 'ampere', 'ohm'],
              'ampere': ['volt', 'watt', 'ohm'],
              'ohm': ['volt', 'ampere', 'watt']
            };
            
            const wordLower = word.toLowerCase();
            if (substitutions[wordLower]) {
              const newWord = substitutions[wordLower][Math.floor(Math.random() * substitutions[wordLower].length)];
              // Preserve capitalization
              const finalWord = word[0] === word[0].toUpperCase() 
                ? newWord.charAt(0).toUpperCase() + newWord.slice(1) 
                : newWord;
              
              const newWords = [...words];
              newWords[wordIdx] = finalWord;
              wrongText = newWords.join(' ');
            } else {
              // If no substitution found, reverse word order
              const newWords = [...words];
              [newWords[0], newWords[newWords.length - 1]] = [newWords[newWords.length - 1], newWords[0]];
              wrongText = newWords.join(' ');
            }
          }
          break;
          
        case 1: // Change word order
          if (words.length > 2) {
            const newWords = [...words];
            const idx1 = Math.floor(Math.random() * words.length);
            let idx2;
            do {
              idx2 = Math.floor(Math.random() * words.length);
            } while (idx1 === idx2);
            
            [newWords[idx1], newWords[idx2]] = [newWords[idx2], newWords[idx1]];
            wrongText = newWords.join(' ');
          }
          break;
          
        case 2: // Add an extra word
          const extraWords = ['not', 'only', 'always', 'never', 'sometimes', 'possibly'];
          const extraWord = extraWords[Math.floor(Math.random() * extraWords.length)];
          const position = Math.floor(Math.random() * (words.length + 1));
          const newWords = [...words];
          newWords.splice(position, 0, extraWord);
          wrongText = newWords.join(' ');
          break;
          
        case 3: // Remove a word
          if (words.length > 2) {
            const wordToRemove = Math.floor(Math.random() * words.length);
            const newWords = words.filter((_, idx) => idx !== wordToRemove);
            wrongText = newWords.join(' ');
          }
          break;
          
        case 4: // Replace with opposite meaning
          const opposites: Record<string, string> = {
            'increase': 'decrease',
            'decrease': 'increase',
            'high': 'low',
            'low': 'high',
            'maximum': 'minimum',
            'minimum': 'maximum',
            'more': 'less',
            'less': 'more',
            'higher': 'lower',
            'lower': 'higher',
            'positive': 'negative',
            'negative': 'positive',
            'series': 'parallel',
            'parallel': 'series',
            'input': 'output',
            'output': 'input'
          };
          
          let replaced = false;
          for (let w = 0; w < words.length; w++) {
            const wordLower = words[w].toLowerCase();
            if (opposites[wordLower]) {
              const newWords = [...words];
              const replacement = opposites[wordLower];
              // Preserve capitalization
              newWords[w] = words[w][0] === words[w][0].toUpperCase()
                ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
                : replacement;
              wrongText = newWords.join(' ');
              replaced = true;
              break;
            }
          }
          
          if (!replaced) {
            // If no word could be replaced with an opposite, negate the sentence
            wrongText = "Not " + correctOption;
          }
          break;
      }
      
      // Ensure we're not accidentally creating the correct answer again
      if (wrongText === correctOption) {
        // Last resort - add a qualifier
        const qualifiers = ['usually', 'sometimes', 'rarely', 'often', 'never'];
        wrongText = qualifiers[Math.floor(Math.random() * qualifiers.length)] + ' ' + correctOption;
      }
      
      wrongOptions.push({ text: wrongText, isCorrect: false });
    }
  } 
  // Strategy 3: For short answers or fallback
  else {
    // For single words or short phrases
    for (let i = 0; i < 3; i++) {
      let wrongText = correctOption;
      
      if (correctOption.length > 3) {
        // For longer words, try character manipulations
        const chars = wrongText.split('');
        
        // Choose a manipulation strategy
        const strategy = Math.floor(Math.random() * 3);
        
        switch (strategy) {
          case 0: // Swap two characters
            if (chars.length > 1) {
              const pos1 = Math.floor(Math.random() * chars.length);
              let pos2;
              do {
                pos2 = Math.floor(Math.random() * chars.length);
              } while (pos1 === pos2);
              
              [chars[pos1], chars[pos2]] = [chars[pos2], chars[pos1]];
            }
            break;
            
          case 1: // Replace a character
            const pos = Math.floor(Math.random() * chars.length);
            let newChar;
            do {
              newChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
            } while (newChar === chars[pos]);
            chars[pos] = newChar;
            break;
            
          case 2: // Add or remove a character
            if (Math.random() > 0.5 && chars.length > 3) {
              // Remove a character
              const pos = Math.floor(Math.random() * chars.length);
              chars.splice(pos, 1);
            } else {
              // Add a character
              const pos = Math.floor(Math.random() * (chars.length + 1));
              const newChar = String.fromCharCode(97 + Math.floor(Math.random() * 26)); // a-z
              chars.splice(pos, 0, newChar);
            }
            break;
        }
        
        wrongText = chars.join('');
      } else {
        // For very short answers, use similar looking options
        const shortAnswerOptions = [
          ['A', 'B', 'C', 'D'],
          ['1', '2', '3', '4'],
          ['Yes', 'No', 'Maybe', 'Sometimes'],
          ['True', 'False', 'Partially', 'Unknown']
        ];
        
        // Find a set that doesn't contain the correct answer
        let optionSet = shortAnswerOptions.find(set => !set.includes(correctOption));
        
        // If no suitable set found, generate a random letter or number
        if (!optionSet) {
          if (/^\d+$/.test(correctOption)) {
            // For numeric answers, adjust slightly
            const numValue = parseInt(correctOption);
            wrongText = (numValue + (i + 1) * (Math.random() > 0.5 ? 1 : -1)).toString();
          } else {
            // For alphabetic answers, use different letters
            wrongText = String.fromCharCode(65 + (i + Math.floor(Math.random() * 3)) % 26);
          }
        } else {
          // Pick an option from the set that's not the correct answer
          const validOptions = optionSet.filter(opt => opt !== correctOption);
          wrongText = validOptions[i % validOptions.length];
        }
      }
      
      // Ensure we're not accidentally creating the correct answer again
      if (wrongText === correctOption) {
        wrongText = correctOption + '*';
      }
      
      wrongOptions.push({ text: wrongText, isCorrect: false });
    }
  }
  
  // Combine correct and wrong options and shuffle
  const allOptions = [correctOptionObj, ...wrongOptions];
  return shuffleArray(allOptions);
}

/**
 * Shuffle an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

/**
 * Format date to a readable string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(d.getTime())) return '';
  
  // Format date with relative time if recent
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - d.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return d.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    });
  }
}

/**
 * Get a letter representation for an index (A, B, C, etc.)
 */
export function getOptionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}
