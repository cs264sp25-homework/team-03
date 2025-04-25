import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { toast } from "sonner";

// Define types for our mutations
export type CreateTabType = {
  url: string;
  name?: string;
  content?: string;
};

export type UpdateTabType = {
  url?: string;
  name?: string;
  content?: string;
};

export function useMutationTabs() {
  const createMutation = useSessionMutation(api.tabs.create);
  const updateMutation = useSessionMutation(api.tabs.update);
  const removeMutation = useSessionMutation(api.tabs.remove);
  const getOneByUrlMutation = useSessionMutation(api.tabs.getOneByUrl);

  const createTab = async (tab: CreateTabType): Promise<Id<"tabs"> | null> => {
    try {
      const tabId = await createMutation({
        url: tab.url,
        name: tab.name,
        content: tab.content,
      });
      return tabId;
    } catch (error) {
      console.error("Error in createTab:", error);
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
  const saveFromChrome = async (chromeTab: chrome.tabs.Tab, content?: string): Promise<Id<"tabs"> | null> => {
    if (!chromeTab.url) {
      toast("Tab URL is required");
      return null;
    }

    // First check if tab exists
    const existingTab = await getOneByUrlMutation({ url: chromeTab.url });
    
    if (existingTab) {
      // Update existing tab
      const success = await updateTab(existingTab._id, {
        name: chromeTab.title,
        content
      });
      return success ? existingTab._id : null;
    }
    
    // Create new tab if it doesn't exist
    return await createTab({
      url: chromeTab.url,
      name: chromeTab.title,
      content
    });
  };

  // Helper function to save multiple Chrome tabs
  const saveMultipleFromChrome = async (chromeTabs: chrome.tabs.Tab[]): Promise<(Id<"tabs"> | null)[]> => {
    console.log("Saving multiple tabs:", chromeTabs.length);
    const results = await Promise.all(
      chromeTabs
        .filter(tab => tab.url)
        .map(async tab => {
          console.log("Saving tab:", tab.url);
          const result = await saveFromChrome(tab);
          console.log("Save result:", result);
          return result;
        })
    );
    console.log("All save results:", results);
    return results;
  };

  return {
    create: createTab,
    update: updateTab,
    remove: removeTab,
    saveFromChrome,
    saveMultipleFromChrome
  };
}
