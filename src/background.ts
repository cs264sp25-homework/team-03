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
});
