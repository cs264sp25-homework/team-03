import { useState } from "react";

export interface Collection {
  id: string;
  name: string;
  tabs: chrome.tabs.Tab[];
  createdAt: Date;
}

export function useCollections() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCollections = (): Collection[] => {
    try {
      const collectionsJson = localStorage.getItem("tabCollections");
      if (!collectionsJson) return [];
      
      return JSON.parse(collectionsJson);
    } catch (err) {
      console.error("Error loading collections:", err);
      return [];
    }
  };

  const saveCollections = (collections: Collection[]): void => {
    try {
      localStorage.setItem("tabCollections", JSON.stringify(collections));
    } catch (err) {
      console.error("Error saving collections:", err);
      setError("Failed to save collections");
    }
  };

  const createCollection = async (name: string, tabs: chrome.tabs.Tab[]): Promise<Collection> => {
    try {
      setIsLoading(true);
      setError(null);

      if (tabs.length === 0) {
        throw new Error("No tabs selected for collection");
      }

      // Create a new collection with a simple ID generation
      const newCollection: Collection = {
        id: `collection_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name,
        tabs,
        createdAt: new Date()
      };

      // Get existing collections and add the new one
      const collections = getCollections();
      collections.push(newCollection);
      saveCollections(collections);

      return newCollection;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create collection");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCollection = (id: string): boolean => {
    try {
      setIsLoading(true);
      setError(null);

      const collections = getCollections();
      const updatedCollections = collections.filter(collection => collection.id !== id);
      
      if (collections.length === updatedCollections.length) {
        throw new Error("Collection not found");
      }

      saveCollections(updatedCollections);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete collection");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const addTabsToCollection = (collectionId: string, tabsToAdd: chrome.tabs.Tab[]): boolean => {
    try {
      setIsLoading(true);
      setError(null);

      if (tabsToAdd.length === 0) {
        throw new Error("No tabs selected to add");
      }

      const collections = getCollections();
      const collectionIndex = collections.findIndex(collection => collection.id === collectionId);
      
      if (collectionIndex === -1) {
        throw new Error("Collection not found");
      }

      // Filter out tabs that are already in the collection (based on URL)
      const existingUrls = new Set(collections[collectionIndex].tabs.map(tab => tab.url));
      const newTabs = tabsToAdd.filter(tab => !existingUrls.has(tab.url));

      // Add new tabs to the collection
      collections[collectionIndex].tabs = [...collections[collectionIndex].tabs, ...newTabs];
      
      saveCollections(collections);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add tabs to collection");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getCollections,
    createCollection,
    deleteCollection,
    addTabsToCollection,
    isLoading,
    error,
  };
}
