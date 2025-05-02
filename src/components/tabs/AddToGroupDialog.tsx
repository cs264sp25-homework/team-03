import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQueryTabGroups } from "@/hooks/use-query-tabGroup";
import { useMutationTabGroup } from "@/hooks/use-mutation-tabGroup";
import { useMutationTabs } from "@/hooks/use-mutation-tabs";
import { toast } from "sonner";
import { useState } from "react";
import { Id } from "convex/_generated/dataModel";

interface AddToGroupDialogProps {
  selectedTabs: chrome.tabs.Tab[];
  onSuccess?: () => void;
}

export function AddToGroupDialog({ selectedTabs, onSuccess }: AddToGroupDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { data: tabGroups, loading } = useQueryTabGroups();
  const { addTab } = useMutationTabGroup();
  const { create: createTab, saveFromChrome } = useMutationTabs();

  const extractTextFromTab = async (tab: chrome.tabs.Tab): Promise<string | null> => {
    if (!tab.url || !tab.id) return null;
    
    // Check for restricted URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('devtools://')) {
      console.warn(`Cannot access restricted Chrome URL: ${tab.url}`);
      return null;
    }

    try {
      interface ExtractTextResponse {
        success: boolean;
        text?: string;
        error?: string;
      }

      const response = await new Promise<ExtractTextResponse>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'extractText', 
          tabId: tab.id 
        }, resolve);
      });
      
      if (!response?.success || !response.text) {
        console.warn('Failed to extract text:', response?.error);
        return null;
      }

      return response.text;
    } catch (err) {
      console.error('Error extracting text:', err);
      return null;
    }
  };

  const handleAddToGroup = async () => {
    if (!selectedGroupId) {
      setError("Please select a group");
      return;
    }

    setIsAdding(true);
    setError(null);

    try {
      if (selectedTabs.length === 0) {
        throw new Error("No tabs selected");
      }

      // Extract text and create tabs
      const tabPromises = selectedTabs
        .filter(tab => tab.url)
        .map(async tab => {
          const content = await extractTextFromTab(tab);
          return createTab({
            url: tab.url!,
            name: tab.title,
            content: content || undefined
          });
        });

      const tabIds = await Promise.all(tabPromises);

      if (tabIds.some(id => id === null)) {
        throw new Error("Failed to create some tabs");
      }

      // Add each tab to the group
      const addResults = await Promise.all(
        tabIds.filter((id): id is Id<"tabs"> => id !== null)
          .map(tabId => addTab(tabId, selectedGroupId as Id<"tabGroups">))
      );

      if (addResults.some(result => !result)) {
        throw new Error("Failed to add some tabs to the group");
      }

      toast.success("Tabs added to group successfully");
      await Promise.all([
        setSelectedGroupId(""),
        setOpen(false)
      ]);
      onSuccess?.();
    } catch (error) {
      console.error("Error adding tabs to group:", error);
      const errorMessage = (error as Error).message;
      if (errorMessage.includes("Tab with this URL already in group")) {
        setError("One or more tabs are already in this group");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          disabled={selectedTabs.length === 0}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Add To
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Add to Group
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedGroupId} onValueChange={(value) => {
            setSelectedGroupId(value);
            setError(null);
          }}>
            <SelectTrigger className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
              {loading ? (
                <SelectItem value="loading" disabled>
                  Loading groups...
                </SelectItem>
              ) : tabGroups.length === 0 ? (
                <SelectItem value="empty" disabled>
                  No groups available
                </SelectItem>
              ) : (
                tabGroups.map((group) => (
                  <SelectItem 
                    key={group._id} 
                    value={group._id}
                    className="cursor-pointer data-[highlighted]:bg-primary/10 data-[highlighted]:text-primary data-[state=checked]:bg-primary/20 data-[state=checked]:text-primary"
                  >
                    {group.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {error && (
            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
          <div className="flex justify-end">
            <Button
              onClick={handleAddToGroup}
              disabled={!selectedGroupId || isAdding}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isAdding ? "Adding..." : "Add to Group"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 