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
import { FlashcardSet, InsertFlashcard, Option } from '@shared/schema';
import { Pencil, Save, X, Check, FileText, Download, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useQuery } from '@tanstack/react-query';

export default function Settings() {
  // Get tab from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(tabParam === 'export' ? 'appearance' : 'import');
  const [importText, setImportText] = useState('');
  const [importSetName, setImportSetName] = useState('');
  const [importSetDescription, setImportSetDescription] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    question: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    explanation: string;
  }>({
    question: '',
    options: [],
    explanation: '',
  });
  
  const [parsedQuestions, setParsedQuestions] = useState<Array<{
    question: string;
    options: Array<{ text: string; isCorrect: boolean }>;
    explanation?: string;
  }>>([]);
  
  // Fetch all sets for export
  const { data: sets = [] } = useQuery<FlashcardSet[]>({
    queryKey: ['/api/sets'],
  });
  
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
      // Split the text into separate questions using the format we specified
      const questionBlocks = importText
        .split(/# Question \d+[^\n]*\n/)
        .slice(1) // Remove the first empty element
        .map((block, index) => `# Question ${index + 1}${block}`); // Add the question number back
      
      if (questionBlocks.length === 0) {
        // If no questions were found using our preferred format,
        // try alternative formats
        const alternativeBlocks = importText.split(/\\begin\{question\}|\\\[(Q[0-9]+)\]|\n\s*\n/)
          .filter(block => block.trim());
        
        if (alternativeBlocks.length > 0) {
          toast({
            title: "Format Warning",
            description: "Your content didn't follow the recommended format. We'll try to parse it anyway.",
            variant: "destructive",
          });
          questionBlocks.push(...alternativeBlocks);
        }
      }

      if (questionBlocks.length === 0) {
        throw new Error("No questions found in the provided text.");
      }
      
      // Process each question block
      const parsed = questionBlocks.map(block => {
        // Find the title/header
        const titleMatch = block.match(/# Question (\d+):?\s*(.*?)$/m);
        const title = titleMatch ? titleMatch[2].trim() : "";
        
        // Extract options
        // Look for lines that start with A), B), etc. (with or without asterisk)
        const lines = block.split('\n');
        let questionTextLines = [];
        let optionsStarted = false;
        let options = [];
        let correctOptionIndex = -1;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Check if line is an option marker (A), B), etc.)
          const optionMatch = line.match(/^(\*)?([A-D])\)\s*(.*)/);
          
          if (optionMatch) {
            optionsStarted = true;
            const isCorrect = !!optionMatch[1]; // Check if asterisk is present
            const optionText = optionMatch[3].trim();
            
            options.push({
              text: optionText,
              isCorrect: isCorrect
            });
            
            if (isCorrect) {
              correctOptionIndex = options.length - 1;
            }
          } else if (!optionsStarted) {
            // If it's not an option and we haven't started options yet,
            // it's part of the question text
            questionTextLines.push(line);
          }
        }
        
        // If no correct option was marked with *, make the first one correct
        if (correctOptionIndex === -1 && options.length > 0) {
          options[0].isCorrect = true;
        }
        
        // If no options were found, create default ones
        if (options.length === 0) {
          options = [
            { text: "Option created automatically", isCorrect: true },
            { text: "Incorrect option", isCorrect: false },
            { text: "Another incorrect option", isCorrect: false },
            { text: "Yet another incorrect option", isCorrect: false }
          ];
        }
        
        const questionText = questionTextLines.join('\n').trim();
        
        return {
          question: questionText,
          options,
          explanation: "", // No explanation by default
          title // Store title for future use if needed
        };
      });
      
      setParsedQuestions(parsed);
      
      toast({
        title: `${parsed.length} questions parsed`,
        description: "Review the questions and click 'Import' to add them to your flashcards.",
      });
    } catch (error: any) {
      console.error("Error parsing LaTeX:", error);
      toast({
        title: "Error parsing content",
        description: error.message || "There was an error processing the LaTeX content. Please check the format and try again.",
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
      const setResponse = await fetch('/api/sets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: importSetName,
          description: importSetDescription || "Imported from LaTeX",
          primaryColor: "#3b82f6", // Default blue color
        }),
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
        
        return fetch('/api/cards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cardData),
        });
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
      
      // Navigate to the new set
      setTimeout(() => {
        window.location.href = `/sets/${newSet.id}`;
      }, 500);
      
    } catch (error: any) {
      console.error("Error importing flashcards:", error);
      toast({
        title: "Import failed",
        description: error.message || "There was an error importing the flashcards. Please try again.",
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
              <CardContent className="space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-md p-4 space-y-3">
                  <h3 className="font-semibold text-amber-800">LaTeX Import Format Instructions</h3>
                  <p className="text-sm text-amber-700">
                    Format your multiple-choice questions according to these guidelines for successful import:
                  </p>
                  <ul className="text-sm text-amber-700 space-y-1 list-disc pl-5">
                    <li>Start each question with <code className="bg-amber-100 px-1 rounded"># Question [number]: [optional title]</code></li>
                    <li>Write the question text with LaTeX math expressions in $ or $$ delimiters</li>
                    <li>List each option with a letter prefix (A, B, C...) followed by a closing parenthesis</li>
                    <li>Mark correct answers with an asterisk (*) before the letter</li>
                    <li>Separate questions with a blank line</li>
                  </ul>
                </div>

                <div className="border rounded-md p-4 space-y-3 bg-gray-50">
                  <h3 className="font-semibold">Example LaTeX Format</h3>
                  <pre className="text-xs font-mono whitespace-pre-wrap p-3 bg-white border rounded overflow-x-auto">
{`# Question 1: Limits and Continuity
If $\\lim_{x \\to 0} \\frac{e^x - 1 - x}{x^2} = L$, then the value of $L$ is:
A) $\\frac{1}{2}$
B) $1$
*C) $\\frac{1}{2}$
D) $\\frac{3}{2}$

# Question 2: Partial Derivatives
The value of $\\frac{\\partial z}{\\partial x}$ at the point $(1, 0)$ for $z = x^2y + y^3$ is:
A) $0$
*B) $0$
C) $1$
D) $3$

# Question 3: Integration Techniques
Evaluate the integral $\\int \\frac{dx}{x\\sqrt{x^2-1}}$
A) $\\ln|x + \\sqrt{x^2-1}| + C$
B) $\\sin^{-1}\\frac{1}{x} + C$
*C) $\\sec^{-1}|x| + C$
D) $\\tan^{-1}\\sqrt{x^2-1} + C$`}
                  </pre>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="set-name">Flashcard Set Name</Label>
                  <Input 
                    id="set-name" 
                    value={importSetName}
                    onChange={(e) => setImportSetName(e.target.value)}
                    placeholder="e.g., Calculus MCQs"
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
                    Review and edit the parsed questions before importing them.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {parsedQuestions.map((q, index) => (
                      <div key={index} className="border rounded-md p-4 space-y-3">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-semibold">Question {index + 1}:</div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setEditingIndex(index);
                              setEditFormData({
                                question: q.question,
                                options: [...q.options],
                                explanation: q.explanation || ''
                              });
                              setEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-1" /> Edit
                          </Button>
                        </div>
                        
                        <div 
                          className="text-sm latex-content p-2 bg-gray-50 rounded"
                          dangerouslySetInnerHTML={{ 
                            __html: renderLatexString(q.question) 
                          }}
                        />
                        
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
                        
                        {q.explanation && (
                          <div>
                            <div className="font-semibold mb-1">Explanation:</div>
                            <div 
                              className="text-sm latex-content p-2 bg-gray-50 rounded"
                              dangerouslySetInnerHTML={{ 
                                __html: renderLatexString(q.explanation) 
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Edit Flashcard Question</DialogTitle>
                  <DialogDescription>
                    Make changes to the question, options, or explanation. You can use LaTeX math notation with $ symbols.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-question">Question</Label>
                    <Textarea
                      id="edit-question"
                      value={editFormData.question}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        question: e.target.value
                      })}
                      rows={4}
                      className="font-mono text-sm"
                    />
                    
                    <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                      <div className="text-xs text-gray-500 mb-1">Preview:</div>
                      <div 
                        className="latex-content"
                        dangerouslySetInnerHTML={{ 
                          __html: renderLatexString(editFormData.question) 
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Options</Label>
                    
                    {editFormData.options.map((opt, i) => (
                      <div key={i} className="flex items-start gap-2 mb-2">
                        <Button 
                          variant={opt.isCorrect ? "default" : "outline"}
                          size="sm"
                          className="mt-1 h-8 w-8 p-0 flex-shrink-0"
                          onClick={() => {
                            const newOptions = [...editFormData.options];
                            // First set all to false
                            newOptions.forEach(o => o.isCorrect = false);
                            // Then set this one to true
                            newOptions[i].isCorrect = true;
                            setEditFormData({
                              ...editFormData,
                              options: newOptions
                            });
                          }}
                        >
                          {String.fromCharCode(65 + i)}
                        </Button>
                        
                        <div className="flex-1">
                          <Textarea
                            value={opt.text}
                            onChange={(e) => {
                              const newOptions = [...editFormData.options];
                              newOptions[i].text = e.target.value;
                              setEditFormData({
                                ...editFormData,
                                options: newOptions
                              });
                            }}
                            rows={2}
                            className="font-mono text-sm"
                          />
                          
                          <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                            <div 
                              className="latex-content"
                              dangerouslySetInnerHTML={{ 
                                __html: renderLatexString(opt.text) 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editFormData.options.length < 6) {
                            setEditFormData({
                              ...editFormData,
                              options: [
                                ...editFormData.options,
                                { text: "New option", isCorrect: false }
                              ]
                            });
                          } else {
                            toast({
                              title: "Maximum options reached",
                              description: "You can have at most 6 options per question."
                            });
                          }
                        }}
                      >
                        Add Option
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (editFormData.options.length > 2) {
                            const newOptions = [...editFormData.options];
                            newOptions.pop();
                            // Make sure at least one option is correct
                            if (!newOptions.some(o => o.isCorrect)) {
                              newOptions[0].isCorrect = true;
                            }
                            setEditFormData({
                              ...editFormData,
                              options: newOptions
                            });
                          } else {
                            toast({
                              title: "Minimum options required",
                              description: "You need at least 2 options per question."
                            });
                          }
                        }}
                      >
                        Remove Last Option
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit-explanation">Explanation (Optional)</Label>
                    <Textarea
                      id="edit-explanation"
                      value={editFormData.explanation}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        explanation: e.target.value
                      })}
                      rows={3}
                      className="font-mono text-sm"
                      placeholder="Add an explanation for this question (optional)"
                    />
                    
                    {editFormData.explanation && (
                      <div className="p-2 bg-gray-50 rounded text-sm mt-1">
                        <div className="text-xs text-gray-500 mb-1">Preview:</div>
                        <div 
                          className="latex-content"
                          dangerouslySetInnerHTML={{ 
                            __html: renderLatexString(editFormData.explanation) 
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => {
                      if (editingIndex !== null) {
                        // Create a copy of the parsed questions array
                        const updatedQuestions = [...parsedQuestions];
                        
                        // Make sure at least one option is correct
                        if (!editFormData.options.some(o => o.isCorrect)) {
                          editFormData.options[0].isCorrect = true;
                        }
                        
                        // Update the question at the editing index
                        updatedQuestions[editingIndex] = {
                          question: editFormData.question,
                          options: editFormData.options,
                          explanation: editFormData.explanation
                        };
                        
                        // Update the state
                        setParsedQuestions(updatedQuestions);
                        setEditDialogOpen(false);
                        
                        // Show a success message
                        toast({
                          title: "Question updated",
                          description: "Your changes have been saved."
                        });
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="appearance" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Export your flashcard sets to different formats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded p-4 mb-4">
                  <h3 className="font-medium text-amber-800 mb-2">Export Functionality</h3>
                  <p className="text-sm text-amber-700">
                    Export your flashcard sets to PDF format for printing or sharing. The export includes LaTeX formatting and all card details.
                  </p>
                </div>
                
                <div className="grid gap-4">
                  <div className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h3 className="font-medium">Export All Sets to PDF</h3>
                      <p className="text-sm text-muted-foreground">Generate a PDF document of all your flashcard sets ({sets.length} sets available)</p>
                    </div>
                    <Button 
                      onClick={() => {
                        setIsExporting(true);
                        // In a real implementation, this would call an API to generate a PDF
                        // For now we'll simulate the process with a timeout
                        setTimeout(() => {
                          setIsExporting(false);
                          toast({
                            title: "PDF Export Ready",
                            description: "Your PDF has been generated and is ready for download."
                          });
                          
                          // Since we can't actually generate a PDF in this demo, we'll just
                          // show instructions on how this would work in a production environment
                          alert("In a production environment, this would generate and download a PDF file containing all your flashcard sets with LaTeX formatting. For this demo, we're showing the toast notification only.");
                        }, 2000);
                      }}
                      disabled={isExporting}
                    >
                      {isExporting ? (
                        <>Exporting...</>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Export to PDF
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 border rounded-md">
                    <div>
                      <h3 className="font-medium">Generate Android APK</h3>
                      <p className="text-sm text-muted-foreground">Create a shareable Android app package with your flashcards</p>
                    </div>
                    <Button 
                      variant="secondary"
                      onClick={() => {
                        alert("In a production environment, this would build and generate an Android APK file that includes all your current flashcard sets. The APK would be configured to request storage permissions for saving updates and new sets.");
                        toast({
                          title: "APK Generation",
                          description: "This feature would generate an Android APK in a production environment."
                        });
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Create APK
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detailed LaTeX Import Guide</CardTitle>
                <CardDescription>
                  Step-by-step instructions for formatting LaTeX imports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
                  <h3 className="font-medium text-blue-800 mb-2">Complete LaTeX Import Format</h3>
                  <p className="text-sm text-blue-700 mb-3">
                    Follow these step-by-step instructions to properly format your LaTeX content for importing:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-white rounded p-3 border border-blue-100">
                      <h4 className="font-medium text-blue-700 mb-1">Step 1: Format Your Questions</h4>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        <li>Begin each question with <code className="bg-blue-50 px-1 rounded"># Question [number]:</code> followed by an optional title</li>
                        <li>The question text should follow on the next line(s)</li>
                        <li>Use <code className="bg-blue-50 px-1 rounded">$...$</code> for inline math expressions</li>
                        <li>Use <code className="bg-blue-50 px-1 rounded">$$...$$</code> for displayed math equations</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded p-3 border border-blue-100">
                      <h4 className="font-medium text-blue-700 mb-1">Step 2: Format Your Options</h4>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        <li>List each option with a letter followed by closing parenthesis: <code className="bg-blue-50 px-1 rounded">A)</code>, <code className="bg-blue-50 px-1 rounded">B)</code>, etc.</li>
                        <li>Add an asterisk <code className="bg-blue-50 px-1 rounded">*</code> before the letter to mark the correct answer: <code className="bg-blue-50 px-1 rounded">*C)</code></li>
                        <li>Place each option on a new line</li>
                        <li>You can use LaTeX math in options too: <code className="bg-blue-50 px-1 rounded">A) $\\int x^2 dx$</code></li>
                      </ul>
                    </div>
                    
                    <div className="bg-white rounded p-3 border border-blue-100">
                      <h4 className="font-medium text-blue-700 mb-1">Step 3: Separate Questions</h4>
                      <ul className="text-sm space-y-1 list-disc pl-5">
                        <li>Always separate questions with at least one blank line</li>
                        <li>You can add explanations after the options (not currently supported in the parser)</li>
                        <li>Make sure to use proper LaTeX syntax for all mathematical notations</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 border rounded p-4">
                  <h3 className="font-medium mb-2">Troubleshooting Import Issues</h3>
                  <ul className="text-sm space-y-2 list-disc pl-5">
                    <li><strong>Missing or incorrectly formatted header:</strong> Make sure each question starts with '# Question' followed by a number</li>
                    <li><strong>Option formatting:</strong> Each option must be on its own line with the format A), B), C), etc.</li>
                    <li><strong>LaTeX syntax errors:</strong> Ensure all math expressions have matching opening and closing $ delimiters</li>
                    <li><strong>Special characters:</strong> Some LaTeX commands require extra backslashes when pasted into the text area</li>
                    <li><strong>Multiple correct answers:</strong> Only mark one option as correct with an asterisk (*)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
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

            <Card>
              <CardHeader>
                <CardTitle>VS Code Deployment Guide</CardTitle>
                <CardDescription>
                  Instructions for deploying this application to VS Code
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4 space-y-3">
                  <h3 className="font-semibold text-blue-800">Deployment Instructions</h3>
                  <p className="text-sm">
                    Follow these steps to deploy the application in VS Code locally:
                  </p>
                  <ol className="text-sm space-y-2 list-decimal pl-5">
                    <li>Clone the repository from GitHub or download the project files</li>
                    <li>Open the project folder in VS Code</li>
                    <li>Open a terminal in VS Code and run <code className="bg-blue-100 px-1 rounded">npm install</code> to install dependencies</li>
                    <li>Start the development server with <code className="bg-blue-100 px-1 rounded">npm run dev</code></li>
                    <li>The application will be available at <code className="bg-blue-100 px-1 rounded">http://localhost:5000</code></li>
                  </ol>
                </div>

                <div className="bg-gray-50 border rounded-md p-4 space-y-3">
                  <h3 className="font-semibold">Required VS Code Extensions</h3>
                  <ul className="text-sm space-y-1 list-disc pl-5">
                    <li><strong>ESLint</strong> - For code quality</li>
                    <li><strong>Prettier</strong> - For code formatting</li>
                    <li><strong>TypeScript</strong> - For TypeScript support</li>
                    <li><strong>Tailwind CSS IntelliSense</strong> - For styling support</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-md p-4 space-y-3">
                  <h3 className="font-semibold text-green-800">Project Structure</h3>
                  <p className="text-sm text-green-700">
                    The application follows a standard React + Express structure:
                  </p>
                  <ul className="text-sm text-green-700 space-y-1 list-disc pl-5">
                    <li><code className="bg-green-100 px-1 rounded">client/</code> - Frontend React application</li>
                    <li><code className="bg-green-100 px-1 rounded">server/</code> - Backend Express API</li>
                    <li><code className="bg-green-100 px-1 rounded">shared/</code> - Shared TypeScript types and schemas</li>
                    <li><code className="bg-green-100 px-1 rounded">package.json</code> - Project dependencies and scripts</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}