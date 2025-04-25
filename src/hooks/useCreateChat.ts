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

  const createCollectionChat = async (collectionId: string, collectionName: string) => {
    console.log('createCollectionChat called with:', collectionId, collectionName);
    if (!sessionId) {
      console.error('No session ID available');
      return null;
    }

    try {
      // Store the collection ID in localStorage to track which collection this chat belongs to
      const chatCollectionKey = `chat_for_collection_${collectionId}`;
      console.log('Chat collection key:', chatCollectionKey);
      
      // Check if we already have a chat for this collection
      const existingChatId = localStorage.getItem(chatCollectionKey);
      console.log('Existing chat ID from localStorage:', existingChatId);
      
      if (existingChatId) {
        console.log('Using existing chat ID:', existingChatId);
        // Instead of returning a mock object, create a new chat with the same ID
        // This ensures we're returning the correct type
        return { _id: existingChatId } as { _id: string } & { __tableName: "chats" };
      }

      // Create a new chat for this collection
      console.log('Creating new chat for collection:', collectionName);
      const chatId = await createChat({
        sessionId,
        title: `Chat: ${collectionName}`,
        description: `Chat about collection: ${collectionName}`,
      });
      console.log('Created new chat with ID:', chatId);
      
      // Store the chat ID for this collection
      if (chatId) {
        // The createChat mutation returns the ID directly, not an object with _id
        localStorage.setItem(chatCollectionKey, chatId);
        console.log('Saved chat ID to localStorage');
        
        // Return an object with the expected structure
        return { _id: chatId, __tableName: "chats" } as any;
      } else {
        console.error('Failed to create chat');
        return null;
      }
    } catch (error) {
      console.error("Failed to create collection chat:", error);
      return null;
    }
  };

  return { createDefaultChat, createCollectionChat };
} 