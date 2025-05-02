import { useState } from "react";
import { useMutationTabs } from "./use-mutation-tabs";
import { useMutationTabGroups } from "./use-mutation-tabGroup";
import { Id } from "convex/_generated/dataModel";

export function useTabGroups() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { create: createTab } = useMutationTabs();
  const { create: createTabGroup } = useMutationTabGroups();

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

      // Create a new tab group in our database
      const groupId = await createTabGroup(name);
      if (!groupId) {
        throw new Error("Failed to create tab group");
      }

      // Create Chrome tab group
      const chromeGroupId = await chrome.tabs.group({ tabIds });
      
      // Update the Chrome group properties
      await chrome.tabGroups.update(chromeGroupId, {
        title: name,
        color: color as chrome.tabGroups.ColorEnum,
        collapsed: false,
      });

      // Save all tabs to our database with their favicons
      const savedTabIds = await Promise.all(
        tabs
          .filter(tab => tab.url)
          .map(async tab => {
            return createTab({
              url: tab.url!,
              name: tab.title,
              favIconUrl: tab.favIconUrl
            });
          })
      );

      return {
        chromeGroupId,
        groupId,
        tabCount: tabIds.length,
        savedTabIds
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