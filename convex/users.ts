import { mutationWithSession } from "./lib/sessions";

export const createOrGetUser = mutationWithSession({
  args: {},
  handler: async ({ db, sessionId }) => {
    // Check if user already exists with this sessionId
    const existingUser = await db
      .query("users")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .unique();

    if (existingUser) {
      return existingUser._id;
    }

    // Create new user if doesn't exist
    const userId = await db.insert("users", { sessionId });
    return userId;
  },
}); 