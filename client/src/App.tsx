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
import { useState } from "react";
import { DeviceProvider } from "@/components/DeviceContext";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";

function Router() {
  return (
    <Switch>
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
  return (
    <QueryClientProvider client={queryClient}>
      <DeviceProvider>
        <Router />
        <PwaInstallPrompt />
        <Toaster />
      </DeviceProvider>
    </QueryClientProvider>
  );
}

export default App;
