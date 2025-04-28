import React from 'react';
import { BlockerProvider } from './context/BlockerContext';
import ShortsBlocker from './components/ShortsBlocker';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  return (
    <BlockerProvider>
      <TooltipProvider>
        <Toaster />
        <ShortsBlocker />
      </TooltipProvider>
    </BlockerProvider>
  );
}

export default App;
