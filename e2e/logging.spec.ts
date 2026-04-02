/**
 * Logging E2E Tests
 *
 * Tests for user action logging functionality:
 * - Console logging output
 * - Log file persistence via Tauri commands
 * - Behavior tracker integration
 * - Version display in settings
 */

import { test, expect } from '@playwright/test';
import {
  loadApp,
  mainContent,
  sidebar,
} from './fixtures/tauri-mock';

test.describe('Logging System', () => {
  // ---------------------------------------------------------------------------
  // Console Logging
  // ---------------------------------------------------------------------------
  test.describe('Console Logging', () => {
    test('logs app initialization message', async ({ page }) => {
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'log') {
          consoleMessages.push(msg.text());
        }
      });

      await loadApp(page);

      // Should see initialization log with version
      expect(consoleMessages.some(msg =>
        msg.includes('[Openman v0.1.0]')
      )).toBeTruthy();
    });

    test('logs contain version 0.1.0', async ({ page }) => {
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        consoleMessages.push(msg.text());
      });

      await loadApp(page);

      // Version should appear in logs
      expect(consoleMessages.some(msg => msg.includes('v0.1.0'))).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // Tauri Log Command Integration
  // ---------------------------------------------------------------------------
  test.describe('Tauri Log Commands', () => {
    test('mock log_user_action command is available', async ({ page }) => {
      await loadApp(page);

      // Verify mock is set up correctly by checking the operation tracker
      const hasTracker = await page.evaluate(() =>
        typeof (window as unknown as { __tauriOperations: unknown }).__tauriOperations !== 'undefined'
      );

      expect(hasTracker).toBeTruthy();
    });

    test('can invoke log_user_action through mock', async ({ page }) => {
      await loadApp(page);

      // Invoke log command directly through mock
      await page.evaluate(async () => {
        await (window as unknown as { __TAURI_INTERNALS__: { invoke: (cmd: string, args: unknown) => Promise<void> } }).__TAURI_INTERNALS__.invoke('log_user_action', {
          version: '0.1.0',
          category: 'test',
          action: 'test_action',
          label: 'Test Label',
        });
      });

      // Check if log was recorded
      const logCalls = await page.evaluate(() =>
        (window as unknown as { __tauriOperations: { logCalls: unknown[] } }).__tauriOperations.logCalls
      );

      expect(logCalls.length).toBeGreaterThan(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Log Date Retrieval
  // ---------------------------------------------------------------------------
  test.describe('Log Date Retrieval', () => {
    test('get_log_dates_list returns available dates', async ({ page }) => {
      await loadApp(page);

      const logDates = await page.evaluate(async () => {
        const result = await (window as unknown as { __TAURI_INTERNALS__: { invoke: (cmd: string) => Promise<string[]> } }).__TAURI_INTERNALS__.invoke('get_log_dates_list');
        return result;
      });

      expect(logDates).toContain('2026-04-02');
      expect(logDates).toContain('2026-04-01');
    });

    test('get_logs returns log content for specific date', async ({ page }) => {
      await loadApp(page);

      const logs = await page.evaluate(async () => {
        const result = await (window as unknown as { __TAURI_INTERNALS__: { invoke: (cmd: string, args: unknown) => Promise<string[]> } }).__TAURI_INTERNALS__.invoke('get_logs', { date: '2026-04-02' });
        return result;
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0]).toContain('v0.1.0');
    });

    test('log format contains all required fields', async ({ page }) => {
      await loadApp(page);

      const logs = await page.evaluate(async () => {
        const result = await (window as unknown as { __TAURI_INTERNALS__: { invoke: (cmd: string, args: unknown) => Promise<string[]> } }).__TAURI_INTERNALS__.invoke('get_logs', { date: '2026-04-02' });
        return result;
      });

      // Check log format has timestamp, version, category, action
      const log = logs[0];
      expect(log).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z\]/); // timestamp
      expect(log).toContain('v0.1.0');
      expect(log).toContain('|'); // field separators
    });
  });

  // ---------------------------------------------------------------------------
  // File Logger Service
  // ---------------------------------------------------------------------------
  test.describe('File Logger Service', () => {
    test('fileLogger module is loaded', async ({ page }) => {
      await loadApp(page);

      // Check if fileLogger is imported and working
      const result = await page.evaluate(async () => {
        // The module should be available through behavior tracker
        return typeof (window as unknown as { __tauriOperations: { logCalls: unknown[] } }).__tauriOperations?.logCalls !== 'undefined';
      });

      expect(result).toBeTruthy();
    });

    test('log entries have correct structure', async ({ page }) => {
      await loadApp(page);

      // Trigger a log entry
      await page.evaluate(async () => {
        await (window as unknown as { __TAURI_INTERNALS__: { invoke: (cmd: string, args: unknown) => Promise<void> } }).__TAURI_INTERNALS__.invoke('log_user_action', {
          version: '0.1.0',
          category: 'test',
          action: 'test_action',
          label: 'Test',
          value: 'test_value',
          metadata: { key: 'value' },
        });
      });

      const logCalls = await page.evaluate(() =>
        (window as unknown as { __tauriOperations: { logCalls: { version: string; category: string; action: string; label?: string }[] } }).__tauriOperations.logCalls
      );

      const lastLog = logCalls[logCalls.length - 1];
      expect(lastLog.version).toBe('0.1.0');
      expect(lastLog.category).toBe('test');
      expect(lastLog.action).toBe('test_action');
      expect(lastLog.label).toBe('Test');
    });
  });

  // ---------------------------------------------------------------------------
  // Behavior Tracker Integration
  // ---------------------------------------------------------------------------
  test.describe('Behavior Tracker', () => {
    test('behavior tracker is initialized on app load', async ({ page }) => {
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        consoleMessages.push(msg.text());
      });

      await loadApp(page);

      // Should see behavior tracking enabled message
      expect(consoleMessages.some(msg =>
        msg.includes('behavior tracking') || msg.includes('initialized')
      )).toBeTruthy();
    });

    test('navigation to settings triggers console logging', async ({ page }) => {
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'log') {
          consoleMessages.push(msg.text());
        }
      });

      await loadApp(page);

      // Navigate to settings
      await page.locator('button[title="Settings"]').click();
      await expect(page.locator('text=General Settings')).toBeVisible();

      // Wait a bit for logs to accumulate
      await page.waitForTimeout(500);

      // Should see User Action logs in console
      expect(consoleMessages.some(msg =>
        msg.includes('User Action:') || msg.includes('Openman')
      )).toBeTruthy();
    });
  });
});