import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-white/20 backdrop-blur supports-[backdrop-filter]:bg-white/10">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-black">
            Extracted Text Preview
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-700 truncate">
            {url}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto mt-4 p-4 rounded-lg bg-white/5">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
          ) : error ? (
            <div className="text-red-500 p-4 text-center">
              <p className="font-medium mb-2">Failed to extract text</p>
              <p className="text-sm text-gray-700">
                {error}
              </p>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm text-black">
              {text || 'No text content available'}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
