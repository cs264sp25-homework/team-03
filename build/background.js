
let lastSelection = null;

const tabUrls = new Map();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    console.log("Background: Tracking tab URL:", tabId, tab.url);
    tabUrls.set(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(
    "Background: Tab removed:",
    tabId,
    "window:",
    removeInfo.windowId
  );

  const url = tabUrls.get(tabId);
  if (url) {
    console.log("Background: Found URL for removed tab:", url);
    tabUrls.delete(tabId);
  } else {
    console.log("Background: No URL found for removed tab");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Background received message:", message);

  if (message.type === "test") {
    console.log("Background: Received test message");
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "getTabs") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      sendResponse({ tabs: tabs });
    });
    return true;
  }

  if (message.type === "getSelection") {
    console.log("Popup requested selection data, sending:", lastSelection);
    sendResponse({
      selection: lastSelection,
      action: lastSelection?.action,
    });
    lastSelection = null;
    return true;
  }

  if (message.type === "extractText" && message.tabId) {
    (async () => {
      try {
        // Inject libraries and extract content
        await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          world: "MAIN",
          files: [ "readabilityWrapper.js", "contentExtractor.js"]
        });
        
        // Run extraction
        const results = await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          world: "MAIN",
          func: () => window.ContentExtractor.extract({ includeUIElements: true })
        });

        // Process results
        if (!results?.[0]?.result) throw new Error("No content extracted");
        
        const { title, content, excerpt, siteName, url, timestamp } = results[0].result;
        sendResponse({
          success: true,
          text: content,
          metadata: { title, excerpt, siteName, url, timestamp }
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: error instanceof Error ? error.message : "Failed to extract text"
        });
      }
    })();
    return true;
  }
});

chrome.contextMenus.removeAll(() => {
  chrome.contextMenus.create({
    id: "askAboutSelection",
    title: "Ask About Selection",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askAboutSelection" && tab?.id) {
    lastSelection = {
      type: "selection",
      text: info.selectionText,
      url: tab.url,
      title: tab.title,
      action: "navigateToChat",
    };

    console.log("Stored selection data:", lastSelection);

    chrome.action.openPopup();

    setTimeout(() => {
      console.log("Sending selection message to popup");
      chrome.runtime.sendMessage({
        type: "selection",
        text: info.selectionText,
        url: tab.url,
        title: tab.title,
      });
    }, 100); 
  }
});