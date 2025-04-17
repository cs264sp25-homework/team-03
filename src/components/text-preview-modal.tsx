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
    if (isOpen) {
      const storedTheme = localStorage.getItem('theme');
      const hasDarkClass = document.documentElement.classList.contains('dark');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      
      if (storedTheme === 'dark' || (storedTheme === 'system' && prefersDark) || (!storedTheme && hasDarkClass)) {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (theme === 'dark') {
      setIsDarkMode(true);
    } else if (theme === 'light') {
      setIsDarkMode(false);
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, [theme]);
  
  useEffect(() => {
    if (theme !== 'system') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

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
            <div className={`whitespace-pre-wrap text-sm font-medium ${
              isDarkMode ? 'text-foreground' : 'text-gray-800'
            }`}>
              {text || 'No text content available'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}