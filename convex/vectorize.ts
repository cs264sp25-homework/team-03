import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { getEmbedding } from "./openai";

export interface TextChunk {
  text: string; // the content of the chunk
  counts?: {
    // statistics about the text
    words: number;
    characters: number;
    tokens?: number;
  };
  position?: {
    // position of the text in the original text
    start: number; // start index of the chunk
    end: number; // end index of the chunk (inclusive)
  };
  metadata?: Record<string, string | number>; // metadata about the original text
}


//TODO: right now chunks only have tabId, no chatId, because a chunk could belong to multiple chats
//TODO: I am not sure what we should do down the line


function createChunks(
  text: string,
  chunkSize = 120,
  overlap = 20,
  metadata: Record<string, string | number> = {},
): TextChunk[] {
  const chunks: TextChunk[] = [];
  const words = text.split(/\s+/);
  const chunkWords = Math.floor(chunkSize);
  const overlapWords = Math.floor(overlap);

  for (let i = 0; i < words.length; i += chunkWords - overlapWords) {
    const startWordIndex = i;
    const endWordIndex = Math.min(i + chunkWords, words.length);
    const currentSlice = words.slice(startWordIndex, endWordIndex);
    const chunkText = currentSlice.join(" ");

    if (chunkText.length > 100) {
      chunks.push({
        text: chunkText,
        counts: {
          words: currentSlice.length,
          characters: chunkText.length,
        },
        position: {
          start: startWordIndex,
          end: endWordIndex - 1,
        },
        metadata,
      });
    }
  }
  return chunks;
}


export const process = internalAction({
  args: {
    tabId: v.id("tabs"),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Delete any chunks and embeddings for this tab
      await ctx.runMutation(internal.chunks.deleteChunksByTabId, {
        tabId: args.tabId,
      });

      // Create chunks
      await ctx.runMutation(api.tabs.updateTabStatus, {
        tabId: args.tabId,
        status: "chunking",
      });
      const chunks = createChunks(args.text);
      if (chunks.length === 0) {
        throw new Error("No valid chunks created from text");
      }

      // Generate embeddings
      await ctx.runMutation(api.tabs.updateTabStatus, {
        tabId: args.tabId,
        status: "embedding",
      });
      const embeddings = await getEmbedding(chunks.map(chunk => chunk.text));

      // Store chunks with embeddings
      for (let i = 0; i < chunks.length; i++) {
        await ctx.runMutation(internal.chunks.addChunk, {
          tabId: args.tabId,
          ...chunks[i],
          embedding: embeddings[i].embedding,
        });
      }

      // Set status to processed
      await ctx.runMutation(api.tabs.updateTabStatus, {
        tabId: args.tabId,
        status: "processed",
      });
    } catch (error) {
      console.error("Failed to process tab content:", error);
      await ctx.runMutation(api.tabs.updateTabStatus, {
        tabId: args.tabId,
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
});