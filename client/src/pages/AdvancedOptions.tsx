import React, { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useBlockerContext } from '@/context/BlockerContext';
import { getExtensionVersion } from '@/lib/utils';
import { Trash2, Plus, ArrowLeft, Clock, BarChart, Filter, Star } from 'lucide-react';
import { formatDistance } from 'date-fns';

export default function AdvancedOptions() {
  const { 
    isHideShortsEnabled, 
    isBlockShortsEnabled, 
    useStatistics,
    customFilters,
    categoryFilters,
    whitelist,
    statistics,
    
    toggleHideShorts, 
    toggleBlockShorts,
    toggleStatistics,
    addCustomFilter,
    updateCustomFilter,
    removeCustomFilter,
    addCategoryFilter,
    removeCategoryFilter,
    removeFromWhitelist,
    resetStatistics
  } = useBlockerContext();
  
  const [version, setVersion] = useState('1.0.0');
  const [newFilter, setNewFilter] = useState('');
  const [newCategory, setNewCategory] = useState('');

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

      <Tabs defaultValue="features" className="mb-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="filters">
            <Filter className="h-4 w-4 mr-1" />
            Filters
          </TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="whitelist">
            <Star className="h-4 w-4 mr-1" />
            Whitelist
          </TabsTrigger>
          <TabsTrigger value="stats">
            <BarChart className="h-4 w-4 mr-1" />
            Stats
          </TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="help">Help</TabsTrigger>
        </TabsList>
        
        {/* Features Tab */}
        <TabsContent value="features" className="p-4 bg-white rounded-md shadow-sm mt-2 border">
          <h3 className="text-lg font-medium mb-2">Extension Features</h3>
          <div className="space-y-4">
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Hide Shorts</h4>
              <p className="text-gray-600">Visually hides Shorts content from the YouTube interface</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Block Shorts</h4>
              <p className="text-gray-600">Prevents navigation to Shorts content by intercepting clicks</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Custom Filters</h4>
              <p className="text-gray-600">Create your own content filters based on text patterns</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Category Filters</h4>
              <p className="text-gray-600">Filter videos by their category (e.g., Gaming, Music)</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Usage Statistics</h4>
              <p className="text-gray-600">Track how many Shorts have been blocked or hidden</p>
            </div>
            <div className="p-3 border rounded-md">
              <h4 className="font-medium">Whitelist</h4>
              <p className="text-gray-600">Allow specific Shorts videos that you want to watch</p>
            </div>
          </div>
        </TabsContent>
        
        {/* Custom Filters Tab */}
        <TabsContent value="filters" className="p-4 bg-white rounded-md shadow-sm mt-2 border">
          <h3 className="text-lg font-medium mb-4">Custom Content Filters</h3>
          <div className="flex mb-6">
            <Input 
              placeholder="Enter filter pattern (e.g. 'Minecraft Shorts')" 
              value={newFilter}
              onChange={(e) => setNewFilter(e.target.value)}
              className="mr-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newFilter.trim()) {
                  addCustomFilter(newFilter.trim());
                  setNewFilter('');
                }
              }}
            />
            <Button onClick={() => {
              if (newFilter.trim()) {
                addCustomFilter(newFilter.trim());
                setNewFilter('');
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Filter
            </Button>
          </div>
          
          <div className="space-y-4">
            {customFilters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom filters added yet.</p>
            ) : (
              customFilters.map(filter => (
                <div key={filter.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <Switch 
                      checked={filter.enabled}
                      onCheckedChange={(checked) => updateCustomFilter(filter.id, filter.pattern, checked)}
                      className="mr-3 data-[state=checked]:bg-[#FF0000]"
                    />
                    <span>{filter.pattern}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeCustomFilter(filter.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Custom filters will apply content-based filtering using the patterns you specify.</p>
          </div>
        </TabsContent>
        
        {/* Category Filters Tab */}
        <TabsContent value="categories" className="p-4 bg-white rounded-md shadow-sm mt-2 border">
          <h3 className="text-lg font-medium mb-4">Category Filters</h3>
          <div className="flex mb-6">
            <Input 
              placeholder="Enter category name (e.g. 'Gaming', 'Music')" 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="mr-2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newCategory.trim()) {
                  addCategoryFilter(newCategory.trim());
                  setNewCategory('');
                }
              }}
            />
            <Button onClick={() => {
              if (newCategory.trim()) {
                addCategoryFilter(newCategory.trim());
                setNewCategory('');
              }
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {categoryFilters.length === 0 ? (
              <p className="text-sm text-muted-foreground">No category filters added yet.</p>
            ) : (
              categoryFilters.map(category => (
                <Badge key={category} className="flex items-center gap-1 px-3 py-1">
                  {category}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removeCategoryFilter(category)}
                  >
                    <Trash2 className="h-3 w-3 text-red-500" />
                  </Button>
                </Badge>
              ))
            )}
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Common YouTube categories include: Gaming, Music, Sports, Entertainment, How-to, News, and Technology</p>
          </div>
        </TabsContent>
        
        {/* Whitelist Tab */}
        <TabsContent value="whitelist" className="p-4 bg-white rounded-md shadow-sm mt-2 border">
          <h3 className="text-lg font-medium mb-4">Shorts Whitelist</h3>
          
          <div className="space-y-4">
            {whitelist.length === 0 ? (
              <div className="text-center p-6 border border-dashed rounded-md">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm text-muted-foreground">
                  No Shorts videos in whitelist yet.
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Whitelist Shorts directly from YouTube by right-clicking on a Shorts video 
                  and selecting "Add to Whitelist" from the context menu.
                </p>
              </div>
            ) : (
              whitelist.map(shortsId => (
                <div key={shortsId} className="flex items-center justify-between p-3 border rounded-md">
                  <a 
                    href={`https://www.youtube.com/shorts/${shortsId}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Shorts ID: {shortsId}
                  </a>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeFromWhitelist(shortsId)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Whitelisted Shorts will not be blocked or hidden when you're browsing YouTube.</p>
          </div>
        </TabsContent>
        
        {/* Statistics Tab */}
        <TabsContent value="stats" className="p-4 bg-white rounded-md shadow-sm mt-2 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Usage Statistics</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Enable Statistics</span>
              <Switch 
                checked={useStatistics} 
                onCheckedChange={toggleStatistics} 
                className="data-[state=checked]:bg-[#FF0000]"
              />
            </div>
          </div>
          
          {useStatistics ? (
            <>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 border rounded-md text-center">
                  <h4 className="text-sm font-medium mb-1">Shorts Blocked</h4>
                  <p className="text-3xl font-bold text-red-600">{statistics.shortsBlocked}</p>
                </div>
                <div className="p-4 border rounded-md text-center">
                  <h4 className="text-sm font-medium mb-1">Shorts Hidden</h4>
                  <p className="text-3xl font-bold text-blue-600">{statistics.shortsHidden}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Last reset: {statistics.lastReset ? formatDistance(new Date(statistics.lastReset), new Date(), { addSuffix: true }) : 'Never'}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={resetStatistics}
                >
                  Reset Statistics
                </Button>
              </div>
            </>
          ) : (
            <div className="p-6 text-center border border-dashed rounded-md">
              <BarChart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Statistics tracking is currently disabled.</p>
              <p className="text-sm text-gray-400 mt-2">Enable it to track how many Shorts are being blocked and hidden.</p>
            </div>
          )}
          
          <div className="mt-4 text-sm text-gray-500">
            <p>Statistics are stored locally and never sent to any server.</p>
          </div>
        </TabsContent>
        
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