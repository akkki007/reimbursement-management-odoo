/**
 * Shared test helpers for Playwright E2E tests.
 * Assumes the backend is seeded with seed.py data.
 */

const API_URL = 'http://localhost:8000/api';

// Test accounts from seed.py (password: password123)
export const USERS = {
  admin: { email: 'admin@technova.com', password: 'password123', role: 'ADMIN' },
  managerPriya: { email: 'priya@technova.com', password: 'password123', role: 'MANAGER' },
  managerArjun: { email: 'arjun@technova.com', password: 'password123', role: 'MANAGER' },
  managerNeha: { email: 'neha@technova.com', password: 'password123', role: 'MANAGER' },
  employeeAnkit: { email: 'ankit@technova.com', password: 'password123', role: 'EMPLOYEE' },
  employeeDivya: { email: 'divya@technova.com', password: 'password123', role: 'EMPLOYEE' },
  employeeRohan: { email: 'rohan@technova.com', password: 'password123', role: 'EMPLOYEE' },
};

/**
 * Login via the UI and wait for dashboard redirect.
 */
export async function loginViaUI(page, user) {
  await page.goto('/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
}

/**
 * Login via API and inject tokens into localStorage (faster than UI login).
 */
export async function loginViaAPI(page, user) {
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: { email: user.email, password: user.password },
  });
  const tokens = await response.json();

  await page.goto('/login'); // need a page loaded to set localStorage
  await page.evaluate((t) => {
    localStorage.setItem('access_token', t.access_token);
    localStorage.setItem('refresh_token', t.refresh_token);
  }, tokens);
}

/**
 * Logout: clear tokens and navigate to login.
 */
export async function logout(page) {
  await page.evaluate(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  });
  await page.goto('/login');
}
