import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { vSessionId } from "convex-helpers/server/sessions";

export const tabStatuses = v.union(
  v.literal("pending"),
  v.literal("processing"),
  v.literal("text extracted"),
  v.literal("chunking"),
  v.literal("embedding"),
  v.literal("processed"),
  v.literal("failed"),
);

//TODO: tabGroups not implemented yet

export const chunkSchema = {
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
  
  // Favorites table to store user's favorite tabs
  favorites: defineTable({
    userId: v.id("users"),  // Each favorite belongs to a user
    tabId: v.number(),      // Chrome tab ID
    url: v.string(),        // Tab URL
    title: v.string(),      // Tab title
    favIconUrl: v.optional(v.string()), // Tab favicon URL
  })
  .index("by_user_id", ["userId"])
  .index("by_user_and_tab_id", ["userId", "tabId"])
  .index("by_user_and_url", ["userId", "url"]),


  tabGroups: defineTable({
    userId: v.id("users"),  // Each tab group belongs to a user
    name: v.string(),
    description: v.optional(v.string()),
    chatId: v.optional(v.id("chats")),  // Optional: link to a chat
  }).index("by_user_id", ["userId"]),

  tabs: defineTable({
    userId: v.id("users"),  // Each tab belongs to a user
    url: v.string(),
    name: v.optional(v.string()), 
    content: v.optional(v.string()),
    error: v.optional(v.string()),
    status: tabStatuses,
    favIconUrl: v.optional(v.string()), // Tab favicon URL
  })
  .index("by_user_id", ["userId"])
  .index("by_user_and_url", ["userId", "url"]),
  
  chats: defineTable({
    userId: v.id("users"),  // Each chat belongs to a user
    tabGroupId: v.optional(v.id("tabGroups")),  //Optional: Link chat to a tab group
    title: v.string(),
    description: v.optional(v.string()),
    messageCount: v.number(),
    tabCount: v.optional(v.number()),  // Number of tabs associated with this chat
  })
  .index("by_user_id", ["userId"])
  .index("by_group_id", ["tabGroupId"]),

  messages: defineTable({
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
  }).index("by_chat_id", ["chatId"]),

  chunks: defineTable(chunkSchema)
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["tabId"],
    })
    .index("by_tab_id", ["tabId"]),

  tabGroupMembers: defineTable({
    tabId: v.id("tabs"),
    tabGroupId: v.id("tabGroups"),
    tabUrl: v.string(),
    addedAt: v.number(),
  })
  .index("by_tab_group", ["tabGroupId"])
  .index("by_tab", ["tabId"])
  .index("by_tab_group_and_url", ["tabGroupId", "tabUrl"]),
});
