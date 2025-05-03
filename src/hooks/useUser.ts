import { useMutation } from "convex/react";
import { useSessionId } from "convex-helpers/react/sessions";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { toast } from "sonner";

export function useUser() {
  const [userId, setUserId] = useState<Id<"users"> | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [sessionId] = useSessionId();
  const createOrGetUser = useMutation(api.users.createOrGetUser);

  useEffect(() => {
    // Reset state when session ID changes
    if (sessionId) {
      setIsInitializing(true);
      setError(null);
      
      createOrGetUser({ sessionId })
        .then((newUserId: Id<"users">) => {
          setUserId(newUserId);
          console.log("🔑 User ID:", newUserId);
        })
        .catch((err) => {
          console.error("Failed to initialize user session:", err);
          setError(err);
          toast.error("Failed to initialize user session. Please refresh the extension.");
        })
        .finally(() => {
          setIsInitializing(false);
        });
    } else {
      // No session ID yet
      setUserId(null);
      setIsInitializing(true);
    }
  }, [sessionId, createOrGetUser]);

  return { 
    userId, 
    sessionId, 
    isInitializing,
    error,
    isAuthenticated: !!userId && !isInitializing
  };
} 