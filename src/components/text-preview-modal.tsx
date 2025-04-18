import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";

interface TextPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  text: string;
  url: string;
  isLoading: boolean;
  error?: string;
}

export function TextPreviewModal({
  isOpen,
  onClose,
  text,
  url,
  isLoading,
  error
}: TextPreviewModalProps) {
  const { theme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    const updateDarkMode = () => {
      const storedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const hasDarkClass = document.documentElement.classList.contains('dark');
      
      if (theme === 'dark' || 
          (theme === 'system' && prefersDark) || 
          (isOpen && storedTheme === 'dark') || 
          (isOpen && storedTheme === 'system' && prefersDark) || 
          (isOpen && !storedTheme && hasDarkClass)) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    };
    
    updateDarkMode();
    
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateDarkMode);
      return () => mediaQuery.removeEventListener('change', updateDarkMode);
    }
  }, [isOpen, theme]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-lg ${
        isDarkMode 
          ? 'bg-background border border-border' 
          : 'bg-white border border-gray-200'
      }`}>
        <DialogHeader>
          <DialogTitle className={`text-lg font-semibold ${
            isDarkMode ? 'text-foreground' : 'text-gray-900'
          }`}>
            Extracted Text Preview
          </DialogTitle>
          <DialogDescription className={`text-sm truncate ${
            isDarkMode ? 'text-muted-foreground' : 'text-gray-500'
          }`}>
            {url}
          </DialogDescription>
        </DialogHeader>
        <div className={`flex-1 overflow-y-auto mt-4 p-4 rounded-lg ${
          isDarkMode 
            ? 'bg-muted border border-border/50' 
            : 'bg-gray-50 border border-gray-200'
        }`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${
                isDarkMode ? 'border-primary' : 'border-blue-600'
              }`}></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <p className="mb-2 font-medium text-red-500">Failed to extract text</p>
              {error.includes('Cannot access restricted Chrome') ? (
                <div>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-muted-foreground' : 'text-gray-600'
                  }`}>
                    {error}
                  </p>
                  <p className={`mt-2 text-sm ${
                    isDarkMode ? 'text-muted-foreground' : 'text-gray-600'
                  }`}>
                    Chrome doesn't allow extensions to access internal Chrome pages for security reasons.
                    Try extracting text from regular web pages instead.
                  </p>
                </div>
              ) : (
                <p className={`text-sm ${
                  isDarkMode ? 'text-muted-foreground' : 'text-gray-600'
                }`}>
                {error}
              </p>
              )}
            </div>
          ) : (
            <div className={`whitespace-pre-wrap text-sm ${
              isDarkMode ? 'text-foreground' : 'text-gray-800'
            } prose prose-sm dark:prose-invert max-w-none`}>
              {text ? (
                <div className="formatted-content">
                  {(() => {
                    const renderContent = () => {
                      const sections: JSX.Element[] = [];
                      let listItems: string[] = [];
                      let tableContent: string[] = [];
                      let inTable = false;
                      let index = 0;
                      
                      const addListItems = () => {
                        if (listItems.length === 0) return;
                        
                        sections.push(
                          <div key={`list-${index++}`} className="my-3">
                            {listItems.map((item, i) => (
                              <div key={`item-${i}`} className="flex gap-2 my-1">
                                <span className="flex-shrink-0">•</span>
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        );
                        listItems = [];
                      };
                      
                      text.split('\n').forEach(line => {
                        let trimmed = line.trim();
                        
                        while (trimmed.startsWith('#')) {
                          trimmed = trimmed.substring(1).trim();
                        }
                        
                        if (!trimmed) return;
                        
                        if (trimmed === '<TABLE>') {
                          addListItems();
                          inTable = true;
                          tableContent = [];
                          return;
                        }
                        
                        if (trimmed === '</TABLE>') {
                          inTable = false;
                          renderTable();
                          return;
                        }
                        
                        if (inTable) {
                          tableContent.push(trimmed);
                          return;
                        }
                        
                        if (trimmed.startsWith('<TABLE-CAPTION>') && trimmed.endsWith('</TABLE-CAPTION>')) {
                          const caption = trimmed.replace('<TABLE-CAPTION>', '').replace('</TABLE-CAPTION>', '');
                          if (caption) {
                            sections.push(
                              <div key={`caption-${index++}`} className="font-semibold text-base mt-4 mb-1">
                                {caption}
                              </div>
                            );
                          }
                          return;
                        }
                        
                        if (trimmed.startsWith('•')) {
                          listItems.push(trimmed.substring(1).trim());
                          return;
                        }
                        
                        if (trimmed.length < 100 && (trimmed === trimmed.toUpperCase() || /^[A-Z]/.test(trimmed))) {
                          addListItems();
                          
                          const headingClass = trimmed.length < 30 
                            ? 'text-lg font-bold mt-3 mb-2' 
                            : 'text-base font-bold mt-2 mb-1';
                            
                          sections.push(
                            <div key={`heading-${index++}`} className={headingClass}>
                              {trimmed}
                            </div>
                          );
                          return;
                        }
                        
                        addListItems();
                        sections.push(<p key={`p-${index++}`} className="my-2">{trimmed}</p>);
                      });
                      
                      addListItems();
                      
                      function renderTable() {
                        const dataLine = tableContent.find(line => 
                          line.startsWith('<TABLE-DATA>') && line.endsWith('</TABLE-DATA>')
                        );
                        
                        if (!dataLine) return;
                        
                        try {
                          const jsonStr = dataLine.replace('<TABLE-DATA>', '').replace('</TABLE-DATA>', '');
                          const data = JSON.parse(jsonStr) as { headers: string[], rows: string[][] };
                          
                          const headers = data.headers || [];
                          const rows = data.rows || [];
                          const hasHeaders = headers.length > 0;
                          
                          sections.push(
                            <div key={`table-${index++}`} className="my-4 overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700">
                                {hasHeaders && (
                                  <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-800">
                                      {headers.map((cell, i) => (
                                        <th key={`th-${i}`} className="px-3 py-2 text-left text-xs font-medium uppercase">
                                          {cell}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                )}
                                <tbody>
                                  {rows.map((row, i) => (
                                    <tr key={`tr-${i}`} className={i % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}>
                                      {row.map((cell, j) => (
                                        <td key={`td-${i}-${j}`} className="px-3 py-2 text-sm border-r last:border-r-0">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        } catch (error) {
                          console.error('Error parsing table:', error);
                        }
                      }
                      return sections;
                    };
                    
                    return renderContent();
                  })()}
                </div>
              ) : 'No text content available'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}