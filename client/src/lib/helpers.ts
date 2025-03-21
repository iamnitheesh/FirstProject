import { Option } from "@shared/schema";

/**
 * Generate random options for a flashcard based on the correct answer
 * This is a simple example - in a real app, this would be more sophisticated
 */
export function generateRandomOptions(correctOption: string): Option[] {
  // Basic variations of the correct answer (simplified approach)
  const variations = [
    correctOption,
    correctOption.replace("+", "-"),
    correctOption.replace("2", "3"),
    correctOption.replace("sin", "cos")
  ];

  // Create options array with the correct one marked
  const options: Option[] = variations.map((text, index) => ({
    text,
    isCorrect: index === 0
  }));

  // Shuffle the options
  return shuffleArray(options);
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
export function formatDate(date: Date | string | undefined): string {
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
