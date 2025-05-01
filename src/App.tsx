import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";
import { useUser } from "@/hooks/useUser";
//import { Button } from "@/components/ui/button";
//import { TextPreviewModal } from "@/components/text-preview-modal";
import { FileText, MessageSquare } from "lucide-react";
import { SelectableTabList } from "@/components/tabs/SelectableTabList";
import { TabSearch } from "@/components/tabs/TabSearch";
import { ChatPlaceholder } from "@/components/chat/ChatPlaceholder";
import { ChatCreationView } from "@/components/chat/ChatCreationView";
import { useQueryUserChat } from "@/hooks/use-query-user-chat";
import { useCreateChat } from "@/hooks/useCreateChat";
import MessagesPage from "@/pages/messages/messages-page";
import { CollectionsPage } from "@/pages/collections/collections-page";


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
  const [chatCollectionId, setChatCollectionId] = useState<string | null>(null);
  const [collectionChatId, setCollectionChatId] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<'all' | 'favorites' | 'collections'>(() => {
    return (localStorage.getItem("activeView") as 'all' | 'favorites' | 'collections') || 'all';
  });

  // Function to navigate to collections view
  const navigateToCollections = useCallback(() => {
    setActiveView('collections');
    setShowChat(false);
  }, []);

  // Function to navigate to chat with collection context
  const navigateToCollectionChat = useCallback((collectionId: string) => {
    setShowChat(true);
  }, []);

  const { userId } = useUser();

  useEffect(() => {
    localStorage.setItem("hasStarted", hasStarted.toString());
  }, [hasStarted]);

  // Update localStorage when showChat changes
  useEffect(() => {
    localStorage.setItem("showChat", showChat.toString());
  }, [showChat]);
  
  // Update localStorage when activeView changes
  useEffect(() => {
    localStorage.setItem("activeView", activeView);
  }, [activeView]);

  const chat = useQueryUserChat();
  const { createDefaultChat } = useCreateChat();

  // Handle selection data and navigation
  useEffect(() => {
    const handleMessage = (message: any) => {
      console.log('App received message:', message);
      if (message.type === "selection") {
        console.log('App handling selection, navigating to chat');
        setShowChat(true);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

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

  const handleCreateChat = async () => {
    try {
      await createDefaultChat();
      setHasCreatedChat(true);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  

  // Add logging for tab changes
  /*useEffect(() => {
   
    
    const handleTabRemoved = (tabId: number, removeInfo: chrome.tabs.TabRemoveInfo) => {
      console.log('Tab removed in App:', tabId, removeInfo);
    };

    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    return () => {
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
    };
  }, []);
*/

  if (!hasStarted) {
    return <StartPage onStart={() => setHasStarted(true)} />;
  }

  return (
    <MainLayout 
      activeView={activeView} 
      onViewChange={(view) => {
        setActiveView(view);
        setShowChat(false); // Switch to tabs view when vertical navigation changes
      }}
    >
      <div className="flex flex-col w-full h-full">
        {!showChat ? (
          <div className="flex flex-col h-full relative">
            
            {activeView !== 'collections' && (
              <TabSearch 
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
              />
            )}
            <div className="flex-1 overflow-y-auto">
              {activeView === 'collections' ? (
                <CollectionsPage navigateToChat={navigateToCollectionChat} />
              ) : activeView === 'all' ? (
                <SelectableTabList
                  tabs={filteredTabs}
                  searchQuery={searchQuery}
                  showOnlyFavorites={false}
                  showSearchBar={true}
                />
              ) : (
                <SelectableTabList 
                  tabs={filteredTabs}
                  searchQuery={searchQuery}
                  showOnlyFavorites={activeView === 'favorites'}
                  showSearchBar={true}
                />
              )}
            </div>
          </div>
        ) : userId ? (
          chat ? (
            <MessagesPage 
              chatId={chat._id} 
              onBackToCollections={activeView === 'collections' ? navigateToCollections : undefined}
            />
          ) : (
            <ChatCreationView onCreateChat={handleCreateChat} />
          )
        ) : (
          <ChatPlaceholder />
        )}
      </div>
    </MainLayout>
  );
}

export default App;