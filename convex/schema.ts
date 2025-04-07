import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";


//TODO: tabGroups not implemented yet

export const chunkSchema = {
  chatId: v.id("chats"),
  tabId: v.id("tabs"),
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
};


//the schema is a user can have many tabs,
// a tab group can have many tabs
// a tab group can have one and only one chat



export default defineSchema({
  users: defineTable({
    // Note: make sure not to leak this to clients. See this post for more info:
    // https://stack.convex.dev/track-sessions-without-cookies
    sessionId: vSessionId,
  }).index("by_sessionId", ["sessionId"]),

  tabGroups: defineTable({
    userId: v.id("users"),  // Each tab group belongs to a user
    name: v.string(),
    description: v.optional(v.string()),
    chatId: v.optional(v.id("chats")),  // Optional: link to a chat
  }).index("by_user_id", ["userId"]),


  tabs: defineTable({
    userId: v.id("users"),  // Each tab belongs to a user
    groupId: v.optional(v.id("tabGroups")), // Optional: Link to its group
    url: v.string(),
    name: v.optional(v.string()), 
    content: v.optional(v.string()),
    error: v.optional(v.string()),
  })
  .index("by_user_id", ["userId"])
  .index("by_group_id", ["groupId"])
  .index("by_user_and_url", ["userId", "url"]),
  
  
  chats: defineTable({
    userId: v.id("users"),  // Each chat belongs to a user
    groupId: v.optional(v.id("tabGroups")),  //Optional: Link chat to a tab group
    title: v.string(),
    description: v.optional(v.string()),
    messageCount: v.number(),
    tabCount: v.number(),
  }) 
  .index("by_user_id", ["userId"])
  .index("by_group_id", ["groupId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  }).index("by_chat_id", ["chatId"]),

  
  chunks: defineTable(chunkSchema)
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["chatId", "tabId"],
    })
    .index("by_chat_id", ["chatId"])
    .index("by_tab_id", ["tabId"])
});
