/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as chats from "../chats.js";
import type * as chunks from "../chunks.js";
import type * as favorites from "../favorites.js";
import type * as guards_auth from "../guards/auth.js";
import type * as guards_ownership_guards from "../guards/ownership_guards.js";
import type * as lib_sessions from "../lib/sessions.js";
import type * as messages from "../messages.js";
import type * as openai from "../openai.js";
import type * as tabs from "../tabs.js";
import type * as users from "../users.js";
import type * as vectorize from "../vectorize.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  chats: typeof chats;
  chunks: typeof chunks;
  favorites: typeof favorites;
  "guards/auth": typeof guards_auth;
  "guards/ownership_guards": typeof guards_ownership_guards;
  "lib/sessions": typeof lib_sessions;
  messages: typeof messages;
  openai: typeof openai;
  tabs: typeof tabs;
  users: typeof users;
  vectorize: typeof vectorize;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
