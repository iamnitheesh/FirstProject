import React, { useState, useEffect } from 'react';
import { setupOfflineDetection, triggerSync } from '@/lib/serviceWorker';
import { getSyncStatus } from '@/lib/db';
import { WifiOff, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const { toast } = useToast();

  // Setup offline detection
  useEffect(() => {
    setupOfflineDetection(
      // Offline callback
      () => {
        setIsOffline(true);
      },
      // Online callback
      () => {
        setIsOffline(false);
        
        // Check for pending changes
        checkSyncStatus();
        
        toast({
          title: "You're back online!",
          description: "Your changes will be synchronized automatically.",
          variant: "default"
        });
      }
    );
    
    // Initial check for sync status
    checkSyncStatus();
    
    // Set up a periodic check for sync status
    const interval = setInterval(checkSyncStatus, 30000); // every 30 seconds
    
    return () => {
      clearInterval(interval);
    };
  }, []);
  
  // Check for pending changes
  const checkSyncStatus = async () => {
    try {
      const status = await getSyncStatus();
      setPendingChanges(status.pending);
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  };
  
  // Manually trigger sync
  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const success = await triggerSync();
      
      if (success) {
        toast({
          title: "Sync completed",
          description: "All changes have been synchronized successfully.",
          variant: "default"
        });
      } else {
        toast({
          title: "Sync failed",
          description: "Could not synchronize all changes. Try again later.",
          variant: "destructive"
        });
      }
      
      // Refresh sync status
      await checkSyncStatus();
    } catch (error) {
      console.error('Error during manual sync:', error);
      toast({
        title: "Sync failed",
        description: "An error occurred while synchronizing. Try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };
  
  // If online and no pending changes, don't show anything
  if (!isOffline && pendingChanges === 0) {
    return null;
  }
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 z-50 p-2 ${
        isOffline ? 'bg-amber-500' : 'bg-blue-500'
      } text-white text-sm flex items-center justify-between`}
    >
      <div className="flex items-center space-x-2 px-2">
        {isOffline ? (
          <>
            <WifiOff size={16} />
            <span>You're offline. Your changes will be saved locally.</span>
          </>
        ) : pendingChanges > 0 ? (
          <>
            <AlertCircle size={16} />
            <span>{pendingChanges} {pendingChanges === 1 ? 'change' : 'changes'} pending synchronization.</span>
          </>
        ) : (
          <>
            <Check size={16} />
            <span>All changes synchronized.</span>
          </>
        )}
      </div>
      
      {!isOffline && pendingChanges > 0 && (
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-white text-blue-500 hover:bg-blue-50"
          onClick={handleSync}
          disabled={isSyncing}
        >
          <RefreshCw size={16} className={`mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
          Sync Now
        </Button>
      )}
    </div>
  );
}