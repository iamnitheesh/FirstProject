import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import SetView from "@/pages/SetView";
import StudyMode from "@/pages/StudyMode";
import TestMode from "@/pages/TestMode";
import Settings from "@/pages/Settings";
import Test from "@/pages/Test";
import { useState, useEffect } from "react";
import { DeviceProvider } from "@/components/DeviceContext";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import OfflineIndicator from "@/components/OfflineIndicator";
import { ApiProvider } from "@/lib/ApiContext";
import { registerServiceWorker } from "@/lib/serviceWorker";
import { initDB } from "@/lib/db";
import { ThemeProvider } from "./contexts/ThemeContext";

function Router() {
  return (
    <Switch>
      <Route path="/test" component={Test} />
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
      <Route path="/sets/:id" component={SetView} />
      <Route path="/sets/:id/study" component={StudyMode} />
      <Route path="/sets/:id/test" component={TestMode} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [appReady, setAppReady] = useState(false);
  
  // Initialize app
  useEffect(() => {
    // Initialize database
    initDB()
      .then(() => {
        console.log('IndexedDB initialized');
        
        // Register the service worker
        registerServiceWorker();
        
        // Mark app as ready
        setAppReady(true);
      })
      .catch(error => {
        console.error('Error initializing app:', error);
        // Still mark as ready, even with errors
        setAppReady(true);
      });
  }, []);
  
  // Show loading state while initializing
  if (!appReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading FormulaNote...</p>
        </div>
      </div>
    );
  }
  
  return (
    <DeviceProvider>
      <Router />
      <PwaInstallPrompt />
      <OfflineIndicator />
      <Toaster />
    </DeviceProvider>
  );
}

export default App;
