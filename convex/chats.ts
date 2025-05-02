import { v } from "convex/values";
import { ownershipGuard } from "./guards/ownership_guards";
import { authenticationGuard } from "./guards/auth";
import { mutationWithSession, queryWithSession } from "./lib/sessions";
import { internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ctx.user and ctx.sessionId come with mutationWithSession and queryWithSession functions

export const getAll = queryWithSession({
  args: {},
  handler: async (ctx) => {
    // Get user ID from session
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Get all chats for this user
    const chats = await ctx.db.query("chats")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .collect();
    
    return chats;
  },
});

export const getOne = queryWithSession({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) return null;

    // Check if user owns this chat
    ownershipGuard(userId, chat.userId);
    
    return chat;
  },
});

export const getUserChat = queryWithSession({
  args: {},
  handler: async (ctx) => {
    // Get user ID from session
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Get the first chat for this user (default chat)
    const chat = await ctx.db.query("chats")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();
    
    return chat;
  },
});

export const create = mutationWithSession({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    tabGroupId: v.optional(v.id("tabGroups")),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // If groupId provided, verify it exists and belongs to user
    if (args.tabGroupId) {
      const group = await ctx.db.get(args.tabGroupId);
      if (!group) throw new Error("Group not found");
      ownershipGuard(userId, group.userId);
    }
    
    const chatId = await ctx.db.insert("chats", {
      userId,
      title: args.title,
      description: args.description,
      tabGroupId: args.tabGroupId,
      messageCount: 0,
     
    });
    return chatId;
  },
});

// Internal function to create a chat for a tab group
export const createForTabGroup = internalMutation({
  args: {
    userId: v.id("users"),
    groupName: v.string(),
    groupDescription: v.optional(v.string()),
    tabGroupId: v.id("tabGroups"),
  },
  handler: async (ctx, args) => {
    const chatId = await ctx.db.insert("chats", {
      userId: args.userId,
      title: `Chat for ${args.groupName}`,
      description: args.groupDescription,
      messageCount: 0,
      tabGroupId: args.tabGroupId,
    });
    return chatId;
  },
});

export const update = mutationWithSession({
  args: {
    chatId: v.id("chats"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Get the chat to check ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    // Verify ownership
    ownershipGuard(userId, chat.userId);
    
    // Update the chat
    await ctx.db.patch(args.chatId, {
      title: args.title,
      description: args.description,
    });
  },
});

export const remove = mutationWithSession({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Get the chat to check ownership
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Chat not found");

    // Verify ownership
    ownershipGuard(userId, chat.userId);
    
    // First delete all messages in this chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", q => q.eq("chatId", args.chatId))
      .collect();

    await Promise.all(messages.map(message => ctx.db.delete(message._id)));
    
    // Then delete the chat
    await ctx.db.delete(args.chatId);
  },
});

// Internal function to remove a chat and its messages
export const removeInternal = internalMutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    // First delete all messages in this chat
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", q => q.eq("chatId", args.chatId))
      .collect();

    await Promise.all(messages.map(message => ctx.db.delete(message._id)));
    
    // Then delete the chat
    await ctx.db.delete(args.chatId);
  },
});
