import { useState } from "react";

export function useTabGroups() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGroupWithAllTabs = async (name: string, color?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get all current tabs in the current window
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const tabIds = tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);

      if (tabIds.length === 0) {
        throw new Error("No tabs found to group");
      }

      // Create a new tab group
      const groupId = await chrome.tabs.group({ tabIds });
      
      // Update the group properties
      await chrome.tabGroups.update(groupId, {
        title: name,
        color: color as chrome.tabGroups.ColorEnum,
        collapsed: false,
      });

      return {
        chromeGroupId: groupId,
        tabCount: tabIds.length,
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tab group");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createGroupWithAllTabs,
    isLoading,
    error,
  };
} 