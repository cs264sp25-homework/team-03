import { CreateMessageType } from "@/types/message";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useSessionId } from "convex-helpers/react/sessions";

export function useMutationMessages(chatId: string) {
  const createMutation = useMutation(api.messages.create);
  const [sessionId] = useSessionId();

  const createMessage = async (
    message: CreateMessageType,
  ): Promise<string | null> => {
    try {
      console.log("Creating message with args:", {
        content: message.content,
        chatId,
        sessionId,
        tabUrls: message.tabUrls
      });

      const messageId = await createMutation({
        content: message.content,
        chatId: chatId as Id<"chats">,
        sessionId: sessionId as string,
        tabUrls: message.tabUrls
      });

      console.log("Message created successfully with ID:", messageId);
      return messageId as string;
    } catch (error) {
      console.error("Error creating message:", error);
      toast.error((error as Error).message || "Please try again later");
      return null;
    }
  };

  return {
    add: createMessage,
  };
}
