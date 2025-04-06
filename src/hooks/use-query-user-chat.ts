import { useSessionQuery } from "convex-helpers/react/sessions";
import { api } from "../../convex/_generated/api";


export function useQueryUserChat() {
  try {
    const chat = useSessionQuery(api.chats.getUserChat);
    return chat;
  } catch (error) {
    // If there's an auth error or any other error, return null
    // This will allow the app to continue working and retry later
    return null;
  }
} 