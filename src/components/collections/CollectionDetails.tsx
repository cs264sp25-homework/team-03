import { Collection } from "@/hooks/useCollections";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink } from "lucide-react";

interface CollectionDetailsProps {
  collection: Collection;
  onBack: () => void;
}

export function CollectionDetails({ collection, onBack }: CollectionDetailsProps) {
  const handleOpenTab = (url: string | undefined) => {
    if (url) {
      chrome.tabs.create({ url });
    }
  };

  const handleOpenAllTabs = () => {
    collection.tabs.forEach(tab => {
      if (tab.url) {
        chrome.tabs.create({ url: tab.url });
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-bold">{collection.name}</h1>
          <p className="text-sm text-muted-foreground">{collection.tabs.length} tabs</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onBack} className="hover:bg-gray-100 dark:hover:bg-gray-800">
            Back
          </Button>
          <Button onClick={handleOpenAllTabs}>
            Open All Tabs
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {collection.tabs.map((tab) => (
            <div
              key={tab.id}
              className="flex items-start gap-3 p-4 transition-all duration-200 border border-gray-200 shadow-sm dark:border-gray-800 rounded-xl bg-background hover:bg-muted/50 hover:shadow-md"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenTab(tab.url)}>
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
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 rounded-full"
                onClick={() => handleOpenTab(tab.url)}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
