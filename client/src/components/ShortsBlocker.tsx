import React, { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useBlockerContext } from '@/context/BlockerContext';
import { isChromeExtension, getExtensionVersion } from '@/lib/utils';
import { BarChart } from 'lucide-react';

export default function ShortsBlocker() {
  const { 
    isHideShortsEnabled, 
    isBlockShortsEnabled, 
    isExtensionActive, 
    useStatistics,
    statistics,
    customFilters,
    categoryFilters,
    whitelist,
    toggleHideShorts, 
    toggleBlockShorts 
  } = useBlockerContext();
  const [isMinimized, setIsMinimized] = useState(false);

  // Determine status class based on active state
  const statusClassName = isExtensionActive 
    ? "bg-green-50 text-green-700" 
    : "bg-yellow-50 text-yellow-700";

  // Get status message based on active state
  const getStatusMessage = () => {
    if (isExtensionActive) {
      return "Extension is active on YouTube";
    }
    return "Extension is inactive (no options selected)";
  };
  
  // Handle Advanced Options click
  const handleAdvancedOptionsClick = () => {
    if (isChromeExtension()) {
      try {
        chrome.runtime.openOptionsPage();
      } catch (error) {
        console.error("Failed to open options page:", error);
        // Fallback to opening index.html in a new tab
        if (chrome && chrome.runtime) {
          window.open(chrome.runtime.getURL('index.html?page=options'), '_blank');
        }
      }
    } else {
      console.log("Advanced options are only available in the Chrome extension");
      // In development mode, navigate to the options page
      window.location.href = '/options';
    }
  };

  if (isMinimized) {
    return (
      <div className="w-72 p-3 shadow-lg bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-6 h-6 mr-2 flex-shrink-0">
              <div className="w-6 h-6 bg-[#FF0000] rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-sm font-bold text-[#282828]">YouTube Shorts Blocker</h1>
          </div>
          <button 
            onClick={() => setIsMinimized(false)}
            className="p-1 hover:bg-gray-100 rounded-full"
            aria-label="Expand"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 p-4 shadow-lg bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 mr-2 flex-shrink-0">
            <div className="w-8 h-8 bg-[#FF0000] rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
          <h1 className="text-lg font-bold text-[#282828]">YouTube Shorts Blocker</h1>
        </div>
        <button 
          onClick={() => setIsMinimized(true)}
          className="p-1 hover:bg-gray-100 rounded-full"
          aria-label="Minimize"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Status Indicator */}
      <div className={`mb-4 p-2 ${statusClassName} rounded-md text-sm flex items-center`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>{getStatusMessage()}</span>
      </div>

      {/* Toggle Options */}
      <div className="space-y-4">
        {/* Hide Shorts Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition hover:bg-gray-100">
          <div>
            <h2 className="font-medium text-[#282828]">Hide Shorts</h2>
            <p className="text-sm text-gray-600">Hides Shorts from sidebar and feed</p>
          </div>
          
          <Switch 
            checked={isHideShortsEnabled} 
            onCheckedChange={toggleHideShorts}
            className="data-[state=checked]:bg-[#FF0000]"
          />
        </div>

        {/* Block Shorts Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg transition hover:bg-gray-100">
          <div>
            <h2 className="font-medium text-[#282828]">Block Shorts</h2>
            <p className="text-sm text-gray-600">Prevents clicking or searching Shorts</p>
          </div>
          
          <Switch 
            checked={isBlockShortsEnabled} 
            onCheckedChange={toggleBlockShorts}
            className="data-[state=checked]:bg-[#FF0000]"
          />
        </div>
      </div>

      {/* Preview Section */}
      <div className="mt-5 pt-3 border-t border-gray-200">
        <h3 className="text-sm font-medium mb-2">Preview: YouTube with Shorts Hidden</h3>
        <div className="relative rounded overflow-hidden border border-gray-200 shadow-sm">
          <div className="h-32 bg-white p-2 overflow-hidden">
            {/* YouTube UI Preview */}
            {/* Sidebar */}
            <div className="absolute left-0 w-12 h-full bg-white border-r border-gray-200 flex flex-col items-center py-2 space-y-4">
              <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="w-6 h-6 bg-gray-200 rounded opacity-30 relative">
                {/* Shorts Icon Crossed Out */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-0.5 bg-[#FF0000] rotate-45 absolute"></div>
                </div>
              </div>
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
            </div>
            
            {/* Main Content */}
            <div className="ml-14 flex flex-col space-y-2">
              {/* Video Thumbnail */}
              <div className="w-full h-10 flex">
                <div className="w-16 h-10 bg-gray-200 rounded"></div>
                <div className="ml-2 flex-1">
                  <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-2 w-1/2 bg-gray-100 rounded mt-1"></div>
                </div>
              </div>
              
              {/* Shorts Section Crossed Out */}
              <div className="w-full h-10 flex opacity-30 relative">
                <div className="absolute -left-1 right-0 top-1/2 h-0.5 bg-[#FF0000] transform -translate-y-1/2"></div>
                <div className="w-16 h-10 bg-gray-200 rounded relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-xs text-gray-400">Shorts</div>
                  </div>
                </div>
                <div className="ml-2 flex-1">
                  <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-2 w-1/2 bg-gray-100 rounded mt-1"></div>
                </div>
              </div>
              
              {/* Video Thumbnail */}
              <div className="w-full h-10 flex">
                <div className="w-16 h-10 bg-gray-200 rounded"></div>
                <div className="ml-2 flex-1">
                  <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-2 w-1/2 bg-gray-100 rounded mt-1"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Features Overview */}
      {useStatistics && (
        <div className="mt-5 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Statistics</h3>
            <BarChart className="h-4 w-4 text-gray-400" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-gray-50 rounded text-center">
              <div className="text-xs text-gray-500">Blocked</div>
              <div className="font-bold text-red-500">{statistics.shortsBlocked}</div>
            </div>
            <div className="p-2 bg-gray-50 rounded text-center">
              <div className="text-xs text-gray-500">Hidden</div>
              <div className="font-bold text-blue-500">{statistics.shortsHidden}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Advanced Features */}
      <div className="mt-2">
        <div className="flex flex-wrap gap-1">
          {customFilters.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {customFilters.length} Custom Filters
            </Badge>
          )}
          {categoryFilters.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {categoryFilters.length} Category Filters
            </Badge>
          )}
          {whitelist.length > 0 && (
            <Badge variant="outline" className="text-xs">
              {whitelist.length} Whitelisted
            </Badge>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
        <div>v1.2.0</div>
        <button 
          className="text-[#FF0000] hover:underline"
          onClick={handleAdvancedOptionsClick}
        >
          Advanced Options
        </button>
      </div>
    </div>
  );
}
