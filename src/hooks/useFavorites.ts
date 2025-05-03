import { api } from "../../convex/_generated/api";
import { useCallback, useEffect } from "react";
import { useSessionMutation, useSessionQuery } from "convex-helpers/react/sessions";
import { toast } from "sonner";
import { useUser } from "./useUser";

// Define a type for our favorite tab from Convex
export interface FavoriteTab {
  _id: string;
  userId: string;
  tabId: number;
  title: string;
  url: string;
  favIconUrl?: string;
}

/**
 * Hook to manage favorite tabs using Convex database
 */
export function useFavorites() {
  // Get user to ensure session is initialized
  const { userId, isAuthenticated, isInitializing } = useUser();
  
  // Only query favorites if user is authenticated
  const favorites = useSessionQuery(api.favorites.getAll, {});
  
  // Skip the query if not authenticated
  const isQueryEnabled = isAuthenticated;
  
  // Mutations
  const addFavoriteMutation = useSessionMutation(api.favorites.addFavorite);
  const removeFavoriteMutation = useSessionMutation(api.favorites.removeFavorite);
  
  // Add a tab to favorites
  const addFavorite = useCallback(async (tab: chrome.tabs.Tab) => {
    if (!tab.id || !tab.url) return false;
    
    try {
      await addFavoriteMutation({
        tabId: tab.id,
        url: tab.url,
        title: tab.title || "Untitled Tab",
        favIconUrl: tab.favIconUrl,
      });
      return true;
    } catch (error) {
      console.error("Error adding favorite:", error);
      toast.error("Failed to add favorite");
      return false;
    }
  }, [addFavoriteMutation]);
  
  // Remove a tab from favorites
  const removeFavorite = useCallback(async (tabId: number) => {
    try {
      const success = await removeFavoriteMutation({ tabId });
      return success;
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove favorite");
      return false;
    }
  }, [removeFavoriteMutation]);
  
  // Check if a tab is in favorites
  const isFavorite = useCallback((tabId: number) => {
    // Check in the favorites array if this tab is favorited
    if (!favorites) return false;
    return favorites.some(fav => fav.tabId === tabId);
  }, [favorites]);
  
  return {
    favorites: isQueryEnabled ? (favorites || []) : [],
    addFavorite,
    removeFavorite,
    isFavorite,
    isLoading: isInitializing || (isAuthenticated && favorites === undefined),
    isAuthenticated,
    userId
  };
}
