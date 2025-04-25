import { useState, useEffect } from 'react';
import { Id } from 'convex/_generated/dataModel';

export function useWindowChat() {
  const [windowChatId, setWindowChatId] = useState<Id<"chats"> | null>(null);
  const [currentWindowId, setCurrentWindowId] = useState<number | null>(null);

  useEffect(() => {
    // Get the current window ID
    chrome.windows.getCurrent(async (window) => {
      if (window.id !== undefined) {
        setCurrentWindowId(window.id);
        
        // Get the chat ID for this specific window
        const result = await chrome.storage.local.get(['windowChats']);
        const windowChats = result.windowChats || {};
        if (windowChats[window.id]) {
          setWindowChatId(windowChats[window.id]);
        }
      }
    });

    // Listen for changes to window chat IDs
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.windowChats) {
        const windowChats = changes.windowChats.newValue || {};
        if (currentWindowId && windowChats[currentWindowId]) {
          setWindowChatId(windowChats[currentWindowId]);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, [currentWindowId]);

  const setChatForWindow = async (chatId: Id<"chats"> | null) => {
    if (!currentWindowId) return;

    // Get existing window chats
    const result = await chrome.storage.local.get(['windowChats']);
    const windowChats = result.windowChats || {};

    // Update chat for current window
    windowChats[currentWindowId] = chatId;

    // Save back to storage
    await chrome.storage.local.set({ windowChats });
    setWindowChatId(chatId);
  };

  return {
    windowChatId,
    setChatForWindow
  };
} 