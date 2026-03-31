/**
 * Behavior Tracker Integration
 *
 * This module integrates the behaviorTracker with the existing Zustand stores.
 * It subscribes to store changes and automatically tracks user behavior events.
 *
 * Usage:
 *   import { initBehaviorTracking, cleanupBehaviorTracking } from './trackerIntegration';
 *
 *   // Initialize tracking (call once at app startup)
 *   initBehaviorTracking();
 *
 *   // Cleanup (call at app shutdown)
 *   cleanupBehaviorTracking();
 */

import { behaviorTracker } from '../services/behaviorTracker';
import { useRequestStore } from '../stores/useRequestStore';
import { useCollectionStore } from '../stores/useCollectionStore';
import { useEnvironmentStore } from '../stores/useEnvironmentStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { HttpRequest, HttpResponse } from '../stores/useRequestStore';
import type { Collection } from '../stores/useCollectionStore';
import type { Environment } from '../stores/useEnvironmentStore';

// Type for settings state (only serializable fields)
type SettingsSerializableState = {
  fontSize: number;
  tabSize: number;
  wordWrap: boolean;
  autoFormatJson: boolean;
  language: string;
  autoSave: boolean;
  sendAnalytics: boolean;
  sidebarVisible: boolean;
};

// Store change listeners
let requestStoreUnsubscribe: (() => void) | null = null;
let collectionStoreUnsubscribe: (() => void) | null = null;
let environmentStoreUnsubscribe: (() => void) | null = null;
let settingsStoreUnsubscribe: (() => void) | null = null;

// Previous state for change detection
let previousRequestState: { currentRequest: Partial<HttpRequest> | null; response: HttpResponse | null } | null = null;
let previousCollectionState: { collections: Collection[]; activeCollection: Collection | null } | null = null;
let previousEnvironmentState: { environments: Environment[]; activeEnvironment: Environment | null } | null = null;
let previousSettingsState: SettingsSerializableState | null = null;

/**
 * Initialize behavior tracking for all stores
 */
export function initBehaviorTracking(): void {
  // Initialize previous states
  const requestState = useRequestStore.getState();
  previousRequestState = {
    currentRequest: requestState.currentRequest,
    response: requestState.response,
  };

  const collectionState = useCollectionStore.getState();
  previousCollectionState = {
    collections: collectionState.collections,
    activeCollection: collectionState.activeCollection,
  };

  const environmentState = useEnvironmentStore.getState();
  previousEnvironmentState = {
    environments: environmentState.environments,
    activeEnvironment: environmentState.activeEnvironment,
  };

  const settingsState = useSettingsStore.getState();
  previousSettingsState = {
    fontSize: settingsState.fontSize,
    tabSize: settingsState.tabSize,
    wordWrap: settingsState.wordWrap,
    autoFormatJson: settingsState.autoFormatJson,
    language: settingsState.language,
    autoSave: settingsState.autoSave,
    sendAnalytics: settingsState.sendAnalytics,
    sidebarVisible: settingsState.sidebarVisible,
  };

  // Subscribe to request store
  requestStoreUnsubscribe = useRequestStore.subscribe((state) => {
    trackRequestStoreChanges(state, previousRequestState);
    previousRequestState = {
      currentRequest: state.currentRequest,
      response: state.response,
    };
  });

  // Subscribe to collection store
  collectionStoreUnsubscribe = useCollectionStore.subscribe((state) => {
    trackCollectionStoreChanges(state, previousCollectionState);
    previousCollectionState = {
      collections: state.collections,
      activeCollection: state.activeCollection,
    };
  });

  // Subscribe to environment store
  environmentStoreUnsubscribe = useEnvironmentStore.subscribe((state) => {
    trackEnvironmentStoreChanges(state, previousEnvironmentState);
    previousEnvironmentState = {
      environments: state.environments,
      activeEnvironment: state.activeEnvironment,
    };
  });

  // Subscribe to settings store
  settingsStoreUnsubscribe = useSettingsStore.subscribe((state) => {
    const currentState: SettingsSerializableState = {
      fontSize: state.fontSize,
      tabSize: state.tabSize,
      wordWrap: state.wordWrap,
      autoFormatJson: state.autoFormatJson,
      language: state.language,
      autoSave: state.autoSave,
      sendAnalytics: state.sendAnalytics,
      sidebarVisible: state.sidebarVisible,
    };
    trackSettingsChanges(currentState, previousSettingsState);
    previousSettingsState = currentState;
  });

  // Start session
  behaviorTracker.startSession();

  console.debug('[BehaviorTracker] Tracking initialized');
}

/**
 * Clean up behavior tracking
 */
export function cleanupBehaviorTracking(): void {
  if (requestStoreUnsubscribe) {
    requestStoreUnsubscribe();
    requestStoreUnsubscribe = null;
  }

  if (collectionStoreUnsubscribe) {
    collectionStoreUnsubscribe();
    collectionStoreUnsubscribe = null;
  }

  if (environmentStoreUnsubscribe) {
    environmentStoreUnsubscribe();
    environmentStoreUnsubscribe = null;
  }

  if (settingsStoreUnsubscribe) {
    settingsStoreUnsubscribe();
    settingsStoreUnsubscribe = null;
  }

  // End session
  behaviorTracker.endSession();

  console.debug('[BehaviorTracker] Tracking cleaned up');
}

/**
 * Track request store changes
 */
function trackRequestStoreChanges(
  currentState: { currentRequest: Partial<HttpRequest> | null; response: HttpResponse | null },
  previousState: { currentRequest: Partial<HttpRequest> | null; response: HttpResponse | null } | null
): void {
  if (!previousState) return;

  // Track currentRequest changes
  if (currentState.currentRequest !== previousState.currentRequest) {
    if (currentState.currentRequest === null && previousState.currentRequest !== null) {
      // Request was cleared
      behaviorTracker.trackRequest('clear_request');
    } else if (currentState.currentRequest !== null) {
      const prevId = previousState.currentRequest?.id;
      const currId = currentState.currentRequest?.id;

      if (prevId !== currId) {
        // New request created or loaded
        if (currId) {
          behaviorTracker.trackRequest('create_request', {
            method: currentState.currentRequest.method,
            url: currentState.currentRequest.url,
          });
        }
      } else {
        // Existing request updated
        behaviorTracker.trackRequest('update_request', {
          method: currentState.currentRequest.method,
          url: currentState.currentRequest.url,
        });
      }
    }
  }

  // Track response changes
  if (currentState.response !== previousState.response) {
    if (currentState.response !== null) {
      behaviorTracker.trackRequest('send_request', {
        method: currentState.currentRequest?.method,
        url: currentState.currentRequest?.url,
        status: currentState.response.status,
        duration: currentState.response.responseTime,
      });
    }
  }
}

/**
 * Track collection store changes
 */
function trackCollectionStoreChanges(
  currentState: { collections: Collection[]; activeCollection: Collection | null },
  previousState: { collections: Collection[]; activeCollection: Collection | null } | null
): void {
  if (!previousState) return;

  // Track new collections
  if (currentState.collections.length > previousState.collections.length) {
    const newCollections = currentState.collections.filter(
      (c) => !previousState.collections.some((p) => p.id === c.id)
    );

    newCollections.forEach((collection) => {
      behaviorTracker.trackCollection('create_collection', {
        name: collection.name,
        id: collection.id,
        requestCount: collection.items.length,
      });
    });
  }

  // Track deleted collections
  if (currentState.collections.length < previousState.collections.length) {
    const deletedCollections = previousState.collections.filter(
      (c) => !currentState.collections.some((p) => p.id === c.id)
    );

    deletedCollections.forEach((collection) => {
      behaviorTracker.trackEvent('collection', 'delete_collection', {
        label: collection.name,
        metadata: { collectionId: collection.id },
      });
    });
  }

  // Track active collection changes
  if (currentState.activeCollection?.id !== previousState.activeCollection?.id) {
    if (currentState.activeCollection) {
      behaviorTracker.trackCollection('select_collection', {
        name: currentState.activeCollection.name,
        id: currentState.activeCollection.id,
        requestCount: currentState.activeCollection.items.length,
      });
    }
  }
}

/**
 * Track environment store changes
 */
function trackEnvironmentStoreChanges(
  currentState: { environments: Environment[]; activeEnvironment: Environment | null },
  previousState: { environments: Environment[]; activeEnvironment: Environment | null } | null
): void {
  if (!previousState) return;

  // Track new environments
  if (currentState.environments.length > previousState.environments.length) {
    const newEnvironments = currentState.environments.filter(
      (e) => !previousState.environments.some((p) => p.id === e.id)
    );

    newEnvironments.forEach((environment) => {
      behaviorTracker.trackEnvironment('create_environment', {
        name: environment.name,
        id: environment.id,
        variableCount: environment.variables.length,
      });
    });
  }

  // Track deleted environments
  if (currentState.environments.length < previousState.environments.length) {
    const deletedEnvironments = previousState.environments.filter(
      (e) => !currentState.environments.some((p) => p.id === e.id)
    );

    deletedEnvironments.forEach((environment) => {
      behaviorTracker.trackEvent('environment', 'delete_environment', {
        label: environment.name,
        metadata: { environmentId: environment.id },
      });
    });
  }

  // Track active environment changes
  if (currentState.activeEnvironment?.id !== previousState.activeEnvironment?.id) {
    if (currentState.activeEnvironment) {
      behaviorTracker.trackEnvironment('select_environment', {
        name: currentState.activeEnvironment.name,
        id: currentState.activeEnvironment.id,
        variableCount: currentState.activeEnvironment.variables.length,
      });
    } else {
      behaviorTracker.trackEnvironment('select_environment');
    }
  }
}

/**
 * Track settings changes
 */
function trackSettingsChanges(
  currentState: SettingsSerializableState,
  previousState: SettingsSerializableState | null
): void {
  if (!previousState) return;

  // Track individual setting changes
  const settingsFields: (keyof SettingsSerializableState)[] = ['fontSize', 'tabSize', 'wordWrap', 'autoFormatJson', 'language', 'autoSave', 'sendAnalytics', 'sidebarVisible'];

  settingsFields.forEach((field) => {
    if (currentState[field] !== previousState[field]) {
      switch (field) {
        case 'fontSize':
          behaviorTracker.trackSettings('fontSize', currentState[field]);
          break;
        case 'tabSize':
          behaviorTracker.trackSettings('tabSize', currentState[field]);
          break;
        case 'wordWrap':
          behaviorTracker.trackSettings('wordWrap', currentState[field]);
          break;
        case 'autoFormatJson':
          behaviorTracker.trackSettings('autoFormatJson', currentState[field]);
          break;
        case 'language':
          behaviorTracker.trackSettings('language', currentState[field]);
          break;
        case 'autoSave':
          behaviorTracker.trackSettings('autoSave', currentState[field]);
          break;
        case 'sendAnalytics':
          behaviorTracker.trackSettings('analytics', currentState[field]);
          break;
        case 'sidebarVisible':
          behaviorTracker.trackSettings('sidebar', currentState[field]);
          behaviorTracker.trackInteraction('toggle_sidebar', 'Sidebar Toggle');
          break;
      }
    }
  });
}

// Export for manual tracking usage
export { behaviorTracker };
