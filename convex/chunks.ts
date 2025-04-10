import {
    internalQuery,
    internalMutation,
    internalAction,
  } from "./_generated/server";
  import { internal } from "./_generated/api";
  import { v } from "convex/values";
  import { chunkSchema } from "./schema";
  import { Doc } from "./_generated/dataModel";
  import { getEmbedding } from "./openai";
  
  export const addChunk = internalMutation({
    args: chunkSchema,
    handler: async (ctx, args) => {
      const chunkId = await ctx.db.insert("chunks", args);
      console.log(chunkId);
      return chunkId;
    },
  });
  
  export const search = internalAction({
    args: {
      chatId: v.id("chats"),
      tabIds: v.optional(v.array(v.id("tabs"))),
      query: v.string(),
      limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
      const { query, limit = 5, tabIds, chatId } = args;
  
      const embeddings = await getEmbedding([query]);
  
      const results = await ctx.vectorSearch("chunks", "by_embedding", {
        vector: embeddings[0].embedding,
        limit: limit,
        filter: (q) => {
          if (!tabIds || tabIds.length === 0) {
            return q.eq("chatId", chatId);
          } else {
            return q.or(
              q.eq("chatId", chatId),
              ...tabIds.map((id) => q.eq("tabId", id))
            );
          }
        }
      });
  
      const chunks: Array<Doc<"chunks">> = await ctx.runQuery(
        internal.chunks.fetchResults,
        { ids: results.map((result) => result._id) },
      );
  
      return chunks.map((chunk, i) => ({
        text: chunk.text,
        score: results[i]._score,
      }));
    },
  });
  
  export const fetchResults = internalQuery({
    args: { ids: v.array(v.id("chunks")) },
    handler: async (ctx, args) => {
      const results = [];
      for (const id of args.ids) {
        const chunk = await ctx.db.get(id);
        if (chunk === null) {
          continue;
        }
        results.push(chunk);
      }
      return results;
    },
  });
  