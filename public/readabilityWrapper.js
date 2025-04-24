/**
 * Readability Wrapper - Integrates with Mozilla's Readability library
 */
window.ReadabilityWrapper = window.ReadabilityWrapper || {
  // Extract content using Mozilla's Readability library
  extract: function(options = {}) {
    const includeUIElements = options.includeUIElements || false;
    try {
      const documentClone = document.cloneNode(true);
      let additionalContent = includeUIElements ? this._extractUIElements(document) : '';
      
      // Create and run Readability
      const reader = new Readability(documentClone);
      const article = reader.parse();
      
      if (!article) throw new Error('Readability could not parse the page');
      
      // Combine content
      let finalContent = article.content;
      if (includeUIElements && additionalContent) {
        finalContent += `
<div class="additional-ui-content">
${additionalContent}
</div>`;
      }
      
      return {
        title: article.title,
        content: finalContent,
        excerpt: article.excerpt || article.textContent.slice(0, 150) + "...",
        length: article.textContent.length + (additionalContent ? additionalContent.length : 0),
        siteName: article.siteName || new URL(document.location.href).hostname,
        url: document.location.href,
        timestamp: new Date().toISOString(),
        byline: article.byline,
        dir: article.dir,
        lang: article.lang,
        hasUIElements: includeUIElements && !!additionalContent
      };
    } catch (error) {
      console.error("Error in Readability extraction:", error);
      return null;
    }
  },
  
  /**
   * Convert Readability HTML content to plain text with formatting
   * @param {string} html - HTML content from Readability
   * @returns {string} Formatted plain text
   */
  // Convert HTML content to formatted plain text
  htmlToFormattedText: function(html) {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Extract and remove tables first
      const tables = Array.from(tempDiv.querySelectorAll('table'));
      const tableData = this._extractTables(tables);
      tables.forEach(table => table.parentNode?.removeChild(table));
      
      let formattedText = '';
      
      // Process headings
      for (let i = 1; i <= 6; i++) {
        tempDiv.querySelectorAll(`h${i}`).forEach(heading => {
          const text = heading.textContent.trim();
          if (text) formattedText += '#'.repeat(i) + ' ' + text + '\n\n';
          heading.parentNode?.removeChild(heading);
        });
      }
      
      // Process paragraphs
      tempDiv.querySelectorAll('p').forEach(p => {
        const text = p.textContent.trim();
        if (text) formattedText += text + '\n\n';
        p.parentNode?.removeChild(p);
      });
      
      // Process lists
      tempDiv.querySelectorAll('li').forEach(li => {
        const text = li.textContent.trim();
        if (text) formattedText += '• ' + text + '\n';
      });
      
      // Add tables
      if (tableData.length > 0) {
        formattedText += '\n';
        tableData.forEach(table => {
          if (table.caption) {
            formattedText += '\n<TABLE-CAPTION>' + table.caption + '</TABLE-CAPTION>\n';
          }
          formattedText += '<TABLE>\n<TABLE-DATA>' + 
            JSON.stringify({ headers: table.headers, rows: table.rows }) + 
            '</TABLE-DATA>\n</TABLE>\n\n';
        });
      }
      
      // Fallback if not enough content
      if (formattedText.length < 200) {
        formattedText = tempDiv.textContent.replace(/\s+/g, " ")
          .replace(/\. /g, ".\n")
          .replace(/\: /g, ":\n")
          .replace(/\n+/g, '\n\n')
          .trim();
      }
      
      return formattedText.trim();
    } catch (error) {
      console.error("Error converting HTML to text:", error);
      return html;
    }
  },
  
  /**
   * Extract tables from HTML elements
   * @param {NodeList} tables - The tables to extract
   * @returns {Array} Extracted table data
   * @private
   */
  /**
   * Extract UI elements like menus, navigation, headers, footers, etc.
   * @param {Document} document - The document to extract from
   * @returns {string} HTML content of UI elements
   * @private
   */
  // Extract UI elements like navigation, headers, footers, etc.
  _extractUIElements: function(document) {
    try {
      // Create container and add page metadata
      const uiContent = document.createElement('div');
      uiContent.className = 'ui-elements-container';
      uiContent.innerHTML = `
        <div class="page-metadata">
          <h1 class="page-title">${document.title}</h1>
          <div class="page-url">${document.location.href}</div>
        </div>
      `;
      
      // Define UI element types to collect
      const elementTypes = {
        header: 'header, [role="banner"], [id*="header"], [class*="header"]',
        navigation: 'nav, [role="navigation"], [id*="nav"], [id*="menu"], [class*="nav"], [class*="menu"]',
        sidebar: 'aside, .sidebar, #sidebar, [role="complementary"]',
        footer: 'footer, [id*="footer"], [class*="footer"]'
      };
      
      // Collect all elements with their positions
      const allUIElements = [];
      Object.entries(elementTypes).forEach(([type, selector]) => {
        document.querySelectorAll(selector).forEach(el => {
          allUIElements.push({
            element: el,
            type,
            position: this._getElementPosition(el, document)
          });
        });
      });
      
      // Sort by document position and group by type
      allUIElements.sort((a, b) => a.position - b.position);
      const elementsByType = { header: [], navigation: [], sidebar: [], footer: [] };
      allUIElements.forEach(item => elementsByType[item.type]?.push(item.element));
      
      // Create sections for each type
      Object.entries(elementsByType).forEach(([type, elements]) => {
        if (elements.length === 0) return;
        
        const section = document.createElement('div');
        section.className = `${type}-elements`;
        section.innerHTML = `<h2>${type.charAt(0).toUpperCase() + type.slice(1)} Elements</h2>`;
        
        elements.forEach(element => {
          const clone = element.cloneNode(true);
          clone.querySelectorAll('script, style').forEach(el => el.remove());
          section.appendChild(clone);
        });
        
        uiContent.appendChild(section);
      });
      
      return uiContent.innerHTML;
    } catch (error) {
      console.error('Error extracting UI elements:', error);
      return '';
    }
  },

  // Get the position of an element in the document
  _getElementPosition: function(element, document) {
    return Array.from(document.querySelectorAll('*')).indexOf(element);
  },

  // Extract and process tables
  _extractTables: function(tables) {
    return tables.map(table => {
      // Get caption, headers and rows
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
      
      const headers = rawHeaders.filter((_, i) => !columnsToRemove.includes(i));
      const rows = rawRows.map(row => row.filter((_, i) => !columnsToRemove.includes(i)));
      
      return { caption, headers, rows };
    });
  }
};
