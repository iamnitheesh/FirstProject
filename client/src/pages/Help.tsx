import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

export default function Help() {
  
  return (
    <div className="container py-6 md:py-10 max-w-5xl mx-auto">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Help & Documentation</h1>
          <p className="text-muted-foreground">
            Learn how to use the flashcard application effectively
          </p>
        </div>

        <Tabs defaultValue="latex">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="latex">LaTeX MCQ Generation</TabsTrigger>
            <TabsTrigger value="usage">Using the App</TabsTrigger>
            <TabsTrigger value="mobile">Mobile Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="latex" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Creating LaTeX MCQs</CardTitle>
                <CardDescription>
                  Learn how to format and import LaTeX multiple-choice questions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">LaTeX Syntax for Questions</h3>
                  <p>
                    You can use LaTeX notation in your flashcards to format mathematical expressions. 
                    The app supports standard LaTeX math mode syntax.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-2">Example 1: Integral</h4>
                      <div className="mb-2 text-sm font-mono bg-gray-100 p-2 rounded">
                        {`\\int_{0}^{\\pi} \\sin(x) dx = 2`}
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <img src="https://latex.codecogs.com/svg.latex?\int_{0}^{\pi}\sin(x)dx=2" alt="Integral example" className="mx-auto" />
                      </div>
                    </div>
                    <div className="p-4 border rounded-md">
                      <h4 className="font-medium mb-2">Example 2: Derivative</h4>
                      <div className="mb-2 text-sm font-mono bg-gray-100 p-2 rounded">
                        {`\\frac{d}{dx}(e^x) = e^x`}
                      </div>
                      <div className="p-2 bg-blue-50 rounded">
                        <img src="https://latex.codecogs.com/svg.latex?\frac{d}{dx}(e^x)=e^x" alt="Derivative example" className="mx-auto" />
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Bulk Import Format</h3>
                  <p>
                    To import multiple questions at once, format your LaTeX MCQs in the following way:
                  </p>

                  <div className="p-4 border rounded-md bg-gray-50">
                    <pre className="text-sm font-mono whitespace-pre-wrap">
{`# Question 1: Integration by parts
What is $\\int x \\sin(x) dx$?
A) $\\sin(x) - x\\cos(x) + C$
B) $x\\sin(x) + \\cos(x) + C$
*C) $-x\\cos(x) + \\sin(x) + C$
D) $x\\sin(x) - \\cos(x) + C$

# Question 2: Derivative
The derivative of $f(x) = \\ln(\\sin(x))$ is:
A) $\\cos(x)/\\sin(x)$
*B) $\\cot(x)$
C) $\\tan(x)$
D) $1/\\sin(x)$`}
                    </pre>
                  </div>

                  <h4 className="font-medium">Format Guidelines:</h4>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Start each question with <code className="text-sm bg-gray-100 p-1 rounded"># Question [number]: [optional title]</code></li>
                    <li>Write the question text on the next line(s)</li>
                    <li>List each option with a letter prefix followed by a closing parenthesis</li>
                    <li>Mark the correct answer with an asterisk (*) before the letter</li>
                    <li>Separate questions with a blank line</li>
                    <li>Enclose LaTeX math expressions with $ or $$ delimiters</li>
                  </ul>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Image Support</h3>
                  <p>
                    You can include images in your questions and options for diagrams and visual content.
                  </p>
                  <div className="p-4 border rounded-md">
                    <ul className="list-disc list-inside space-y-2">
                      <li>Images can be uploaded directly when creating/editing flashcards</li>
                      <li>Supported formats: PNG, JPEG, GIF</li>
                      <li>Recommended image size: less than 1MB for better performance</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Using the Application</CardTitle>
                <CardDescription>
                  Learn how to get the most out of your flashcard sets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Creating and Managing Sets</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Create a New Set</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Click "Create New" on the home page</li>
                        <li>Enter a title and description</li>
                        <li>Add tags (optional) to organize your sets</li>
                        <li>Select a color theme (optional)</li>
                      </ol>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Add Flashcards</h4>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Open a flashcard set</li>
                        <li>Click "Add Card"</li>
                        <li>Enter question text (supports LaTeX)</li>
                        <li>Add multiple choice options</li>
                        <li>Mark the correct answer</li>
                        <li>Add explanation (optional)</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Study Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Study Mode</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Review cards one by one</li>
                        <li>See question and flip to reveal answer</li>
                        <li>Rate your confidence after each card</li>
                        <li>Track your progress through the set</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Test Mode</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Take a multiple-choice test</li>
                        <li>Get immediate feedback on answers</li>
                        <li>View your score at the end</li>
                        <li>Review incorrect answers</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Navigation</h4>
                      <ul className="space-y-1">
                        <li><kbd className="px-2 py-1 bg-gray-100 rounded">←</kbd> Previous card</li>
                        <li><kbd className="px-2 py-1 bg-gray-100 rounded">→</kbd> Next card</li>
                        <li><kbd className="px-2 py-1 bg-gray-100 rounded">Space</kbd> Flip card</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Test Mode</h4>
                      <ul className="space-y-1">
                        <li><kbd className="px-2 py-1 bg-gray-100 rounded">1-4</kbd> Select option</li>
                        <li><kbd className="px-2 py-1 bg-gray-100 rounded">Enter</kbd> Submit answer</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mobile Usage Guide</CardTitle>
                <CardDescription>
                  Tips for using the app on Android devices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Mobile-Specific Features</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium">Touch Gestures</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Swipe left/right to navigate cards</li>
                        <li>Tap card to flip in study mode</li>
                        <li>Pull down to refresh content</li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium">Offline Use</h4>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Data is stored locally on your device</li>
                        <li>Access your flashcards without internet</li>
                        <li>Changes sync when connection is restored</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Storage Permissions</h3>
                  <p>
                    To use all features on Android devices, you may need to grant storage permissions:
                  </p>
                  <div className="p-4 border rounded-md">
                    <ol className="list-decimal list-inside space-y-2">
                      <li>Go to your device Settings</li>
                      <li>Select Apps or Application Manager</li>
                      <li>Find and tap on the Flashcard App</li>
                      <li>Tap on Permissions</li>
                      <li>Enable Storage permission</li>
                    </ol>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Storage permission is required to import/export flashcard sets and to add images to your cards.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Battery Optimization</h3>
                  <p>
                    For the best performance on Android:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Keep image sizes below 1MB</li>
                    <li>Close other apps when using complex LaTeX expressions</li>
                    <li>Enable power saving mode when studying for long periods</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-4">
          <Link href="/">
            <div className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Home
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}