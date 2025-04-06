import { Button } from "@/components/ui/button";
import { Edit, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Id } from "convex/_generated/dataModel";
import { useMutationMessage } from "@/hooks/use-mutation-message";
import { useState } from "react";
import { AutosizeTextarea } from "@/components/ui/autoresize-textarea";

const DEBUG = false;

interface ChatProps {
  _id: Id<"chats">;
  title: string;
  description?: string;
  messageCount: number;
  tabCount: number;
  groupId?: string;
  onSelect: (id: Id<"chats">) => void;
  onEdit?: (id: Id<"chats">) => void;
}

export function Chat({
  _id,
  title,
  description,
  messageCount,
  tabCount,
  groupId,
  onSelect,
  onEdit,
}: ChatProps) {
  const [messageContent, setMessageContent] = useState("");
  const { edit } = useMutationMessage(_id);

  const handleSendMessage = async () => {
    if (messageContent.trim()) {
      await edit({ content: messageContent, role: "user" });
      setMessageContent("");
    }
  };

  return (
    <div className="w-full">
      <AspectRatio
        ratio={16 / 9}
        className={cn("w-full border rounded-xl p-2", "hover:bg-secondary", {
          "border-2 border-red-500": DEBUG,
        })}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-center gap-1">
              <div
                className={cn("p-1 text-muted-foreground font-light text-sm", {
                  "border-2 border-blue-500": DEBUG,
                })}
              >
                {messageCount}
                {messageCount === 1 ? " message" : " messages"}
              </div>
              <div
                className={cn("p-1 text-muted-foreground font-light text-sm", {
                  "border-2 border-blue-500": DEBUG,
                })}
              >
                {"/"}
              </div>
              <div
                className={cn("p-1 text-muted-foreground font-light text-sm", {
                  "border-2 border-blue-500": DEBUG,
                })}
              >
                {tabCount}
                {tabCount === 1 ? " tab" : " tabs"}
              </div>
            </div>
            <div
              className={cn("flex justify-end gap-1", {
                "border-2 border-blue-500": DEBUG,
              })}
            >
              {onEdit && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(_id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Edit chat</p>
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onSelect(_id)}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Show messages</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div
            className={cn("p-1 font-medium", {
              "border-2 border-green-500": DEBUG,
            })}
          >
            {title}
          </div>
          <div
            className={cn("flex-1 p-1 text-muted-foreground", {
              "border-2 border-green-500": DEBUG,
            })}
          >
            {description}
          </div>
          {groupId && (
            <div
              className={cn("p-1 text-xs text-muted-foreground", {
                "border-2 border-green-500": DEBUG,
              })}
            >
              Group: {groupId}
            </div>
          )}
          <div className="mt-2">
            <AutosizeTextarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type a message..."
              className="resize-none"
            />
            <Button 
              className="w-full mt-2" 
              onClick={handleSendMessage}
              disabled={!messageContent.trim()}
            >
              Send Message
            </Button>
          </div>
          {DEBUG && <Badge>{_id}</Badge>}
        </div>
      </AspectRatio>
    </div>
  );
} 