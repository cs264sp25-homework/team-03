import React, { useState } from 'react';
import { SelectableTabList } from '@/components/tabs/SelectableTabList';
import { Button } from '@/components/ui/button';
import { CreateGroupDialog } from '@/components/tabs/CreateGroupDialog';
import { AddToGroupDialog } from '@/components/tabs/AddToGroupDialog';

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

  const handleSelectAllChange = (isAllSelected: boolean) => {
    setIsAllSelected(isAllSelected);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-2">
          <Button
            variant={isAllSelected ? "secondary" : "default"}
            size="sm"
            onClick={handleSelectAll}
            className={!isAllSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
          >
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </Button>
          <div className="flex gap-2">
            <AddToGroupDialog 
              selectedTabs={selectedTabs}
              onSuccess={() => {
                // Optionally refresh the tabs list or perform other actions
              }}
            />
            <CreateGroupDialog 
              selectedTabs={selectedTabs}
              onSuccess={() => {
                // Optionally refresh the tabs list or perform other actions
              }}
            />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SelectableTabList 
          tabs={tabs}
          searchQuery=""
          selectAll={isAllSelected}
          onSelectionChange={handleSelectionChange}
          onSelectAllChange={handleSelectAllChange}
        />
      </div>
    </div>
  );
} 