/**
 * Content Extractor Module - Extracts content from web pages
 */
window.ContentExtractor = window.ContentExtractor || {
  // Main extraction function
  extract: function(options = {}) {
    const includeUIElements = options.includeUIElements || false;
    try {
      // Try Readability first if available
      if (typeof Readability !== 'undefined' && typeof window.ReadabilityWrapper !== 'undefined') {
        const readabilityResult = window.ReadabilityWrapper.extract({ includeUIElements });
        if (readabilityResult?.content) {
          const formattedContent = window.ReadabilityWrapper.htmlToFormattedText(readabilityResult.content);
          return {
            title: readabilityResult.title,
            content: formattedContent,
            excerpt: readabilityResult.excerpt,
            length: formattedContent.length,
            siteName: readabilityResult.siteName,
            url: readabilityResult.url,
            timestamp: readabilityResult.timestamp,
            byline: readabilityResult.byline,
            extractionMethod: 'readability'
          };
        }
      }
      
      // Custom extraction fallback
      console.log('Falling back to custom extraction');
      const documentClone = document.cloneNode(true);
      const doc = new DOMParser().parseFromString(
        documentClone.documentElement.outerHTML, "text/html"
      );

      this._cleanDocument(doc, includeUIElements);
      const mainContent = includeUIElements ? doc.body : this._findMainContent(doc, includeUIElements);
      const tables = Array.from(mainContent.querySelectorAll('table'));
      const tableData = this._extractTables(tables);
      let finalContent = this._extractFormattedContent(mainContent, tables, tableData).trim();
      
      if (finalContent.length < 200) {
        finalContent = this._extractFallbackContent(mainContent);
      }

      return {
        title: document.title,
        content: finalContent,
        excerpt: finalContent.slice(0, 150) + "...",
        length: finalContent.length,
        siteName: new URL(document.location.href).hostname,
        url: document.location.href,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("Error in extraction:", error);
      return this._fallbackExtraction();
    }
  },

  // Remove non-content elements from the document
  _cleanDocument: function(doc, includeUIElements) {
    // Elements to always remove
    const alwaysRemove = [
      'script', 'style', 'iframe', 'noscript',
      '[class*="cookie"]', '[id*="cookie"]',
      '[class*="ad-"]', '[class*="advertisement"]'
    ];
    
    // Elements to conditionally remove based on mode
    const conditionallyRemove = includeUIElements ? [] : [
      'nav', 'footer', 'header', 'aside',
      '[role="banner"]', '[role="navigation"]', '[role="complementary"]', '[role="alert"]',
      '[id*="banner"]', '[id*="nav"]', '[id*="menu"]', '[id*="header"]', '[id*="footer"]',
      '[class*="banner"]', '[class*="nav"]', '[class*="menu"]', '[class*="header"]', 
      '[class*="footer"]', '[class*="flash"]', '[class*="alert"]', '[class*="error"]',
      '[class*="popup"]', '[class*="modal"]', '[id*="popup"]', '[id*="modal"]',
      '[class*="comment"]', '[id*="comment"]', '[class*="social"]', '[id*="social"]',
      '.sidebar', '#sidebar', '.widget', '.recommended', '.related'
    ];
    
    [...alwaysRemove, ...conditionallyRemove].forEach((selector) => {
      try {
        doc.querySelectorAll(selector).forEach(el => el.parentNode?.removeChild(el));
      } catch (e) { /* Ignore errors */ }
    });
  },

  // Find the main content area of the document
  _findMainContent: function(doc, includeUIElements) {
    const contentSelectors = [
      "main", "article", "[role=\"main\"]", "#content", ".content",
      ".post-content", ".article-content", ".entry-content", "#main", ".main"
    ];

    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element && this._hasSubstantialContent(element)) {
        return element;
      }
    }
    return doc.body;
  },

  // Check if an element has substantial content
  _hasSubstantialContent: function(element) {
    const text = element.textContent || "";
    return text.length > 250 && element.querySelectorAll("p, h1, h2, h3, h4, h5, h6").length > 2;
  },

  // Extract tables from the document
  _extractTables: function(tables) {
    return tables.map(table => {
      // Extract caption
      const caption = table.querySelector('caption')?.textContent?.trim() || '';
      
      // Extract headers
      const headerRow = table.querySelector('thead tr');
      const rawHeaders = headerRow ? 
        Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent?.trim() || '') :
        Array.from(table.querySelectorAll('tr:first-child th, tr:first-child td')).map(cell => cell.textContent?.trim() || '');
      
      // Extract rows
      const rawRows = Array.from(table.querySelectorAll('tbody tr, tr'))
        .filter(row => row !== headerRow)
        .map(row => Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || ''));
      
      // Filter out empty columns
      const columnsToRemove = rawHeaders.map((header, index) => {
        const isEmptyColumn = header === '' || header === 'Wappen';
        const hasEmptyData = rawRows.every(row => !row[index] || row[index] === '');
        return (isEmptyColumn || hasEmptyData) ? index : -1;
      }).filter(index => index !== -1);
      
      // Apply filtering
      const headers = rawHeaders.filter((_, i) => !columnsToRemove.includes(i));
      const rows = rawRows.map(row => row.filter((_, i) => !columnsToRemove.includes(i)));
      
      return { caption, headers, rows };
    });
  },

  /**
   * Extract formatted content from the document
   * @param {Element} mainContent - The main content element
   * @param {NodeList} tables - The tables in the content
   * @param {Array} tableData - The extracted table data
   * @returns {string} Formatted content
   * @private
   */
  _extractFormattedContent: function(mainContent, tables, tableData) {
    let formattedContent = '';
    
    // Create a map of tables to their data for quick lookup
    const tableMap = new Map();
    tables.forEach((table, index) => {
      tableMap.set(table, tableData[index]);
    });
    
    // Function to insert table data
    const insertTable = (tableData) => {
      formattedContent += '\n<TABLE-CAPTION>' + (tableData.caption || '') + '</TABLE-CAPTION>\n';
      formattedContent += '<TABLE>\n<TABLE-DATA>' + 
        JSON.stringify({ headers: tableData.headers, rows: tableData.rows }) + 
        '</TABLE-DATA>\n</TABLE>\n\n';
    };
    
    // Function to process a node and its children recursively
    const processNode = (node) => {
      // Skip empty text nodes and script/style tags
      if (node.nodeType === Node.TEXT_NODE) {
        return;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        const tagName = node.tagName.toLowerCase();
        
        // Handle tables specially
        if (tagName === 'table' && tableMap.has(node)) {
          insertTable(tableMap.get(node));
          return; // Skip processing children of tables
        }
        
        // Process content elements
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'pre', 'code'].includes(tagName)) {
          const text = node.textContent?.trim() || "";
          if (!text) return;
          
          // Format the element based on its tag
          if (tagName.match(/^h[1-6]$/)) {
            // Add proper heading formatting with level indicators
            const level = parseInt(tagName.substring(1));
            const prefix = '#'.repeat(level) + ' ';
            formattedContent += prefix + text + '\n\n';
          } else if (tagName === 'p') {
            formattedContent += text + '\n\n';
          } else if (tagName === 'li') {
            formattedContent += '• ' + text + '\n';
          } else if (tagName === 'blockquote') {
            formattedContent += '> ' + text.replace(/\n/g, '\n> ') + '\n\n';
          } else if (tagName === 'pre' || tagName === 'code') {
            formattedContent += '```\n' + text + '\n```\n\n';
          }
          
          return; // Skip processing children of content elements
        }
        
        // For other elements, process their children
        for (let i = 0; i < node.childNodes.length; i++) {
          processNode(node.childNodes[i]);
        }
      }
    };
    
    // Start processing from the main content element
    processNode(mainContent);
    
    return formattedContent;
  },

  /**
   * Extract fallback content when structured extraction fails
   * @param {Element} mainContent - The main content element
   * @returns {string} Extracted text
   * @private
   */
  _extractFallbackContent: function(mainContent) {
    return mainContent.textContent?.replace(/\s+/g, " ")
      .replace(/\. /g, ".\n")
      .replace(/\: /g, ":\n")
      .replace(/\n+/g, '\n\n')
      .trim() || "";
  },

  /**
   * Complete fallback extraction when everything else fails
   * @returns {Object} Basic extracted content
   * @private
   */
  _fallbackExtraction: function() {
    const text = document.body.textContent || document.body.innerText || "";
    const cleanText = text.replace(/\s+/g, " ").trim();
    return {
      title: document.title,
      content: cleanText,
      excerpt: cleanText.slice(0, 150) + "...",
      length: cleanText.length,
      siteName: new URL(document.location.href).hostname,
      url: document.location.href,
      timestamp: new Date().toISOString()
    };
  }
};
