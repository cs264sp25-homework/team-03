import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { toast } from "sonner";

// Define types for our mutations
export type CreateTabType = {
  url: string;
  name?: string;
  content?: string;
  groupId?: Id<"tabGroups">;
};

export type UpdateTabType = {
  url?: string;
  name?: string;
  content?: string;
  groupId?: Id<"tabGroups">;
};

export function useMutationTabs() {
  const createMutation = useSessionMutation(api.tabs.create);
  const updateMutation = useSessionMutation(api.tabs.update);
  const removeMutation = useSessionMutation(api.tabs.remove);

  const createTab = async (tab: CreateTabType): Promise<Id<"tabs"> | null> => {
    try {
     
      const tabId = await createMutation({
        url: tab.url,
        name: tab.name,
        content: tab.content,
        groupId: tab.groupId
      });
      return tabId;
    } catch (error) {
      console.error("Error in createTab:", error); // Debug log
      toast((error as Error).message || "Failed to create tab");
      return null;
    }
  };

  const updateTab = async (tabId: Id<"tabs">, updates: UpdateTabType): Promise<boolean> => {
    try {
      await updateMutation({
        tabId,
        ...updates
      });
      return true;
    } catch (error) {
      toast((error as Error).message || "Failed to update tab");
      return false;
    }
  };

  const removeTab = async (tabId: Id<"tabs">): Promise<boolean> => {
    try {
      await removeMutation({ tabId });
      return true;
    } catch (error) {
      toast((error as Error).message || "Failed to remove tab");
      return false;
    }
  };

  // Helper function to save a Chrome tab
  const saveFromChrome = async (chromeTab: chrome.tabs.Tab, groupId?: Id<"tabGroups">): Promise<Id<"tabs"> | null> => {
    if (!chromeTab.url) {
      toast("Tab URL is required");
      return null;
    }
    
    return await createTab({
      url: chromeTab.url,
      name: chromeTab.title,
      groupId
    });
  };

  // Helper function to save multiple Chrome tabs
  const saveMultipleFromChrome = async (chromeTabs: chrome.tabs.Tab[], groupId?: Id<"tabGroups">): Promise<(Id<"tabs"> | null)[]> => {
    return await Promise.all(
      chromeTabs
        .filter(tab => tab.url)
        .map(tab => saveFromChrome(tab, groupId))
    );
  };

  return {
    create: createTab,
    update: updateTab,
    remove: removeTab,
    saveFromChrome,
    saveMultipleFromChrome
  };
}
