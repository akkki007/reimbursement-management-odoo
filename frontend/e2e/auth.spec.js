import { test, expect } from '@playwright/test';
import { USERS, loginViaUI, logout } from './helpers.js';

test.describe('Authentication', () => {
  test.describe('Login', () => {
    test('should show login page with form fields', async ({ page }) => {
      await page.goto('/login');
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('text=Sign in')).toBeVisible();
    });

    test('should login as admin and redirect to dashboard', async ({ page }) => {
      await loginViaUI(page, USERS.admin);
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should login as employee and see dashboard', async ({ page }) => {
      await loginViaUI(page, USERS.employeeAnkit);
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should login as manager and see dashboard', async ({ page }) => {
      await loginViaUI(page, USERS.managerPriya);
      await expect(page).toHaveURL(/\/dashboard/);
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', 'wrong@email.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
    });

    test('should show error for wrong password', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[type="email"]', USERS.admin.email);
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid email or password')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Navigation links', () => {
    test('login page has link to signup', async ({ page }) => {
      await page.goto('/login');
      const signupLink = page.locator('a[href="/signup"]');
      await expect(signupLink).toBeVisible();
    });

    test('login page has link to forgot password', async ({ page }) => {
      await page.goto('/login');
      const forgotLink = page.locator('a[href="/forgot-password"]');
      await expect(forgotLink).toBeVisible();
    });

    test('signup page has link to login', async ({ page }) => {
      await page.goto('/signup');
      const loginLink = page.locator('a[href="/login"]');
      await expect(loginLink).toBeVisible();
    });
  });

  test.describe('Protected routes', () => {
    test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
      await page.goto('/dashboard');
      // Should redirect to login or show login page
      await page.waitForURL(/\/(login)?$/, { timeout: 5000 });
    });

    test('should redirect to login when accessing expenses without auth', async ({ page }) => {
      await page.goto('/expenses');
      await page.waitForURL(/\/(login)?$/, { timeout: 5000 });
    });

    test('should redirect to login when accessing admin pages without auth', async ({ page }) => {
      await page.goto('/admin/users');
      await page.waitForURL(/\/(login)?$/, { timeout: 5000 });
    });
  });

  test.describe('Signup page', () => {
    test('should render signup form with all required fields', async ({ page }) => {
      await page.goto('/signup');
      await expect(page.locator('input[name="first_name"]')).toBeVisible();
      await expect(page.locator('input[name="last_name"]')).toBeVisible();
      await expect(page.locator('input[name="company_name"]')).toBeVisible();
      await expect(page.locator('select[name="country"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should load country dropdown options', async ({ page }) => {
      await page.goto('/signup');
      // Wait for country options to load from API
      await page.waitForTimeout(2000);
      const options = page.locator('select[name="country"] option');
      const count = await options.count();
      // Should have at least the placeholder + some countries
      expect(count).toBeGreaterThan(1);
    });
  });

  test.describe('Forgot password page', () => {
    test('should render forgot password form', async ({ page }) => {
      await page.goto('/forgot-password');
      await expect(page.locator('text=Reset your password')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  });
});
