import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";

/*export const chunkSchema = {
  pageId: v.id("pages"),
  chatId: v.id("chats"),
  text: v.string(),
  counts: v.optional(
    v.object({
      words: v.number(),
      characters: v.number(),
      tokens: v.optional(v.number()),
    })
  ),
  position: v.optional(
    v.object({
      start: v.number(),
      end: v.number(),
    })
  ),
  metadata: v.optional(v.record(v.string(), v.any())),
  embedding: v.array(v.float64()),
};*/

//update: the schema is a user can have many tabs, a user can have one and only one chat based on those tabs
export default defineSchema({
  users: defineTable({
    // Note: make sure not to leak this to clients. See this post for more info:
    // https://stack.convex.dev/track-sessions-without-cookies
    sessionId: vSessionId,
  }).index("by_sessionId", ["sessionId"]),

  tabs: defineTable({
    userId: v.id("users"),  // Each tab belongs to a user
    url: v.string(),
    name: v.optional(v.string()), 
    content: v.optional(v.string()),
    error: v.optional(v.string()),
  })
  .index("by_user_id", ["userId"]),
  
  chats: defineTable({
    userId: v.id("users"),  // Each chat belongs to a user
    title: v.string(),
    description: v.optional(v.string()),
    messageCount: v.number(),
    tabCount: v.number(),
  }) .index("by_user_id", ["userId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  }).index("by_chat_id", ["chatId"]),

  /*chunks: defineTable(chunkSchema).vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 1536,
    filterFields: ["pageId", "chatId"],
  }).index("by_page_id", ["pageId"]),*/
});
