chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle get tabs request
  if (message.type === "getTabs") {
    chrome.tabs.query({ currentWindow: true }, (tabs) => {
      sendResponse({ tabs: tabs });
    });
    return true; // Required for async response
  }

  // Handle extract text request
  if (message.type === "extractText" && message.tabId) {
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
              const doc = parser.parseFromString(
                documentClone.documentElement.outerHTML,
                "text/html"
              );

              // Basic content extraction logic
              // Remove unwanted elements
              const elementsToRemove = [
                "script",
                "style",
                "iframe",
                "nav",
                "footer",
                "header",
                "aside",
                '[role="banner"]',
                '[role="navigation"]',
                '[role="complementary"]',
                '[id*="banner"]',
                '[id*="nav"]',
                '[id*="menu"]',
                '[id*="header"]',
                '[id*="footer"]',
                '[class*="banner"]',
                '[class*="nav"]',
                '[class*="menu"]',
                '[class*="header"]',
                '[class*="footer"]',
              ];

              elementsToRemove.forEach((selector) => {
                doc.querySelectorAll(selector).forEach((el) => {
                  if (el.parentNode) {
                    el.parentNode.removeChild(el);
                  }
                });
              });

              // Find main content
              let mainContent =
                doc.querySelector("main") ||
                doc.querySelector("article") ||
                doc.querySelector('[role="main"]') ||
                doc.querySelector("#content") ||
                doc.querySelector(".content") ||
                doc.body;

              // Extract text
              const text =
                mainContent.textContent || mainContent.innerText || "";
              const cleanText = text.replace(/\s+/g, " ").trim();

              return {
                title: document.title,
                content: cleanText,
                excerpt: cleanText.slice(0, 150) + "...",
                length: cleanText.length,
                siteName: new URL(document.location.href).hostname,
              };
            } catch (error) {
              console.error("Error in extraction:", error);

              // Fallback to basic extraction
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
    return true; // Required for async response
  }
});
