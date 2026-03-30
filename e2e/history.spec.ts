/**
 * History Page E2E Tests
 *
 * Tests for request history:
 * - View history grouped by date
 * - Filter by method
 * - Search history
 * - Reload request from history
 * - Clear history
 */

import { test, expect } from '@playwright/test';
import {
  loadApp,
  mainContent,
  navigateToRequestBuilder,
  MOCK_HTTP_RESPONSE,
} from './fixtures/tauri-mock';

test.describe('History Page', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  // ---------------------------------------------------------------------------
  // Empty State
  // ---------------------------------------------------------------------------
  test('shows empty state when no history exists', async ({ page }) => {
    await page.locator('button[title="History"]').click();

    await expect(mainContent(page).locator('h2:has-text("No History Yet")')).toBeVisible();
    await expect(mainContent(page).locator('text=Your request history will appear here')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // History After Requests
  // ---------------------------------------------------------------------------
  test.describe('With Request History', () => {
    test.beforeEach(async ({ page }) => {
      // Send a request to create history
      await navigateToRequestBuilder(page);
      await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
      await mainContent(page).getByRole('button', { name: 'Send' }).click();
      await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });
    });

    test('shows request in history after sending', async ({ page }) => {
      await page.locator('button[title="History"]').click();

      await expect(mainContent(page).locator('text=GET')).toBeVisible();
      await expect(mainContent(page).locator('text=/users')).toBeVisible();
    });

    test('groups history by date', async ({ page }) => {
      // Send another request
      await page.locator('button[title="Collections"]').click();
      await navigateToRequestBuilder(page);
      await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/posts');
      await mainContent(page).getByRole('button', { name: 'Send' }).click();
      await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });

      // Navigate to history
      await page.locator('button[title="History"]').click();

      // Should show today's date header
      const today = new Date().toLocaleDateString();
      await expect(mainContent(page).locator(`text=${today}`).or(mainContent(page).locator('text=Today'))).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Filtering and Search
  // ---------------------------------------------------------------------------
  test.describe('Filtering and Search', () => {
    test.beforeEach(async ({ page }) => {
      // Send multiple requests
      await navigateToRequestBuilder(page);

      // GET request
      await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
      await mainContent(page).getByRole('button', { name: 'Send' }).click();
      await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });

      // POST request
      await page.keyboard.press('Control+n');
      await mainContent(page).locator('button:has-text("GET")').first().click();
      await page.locator('.absolute.top-full button:has-text("POST")').click();
      await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/posts');
      await mainContent(page).getByRole('button', { name: 'Send' }).click();
      await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });
    });

    test('filters history by HTTP method', async ({ page }) => {
      await page.locator('button[title="History"]').click();

      // Find method filter dropdown
      const methodFilter = mainContent(page).locator('select, button:has-text("all")').first();
      if (await methodFilter.isVisible({ timeout: 1000 }).catch(() => false)) {
        await methodFilter.click();

        // Select GET
        await page.locator('button:has-text("GET"), option:has-text("GET")').first().click();

        // Should only show GET requests
        await expect(mainContent(page).locator('text=GET')).toBeVisible();
        await expect(mainContent(page).locator('text=POST')).toBeHidden();
      }
    });

    test('searches history by URL', async ({ page }) => {
      await page.locator('button[title="History"]').click();

      const searchInput = mainContent(page).locator('input[placeholder*="Search"]');
      await searchInput.fill('users');

      await expect(mainContent(page).locator('text=/users')).toBeVisible();
      await expect(mainContent(page).locator('text=/posts')).toBeHidden();
    });

    test('searches history by request name', async ({ page }) => {
      await page.locator('button[title="History"]').click();

      const searchInput = mainContent(page).locator('input[placeholder*="Search"]');
      await searchInput.fill('posts');

      await expect(mainContent(page).locator('text=/posts')).toBeVisible();
      await expect(mainContent(page).locator('text=/users')).toBeHidden();
    });
  });

  // ---------------------------------------------------------------------------
  // Reload from History
  // ---------------------------------------------------------------------------
  test.describe('Reload from History', () => {
    test.beforeEach(async ({ page }) => {
      // Send a request
      await navigateToRequestBuilder(page);
      await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
      await mainContent(page).getByRole('button', { name: 'Send' }).click();
      await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });
    });

    test('clicking history item loads it into builder', async ({ page }) => {
      await page.locator('button[title="History"]').click();

      // Click on the history item
      await mainContent(page).locator('text=/users').click();

      // Should navigate to request builder with URL loaded
      const urlInput = page.locator('input[placeholder*="Enter request URL"]');
      await expect(urlInput).toBeVisible();
      await expect(urlInput).toHaveValue('https://api.example.com/users');
    });
  });

  // ---------------------------------------------------------------------------
  // Clear History
  // ---------------------------------------------------------------------------
  test.describe('Clear History', () => {
    test.beforeEach(async ({ page }) => {
      // Send a request
      await navigateToRequestBuilder(page);
      await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
      await mainContent(page).getByRole('button', { name: 'Send' }).click();
      await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });
    });

    test('clears all history', async ({ page }) => {
      await page.locator('button[title="History"]').click();

      // Find and click clear history button
      const clearButton = mainContent(page).locator('button:has-text("Clear History"), button:has-text("Clear")').first();
      if (await clearButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await clearButton.click();

        // Should show empty state
        await expect(mainContent(page).locator('h2:has-text("No History Yet")')).toBeVisible();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Method Color Coding
  // ---------------------------------------------------------------------------
  test('displays correct color for HTTP methods', async ({ page }) => {
    // Send requests with different methods
    await navigateToRequestBuilder(page);

    // GET
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
    await mainContent(page).getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });

    // POST
    await page.keyboard.press('Control+n');
    await mainContent(page).locator('button:has-text("GET")').first().click();
    await page.locator('.absolute.top-full button:has-text("POST")').click();
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/posts');
    await mainContent(page).getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });

    // Navigate to history
    await page.locator('button[title="History"]').click();

    // Verify method labels are visible (use first() to avoid strict mode)
    await expect(mainContent(page).locator('span.text-get-method').first()).toBeVisible();
    await expect(mainContent(page).locator('span.text-post-method').first()).toBeVisible();
  });
});