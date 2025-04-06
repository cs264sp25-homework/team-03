import { UpdateChatType } from "@/types/chat";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { toast } from "sonner";

export function useMutationChat(chatId: Id<"chats">) {
  const updateMutation = useSessionMutation(api.chats.update);
  const deleteMutation = useSessionMutation(api.chats.remove);

  const editChat = async (chat: UpdateChatType): Promise<boolean> => {
    try {
      await updateMutation({
        ...chat,
        chatId,
      });
      return true;
    } catch (error) {
      toast((error as Error).message || "Please try again later");
      return false;
    }
  };

  const deleteChat = async (): Promise<boolean> => {
    try {
      await deleteMutation({
        chatId,
      });
      return true;
    } catch (error) {
      toast((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    edit: editChat,
    delete: deleteChat,
  };
}
