import React from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useBlockerContext } from '@/context/BlockerContext';
import { getExtensionVersion } from '@/lib/utils';

export default function AdvancedOptions() {
  const { isHideShortsEnabled, isBlockShortsEnabled, toggleHideShorts, toggleBlockShorts } = useBlockerContext();
  const [version, setVersion] = React.useState('1.0.0');

  React.useEffect(() => {
    // Get the extension version
    const fetchVersion = async () => {
      try {
        const ver = await getExtensionVersion();
        setVersion(ver);
      } catch (error) {
        console.error('Error getting extension version:', error);
      }
    };

    fetchVersion();
  }, []);

  return (
    <div className="container max-w-3xl p-4 mx-auto">
      <div className="flex items-center mb-8">
        <div className="w-10 h-10 mr-3 flex-shrink-0">
          <div className="w-10 h-10 bg-[#FF0000] rounded-full flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#282828]">YouTube Shorts Blocker - Advanced Options</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Extension Settings</CardTitle>
          <CardDescription>Configure how the extension blocks YouTube Shorts content</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6">
            {/* Hide Shorts Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <h2 className="font-medium text-[#282828] text-lg">Hide Shorts</h2>
                <p className="text-gray-600">Hides all Shorts content from the YouTube interface, including sidebar navigation and feed sections.</p>
              </div>
              
              <Switch 
                checked={isHideShortsEnabled} 
                onCheckedChange={toggleHideShorts}
                className="data-[state=checked]:bg-[#FF0000] scale-125"
              />
            </div>

            {/* Block Shorts Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <h2 className="font-medium text-[#282828] text-lg">Block Shorts</h2>
                <p className="text-gray-600">Prevents clicking on Shorts links and redirects away from Shorts pages. More aggressive than hiding.</p>
              </div>
              
              <Switch 
                checked={isBlockShortsEnabled} 
                onCheckedChange={toggleBlockShorts}
                className="data-[state=checked]:bg-[#FF0000] scale-125"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="about" className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="about" className="p-4 bg-white rounded-md shadow-sm mt-2 border">
          <h3 className="text-lg font-medium mb-2">About YouTube Shorts Blocker</h3>
          <p className="mb-4">YouTube Shorts Blocker is a browser extension designed to help users take control of their YouTube experience by removing distracting Shorts content.</p>
          <div className="text-sm text-gray-500">Version: {version}</div>
        </TabsContent>
        <TabsContent value="help" className="p-4 bg-white rounded-md shadow-sm mt-2 border">
          <h3 className="text-lg font-medium mb-2">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">How does the extension work?</h4>
              <p className="text-gray-600">The extension uses CSS to hide Shorts content and JavaScript to prevent navigation to Shorts pages.</p>
            </div>
            <div>
              <h4 className="font-medium">Why am I still seeing some Shorts?</h4>
              <p className="text-gray-600">YouTube frequently updates their interface. If you notice Shorts still appearing, please report it so we can update our selectors.</p>
            </div>
            <div>
              <h4 className="font-medium">Does this work on embedded YouTube videos?</h4>
              <p className="text-gray-600">The extension only works on the youtube.com domain and not on embedded videos on other websites.</p>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="privacy" className="p-4 bg-white rounded-md shadow-sm mt-2 border">
          <h3 className="text-lg font-medium mb-2">Privacy Policy</h3>
          <p className="mb-4">YouTube Shorts Blocker respects your privacy:</p>
          <ul className="list-disc pl-5 space-y-2 text-gray-600">
            <li>We don't collect any personal information</li>
            <li>Your settings are stored locally in your browser</li>
            <li>We don't track your browsing or viewing habits</li>
            <li>No data is sent to our servers or third parties</li>
          </ul>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Developer Tools</CardTitle>
          <CardDescription>Advanced options for troubleshooting</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
              if (chrome && chrome.storage) {
                chrome.storage.sync.clear();
                window.location.reload();
              }
            }}>
              Reset All Settings
            </Button>
            
            <Button variant="outline" className="w-full justify-start text-left" onClick={() => {
              if (chrome && chrome.tabs) {
                chrome.tabs.query({ url: '*://*.youtube.com/*' }, (tabs) => {
                  tabs.forEach(tab => {
                    if (tab.id) {
                      chrome.tabs.reload(tab.id);
                    }
                  });
                });
              }
            }}>
              Refresh All YouTube Tabs
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="secondary" onClick={() => window.close()}>Close</Button>
          <Button variant="default" className="bg-[#FF0000] hover:bg-[#cc0000]" onClick={() => {
            if (chrome && chrome.action) {
              try {
                chrome.action.openPopup();
              } catch (error) {
                console.error("Failed to open popup:", error);
              }
            } else {
              // In development mode, navigate to home
              window.location.href = '/';
            }
          }}>Back to Popup</Button>
        </CardFooter>
      </Card>
    </div>
  );
}