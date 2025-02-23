File structure:
- manifest.json makes this a chrome extension
- background.js is the background script: it doesn't have access to the DOM but has access to Chrome APIs.
- content.js is a content script: has access to the DOM.
