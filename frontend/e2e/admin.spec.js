import { test, expect } from '@playwright/test';
import { USERS, loginViaUI } from './helpers.js';

test.describe('Admin features', () => {
  test.describe('Manage Users', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.admin);
    });

    test('should show manage users page', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      // Should show the users list
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
    });

    test('should display company users in table', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(3000);
      // Should show seeded users
      await expect(page.locator(`text=${USERS.managerPriya.email}`)).toBeVisible({ timeout: 5000 });
      await expect(page.locator(`text=${USERS.employeeAnkit.email}`)).toBeVisible({ timeout: 5000 });
    });

    test('should show roles for each user', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForTimeout(3000);
      // Check role badges exist
      await expect(page.locator('text=ADMIN').first()).toBeVisible();
      await expect(page.locator('text=MANAGER').first()).toBeVisible();
      await expect(page.locator('text=EMPLOYEE').first()).toBeVisible();
    });
  });

  test.describe('Approval Rules', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.admin);
    });

    test('should show approval rules page', async ({ page }) => {
      await page.goto('/admin/rules');
      await page.waitForTimeout(2000);
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
    });

    test('should display seeded approval rules', async ({ page }) => {
      await page.goto('/admin/rules');
      await page.waitForTimeout(3000);
      // Seeded rules: "Standard Sequential Approval", "Quick Parallel Approval", "High-Value Hybrid"
      await expect(page.locator('text=Standard Sequential Approval')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Company Settings', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.admin);
    });

    test('should show company settings page', async ({ page }) => {
      await page.goto('/admin/settings');
      await page.waitForTimeout(2000);
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
    });

    test('should display company name', async ({ page }) => {
      await page.goto('/admin/settings');
      await page.waitForTimeout(3000);
      // Company is "TechNova Solutions" from seed
      await expect(page.locator('text=TechNova Solutions')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Admin role guard', () => {
    test('manager cannot access admin users page', async ({ page }) => {
      await loginViaUI(page, USERS.managerPriya);
      await page.goto('/admin/users');
      await page.waitForTimeout(2000);
      // Should redirect away from admin page
      const url = page.url();
      expect(url).not.toContain('/admin/users');
    });

    test('employee cannot access admin settings', async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
      await page.goto('/admin/settings');
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).not.toContain('/admin/settings');
    });

    test('employee cannot access approval rules', async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
      await page.goto('/admin/rules');
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).not.toContain('/admin/rules');
    });
  });
});
