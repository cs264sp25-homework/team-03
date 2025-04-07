import { z } from "zod";
import { Id } from "../../convex/_generated/dataModel";

export const createChatSchema = z.object({
  title: z.string().min(2).max(50),
  description: z.optional(z.string().min(2).max(200)),
  tabGroupId: z.optional(z.string()), // Optional tab group ID
});

export const updateChatSchema = createChatSchema.partial();

export const chatSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  userId: z.string(), // ID reference to users table
  groupId: z.optional(z.string()), // Optional reference to tabGroups table
  title: z.string(),
  description: z.optional(z.string()),
  messageCount: z.number(),
  tabCount: z.number(), // Changed from fileCount to tabCount to match schema
});

export type CreateChatType = z.infer<typeof createChatSchema>;
export type UpdateChatType = z.infer<typeof updateChatSchema>;
export type ChatType = z.infer<typeof chatSchema>;

// You might also want to add a type for the full chat with its relationships
export interface ChatWithRelations extends ChatType {
  userId: Id<"users">;
  groupId?: Id<"tabGroups">;
}
