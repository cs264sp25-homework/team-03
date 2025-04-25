import { Readability } from '@mozilla/readability';

// Define types for our article result
type ArticleResult = {
  title: string;
  content: string;
  excerpt: string;
  length: number;
  siteName: string;
};

// Handle message requests
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Handle get tabs request
  if (message.type === 'getTabs') {
    chrome.tabs.query({}, (tabs) => {
      sendResponse({ tabs });
    });
    return true;
  }

  // Handle extract text request
  if (message.type === 'extractText' && message.tabId) {
    (async () => {
      try {
        // Execute content extraction using Readability with proper permissions
        const results = await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          world: "MAIN", // Execute in the main world to access page content
          func: () => {
            try {
              // Create a clean document clone
              const documentClone = document.cloneNode(true) as Document;
              
              // Create a new Readability object
              const reader = new Readability(documentClone);
              const article = reader.parse();
              
              if (!article) {
                throw new Error('Could not parse article content');
              }

              const result: ArticleResult = {
                title: article.title || document.title,
                content: article.textContent || '',
                excerpt: article.excerpt || '',
                length: article.textContent?.length || 0,
                siteName: article.siteName || new URL(document.location.href).hostname
              };
              return result;
            } catch (error) {
              console.error('Error in Readability:', error);
              
              // Fallback to basic extraction
              const text = document.body.textContent || document.body.innerText || '';
              const result: ArticleResult = {
                title: document.title,
                content: text.replace(/\s+/g, ' ').trim(),
                excerpt: text.slice(0, 150) + '...',
                length: text.length,
                siteName: new URL(document.location.href).hostname
              };
              return result;
            }
          }
        });

        if (!results?.[0]?.result) {
          throw new Error('No content extracted');
        }

        const { title, content, excerpt, siteName } = results[0].result;
        sendResponse({ 
          success: true, 
          text: content,
          metadata: { title, excerpt, siteName }
        });
      } catch (error) {
        console.error('Error:', error);
        sendResponse({ 
          success: false, 
          error: error instanceof Error ? error.message : 'Failed to extract text' 
        });
      }
    })();
    return true;
  }

  // Handle tab removed request
  if (message.type === 'tabRemoved') {
    // Call your Convex mutation to remove the tab
    // This will run even if popup is closed
    console.log('Tab removed:', message.tabId);
  }

  // Handle tab updated request
  if (message.type === 'tabUpdated') {
    // Update tab info in database
    // This will run even if popup is closed
    console.log('Tab updated:', message.tabId, message.url, message.title);
  }

  // Handle messages from the popup
  if (message.type === "CREATE_TAB_GROUP") {
    handleCreateTabGroup(message.name, message.color)
      .then(sendResponse)
      .catch((error) => {
        console.error("Error creating tab group:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep the message channel open for async response
  }
});

// Direct handling of tab events
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Tab removed:', tabId, 'window:', removeInfo.windowId, 'isWindowClosing:', removeInfo.isWindowClosing);
  // Here you can directly call your Convex mutation to remove the tab from database
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    console.log('Tab updated:', tabId, 'url:', tab.url, 'title:', tab.title);
    // Here you can directly call your Convex mutation to update the tab in database
  }
});

// Add context menu for text selection
chrome.contextMenus.create({
  id: "askAboutSelection",
  title: "Ask about selection",
  contexts: ["selection"]
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askAboutSelection" && tab?.id) {
    // Get the selected text
    const selectedText = info.selectionText;
    
    // Send message to popup with the selected text and URL
    chrome.runtime.sendMessage({
      type: "selection",
      text: selectedText,
      url: tab.url,
      title: tab.title
    });
  }
});

async function handleCreateTabGroup(name: string, color?: string) {
  try {
    // Get all current tabs in the current window
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const tabIds = tabs.map((tab) => tab.id).filter((id): id is number => id !== undefined);

    if (tabIds.length === 0) {
      throw new Error("No tabs found to group");
    }

    // Create a new tab group
    const groupId = await chrome.tabs.group({ tabIds });
    
    // Update the group properties
    await chrome.tabGroups.update(groupId, {
      title: name,
      color: color as chrome.tabGroups.ColorEnum,
      collapsed: false,
    });

    return {
      success: true,
      groupId,
      tabCount: tabIds.length,
    };
  } catch (error) {
    console.error("Error in handleCreateTabGroup:", error);
    throw error;
  }
}
