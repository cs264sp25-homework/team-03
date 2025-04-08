//TODO: tab remove doesn't work yet

// Store the last selection
let lastSelection = null;

// Store tab URLs
const tabUrls = new Map();

// Store the last tab removed message
let lastTabRemoved = null;

// Track tab URLs when they're updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Background: Tracking tab URL:', tabId, tab.url);
    tabUrls.set(tabId, tab.url);
  }
});

// Add tab event listeners that send messages
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log('Background: Tab removed:', tabId, 'window:', removeInfo.windowId);
  
  // Get the URL from our stored URLs
  const url = tabUrls.get(tabId);
  if (url) {
    console.log('Background: Found URL for removed tab:', url);
    // Remove the tab from the backend
    fetch('http://localhost:3000/api/remove-tab-by-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url })
    }).then(response => {
      if (response.ok) {
        console.log('Background: Tab removed from backend successfully');
      } else {
        console.log('Background: Error removing tab from backend:', response.status);
      }
    }).catch(error => {
      console.log('Background: Error removing tab from backend:', error);
    });
    // Clean up the stored URL
    tabUrls.delete(tabId);
  } else {
    console.log('Background: No URL found for removed tab');
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle get last tab removed request
  if (message.type === 'getLastTabRemoved') {
    console.log('Background: Sending last tab removed:', lastTabRemoved);
    sendResponse(lastTabRemoved);
    lastTabRemoved = null;
    return true;
  }

  // Handle test message
  if (message.type === 'test') {
    console.log('Background: Received test message');
    sendResponse({ success: true });
    return true;
  }

  // Handle get tabs request
  if (message.type === "getTabs") {
    chrome.tabs.query({currentWindow: true}, (tabs) => {
      sendResponse({tabs: tabs});
    });
    return true;
  }

  // Handle get selection request
  if (message.type === "getSelection") {
    console.log('Popup requested selection data, sending:', lastSelection);
    sendResponse({ 
      selection: lastSelection,
      action: lastSelection?.action
    });
    lastSelection = null;
    return true;
  }

  // Handle extract text request
  if (message.type === 'extractText' && message.tabId) {
    (async () => {
      try {
        // Execute content extraction with proper permissions
        const results = await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          world: "MAIN", // Execute in the main world to access page content
          func: () => {
            try {
              // Create a clean document clone
              const documentClone = document.cloneNode(true);
              
              // Use DOMParser to create a new document
              const parser = new DOMParser();
              const doc = parser.parseFromString(documentClone.documentElement.outerHTML, 'text/html');
              
              // Basic content extraction logic
              // Remove unwanted elements
              const elementsToRemove = [
                'script', 'style', 'iframe', 'nav', 'footer', 'header', 'aside',
                '[role="banner"]', '[role="navigation"]', '[role="complementary"]',
                '[id*="banner"]', '[id*="nav"]', '[id*="menu"]', '[id*="header"]', '[id*="footer"]',
                '[class*="banner"]', '[class*="nav"]', '[class*="menu"]', '[class*="header"]', '[class*="footer"]'
              ];
              
              elementsToRemove.forEach(selector => {
                doc.querySelectorAll(selector).forEach(el => {
                  if (el.parentNode) {
                    el.parentNode.removeChild(el);
                  }
                });
              });
              
              // Find main content
              let mainContent = doc.querySelector('main') || 
                               doc.querySelector('article') || 
                               doc.querySelector('[role="main"]') || 
                               doc.querySelector('#content') || 
                               doc.querySelector('.content') || 
                               doc.body;
              
              // Extract text
              const text = mainContent.textContent || mainContent.innerText || '';
              const cleanText = text.replace(/\s+/g, ' ').trim();
              
              return {
                title: document.title,
                content: cleanText,
                excerpt: cleanText.slice(0, 150) + '...',
                length: cleanText.length,
                siteName: new URL(document.location.href).hostname
              };
            } catch (error) {
              console.error('Error in extraction:', error);
              
              // Fallback to basic extraction
              const text = document.body.textContent || document.body.innerText || '';
              return {
                title: document.title,
                content: text.replace(/\s+/g, ' ').trim(),
                excerpt: text.slice(0, 150) + '...',
                length: text.length,
                siteName: new URL(document.location.href).hostname
              };
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

  // Handle tab removed message
  if (message.type === 'tabRemoved') {
    console.log('Background: Received tabRemoved message:', message);
    // Send to all extension views (including popup)
    chrome.runtime.sendMessage({
      type: 'tabRemoved',
      tabId: message.tabId,
      url: message.url,
      windowId: message.windowId,
      isWindowClosing: message.isWindowClosing
    }).then(() => {
      console.log('Background: Tab removal message sent successfully');
    }).catch(error => {
      console.log('Background: Error sending tab removal message:', error);
    });
    return true;
  }

  if (message.type === 'tabUpdated') {
    // Handle tab update
    console.log('Tab was updated:', message.tabId, message.url);
  }
});

// Add context menu for text selection
chrome.contextMenus.create({
  id: "askAboutSelection",
  title: "Ask About Selection",
  contexts: ["selection"]
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "askAboutSelection" && tab?.id) {
    // Store the selection data
    lastSelection = {
      type: "selection",
      text: info.selectionText,
      url: tab.url,
      title: tab.title,
      action: "navigateToChat"
    };
    
    console.log('Stored selection data:', lastSelection);
    
    // Open the popup
    chrome.action.openPopup();
    
    // Send the selection message to the popup
    setTimeout(() => {
      console.log('Sending selection message to popup');
      chrome.runtime.sendMessage({
        type: "selection",
        text: info.selectionText,
        url: tab.url,
        title: tab.title
      });
    }, 100); // Small delay to ensure popup is open
  }
});