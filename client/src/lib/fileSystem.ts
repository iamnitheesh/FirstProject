// File system API for handling file operations on both desktop and mobile
import { FlashcardSet, Flashcard } from '@shared/schema';
import { exportData, importData } from './db';
import { useToast } from '@/hooks/use-toast';

// Check if File System Access API is available
export const hasFileSystemAccess = (): boolean => {
  return 'showOpenFilePicker' in window && 'showSaveFilePicker' in window;
};

// Check if Android-specific file system is available
export const hasAndroidFileSystem = (): boolean => {
  return 'Android' in window && (window as any).Android?.getExternalFilesDir;
};

// Request storage permissions (for Android)
export const requestStoragePermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) return false;

  try {
    // On Android, notification permission can be used as a proxy for storage permission
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting permission:', error);
    return false;
  }
};

// Save all data to a file
export const saveDataToFile = async (filename = 'mathcards-backup.json'): Promise<boolean> => {
  try {
    const data = await exportData();
    
    // Try modern File System Access API first
    if (hasFileSystemAccess()) {
      try {
        const options = {
          suggestedName: filename,
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] }
          }]
        };
        
        const handle = await (window as any).showSaveFilePicker(options);
        const writable = await handle.createWritable();
        await writable.write(JSON.stringify(data, null, 2));
        await writable.close();
        return true;
      } catch (error) {
        console.error('Error using File System Access API:', error);
        // Fall back to older methods
      }
    }
    
    // Try Android-specific method
    if (hasAndroidFileSystem()) {
      try {
        const androidFS = (window as any).Android;
        const externalDir = androidFS.getExternalFilesDir();
        const fullPath = `${externalDir}/${filename}`;
        androidFS.writeFile(fullPath, JSON.stringify(data, null, 2));
        return true;
      } catch (error) {
        console.error('Error using Android file system:', error);
        // Fall back to download method
      }
    }
    
    // Fallback to download method
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    return true;
  } catch (error) {
    console.error('Error saving data to file:', error);
    return false;
  }
};

// Load data from a file
export const loadDataFromFile = async (): Promise<boolean> => {
  try {
    let fileContent: string | null = null;
    
    // Try modern File System Access API first
    if (hasFileSystemAccess()) {
      try {
        const options = {
          types: [{
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] }
          }],
          multiple: false
        };
        
        const [handle] = await (window as any).showOpenFilePicker(options);
        const file = await handle.getFile();
        fileContent = await file.text();
      } catch (error) {
        console.error('Error using File System Access API:', error);
        // Fall back to older methods
      }
    }
    
    // Try Android-specific method if no content yet
    if (!fileContent && hasAndroidFileSystem()) {
      try {
        const androidFS = (window as any).Android;
        const result = androidFS.showFilePicker('application/json');
        if (result && result.path) {
          fileContent = androidFS.readFile(result.path);
        }
      } catch (error) {
        console.error('Error using Android file system:', error);
        // Fall back to input method
      }
    }
    
    // Fallback to input method if no content yet
    if (!fileContent) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      
      // Wait for the user to select a file
      fileContent = await new Promise<string | null>((resolve) => {
        input.onchange = async (event) => {
          const file = (event.target as HTMLInputElement).files?.[0];
          if (!file) {
            resolve(null);
            return;
          }
          
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsText(file);
        };
        
        // Trigger file selection dialog
        input.click();
      });
    }
    
    // Process the file content
    if (fileContent) {
      const data = JSON.parse(fileContent);
      
      // Validate the data structure
      if (!data.sets || !Array.isArray(data.sets) || !data.cards || !Array.isArray(data.cards)) {
        throw new Error('Invalid data format');
      }
      
      // Import the data
      await importData(data);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error loading data from file:', error);
    return false;
  }
};

// Save individual card's image to file system
export const saveCardImage = async (imageData: string, cardId: number): Promise<string | null> => {
  try {
    if (!imageData.startsWith('data:')) {
      // It's already a URL, not a data URL
      return imageData;
    }
    
    // Extract the image data and type
    const matches = imageData.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid image data format');
    }
    
    const type = matches[1];
    const base64Data = matches[2];
    const extension = type.split('/')[1] || 'png';
    const filename = `card_${cardId}_${Date.now()}.${extension}`;
    
    // Try Android-specific method
    if (hasAndroidFileSystem()) {
      try {
        const androidFS = (window as any).Android;
        const externalDir = androidFS.getExternalFilesDir();
        const fullPath = `${externalDir}/images/${filename}`;
        
        // Create the directory if it doesn't exist
        androidFS.createDirectory(`${externalDir}/images`);
        
        // Write the image file
        androidFS.writeBase64File(fullPath, base64Data);
        
        // Return the local file URL
        return `file://${fullPath}`;
      } catch (error) {
        console.error('Error saving image to Android file system:', error);
      }
    }
    
    // For web, we can store in IndexedDB or return the data URL as is
    return imageData;
  } catch (error) {
    console.error('Error saving card image:', error);
    return null;
  }
};

// Load card image from file system
export const loadCardImage = async (imageUrl: string): Promise<string> => {
  // If it's a file:// URL and we're on Android, load it from the file system
  if (imageUrl.startsWith('file://') && hasAndroidFileSystem()) {
    try {
      const androidFS = (window as any).Android;
      const base64Data = androidFS.readFileAsBase64(imageUrl.substring(7));
      
      // Determine file type from extension
      const extension = imageUrl.split('.').pop()?.toLowerCase();
      const mimeType = extension === 'png' ? 'image/png' :
                       extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg' :
                       extension === 'gif' ? 'image/gif' :
                       extension === 'webp' ? 'image/webp' : 'image/png';
      
      return `data:${mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error('Error loading image from Android file system:', error);
      // Fall back to default behavior
    }
  }
  
  // For web or if Android loading fails, return the URL as is
  return imageUrl;
};

// Export sets as PDF
export const exportSetsToPdf = async (sets: FlashcardSet[], cards: Flashcard[]): Promise<boolean> => {
  try {
    // Check if we have the appropriate library
    if (typeof (window as any).jspdf === 'undefined') {
      throw new Error('PDF export library not available');
    }
    
    const { jsPDF } = (window as any).jspdf;
    const doc = new jsPDF();
    
    let y = 20;
    const pageHeight = doc.internal.pageSize.height;
    
    // For each set
    for (const set of sets) {
      // Add set title
      doc.setFontSize(18);
      doc.text(set.title, 20, y);
      y += 10;
      
      // Add set description if available
      if (set.description) {
        doc.setFontSize(12);
        doc.text(set.description, 20, y);
        y += 10;
      }
      
      // Get cards for this set
      const setCards = cards.filter(card => card.setId === set.id);
      
      // For each card in the set
      for (const card of setCards) {
        // Check if we need a new page
        if (y > pageHeight - 60) {
          doc.addPage();
          y = 20;
        }
        
        // Add card question
        doc.setFontSize(14);
        doc.text(`Q: ${card.question.replace(/\\[\(\)]/g, '')}`, 20, y);
        y += 10;
        
        // Add correct answers
        const correctOptions = card.options.filter(opt => opt.isCorrect);
        doc.setFontSize(12);
        doc.text(`A: ${correctOptions.map(opt => opt.text.replace(/\\[\(\)]/g, '')).join(', ')}`, 20, y);
        y += 15;
      }
      
      // Add page break between sets
      doc.addPage();
      y = 20;
    }
    
    // Save the PDF
    doc.save('mathcards-sets.pdf');
    return true;
  } catch (error) {
    console.error('Error exporting sets to PDF:', error);
    return false;
  }
};