import React, { useState, useEffect, useRef } from "react";
import MessageInput from "@/components/messages/message-input";
import MessageList from "@/components/messages/message-list";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const DEBUG = false;

interface MessagesProps {
  chatId: string;
  onBack?: () => void;
}

const MessagesPage: React.FC<MessagesProps> = ({ chatId, onBack }) => {
  const [showBackButton, setShowBackButton] = useState(false);
  const lastScrollY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    // Show back button when scrolling up
    setShowBackButton(currentScrollY < lastScrollY.current && currentScrollY > 100);
    lastScrollY.current = currentScrollY;
  };

  return (
    <div
      className={cn("flex flex-col h-full bg-background", {
        "border border-red-500": DEBUG,
      })}
    >
      {onBack && (
        <div 
          className={cn(
            "sticky top-0 z-10 bg-background border-b transition-all duration-200",
            showBackButton ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
          )}
        >
          <div className="flex items-center justify-between px-4 py-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={cn("flex-1 overflow-auto p-4", {
          "border border-blue-500": DEBUG,
        })}
      >
        <MessageList chatId={chatId} />
      </div>
      <div className="p-4 border-t">
        <MessageInput chatId={chatId} />
      </div>
    </div>
  );
};

export default MessagesPage;