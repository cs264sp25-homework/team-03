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
  const { data: tabGroups, loading } = useQueryTabGroups();
  const { addTab } = useMutationTabGroup();
  const { create: createTab } = useMutationTabs();

  const handleAddToGroup = async () => {
    if (!selectedGroupId) {
      toast.error("Please select a group");
      return;
    }

    setIsAdding(true);

    try {
      if (selectedTabs.length === 0) {
        throw new Error("No tabs selected");
      }

      // Create tabs
      const tabIds = await Promise.all(
        selectedTabs
          .filter(tab => tab.url)
          .map(tab => createTab({
            url: tab.url!,
            name: tab.title
          }))
      );

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
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      toast.error((error as Error).message || "Failed to add tabs to group");
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
          <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
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
                  <SelectItem key={group._id} value={group._id}>
                    {group.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
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