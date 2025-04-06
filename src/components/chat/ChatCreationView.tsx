import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface ChatCreationViewProps {
  onCreateChat: () => void;
}

export function ChatCreationView({ onCreateChat }: ChatCreationViewProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <p className="text-muted-foreground">No chat found</p>
      <Button
        onClick={onCreateChat}
        size="lg"
        className="gap-2"
      >
        Create New Chat
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
} 