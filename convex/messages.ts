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

    // Get tab URLs from the associated tab group if it exists
    let tabUrls: string[] | undefined;
    if (chat.tabGroupId) {
      const tabs = await ctx.runQuery(internal.tabGroupMembers.getTabsInGroup, {
        tabGroupId: chat.tabGroupId
      });
      tabUrls = tabs.map(tab => tab.url);
    }

    // Schedule an action that calls ChatGPT and updates the message
    ctx.scheduler.runAfter(0, internal.openai.completion, {
      sessionId: args.sessionId,
      chatId: args.chatId,
      tabUrls,
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

export const updateContent = mutationWithSession({
  args: {
    messageId: v.id("messages"),
    content: v.string(),
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
        message: "Not authorized to update this message",
        code: 403,
      });
    }

    // Refuse to update assistant messages
    if (message.role === "assistant") {
      throw new ConvexError({
        message: "Cannot update assistant messages directly",
        code: 400,
      });
    }

    // Get all subsequent messages
    const subsequentMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", message.chatId))
      .filter((q) => q.gt(q.field("_creationTime"), message._creationTime))
      .collect();

    // Delete the original message and all subsequent messages
    const messagesToDelete = [message._id, ...subsequentMessages.map(m => m._id)];
    for (const messageId of messagesToDelete) {
      await ctx.db.delete(messageId);
    }

    // Update chat message count
    await ctx.db.patch(chat._id, {
      messageCount: chat.messageCount - messagesToDelete.length + 1
    });

    // Get all messages in the chat up to this point
    const previousMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", message.chatId))
      .filter((q) => q.lt(q.field("_creationTime"), message._creationTime))
      .collect();

    // Create a new message with the updated content
    const newMessageId = await ctx.db.insert("messages", {
      chatId: message.chatId,
      content: args.content,
      role: "user",
    });

    // Create a placeholder for the assistant's response
    const placeholderMessageId = await ctx.db.insert("messages", {
      chatId: message.chatId,
      content: "...",
      role: "assistant",
    });

    // Get tab URLs from the associated tab group if it exists
    let tabUrls: string[] | undefined;
    if (chat.tabGroupId) {
      const tabs = await ctx.runQuery(internal.tabGroupMembers.getTabsInGroup, {
        tabGroupId: chat.tabGroupId
      });
      tabUrls = tabs.map(tab => tab.url);
    }

    // Schedule an action that calls ChatGPT and updates the message
    ctx.scheduler.runAfter(0, internal.openai.completion, {
      sessionId: ctx.sessionId,
      chatId: message.chatId,
      tabUrls,
      messages: [
        ...previousMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        {
          role: "user",
          content: args.content,
        },
      ],
      placeholderMessageId,
    });

    return newMessageId;
  },
});
