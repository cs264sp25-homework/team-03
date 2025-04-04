import { ConvexError } from "convex/values";
import { QueryCtx } from "../_generated/server";
import { SessionId } from "convex-helpers/server/sessions";
import { getUser } from "../lib/sessions";


/**
 * Helper function to get the user from a session.
 * Throws an error if no valid session exists.
 */
export const authenticationGuard = async (ctx: QueryCtx, sessionId: SessionId) => {
  const user = await getUser(ctx, sessionId);

  if (!user) {
    throw new ConvexError({
      message: "Invalid session",
      code: 401,
    });
  }

  return user._id;
}; 