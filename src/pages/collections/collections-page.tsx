import React, { useState } from 'react';
import { SelectableTabList } from '@/components/tabs/SelectableTabList';
import { TabSearch } from '@/components/tabs/TabSearch';

export function CollectionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);

  // Get tabs from Chrome
  React.useEffect(() => {
    chrome.runtime.sendMessage({type: "getTabs"}, (response) => {
      if (response?.tabs) {
        setTabs(response.tabs);
      }
    });
  }, []);

  return (
    <div className="flex flex-col h-full">
      <TabSearch 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-1">
        <SelectableTabList 
          tabs={tabs}
          searchQuery={searchQuery}
        />
      </div>
    </div>
  );
} 