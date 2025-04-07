import { CreateChatType } from "@/types/chat";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { toast } from "sonner";

export function useMutationChats() {
  const createMutation = useSessionMutation(api.chats.create);

  const createChat = async (chat: CreateChatType): Promise<boolean> => {
    try {
      await createMutation({
        title: chat.title,
        description: chat.description,
        tabGroupId: chat.tabGroupId ? (chat.tabGroupId as Id<"tabGroups">) : undefined,
      });
      return true;
    } catch (error) {
      toast((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    create: createChat,
  };
}
