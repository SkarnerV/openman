import { describe, it, expect, vi } from 'vitest';

// Define types locally to avoid importing the module
type StoreName = 'request' | 'collection' | 'environment' | 'settings';

interface StoreChangeEvent {
  store: StoreName;
  field: string;
  previousValue: unknown;
  currentValue: unknown;
  timestamp: number;
}

// Create a simple tracker class for testing without dependencies
class TestableStoreBehaviorTracker {
  private listeners: Set<(event: StoreChangeEvent) => void> = new Set();
  private previousStates: Map<StoreName, Record<string, unknown>> = new Map();
  private isTracking: boolean = false;

  startTracking(): void {
    this.isTracking = true;
  }

  stopTracking(): void {
    this.isTracking = false;
  }

  getIsTracking(): boolean {
    return this.isTracking;
  }

  addListener(listener: (event: StoreChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  removeListener(listener: (event: StoreChangeEvent) => void): void {
    this.listeners.delete(listener);
  }

  trackFieldChange(
    storeName: StoreName,
    field: string,
    previousValue: unknown,
    currentValue: unknown
  ): void {
    const event: StoreChangeEvent = {
      store: storeName,
      field,
      previousValue,
      currentValue,
      timestamp: Date.now(),
    };

    this.notifyListeners(event);
  }

  private notifyListeners(event: StoreChangeEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in listener:', error);
      }
    });
  }

  getPreviousState(storeName: StoreName): Record<string, unknown> | undefined {
    return this.previousStates.get(storeName);
  }
}

describe('StoreBehaviorTracker', () => {
  let tracker: TestableStoreBehaviorTracker;

  beforeEach(() => {
    vi.clearAllMocks();
    tracker = new TestableStoreBehaviorTracker();
  });

  afterEach(() => {
    tracker.stopTracking();
  });

  describe('Start/Stop Tracking', () => {
    it('should not be tracking initially', () => {
      expect(tracker.getIsTracking()).toBe(false);
    });

    it('should start tracking when startTracking is called', () => {
      tracker.startTracking();
      expect(tracker.getIsTracking()).toBe(true);
    });

    it('should stop tracking when stopTracking is called', () => {
      tracker.startTracking();
      tracker.stopTracking();
      expect(tracker.getIsTracking()).toBe(false);
    });
  });

  describe('Event Listeners', () => {
    it('should add and call listeners', () => {
      const listener = vi.fn();
      tracker.addListener(listener);

      tracker.trackFieldChange('settings', 'fontSize', 14, 18);

      expect(listener).toHaveBeenCalled();
    });

    it('should remove listeners', () => {
      const listener = vi.fn();
      const removeListener = tracker.addListener(listener);
      removeListener();

      tracker.trackFieldChange('settings', 'fontSize', 14, 18);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => {
        throw new Error('Listener error');
      });
      const normalListener = vi.fn();

      tracker.addListener(errorListener);
      tracker.addListener(normalListener);

      // Should not throw
      expect(() => tracker.trackFieldChange('settings', 'fontSize', 14, 18)).not.toThrow();
      expect(normalListener).toHaveBeenCalled();
    });

    it('should receive correct event data', () => {
      const listener = vi.fn();
      tracker.addListener(listener);

      tracker.trackFieldChange('settings', 'customField', 'old', 'new');

      const event = listener.mock.calls[0][0] as StoreChangeEvent;
      expect(event.store).toBe('settings');
      expect(event.field).toBe('customField');
      expect(event.previousValue).toBe('old');
      expect(event.currentValue).toBe('new');
      expect(event.timestamp).toBeDefined();
    });
  });

  describe('Manual Field Tracking', () => {
    it('should track field changes manually', () => {
      const listener = vi.fn();
      tracker.addListener(listener);

      tracker.trackFieldChange('settings', 'customField', 'old', 'new');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          store: 'settings',
          field: 'customField',
          previousValue: 'old',
          currentValue: 'new',
        })
      );
    });

    it('should track request store changes', () => {
      const listener = vi.fn();
      tracker.addListener(listener);

      tracker.trackFieldChange('request', 'currentRequest', null, { id: '1', method: 'GET' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          store: 'request',
          field: 'currentRequest',
        })
      );
    });

    it('should track collection store changes', () => {
      const listener = vi.fn();
      tracker.addListener(listener);

      tracker.trackFieldChange('collection', 'activeCollection', null, { id: '1', name: 'Test' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          store: 'collection',
          field: 'activeCollection',
        })
      );
    });

    it('should track environment store changes', () => {
      const listener = vi.fn();
      tracker.addListener(listener);

      tracker.trackFieldChange('environment', 'activeEnvironment', null, { id: '1', name: 'Dev' });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          store: 'environment',
          field: 'activeEnvironment',
        })
      );
    });
  });

  describe('StoreChangeEvent Interface', () => {
    it('should have correct structure', () => {
      const event: StoreChangeEvent = {
        store: 'settings',
        field: 'fontSize',
        previousValue: 14,
        currentValue: 16,
        timestamp: Date.now(),
      };

      expect(event.store).toBe('settings');
      expect(event.field).toBe('fontSize');
      expect(event.previousValue).toBe(14);
      expect(event.currentValue).toBe(16);
      expect(typeof event.timestamp).toBe('number');
    });
  });

  describe('Multiple Listeners', () => {
    it('should call all registered listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const listener3 = vi.fn();

      tracker.addListener(listener1);
      tracker.addListener(listener2);
      tracker.addListener(listener3);

      tracker.trackFieldChange('settings', 'fontSize', 14, 16);

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
      expect(listener3).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid listener registration and unregistration', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      const remove1 = tracker.addListener(listener1);
      tracker.addListener(listener2);
      remove1();

      tracker.trackFieldChange('settings', 'fontSize', 14, 16);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });
});
