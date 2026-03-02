// convex/http.ts — UPDATED with /getMeetToken route
// Replace your existing convex/http.ts with this file

import { auth } from './auth';
import { httpRouter } from 'convex/server';
import { revenuecatWebhook } from './api/revenuecat';
import { getRoomToken } from './api/room';

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// RevenueCat webhook routes
http.route({
  path: '/revenuecatWebhook',
  method: 'POST',
  handler: revenuecatWebhook,
});

// LiveKit room endpoint
http.route({
  path: '/getRoomToken',
  method: 'OPTIONS',
  handler: getRoomToken,
});

http.route({
  path: '/getRoomToken',
  method: 'POST',
  handler: getRoomToken,
});

export default http;
