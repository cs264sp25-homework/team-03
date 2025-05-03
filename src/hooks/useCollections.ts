import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useSessionId } from "convex-helpers/react/sessions";

export interface Collection {
  id: string;
  name: string;
  tabs: chrome.tabs.Tab[];
  createdAt: Date;
}

export function useCollections() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useSessionId();
  
  // Convex mutations and queries
  const createTabGroup = useMutation(api.tabGroups.create);
  const deleteTabGroup = useMutation(api.tabGroups.remove);
  // Only query when sessionId is available
  const getAllTabGroups = useQuery(
    api.tabGroups.getAll, 
    sessionId ? { sessionId } : "skip" // Provide sessionId when it exists, 'skip' otherwise
  );
  const addTabToGroup = useMutation(api.tabGroups.addTabToGroup);
  const createTab = useMutation(api.tabs.create);

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
  
  // Effect to sync collections with Convex when backend data changes - only runs once
  useEffect(() => {
    // Only run this effect if we have a session and can query tab groups
    if (sessionId && getAllTabGroups) {
      console.log('Checking if collections need syncing with Convex backend');
      
      // Get collections from localStorage
      const localCollections = getCollections();
      
      // Check if we need to sync any collections to Convex
      if (localCollections.length > 0) {
        // Get the list of already synced collection IDs
        const syncedCollectionIds = JSON.parse(localStorage.getItem('syncedCollectionIds') || '[]') as string[];
        console.log('Already synced collection IDs:', syncedCollectionIds);
        
        // Create a map of existing Convex IDs for quick lookup
        const existingConvexIds = new Set(syncedCollectionIds);
        
        // Filter to only collections that haven't been synced yet
        // A collection needs syncing if:
        // 1. It doesn't have a Convex ID format (doesn't include '_')
        // 2. Its ID is not in the syncedCollectionIds list
        const collectionsToSync = localCollections.filter(collection => {
          // If the ID is already in our synced list, skip it
          if (existingConvexIds.has(collection.id)) {
            return false;
          }
          
          // If the ID looks like a Convex ID (contains '_'), add it to synced list and skip
          if (collection.id.includes('_')) {
            // Add to synced list so we don't check it again
            if (!existingConvexIds.has(collection.id)) {
              syncedCollectionIds.push(collection.id);
              existingConvexIds.add(collection.id);
            }
            return false;
          }
          
          // This collection needs syncing
          return true;
        });
        
        console.log(`Found ${collectionsToSync.length} collections that need syncing with Convex`);
        
        // Only proceed if there are collections to sync
        if (collectionsToSync.length > 0) {
          // For each collection that needs syncing, create it in Convex
          const syncPromises = collectionsToSync.map(async (collection) => {
            try {
              console.log('Creating collection in Convex:', collection.name);
              // Create the tab group in Convex
              const tabGroupId = await createTabGroup({
                sessionId,
                name: collection.name,
                description: `Collection created on ${new Date(collection.createdAt).toLocaleString()}`,
              });
              
              // Find the collection in the original array and update its ID
              const collectionToUpdate = localCollections.find(c => c.id === collection.id);
              if (collectionToUpdate) {
                collectionToUpdate.id = tabGroupId;
                
                // Add the new ID to our synced list
                syncedCollectionIds.push(tabGroupId);
                existingConvexIds.add(tabGroupId);
                
                console.log('Updated collection ID in localStorage:', tabGroupId);
                return true;
              }
              return false;
            } catch (err) {
              console.error('Error syncing collection to Convex:', err);
              return false;
            }
          });
          
          // Wait for all sync operations to complete
          Promise.all(syncPromises).then(results => {
            if (results.some(result => result)) {
              // Save the updated collections to localStorage only if changes were made
              saveCollections(localCollections);
            }
            
            // Always save the updated synced IDs list
            localStorage.setItem('syncedCollectionIds', JSON.stringify(Array.from(syncedCollectionIds)));
          });
        } else {
          // Save the updated synced IDs list even if we didn't sync anything new
          localStorage.setItem('syncedCollectionIds', JSON.stringify(Array.from(syncedCollectionIds)));
        }
      }
    }
  }, [sessionId, getAllTabGroups, createTabGroup]);

  const saveCollections = (collections: Collection[]): void => {
    try {
      localStorage.setItem("tabCollections", JSON.stringify(collections));
    } catch (err) {
      console.error("Error saving collections:", err);
      setError("Failed to save collections");
    }
  };

  // Helper function to extract text from a tab
  const extractTextFromTab = async (tab: chrome.tabs.Tab): Promise<{success: boolean, text?: string, metadata?: any}> => {
    if (!tab.url || !tab.id) {
      return { success: false };
    }
    
    // Check for restricted URLs (chrome://, chrome-extension://, etc.)
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('devtools://')) {
      return { success: false };
    }
    
    try {
      // Extract text using background script
      interface ExtractTextResponse {
        success: boolean;
        text?: string;
        error?: string;
        metadata?: {
          title: string;
          excerpt: string;
          siteName: string;
        };
      }

      // Extract text using background script
      const response = await new Promise<ExtractTextResponse>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'extractText', 
          tabId: tab.id 
        }, resolve);
      });
      
      return {
        success: response.success,
        text: response.text,
        metadata: response.metadata
      };
    } catch (error) {
      console.error('Error extracting text:', error);
      return { success: false };
    }
  };

  const createCollection = async (name: string, tabs: chrome.tabs.Tab[]): Promise<Collection> => {
    try {
      setIsLoading(true);
      setError(null);

      if (tabs.length === 0) {
        throw new Error("No tabs selected for collection");
      }
      
      if (!sessionId) {
        throw new Error("You must be logged in to create collections");
      }

      console.log("Creating tab group in Convex:", name);
      console.log("SessionId:", sessionId);
      
      // First create the tab group in Convex
      let tabGroupId;
      try {
        tabGroupId = await createTabGroup({
          sessionId,
          name,
          description: `Collection created on ${new Date().toLocaleString()}`,
        });
        console.log("Created tab group with ID:", tabGroupId);
      } catch (err) {
        console.error("Error creating tab group in Convex:", err);
        throw new Error("Failed to create tab group in Convex");
      }
      
      if (!tabGroupId) {
        throw new Error("Failed to get tab group ID from Convex");
      }
      
      // Create a new collection with the Convex ID
      const newCollection: Collection = {
        id: tabGroupId, // Use the Convex ID
        name,
        tabs,
        createdAt: new Date()
      };
      
      // Store tabs in Convex and extract text
      const tabPromises = tabs.map(async (tab) => {
        try {
          // First create the tab in the tabs table
          console.log("Creating tab in Convex:", tab.title);
          
          // Extract text from the tab in the background
          console.log("Extracting text from tab:", tab.title);
          const extractionResult = await extractTextFromTab(tab);
          const tabContent = extractionResult.success && extractionResult.text ? extractionResult.text : tab.title;
          
          // Create the tab with all required properties from the schema
          const tabId = await createTab({
            sessionId,
            url: tab.url || "",
            name: tab.title,
            content: tabContent, // Use extracted text if available, otherwise use title
          });
          
          console.log("Created tab with ID:", tabId);
          
          // Then add it to the group
          if (tabId) {
            console.log("Adding tab to group:", tabId, tabGroupId);
            await addTabToGroup({
              sessionId,
              tabId,
              tabGroupId,
            });
            console.log("Added tab to group successfully");
          }
          
          return tabId;
        } catch (err) {
          console.error("Error adding tab to Convex:", err);
          return null;
        }
      });
      
      // Wait for all tab creations to complete
      await Promise.all(tabPromises);

      // Get existing collections and add the new one
      const collections = getCollections();
      collections.push(newCollection);
      saveCollections(collections);
      
      // Add the new collection ID to our synced list
      const syncedCollectionIds = JSON.parse(localStorage.getItem('syncedCollectionIds') || '[]') as string[];
      // Only add if not already in the list
      if (!syncedCollectionIds.includes(newCollection.id)) {
        syncedCollectionIds.push(newCollection.id);
        localStorage.setItem('syncedCollectionIds', JSON.stringify(syncedCollectionIds));
        console.log('Added new collection ID to synced list:', newCollection.id);
      } else {
        console.log('Collection ID already in synced list:', newCollection.id);
      }

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
      
      // Also delete from Convex backend
      try {
        if (sessionId) {
          // The ID should be a Convex ID if it was created properly
          deleteTabGroup({ 
            sessionId,
            tabGroupId: id as unknown as Id<"tabGroups"> 
          });
        }
      } catch (err) {
        console.error("Error deleting collection from Convex:", err);
      }

      saveCollections(updatedCollections);
      
      // Remove the collection ID from the synced list
      const syncedCollectionIds = JSON.parse(localStorage.getItem('syncedCollectionIds') || '[]') as string[];
      const updatedSyncedIds = syncedCollectionIds.filter((syncedId: string) => syncedId !== id);
      localStorage.setItem('syncedCollectionIds', JSON.stringify(updatedSyncedIds));
      console.log('Removed collection ID from synced list:', id);
      
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
