/**
 * Behavior Tracker Service
 *
 * Tracks user behavior events for analytics and testing purposes.
 * Integrates with Vitest for testing and Playwright for E2E verification.
 */

import { useSettingsStore } from '../stores/useSettingsStore';

// Event Types
export type EventCategory =
  | 'navigation'
  | 'request'
  | 'collection'
  | 'environment'
  | 'settings'
  | 'interaction'
  | 'performance';

export type EventAction =
  // Navigation events
  | 'navigate_to_page'
  | 'open_modal'
  | 'close_modal'
  | 'toggle_sidebar'
  // Request events
  | 'create_request'
  | 'update_request'
  | 'send_request'
  | 'save_request'
  | 'delete_request'
  | 'duplicate_request'
  | 'clear_request'
  // Collection events
  | 'create_collection'
  | 'update_collection'
  | 'delete_collection'
  | 'select_collection'
  | 'expand_collection'
  | 'collapse_collection'
  // Environment events
  | 'create_environment'
  | 'update_environment'
  | 'delete_environment'
  | 'select_environment'
  | 'add_variable'
  | 'remove_variable'
  | 'update_variable'
  // Settings events
  | 'change_theme'
  | 'change_font_size'
  | 'change_language'
  | 'toggle_auto_save'
  | 'toggle_analytics'
  // Interaction events
  | 'click_button'
  | 'type_input'
  | 'select_option'
  | 'toggle_checkbox'
  | 'copy_to_clipboard'
  | 'paste_from_clipboard'
  | 'scroll'
  | 'search';

// Event payload structure
export interface BehaviorEvent {
  id: string;
  timestamp: number;
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: string | number | boolean;
  metadata?: Record<string, unknown>;
  duration?: number; // For performance tracking
  error?: string;
}

// Event listener type
export type EventListener = (event: BehaviorEvent) => void;

// Performance metrics
export interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Session data
export interface SessionData {
  sessionId: string;
  startTime: number;
  events: BehaviorEvent[];
  metrics: PerformanceMetrics[];
}

class BehaviorTracker {
  private listeners: Set<EventListener> = new Set();
  private events: BehaviorEvent[] = [];
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private sessionId: string = '';
  private startTime: number = 0;
  private isTracking: boolean = false;

  constructor() {
    this.startSession();
  }

  /**
   * Generate unique event ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Start a new tracking session
   */
  startSession(): void {
    this.sessionId = this.generateId();
    this.startTime = Date.now();
    this.events = [];
    this.metrics.clear();
    this.isTracking = true;

    this.track({
      id: this.generateId(),
      timestamp: this.startTime,
      category: 'interaction',
      action: 'click_button',
      label: 'session_start',
      metadata: { sessionId: this.sessionId },
    });
  }

  /**
   * End current tracking session
   */
  endSession(): SessionData {
    const sessionData: SessionData = {
      sessionId: this.sessionId,
      startTime: this.startTime,
      events: [...this.events],
      metrics: Array.from(this.metrics.values()),
    };

    this.track({
      id: this.generateId(),
      timestamp: Date.now(),
      category: 'interaction',
      action: 'click_button',
      label: 'session_end',
      metadata: { sessionId: this.sessionId, eventCount: this.events.length },
    });

    this.isTracking = false;
    return sessionData;
  }

  /**
   * Check if analytics is enabled in settings
   */
  private isAnalyticsEnabled(): boolean {
    try {
      return useSettingsStore.getState().sendAnalytics;
    } catch {
      // If store not available (e.g., in tests), allow tracking
      return true;
    }
  }

  /**
   * Track a behavior event
   */
  track(event: BehaviorEvent): void {
    // Check if analytics is enabled
    if (!this.isAnalyticsEnabled()) {
      return;
    }

    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // Add ID if not provided
    if (!event.id) {
      event.id = this.generateId();
    }

    // Store event
    this.events.push(event);

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in behavior event listener:', error);
      }
    });
  }

  /**
   * Track a specific event with convenience methods
   */
  trackEvent(
    category: EventCategory,
    action: EventAction,
    options?: {
      label?: string;
      value?: string | number | boolean;
      metadata?: Record<string, unknown>;
      error?: string;
    }
  ): void {
    this.track({
      id: this.generateId(),
      timestamp: Date.now(),
      category,
      action,
      ...options,
    });
  }

  /**
   * Start performance measurement
   */
  startTimer(name: string, metadata?: Record<string, unknown>): void {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  /**
   * End performance measurement and track the duration
   */
  endTimer(name: string, label?: string): number | undefined {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Timer "${name}" was not started`);
      return undefined;
    }

    const endTime = performance.now();
    metric.endTime = endTime;
    metric.duration = endTime - metric.startTime;

    this.track({
      id: this.generateId(),
      timestamp: Date.now(),
      category: 'performance',
      action: 'send_request', // Using as generic performance event
      label: label || name,
      value: metric.duration,
      metadata: metric.metadata,
      duration: metric.duration,
    });

    const duration = metric.duration;
    this.metrics.delete(name);
    return duration;
  }

  /**
   * Track navigation events
   */
  trackNavigation(page: string, fromPage?: string): void {
    this.trackEvent('navigation', 'navigate_to_page', {
      label: page,
      metadata: { fromPage },
    });
  }

  /**
   * Track modal events
   */
  trackModal(action: 'open' | 'close', modalName: string): void {
    this.trackEvent('navigation', action === 'open' ? 'open_modal' : 'close_modal', {
      label: modalName,
    });
  }

  /**
   * Track request events
   */
  trackRequest(action: EventAction, requestData?: {
    method?: string;
    url?: string;
    duration?: number;
    status?: number;
  }): void {
    this.trackEvent('request', action, {
      label: `${requestData?.method || 'REQUEST'} ${requestData?.url || ''}`.trim(),
      value: requestData?.status,
      metadata: {
        method: requestData?.method,
        url: requestData?.url,
        status: requestData?.status,
        duration: requestData?.duration,
      },
    });
  }

  /**
   * Track collection events
   */
  trackCollection(action: EventAction, collectionData?: {
    name?: string;
    id?: string;
    requestCount?: number;
  }): void {
    this.trackEvent('collection', action, {
      label: collectionData?.name,
      metadata: {
        collectionId: collectionData?.id,
        requestCount: collectionData?.requestCount,
      },
    });
  }

  /**
   * Track environment events
   */
  trackEnvironment(action: EventAction, environmentData?: {
    name?: string;
    id?: string;
    variableCount?: number;
  }): void {
    this.trackEvent('environment', action, {
      label: environmentData?.name,
      metadata: {
        environmentId: environmentData?.id,
        variableCount: environmentData?.variableCount,
      },
    });
  }

  /**
   * Track settings changes
   */
  trackSettings(setting: string, value: unknown): void {
    this.trackEvent('settings', `change_${setting}` as EventAction, {
      value: value as string | number | boolean,
      metadata: { setting, value },
    });
  }

  /**
   * Track user interactions
   */
  trackInteraction(action: EventAction, elementLabel?: string, metadata?: Record<string, unknown>): void {
    this.trackEvent('interaction', action, {
      label: elementLabel,
      metadata,
    });
  }

  /**
   * Add event listener
   */
  addListener(listener: EventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Remove event listener
   */
  removeListener(listener: EventListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Get all tracked events
   */
  getEvents(): BehaviorEvent[] {
    return [...this.events];
  }

  /**
   * Get events by category
   */
  getEventsByCategory(category: EventCategory): BehaviorEvent[] {
    return this.events.filter((e) => e.category === category);
  }

  /**
   * Get events by action
   */
  getEventsByAction(action: EventAction): BehaviorEvent[] {
    return this.events.filter((e) => e.action === action);
  }

  /**
   * Get events within a time range
   */
  getEventsInRange(startTime: number, endTime: number): BehaviorEvent[] {
    return this.events.filter((e) => e.timestamp >= startTime && e.timestamp <= endTime);
  }

  /**
   * Get event count
   */
  getEventCount(): number {
    return this.events.length;
  }

  /**
   * Get session data
   */
  getSessionData(): SessionData {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      events: [...this.events],
      metrics: Array.from(this.metrics.values()),
    };
  }

  /**
   * Clear all tracked events (useful for testing)
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Reset tracker (useful for testing)
   */
  reset(): void {
    this.clearListeners();
    this.clearEvents();
    this.metrics.clear();
    this.startSession();
  }

  /**
   * Check if currently tracking
   */
  getIsTracking(): boolean {
    return this.isTracking;
  }
}

// Singleton instance
export const behaviorTracker = new BehaviorTracker();

// React hook for using the tracker
export const useBehaviorTracker = () => {
  return behaviorTracker;
};
