import { createOpenAI, openai } from "@ai-sdk/openai";
import { embedMany, streamText } from "ai";
import { tool } from "ai";
import { internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { z } from "zod";
import { Id } from "./_generated/dataModel";
import { SessionId } from "convex-helpers/server/sessions";


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

1. **Be Concise and Direct**:
    - Keep responses brief and to the point
    - Only answer what was specifically asked
    - Avoid unnecessary explanations or tangents
    - Use bullet points for multiple items
    - If a question is ambiguous, ask for clarification with a single, direct question

2. **Tab-Related Questions**: 
    - Answer questions about the user's open tabs
    - Use the \`search\` function to find relevant information in tab content
    - Include source references using: \`[tab name](tab url)\`
    - Keep tab-related answers focused on the specific question

3. **General Questions**:
    - Answer general questions using your knowledge base
    - Be clear when distinguishing between tab-specific and general knowledge
    - Keep answers brief and relevant to the question

4. **Polite and Helpful Tone**:
    - Maintain a friendly and professional demeanor
    - Be transparent about uncertainty
    - Offer follow-up assistance when needed

5. **Context Awareness**:
    - Consider the current tab group context if provided
    - Stay updated with any tab content changes

Remember: Be concise, direct, and only answer what was asked.`;

export const completion = internalAction({
  args: {
    sessionId: v.string(),
    chatId: v.id("chats"),
    tabUrls: v.optional(v.array(v.string())),
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
    console.log("Completion handler received args:", {
      sessionId: args.sessionId,
      chatId: args.chatId,
      tabUrls: args.tabUrls,
      messagesCount: args.messages.length,
      placeholderMessageId: args.placeholderMessageId
    });

    // Get tabs for this session
    const tabs = await ctx.runQuery(api.tabs.getAll, {
      sessionId: args.sessionId as SessionId,
    });

    //console.log("All tabs:", tabs.map(tab => ({ url: tab.url, id: tab._id })));
    //console.log("Received tabUrls:", args.tabUrls);

    // Filter tabs based on tabUrls if provided
    const filteredTabs = args.tabUrls && args.tabUrls.length > 0
      ? tabs.filter(tab => args.tabUrls?.includes(tab.url))
      : tabs;

    //console.log("Filtered tabs:", filteredTabs.map(tab => ({ url: tab.url, id: tab._id })));
    
    
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      compatibility: "strict", 
    });

    const { textStream } = streamText({
      model: openai("gpt-4o-mini"),
      tools: {
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
              tabIds: filteredTabs.map(tab => tab._id),
            });
          },
        }),
      },
      messages: [
        {
          role: "system",
          content: ASSISTANT_INSTRUCTIONS,
        },
        ...args.messages,
      ],
      maxSteps: 10,
      temperature: 0,
      onStepFinish: ({ 
        text, 
        reasoning,
        sources,
        toolCalls, 
        toolResults, 
        finishReason, 
        usage,
        warnings,
        logprobs,
        request,
        response,
        providerMetadata,
        stepType,
        isContinued,
      }) => {
        console.log("Text", text);
        console.log("Tool calls:", toolCalls);
        console.log("Tool results:", toolResults);
        console.log("Reasoning:", reasoning);
        console.log("Sources:", sources);
        console.log("Finish reason:", finishReason);
        console.log("Usage:", usage);
        console.log("Warnings:", warnings);
        console.log("Logprobs:", logprobs);
        console.log("Request:", request);
        console.log("Response:", response);
        console.log("Provider metadata:", providerMetadata);
        console.log("Step type:", stepType);
        console.log("Is continued:", isContinued);
      },
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

