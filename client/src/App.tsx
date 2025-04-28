import React, { useEffect } from 'react';
import { Route, Switch, useLocation } from 'wouter';
import { BlockerProvider } from './context/BlockerContext';
import ShortsBlocker from './components/ShortsBlocker';
import AdvancedOptions from './pages/AdvancedOptions';
import NotFound from './pages/not-found';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

function App() {
  const [location, setLocation] = useLocation();
  
  // Handle URL parameters for pages like options
  useEffect(() => {
    // Check if there's a URL parameter indicating which page to show
    const url = new URL(window.location.href);
    const page = url.searchParams.get('page');
    
    if (page === 'options' && location !== '/options') {
      setLocation('/options');
    }
  }, [location, setLocation]);

  return (
    <BlockerProvider>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={ShortsBlocker} />
          <Route path="/options" component={AdvancedOptions} />
          <Route path="/advanced" component={AdvancedOptions} />
          <Route component={NotFound} />
        </Switch>
      </TooltipProvider>
    </BlockerProvider>
  );
}

export default App;
