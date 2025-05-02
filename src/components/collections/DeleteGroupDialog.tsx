import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { Doc, Id } from "convex/_generated/dataModel";

interface DeleteGroupDialogProps {
  group: Doc<"tabGroups">;
  onDelete: (id: Id<"tabGroups">) => Promise<void>;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteGroupDialog({ group, onDelete, isOpen, onOpenChange }: DeleteGroupDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-gray-900 dark:text-gray-100">
            Delete Collection
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete "{group.name}"? This action cannot be undone.
            All associated chats and messages will be permanently deleted.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex justify-between gap-4">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="border-gray-200 dark:border-gray-700"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => {
              onDelete(group._id);
              onOpenChange(false);
            }}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 