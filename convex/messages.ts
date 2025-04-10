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



export const create = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    sessionId: v.string(),
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
    ctx.scheduler.runAfter(0, internal.openai.completion, {
      sessionId: args.sessionId,
      chatId: args.chatId,
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
