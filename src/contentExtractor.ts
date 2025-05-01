import { Readability } from '@mozilla/readability';

// Define interfaces for our types

interface ExtractorResult {
  title?: string | null;
  content?: string | null;
  excerpt?: string | null;
  length?: number;
  siteName?: string | null;
  url?: string;
  timestamp?: string;
  byline?: string | null;
  extractionMethod?: string;
  success?: boolean;
  error?: string;
}

// Declare global window extensions
declare global {
  interface Window {
    ContentExtractor: {
      extract: () => ExtractorResult;
    };
  }
}

console.log("Readibility methods", Object.getOwnPropertyNames(Readability));

window.ContentExtractor = window.ContentExtractor || {
  extract: function(): ExtractorResult {
    try {
      const documentClone = document.cloneNode(true) as Document;
      const reader = new Readability(documentClone);
      const result = reader.parse();
      if (result?.content) {
        const content = result.textContent || result.content.replace(/<[^>]*>/g, '');
        return {
          title: result.title,
          content,
          excerpt: result.excerpt,
          length: content.length,
          siteName: result.siteName,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          byline: result.byline,
          extractionMethod: 'readability'
        };
      } else {
        return { success: false, error: "Readability extraction failed" };
      }
      
    } catch (error) {
      console.error("[contentExtractor.ts] Readability extraction failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};

// Add this to make the file a module
export {};
