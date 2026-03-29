import { test, expect } from '@playwright/test';

const API = 'http://localhost:8000/api';

test.describe('API Security', () => {
  test.describe('Authentication enforcement', () => {
    test('GET /expenses returns 403 without token', async ({ request }) => {
      const res = await request.get(`${API}/expenses`);
      expect(res.status()).toBe(403);
    });

    test('GET /users returns 403 without token', async ({ request }) => {
      const res = await request.get(`${API}/users`);
      expect(res.status()).toBe(403);
    });

    test('GET /approvals/pending returns 403 without token', async ({ request }) => {
      const res = await request.get(`${API}/approvals/pending`);
      expect(res.status()).toBe(403);
    });

    test('GET /approval-rules returns 403 without token', async ({ request }) => {
      const res = await request.get(`${API}/approval-rules`);
      expect(res.status()).toBe(403);
    });

    test('GET /auth/me returns 403 without token', async ({ request }) => {
      const res = await request.get(`${API}/auth/me`);
      expect(res.status()).toBe(403);
    });
  });

  test.describe('Invalid token handling', () => {
    test('rejects expired/invalid JWT', async ({ request }) => {
      const res = await request.get(`${API}/expenses`, {
        headers: { Authorization: 'Bearer invalid.token.here' },
      });
      expect(res.status()).toBe(401);
    });

    test('rejects malformed authorization header', async ({ request }) => {
      const res = await request.get(`${API}/expenses`, {
        headers: { Authorization: 'NotBearer sometoken' },
      });
      expect([401, 403]).toContain(res.status());
    });
  });

  test.describe('Input validation', () => {
    test('login rejects missing fields', async ({ request }) => {
      const res = await request.post(`${API}/auth/login`, {
        data: {},
      });
      expect(res.status()).toBe(422);
    });

    test('signup rejects short password', async ({ request }) => {
      const res = await request.post(`${API}/auth/signup`, {
        data: {
          company_name: 'Test',
          country: 'India',
          email: 'short@test.com',
          password: '123',
          first_name: 'Test',
          last_name: 'User',
        },
      });
      expect(res.status()).toBe(422);
    });

    test('signup rejects invalid email', async ({ request }) => {
      const res = await request.post(`${API}/auth/signup`, {
        data: {
          company_name: 'Test',
          country: 'India',
          email: 'not-an-email',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        },
      });
      expect(res.status()).toBe(422);
    });
  });

  test.describe('Role-based access control', () => {
    let employeeToken;
    let adminToken;

    test.beforeAll(async ({ request }) => {
      // Get employee token
      const empRes = await request.post(`${API}/auth/login`, {
        data: { email: 'ankit@technova.com', password: 'password123' },
      });
      const empData = await empRes.json();
      employeeToken = empData.access_token;

      // Get admin token
      const adminRes = await request.post(`${API}/auth/login`, {
        data: { email: 'admin@technova.com', password: 'password123' },
      });
      const adminData = await adminRes.json();
      adminToken = adminData.access_token;
    });

    test('employee cannot access admin user list', async ({ request }) => {
      const res = await request.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      expect(res.status()).toBe(403);
    });

    test('employee cannot access approval queue', async ({ request }) => {
      const res = await request.get(`${API}/approvals/pending`, {
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      expect(res.status()).toBe(403);
    });

    test('employee cannot access approval rules', async ({ request }) => {
      const res = await request.get(`${API}/approval-rules`, {
        headers: { Authorization: `Bearer ${employeeToken}` },
      });
      expect(res.status()).toBe(403);
    });

    test('admin can access user list', async ({ request }) => {
      const res = await request.get(`${API}/users`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status()).toBe(200);
    });

    test('admin can access approval rules', async ({ request }) => {
      const res = await request.get(`${API}/approval-rules`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status()).toBe(200);
    });
  });

  test.describe('Health check', () => {
    test('GET /health returns 200', async ({ request }) => {
      const res = await request.get(`${API}/health`);
      expect(res.status()).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('healthy');
    });
  });

  test.describe('Forgot password requires current password', () => {
    test('rejects reset without current password', async ({ request }) => {
      const res = await request.post(`${API}/auth/forgot-password`, {
        data: {
          email: 'ankit@technova.com',
          new_password: 'newpassword123',
        },
      });
      expect(res.status()).toBe(422);
    });

    test('rejects reset with wrong current password', async ({ request }) => {
      const res = await request.post(`${API}/auth/forgot-password`, {
        data: {
          email: 'ankit@technova.com',
          current_password: 'wrongpassword',
          new_password: 'newpassword123',
        },
      });
      expect(res.status()).toBe(401);
    });
  });
});
