import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextPreviewModal } from "@/components/text-preview-modal";
import { FileText, RefreshCw, Star } from "lucide-react";
import { useMutationTabs } from "@/hooks/use-mutation-tabs";
import { useQueryTabs } from "@/hooks/use-query-tabs";
import { useFavorites } from "@/hooks/useFavorites";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TabListProps {
  tabs: chrome.tabs.Tab[];
  searchQuery: string;
  showOnlyFavorites?: boolean;
}

const debug = import.meta.env.VITE_NODE_ENV === "development";

export function TabList({ tabs, searchQuery, showOnlyFavorites = false }: TabListProps) {
  const [selectedTab, setSelectedTab] = useState<chrome.tabs.Tab | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const { saveFromChrome } = useMutationTabs();
  const { findTabByUrl, isTabExtracted } = useQueryTabs();
  const { addFavorite, removeFavorite, isFavorite, isLoading: favoritesLoading } = useFavorites();

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
      const tabId = await saveFromChrome(tab, response.text);
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
  
  return (
    <div className={cn(debug && "border border-red-500")}>
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
              
              return (
                <div
                  key={tab.id}
                  className="flex items-start gap-3 p-4 transition-all duration-200 border border-gray-200 shadow-sm dark:border-gray-800 rounded-xl bg-background hover:bg-muted/50 hover:shadow-md"
                  >
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