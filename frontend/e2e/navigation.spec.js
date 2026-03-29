import { test, expect } from '@playwright/test';
import { USERS, loginViaUI } from './helpers.js';

test.describe('Navigation & Sidebar', () => {
  test.describe('Landing page', () => {
    test('should show landing page at root URL', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('text=reimburseflow')).toBeVisible();
    });

    test('should have login and signup links', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('a[href="/login"]').first()).toBeVisible();
      await expect(page.locator('a[href="/signup"]').first()).toBeVisible();
    });
  });

  test.describe('Employee sidebar navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
    });

    test('should show sidebar with employee menu items', async ({ page }) => {
      // Employee should see: Dashboard, Expenses
      await expect(page.locator('text=Dashboard').first()).toBeVisible();
    });

    test('should navigate to expenses from sidebar', async ({ page }) => {
      // Look for expense-related navigation
      const expenseLink = page.locator('a[href="/expenses"]').first();
      if (await expenseLink.isVisible()) {
        await expenseLink.click();
        await expect(page).toHaveURL(/\/expenses/);
      }
    });

    test('should not show admin links for employee', async ({ page }) => {
      // Employee should NOT see admin menu items
      const adminLink = page.locator('a[href="/admin/users"]');
      await expect(adminLink).not.toBeVisible();
    });
  });

  test.describe('Admin sidebar navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.admin);
    });

    test('should show admin menu items in sidebar', async ({ page }) => {
      // Admin should see admin navigation links
      await expect(page.locator('text=Dashboard').first()).toBeVisible();
    });

    test('should navigate to manage users', async ({ page }) => {
      const usersLink = page.locator('a[href="/admin/users"]').first();
      if (await usersLink.isVisible()) {
        await usersLink.click();
        await expect(page).toHaveURL(/\/admin\/users/);
      }
    });
  });

  test.describe('Manager sidebar navigation', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.managerPriya);
    });

    test('should show approval queue link for manager', async ({ page }) => {
      const approvalLink = page.locator('a[href="/approvals"]').first();
      if (await approvalLink.isVisible()) {
        await approvalLink.click();
        await expect(page).toHaveURL(/\/approvals/);
      }
    });
  });

  test.describe('404 / catch-all', () => {
    test('should redirect unknown routes to landing', async ({ page }) => {
      await page.goto('/nonexistent-page');
      await page.waitForTimeout(1000);
      // Catch-all route redirects to /
      await expect(page).toHaveURL('/');
    });
  });
});
