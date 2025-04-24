window.ContentExtractor = window.ContentExtractor || {
  extract: function(options = {}) {
    const includeUIElements = options.includeUIElements || false;
    try {
      // Try Readability first if available
      if (typeof Readability !== 'undefined' && typeof window.ReadabilityWrapper !== 'undefined') {
        const result = window.ReadabilityWrapper.extract({ includeUIElements });
        if (result?.content) {
          const content = window.ReadabilityWrapper.htmlToFormattedText(result.content);
          return {
            title: result.title,
            content,
            excerpt: result.excerpt,
            length: content.length,
            siteName: result.siteName,
            url: result.url,
            timestamp: result.timestamp,
            byline: result.byline,
            extractionMethod: 'readability'
          };
        }
      }
      
      // Custom extraction fallback
      const doc = new DOMParser().parseFromString(
        document.cloneNode(true).documentElement.outerHTML, "text/html"
      );

      // Clean document and find main content
      this._cleanDocument(doc, includeUIElements);
      const mainContent = includeUIElements ? doc.body : this._findMainContent(doc);
      
      // Extract content preserving original document order
      const tables = Array.from(mainContent.querySelectorAll('table'));
      const tableData = this._extractTables(tables);
      let content = this._extractFormattedContent(mainContent, tables, tableData).trim();
      
      // Use fallback if content is too short
      if (content.length < 200) {
        content = this._extractFallbackContent(mainContent);
      }

      return {
        title: document.title,
        content,
        excerpt: content.slice(0, 150) + "...",
        length: content.length,
        siteName: new URL(document.location.href).hostname,
        url: document.location.href,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return this._fallbackExtraction();
    }
  },

  _cleanDocument: function(doc, includeUIElements) {
    const selectors = [
      // Always remove these
      'script', 'style', 'iframe', 'noscript',
      '[class*="cookie"]', '[id*="cookie"]',
      '[class*="ad-"]', '[class*="advertisement"]',
      
      // Conditionally remove UI elements
      ...(includeUIElements ? [] : [
        'nav', 'footer', 'header', 'aside',
        '[role="banner"]', '[role="navigation"]', '[role="complementary"]', '[role="alert"]',
        '[id*="banner"]', '[id*="nav"]', '[id*="menu"]', '[id*="header"]', '[id*="footer"]',
        '[class*="banner"]', '[class*="nav"]', '[class*="menu"]', '[class*="header"]',
        '[class*="footer"]', '[class*="flash"]', '[class*="alert"]', '[class*="error"]',
        '[class*="popup"]', '[class*="modal"]', '[id*="popup"]', '[id*="modal"]',
        '[class*="comment"]', '[id*="comment"]', '[class*="social"]', '[id*="social"]',
        '.sidebar', '#sidebar', '.widget', '.recommended', '.related'
      ])
    ];
    
    selectors.forEach(selector => {
      try { doc.querySelectorAll(selector).forEach(el => el.parentNode?.removeChild(el)); } catch (e) {}
    });
  },

  _findMainContent: function(doc) {
    const selectors = ["main", "article", "[role=\"main\"]", "#content", ".content",
      ".post-content", ".article-content", ".entry-content", "#main", ".main"];

    for (const selector of selectors) {
      const element = doc.querySelector(selector);
      if (element && element.textContent.length > 250 && element.querySelectorAll("p, h1, h2, h3, h4, h5, h6").length > 2) {
        return element;
      }
    }
    return doc.body;
  },

  _extractTables: function(tables) {
    return tables.map(table => {
      const caption = table.querySelector('caption')?.textContent?.trim() || '';
      const headerRow = table.querySelector('thead tr');
      const rawHeaders = headerRow ? 
        Array.from(headerRow.querySelectorAll('th')).map(th => th.textContent?.trim() || '') :
        Array.from(table.querySelectorAll('tr:first-child th, tr:first-child td')).map(cell => cell.textContent?.trim() || '');
      
      const rawRows = Array.from(table.querySelectorAll('tbody tr, tr'))
        .filter(row => row !== headerRow)
        .map(row => Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || ''));
      
      // Remove empty columns
      const columnsToRemove = rawHeaders.map((header, index) => 
        ((header === '' || header === 'Wappen') || rawRows.every(row => !row[index] || row[index] === '')) ? index : -1
      ).filter(index => index !== -1);
      
      return { 
        caption, 
        headers: rawHeaders.filter((_, i) => !columnsToRemove.includes(i)),
        rows: rawRows.map(row => row.filter((_, i) => !columnsToRemove.includes(i)))
      };
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
    let content = '';
    
    // Create a map of tables to their extracted data
    const tableMap = new Map();
    tables.forEach((table, index) => tableMap.set(table, tableData[index]));
    
    // Create a document walker to traverse elements in their natural DOM order
    const walker = document.createTreeWalker(
      mainContent,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: function(node) {
          const tag = node.tagName.toLowerCase();
          // Accept content elements and tables
          if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'pre', 'code', 'table'].includes(tag)) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );
    
    // Process each element in document order
    let currentNode;
    while (currentNode = walker.nextNode()) {
      const tag = currentNode.tagName.toLowerCase();
      const text = currentNode.textContent?.trim();
      if (!text) continue;
      
      // Handle tables
      if (tag === 'table' && tableMap.has(currentNode)) {
        const data = tableMap.get(currentNode);
        content += `\n<TABLE-CAPTION>${data.caption || ''}</TABLE-CAPTION>\n`;
        content += `<TABLE>\n<TABLE-DATA>${JSON.stringify({
          headers: data.headers, rows: data.rows
        })}</TABLE-DATA>\n</TABLE>\n\n`;
        continue;
      }
      
      // Format content based on element type
      if (tag.match(/^h[1-6]$/)) {
        content += `${('#').repeat(parseInt(tag.substring(1)))} ${text}\n\n`;
      } else if (tag === 'p') {
        content += `${text}\n\n`;
      } else if (tag === 'li') {
        content += `• ${text}\n`;
      } else if (tag === 'blockquote') {
        content += `> ${text.replace(/\n/g, '\n> ')}\n\n`;
      } else if (tag === 'pre' || tag === 'code') {
        content += `\`\`\`\n${text}\n\`\`\`\n\n`;
      }
    }
    
    return content;
  },

  _extractFallbackContent: function(mainContent) {
    return mainContent.textContent?.replace(/\s+/g, " ")
      .replace(/\. /g, ".\n")
      .replace(/\: /g, ":\n")
      .replace(/\n+/g, '\n\n')
      .trim() || "";
  },

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
