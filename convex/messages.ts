import { v,ConvexError } from "convex/values";
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { authenticationGuard } from "./guards/auth";
import { queryWithSession } from "./lib/sessions";
import { mutationWithSession } from "./lib/sessions";


export const getAll = queryWithSession({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);

    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new Error("Chat not found");
    }

     // Verify chat ownership
    if (chat.userId !== userId) {
      throw new Error("Not authorized to access this chat's messages");
    }
    

    return ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .collect();
  },
});


export const getOne = queryWithSession({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Get the message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      throw new ConvexError({
        message: "Message not found",
        code: 404,
      });
    }

    // Get the chat to verify ownership
    const chat = await ctx.db.get(message.chatId);
    if (!chat) {
      throw new ConvexError({
        message: "Associated chat not found",
        code: 404,
      });
    }

    // Verify chat ownership
    if (chat.userId !== userId) {
      throw new ConvexError({
        message: "Not authorized to access this message",
        code: 403,
      });
    }

    return message;
  },
});



export const simulatedResponse = internalMutation({
  args: {
    messageId: v.id("messages"),
    userMessage: v.string(),
    tabUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Generate a simulated response based on the user's message
    const userMessage = args.userMessage.toLowerCase();
    let response = "I'm sorry, I don't have a specific answer for that question. Could you try asking something else?";
    
    // Simple pattern matching for common questions
    if (userMessage.includes("hello") || userMessage.includes("hi")) {
      response = "Hello! How can I help you today?";
    } else if (userMessage.includes("how are you")) {
      response = "I'm doing well, thank you for asking! How can I assist you?";
    } else if (userMessage.includes("help") || userMessage.includes("can you")) {
      response = "I'd be happy to help! I can answer questions about your tabs, provide information, or assist with various tasks. What would you like to know?";
    } else if (userMessage.includes("tab") || userMessage.includes("tabs")) {
      const tabCount = args.tabUrls ? args.tabUrls.length : "several";
      response = `I can see you have ${tabCount} tabs open. I can help you organize them or find specific information in them. What would you like to do with your tabs?`;
    } else if (userMessage.includes("collection") || userMessage.includes("collections")) {
      response = "Collections are a great way to organize related tabs. You can create collections, add tabs to them, and easily access them later. Would you like to know more about how to use collections?";
    } else if (userMessage.includes("search") || userMessage.includes("find")) {
      response = "I can help you search for information across your tabs. What specific information are you looking for?";
    } else {
      // Generate a more generic response for other queries
      const responses = [
        "I understand you're asking about that. Let me help you with this question.",
        "That's an interesting question! Here's what I can tell you about it.",
        "I'd be happy to help with that. Here's some information that might be useful.",
        "Great question! Let me provide some insights on this topic.",
        "I can certainly help with that. Here's what you should know.",
      ];
      response = responses[Math.floor(Math.random() * responses.length)];
      response += "\n\nIn a real implementation, I would connect to the OpenAI API to generate a more specific and helpful response based on your question and the context of your tabs. For now, this is a simulated response for development purposes.";
    }
    
    // Update the message with our simulated response
    await ctx.db.patch(args.messageId, {
      content: response,
    });
    
    return response;
  },
});

export const create = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    sessionId: v.string(),
    tabUrls: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if the chat exists
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      throw new ConvexError({
        code: 404,
        message: "Chat not found",
      });
    }

    // Get all messages in the chat so far
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .collect();

    // Store the user message
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content,
      role: "user",
    });

    // Create a placeholder for the assistant's response
    const placeholderMessageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: "...",
      role: "assistant",
    });

    // Update the chat message count
    await ctx.db.patch(args.chatId, {
      messageCount: chat.messageCount + 2,
    });

    // Schedule an action that calls ChatGPT and updates the message
    console.log("Sending to completion with tabUrls:", args.tabUrls);
    console.log("Full completion args:", {
      sessionId: args.sessionId,
      chatId: args.chatId,
      tabUrls: args.tabUrls,
      messages: [
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "user",
          content: args.content,
        },
      ],
      placeholderMessageId,
    });

    // Always try to use the OpenAI API first since the API key is provided in Convex Environment Variables
    console.log("Using OpenAI API with the provided API key");
    ctx.scheduler.runAfter(0, internal.openai.completion, {
      sessionId: args.sessionId,
      chatId: args.chatId,
      tabUrls: args.tabUrls,
      messages: [
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: "user",
          content: args.content,
        },
      ],
      placeholderMessageId,
    });

    
    console.log("tabUrls", args.tabUrls);

    return messageId;
  },
});



export const update = internalMutation({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      content: args.content,
    });
  },
});
