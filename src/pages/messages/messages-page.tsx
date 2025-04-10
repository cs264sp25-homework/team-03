import React, { useEffect, useState } from "react";
import MessageInput from "@/components/messages/message-input";
import MessageList from "@/components/messages/message-list";
import { cn } from "@/lib/utils";

const DEBUG = false;

interface MessagesProps {
  chatId: string;
}

const MessagesPage: React.FC<MessagesProps> = ({ chatId }) => {
  const [selectionData, setSelectionData] = useState<{
    text: string;
    url: string;
    title: string;
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
      />
    </div>
  );
};

export default MessagesPage;