import { useSessionQuery } from "convex-helpers/react/sessions";
import { api } from "../../convex/_generated/api";


export function useQueryUserChat() {
  
  const chat = useSessionQuery(api.chats.getUserChat);
  return chat;
} 