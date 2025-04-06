import { ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";

/**
 * Check if the chat is owned by the user and throw an error if not.
 */
export const ownershipGuard = (
  userId: Id<"users">,
  resourceUserId: Id<"users">,
): void => {
  if (resourceUserId !== userId) {
    throw new ConvexError({
      message: "Not authorized to access this resource",
      code: 403,
    });
  }
}; 