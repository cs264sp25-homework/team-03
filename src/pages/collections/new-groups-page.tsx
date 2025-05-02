import { useState } from 'react';
import { Doc, Id } from "convex/_generated/dataModel";
import { CollectionCard } from '@/components/collections/CollectionCard';
import { CollectionDetails } from '@/components/collections/CollectionDetails';
import { toast } from 'sonner';
import { useQueryTabGroups } from '@/hooks/use-query-tabGroup';
import { useMutationTabGroup } from '@/hooks/use-mutation-tabGroup';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import MessagesPage from '@/pages/messages/messages-page';

export function CollectionsPage() {
  const { data: tabGroups, loading } = useQueryTabGroups();
  const { delete: deleteGroup } = useMutationTabGroup();
  const [viewingGroup, setViewingGroup] = useState<Doc<"tabGroups"> | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const handleDeleteGroup = async (id: Id<"tabGroups">) => {
    try {
      const success = await deleteGroup(id);
      if (success) {
        toast.success('Group deleted');
        if (viewingGroup && viewingGroup._id === id) {
          setViewingGroup(null);
        }
      }
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleSelectGroup = (group: Doc<"tabGroups">) => {
    setViewingGroup(group);
  };

  if (activeChatId) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 p-4 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveChatId(null)}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Groups
          </Button>
        </div>
        <div className="flex-1">
          <MessagesPage chatId={activeChatId} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {viewingGroup ? (
        <CollectionDetails
          group={viewingGroup}
          onBack={() => setViewingGroup(null)}
        />
      ) : (
        <>
          <h1 className="text-2xl font-bold p-4">Collections</h1>
          
          {loading ? (
            <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
              <p className="text-muted-foreground">Loading groups...</p>
            </div>
          ) : !tabGroups || tabGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-4 text-center">
              <p className="text-muted-foreground">No groups yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Select tabs and create a group from the All Tabs view
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {tabGroups.map(group => (
                <CollectionCard
                  key={group._id}
                  group={group}
                  onDelete={handleDeleteGroup}
                  onSelect={handleSelectGroup}
                  onChatClick={() => {
                    if (group.chatId) {
                      setActiveChatId(group.chatId);
                    } else {
                      toast.error("No chat associated with this group");
                    }
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}