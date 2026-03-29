import { test, expect } from '@playwright/test';
import { USERS, loginViaUI } from './helpers.js';

test.describe('Expenses', () => {
  test.describe('Submit expense form', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
    });

    test('should navigate to submit expense page', async ({ page }) => {
      await page.goto('/expenses/submit');
      await expect(page.locator('h1:has-text("Submit expense")')).toBeVisible();
    });

    test('should show all required form fields', async ({ page }) => {
      await page.goto('/expenses/submit');
      await expect(page.locator('input[name="description"]')).toBeVisible();
      await expect(page.locator('input[name="expense_date"]')).toBeVisible();
      await expect(page.locator('select[name="category"]')).toBeVisible();
      await expect(page.locator('select[name="paid_by"]')).toBeVisible();
      await expect(page.locator('input[name="amount"]')).toBeVisible();
      await expect(page.locator('select[name="currency"]')).toBeVisible();
    });

    test('should show status bar with Draft state', async ({ page }) => {
      await page.goto('/expenses/submit');
      await expect(page.locator('text=Draft')).toBeVisible();
    });

    test('should have attach receipt and scan receipt buttons', async ({ page }) => {
      await page.goto('/expenses/submit');
      await expect(page.locator('text=Attach receipt')).toBeVisible();
      await expect(page.locator('text=Scan receipt')).toBeVisible();
    });

    test('should show validation error for empty amount', async ({ page }) => {
      await page.goto('/expenses/submit');
      await page.fill('input[name="description"]', 'Test expense');
      await page.selectOption('select[name="category"]', 'MEALS');
      // Leave amount empty and try to submit
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Enter a valid amount')).toBeVisible();
    });

    test('should show validation error for no category', async ({ page }) => {
      await page.goto('/expenses/submit');
      await page.fill('input[name="description"]', 'Test expense');
      await page.fill('input[name="amount"]', '100');
      // Leave category empty
      await page.click('button[type="submit"]');
      await expect(page.locator('text=Select a category')).toBeVisible();
    });

    test('should submit an expense and redirect to history', async ({ page }) => {
      await page.goto('/expenses/submit');
      await page.fill('input[name="description"]', 'Playwright test expense');
      await page.fill('input[name="amount"]', '250.50');
      await page.selectOption('select[name="category"]', 'MEALS');
      await page.click('button[type="submit"]');

      // Should redirect to expense history
      await page.waitForURL('**/expenses', { timeout: 10000 });
      // The submitted expense should appear in the list
      await expect(page.locator('text=Playwright test expense')).toBeVisible({ timeout: 5000 });
    });

    test('should save expense as draft', async ({ page }) => {
      await page.goto('/expenses/submit');
      await page.fill('input[name="description"]', 'Draft test expense');
      await page.fill('input[name="amount"]', '75.00');
      await page.selectOption('select[name="category"]', 'OFFICE_SUPPLIES');
      await page.click('button:has-text("Save as draft")');

      await page.waitForURL('**/expenses', { timeout: 10000 });
      await expect(page.locator('text=Draft test expense')).toBeVisible({ timeout: 5000 });
    });

    test('should show currency conversion notice for non-default currency', async ({ page }) => {
      await page.goto('/expenses/submit');
      // Company default is INR, select USD
      await page.selectOption('select[name="currency"]', 'USD');
      await expect(page.locator('text=auto-converted')).toBeVisible();
    });

    test('should show currency info sidebar', async ({ page }) => {
      await page.goto('/expenses/submit');
      await expect(page.locator('text=Currency info')).toBeVisible();
      await expect(page.locator('text=Status flow')).toBeVisible();
    });
  });

  test.describe('Expense history', () => {
    test.beforeEach(async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
    });

    test('should navigate to expense history page', async ({ page }) => {
      await page.goto('/expenses');
      await expect(page.locator('h1:has-text("My expenses")')).toBeVisible();
    });

    test('should show new and upload buttons', async ({ page }) => {
      await page.goto('/expenses');
      await expect(page.locator('text=New')).toBeVisible();
      await expect(page.locator('text=Upload')).toBeVisible();
    });

    test('should show summary cards', async ({ page }) => {
      await page.goto('/expenses');
      await expect(page.locator('text=To submit')).toBeVisible();
      await expect(page.locator('text=Waiting approval')).toBeVisible();
      await expect(page.locator('text=Approved')).toBeVisible();
    });

    test('should show expenses table with headers', async ({ page }) => {
      await page.goto('/expenses');
      await page.waitForTimeout(2000); // Wait for API
      // Check for table headers
      await expect(page.locator('th:has-text("Employee")')).toBeVisible();
      await expect(page.locator('th:has-text("Description")')).toBeVisible();
      await expect(page.locator('th:has-text("Amount")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
    });

    test('should display seeded expenses for Ankit', async ({ page }) => {
      await page.goto('/expenses');
      await page.waitForTimeout(2000);
      // Ankit has seeded expenses (draft keyboard, transport)
      const rows = page.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Role-based access', () => {
    test('employee cannot access admin pages', async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
      await page.goto('/admin/users');
      // Should redirect away or show access denied
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).not.toContain('/admin/users');
    });

    test('employee cannot access approval queue', async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
      await page.goto('/approvals');
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).not.toContain('/approvals');
    });
  });
});
