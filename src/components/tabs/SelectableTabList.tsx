import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextPreviewModal } from "@/components/text-preview-modal";
import { Check, FileText, FolderPlus, RefreshCw, Star } from "lucide-react";
import { useMutationTabs } from "@/hooks/use-mutation-tabs";
import { useQueryTabs } from "@/hooks/use-query-tabs";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
// Implement a simplified version of the collections functionality directly
interface Collection {
  id: string;
  name: string;
  tabs: chrome.tabs.Tab[];
  createdAt: Date;
}

interface SelectableTabListProps {
  tabs: chrome.tabs.Tab[];
  searchQuery: string;
  showOnlyFavorites?: boolean;
  showSearchBar?: boolean;
}

const debug = import.meta.env.VITE_NODE_ENV === "development";

export function SelectableTabList({ tabs, searchQuery, showOnlyFavorites = false, showSearchBar = true }: SelectableTabListProps) {
  const [selectedTab, setSelectedTab] = useState<chrome.tabs.Tab | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const { saveFromChrome } = useMutationTabs();
  const { findTabByUrl, isTabExtracted } = useQueryTabs();
  const { addFavorite, removeFavorite, isFavorite, isLoading: favoritesLoading } = useFavorites();
  const [collectionLoading, setCollectionLoading] = useState(false);
  
  // State for selected tabs
  const [selectedTabs, setSelectedTabs] = useState<chrome.tabs.Tab[]>([]);
  const [collectionName, setCollectionName] = useState("");
  const [showCollectionInput, setShowCollectionInput] = useState(false);

  const filteredTabs = tabs.filter(tab => {
    // First filter by search query
    const matchesSearch = 
      tab.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tab.url?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Then filter by favorites if needed
    if (showOnlyFavorites) {
      return matchesSearch && tab.id && isFavorite(tab.id);
    }
    
    return matchesSearch;
  });

  const handleExtractText = async (tab: chrome.tabs.Tab) => {
    if (!tab.url || !tab.id) return;
    
    setSelectedTab(tab);
    setIsLoading(true);
    setError(undefined);
    setExtractedText("");

    // Check for restricted URLs (chrome://, chrome-extension://, etc.)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('devtools://')) {
      setIsLoading(false);
      setError(`Cannot access restricted Chrome URLs (${tab.url.split('/')[0]}//)`); 
      return;
    }

    try {
      interface ExtractTextResponse {
        success: boolean;
        text?: string;
        error?: string;
        metadata?: {
          title: string;
          excerpt: string;
          siteName: string;
        };
      }

      // Extract text using background script
      const response = await new Promise<ExtractTextResponse>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'extractText', 
          tabId: tab.id 
        }, resolve);
      });
      
      if (!response?.success) {
        throw new Error(response?.error || 'Failed to extract text');
      }
      
      if (!response.text) {
        throw new Error('No text extracted');
      }

      // Save the tab with its content
      const tabId = await saveFromChrome(tab, undefined, response.text);
      if (!tabId) {
        toast.error("Failed to save tab to database");
      } else {
        const existingTab = findTabByUrl(tab.url);
        const action = existingTab ? "re-extracted" : "extracted";
        toast.success(`Tab ${action} successfully`);
      }
      
      // Then update the UI
      setExtractedText(response.text);

    } catch (err) {
      console.error('Error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to extract text. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTabSelection = (tab: chrome.tabs.Tab) => {
    if (selectedTabs.some(t => t.id === tab.id)) {
      setSelectedTabs(selectedTabs.filter(t => t.id !== tab.id));
    } else {
      setSelectedTabs([...selectedTabs, tab]);
    }
  };

  const handleCreateCollection = async () => {
    if (selectedTabs.length === 0 || !collectionName.trim()) return;
    
    try {
      setCollectionLoading(true);
      
      // Create a new collection
      const newCollection: Collection = {
        id: `collection_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: collectionName.trim(),
        tabs: selectedTabs,
        createdAt: new Date()
      };
      
      // Get existing collections and add the new one
      const collectionsJson = localStorage.getItem("tabCollections");
      const collections = collectionsJson ? JSON.parse(collectionsJson) : [];
      collections.push(newCollection);
      localStorage.setItem("tabCollections", JSON.stringify(collections));
      
      toast.success(`Collection "${collectionName}" created with ${selectedTabs.length} tabs`);
      setSelectedTabs([]);
      setCollectionName("");
      setShowCollectionInput(false);
    } catch (err) {
      toast.error("Failed to create collection");
      console.error("Failed to create collection:", err);
    } finally {
      setCollectionLoading(false);
    }
  };
  
  return (
    <div className={cn(debug && "border border-red-500")}>
      {/* Collection selection UI */}
      <div className="sticky top-0 z-20 bg-background">
        {selectedTabs.length > 0 && (
          <div className="flex flex-col">
          <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
            <div className="px-4 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 text-primary">
                    <span className="text-xs font-semibold">{selectedTabs.length}</span>
                  </div>
                  <span className="text-sm font-medium leading-tight">Tabs selected</span>
                </div>
                <div className="flex items-center gap-2">
                  {showCollectionInput ? (
                    <div className="flex items-center gap-1 bg-background dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                      <input
                        type="text"
                        value={collectionName}
                        onChange={(e) => setCollectionName(e.target.value)}
                        placeholder="Collection name"
                        className="w-32 px-3 py-1.5 text-sm border-0 bg-background dark:bg-gray-800 text-foreground dark:text-gray-200 focus:outline-none focus:ring-0 placeholder-gray-400 dark:placeholder-gray-500"
                        autoFocus
                      />
                      <Button 
                        size="sm" 
                        onClick={handleCreateCollection}
                        disabled={collectionLoading || !collectionName.trim()}
                        className="bg-primary hover:bg-primary/90 h-8 px-3 rounded-none"
                      >
                        <span className="text-xs">Create</span>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setShowCollectionInput(false)}
                        className="text-muted-foreground h-8 w-8 p-0 rounded-none"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => setShowCollectionInput(true)}
                      className="flex items-center gap-1 bg-primary hover:bg-primary/90 h-8 px-3 rounded-xl"
                    >
                      <span className="text-xs">Create Collection</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
      </div>

      {/* Tab list */}
      {showSearchBar && (
        <div className="px-4 py-3">
          {favoritesLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              Loading tabs...
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTabs.map((tab) => {
              const isExtracted = tab.url ? isTabExtracted(tab.url) : false;
              const savedTab = tab.url ? findTabByUrl(tab.url) : null;
              const isSelected = selectedTabs.some(t => t.id === tab.id);
              
              return (
                <div
                  key={tab.id}
                  className={`flex items-start gap-3 p-4 transition-all duration-200 border shadow-sm rounded-xl bg-background hover:bg-muted/50 hover:shadow-md ${isSelected ? 'border-primary' : 'border-gray-200 dark:border-gray-800'}`}
                >
                  <div 
                    className="flex-shrink-0 cursor-pointer flex items-center justify-center self-center h-full"
                    onClick={() => toggleTabSelection(tab)}
                  >
                    <div className={`flex items-center justify-center w-5 h-5 rounded-md border ${isSelected ? 'bg-primary border-primary' : 'border-gray-300 dark:border-gray-600'}`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                  </div>
                  <div 
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => chrome.tabs.update(tab.id!, { active: true })}
                  >
                    <div className="flex items-start gap-3">
                    {tab.favIconUrl ? (
                      <img
                        src={tab.favIconUrl}
                        alt=""
                        className="flex-shrink-0 w-5 h-5 mt-1 rounded-sm shadow-sm"
                      />
                    ) : (
                      <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 mt-1 rounded-sm bg-primary/10">
                        <FileText className="w-3 h-3 text-primary" />
                      </div>
                    )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium truncate transition-colors text-foreground group-hover:text-primary">
                          {tab.title}
                        </h3>
                        <p className="text-xs truncate text-muted-foreground mt-0.5">
                        {tab.url}
                        </p>
                        {savedTab && (
                          <p className="mt-1.5 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-block">
                            {savedTab.content ? 
                              `${savedTab.content.length.toLocaleString()} characters extracted` : 
                              'No content extracted'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start flex-shrink-0 gap-2 mt-1">
                  <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-shrink-0 rounded-full transition-colors ${tab.id && isFavorite(tab.id) ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'hover:bg-yellow-100 dark:hover:bg-yellow-900/30'}`}
                      onClick={async () => {
                        if (tab.id) {
                          if (isFavorite(tab.id)) {
                            const success = await removeFavorite(tab.id);
                            if (success) {
                              toast.success("Removed from favorites");
                            }
                          } else {
                            const success = await addFavorite(tab);
                            if (success) {
                              toast.success("Added to favorites");
                            }
                          }
                        }
                      }}
                      disabled={favoritesLoading}
                    >
                      <Star className={`w-4 h-4 ${tab.id && isFavorite(tab.id) ? 'fill-yellow-400 text-yellow-400' : 'hover:text-yellow-600 dark:hover:text-yellow-400'}`} />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex-shrink-0 rounded-full transition-colors ${isExtracted ? 'bg-primary/10' : 'hover:bg-primary/10'}`}
                      onClick={() => handleExtractText(tab)}
                      disabled={isLoading}
                    >
                      {isExtracted ? (
                        <RefreshCw className="w-4 h-4 mr-1 text-primary" />
                    ) : (
                        <FileText className="w-4 h-4 mr-1 text-primary" />
                      )}
                      <span className="text-xs font-medium">
                        {isLoading ? "Extracting..." : isExtracted ? "Re-extract" : "Extract Text"}
                      </span>
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {!favoritesLoading && filteredTabs.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                {searchQuery ? "No matching tabs found" : "No favorite tabs"}
              </div>
            )}
            </div>
          )}
        </div>
      )}

      <TextPreviewModal
        isOpen={!!selectedTab}
        onClose={() => setSelectedTab(null)}
        text={extractedText}
        url={selectedTab?.url || ""}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
}