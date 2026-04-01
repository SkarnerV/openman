/**
 * Import/Export E2E Tests
 *
 * Tests for import/export functionality:
 * - Import from Postman collection
 * - Import from cURL command
 * - Export collection to JSON
 * - Export to cURL
 * - Duplicate collection
 * - Environment export/import
 */

import { test, expect } from '@playwright/test';
import {
  loadApp,
  sidebar,
  mainContent,
} from './fixtures/tauri-mock';

// Sample cURL command for testing
const SAMPLE_CURL_COMMAND = `curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{"name": "test"}'`;

test.describe('Import Modal', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('opens import modal from sidebar', async ({ page }) => {
    // Click the Upload icon button in sidebar
    const uploadButton = sidebar(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await uploadButton.click();

    // Modal should be visible
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Import")')).toBeVisible();
  });

  test('shows three import source tabs', async ({ page }) => {
    const uploadButton = sidebar(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await uploadButton.click();

    // Wait for modal to appear
    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    // Check for tab buttons - they are in the header area before the content
    // Use exact text match for the tab buttons
    const tabsContainer = modal.locator('div.flex.gap-2').first();
    await expect(tabsContainer.getByRole('button', { name: 'File', exact: true })).toBeVisible({ timeout: 5000 });
    await expect(tabsContainer.getByRole('button', { name: 'URL', exact: true })).toBeVisible();
    await expect(tabsContainer.getByRole('button', { name: 'cURL', exact: true })).toBeVisible();
  });

  test('switches between import source tabs', async ({ page }) => {
    const uploadButton = sidebar(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await uploadButton.click();

    const modal = page.locator('.fixed.inset-0');
    await expect(modal).toBeVisible();

    const tabsContainer = modal.locator('div.flex.gap-2').first();

    // Click cURL tab
    await tabsContainer.getByRole('button', { name: 'cURL', exact: true }).click();
    await expect(modal.locator('textarea')).toBeVisible();

    // Click URL tab
    await tabsContainer.getByRole('button', { name: 'URL', exact: true }).click();
    await expect(modal.locator('input[type="text"]')).toBeVisible();

    // Click File tab
    await tabsContainer.getByRole('button', { name: 'File', exact: true }).click();
    // File tab shows a button to select file
    await expect(modal.locator('button:has-text("select")')).toBeVisible();
  });

  test('closes modal on cancel', async ({ page }) => {
    const uploadButton = sidebar(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await uploadButton.click();

    const modal = page.locator('.fixed.inset-0');
    await modal.getByRole('button', { name: 'Cancel' }).click();

    await expect(modal).toBeHidden();
  });

  test('closes modal on X button', async ({ page }) => {
    const uploadButton = sidebar(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await uploadButton.click();

    const modal = page.locator('.fixed.inset-0');
    // Click X button in header
    await modal.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();

    await expect(modal).toBeHidden();
  });
});

test.describe('Import from cURL', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('parses cURL command and shows in textarea', async ({ page }) => {
    const uploadButton = sidebar(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await uploadButton.click();

    const modal = page.locator('.fixed.inset-0');
    await modal.getByRole('button', { name: 'cURL' }).click();

    const textarea = modal.locator('textarea[placeholder*="cURL"]');
    await textarea.fill(SAMPLE_CURL_COMMAND);

    // Verify the textarea contains the command
    await expect(textarea).toHaveValue(SAMPLE_CURL_COMMAND);
  });

  test('import button is disabled without content', async ({ page }) => {
    const uploadButton = sidebar(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await uploadButton.click();

    const modal = page.locator('.fixed.inset-0');
    await modal.getByRole('button', { name: 'cURL' }).click();

    // Import button should be disabled when textarea is empty
    await expect(modal.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  test('import button is enabled with cURL command', async ({ page }) => {
    const uploadButton = sidebar(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await uploadButton.click();

    const modal = page.locator('.fixed.inset-0');
    await modal.getByRole('button', { name: 'cURL' }).click();

    const textarea = modal.locator('textarea[placeholder*="cURL"]');
    await textarea.fill(SAMPLE_CURL_COMMAND);

    // Import button should be enabled
    await expect(modal.getByRole('button', { name: 'Import' })).toBeEnabled();
  });
});

test.describe('Export Collection', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('shows export button on collection hover', async ({ page }) => {
    // Hover over a collection to show action buttons
    const collectionItem = sidebar(page).locator('text=Users API').locator('xpath=ancestor::div[contains(@class, "group")]').first();
    await collectionItem.hover();

    // Export button (Download icon) should be visible
    const exportButton = collectionItem.locator('svg.lucide-download').locator('xpath=ancestor::button');
    await expect(exportButton).toBeVisible({ timeout: 2000 });
  });

  test('opens export modal on click', async ({ page }) => {
    const collectionItem = sidebar(page).locator('text=Users API').locator('xpath=ancestor::div[contains(@class, "group")]').first();
    await collectionItem.hover();

    const exportButton = collectionItem.locator('svg.lucide-download').locator('xpath=ancestor::button');
    await exportButton.click({ timeout: 2000 });

    // Export modal should be visible
    const modal = page.locator('.fixed.inset-0');
    await expect(modal.locator('h2:has-text("Export Collection")')).toBeVisible();
  });

  test('shows format selection in export modal', async ({ page }) => {
    const collectionItem = sidebar(page).locator('text=Users API').locator('xpath=ancestor::div[contains(@class, "group")]').first();
    await collectionItem.hover();

    const exportButton = collectionItem.locator('svg.lucide-download').locator('xpath=ancestor::button');
    await exportButton.click({ timeout: 2000 });

    const modal = page.locator('.fixed.inset-0');
    await expect(modal.getByRole('button', { name: /Postman/ })).toBeVisible();
    await expect(modal.getByRole('button', { name: /Openman/ })).toBeVisible();
  });

  test('closes export modal on cancel', async ({ page }) => {
    const collectionItem = sidebar(page).locator('text=Users API').locator('xpath=ancestor::div[contains(@class, "group")]').first();
    await collectionItem.hover();

    const exportButton = collectionItem.locator('svg.lucide-download').locator('xpath=ancestor::button');
    await exportButton.click({ timeout: 2000 });

    const modal = page.locator('.fixed.inset-0');
    await modal.getByRole('button', { name: 'Cancel' }).click();

    await expect(modal).toBeHidden();
  });
});

test.describe('Duplicate Collection', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('shows duplicate button on collection hover', async ({ page }) => {
    const collectionItem = sidebar(page).locator('text=Users API').locator('xpath=ancestor::div[contains(@class, "group")]').first();
    await collectionItem.hover();

    // Duplicate button (Copy icon) should be visible
    const duplicateButton = collectionItem.locator('svg.lucide-copy').locator('xpath=ancestor::button');
    await expect(duplicateButton).toBeVisible({ timeout: 2000 });
  });
});

test.describe('Copy as cURL', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('shows copy as cURL button in request builder', async ({ page }) => {
    // Navigate to request builder by clicking New Request
    await sidebar(page).locator('button:has-text("New Request")').click();

    // Look for the Copy as cURL button by title
    const curlButton = page.locator('button[title="Copy as cURL"]');
    await expect(curlButton).toBeVisible();
  });

  test('copy as cURL button is in the request bar', async ({ page }) => {
    await sidebar(page).locator('button:has-text("New Request")').click();

    // The button should be near the Send button in the request bar
    const sendButton = page.locator('button:has-text("Send")');
    await expect(sendButton).toBeVisible();

    // Copy as cURL button should be nearby
    const curlButton = page.locator('button[title="Copy as cURL"]');
    await expect(curlButton).toBeVisible();
  });
});

test.describe('Request History Panel', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('shows history section after making a request', async ({ page }) => {
    // Make a request first
    await sidebar(page).locator('button:has-text("New Request")').click();

    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await urlInput.fill('https://api.example.com/test');

    await page.locator('button:has-text("Send")').click();

    // Wait for response
    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 5000 });

    // History section should now be visible in sidebar
    await expect(sidebar(page).locator('text=History')).toBeVisible({ timeout: 2000 });
  });

  test('history shows recent requests', async ({ page }) => {
    // Make a request
    await sidebar(page).locator('button:has-text("New Request")').click();

    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await urlInput.fill('https://api.example.com/users');
    await page.locator('button:has-text("Send")').click();

    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 5000 });

    // History section should show the request
    await expect(sidebar(page).locator('text=History')).toBeVisible();

    // Check for the method in history
    await expect(sidebar(page).locator('text=GET')).toBeVisible();
  });

  test('can clear history', async ({ page }) => {
    // Make a request
    await sidebar(page).locator('button:has-text("New Request")').click();

    const urlInput = page.locator('input[placeholder*="Enter request URL"]');
    await urlInput.fill('https://api.example.com/test');
    await page.locator('button:has-text("Send")').click();

    await expect(page.locator('text=Status:')).toBeVisible({ timeout: 5000 });

    // Click Clear button
    await sidebar(page).locator('text=Clear').click();

    // History section should be hidden or empty
    await expect(sidebar(page).locator('text=History')).toBeHidden();
  });
});

test.describe('Environment Export/Import', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  test('navigates to environments page', async ({ page }) => {
    // Click on Environments button in ActivityBar (Globe icon)
    await page.locator('button[title="Environments"]').click();

    // Should be on environments page
    await expect(mainContent(page).locator('text=Environments')).toBeVisible();
  });

  test('shows import button on environments page', async ({ page }) => {
    await page.locator('button[title="Environments"]').click();

    // Import button should be visible (Upload icon)
    const importButton = mainContent(page).locator('svg.lucide-upload').locator('xpath=ancestor::button');
    await expect(importButton).toBeVisible();
  });

  test('shows export button on environment hover', async ({ page }) => {
    await page.locator('button[title="Environments"]').click();

    // Hover over an environment
    const envItem = mainContent(page).locator('text=Development').locator('xpath=ancestor::div[contains(@class, "group")]').first();
    await envItem.hover();

    // Export button (Download icon) should be visible
    const exportButton = envItem.locator('svg.lucide-download').locator('xpath=ancestor::button');
    await expect(exportButton).toBeVisible({ timeout: 2000 });
  });
});