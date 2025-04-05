import { createOpenAI, openai } from "@ai-sdk/openai";
import { embedMany, streamText } from "ai";
//import { tool } from "ai";
import { internalAction } from "./_generated/server";
import {  internal } from "./_generated/api";
//import { api } from "./_generated/api";
import { v } from "convex/values";

//import { Id } from "./_generated/dataModel";

export interface TextEmbedding {
  text: string;
  embedding: number[];
}

// Generates embeddings for text using OpenAI's API
export async function getEmbedding(text: string[]): Promise<TextEmbedding[]> {
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: text,
  });

  return embeddings.map((embedding, index) => ({
    text: text[index],
    embedding,
  }));
}

export interface ContentAnalysis {
  summary: string;
  questions: string[];
}

//TODO: example of function call 
/*export async function analyzeContent(text: string): Promise<ContentAnalysis> {

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    compatibility: "strict",
  });

  const { textStream } = streamText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that creates summaries and questions about content. Please provide your response in JSON format with 'summary' and 'questions' fields.",
      },
      {
        role: "user",
        content: `Please analyze this text and provide:
1. A 1-3 paragraph summary
2. 3-5 specific questions that could initiate informative conversations about the content

Text to analyze:
${text}`,
      },
    ],
    temperature: 0.7,
  });

  console.log("text stream");


  let fullResponse = "";
  for await (const delta of textStream) {
    fullResponse += delta;
  }

  const cleanResponse = fullResponse
    .replace(/```json\n/, '')
    .replace(/```$/, '')
    .trim();

  // Change this line to use cleanResponse instead of fullResponse
  const analysis = JSON.parse(cleanResponse);
  
  console.log("analysis:", analysis);
  console.log("summary:", analysis.summary);
  console.log("questions:", analysis.questions);

  return {
    summary: analysis.summary,
    questions: analysis.questions,
  };
}
*/

// Define instructions at the top of the file
const ASSISTANT_INSTRUCTIONS = `You are a helpful assistant designed to answer questions about tabs and provide general assistance.

### Key Responsibilities:

1. **Tab-Related Questions**: 
    - Answer questions about the user's open tabs
    - Use the \`search\` function to find relevant information in tab content
    - If a question is ambiguous, ask for clarification
    - Include source references using: \`[tab name](tab url)\`

2. **General Questions**:
    - Answer general questions using your knowledge base
    - Be clear when distinguishing between tab-specific and general knowledge

3. **Polite and Helpful Tone**:
    - Maintain a friendly and professional demeanor
    - Be transparent about uncertainty
    - Offer follow-up assistance when needed

4. **Context Awareness**:
    - Consider the current tab group context if provided
    - Stay updated with any tab content changes`;

export const completion = internalAction({
  args: {
    chatId: v.id("chats"),
    messages: v.array(
      v.object({
        role: v.union(
          v.literal("system"),
          v.literal("user"),
          v.literal("assistant"),
        ),
        content: v.string(),
      }),
    ),
    placeholderMessageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    // TODO: Get tabs for this chat
    
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: "strict", 
    });

    const { textStream } = streamText({
      model: openai("gpt-4o-mini"),
      // TODO: Implement chunks search functionality
      /*tools: {
        search: tool({
          description: "Given a query, return the most relevant information from the tabs",
          parameters: z.object({
            query: z.string().describe("The query to search the tabs for"),
            tabIds: z.optional(z.array(z.string())).describe("The ids of the tabs to search"),
          }),
          execute: async ({ query, tabIds }) => {
            await ctx.runMutation(internal.messages.update, {
              messageId: args.placeholderMessageId,
              content: `🔍 Searching tabs...`,
            });
            return ctx.runAction(internal.chunks.search, {
              query,
              tabIds: tabIds?.map((id) => id as Id<"tabs">),
              chatId: args.chatId,
            });
          },
        }),
      }, */
      messages: [
        {
          role: "system",
          content: ASSISTANT_INSTRUCTIONS,
        },
        ...args.messages,
      ],
      maxSteps: 10,
      temperature: 0,
    });

    let fullResponse = "";
    for await (const delta of textStream) {
      fullResponse += delta;
      await ctx.runMutation(internal.messages.update, {
        messageId: args.placeholderMessageId,
        content: fullResponse,
      });
    }
  },
});

