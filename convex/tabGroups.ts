import { v } from "convex/values";
import { mutationWithSession, queryWithSession } from "./lib/sessions";
import { authenticationGuard } from "./guards/auth";
import { ownershipGuard } from "./guards/ownership_guards";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { SessionId } from "convex-helpers/server/sessions";


export const getAll = queryWithSession({
  args: {},
  handler: async (ctx) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // Get all groups for this user
    const groups = await ctx.db
      .query("tabGroups")
      .withIndex("by_user_id", q => q.eq("userId", userId))
      .collect();
    
    return groups;
  }
});

export const getOne = queryWithSession({
  args: {
    tabGroupId: v.id("tabGroups"),
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    const tab = await ctx.db.get(args.tabGroupId);
    if (!tab) return null;
   
    ownershipGuard(userId, tab.userId);

    return tab;
  },
});




export const create = mutationWithSession({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx & { sessionId: SessionId }, args: { name: string; description?: string }): Promise<Id<"tabGroups">> => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    // First create the tab group
    const tabGroupId = await ctx.db.insert("tabGroups", {
      userId,
      name: args.name,
      description: args.description,
    });
    
    // Then create a chat for this group
    const chatId = await ctx.runMutation(internal.chats.createForTabGroup, {
      userId,
      groupName: args.name,
      groupDescription: args.description,
      tabGroupId,
    }) as Id<"chats">;
    
    // Update the tab group with the chat ID
    await ctx.db.patch(tabGroupId, {
      chatId
    });
    
    return tabGroupId;
  }
});

export const update = mutationWithSession({
  args: {
    tabGroupId: v.id("tabGroups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    chatId: v.optional(v.id("chats"))
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    const group = await ctx.db.get(args.tabGroupId);
    if (!group) throw new Error("Group not found");
    
    // Verify ownership
    ownershipGuard(userId, group.userId);

    // If changing chat, verify new chat exists and belongs to user
    if (args.chatId) {
      const chat = await ctx.db.get(args.chatId);
      if (!chat) throw new Error("Chat not found");
      ownershipGuard(userId, chat.userId);
    }
    
    // Update the group
    const { tabGroupId, ...updates } = args;
    await ctx.db.patch(tabGroupId, updates);
  }
});

export const remove = mutationWithSession({
  args: {
    tabGroupId: v.id("tabGroups")
  },
  handler: async (ctx, args) => {
    const userId = await authenticationGuard(ctx, ctx.sessionId);
    
    const group = await ctx.db.get(args.tabGroupId);
    if (!group) throw new Error("Group not found");
    
    // Verify ownership
    ownershipGuard(userId, group.userId);
    
    // Delete the group
    await ctx.db.delete(args.tabGroupId);
  }
});



//All operations relating to the tabs in a group
export const getTabsInGroup: ReturnType<typeof queryWithSession> = queryWithSession({
  args: { tabGroupId: v.id("tabGroups") },
  handler: async (ctx: QueryCtx & { sessionId: SessionId }, args: { tabGroupId: Id<"tabGroups"> }): Promise<Doc<"tabs">[] | null> => {
    const user = await authenticationGuard(ctx, ctx.sessionId);
    
    const group = await ctx.db.get(args.tabGroupId);
    if (!group) return null;
    ownershipGuard(user, group.userId);


    const tabs: Doc<"tabs">[] = await ctx.runQuery(internal.tabGroupMembers.getTabsInGroup, {
      tabGroupId: args.tabGroupId
    });
    

    //todo: debugging log
    console.log("tabs", tabs);

    return tabs;
  }
});


export const addTabToGroup = mutationWithSession({
  args: {
    tabId: v.id("tabs"),
    tabGroupId: v.id("tabGroups")
  },
  handler: async (ctx: MutationCtx & { sessionId: SessionId }, args: { tabId: Id<"tabs">, tabGroupId: Id<"tabGroups"> }) => {
    const user = await authenticationGuard(ctx, ctx.sessionId);
    
    // Verify tab exists and belongs to user
    const tab = await ctx.db.get(args.tabId);
    if (!tab) throw new Error("Tab not found");
    ownershipGuard(user, tab.userId);

    // Verify group exists and belongs to user
    const group = await ctx.db.get(args.tabGroupId);
    if (!group) throw new Error("Group not found");
    ownershipGuard(user, group.userId);

    // Add tab to group using internal function
    await ctx.runMutation(internal.tabGroupMembers.addTabToGroup, {
      tabId: args.tabId,
      tabGroupId: args.tabGroupId,
      tabUrl: tab.url
    });
  }
});


export const removeTabFromGroup = mutationWithSession({
  args: {
    tabId: v.id("tabs"),
    tabGroupId: v.id("tabGroups")
  },
  handler: async (ctx: MutationCtx & { sessionId: SessionId }, args: { tabId: Id<"tabs">, tabGroupId: Id<"tabGroups"> }) => {
    const user = await authenticationGuard(ctx, ctx.sessionId);
    
    // Verify tab exists and belongs to user
    const tab = await ctx.db.get(args.tabId);
    if (!tab) throw new Error("Tab not found");
    ownershipGuard(user, tab.userId);

    // Verify group exists and belongs to user
    const group = await ctx.db.get(args.tabGroupId);
    if (!group) throw new Error("Group not found");
    ownershipGuard(user, group.userId);

    // Remove tab from group using internal function
    await ctx.runMutation(internal.tabGroupMembers.removeTabFromGroup, {
      tabId: args.tabId,
      tabGroupId: args.tabGroupId
    });
  }
}); 