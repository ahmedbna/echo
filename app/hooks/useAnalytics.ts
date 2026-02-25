// hooks/useAnalytics.ts
// Drop-in analytics hook for your Expo React Native app

import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { usePathname } from 'expo-router';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import * as SecureStore from 'expo-secure-store';

const ANONYMOUS_ID_KEY = 'orca_analytics_anon_id';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function getOrCreateAnonymousId(): Promise<string> {
  try {
    const existing = await SecureStore.getItemAsync(ANONYMOUS_ID_KEY);
    if (existing) return existing;
    const newId = generateId();
    await SecureStore.setItemAsync(ANONYMOUS_ID_KEY, newId);
    return newId;
  } catch {
    return generateId();
  }
}

function getPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios') return 'ios';
  if (Platform.OS === 'android') return 'android';
  return 'web';
}

function getDeviceType(): 'phone' | 'tablet' {
  return Device.deviceType === Device.DeviceType.TABLET ? 'tablet' : 'phone';
}

export function useAnalytics() {
  const trackEvent = useMutation(api.analytics.trackEvent);
  const pathname = usePathname();

  const sessionIdRef = useRef<string>(generateId());
  const anonymousIdRef = useRef<string>('');
  const sessionStartRef = useRef<number>(Date.now());
  const screenStartRef = useRef<number>(Date.now());
  const previousRouteRef = useRef<string>('');
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Base device info — computed once
  const deviceInfo = useRef({
    platform: getPlatform(),
    osVersion: Platform.Version?.toString() ?? undefined,
    appVersion: Constants.expoConfig?.version ?? undefined,
    deviceModel: Device.modelName ?? undefined,
    deviceType: getDeviceType(),
    locale: undefined as string | undefined,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });

  const track = useCallback(
    async (
      eventType: Parameters<typeof trackEvent>[0]['eventType'],
      eventName: string,
      extras?: Partial<Parameters<typeof trackEvent>[0]>,
    ) => {
      try {
        await trackEvent({
          sessionId: sessionIdRef.current,
          anonymousId: anonymousIdRef.current || undefined,
          eventType,
          eventName,
          timestamp: Date.now(),
          ...deviceInfo.current,
          ...extras,
        });
      } catch (err) {
        // Silent — never crash the app due to analytics
        console.warn('[Analytics] track error:', err);
      }
    },
    [trackEvent],
  );

  // ── Init session ──────────────────────────────────────
  useEffect(() => {
    (async () => {
      anonymousIdRef.current = await getOrCreateAnonymousId();
      sessionStartRef.current = Date.now();

      await track('session_start', 'session_start');
    })();

    // App state changes (foreground / background)
    const subscription = AppState.addEventListener(
      'change',
      async (nextState) => {
        const prev = appStateRef.current;
        appStateRef.current = nextState;

        if (nextState === 'active' && prev !== 'active') {
          await track('app_foreground', 'app_foreground');
        } else if (
          nextState.match(/inactive|background/) &&
          prev === 'active'
        ) {
          const durationMs = Date.now() - sessionStartRef.current;
          await track('app_background', 'app_background', {
            sessionDurationMs: durationMs,
          });
        }
      },
    );

    // End session on unmount
    return () => {
      subscription.remove();
      const durationMs = Date.now() - sessionStartRef.current;
      track('session_end', 'session_end', { sessionDurationMs: durationMs });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Track screen / route changes ─────────────────────
  useEffect(() => {
    if (!pathname) return;

    const screenDurationMs = previousRouteRef.current
      ? Date.now() - screenStartRef.current
      : undefined;

    track('page_view', `view:${pathname}`, {
      route: pathname,
      previousRoute: previousRouteRef.current || undefined,
      screenDurationMs,
    });

    previousRouteRef.current = pathname;
    screenStartRef.current = Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // ── Public API ────────────────────────────────────────
  const trackAction = useCallback(
    (actionName: string, metadata?: Record<string, unknown>) => {
      track('user_action', actionName, {
        metadata,
        route: previousRouteRef.current || undefined,
      });
    },
    [track],
  );

  const trackError = useCallback(
    (error: Error | string, extra?: Record<string, unknown>) => {
      const message = error instanceof Error ? error.message : error;
      const stack = error instanceof Error ? error.stack : undefined;
      track('error', 'error', {
        errorMessage: message,
        errorStack: stack,
        route: previousRouteRef.current || undefined,
        metadata: extra,
      });
    },
    [track],
  );

  const trackPerformance = useCallback(
    (
      metricName: string,
      durationMs: number,
      metadata?: Record<string, unknown>,
    ) => {
      track('performance', metricName, {
        sessionDurationMs: durationMs,
        metadata,
        route: previousRouteRef.current || undefined,
      });
    },
    [track],
  );

  return { trackAction, trackError, trackPerformance };
}
