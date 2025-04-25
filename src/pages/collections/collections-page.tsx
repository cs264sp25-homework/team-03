import React, { useState } from 'react';
import { SelectableTabList } from '@/components/tabs/SelectableTabList';
import { Button } from '@/components/ui/button';
import { CreateGroupDialog } from '@/components/tabs/CreateGroupDialog';

export function CollectionsPage() {
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<chrome.tabs.Tab[]>([]);

  // Get tabs from Chrome
  React.useEffect(() => {
    chrome.runtime.sendMessage({type: "getTabs"}, (response) => {
      if (response?.tabs) {
        setTabs(response.tabs);
      }
    });
  }, []);

  const handleSelectAll = () => {
    setIsAllSelected(!isAllSelected);
  };

  const handleSelectionChange = (newSelectedTabs: chrome.tabs.Tab[]) => {
    setSelectedTabs(newSelectedTabs);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2">
        <Button
          variant={isAllSelected ? "secondary" : "default"}
          size="sm"
          onClick={handleSelectAll}
          className={!isAllSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
        >
          {isAllSelected ? 'Deselect All' : 'Select All'}
        </Button>
        <CreateGroupDialog 
          selectedTabs={selectedTabs}
          onSuccess={() => {
            // Optionally refresh the tabs list or perform other actions
          }}
        />
      </div>
      <div className="flex-1">
        <SelectableTabList 
          tabs={tabs}
          searchQuery=""
          selectAll={isAllSelected}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  );
} 