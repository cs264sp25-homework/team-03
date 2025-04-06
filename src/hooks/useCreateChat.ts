import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useSessionId } from "convex-helpers/react/sessions";

export function useCreateChat() {
  const [sessionId] = useSessionId();
  const createChat = useMutation(api.chats.create);

  const createDefaultChat = async () => {
    if (!sessionId) return null;

    try {
      const chat = await createChat({
        sessionId,
        title: "My Chat",
        description: "Your personal chat space",
      });
      return chat;
    } catch (error) {
      console.error("Failed to create chat:", error);
      return null;
    }
  };

  return { createDefaultChat };
} 