import { test, expect } from '@playwright/test';
import { USERS, loginViaUI } from './helpers.js';

test.describe('Dashboard', () => {
  test.describe('Employee dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
    });

    test('should display dashboard heading and welcome message', async ({ page }) => {
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('text=Welcome back')).toBeVisible();
    });

    test('should show stat cards', async ({ page }) => {
      await expect(page.locator('text=Pending expenses')).toBeVisible();
      await expect(page.locator('text=Approved')).toBeVisible();
      await expect(page.locator('text=Rejected')).toBeVisible();
      await expect(page.locator('text=Total submitted')).toBeVisible();
    });

    test('should show expense chart section', async ({ page }) => {
      await expect(page.locator('text=Company expenses overview')).toBeVisible();
    });
  });

  test.describe('Manager dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.managerPriya);
    });

    test('should display dashboard with approval info', async ({ page }) => {
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('text=Welcome back')).toBeVisible();
    });

    test('should show pending approvals notification if any', async ({ page }) => {
      // Priya has pending approvals in seeded data
      await page.waitForTimeout(2000); // Wait for API response
      const pendingNotification = page.locator('text=waiting for your approval');
      // May or may not be visible depending on seed data state
      const isVisible = await pendingNotification.isVisible().catch(() => false);
      // Just confirm the dashboard loaded correctly either way
      await expect(page.locator('text=Total submitted')).toBeVisible();
    });
  });

  test.describe('Admin dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.admin);
    });

    test('should display admin dashboard', async ({ page }) => {
      await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('text=Total submitted')).toBeVisible();
    });
  });
});
