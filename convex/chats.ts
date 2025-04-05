import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { ownershipGuard } from "./guards/ownership_guards";
import { authenticationGuard } from "./guards/auth";
import { mutationWithSession, queryWithSession } from "./lib/sessions";

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


export const create = mutationWithSession({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    const chatId = await ctx.db.insert("chats", {
      userId,  // Associate chat with the authenticated user
      title: args.title,
      description: args.description,
      messageCount: 0,
      tabCount: 0,
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
    
    // Delete the chat
    await ctx.db.delete(args.chatId);
  },
});
