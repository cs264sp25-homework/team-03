import { UpdateMessageType } from "@/types/message";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { useSessionId } from "convex-helpers/react/sessions";

export function useMutationMessage(messageId: string) {
  const updateMutation = useMutation(api.messages.updateContent);
  const [sessionId] = useSessionId();

  const editMessageThroughMutation = async (
    message: UpdateMessageType,
    overrideMessageId?: string, // need this for regenerating AI response
  ): Promise<boolean> => {
    try {
      if (!sessionId) {
        throw new Error("No session ID available");
      }

      // When we regenerate the AI response, we need to pass the previous message
      // as the differentMessageId
      const whichMessageId = overrideMessageId || messageId;
      await updateMutation({
        content: message.content as string,
        messageId: whichMessageId as Id<"messages">,
        sessionId,
      });
      toast.success("Message updated successfully");
      return true;
    } catch (error) {
      toast.error("Error updating message", {
        description: (error as Error).message || "Please try again later",
      });
      return false;
    }
  };

  // TODO: We may want to remove this feature!
  const deleteMessage = async (): Promise<boolean> => {
    try {
      console.log(`Trying to delete ${messageId}`);
      throw new Error("Delete message not implemented");
    } catch (error) {
      toast.error((error as Error).message || "Please try again later");
      return false;
    }
  };

  return {
    edit: editMessageThroughMutation,
    delete: deleteMessage,
  };
}
