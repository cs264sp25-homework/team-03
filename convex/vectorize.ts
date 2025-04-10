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
  metadata?: Record<string, any>; // metadata about the original text
}


//TODO: right now chunks only have tabId, no chatId, because a chunk could belong to multiple chats
//TODO: I am not sure what we should do down the line


function createChunks(
  text: string,
  chunkSize = 120,
  overlap = 20,
  metadata: Record<string, any> = {},
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
   // console.log("Starting vectorization for tab", args.tabId);
    
    const chunks = createChunks(args.text);
    //console.log("Created", chunks.length, "chunks");

    const embeddings = await getEmbedding(chunks.map(chunk => chunk.text));
    //console.log("Got embeddings for chunks");

    for (let i = 0; i < chunks.length; i++) {
      const chunkId = await ctx.runMutation(internal.chunks.addChunk, {
        tabId: args.tabId,
        text: chunks[i].text,
        counts: chunks[i].counts,
        position: chunks[i].position,
        metadata: chunks[i].metadata,
        embedding: embeddings[i].embedding,
      });
     // console.log("Added chunk", chunkId);
    }
  },
});