import { z } from "zod";
import { Id } from "../../convex/_generated/dataModel";

export const createTabSchema = z.object({
  url: z.string(),
  name: z.optional(z.string()),
  groupId: z.optional(z.string()), // Optional tab group ID
});

export const updateTabSchema = createTabSchema.partial();

export const tabSchema = z.object({
  _id: z.string(),
  _creationTime: z.number(),
  userId: z.string(), // ID reference to users table
  groupId: z.optional(z.string()), // Optional reference to tabGroups table
  url: z.string(),
  name: z.optional(z.string()),
  content: z.optional(z.string()),
  error: z.optional(z.string()),
});

export type CreateTabType = z.infer<typeof createTabSchema>;
export type UpdateTabType = z.infer<typeof updateTabSchema>;
export type TabType = z.infer<typeof tabSchema>;

// Type with proper Convex ID relationships
export interface TabWithRelations extends TabType {
  userId: Id<"users">;
  groupId?: Id<"tabGroups">;
}

// Type for Chrome Tab data
export interface ChromeTab {
  id?: number;
  url?: string;
  title?: string;
  favIconUrl?: string;
}
  