import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";

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
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Detect theme changes
  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(darkModeMediaQuery.matches || document.documentElement.classList.contains('dark'));
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches || document.documentElement.classList.contains('dark'));
    };
    
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Also check for HTML class changes (for manual theme toggles)
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const htmlElement = mutation.target as HTMLElement;
          setIsDarkMode(htmlElement.classList.contains('dark'));
        }
      });
    });
    
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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
            <div className="p-4 text-center text-red-500">
              <p className="mb-2 font-medium">Failed to extract text</p>
              <p className={`text-sm ${
                isDarkMode ? 'text-muted-foreground' : 'text-gray-600'
              }`}>
                {error}
              </p>
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
