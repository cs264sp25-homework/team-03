import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionMutation } from "convex-helpers/react/sessions";
import { toast } from "sonner";

export function useMutationMessage(chatId: Id<"chats">) {
  const createMutation = useSessionMutation(api.messages.create);

  const createMessage = async (content: string): Promise<boolean> => {
    try {
      await createMutation({
        chatId,
        content,
      });
      return true;
    } catch (error) {
      toast((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    create: createMessage,
  };
}
