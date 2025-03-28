import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useDevice } from './DeviceContext';
import { useToast } from '@/hooks/use-toast';

export function ShareApp() {
  const [open, setOpen] = useState(false);
  const { isAndroid, isIOS, isDesktop } = useDevice();
  const { toast } = useToast();

  const shareUrl = window.location.origin;
  
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MathCards - Customizable Math Flashcards',
          text: 'Check out this amazing flashcard app for studying math with LaTeX support!',
          url: shareUrl,
        });
        toast({
          title: 'Shared successfully',
          description: 'Thank you for sharing MathCards with others!',
        });
      } catch (error) {
        // User cancelled or share failed
        console.error('Share failed:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      handleCopyLink();
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Link copied to clipboard',
        description: 'Share this link with anyone you want to share the app with.',
      });
      setOpen(false);
    }).catch(err => {
      console.error('Could not copy text: ', err);
      // Fallback
      prompt('Copy this link to share the app:', shareUrl);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          Share App
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share MathCards</DialogTitle>
          <DialogDescription>
            Share this app with friends, classmates or colleagues.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="share">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">Share Link</TabsTrigger>
            <TabsTrigger value="install">Install App</TabsTrigger>
          </TabsList>
          
          <TabsContent value="share" className="mt-4">
            <div className="flex flex-col space-y-4">
              <p className="text-sm">
                Share MathCards with others so they can enjoy creating and studying math flashcards too.
              </p>
              
              <div className="flex gap-2">
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <Button onClick={handleShare} className="flex-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <circle cx="18" cy="5" r="3"></circle>
                      <circle cx="6" cy="12" r="3"></circle>
                      <circle cx="18" cy="19" r="3"></circle>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                    </svg>
                    Share
                  </Button>
                )}
                
                <Button onClick={handleCopyLink} variant="outline" className="flex-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                  </svg>
                  Copy Link
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                Current URL: {shareUrl}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="install" className="mt-4">
            <div className="flex flex-col space-y-4">
              <p className="text-sm">
                Install MathCards as an app on your device for the best experience:
              </p>
              
              {isAndroid && (
                <div className="bg-muted p-3 rounded-lg space-y-3">
                  <h4 className="font-semibold">On Android:</h4>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Tap on the browser menu (three dots)</li>
                    <li>Select "Install app" or "Add to Home screen"</li>
                    <li>Follow the prompts to install</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    This creates a standalone app that works offline!
                  </p>
                </div>
              )}
              
              {isIOS && (
                <div className="bg-muted p-3 rounded-lg space-y-3">
                  <h4 className="font-semibold">On iOS:</h4>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Tap the Share icon in Safari</li>
                    <li>Scroll down and tap "Add to Home Screen"</li>
                    <li>Tap "Add" in the top-right corner</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    This creates an app icon on your home screen!
                  </p>
                </div>
              )}
              
              {isDesktop && (
                <div className="bg-muted p-3 rounded-lg space-y-3">
                  <h4 className="font-semibold">On Desktop:</h4>
                  <ol className="list-decimal list-inside text-sm space-y-2">
                    <li>Look for the install icon in your browser's address bar</li>
                    <li>Click it and follow the prompts to install</li>
                  </ol>
                  <p className="text-xs text-muted-foreground mt-2">
                    The install icon appears as a "+" or computer symbol in most browsers.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="sm:justify-start">
          <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}