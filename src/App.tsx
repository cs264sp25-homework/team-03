import { useCallback, useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StartPage } from "@/pages/start-page";
import { useUser } from "@/hooks/useUser";
//import { Button } from "@/components/ui/button";
//import { TextPreviewModal } from "@/components/text-preview-modal";
import { FileText } from "lucide-react";
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


  const [activeView, setActiveView] = useState<'all' | 'favorites' | 'collections'>(() => {
    return (localStorage.getItem("activeView") as 'all' | 'favorites' | 'collections') || 'all';
  });

  const [showChat, setShowChat] = useState(false);
  const [chatCollectionId, setChatCollectionId] = useState<string | null>(null);
  const [collectionChatId, setCollectionChatId] = useState<string | null>(null);

  const { userId } = useUser();
  const chat = useQueryUserChat();
  const { createDefaultChat, createCollectionChat } = useCreateChat();

  // Function to navigate to collections view
  const navigateToCollections = useCallback(() => {
    setActiveView('collections');
    setShowChat(false);
  }, []);

  // Function to navigate to chat with collection context
  const navigateToCollectionChat = useCallback(async (collectionId: string, collectionName: string) => {
    console.log('navigateToCollectionChat called with:', collectionId, collectionName);
    setChatCollectionId(collectionId);
    
    // Create or get existing chat for this collection
    console.log('Creating/getting collection chat...');
    const collectionChat = await createCollectionChat(collectionId, collectionName);
    console.log('Collection chat result:', collectionChat);
    
    if (collectionChat) {
      // Handle the chat ID safely with type assertion
      const chatId = (collectionChat as any)._id;
      console.log('Chat ID:', chatId);
      
      if (chatId) {
        setCollectionChatId(chatId);
        setShowChat(true);
        console.log('Chat view should now be visible');
      } else {
        console.error('No chat ID found in the collection chat object');
      }
    } else {
      console.error('Failed to create or get collection chat');
    }
  }, [createCollectionChat]);

  useEffect(() => {
    localStorage.setItem("hasStarted", hasStarted.toString());
  }, [hasStarted]);

  // Update localStorage when activeView changes
  useEffect(() => {
    localStorage.setItem("activeView", activeView);
  }, [activeView]);

  // Define handleCreateChat function
  const handleCreateChat = useCallback(async () => {
    try {
      await createDefaultChat();
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  }, [createDefaultChat]);

  // Auto-create chat when needed
  useEffect(() => {
    if (showChat && !chat && userId) {
      handleCreateChat();
    }
  }, [showChat, chat, userId, handleCreateChat]);







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
        // When changing views, reset the chat state
        setActiveView(view);
        setShowChat(false);
        setChatCollectionId(null);
        setCollectionChatId(null);
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
          // Show loading indicator while creating chat
          showChat && !chat && !collectionChatId ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                <p className="text-lg font-medium">Creating chat...</p>
              </div>
            </div>
          ) : 
          // Use collection-specific chat if available, otherwise use default chat
          (showChat && collectionChatId) ? (
            <MessagesPage 
              chatId={collectionChatId} 
              onBackToCollections={activeView === 'collections' ? navigateToCollections : undefined}
            />
          ) : (showChat && chat) ? (
            <MessagesPage 
              chatId={chat._id} 
              onBackToCollections={activeView === 'collections' ? navigateToCollections : undefined}
            />
          ) : (
            // Auto-create chat instead of showing creation view
            <div className="flex items-center justify-center h-full">
              <div className="animate-pulse">Creating chat...</div>
            </div>
          )
        ) : (
          <ChatPlaceholder />
        )}
      </div>
    </MainLayout>
  );
}

export default App;