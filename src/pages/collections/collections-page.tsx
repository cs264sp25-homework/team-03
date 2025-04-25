import { useEffect, useState } from 'react';
import { Collection, useCollections } from '@/hooks/useCollections';
import { CollectionCard } from '@/components/collections/CollectionCard';
import { CollectionDetails } from '@/components/collections/CollectionDetails';
import { toast } from 'sonner';

interface CollectionsPageProps {
  navigateToChat?: (collectionId: string) => void;
}

export function CollectionsPage({ navigateToChat }: CollectionsPageProps) {
  const { getCollections, deleteCollection } = useCollections();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [viewingCollection, setViewingCollection] = useState<Collection | null>(null);

  useEffect(() => {
    // Load collections when the component mounts
    setCollections(getCollections());
  }, []);

  const handleDeleteCollection = (id: string) => {
    const success = deleteCollection(id);
    if (success) {
      setCollections(getCollections());
      toast.success('Collection deleted');
      
      // If we're viewing the collection that was deleted, go back to the list
      if (viewingCollection && viewingCollection.id === id) {
        setViewingCollection(null);
      }
    } else {
      toast.error('Failed to delete collection');
    }
  };

  const handleSelectCollection = (collection: Collection) => {
    setSelectedCollection(collection);
    setViewingCollection(collection);
  };

  return (
    <div className="flex flex-col h-full">
      {viewingCollection ? (
        <CollectionDetails
          collection={viewingCollection}
          onBack={() => setViewingCollection(null)}
        />
      ) : (
        <>
          <h1 className="text-2xl font-bold p-4">Collections</h1>
          
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
              <p className="text-muted-foreground">No collections yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Select tabs and create a collection from the All Tabs view
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {collections.map(collection => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  onDelete={handleDeleteCollection}
                  onSelect={handleSelectCollection}
                  onChat={navigateToChat ? (collection) => {
                    // Store the collection tabs as context for the chat
                    chrome.runtime.sendMessage({
                      type: "setCollectionContext",
                      collectionId: collection.id,
                      tabs: collection.tabs
                    });
                    // Navigate to chat view
                    navigateToChat(collection.id);
                  } : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}