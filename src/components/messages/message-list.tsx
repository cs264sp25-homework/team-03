import { useQueryMessages } from "@/hooks/use-query-messages";
import { useCallback, useEffect, useRef, useState } from "react";
import Loading from "@/components/loading";
import Empty from "@/components/empty";
import Message from "@/components/messages/message";
import { cn } from "@/lib/utils";
import { Id } from "convex/_generated/dataModel";

interface MessageListProps {
  chatId: string;
}

const MessageList: React.FC<MessageListProps> = ({ chatId }) => {
  const firstMessageId = useRef<string | null>(null);
  const lastMessageId = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTopValue = useRef(0);
  const isUserScrolling = useRef(false);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const [scrollDirection, setScrollDirection] = useState<"down" | "up" | null>(
    null,
  );

  const {
    data: messages, // array of messages
    loading, // boolean indicating if the messages are being loaded for the first time
    error, // boolean indicating if there's an error loading messages
  } = useQueryMessages(chatId as Id<"chats">);

  const scrollToMessage = useCallback(
    (
      messageId: string | null,
      block: "start" | "center" | "end" | "nearest" = "end",
    ) => {
      if (!messageId) return;
      const messageElement = document.querySelector(
        `[data-message-id="${messageId}"]`,
      );

      if (messageElement) {
        messageElement.scrollIntoView({
          behavior: "smooth",
          block,
          inline: "nearest",
        });
      }
    },
    [],
  );

  useEffect(
    () => {
      // when messages change, we might want to scroll to the bottom
      if (!messages || messages.length <= 0) return;

      // if we never stored the last or first message id, store it
      if (!lastMessageId.current || !firstMessageId.current) {
        lastMessageId.current = messages[messages.length - 1]._id;
        firstMessageId.current = messages[0]._id;
        scrollToMessage(lastMessageId.current);
        return;
      }

      const firstMessage = messages[0];
      const lastMessage = messages[messages.length - 1];

      // Always scroll to bottom for new messages unless user is actively scrolling up
      if (lastMessage._id !== lastMessageId.current) {
        lastMessageId.current = lastMessage._id;
        if (!isUserScrolling.current || scrollDirection === "down") {
          scrollToMessage(lastMessageId.current);
        }
      } else if (firstMessage._id !== firstMessageId.current) {
        // if the first message is new, user loaded earlier messages
        firstMessageId.current = firstMessage._id;
        if (isUserScrolling.current && scrollDirection === "up") {
          scrollToMessage(firstMessageId.current, "center");
        }
      }
    },
    [messages, scrollToMessage],
  );

  const handleOnScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    isUserScrolling.current = true;

    if (scrollTopValue.current < e.currentTarget.scrollTop) {
      setScrollDirection("down");
    } else {
      setScrollDirection("up");
    }

    scrollTopValue.current = e.currentTarget.scrollTop;

    // Set a new timeout to reset isUserScrolling
    scrollTimeout.current = setTimeout(() => {
      isUserScrolling.current = false;
    }, 150);
  };

  if (loading) return <Loading />;
  if (error) return <Empty message="Error loading messages" />;
  if (messages.length === 0) return <Empty message="What can I help with?" />;
  
  return (
    <div
      ref={containerRef}
      className={cn("h-full overflow-y-auto scroll-smooth")}
      onScroll={handleOnScroll}
    >
      {messages.map((message) => (
        <div key={message._id} data-message-id={message._id}>
          <Message message={message} />
        </div>
      ))}
    </div>
  );
};

export default MessageList;