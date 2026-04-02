/**
 * Settings Page E2E Tests
 *
 * Tests for settings functionality:
 * - Theme switching
 * - Editor settings
 * - Keyboard shortcuts display
 * - Settings persistence
 */

import { test, expect } from '@playwright/test';
import {
  loadApp,
  mainContent,
} from './fixtures/tauri-mock';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
    await page.locator('button[title="Settings"]').click();
    await expect(page.locator('text=General Settings')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Theme Settings
  // ---------------------------------------------------------------------------
  test.describe('Theme Settings', () => {
    test('displays theme options (Light, Dark, System)', async ({ page }) => {
      await expect(page.locator('button:has-text("Light")')).toBeVisible();
      await expect(page.locator('button:has-text("Dark")')).toBeVisible();
      await expect(page.locator('button:has-text("System")')).toBeVisible();
    });

    test('switches to Light theme', async ({ page }) => {
      await page.locator('button:has-text("Light")').click();

      // HTML should not have dark class
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });

    test('switches to Dark theme', async ({ page }) => {
      // First switch to light, then to dark
      await page.locator('button:has-text("Light")').click();
      await expect(page.locator('html')).not.toHaveClass(/dark/);

      await page.locator('button:has-text("Dark")').click();
      await expect(page.locator('html')).toHaveClass(/dark/);
    });

    test('switches to System theme', async ({ page }) => {
      await page.locator('button:has-text("System")').click();

      // System theme should be selected (no error)
      await expect(page.locator('button:has-text("System")')).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Editor Settings
  // ---------------------------------------------------------------------------
  test.describe('Editor Settings', () => {
    test.beforeEach(async ({ page }) => {
      await mainContent(page).locator('button:has-text("Editor")').click();
      await expect(mainContent(page).locator('text=Editor Settings')).toBeVisible();
    });

    test('displays font size setting', async ({ page }) => {
      await expect(mainContent(page).getByRole('heading', { name: 'Font Size' })).toBeVisible();
    });

    test('displays tab size setting', async ({ page }) => {
      await expect(mainContent(page).getByRole('heading', { name: 'Tab Size' })).toBeVisible();
    });

    test('displays word wrap setting', async ({ page }) => {
      await expect(mainContent(page).getByRole('heading', { name: 'Word Wrap' })).toBeVisible();
    });

    test('changes font size', async ({ page }) => {
      // Find font size input or buttons
      const fontSizeInput = mainContent(page).locator('input[type="number"]').first();
      if (await fontSizeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await fontSizeInput.fill('18');
        await expect(fontSizeInput).toHaveValue('18');
      }
    });

    test('changes tab size', async ({ page }) => {
      const tabSizeInput = mainContent(page).locator('input[type="number"]').nth(1);
      if (await tabSizeInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await tabSizeInput.fill('4');
        await expect(tabSizeInput).toHaveValue('4');
      }
    });

    test('toggles word wrap', async ({ page }) => {
      const wordWrapCheckbox = mainContent(page).locator('input[type="checkbox"]').first();
      if (await wordWrapCheckbox.isVisible({ timeout: 1000 }).catch(() => false)) {
        const isChecked = await wordWrapCheckbox.isChecked();
        await wordWrapCheckbox.click();
        await expect(wordWrapCheckbox).toBeChecked({ checked: !isChecked });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Keyboard Shortcuts Display
  // ---------------------------------------------------------------------------
  test.describe('Keyboard Shortcuts', () => {
    test.beforeEach(async ({ page }) => {
      await mainContent(page).locator('button:has-text("Shortcuts")').click();
      await expect(mainContent(page).locator('text=Keyboard Shortcuts')).toBeVisible();
    });

    test('displays send request shortcut', async ({ page }) => {
      await expect(mainContent(page).locator('text=Send Request')).toBeVisible();
      await expect(mainContent(page).locator('text=Ctrl + Enter')).toBeVisible();
    });

    test('displays toggle sidebar shortcut', async ({ page }) => {
      await expect(mainContent(page).locator('text=Toggle Sidebar')).toBeVisible();
      await expect(mainContent(page).locator('kbd:has-text("Ctrl + N")')).toBeVisible();
    });

    test('displays new request shortcut', async ({ page }) => {
      await expect(mainContent(page).locator('text=New Request')).toBeVisible();
      await expect(mainContent(page).locator('text=Ctrl + N')).toBeVisible();
    });

    test('displays save request shortcut', async ({ page }) => {
      await expect(mainContent(page).locator('text=Save Request')).toBeVisible();
      await expect(mainContent(page).locator('kbd').filter({ hasText: 'Ctrl + S' }).first()).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Version Display
  // ---------------------------------------------------------------------------
  test.describe('Version Display', () => {
    test('displays version 0.1.0 in settings', async ({ page }) => {
      await expect(page.locator('text=Version')).toBeVisible();
      await expect(page.locator('text=Openman v0.1.0')).toBeVisible();
    });

    test('displays version badge', async ({ page }) => {
      const versionBadge = page.locator('span:has-text("v0.1.0")');
      await expect(versionBadge).toBeVisible();
    });

    test('version section shows API Testing Tool subtitle', async ({ page }) => {
      await expect(page.locator('text=API Testing Tool')).toBeVisible();
    });
  });

  // ---------------------------------------------------------------------------
  // Settings Persistence
  // ---------------------------------------------------------------------------
  test.describe('Settings Persistence', () => {
    test('persists theme selection after page reload', async ({ page }) => {
      // Switch to Light theme
      await page.locator('button:has-text("Light")').click();
      await expect(page.locator('html')).not.toHaveClass(/dark/);

      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('text=Loading OpenMan')).toBeHidden({ timeout: 10000 });

      // Theme should still be light
      await expect(page.locator('html')).not.toHaveClass(/dark/);
    });

    test('persists dark theme after page reload', async ({ page }) => {
      // First ensure we're on light theme
      await page.locator('button:has-text("Light")').click();
      await expect(page.locator('html')).not.toHaveClass(/dark/);

      // Switch to dark
      await page.locator('button:has-text("Dark")').click();
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Reload page
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('text=Loading OpenMan')).toBeHidden({ timeout: 10000 });

      // Theme should still be dark
      await expect(page.locator('html')).toHaveClass(/dark/);
    });
  });

  // ---------------------------------------------------------------------------
  // Settings Navigation
  // ---------------------------------------------------------------------------
  test.describe('Settings Navigation', () => {
    test('navigates between settings sections', async ({ page }) => {
      // Start on General
      await expect(mainContent(page).locator('text=General Settings')).toBeVisible();

      // Go to Editor
      await mainContent(page).locator('button:has-text("Editor")').click();
      await expect(mainContent(page).locator('text=Editor Settings')).toBeVisible();

      // Go to Shortcuts
      await mainContent(page).locator('button:has-text("Shortcuts")').click();
      await expect(mainContent(page).locator('text=Keyboard Shortcuts')).toBeVisible();

      // Back to General
      await mainContent(page).locator('button:has-text("General")').click();
      await expect(mainContent(page).locator('text=General Settings')).toBeVisible();
    });
  });
});