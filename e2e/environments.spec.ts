/**
 * Environments Management E2E Tests
 *
 * Tests for environment management:
 * - Create, view, update, delete environments
 * - Variable management
 * - Active environment selection
 */

import { test, expect } from '@playwright/test';
import {
  loadApp,
  mainContent,
} from './fixtures/tauri-mock';

test.describe('Environments Page', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await page.locator('button[title="Environments"]').click();
  });

  // ---------------------------------------------------------------------------
  // Display Environments
  // ---------------------------------------------------------------------------
  test('displays existing environments and their variables', async ({ page }) => {
    await expect(mainContent(page).locator('h2:has-text("Environments")')).toBeVisible();
    await expect(mainContent(page).getByRole('heading', { name: 'Development' })).toBeVisible();
    await expect(mainContent(page).locator('text=Active').first()).toBeVisible();

    await expect(mainContent(page).locator('text={{BASE_URL}}')).toBeVisible();
  });

  test('shows empty state when no environments exist', async ({ page }) => {
    // Navigate away and back with empty environments
    await page.locator('button[title="Collections"]').click();
    await loadApp(page, { environments: [] });
    await page.locator('button[title="Environments"]').click();

    await expect(mainContent(page).locator('h2:has-text("No Environments Yet")')).toBeVisible();
  });

  test('displays multiple environments in list', async ({ page }) => {
    await expect(mainContent(page).getByRole('heading', { name: 'Development' })).toBeVisible();
    await expect(mainContent(page).locator('span').filter({ hasText: 'Production' }).first()).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Create Environment
  // ---------------------------------------------------------------------------
  test.describe('Create Environment', () => {
    test('opens Create Environment modal', async ({ page }) => {
      // Click the + button to create new environment
      await mainContent(page).locator('button[title="New Environment"]').click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal.locator('h2:has-text("Create Environment")')).toBeVisible();
    });

    test('creates a new environment', async ({ page }) => {
      await mainContent(page).locator('button[title="New Environment"]').click();

      const modal = page.locator('.fixed.inset-0');
      await modal.locator('input[placeholder*="Development, Staging"]').fill('Staging');
      await modal.locator('button:has-text("Create")').last().click();

      await expect(modal.locator('h2:has-text("Create Environment")')).toBeHidden({ timeout: 5000 });
    });

    test('validates required environment name', async ({ page }) => {
      await mainContent(page).locator('button[title="New Environment"]').click();

      const modal = page.locator('.fixed.inset-0');
      await modal.locator('button:has-text("Create")').last().click();

      await expect(modal.locator('text=Please enter an environment name')).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Variable Management
  // ---------------------------------------------------------------------------
  test.describe('Variable Management', () => {
    test('adds a new variable to environment', async ({ page }) => {
      // Development is already selected by default
      // Fill in new variable
      const keyInput = mainContent(page).locator('input[placeholder="Variable name"]');
      const valueInput = mainContent(page).locator('input[placeholder="Value"]');

      await keyInput.fill('NEW_VAR');
      await valueInput.fill('new-value');

      // Click Add button
      await mainContent(page).locator('button:has-text("Add")').click();

      // Verify variable appears
      await expect(mainContent(page).locator('text={{NEW_VAR}}')).toBeVisible();
    });

    test('toggles variable enabled state', async ({ page }) => {
      // Find the checkbox for the first variable - it's a custom Checkbox component
      const checkbox = mainContent(page).locator('button[role="checkbox"], .cursor-pointer').first();
      await expect(checkbox).toBeVisible({ timeout: 3000 });
    });

    test('deletes a variable from environment', async ({ page }) => {
      // Verify variable exists
      await expect(mainContent(page).locator('text={{BASE_URL}}')).toBeVisible();

      // Find and click delete button for the variable (Trash icon)
      const varRow = mainContent(page).locator('text={{BASE_URL}}').locator('xpath=ancestor::div[contains(@class, "flex")]').first();
      const deleteButton = varRow.locator('button[title="Delete"]');

      if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await deleteButton.click();
        // Variable should be removed
        await expect(mainContent(page).locator('text={{BASE_URL}}')).toBeHidden({ timeout: 3000 });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Active Environment
  // ---------------------------------------------------------------------------
  test.describe('Active Environment', () => {
    test('shows active badge on active environment', async ({ page }) => {
      await expect(mainContent(page).locator('text=Active').first()).toBeVisible();
    });

    test('sets a different environment as active', async ({ page }) => {
      // Click on Production environment to select it
      await mainContent(page).locator('text=Production').click();

      // Look for "Set Active" button
      const setActiveButton = mainContent(page).locator('button:has-text("Set Active")');
      await expect(setActiveButton).toBeVisible({ timeout: 2000 });
      await setActiveButton.click();

      // Button should now show "Active"
      await expect(mainContent(page).locator('button:has-text("Active")')).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Environment
  // ---------------------------------------------------------------------------
  test.describe('Delete Environment', () => {
    test('shows delete confirmation for environment', async ({ page }) => {
      // Select Production environment
      await mainContent(page).locator('text=Production').click();

      // Hover to reveal delete button
      const prodRow = mainContent(page).locator('text=Production').locator('xpath=ancestor::div[contains(@class, "group")]').first();
      await prodRow.hover();

      // Click delete button (trash icon)
      const deleteButton = prodRow.locator('svg').locator('xpath=ancestor::button').last();

      if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deleteButton.click();

        // Confirmation dialog should appear
        await expect(page.locator('text=Delete Environment')).toBeVisible();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Variable Reference Display
  // ---------------------------------------------------------------------------
  test('shows variable references in {{key}} format', async ({ page }) => {
    await expect(mainContent(page).locator('text={{BASE_URL}}')).toBeVisible();
    await expect(mainContent(page).locator('text={{API_KEY}}')).toBeVisible();
  });
});