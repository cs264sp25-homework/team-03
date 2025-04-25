
let lastSelection = null;
let collectionContext = null;

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
      collectionContext: collectionContext
    });
    return true;
  }

  if (message.type === "setCollectionContext") {
    console.log("Setting collection context:", message.collectionId);
    collectionContext = {
      collectionId: message.collectionId,
      collectionName: message.collectionName,
      tabs: message.tabs
    };
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "getCollectionContext") {
    console.log("Requested collection context:", collectionContext);
    sendResponse({ collectionContext });
    return true;
  }

  if (message.type === "clearCollectionContext") {
    console.log("Clearing collection context");
    collectionContext = null;
    sendResponse({ success: true });
    lastSelection = null;
    return true;
  }

  if (message.type === "extractText" && message.tabId) {
    (async () => {
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: message.tabId },
          world: "MAIN",
          func: () => {
            try {
              const documentClone = document.cloneNode(true);
              const parser = new DOMParser();
              const doc = parser.parseFromString(
                documentClone.documentElement.outerHTML,
                "text/html"
              );

              const elementsToRemove = [
                'script', 'style', 'iframe', 'noscript',
                'nav', 'footer', 'header', 'aside',
                '[role="banner"]', '[role="navigation"]', '[role="complementary"]', '[role="alert"]',
                '[id*="banner"]', '[id*="nav"]', '[id*="menu"]', '[id*="header"]', '[id*="footer"]',
                '[class*="banner"]', '[class*="nav"]', '[class*="menu"]', '[class*="header"]', 
                '[class*="footer"]', '[class*="flash"]', '[class*="alert"]', '[class*="error"]'
              ];

              elementsToRemove.forEach((selector) => {
                doc.querySelectorAll(selector).forEach((el) => {
                  if (el.parentNode) {
                    el.parentNode.removeChild(el);
                  }
                });
              });

              const mainContent = doc.querySelector("main") ||
                doc.querySelector("article") ||
                doc.querySelector('[role="main"]') ||
                doc.querySelector("#content") ||
                doc.querySelector(".content") ||
                doc.body;
              
              const tables = Array.from(mainContent.querySelectorAll('table'));
              const tableData = tables.map(table => {
                const caption = table.querySelector('caption')?.textContent?.trim() || '';
                const headerRow = table.querySelector('thead tr');
                
                const rawHeaders = headerRow ? 
                  Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent?.trim() || '') :
                  Array.from(table.querySelectorAll('tr:first-child th, tr:first-child td')).map(cell => cell.textContent?.trim() || '');
                
                const rawRows = Array.from(table.querySelectorAll('tbody tr, tr'))
                  .filter(row => row !== headerRow)
                  .map(row => Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || ''));
                
                const columnsToRemove = rawHeaders.map((header, index) => {
                  const isEmptyColumn = header === '' || header === 'Wappen';
                  const hasEmptyData = rawRows.every(row => !row[index] || row[index] === '');
                  return (isEmptyColumn || hasEmptyData) ? index : -1;
                }).filter(index => index !== -1);
                
                const headers = rawHeaders.filter((_, i) => !columnsToRemove.includes(i));
                const rows = rawRows.map(row => row.filter((_, i) => !columnsToRemove.includes(i)));
                
                return { caption, headers, rows };
              });
              
              const contentSelectors = 'h1, h2, h3, h4, h5, h6, p, li';
              const allElements = Array.from(mainContent.querySelectorAll(contentSelectors));
              
              allElements.sort((a, b) => {
                const position = a.compareDocumentPosition(b);
                return (position & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 
                       (position & Node.DOCUMENT_POSITION_PRECEDING) ? 1 : 0;
              });
              
              let formattedContent = '';
              let tableIndex = 0;
              
              const insertTable = (table) => {
                formattedContent += '\n<TABLE-CAPTION>' + (table.caption || '') + '</TABLE-CAPTION>\n';
                
                formattedContent += '<TABLE>\n<TABLE-DATA>' + 
                  JSON.stringify({ headers: table.headers, rows: table.rows }) + 
                  '</TABLE-DATA>\n</TABLE>\n\n';
              };
              
              allElements.forEach(element => {
                const tagName = element.tagName.toLowerCase();
                const text = element.textContent.trim();
                if (!text) return;
                
                if (tagName.match(/^h[1-6]$/) || tagName === 'p') {
                  while (tableIndex < tables.length && 
                         (tables[tableIndex].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                    insertTable(tableData[tableIndex++]);
                  }
                }
                if (tagName.match(/^h[1-6]$/) || tagName === 'p') {
                  formattedContent += text + '\n\n';
                } else if (tagName === 'li') {
                  formattedContent += '• ' + text + '\n';
                }
              });
              
              while (tableIndex < tables.length) {
                insertTable(tableData[tableIndex++]);
              }
              
              let cleanText = formattedContent.trim();
              
              if (cleanText.length < 200) {
                cleanText = mainContent.textContent?.replace(/\s+/g, " ")
                  .replace(/\. /g, ".\n")
                  .replace(/\: /g, ":\n")
                  .replace(/\n+/g, '\n\n')
                  .trim() || "";
              }

              return {
                title: document.title,
                content: cleanText,
                excerpt: cleanText.slice(0, 150) + "...",
                length: cleanText.length,
                siteName: new URL(document.location.href).hostname,
              };
            } catch (error) {
              console.error("Error in extraction:", error);

              const text =
                document.body.textContent || document.body.innerText || "";
              return {
                title: document.title,
                content: text.replace(/\s+/g, " ").trim(),
                excerpt: text.slice(0, 150) + "...",
                length: text.length,
                siteName: new URL(document.location.href).hostname,
              };
            }
          },
        });

        if (!results?.[0]?.result) {
          throw new Error("No content extracted");
        }

        const { title, content, excerpt, siteName } = results[0].result;
        sendResponse({
          success: true,
          text: content,
          metadata: { title, excerpt, siteName },
        });
      } catch (error) {
        console.error("Error:", error);
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