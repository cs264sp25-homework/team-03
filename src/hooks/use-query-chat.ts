import { ChatType } from "@/types/chat";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionQuery } from "convex-helpers/react/sessions";

export function useQueryChat(chatId: Id<"chats">) {
  const chat = useSessionQuery(api.chats.getOne, {
    chatId,
  });

  return {
    data: chat as ChatType,
    loading: chat === undefined,
    error: chat === null,
  };
}
