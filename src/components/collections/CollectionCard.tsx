import { Doc, Id } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Trash2, MessageSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { useQueryTabsInGroup } from "@/hooks/use-query-tabGroup";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useWindowChat } from '@/hooks/useWindowChat';
import { DeleteGroupDialog } from "./DeleteGroupDialog";

// Color palette for collection backgrounds
const colorPalettes = [
  { bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-100 dark:border-blue-900/50', hover: 'hover:bg-blue-100/50 dark:hover:bg-blue-900/30' },
  { bg: 'bg-green-50 dark:bg-green-950/40', border: 'border-green-100 dark:border-green-900/50', hover: 'hover:bg-green-100/50 dark:hover:bg-green-900/30' },
  { bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-100 dark:border-amber-900/50', hover: 'hover:bg-amber-100/50 dark:hover:bg-amber-900/30' },
  { bg: 'bg-purple-50 dark:bg-purple-950/40', border: 'border-purple-100 dark:border-purple-900/50', hover: 'hover:bg-purple-100/50 dark:hover:bg-purple-900/30' },
  { bg: 'bg-pink-50 dark:bg-pink-950/40', border: 'border-pink-100 dark:border-pink-900/50', hover: 'hover:bg-pink-100/50 dark:hover:bg-pink-900/30' },
  { bg: 'bg-indigo-50 dark:bg-indigo-950/40', border: 'border-indigo-100 dark:border-indigo-900/50', hover: 'hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30' },
  { bg: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-teal-100 dark:border-teal-900/50', hover: 'hover:bg-teal-100/50 dark:hover:bg-teal-900/30' },
  { bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-100 dark:border-rose-900/50', hover: 'hover:bg-rose-100/50 dark:hover:bg-rose-900/30' },
];

interface CollectionCardProps {
  group: Doc<"tabGroups">;
  onDelete: (id: Id<"tabGroups">) => Promise<void>;
  onSelect: (group: Doc<"tabGroups">) => void;
  onChatClick: () => void;
}

export function CollectionCard({ group, onDelete, onSelect, onChatClick }: CollectionCardProps) {
  const [isHovering, setIsHovering] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { data: tabs } = useQueryTabsInGroup(group._id);
  const { setChatForWindow } = useWindowChat();
  
  // Format the date
  const formattedDate = new Date(group._creationTime).toLocaleDateString();
  
  // Generate a consistent color palette based on group id
  const colorPalette = useMemo(() => {
    // Use the group id to generate a consistent index
    const colorIndex = group._id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % colorPalettes.length;
    return colorPalettes[colorIndex];
  }, [group._id]);
  
  const handleChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (group.chatId) {
      // First set the chat for the window
      setChatForWindow(group.chatId);
      // Then trigger the chat click handler
      onChatClick();
    } else {
      toast.error("No chat associated with this group");
    }
  };

  return (
    <>
      <div 
        className={`relative flex flex-col p-4 transition-all duration-200 border shadow-sm rounded-xl ${colorPalette.bg} ${colorPalette.border} ${colorPalette.hover} hover:shadow-md group cursor-pointer`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={() => onSelect(group)}
      >
        <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors mb-3 px-1">{group.name}</h3>
        <div className="grid grid-cols-2 gap-2 mb-3 overflow-hidden rounded-xl aspect-square w-28 h-28 mx-auto bg-white/80 dark:bg-gray-900/60 p-2 shadow-inner group-hover:shadow transition-all duration-300">
          {tabs?.slice(0, 4).map((tab, index) => (
            <div 
              key={tab._id}
              className={cn(
                "flex items-center justify-center rounded-lg overflow-hidden transition-transform duration-300 group-hover:scale-105",
                "bg-white/90 dark:bg-gray-800/90"
              )}
              style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
            >
              {tab.favIconUrl ? (
                <img
                  src={tab.favIconUrl}
                  alt=""
                  className="w-6 h-6 rounded-sm shadow-sm"
                />
              ) : (
                <div className="flex items-center justify-center w-6 h-6 rounded-sm bg-primary/10">
                  <FileText className="w-3 h-3 text-primary" />
                </div>
              )}
            </div>
          ))}
          {(!tabs || tabs.length === 0) && (
            <div className="col-span-2 flex items-center justify-center text-muted-foreground/50 text-xs">
              No tabs
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between px-1 mt-1">
          <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary/5 text-primary/90 dark:text-primary/80 rounded-full">{tabs?.length || 0} tabs</span>
          <span className="text-xs text-muted-foreground/70">{formattedDate}</span>
        </div>
        
        <div className="absolute top-3 right-3 flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChatClick();
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
          <Button
            variant="ghost"
            size="icon"
            className={`p-1.5 rounded-full bg-background/90 hover:bg-destructive/10 transition-all duration-200 ${isHovering ? 'opacity-100 scale-100' : 'opacity-0 scale-90'} shadow-sm`}
            onClick={(e) => {
              e.stopPropagation();
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <DeleteGroupDialog
        group={group}
        onDelete={onDelete}
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      />
    </>
  );
}