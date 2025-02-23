chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getTabs") {
    chrome.tabs.query({currentWindow: true}, (tabs) => {
      sendResponse({tabs: tabs});
    });
    return true; // Required for async response
  }
});