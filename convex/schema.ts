import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

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

export default defineSchema({

  collections: defineTable({
    userId: v.id("users"),  // Each collection belongs to a user
    name: v.string(),      // Collection name (e.g., "AI Research Papers", "Shopping Wishlist")
    description: v.optional(v.string()), // Optional collection description
    createdAt: v.number(), // Timestamp
  }).index("by_user_id", ["userId"]),

  tabs: defineTable({
    collectionId: v.id("collections"),
    url: v.string(),
    name: v.optional(v.string()), 
    content: v.optional(v.string()),
    error: v.optional(v.string()),
  })
  .index("by_collection_id", ["collectionId"]),
  
  chats: defineTable({
    collectionId: v.id("collections"), // Chat belongs to a collection
    title: v.string(),
    description: v.optional(v.string()),
    messageCount: v.number(),
    fileCount: v.number(),
  }).index("by_collection_id", ["collectionId"]),

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
