import { api } from "../../convex/_generated/api";
import { ChatType } from "@/types/chat";
import { useSessionQuery } from "convex-helpers/react/sessions";

//TODO: need to add getAll by groupId
// Add a function to get all chats for a user (optionally filtered by group)
export function useQueryChats() {
  const chats = useSessionQuery(api.chats.getAll, {});

  return {
    data: chats as ChatType[] | undefined,
    loading: chats === undefined,
    error: chats === null,
  };
}
