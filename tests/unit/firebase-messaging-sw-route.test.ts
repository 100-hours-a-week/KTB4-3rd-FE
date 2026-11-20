import { afterEach, describe, expect, it, vi } from 'vitest';

import { GET } from '../../app/firebase-messaging-sw.js/route';

describe('Firebase messaging service worker route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the background worker alive until the OS notification is displayed', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_API_KEY', 'test-api-key');
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com');
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'test-project');
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', '123456');
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_APP_ID', '1:123456:web:test');

    const response = GET();
    const script = await response.text();

    expect(response.status).toBe(200);
    expect(script).toContain('event.waitUntil(self.skipWaiting())');
    expect(script).toContain('event.waitUntil(self.clients.claim())');
    expect(script).toContain('return self.registration.showNotification(title, {');
  });
});
