/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as api_revenuecat from "../api/revenuecat.js";
import type * as api_room from "../api/room.js";
import type * as api_roomNode from "../api/roomNode.js";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as passwordReset from "../passwordReset.js";
import type * as resendOTP from "../resendOTP.js";
import type * as resendPasswordOTP from "../resendPasswordOTP.js";
import type * as rooms from "../rooms.js";
import type * as subscriptions from "../subscriptions.js";
import type * as topics from "../topics.js";
import type * as userDeletion from "../userDeletion.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  "api/revenuecat": typeof api_revenuecat;
  "api/room": typeof api_room;
  "api/roomNode": typeof api_roomNode;
  auth: typeof auth;
  http: typeof http;
  passwordReset: typeof passwordReset;
  resendOTP: typeof resendOTP;
  resendPasswordOTP: typeof resendPasswordOTP;
  rooms: typeof rooms;
  subscriptions: typeof subscriptions;
  topics: typeof topics;
  userDeletion: typeof userDeletion;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
