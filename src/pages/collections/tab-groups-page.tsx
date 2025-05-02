import React, { useState } from 'react';
import { useQueryTabGroups, useQueryTabsInGroup } from '@/hooks/use-query-tabGroup';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ExternalLink, Trash2, MessageSquare, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Id, Doc } from "convex/_generated/dataModel";
import { useMutationTabGroup } from '@/hooks/use-mutation-tabGroup';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWindowChat } from '@/hooks/useWindowChat';
import MessagesPage from '@/pages/messages/messages-page';

function GroupTabs({ groupId }: { groupId: string }) {
  const { data: tabs, loading } = useQueryTabsInGroup(groupId as Id<"tabGroups">);
  const { removeTab } = useMutationTabGroup();

  const handleRemoveTab = async (tabId: Id<"tabs">) => {
    try {
      const success = await removeTab(tabId, groupId as Id<"tabGroups">);
      if (success) {
        toast.success("Tab removed from group");
      }
    } catch (error) {
      toast.error("Failed to remove tab from group");
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading tabs...</div>;
  }

  if (!tabs || tabs.length === 0) {
    return <div className="text-sm text-muted-foreground">No tabs in this group</div>;
  }

  return (
    <div className="space-y-2">
      {tabs.map((tab) => (
        <div
          key={tab._id}
          className="flex items-start gap-3 p-3 transition-all duration-200 border border-gray-200 shadow-sm dark:border-gray-800 rounded-lg bg-background hover:bg-muted/50"
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium truncate">
              {tab.name}
            </h3>
            <p className="text-xs truncate text-muted-foreground mt-0.5">
              {tab.url}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-destructive/10 hover:text-destructive"
            onClick={() => handleRemoveTab(tab._id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

function OpenAllButton({ groupId }: { groupId: Id<"tabGroups"> }) {
  const { data: tabs } = useQueryTabsInGroup(groupId);
  const { data: group } = useQueryTabGroups();

  const handleOpenAllTabs = async () => {
    if (!tabs || tabs.length === 0) return;

    try {
      // Find the current group to get its chat ID
      const currentGroup = group?.find(g => g._id === groupId);
      if (!currentGroup?.chatId) {
        toast.error("No chat associated with this group");
        return;
      }

      // Create a new window with the first tab
      const firstTab = tabs[0];
      const window = await chrome.windows.create({
        url: firstTab.url,
        focused: true
      });

      if (window.id) {
        // Get existing window chats
        const result = await chrome.storage.local.get(['windowChats']);
        const windowChats = result.windowChats || {};

        // Set chat ID for the new window
        windowChats[window.id] = currentGroup.chatId;
        await chrome.storage.local.set({ windowChats });
      }
      
      // Open remaining tabs in the new window
      if (tabs.length > 1) {
        await Promise.all(
          tabs.slice(1).map(tab => 
            chrome.tabs.create({
              windowId: window.id,
              url: tab.url,
              active: false
            })
          )
        );
      }
    } catch (error) {
      toast.error("Failed to open tabs");
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hover:bg-primary/10"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenAllTabs();
            }}
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Open All</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function TabGroupsPage() {
  const { data: tabGroups, loading } = useQueryTabGroups();
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

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
      <h1 className="text-2xl font-bold p-4">Tab Groups</h1>
      <div className="flex-1 p-4">
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading groups...
          </div>
        ) : tabGroups.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No tab groups found
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4">
            {tabGroups.map((group) => (
              <AccordionItem
                key={group._id}
                value={group._id}
                className="border border-gray-200 dark:border-gray-800 rounded-lg"
              >
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{group.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-primary/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (group.chatId) {
                                  setActiveChatId(group.chatId);
                                } else {
                                  toast.error("No chat associated with this group");
                                }
                              }}
                            >
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Open Chat</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <OpenAllButton groupId={group._id} />
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                      {group.description}
                    </p>
                  )}
                  <GroupTabs groupId={group._id} />
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>
    </div>
  );
} 