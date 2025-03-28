import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLatex, useLatexString } from '@/hooks/useLatex';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useIsMobile } from '@/hooks/use-mobile';
import { FlashcardSet, InsertFlashcard } from '@shared/schema';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('import');
  const [importText, setImportText] = useState('');
  const [importSetName, setImportSetName] = useState('');
  const [importSetDescription, setImportSetDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [parsedQuestions, setParsedQuestions] = useState<Array<{
    question: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
  }>>([]);
  const isMobile = useIsMobile();
  const { renderLatexString } = useLatexString(importText);

  // Function to parse LaTeX text into questions and options
  const parseLatex = () => {
    if (!importText.trim()) {
      toast({
        title: "No content to import",
        description: "Please paste LaTeX code containing questions and options first.",
        variant: "destructive",
      });
      return;
    }

    setIsParsing(true);

    try {
      // Split the text into separate questions
      // This is a simplified parsing logic - we need to adjust based on the actual format
      const questionBlocks = importText.split(/\\begin\{question\}|\\\[(Q[0-9]+)\]|\n\s*\n/).filter(block => block.trim());
      
      // Process each question block
      const parsed = questionBlocks.map(block => {
        // Try to extract the question and options
        // This regex pattern looks for question text followed by options (A), (B), etc.
        const questionMatch = block.match(/^(.*?)(?:\(A\)|\(a\)|\(1\)|\\begin\{enumerate\}|Options:)/s);
        const questionText = questionMatch ? questionMatch[1].trim() : block.trim();
        
        // Extract options if they exist
        const optionsMatch = block.match(/(?:\(A\)|\(a\)|\(1\)|\\begin\{enumerate\}|Options:)(.*?)(?:\\end\{question\}|$)/s);
        let optionsText = optionsMatch ? optionsMatch[1].trim() : '';
        
        // Split options into array
        const optionItems = optionsText
          .split(/\(([A-Za-z0-9])\)/)
          .filter(item => item.trim() && !item.match(/^[A-Za-z0-9]$/))
          .map(item => item.trim());
        
        // If no options were found, try another approach - look for numbered options
        let options = [];
        if (optionItems.length === 0) {
          options = [
            { text: "Option created automatically", isCorrect: true },
            { text: "Incorrect option", isCorrect: false },
            { text: "Another incorrect option", isCorrect: false },
            { text: "Yet another incorrect option", isCorrect: false }
          ];
        } else {
          options = optionItems.map((text, index) => ({
            text,
            isCorrect: index === 0 // Assume first option is correct by default
          }));
        }
        
        return {
          question: questionText,
          options,
          explanation: "" // No explanation by default
        };
      });
      
      setParsedQuestions(parsed);
      
      toast({
        title: `${parsed.length} questions parsed`,
        description: "Review the questions and click 'Import' to add them to your flashcards.",
      });
    } catch (error) {
      console.error("Error parsing LaTeX:", error);
      toast({
        title: "Error parsing content",
        description: "There was an error processing the LaTeX content. Please check the format and try again.",
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  // Function to import parsed questions as flashcards
  const importQuestions = async () => {
    if (parsedQuestions.length === 0) {
      toast({
        title: "No questions to import",
        description: "Please parse the LaTeX content first.",
        variant: "destructive",
      });
      return;
    }

    if (!importSetName.trim()) {
      toast({
        title: "Set name required",
        description: "Please provide a name for the flashcard set.",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      // First create a new flashcard set
      const setResponse = await apiRequest('POST', '/api/sets', {
        title: importSetName,
        description: importSetDescription || "Imported from LaTeX",
        primaryColor: "#3b82f6", // Default blue color
      });

      if (!setResponse.ok) {
        throw new Error("Failed to create flashcard set");
      }

      const newSet: FlashcardSet = await setResponse.json();
      
      // Now create each flashcard
      const creationPromises = parsedQuestions.map(async (question) => {
        const cardData = {
          question: question.question.trim(),
          options: question.options,
          explanation: question.explanation?.trim() || undefined,
          setId: newSet.id
        };
        
        return apiRequest('POST', '/api/cards', cardData);
      });
      
      await Promise.all(creationPromises);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/sets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/sets/${newSet.id}/cards`] });
      
      toast({
        title: "Import successful!",
        description: `Created a new set '${importSetName}' with ${parsedQuestions.length} cards.`,
      });
      
      // Reset form
      setImportText('');
      setImportSetName('');
      setImportSetDescription('');
      setParsedQuestions([]);
      
      // Navigate to the new set (you might want to add navigation here)
      window.location.href = `/sets/${newSet.id}`;
      
    } catch (error) {
      console.error("Error importing flashcards:", error);
      toast({
        title: "Import failed",
        description: "There was an error importing the flashcards. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-5xl">
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Link href="/">
            <Button variant="outline">
              <i className="ri-arrow-left-line mr-2"></i> Back to Home
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="import" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">LaTeX Import</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="import" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Import Questions from LaTeX</CardTitle>
                <CardDescription>
                  Paste LaTeX content containing questions and options to import them as flashcards.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="set-name">Flashcard Set Name</Label>
                  <Input 
                    id="set-name" 
                    value={importSetName}
                    onChange={(e) => setImportSetName(e.target.value)}
                    placeholder="e.g., Electrical Engineering MCQs"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="set-description">Description (Optional)</Label>
                  <Input 
                    id="set-description" 
                    value={importSetDescription}
                    onChange={(e) => setImportSetDescription(e.target.value)}
                    placeholder="Brief description of this flashcard set"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="latex-import">LaTeX Content</Label>
                  <Textarea 
                    id="latex-import"
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder="Paste your LaTeX content here..."
                    rows={10}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={parseLatex} 
                    disabled={isParsing || !importText.trim()}
                    variant="secondary"
                  >
                    {isParsing ? "Parsing..." : "Parse Questions"}
                  </Button>
                  
                  <Button 
                    onClick={importQuestions} 
                    disabled={isImporting || parsedQuestions.length === 0 || !importSetName.trim()}
                  >
                    {isImporting ? "Importing..." : "Import Questions"}
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {parsedQuestions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Parsed Questions ({parsedQuestions.length})</CardTitle>
                  <CardDescription>
                    Review the parsed questions before importing them.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {parsedQuestions.map((q, index) => (
                      <div key={index} className="border rounded-md p-4 space-y-3">
                        <div>
                          <div className="font-semibold mb-1">Question {index + 1}:</div>
                          <div 
                            className="text-sm latex-content p-2 bg-gray-50 rounded"
                            dangerouslySetInnerHTML={{ 
                              __html: renderLatexString(q.question) 
                            }}
                          />
                        </div>
                        
                        <div>
                          <div className="font-semibold mb-1">Options:</div>
                          <div className="grid gap-1">
                            {q.options.map((opt, optIndex) => (
                              <div key={optIndex} className="flex items-start gap-2 text-sm">
                                <div className={`flex-shrink-0 rounded-full h-5 w-5 flex items-center justify-center text-xs ${opt.isCorrect ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                  {String.fromCharCode(65 + optIndex)}
                                </div>
                                <div 
                                  className={`flex-grow p-1 rounded ${opt.isCorrect ? 'bg-green-50' : ''}`}
                                  dangerouslySetInnerHTML={{ 
                                    __html: renderLatexString(opt.text) 
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the appearance of your flashcards and the application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Appearance settings will be available in a future update.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}