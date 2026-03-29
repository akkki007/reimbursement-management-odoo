# Security Audit Report — ReimburseFlow

**Date:** 2026-03-29
**Scope:** Full stack (backend + frontend)

---

## CRITICAL

### 1. Unauthenticated Password Reset (FIXED)
**File:** `backend/app/routers/auth.py` — `POST /api/auth/forgot-password`
**Issue:** Anyone can reset any user's password by knowing their email. No email verification token, no CAPTCHA, no rate limiting. An attacker could lock out any user or take over accounts.
**Fix:** Require the user's current password OR send a time-limited reset token via email. Added current password verification as a gating check.

### 2. No Password Strength Validation on Signup (FIXED)
**File:** `backend/app/schemas/auth.py`
**Issue:** `SignupRequest.password` has no length or complexity constraints. A user could sign up with password "1".
**Fix:** Added `min_length=8` validator on password fields in both `SignupRequest` and `ForgotPasswordRequest`.

### 3. No Rate Limiting on Auth Endpoints (FIXED)
**File:** `backend/app/main.py`
**Issue:** Login, signup, and password reset endpoints have no rate limiting. Brute-force and credential-stuffing attacks are trivial.
**Fix:** Added in-memory rate limiter middleware (IP-based, 5 attempts per minute on auth endpoints). For production, use Redis-backed rate limiting.

---

## HIGH

### 4. No File Size Limit on Receipt Uploads (FIXED)
**File:** `backend/app/routers/expenses.py` — `upload-receipt`, `scan-receipt`
**Issue:** No server-side file size enforcement. An attacker could upload multi-GB files to exhaust disk/memory.
**Fix:** Added 10MB file size limit in the upload endpoints. Also enforced via nginx `client_max_body_size` in Docker setup.

### 5. Approval History Leaks Cross-Company Data (FIXED)
**File:** `backend/app/routers/approvals.py` — `GET /{expense_id}/history`
**Issue:** If an expense has approval actions, they are returned without checking whether the expense belongs to the requesting user's company. An attacker with a valid JWT from Company A could read approval history of Company B expenses by guessing UUIDs.
**Fix:** Always validate `expense.companyId == current_user.companyId` before returning data.

### 6. User-Provided `receipt_url` Not Validated
**File:** `backend/app/schemas/expense.py`
**Issue:** `receipt_url` in `CreateExpenseRequest` is a free-form string. If the frontend renders it as `<img src>`, a malicious URL could be injected. This is mitigated by the upload flow (which generates `/uploads/{uuid}` URLs), but a direct API caller could bypass the upload flow.
**Status:** Low risk since the upload endpoint generates safe URLs. Added comment noting the frontend should only render URLs matching `/uploads/*`.

---

## MEDIUM

### 7. JWT Tokens Stored in localStorage
**File:** `frontend/src/api/client.js`
**Issue:** Both access and refresh tokens are stored in `localStorage`, which is accessible to any JavaScript running on the page (XSS risk).
**Recommendation:** For production, store refresh tokens in httpOnly cookies. The current approach is acceptable for an MVP/hackathon but should be hardened later.

### 8. `python-jose` Has Known Vulnerabilities
**File:** `backend/requirements.txt`
**Issue:** `python-jose` is unmaintained and has known CVEs related to algorithm confusion attacks.
**Recommendation:** Migrate to `PyJWT` for production. Current usage with explicit `algorithms=[settings.jwt_algorithm]` in `decode_token` partially mitigates the algorithm confusion issue.

### 9. No Input Length Limits on Text Fields
**File:** `backend/app/schemas/expense.py`, `backend/app/schemas/auth.py`
**Issue:** Fields like `description`, `remarks`, `comment`, `company_name` have no maximum length. An attacker could submit extremely long strings.
**Fix:** Added `max_length` constraints on Pydantic models.

---

## LOW

### 10. CORS Allows All Methods and Headers
**File:** `backend/app/main.py`
**Issue:** `allow_methods=["*"]` and `allow_headers=["*"]` is more permissive than needed.
**Status:** Acceptable for development. For production, restrict to `["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"]` and specific headers.

### 11. Stack Traces Printed in Production
**File:** `backend/app/main.py`
**Issue:** `traceback.print_exc()` in the general exception handler writes stack traces to stdout. Not a direct vulnerability but leaks internal paths if logs are exposed.
**Status:** Acceptable for development. Use structured logging with level control in production.

---

## Summary of Applied Fixes

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | CRITICAL | Unauthenticated password reset | FIXED |
| 2 | CRITICAL | No password validation on signup | FIXED |
| 3 | CRITICAL | No rate limiting on auth | FIXED |
| 4 | HIGH | No file size limit on uploads | FIXED |
| 5 | HIGH | Approval history data leak | FIXED |
| 6 | HIGH | Unvalidated receipt_url | Documented |
| 7 | MEDIUM | JWT in localStorage | Documented |
| 8 | MEDIUM | python-jose CVEs | Documented |
| 9 | MEDIUM | No input length limits | FIXED |
| 10 | LOW | CORS too permissive | Documented |
| 11 | LOW | Stack traces in logs | Documented |
