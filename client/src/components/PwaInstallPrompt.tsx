import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDevice } from './DeviceContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const { isAndroid, isIOS, isStandalone } = useDevice();

  useEffect(() => {
    // Check if already installed as PWA
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detect installation availability
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowDialog(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect if installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowDialog(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!installPrompt) return;
    
    await installPrompt.prompt();
    const choiceResult = await installPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    setInstallPrompt(null);
    setShowDialog(false);
  };

  const handleClose = () => {
    setShowDialog(false);
  };

  // Only show for mobile devices that aren't already installed
  if (isInstalled || (!isAndroid && !isIOS)) {
    return null;
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Install MathCards App</DialogTitle>
            <DialogDescription>
              Install MathCards on your device for the best experience. You'll get offline access and improved performance.
            </DialogDescription>
          </DialogHeader>
          
          {isAndroid && (
            <div className="flex flex-col space-y-4">
              <p className="text-sm">
                Tap the install button below to add MathCards to your home screen.
              </p>
              <img 
                src="/icons/icon-192x192.png" 
                alt="MathCards App Icon" 
                className="w-24 h-24 mx-auto my-2"
              />
            </div>
          )}
          
          {isIOS && (
            <div className="flex flex-col space-y-4">
              <p className="text-sm">
                Tap the Share button and then 'Add to Home Screen' to install MathCards.
              </p>
              <div className="bg-gray-100 p-3 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                  <polyline points="16 6 12 2 8 6"></polyline>
                  <line x1="12" y1="2" x2="12" y2="15"></line>
                </svg>
                <span className="ml-2">Tap and then 'Add to Home Screen'</span>
              </div>
            </div>
          )}
          
          <DialogFooter className="sm:justify-between">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Not now
            </Button>
            {installPrompt && (
              <Button type="button" onClick={handleInstallClick} className="flex">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Install
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Floating install button (visible when dialog is closed) */}
      {!showDialog && installPrompt && (
        <Button
          onClick={() => setShowDialog(true)}
          className="fixed bottom-4 right-4 z-50 shadow-lg rounded-full w-12 h-12 p-0 flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </Button>
      )}
    </>
  );
}