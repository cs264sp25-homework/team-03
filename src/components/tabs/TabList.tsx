import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TextPreviewModal } from "@/components/text-preview-modal";
import { FileText, RefreshCw } from "lucide-react";
import { useMutationTabs } from "@/hooks/use-mutation-tabs";
import { useQueryTabs } from "@/hooks/use-query-tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

//import { ChromeTab } from "@/types/tab";

interface TabListProps {
  tabs: chrome.tabs.Tab[];
  searchQuery: string;
}

const debug = import.meta.env.VITE_NODE_ENV === "development";

export function TabList({ tabs, searchQuery }: TabListProps) {
  const [selectedTab, setSelectedTab] = useState<chrome.tabs.Tab | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const { create } = useMutationTabs();
  const { findTabByUrl, isTabExtracted } = useQueryTabs();

  const filteredTabs = tabs.filter(tab => 
    tab.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tab.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExtractText = async (tab: chrome.tabs.Tab) => {
    if (!tab.url || !tab.id) return;
    
    setSelectedTab(tab);
    setIsLoading(true);
    setError(undefined);
    setExtractedText("");

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

      // First save the tab with its content
      const createArgs = {
        url: tab.url,
        name: tab.title,
        content: response.text
      };
      
      const tabId = await create(createArgs);

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
      <div className="flex-1 px-4 py-3 overflow-y-auto">
        <div className="space-y-3">
          {filteredTabs.map((tab) => {
            const isExtracted = tab.url ? isTabExtracted(tab.url) : false;
            const savedTab = tab.url ? findTabByUrl(tab.url) : null;
            
            return (
              <div
                key={tab.id}
                className="flex items-start gap-3 p-3 transition-colors border border-gray-600 rounded-lg dark:border-gray-700 bg-background hover:bg-muted"
              >
                <div 
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => chrome.tabs.update(tab.id!, { active: true })}
                >
                  <div className="flex items-start gap-3">
                    {tab.favIconUrl && (
                      <img
                        src={tab.favIconUrl}
                        alt=""
                        className="flex-shrink-0 w-4 h-4 mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate text-foreground">
                        {tab.title}
                      </h3>
                      <p className="text-xs truncate text-muted-foreground">
                        {tab.url}
                      </p>
                      {savedTab && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {savedTab.content ? 
                            `${savedTab.content.length.toLocaleString()} characters extracted` : 
                            'No content extracted'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-shrink-0"
                  onClick={() => handleExtractText(tab)}
                  disabled={isLoading}
                >
                  {isExtracted ? (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  ) : (
                    <FileText className="w-4 h-4 mr-1" />
                  )}
                  {isLoading ? "Extracting..." : isExtracted ? "Re-extract" : "Extract Text"}
                </Button>
              </div>
            );
          })}
          
          {filteredTabs.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? "No matching tabs found" : "No open tabs"}
            </div>
          )}
        </div>
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