import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";
import { useUser } from "@/hooks/useUser";
import { FileText, MessageSquare } from "lucide-react";
import { TabSearch } from "@/components/tabs/TabSearch";
import { useWindowChat } from '@/hooks/useWindowChat';
import { SelectableTabList } from "@/components/tabs/SelectableTabList";
import { Button } from "@/components/ui/button";
import { CreateGroupDialog } from "@/components/tabs/CreateGroupDialog";
import { AddToGroupDialog } from "@/components/tabs/AddToGroupDialog";
import { CollectionsPage } from "@/pages/collections/new-groups-page";
import { useFavorites } from "@/hooks/useFavorites";

declare global {
  interface Window {
    chrome: typeof chrome;
  }
}

function App() {
  const [hasStarted, setHasStarted] = useState(() => {
    return localStorage.getItem("hasStarted") === "true";
  });
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [selectedTabs, setSelectedTabs] = useState<chrome.tabs.Tab[]>([]);
  const { isFavorite } = useFavorites();

  const [activeView, setActiveView] = useState<'all' | 'favorites' | 'collections'>(() => {
    return (localStorage.getItem("activeView") as 'all' | 'favorites' | 'collections') || 'all';
  });

  // Update localStorage when activeView changes
  useEffect(() => {
    localStorage.setItem("activeView", activeView);
  }, [activeView]);

  const { userId } = useUser();
  const { windowChatId } = useWindowChat();
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

  // Update localStorage when hasStarted changes
  useEffect(() => {
    localStorage.setItem("hasStarted", hasStarted.toString());
  }, [hasStarted]);

  useEffect(() => {
    // Get current window ID
    chrome.windows.getCurrent((window) => {
      if (window.id !== undefined) {
        setCurrentWindowId(window.id);
      }
    });
  }, []);

  useEffect(() => {
    if (currentWindowId) {
      // Get window-specific state
      chrome.storage.local.get(['windowStates'], (result) => {
        const windowStates = result.windowStates || {};
        const windowState = windowStates[currentWindowId];
        
        if (windowState) {
          setActiveView(windowState.activeView);
        }
      });
    }
  }, [currentWindowId]);

  const updateTabs = useCallback(() => {
    chrome.runtime.sendMessage({type: "getTabs"}, (response) => {
      if (response?.tabs) {
        setTabs(response.tabs);
      }
    });
  }, []);

  useEffect(() => {
    // Initial load
    updateTabs();

    // Listen for tab changes
    chrome.tabs.onCreated.addListener(updateTabs);
    chrome.tabs.onRemoved.addListener(updateTabs);
    chrome.tabs.onUpdated.addListener(updateTabs);

    return () => {
      chrome.tabs.onCreated.removeListener(updateTabs);
      chrome.tabs.onRemoved.removeListener(updateTabs);
      chrome.tabs.onUpdated.removeListener(updateTabs);
    };
  }, [updateTabs]);

  // Filter tabs based on active view and search query
  const filteredTabs = useMemo(() => {
    let filtered = tabs;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tab => 
        tab.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tab.url?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by favorites if in favorites view
    if (activeView === 'favorites') {
      filtered = filtered.filter(tab => tab.id && isFavorite(tab.id));
    }
    
    return filtered;
  }, [tabs, searchQuery, activeView, isFavorite]);

  const handleSelectAll = () => {
    setIsAllSelected(!isAllSelected);
  };

  const handleSelectionChange = (newSelectedTabs: chrome.tabs.Tab[]) => {
    setSelectedTabs(newSelectedTabs);
  };

  const handleSelectAllChange = (isAllSelected: boolean) => {
    setIsAllSelected(isAllSelected);
  };

  if (!hasStarted) {
    return <StartPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <MainLayout 
      activeView={activeView} 
      onViewChange={setActiveView}
    >
      <div className="flex flex-col w-full h-full">
        {activeView === 'all' && (
          <div className="flex flex-col h-full relative">
            <div className="sticky top-0 z-10 bg-background">
              <div className="flex flex-col gap-2 p-4 border-b">
                <TabSearch 
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
                <div className="flex items-center justify-between">
                  <Button
                    variant={isAllSelected ? "secondary" : "default"}
                    size="sm"
                    onClick={handleSelectAll}
                    className={!isAllSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                  >
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                  <div className="flex items-center gap-2">
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
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <SelectableTabList 
                tabs={filteredTabs}
                searchQuery={searchQuery}
                selectAll={isAllSelected}
                onSelectionChange={handleSelectionChange}
                onSelectAllChange={handleSelectAllChange}
              />
            </div>
          </div>
        )}
        {activeView === 'favorites' && (
          <div className="flex flex-col h-full relative">
            <div className="sticky top-0 z-10 bg-background">
              <div className="flex flex-col gap-2 p-4 border-b">
                <TabSearch 
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />
                <div className="flex items-center justify-between">
                  <Button
                    variant={isAllSelected ? "secondary" : "default"}
                    size="sm"
                    onClick={handleSelectAll}
                    className={!isAllSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                  >
                    {isAllSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                  <div className="flex items-center gap-2">
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
            </div>
            <div className="flex-1 overflow-y-auto px-4">
              <SelectableTabList 
                tabs={filteredTabs}
                searchQuery={searchQuery}
                showOnlyFavorites={true}
                selectAll={isAllSelected}
                onSelectionChange={handleSelectionChange}
                onSelectAllChange={handleSelectAllChange}
              />
            </div>
          </div>
        )}
        {activeView === 'collections' && (
          <div className="flex flex-col h-full">
            <CollectionsPage />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default App;