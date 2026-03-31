/**
 * Store Behavior Tracker
 *
 * Monitors Zustand store state changes and tracks them as behavior events.
 * Provides automatic tracking of state mutations without manual instrumentation.
 */

import { behaviorTracker } from '../services/behaviorTracker';
import {
  useRequestStore,
  useCollectionStore,
  useEnvironmentStore,
  useSettingsStore,
} from '../stores';

// Store event types for tracking
export type StoreName = 'request' | 'collection' | 'environment' | 'settings';

export interface StoreChangeEvent {
  store: StoreName;
  field: string;
  previousValue: unknown;
  currentValue: unknown;
  timestamp: number;
}

class StoreBehaviorTracker {
  private unsubscribers: Map<StoreName, () => void> = new Map();
  private previousStates: Map<StoreName, Record<string, unknown>> = new Map();
  private isTracking: boolean = false;
  private listeners: Set<(event: StoreChangeEvent) => void> = new Set();

  /**
   * Start tracking store changes
   */
  startTracking(): void {
    if (this.isTracking) {
      return;
    }

    this.isTracking = true;

    // Track request store
    this.trackStore('request', useRequestStore);

    // Track collection store
    this.trackStore('collection', useCollectionStore);

    // Track environment store
    this.trackStore('environment', useEnvironmentStore);

    // Track settings store
    this.trackStore('settings', useSettingsStore);
  }

  /**
   * Stop tracking store changes
   */
  stopTracking(): void {
    this.isTracking = false;
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers.clear();
    this.previousStates.clear();
  }

  /**
   * Track a specific store
   */
  private trackStore(
    storeName: StoreName,
    store: { subscribe: (selector: () => unknown) => (() => void); getState: () => Record<string, unknown> | Partial<Record<string, unknown>> }
  ): void {
    // Initialize previous state
    this.previousStates.set(storeName, { ...store.getState() });

    // Subscribe to store changes
    const unsubscribe = store.subscribe(() => {
      const currentState = store.getState();
      const previousState = this.previousStates.get(storeName) || {};

      // Find changed fields
      const changedFields = this.findChangedFields(previousState, currentState);

      // Track each changed field
      changedFields.forEach((field) => {
        const event: StoreChangeEvent = {
          store: storeName,
          field,
          previousValue: previousState[field],
          currentValue: currentState[field],
          timestamp: Date.now(),
        };

        // Track in behavior tracker
        this.trackStoreChange(storeName, field, currentState[field]);

        // Notify listeners
        this.notifyListeners(event);
      });

      // Update previous state
      this.previousStates.set(storeName, { ...currentState });
    });

    this.unsubscribers.set(storeName, unsubscribe);
  }

  /**
   * Find changed fields between states
   */
  private findChangedFields(
    previous: Record<string, unknown>,
    current: Record<string, unknown>
  ): string[] {
    const changedFields: string[] = [];
    const allKeys = new Set([...Object.keys(previous), ...Object.keys(current)]);

    allKeys.forEach((key) => {
      const prevValue = previous[key];
      const currValue = current[key];

      // Skip function values
      if (typeof currValue === 'function') {
        return;
      }

      // Compare values (deep comparison for objects)
      if (JSON.stringify(prevValue) !== JSON.stringify(currValue)) {
        changedFields.push(key);
      }
    });

    return changedFields;
  }

  /**
   * Track a store change in the behavior tracker
   */
  private trackStoreChange(storeName: StoreName, field: string, value: unknown): void {
    // Track based on store type and field
    switch (storeName) {
      case 'request':
        this.trackRequestStoreChange(field, value);
        break;
      case 'collection':
        this.trackCollectionStoreChange(field, value);
        break;
      case 'environment':
        this.trackEnvironmentStoreChange(field, value);
        break;
      case 'settings':
        this.trackSettingsStoreChange(field, value);
        break;
    }
  }

  /**
   * Track request store changes
   */
  private trackRequestStoreChange(field: string, value: unknown): void {
    switch (field) {
      case 'currentRequest':
        if (value === null) {
          behaviorTracker.trackRequest('clear_request');
        } else if (typeof value === 'object' && value !== null) {
          const request = value as { id?: string; method?: string; url?: string };
          if (request.id) {
            behaviorTracker.trackRequest('update_request', {
              method: request.method,
              url: request.url,
            });
          } else {
            behaviorTracker.trackRequest('create_request', {
              method: request.method,
              url: request.url,
            });
          }
        }
        break;
      case 'response':
        if (value !== null && typeof value === 'object') {
          const response = value as { status?: number; statusText?: string };
          behaviorTracker.trackEvent('request', 'send_request', {
            value: response.status,
            metadata: {
              status: response.status,
              statusText: response.statusText,
            },
          });
        }
        break;
      case 'isLoading':
        // Could track loading start/end
        break;
      case 'error':
        if (value) {
          behaviorTracker.trackEvent('request', 'send_request', {
            error: value as string,
          });
        }
        break;
      case 'activeTab':
        behaviorTracker.trackInteraction('select_option', `Request Tab: ${value}`, {
          field: 'activeTab',
        });
        break;
    }
  }

  /**
   * Track collection store changes
   */
  private trackCollectionStoreChange(field: string, value: unknown): void {
    switch (field) {
      case 'collections':
        if (Array.isArray(value)) {
          // Detect collection creation/update
          const collections = value as Array<{ id?: string; name?: string }>;
          if (collections.length > 0) {
            const latest = collections[collections.length - 1];
            if (latest.id && latest.name) {
              behaviorTracker.trackCollection('create_collection', {
                name: latest.name,
                id: latest.id,
                requestCount: 0,
              });
            }
          }
        }
        break;
      case 'activeCollection':
        if (value !== null && typeof value === 'object') {
          const collection = value as { id?: string; name?: string };
          if (collection.id && collection.name) {
            behaviorTracker.trackCollection('select_collection', {
              name: collection.name,
              id: collection.id,
            });
          }
        }
        break;
      case 'selectedRequest':
        if (value !== null && typeof value === 'object') {
          const request = value as { id?: string; name?: string };
          behaviorTracker.trackCollection('select_collection', {
            name: request.name,
            id: request.id,
          });
        }
        break;
    }
  }

  /**
   * Track environment store changes
   */
  private trackEnvironmentStoreChange(field: string, value: unknown): void {
    switch (field) {
      case 'environments':
        if (Array.isArray(value)) {
          const environments = value as Array<{ id?: string; name?: string }>;
          if (environments.length > 0) {
            const latest = environments[environments.length - 1];
            if (latest.id && latest.name) {
              behaviorTracker.trackEnvironment('create_environment', {
                name: latest.name,
                id: latest.id,
                variableCount: 0,
              });
            }
          }
        }
        break;
      case 'activeEnvironment':
        if (value !== null && typeof value === 'object') {
          const env = value as { id?: string; name?: string };
          if (env.id && env.name) {
            behaviorTracker.trackEnvironment('select_environment', {
              name: env.name,
              id: env.id,
            });
          }
        } else if (value === null) {
          // Environment deselected
          behaviorTracker.trackEnvironment('select_environment');
        }
        break;
    }
  }

  /**
   * Track settings store changes
   */
  private trackSettingsStoreChange(field: string, value: unknown): void {
    behaviorTracker.trackSettings(field, value);
  }

  /**
   * Add a listener for store changes
   */
  addListener(listener: (event: StoreChangeEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: (event: StoreChangeEvent) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Notify all listeners of a store change
   */
  private notifyListeners(event: StoreChangeEvent): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in store change listener:', error);
      }
    });
  }

  /**
   * Check if tracking is active
   */
  getIsTracking(): boolean {
    return this.isTracking;
  }

  /**
   * Get previous state for a store
   */
  getPreviousState(storeName: StoreName): Record<string, unknown> | undefined {
    return this.previousStates.get(storeName);
  }

  /**
   * Force track a specific field change (for manual calls)
   */
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

    this.trackStoreChange(storeName, field, currentValue);
    this.notifyListeners(event);
  }
}

// Singleton instance
export const storeBehaviorTracker = new StoreBehaviorTracker();

// React hook for using the store tracker
export const useStoreBehaviorTracker = () => {
  return storeBehaviorTracker;
};

// Helper function to wrap a store action with tracking
export function wrapStoreAction<T extends (...args: unknown[]) => unknown>(
  storeName: StoreName,
  actionName: string,
  action: T
): T {
  return ((...args: unknown[]) => {
    // Execute the action
    const result = action(...args);

    // Track the change
    storeBehaviorTracker.trackFieldChange(storeName, actionName, args, result);

    return result;
  }) as T;
}
