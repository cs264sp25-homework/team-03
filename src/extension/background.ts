console.log("[background.ts] loaded");

const tabUrls = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("[background.ts] Tracking tab URL:", tabId, tab.url);
    tabUrls.set(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(
    "[background.ts] Tab removed:",
    tabId,
    "window:",
    removeInfo.windowId
  );

  const url = tabUrls.get(tabId);
  if (url) {
    console.log("[background.ts] Found URL for removed tab:", url);
    tabUrls.delete(tabId);
  } else {
    console.log("[background.ts] No URL found for removed tab");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[background.ts] received message:", message);

  // Return all tabs in the current window
  if (message.type === "getTabs") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      sendResponse({ tabs: tabs });
    });
    return true;
  }

  // Extract text with Readability.js
  if (message.type === "extractText" && message.tabId) {
    (async () => {
      try {
        // Inject contentExtractor.js
        await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          world: "MAIN",
          files: ["contentExtractor.js"],
        });

        // Run the ContentExtractor.extract() function that contentExtractor.js adds to the global scope
        const apiResults = await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          world: "MAIN",
          func: () => {
            return window.ContentExtractor.extract();
          }
        });

        // Extract results from executeScript API
        const results = apiResults?.[0]?.result;
        if (!results) throw new Error("No content extracted");
        const { title, content, excerpt, siteName, url, timestamp } = results;
        console.log("[background.ts] Results", results);
        
        sendResponse({
          success: true,
          text: content,
          metadata: { title, excerpt, siteName, url, timestamp },
        });
      } catch (error) {
        console.error("Error in extractText from background.ts:", error);
        sendResponse({
          success: false,
          error:
            error instanceof Error ? error.message : "Failed to extract text",
        });
      }
    })();
    return true;
  }
});
