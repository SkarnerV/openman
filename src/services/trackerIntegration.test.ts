import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  initBehaviorTracking,
  cleanupBehaviorTracking,
  behaviorTracker,
} from './trackerIntegration';
import { useRequestStore } from '../stores/useRequestStore';
import { useCollectionStore } from '../stores/useCollectionStore';
import { useEnvironmentStore } from '../stores/useEnvironmentStore';
import { useSettingsStore } from '../stores/useSettingsStore';

// Mock the behavior tracker
vi.mock('./behaviorTracker', () => ({
  behaviorTracker: {
    startSession: vi.fn(),
    endSession: vi.fn(),
    trackRequest: vi.fn(),
    trackCollection: vi.fn(),
    trackEnvironment: vi.fn(),
    trackSettings: vi.fn(),
    trackEvent: vi.fn(),
    trackInteraction: vi.fn(),
  },
}));

describe('trackerIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset all stores to initial state
    useRequestStore.setState({
      currentRequest: null,
      response: null,
      isLoading: false,
      error: null,
      requestHistory: [],
      sourceCollectionId: null,
      sourceRequestId: null,
    });

    useCollectionStore.setState({
      collections: [],
      activeCollection: null,
      selectedRequest: null,
      isLoading: false,
      error: null,
      initialized: false,
    });

    useEnvironmentStore.setState({
      environments: [],
      activeEnvironment: null,
      isLoading: false,
      error: null,
      initialized: false,
    });

    useSettingsStore.setState({
      fontSize: 14,
      tabSize: 2,
      wordWrap: true,
      autoFormatJson: true,
      language: 'en',
      autoSave: true,
      sendAnalytics: true,
      sidebarVisible: true,
    });
  });

  afterEach(() => {
    cleanupBehaviorTracking();
  });

  describe('initBehaviorTracking', () => {
    it('should initialize tracking and start session', () => {
      initBehaviorTracking();

      expect(behaviorTracker.startSession).toHaveBeenCalled();
    });

    it('should set up store subscriptions', () => {
      initBehaviorTracking();

      // Make a store change
      useSettingsStore.getState().setFontSize(16);

      // The tracker should have been called
      expect(behaviorTracker.trackSettings).toHaveBeenCalled();
    });
  });

  describe('cleanupBehaviorTracking', () => {
    it('should end session on cleanup', () => {
      initBehaviorTracking();
      cleanupBehaviorTracking();

      expect(behaviorTracker.endSession).toHaveBeenCalled();
    });

    it('should stop tracking after cleanup', () => {
      initBehaviorTracking();
      cleanupBehaviorTracking();

      const initialCount = behaviorTracker.trackSettings.mock.calls.length;
      useSettingsStore.getState().setFontSize(18);

      // Tracker should not have been called for this change
      expect(behaviorTracker.trackSettings.mock.calls.length).toBe(initialCount);
    });
  });

  describe('Request Store Tracking', () => {
    it('should track request creation', () => {
      initBehaviorTracking();

      useRequestStore.getState().setCurrentRequest({
        id: 'req-1',
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(behaviorTracker.trackRequest).toHaveBeenCalledWith('create_request', {
        method: 'GET',
        url: 'https://api.example.com',
      });
    });

    it('should track request update', () => {
      initBehaviorTracking();

      // First create a request
      useRequestStore.getState().setCurrentRequest({
        id: 'req-1',
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      vi.clearAllMocks();

      // Update the same request
      useRequestStore.getState().setCurrentRequest({
        id: 'req-1',
        name: 'Updated Request',
        method: 'POST',
        url: 'https://api.example.com/users',
        headers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(behaviorTracker.trackRequest).toHaveBeenCalledWith('update_request', {
        method: 'POST',
        url: 'https://api.example.com/users',
      });
    });

    it('should track request clear', () => {
      initBehaviorTracking();

      // First create a request
      useRequestStore.getState().setCurrentRequest({
        id: 'req-1',
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      vi.clearAllMocks();

      // Clear the request
      useRequestStore.getState().setCurrentRequest(null);

      expect(behaviorTracker.trackRequest).toHaveBeenCalledWith('clear_request');
    });

    it('should track response', () => {
      initBehaviorTracking();

      useRequestStore.getState().setCurrentRequest({
        id: 'req-1',
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com',
        headers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      vi.clearAllMocks();

      useRequestStore.getState().setResponse({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: '{"success": true}',
        responseTime: 150,
        responseSize: 100,
      });

      expect(behaviorTracker.trackRequest).toHaveBeenCalledWith('send_request', {
        method: 'GET',
        url: 'https://api.example.com',
        status: 200,
        duration: 150,
      });
    });
  });

  describe('Collection Store Tracking', () => {
    it('should track collection creation', () => {
      initBehaviorTracking();

      // Mock the createCollection API
      vi.spyOn(useCollectionStore.getState(), 'createCollection').mockImplementation(
        async (name: string) => {
          const collection = {
            id: 'col-1',
            name,
            description: '',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          useCollectionStore.setState((state) => ({
            collections: [...state.collections, collection],
          }));
          return collection;
        }
      );

      // Directly add to store (simulating what createCollection does)
      useCollectionStore.setState((state) => ({
        collections: [
          ...state.collections,
          {
            id: 'col-1',
            name: 'Test Collection',
            description: '',
            variables: [],
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }));

      expect(behaviorTracker.trackCollection).toHaveBeenCalledWith(
        'create_collection',
        expect.objectContaining({
          name: 'Test Collection',
          id: 'col-1',
        })
      );
    });

    it('should track collection selection', () => {
      initBehaviorTracking();

      // First add a collection
      useCollectionStore.setState((state) => ({
        collections: [
          ...state.collections,
          {
            id: 'col-1',
            name: 'Test Collection',
            description: '',
            variables: [],
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }));

      vi.clearAllMocks();

      // Select the collection
      useCollectionStore.getState().setActiveCollection({
        id: 'col-1',
        name: 'Test Collection',
        description: '',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      expect(behaviorTracker.trackCollection).toHaveBeenCalledWith(
        'select_collection',
        expect.objectContaining({
          name: 'Test Collection',
          id: 'col-1',
        })
      );
    });
  });

  describe('Environment Store Tracking', () => {
    it('should track environment creation', () => {
      initBehaviorTracking();

      // Directly add to store
      useEnvironmentStore.setState((state) => ({
        environments: [
          ...state.environments,
          {
            id: 'env-1',
            name: 'Test Environment',
            isActive: false,
            variables: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }));

      expect(behaviorTracker.trackEnvironment).toHaveBeenCalledWith(
        'create_environment',
        expect.objectContaining({
          name: 'Test Environment',
          id: 'env-1',
        })
      );
    });

    // Note: setActiveEnvironment requires a workspace to be selected
    // This is tested through direct state changes in the integration tests
  });

  describe('Settings Store Tracking', () => {
    it('should track font size change', () => {
      initBehaviorTracking();

      useSettingsStore.getState().setFontSize(18);

      expect(behaviorTracker.trackSettings).toHaveBeenCalledWith('fontSize', 18);
    });

    it('should track theme change', () => {
      initBehaviorTracking();

      useSettingsStore.getState().setLanguage('zh');

      expect(behaviorTracker.trackSettings).toHaveBeenCalledWith('language', 'zh');
    });

    it('should track auto-save toggle', () => {
      initBehaviorTracking();

      useSettingsStore.getState().setAutoSave(false);

      expect(behaviorTracker.trackSettings).toHaveBeenCalledWith('autoSave', false);
    });

    it('should track sidebar toggle', () => {
      initBehaviorTracking();

      useSettingsStore.getState().toggleSidebar();

      expect(behaviorTracker.trackInteraction).toHaveBeenCalledWith(
        'toggle_sidebar',
        'Sidebar Toggle'
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should track complete user workflow', () => {
      initBehaviorTracking();

      // 1. Create a collection
      useCollectionStore.setState((state) => ({
        collections: [
          ...state.collections,
          {
            id: 'col-1',
            name: 'My API',
            description: '',
            items: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }));

      // 2. Create a request
      useRequestStore.getState().setCurrentRequest({
        id: 'req-1',
        name: 'Get Users',
        method: 'GET',
        url: 'https://api.example.com/users',
        headers: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 3. Send the request
      useRequestStore.getState().setResponse({
        status: 200,
        statusText: 'OK',
        headers: { 'content-type': 'application/json' },
        body: '[{"id": 1}]',
        responseTime: 150,
        responseSize: 100,
      });

      // 4. Create an environment
      useEnvironmentStore.setState((state) => ({
        environments: [
          ...state.environments,
          {
            id: 'env-1',
            name: 'Production',
            isActive: false,
            variables: [{ key: 'BASE_URL', value: 'https://api.example.com', enabled: true }],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      }));

      // 5. Change settings
      useSettingsStore.getState().setFontSize(16);

      // Verify all events were tracked
      expect(behaviorTracker.trackCollection).toHaveBeenCalled();
      expect(behaviorTracker.trackRequest).toHaveBeenCalled();
      expect(behaviorTracker.trackEnvironment).toHaveBeenCalled();
      expect(behaviorTracker.trackSettings).toHaveBeenCalled();
    });

    it('should handle rapid state changes', () => {
      initBehaviorTracking();

      // Rapidly change settings
      useSettingsStore.getState().setFontSize(16);
      useSettingsStore.getState().setFontSize(18);
      useSettingsStore.getState().setFontSize(20);
      useSettingsStore.getState().setFontSize(22);

      // Should track all changes
      expect(behaviorTracker.trackSettings).toHaveBeenCalledTimes(4);
    });

    it('should not track unchanged values', () => {
      initBehaviorTracking();

      const trackSettingsMock = vi.mocked(behaviorTracker.trackSettings);
      const initialCount = trackSettingsMock.mock.calls.length;

      // Set the same value
      useSettingsStore.getState().setFontSize(14);
      useSettingsStore.getState().setAutoSave(true);

      // Should not have tracked (values didn't change from initial state)
      expect(trackSettingsMock.mock.calls.length).toBe(initialCount);
    });
  });
});
