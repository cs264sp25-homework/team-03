import { useMutation } from "convex/react";
import { useSessionId } from "convex-helpers/react/sessions";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

export function useUser() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [sessionId] = useSessionId();
  const createOrGetUser = useMutation(api.users.createOrGetUser);

  useEffect(() => {
    if (sessionId) {
      createOrGetUser({sessionId})
        .then(newUserId => {
          setUserId(newUserId);
          console.log("🔑 User ID:", newUserId);
        })
        .catch(console.error);
    }
  }, [sessionId, createOrGetUser]);

  return { userId, sessionId };
} 