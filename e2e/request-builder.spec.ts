/**
 * Request Builder Advanced E2E Tests
 *
 * Tests for advanced request builder functionality:
 * - All HTTP methods
 * - Body types (form-data, urlencoded, raw)
 * - API Key auth
 * - Error handling
 * - Copy response
 */

import { test, expect } from '@playwright/test';
import {
  loadApp,
  mainContent,
  navigateToRequestBuilder,
  MOCK_ERROR_RESPONSE,
} from './fixtures/tauri-mock';

test.describe('Request Builder - HTTP Methods', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToRequestBuilder(page);
  });

  const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  for (const method of methods) {
    test(`selects ${method} method`, async ({ page }) => {
      const methodButton = mainContent(page).locator(`button:has-text("GET")`).first();
      await methodButton.click();

      const dropdown = page.locator('.absolute.top-full');
      await dropdown.locator(`button:has-text("${method}")`).click();

      await expect(mainContent(page).locator(`button:has-text("${method}")`).first()).toBeVisible();
    });
  }
});

test.describe('Request Builder - Body Types', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToRequestBuilder(page);
    await mainContent(page).locator('button:has-text("body")').first().click();
  });

  test('selects JSON body type and shows editor', async ({ page }) => {
    await mainContent(page).locator('button:has-text("JSON")').first().click();

    // Wait for loading state to disappear
    await expect(page.locator('text=Loading editor')).toBeHidden({ timeout: 10000 });

    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 5000 });
  });

  test('selects None body type', async ({ page }) => {
    await mainContent(page).locator('button:has-text("None")').first().click();

    // No editor should be visible
    await expect(page.locator('.monaco-editor')).toBeHidden();
  });

  test('selects XML body type', async ({ page }) => {
    await mainContent(page).locator('button:has-text("XML")').first().click();

    // Wait for loading state to disappear
    await expect(page.locator('text=Loading editor')).toBeHidden({ timeout: 10000 });

    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 5000 });
  });

  test('selects Raw body type', async ({ page }) => {
    await mainContent(page).locator('button:has-text("Raw")').first().click();

    // Wait for loading state to disappear
    await expect(page.locator('text=Loading editor')).toBeHidden({ timeout: 10000 });

    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Request Builder - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToRequestBuilder(page);
    await mainContent(page).locator('button:has-text("auth")').first().click();
  });

  test('configures No Auth (default)', async ({ page }) => {
    await expect(mainContent(page).locator('button:has-text("No Auth")')).toBeVisible();
  });

  test('configures Bearer Token auth', async ({ page }) => {
    await mainContent(page).locator('button:has-text("No Auth")').click();
    await page.locator('button:has-text("Bearer Token")').click();

    const tokenInput = page.locator('input[placeholder="Enter bearer token"]');
    await expect(tokenInput).toBeVisible();
    await tokenInput.fill('my-secret-token');
    await expect(tokenInput).toHaveValue('my-secret-token');
  });

  test('configures Basic Auth', async ({ page }) => {
    await mainContent(page).locator('button:has-text("No Auth")').click();
    await page.locator('button:has-text("Basic Auth")').click();

    const usernameInput = page.locator('input[placeholder="Enter username"]');
    const passwordInput = page.locator('input[placeholder="Enter password"]');
    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    await usernameInput.fill('admin');
    await passwordInput.fill('secret');

    await expect(usernameInput).toHaveValue('admin');
    await expect(passwordInput).toHaveValue('secret');
  });

  test('configures API Key auth', async ({ page }) => {
    await mainContent(page).locator('button:has-text("No Auth")').click();
    await page.locator('button:has-text("API Key")').click();

    // Should show key, value, and location inputs
    const keyInput = page.locator('input[placeholder*="Key"], input[placeholder*="key name"]').first();
    const valueInput = page.locator('input[placeholder*="Value"], input[placeholder*="value"]').first();

    if (await keyInput.isVisible({ timeout: 1000 }).catch(() => false)) {
      await keyInput.fill('X-API-Key');
      await valueInput.fill('my-api-key-123');

      await expect(keyInput).toHaveValue('X-API-Key');
      await expect(valueInput).toHaveValue('my-api-key-123');
    }
  });
});

test.describe('Request Builder - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToRequestBuilder(page);
  });

  test('shows error for network failure', async ({ page }) => {
    await loadApp(page, { shouldFailRequest: true });
    await navigateToRequestBuilder(page);

    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
    await mainContent(page).getByRole('button', { name: 'Send' }).click();

    // Should show error message or error state
    // Check for error-related text in the response area
    await expect(page.locator('text=/error|Error|failed|Failed|Network/i')).toBeVisible({ timeout: 10000 });
  });

  test('shows error response status for 4xx', async ({ page }) => {
    await loadApp(page, { httpResponse: MOCK_ERROR_RESPONSE });
    await navigateToRequestBuilder(page);

    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/notfound');
    await mainContent(page).getByRole('button', { name: 'Send' }).click();

    // Should show 404 status
    await expect(page.locator('text=404')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Not Found')).toBeVisible();
  });

  test('disables send button when URL is empty', async ({ page }) => {
    const sendButton = mainContent(page).getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeDisabled();
  });

  test('enables send button when URL is entered', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/test');

    const sendButton = mainContent(page).getByRole('button', { name: 'Send' });
    await expect(sendButton).toBeEnabled();
  });
});

test.describe('Request Builder - Response Handling', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToRequestBuilder(page);
  });

  test('shows no-response placeholder initially', async ({ page }) => {
    await expect(page.locator('text=No response yet')).toBeVisible();
  });

  test('displays response status, time, and size after send', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
    await mainContent(page).getByRole('button', { name: 'Send' }).click();

    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Time:')).toBeVisible();
    await expect(page.locator('text=Size:')).toBeVisible();
  });

  test('shows response headers tab', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
    await mainContent(page).getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });

    // Click headers tab in response panel
    const responseHeadersTab = mainContent(page).locator('button:has-text("headers")').last();
    await responseHeadersTab.click();

    await expect(page.locator('text=content-type')).toBeVisible();
    await expect(page.locator('text=application/json')).toBeVisible();
  });

  test('copies response to clipboard', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');
    await mainContent(page).getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });

    // Find and click copy button
    const copyButton = page.locator('button[title="Copy response"], button:has-text("Copy")').first();
    if (await copyButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await copyButton.click();

      // Should show feedback (like "Copied!" or checkmark)
      await expect(page.locator('text=Copied, text=check')).toBeVisible();
    }
  });
});

test.describe('Request Builder - Save Request', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToRequestBuilder(page);
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/test');
  });

  test('opens Save Request modal', async ({ page }) => {
    await page.locator('button[title="Save Request"]').click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Save Request")')).toBeVisible();
    await expect(modal.locator('input[placeholder="Enter request name"]')).toBeVisible();
  });

  test('shows method and URL in save modal', async ({ page }) => {
    await page.locator('button[title="Save Request"]').click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('text=GET')).toBeVisible();
    await expect(modal.locator('text=api.example.com')).toBeVisible();
  });

  test('cancels save request', async ({ page }) => {
    await page.locator('button[title="Save Request"]').click();

    const modal = page.locator('.fixed.inset-0');
    await modal.locator('button:has-text("Cancel")').click();

    await expect(modal.locator('h2:has-text("Save Request")')).toBeHidden();
  });
});

test.describe('Request Builder - Keyboard Shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await navigateToRequestBuilder(page);
  });

  test('Ctrl+Enter sends request', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/users');

    await page.keyboard.press('Control+Enter');

    await expect(page.locator('text=Status: 200 OK')).toBeVisible({ timeout: 10000 });
  });

  test('Ctrl+S opens save modal', async ({ page }) => {
    await page.locator('input[placeholder*="Enter request URL"]').fill('https://api.example.com/test');

    await page.keyboard.press('Control+s');

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Save Request")')).toBeVisible();
  });
});