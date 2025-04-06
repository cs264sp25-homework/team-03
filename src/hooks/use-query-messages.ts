import { MessageType } from "@/types/message";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionQuery } from "convex-helpers/react/sessions";

export function useQueryMessages(chatId: Id<"chats">) {
  const messages = useSessionQuery(api.messages.getAll, {
    chatId,
  });

  return {
    data: messages as MessageType[],
    loading: messages === undefined,
    error: messages === null,
  };
}
