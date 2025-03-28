/**
 * Format a date for display
 * @param date The date to format
 * @returns A formatted date string
 */
export function formatDate(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  // Check if the date is today
  const today = new Date();
  const isToday = dateObj.getDate() === today.getDate() &&
                 dateObj.getMonth() === today.getMonth() &&
                 dateObj.getFullYear() === today.getFullYear();
  
  if (isToday) {
    // Format as time only for today
    return `Today at ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    // Format as date for other days
    return dateObj.toLocaleDateString([], {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  }
}

/**
 * Format a memory size for display
 * @param bytes Size in bytes
 * @returns Formatted size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate a random color
 * @returns A hex color code
 */
export function getRandomColor(): string {
  // Define a set of pleasing colors
  const colors = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#84cc16', // Lime
    '#6366f1', // Indigo
    '#14b8a6', // Teal
    '#f97316', // Orange
    '#8b5cf6', // Violet
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Truncates a string to a specified length and adds ellipsis if needed
 * @param str The string to truncate
 * @param maxLength Maximum length before truncation
 * @returns Truncated string
 */
export function truncateString(str: string, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

export function getOptionLetter(index: number): string {
  return String.fromCharCode(65 + index);
}

export function generateRandomOptions(correctAnswer: string): { text: string; isCorrect: boolean }[] {
  const options = [
    { text: correctAnswer, isCorrect: true },
    { text: "Generated option 1", isCorrect: false },
    { text: "Generated option 2", isCorrect: false },
    { text: "Generated option 3", isCorrect: false }
  ];
  
  // Shuffle the options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  
  return options;
}