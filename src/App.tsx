import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";
import { useUser } from "@/hooks/useUser";
import { FileText, MessageSquare } from "lucide-react";
import { TabList } from "@/components/tabs/TabList";
import { TabSearch } from "@/components/tabs/TabSearch";
import { ChatPlaceholder } from "@/components/chat/ChatPlaceholder";
import { ChatCreationView } from "@/components/chat/ChatCreationView";
import { useQueryUserChat } from "@/hooks/use-query-user-chat";
import { useCreateChat } from "@/hooks/useCreateChat";
import MessagesPage from "@/pages/messages/messages-page";
import { TabGroupButton } from "@/components/TabGroupButton";
import { CollectionsPage } from "@/pages/collections/collections-page";
import { TabGroupsPage } from "@/pages/collections/tab-groups-page";
import { useWindowChat } from '@/hooks/useWindowChat';


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
  const [showChat, setShowChat] = useState(() => {
    return localStorage.getItem("showChat") === "true";
  });
  const [hasCreatedChat, setHasCreatedChat] = useState(false);

  const [activeView, setActiveView] = useState<'all' | 'favorites' | 'collections'>(() => {
    return (localStorage.getItem("activeView") as 'all' | 'favorites' | 'collections') || 'all';
  });

  const { userId } = useUser();
  const { windowChatId } = useWindowChat();
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

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

  const filteredTabs = useMemo(() => tabs.filter(tab => 
    tab.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.url?.toLowerCase().includes(searchQuery.toLowerCase())
  ), [tabs, searchQuery]);



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
            <TabSearch 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <TabGroupButton />
            <div className="flex-1 overflow-y-auto">
              <TabList 
                tabs={filteredTabs}
                searchQuery={searchQuery}
                showOnlyFavorites={false}
              />
            </div>
          </div>
        )}
        {activeView === 'favorites' && (
          <div className="flex flex-col h-full relative">
            <TabSearch 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            <div className="flex-1 overflow-y-auto">
              <TabList 
                tabs={filteredTabs}
                searchQuery={searchQuery}
                showOnlyFavorites={true}
              />
            </div>
          </div>
        )}
        {activeView === 'collections' && (
          <div className="flex flex-col h-full">
            <TabGroupsPage />
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default App;