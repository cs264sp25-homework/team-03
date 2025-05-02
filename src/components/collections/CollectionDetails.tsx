import { Doc } from "convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { FileText, ExternalLink, Trash2 } from "lucide-react";
import { useQueryTabsInGroup } from "@/hooks/use-query-tabGroup";
import { useMutationTabGroup } from "@/hooks/use-mutation-tabGroup";
import { toast } from "sonner";

interface CollectionDetailsProps {
  group: Doc<"tabGroups">;
  onBack: () => void;
}

export function CollectionDetails({ group, onBack }: CollectionDetailsProps) {
  const { data: tabs } = useQueryTabsInGroup(group._id);
  const { removeTab } = useMutationTabGroup();

  const handleOpenTab = (url: string | undefined) => {
    if (url) {
      chrome.tabs.create({ url });
    }
  };

  const handleOpenAllTabs = () => {
    tabs?.forEach(tab => {
      if (tab.url) {
        chrome.tabs.create({ url: tab.url });
      }
    });
  };

  const handleDeleteTab = async (tabId: string) => {
    const success = await removeTab(tabId as any, group._id);
    if (success) {
      toast.success("Tab removed from collection");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-xl font-bold">{group.name}</h1>
          <p className="text-sm text-muted-foreground">{tabs?.length || 0} tabs</p>
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
          {tabs?.map((tab) => (
            <div
              key={tab._id}
              className="flex items-start gap-3 p-4 transition-all duration-200 border border-gray-200 shadow-sm dark:border-gray-800 rounded-xl bg-background hover:bg-muted/50 hover:shadow-md"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => handleOpenTab(tab.url)}>
                <div className="flex items-center justify-center flex-shrink-0 w-5 h-5 mt-1 rounded-sm bg-primary/10">
                  <FileText className="w-3 h-3 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium truncate transition-colors text-foreground group-hover:text-primary">
                    {tab.name}
                  </h3>
                  <p className="text-xs truncate text-muted-foreground mt-0.5">
                    {tab.url}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0 rounded-full hover:bg-destructive/10"
                onClick={() => handleDeleteTab(tab._id)}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}