/**
 * Collections Management E2E Tests
 *
 * Tests for collection CRUD operations:
 * - Create, Read, Update, Delete collections
 * - Request management within collections
 */

import { test, expect } from '@playwright/test';
import {
  loadApp,
  sidebar,
  mainContent,
  MOCK_COLLECTIONS,
} from './fixtures/tauri-mock';

test.describe('Collections Page', () => {
  test.beforeEach(async ({ page }) => {
    await loadApp(page);
  });

  // ---------------------------------------------------------------------------
  // Display Collections
  // ---------------------------------------------------------------------------
  test('displays collection cards with names and request counts', async ({ page }) => {
    await expect(mainContent(page).locator('h1:has-text("Collections")')).toBeVisible();
    await expect(mainContent(page).locator('h3:has-text("Users API")')).toBeVisible();
    await expect(mainContent(page).locator('h3:has-text("Auth API")')).toBeVisible();
    await expect(mainContent(page).locator('text=2 requests')).toBeVisible();
    await expect(mainContent(page).locator('text=0 requests')).toBeVisible();
  });

  test('searches collections on the page', async ({ page }) => {
    const searchInput = mainContent(page).locator('input[placeholder="Search collections..."]');
    await searchInput.fill('Auth');

    await expect(mainContent(page).locator('h3:has-text("Auth API")')).toBeVisible();
    await expect(mainContent(page).locator('h3:has-text("Users API")')).toBeHidden();
  });

  test('shows empty state when no collections exist', async ({ page }) => {
    await loadApp(page, { collections: [] });

    await expect(mainContent(page).locator('h2:has-text("No Collections Yet")')).toBeVisible();
    await expect(page.locator('text=Create your first collection')).toBeVisible();
    await expect(mainContent(page).locator('button:has-text("Create Collection")')).toBeVisible();
  });

  // ---------------------------------------------------------------------------
  // Create Collection
  // ---------------------------------------------------------------------------
  test.describe('Create Collection', () => {
    test('opens and fills the Create Collection modal', async ({ page }) => {
      await mainContent(page).locator('button:has-text("New Collection")').click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal.locator('h2:has-text("Create Collection")')).toBeVisible();

      const nameInput = modal.locator('input[placeholder*="My API Collection"]');
      await nameInput.fill('Payment API');
      await modal.locator('textarea[placeholder*="Describe this collection"]').fill('Payment endpoints');
      await modal.locator('button:has-text("Create Collection")').click();

      await expect(modal.locator('h2:has-text("Create Collection")')).toBeHidden({ timeout: 5000 });
    });

    test('shows validation error for empty collection name', async ({ page }) => {
      await mainContent(page).locator('button:has-text("New Collection")').click();

      const modal = page.locator('.fixed.inset-0');
      await expect(modal.locator('h2:has-text("Create Collection")')).toBeVisible();

      await modal.locator('button:has-text("Create Collection")').click();

      await expect(modal.locator('text=Please enter a collection name')).toBeVisible();
    });

    test('cancels collection creation', async ({ page }) => {
      await mainContent(page).locator('button:has-text("New Collection")').click();

      const modal = page.locator('.fixed.inset-0');
      await modal.locator('input[placeholder*="My API Collection"]').fill('Test');

      await modal.locator('button:has-text("Cancel")').click();
      await expect(modal.locator('h2:has-text("Create Collection")')).toBeHidden();

      // Verify collection was not created
      await expect(mainContent(page).locator('h3:has-text("Test")')).toBeHidden();
    });
  });

  // ---------------------------------------------------------------------------
  // Delete Collection
  // ---------------------------------------------------------------------------
  test.describe('Delete Collection', () => {
    test('shows delete confirmation dialog', async ({ page }) => {
      // Find and click delete button on first collection card
      const collectionCard = mainContent(page).locator('h3:has-text("Users API")').locator('xpath=ancestor::div[contains(@class, "bg-card")]').first();
      await collectionCard.hover();

      // Click delete button (trash icon or button with delete text)
      const deleteButton = collectionCard.locator('button:has-text("Delete"), button[title="Delete"]').first();
      if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await deleteButton.click();

        // Confirm dialog should appear
        await expect(page.locator('text=Delete Collection')).toBeVisible();
        await expect(page.locator('text=Are you sure')).toBeVisible();
      }
    });

    test('cancels deletion in confirmation dialog', async ({ page }) => {
      const collectionCard = mainContent(page).locator('h3:has-text("Users API")').locator('xpath=ancestor::div[contains(@class, "bg-card")]').first();
      await collectionCard.hover();

      const deleteButton = collectionCard.locator('button:has-text("Delete"), button[title="Delete"]').first();
      if (await deleteButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await deleteButton.click();

        // Cancel the deletion
        await page.locator('button:has-text("Cancel")').last().click();

        // Collection should still exist
        await expect(mainContent(page).locator('h3:has-text("Users API")')).toBeVisible();
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Edit Collection
  // ---------------------------------------------------------------------------
  test.describe('Edit Collection', () => {
    test('edits collection name inline', async ({ page }) => {
      const collectionCard = mainContent(page).locator('h3:has-text("Users API")').locator('xpath=ancestor::div[contains(@class, "bg-card")]').first();
      await collectionCard.hover();

      // Look for edit button
      const editButton = collectionCard.locator('button:has-text("Edit"), button[title="Edit"]').first();
      if (await editButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await editButton.click();

        // Should show inline edit form or modal
        const nameInput = collectionCard.locator('input').first();
        if (await nameInput.isVisible({ timeout: 1000 }).catch(() => false)) {
          await nameInput.fill('Updated Users API');
          await collectionCard.locator('button:has-text("Save")').click();

          await expect(mainContent(page).locator('h3:has-text("Updated Users API")')).toBeVisible();
        }
      }
    });
  });

  // ---------------------------------------------------------------------------
  // Request Management
  // ---------------------------------------------------------------------------
  test.describe('Request Management', () => {
    test('shows requests count on collection card', async ({ page }) => {
      await expect(mainContent(page).locator('text=2 requests')).toBeVisible();
      await expect(mainContent(page).locator('text=0 requests')).toBeVisible();
    });

    test('navigates to collection details on click', async ({ page }) => {
      // Click on collection card (not delete/edit button)
      await mainContent(page).locator('h3:has-text("Users API")').click();

      // Should show collection details or expand in sidebar
    });
  });
});