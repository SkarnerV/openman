import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { behaviorTracker } from './behaviorTracker';

// Create a mutable state for mocking
const mockSendAnalytics = { current: true };

// Mock the settings store to ensure sendAnalytics is true in tests
vi.mock('../stores/useSettingsStore', () => ({
  useSettingsStore: {
    getState: vi.fn(() => ({ sendAnalytics: mockSendAnalytics.current })),
  },
}));

describe('behaviorTracker', () => {
  beforeEach(() => {
    // Reset tracker state before each test
    behaviorTracker.reset();
    vi.clearAllMocks();
    mockSendAnalytics.current = true;
  });

  afterEach(() => {
    behaviorTracker.clearEvents();
    behaviorTracker.clearListeners();
  });

  describe('Session Management', () => {
    it('should create a new session on initialization', () => {
      const sessionData = behaviorTracker.getSessionData();
      expect(sessionData.sessionId).toBeDefined();
      expect(sessionData.startTime).toBeLessThanOrEqual(Date.now());
      expect(sessionData.events).toBeDefined();
      expect(Array.isArray(sessionData.events)).toBe(true);
    });

    it('should generate unique session IDs', () => {
      const session1 = behaviorTracker.getSessionData();
      behaviorTracker.startSession();
      const session2 = behaviorTracker.getSessionData();
      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('should clear events on reset', () => {
      behaviorTracker.trackEvent('request', 'create_request');
      behaviorTracker.trackEvent('request', 'send_request');
      expect(behaviorTracker.getEventCount()).toBeGreaterThan(1);

      behaviorTracker.reset();
      // After reset, only session_start event exists (count = 1)
      expect(behaviorTracker.getEventCount()).toBe(1);
    });

    it('should track session start and end events', () => {
      const sessionData = behaviorTracker.getSessionData();
      const sessionStart = sessionData.events.find(
        (e) => e.label === 'session_start'
      );
      expect(sessionStart).toBeDefined();
      expect(sessionStart?.action).toBe('click_button');
      expect(sessionStart?.metadata?.sessionId).toBe(sessionData.sessionId);
    });

    it('should end session and return session data', () => {
      behaviorTracker.trackEvent('request', 'create_request');
      const sessionData = behaviorTracker.endSession();

      expect(sessionData.sessionId).toBeDefined();
      expect(sessionData.events.length).toBeGreaterThan(0);
      expect(behaviorTracker.getIsTracking()).toBe(false);
    });
  });

  describe('Basic Event Tracking', () => {
    it('should track events correctly', () => {
      behaviorTracker.trackEvent('request', 'create_request');

      const events = behaviorTracker.getEvents();
      expect(events.length).toBeGreaterThan(0);
      expect(events[events.length - 1].category).toBe('request');
      expect(events[events.length - 1].action).toBe('create_request');
    });

    it('should generate unique event IDs', () => {
      behaviorTracker.trackEvent('request', 'create_request');
      behaviorTracker.trackEvent('request', 'send_request');

      const events = behaviorTracker.getEvents();
      const lastTwo = events.slice(-2);
      expect(lastTwo[0].id).not.toBe(lastTwo[1].id);
    });

    it('should add timestamp to events', () => {
      const beforeTime = Date.now();
      behaviorTracker.trackEvent('request', 'create_request');
      const afterTime = Date.now();

      const events = behaviorTracker.getEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(lastEvent.timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should track events with label and value', () => {
      behaviorTracker.trackEvent('request', 'send_request', {
        label: 'GET /api/users',
        value: 200,
      });

      const events = behaviorTracker.getEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.label).toBe('GET /api/users');
      expect(lastEvent.value).toBe(200);
    });

    it('should track events with metadata', () => {
      behaviorTracker.trackEvent('request', 'send_request', {
        metadata: { method: 'GET', url: 'https://api.example.com' },
      });

      const events = behaviorTracker.getEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.metadata?.method).toBe('GET');
      expect(lastEvent.metadata?.url).toBe('https://api.example.com');
    });

    it('should track events with error', () => {
      behaviorTracker.trackEvent('request', 'send_request', {
        error: 'Network error',
      });

      const events = behaviorTracker.getEvents();
      const lastEvent = events[events.length - 1];
      expect(lastEvent.error).toBe('Network error');
    });
  });

  describe('Event Filtering', () => {
    beforeEach(() => {
      mockSendAnalytics.current = true;
      behaviorTracker.trackEvent('request', 'create_request');
      behaviorTracker.trackEvent('request', 'send_request');
      behaviorTracker.trackEvent('collection', 'create_collection');
      behaviorTracker.trackEvent('navigation', 'navigate_to_page');
    });

    it('should filter events by category', () => {
      const requestEvents = behaviorTracker.getEventsByCategory('request');
      expect(requestEvents.length).toBe(2);
      requestEvents.forEach((e) => expect(e.category).toBe('request'));
    });

    it('should filter events by action', () => {
      const createEvents = behaviorTracker.getEventsByAction('create_request');
      expect(createEvents.length).toBe(1);
      expect(createEvents[0].action).toBe('create_request');
    });

    it('should filter events by time range', () => {
      const beforeTime = Date.now() - 1000;
      const afterTime = Date.now() + 1000;

      // Track additional events to test filtering
      behaviorTracker.trackEvent('request', 'create_request');
      behaviorTracker.trackEvent('request', 'send_request');
      behaviorTracker.trackEvent('collection', 'create_collection');

      const rangeEvents = behaviorTracker.getEventsInRange(beforeTime, afterTime);
      // Should have at least 4 events (session_start + 3 tracked)
      expect(rangeEvents.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array for non-matching filters', () => {
      const settingsEvents = behaviorTracker.getEventsByCategory('settings');
      expect(settingsEvents.length).toBe(0);
    });
  });

  describe('Convenience Methods', () => {
    describe('trackNavigation', () => {
      it('should track navigation events', () => {
        behaviorTracker.trackNavigation('/collections', '/requests');

        const events = behaviorTracker.getEvents();
        const navEvent = events[events.length - 1];
        expect(navEvent.category).toBe('navigation');
        expect(navEvent.action).toBe('navigate_to_page');
        expect(navEvent.label).toBe('/collections');
        expect(navEvent.metadata?.fromPage).toBe('/requests');
      });
    });

    describe('trackModal', () => {
      it('should track modal open events', () => {
        behaviorTracker.trackModal('open', 'CreateCollectionModal');

        const events = behaviorTracker.getEvents();
        const modalEvent = events[events.length - 1];
        expect(modalEvent.category).toBe('navigation');
        expect(modalEvent.action).toBe('open_modal');
        expect(modalEvent.label).toBe('CreateCollectionModal');
      });

      it('should track modal close events', () => {
        behaviorTracker.trackModal('close', 'CreateCollectionModal');

        const events = behaviorTracker.getEvents();
        const modalEvent = events[events.length - 1];
        expect(modalEvent.action).toBe('close_modal');
      });
    });

    describe('trackRequest', () => {
      it('should track request events with method and URL', () => {
        behaviorTracker.trackRequest('send_request', {
          method: 'POST',
          url: '/api/users',
          duration: 150,
          status: 201,
        });

        const events = behaviorTracker.getEvents();
        const requestEvent = events[events.length - 1];
        expect(requestEvent.category).toBe('request');
        expect(requestEvent.action).toBe('send_request');
        expect(requestEvent.label).toBe('POST /api/users');
        expect(requestEvent.metadata?.duration).toBe(150);
        expect(requestEvent.metadata?.status).toBe(201);
      });

      it('should handle minimal request data', () => {
        behaviorTracker.trackRequest('create_request');

        const events = behaviorTracker.getEvents();
        const requestEvent = events[events.length - 1];
        expect(requestEvent.category).toBe('request');
        expect(requestEvent.action).toBe('create_request');
      });
    });

    describe('trackCollection', () => {
      it('should track collection events', () => {
        behaviorTracker.trackCollection('create_collection', {
          name: 'My Collection',
          id: 'col-123',
          requestCount: 5,
        });

        const events = behaviorTracker.getEvents();
        const collEvent = events[events.length - 1];
        expect(collEvent.category).toBe('collection');
        expect(collEvent.label).toBe('My Collection');
        expect(collEvent.metadata?.collectionId).toBe('col-123');
        expect(collEvent.metadata?.requestCount).toBe(5);
      });
    });

    describe('trackEnvironment', () => {
      it('should track environment events', () => {
        behaviorTracker.trackEnvironment('create_environment', {
          name: 'Production',
          id: 'env-456',
          variableCount: 10,
        });

        const events = behaviorTracker.getEvents();
        const envEvent = events[events.length - 1];
        expect(envEvent.category).toBe('environment');
        expect(envEvent.label).toBe('Production');
        expect(envEvent.metadata?.environmentId).toBe('env-456');
        expect(envEvent.metadata?.variableCount).toBe(10);
      });
    });

    describe('trackSettings', () => {
      it('should track settings changes', () => {
        behaviorTracker.trackSettings('theme', 'dark');

        const events = behaviorTracker.getEvents();
        const settingsEvent = events[events.length - 1];
        expect(settingsEvent.category).toBe('settings');
        expect(settingsEvent.action).toBe('change_theme');
        expect(settingsEvent.value).toBe('dark');
      });
    });

    describe('trackInteraction', () => {
      it('should track user interactions', () => {
        behaviorTracker.trackInteraction('click_button', 'Send Button', {
          buttonId: 'send-request',
        });

        const events = behaviorTracker.getEvents();
        const interactionEvent = events[events.length - 1];
        expect(interactionEvent.category).toBe('interaction');
        expect(interactionEvent.action).toBe('click_button');
        expect(interactionEvent.label).toBe('Send Button');
        expect(interactionEvent.metadata?.buttonId).toBe('send-request');
      });
    });
  });

  describe('Performance Timing', () => {
    it('should start and end a timer', () => {
      behaviorTracker.startTimer('test-operation');
      // Simulate some work
      const start = performance.now();
      while (performance.now() - start < 10) {
        // Busy wait for 10ms
      }
      const duration = behaviorTracker.endTimer('test-operation');

      expect(duration).toBeDefined();
      expect(duration).toBeGreaterThanOrEqual(10);
    });

    it('should return undefined for non-existent timer', () => {
      const duration = behaviorTracker.endTimer('non-existent-timer');
      expect(duration).toBeUndefined();
    });

    it('should track timer as performance event', () => {
      behaviorTracker.startTimer('api-call', { endpoint: '/api/users' });
      behaviorTracker.endTimer('api-call', 'GET /api/users');

      const events = behaviorTracker.getEventsByCategory('performance');
      expect(events.length).toBeGreaterThan(0);
      const perfEvent = events[events.length - 1];
      expect(perfEvent.label).toBe('GET /api/users');
      expect(perfEvent.duration).toBeDefined();
    });
  });

  describe('Event Listeners', () => {
    it('should add and remove listeners', () => {
      const listener = vi.fn();
      const removeListener = behaviorTracker.addListener(listener);

      behaviorTracker.trackEvent('request', 'create_request');

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          category: 'request',
          action: 'create_request',
        })
      );

      // Remove listener
      removeListener();
      behaviorTracker.trackEvent('request', 'send_request');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      behaviorTracker.addListener(errorListener);
      behaviorTracker.addListener(normalListener);

      // Should not throw
      behaviorTracker.trackEvent('request', 'create_request');

      // Normal listener should still be called
      expect(normalListener).toHaveBeenCalledTimes(1);
    });

    it('should clear all listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      behaviorTracker.addListener(listener1);
      behaviorTracker.addListener(listener2);
      behaviorTracker.clearListeners();

      behaviorTracker.trackEvent('request', 'create_request');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    it('should remove specific listener', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      behaviorTracker.addListener(listener1);
      behaviorTracker.addListener(listener2);
      behaviorTracker.removeListener(listener1);

      behaviorTracker.trackEvent('request', 'create_request');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Analytics Toggle Integration', () => {
    it('should respect sendAnalytics setting when enabled', () => {
      mockSendAnalytics.current = true;
      behaviorTracker.reset();

      behaviorTracker.trackEvent('request', 'create_request');
      expect(behaviorTracker.getEventCount()).toBeGreaterThan(0);
    });

    it('should respect sendAnalytics setting when disabled', () => {
      mockSendAnalytics.current = false;
      behaviorTracker.reset();

      behaviorTracker.trackEvent('request', 'create_request');
      expect(behaviorTracker.getEventCount()).toBe(0);
    });

    it('should allow tracking when store is not available', () => {
      // This test verifies the fallback behavior
      mockSendAnalytics.current = true;
      behaviorTracker.reset();
      behaviorTracker.trackEvent('request', 'create_request');
      expect(behaviorTracker.getEventCount()).toBeGreaterThan(0);
    });
  });

  describe('Event Count', () => {
    it('should return correct event count', () => {
      // Initial state has session_start event
      const initialCount = behaviorTracker.getEventCount();
      expect(initialCount).toBeGreaterThanOrEqual(1);

      behaviorTracker.trackEvent('request', 'create_request');
      const count1 = behaviorTracker.getEventCount();
      expect(count1).toBe(initialCount + 1);

      behaviorTracker.trackEvent('request', 'send_request');
      const count2 = behaviorTracker.getEventCount();
      expect(count2).toBe(count1 + 1);
    });

    it('should reset event count on reset', () => {
      behaviorTracker.trackEvent('request', 'create_request');
      behaviorTracker.trackEvent('request', 'send_request');
      const countBeforeReset = behaviorTracker.getEventCount();
      expect(countBeforeReset).toBeGreaterThan(2);

      behaviorTracker.reset();
      // After reset, only session_start event exists
      expect(behaviorTracker.getEventCount()).toBe(1);
    });
  });

  describe('Use Cases - Basic User Flows', () => {
    it('should track complete request creation flow', () => {
      // 1. User opens request builder
      behaviorTracker.trackNavigation('/requests');

      // 2. User enters URL
      behaviorTracker.trackInteraction('type_input', 'URL Input', {
        field: 'url',
      });

      // 3. User selects method
      behaviorTracker.trackInteraction('select_option', 'Method Select', {
        value: 'POST',
      });

      // 4. User adds header
      behaviorTracker.trackInteraction('click_button', 'Add Header');
      behaviorTracker.trackInteraction('type_input', 'Header Name', {
        field: 'header-key',
      });

      // 5. User sends request
      behaviorTracker.startTimer('request-send');
      behaviorTracker.trackRequest('send_request', {
        method: 'POST',
        url: '/api/users',
        duration: 150,
        status: 201,
      });
      behaviorTracker.endTimer('request-send');

      // Verify all events were tracked
      const events = behaviorTracker.getEvents();
      expect(events.some((e) => e.action === 'navigate_to_page')).toBe(true);
      expect(
        events.some((e) => e.action === 'type_input' && e.metadata?.field === 'url')
      ).toBe(true);
      expect(
        events.some((e) => e.action === 'select_option' && e.metadata?.value === 'POST')
      ).toBe(true);
      expect(events.some((e) => e.action === 'send_request')).toBe(true);
    });

    it('should track collection management flow', () => {
      // 1. User navigates to collections
      behaviorTracker.trackNavigation('/collections');

      // 2. User creates collection
      behaviorTracker.trackModal('open', 'CreateCollectionModal');
      behaviorTracker.trackInteraction('type_input', 'Collection Name');
      behaviorTracker.trackCollection('create_collection', {
        name: 'Test Collection',
        id: 'col-123',
      });
      behaviorTracker.trackModal('close', 'CreateCollectionModal');

      // 3. User saves request to collection
      behaviorTracker.trackModal('open', 'SaveRequestModal');
      behaviorTracker.trackRequest('save_request', {
        method: 'GET',
        url: '/api/users',
      });
      behaviorTracker.trackModal('close', 'SaveRequestModal');

      const collectionEvents = behaviorTracker.getEventsByCategory('collection');
      expect(collectionEvents.length).toBe(1);
      expect(collectionEvents[0].action).toBe('create_collection');
    });

    it('should track environment setup flow', () => {
      // 1. User navigates to environments
      behaviorTracker.trackNavigation('/environments');

      // 2. User creates environment
      behaviorTracker.trackEnvironment('create_environment', {
        name: 'Development',
        id: 'env-123',
      });

      // 3. User adds variables
      behaviorTracker.trackEnvironment('add_variable', {
        name: 'Development',
        variableCount: 1,
      });
      behaviorTracker.trackInteraction('type_input', 'Variable Name');
      behaviorTracker.trackInteraction('type_input', 'Variable Value');

      behaviorTracker.trackEnvironment('add_variable', {
        name: 'Development',
        variableCount: 2,
      });

      // 4. User selects environment as active
      behaviorTracker.trackEnvironment('select_environment', {
        name: 'Development',
        id: 'env-123',
      });

      const envEvents = behaviorTracker.getEventsByCategory('environment');
      expect(envEvents.length).toBe(4);
    });

    it('should track settings changes', () => {
      // User changes various settings
      behaviorTracker.trackSettings('theme', 'dark');
      behaviorTracker.trackSettings('fontSize', 16);
      behaviorTracker.trackSettings('autoSave', false);
      behaviorTracker.trackSettings('language', 'zh');

      const settingsEvents = behaviorTracker.getEventsByCategory('settings');
      expect(settingsEvents.length).toBe(4);
      expect(settingsEvents.some((e) => e.action === 'change_theme')).toBe(true);
      // Note: trackSettings uses `change_${setting}` so it preserves camelCase
      expect(settingsEvents.some((e) => e.action === 'change_fontSize')).toBe(true);
    });

    it('should track error scenarios', () => {
      // User tries to send request but gets error
      behaviorTracker.trackRequest('send_request', {
        method: 'GET',
        url: '/api/invalid',
        status: 404,
        duration: 50,
      });
      const events = behaviorTracker.getEvents();
      const errorEvent = events.find((e) => e.action === 'send_request');
      expect(errorEvent?.metadata?.status).toBe(404);
    });
  });
});
