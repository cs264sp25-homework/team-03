import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useMutationTabGroups, useMutationTabGroup } from '@/hooks/use-mutation-tabGroup';
import { useMutationTabs } from '@/hooks/use-mutation-tabs';
import { toast } from 'sonner';
import { Id } from 'convex/_generated/dataModel';

interface CreateGroupDialogProps {
  selectedTabs: chrome.tabs.Tab[];
  onSuccess?: () => void;
}

export function CreateGroupDialog({ selectedTabs, onSuccess }: CreateGroupDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { create: createTabGroup } = useMutationTabGroups();
  const { addTab } = useMutationTabGroup();
  const { create: createTab } = useMutationTabs();

  const extractTextFromTab = async (tab: chrome.tabs.Tab): Promise<string | null> => {
    if (!tab.url || !tab.id) return null;
    
    // Check for restricted URLs
    if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('devtools://')) {
      console.warn(`Cannot access restricted Chrome URL: ${tab.url}`);
      return null;
    }

    try {
      interface ExtractTextResponse {
        success: boolean;
        text?: string;
        error?: string;
      }

      const response = await new Promise<ExtractTextResponse>((resolve) => {
        chrome.runtime.sendMessage({ 
          type: 'extractText', 
          tabId: tab.id 
        }, resolve);
      });
      
      if (!response?.success || !response.text) {
        console.warn('Failed to extract text:', response?.error);
        return null;
      }

      return response.text;
    } catch (err) {
      console.error('Error extracting text:', err);
      return null;
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast("Group name is required");
      return;
    }

    setIsCreating(true);

    try {
      // Log selected tabs for debugging
      toast(`Selected ${selectedTabs.length} tabs: ${selectedTabs.map(t => t.title).join(', ')}`);

      // Create the tab group
      const tabGroupId = await createTabGroup(groupName, groupDescription);
      if (!tabGroupId) {
        throw new Error("Failed to create tab group");
      }

      if (selectedTabs.length === 0) {
        throw new Error("No tabs selected");
      }

      // Extract text and create tabs
      const tabPromises = selectedTabs
        .filter(tab => tab.url)
        .map(async tab => {
          const content = await extractTextFromTab(tab);
          return createTab({
            url: tab.url!,
            name: tab.title,
            content: content || undefined
          });
        });

      const tabIds = await Promise.all(tabPromises);

      if (tabIds.some(id => id === null)) {
        throw new Error("Failed to create some tabs");
      }

      // Add each tab to the group
      const addResults = await Promise.all(
        tabIds.filter((id): id is Id<"tabs"> => id !== null)
          .map(tabId => addTab(tabId, tabGroupId))
      );

      if (addResults.some(result => !result)) {
        throw new Error("Failed to add some tabs to the group");
      }

      // Reset form and close dialog
      setGroupName('');
      setGroupDescription('');
      setIsDialogOpen(false);
      toast("Tab group created successfully");
      onSuccess?.();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error((error as Error).message || "Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          size="sm"
          disabled={selectedTabs.length === 0}
        >
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Create New Tab Group
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">Group Name</Label>
            <Input
              id="name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <div>
            <Label htmlFor="description" className="text-gray-700 dark:text-gray-300">Description (Optional)</Label>
            <Textarea
              id="description"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder="Enter group description"
              className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>
          <Button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim()}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isCreating ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 