import React, { useEffect, useState } from "react";
import MessageInput from "@/components/messages/message-input";
import MessageList from "@/components/messages/message-list";
import { cn } from "@/lib/utils";

const DEBUG = false;

interface MessagesProps {
  chatId: string;
  onBackToCollections?: () => void;
}

const MessagesPage: React.FC<MessagesProps> = ({ chatId, onBackToCollections }) => {
  const [selectionData, setSelectionData] = useState<{
    text: string;
    url: string;
    title: string;
  } | null>(null);

  const [collectionContext, setCollectionContext] = useState<{
    collectionId: string;
    collectionName: string;
    tabs: chrome.tabs.Tab[];
  } | null>(null);

  useEffect(() => {
    // Request any stored selection data
    chrome.runtime.sendMessage({ type: "getSelection" }, (response) => {
      if (response?.selection) {
        setSelectionData({
          text: response.selection.text,
          url: response.selection.url,
          title: response.selection.title
        });
      }
      
      // Check for collection context
      if (response?.collectionContext) {
        setCollectionContext(response.collectionContext);
      }
    });

    const handleMessage = (message: any) => {
      if (message.type === "selection") {
        setSelectionData({
          text: message.text,
          url: message.url,
          title: message.title
        });
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [chatId]);

  return (
    <div
      className={cn("flex flex-col h-full p-4 mb-2 bg-background", {
        "border border-red-500": DEBUG,
      })}
    >
      {onBackToCollections && collectionContext && (
        <div className="mb-4 flex items-center justify-between">
          <button 
            onClick={onBackToCollections}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Collections
          </button>
          <span className="text-sm font-medium text-foreground">
            Chat about <span className="font-bold text-primary">{collectionContext.collectionName}</span>
          </span>
        </div>
      )}
      <div
        className={cn("flex-1 overflow-auto mb-4", {
          "border border-blue-500": DEBUG,
        })}
      >
        <MessageList chatId={chatId} />
      </div>
      <MessageInput 
        chatId={chatId} 
        selectionData={selectionData}
        onSelectionHandled={() => setSelectionData(null)}
        collectionContext={collectionContext}
      />
    </div>
  );
};

export default MessagesPage;