import { MessageType } from "@/types/message";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { useSessionQuery } from "convex-helpers/react/sessions";

export function useQueryMessage(messageId: Id<"messages">) {
  const message = useSessionQuery(api.messages.getOne, {
    messageId,
  });

  return {
    data: message as MessageType,
    loading: message === undefined,
    error: message === null,
  };
}
