# PRD: Reimbursement Management System

## For Claude Code Implementation

---

## 1. Project Overview

**Product Name:** ReimburseFlow
**Type:** Web Application (PWA-enabled for mobile receipt scanning)
**Purpose:** A multi-tenant expense reimbursement platform with configurable multi-level approval workflows, OCR receipt scanning, and currency conversion.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js 18+ with Vite, TailwindCSS, React Router v6 |
| Backend | Python FastAPI |
| Database | PostgreSQL (local) |
| ORM | Prisma (Python client — `prisma-client-py`) |
| Auth | JWT (access + refresh tokens), bcrypt for password hashing |
| OCR | Mindee Receipt API (structured receipt parsing) |
| Currency API | restcountries.com (country→currency), exchangerate-api.com (conversion) |
| PWA | Vite PWA plugin for mobile camera/upload support |

---

## 3. Project Structure

```
reimbursement-app/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entry point
│   │   ├── config.py                # Settings, env vars
│   │   ├── dependencies.py          # Auth dependencies, DB session
│   │   ├── routers/
│   │   │   ├── auth.py              # Login, signup, token refresh
│   │   │   ├── users.py             # User/employee/manager CRUD
│   │   │   ├── expenses.py          # Expense submission, history
│   │   │   ├── approvals.py         # Approval queue, approve/reject
│   │   │   ├── approval_rules.py    # Rule configuration (admin)
│   │   │   ├── ocr.py               # Receipt upload & OCR parsing
│   │   │   └── company.py           # Company settings, currency
│   │   ├── services/
│   │   │   ├── auth_service.py      # JWT creation/validation, password hashing
│   │   │   ├── expense_service.py   # Expense business logic
│   │   │   ├── approval_service.py  # Workflow engine (sequencing, rules)
│   │   │   ├── ocr_service.py       # Mindee API integration
│   │   │   ├── currency_service.py  # Conversion & country lookup
│   │   │   └── notification_service.py  # In-app notifications
│   │   ├── models/
│   │   │   └── enums.py             # Shared enums (roles, statuses)
│   │   ├── schemas/
│   │   │   ├── auth.py              # Pydantic models for auth
│   │   │   ├── user.py
│   │   │   ├── expense.py
│   │   │   ├── approval.py
│   │   │   └── company.py
│   │   └── middleware/
│   │       ├── auth_middleware.py    # JWT verification middleware
│   │       └── role_middleware.py    # Role-based access control
│   ├── prisma/
│   │   └── schema.prisma            # Database schema
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── api/
│   │   │   └── client.js            # Axios instance with JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Auth state, login/logout
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useExpenses.js
│   │   │   └── useApprovals.js
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx         # Role-aware dashboard
│   │   │   ├── expenses/
│   │   │   │   ├── SubmitExpense.jsx
│   │   │   │   ├── ExpenseHistory.jsx
│   │   │   │   └── ScanReceipt.jsx   # Camera/upload + OCR
│   │   │   ├── approvals/
│   │   │   │   ├── ApprovalQueue.jsx
│   │   │   │   └── ApprovalDetail.jsx
│   │   │   └── admin/
│   │   │       ├── ManageUsers.jsx
│   │   │       ├── ApprovalRules.jsx
│   │   │       └── CompanySettings.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── ExpenseCard.jsx
│   │   │   ├── ApprovalStepIndicator.jsx
│   │   │   ├── CurrencyDisplay.jsx
│   │   │   └── ReceiptPreview.jsx
│   │   └── utils/
│   │       ├── constants.js
│   │       ├── formatCurrency.js
│   │       └── roleHelpers.js
│   ├── public/
│   │   └── manifest.json             # PWA manifest
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 4. Database Schema (Prisma)

```prisma
generator client {
  provider             = "prisma-client-py"
  interface            = "asyncio"
  recursive_type_depth = 5
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── COMPANY ───────────────────────────────────────
model Company {
  id              String   @id @default(uuid())
  name            String
  country         String
  defaultCurrency String   @default("USD") // set from restcountries API on signup
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  users         User[]
  approvalRules ApprovalRule[]
  expenses      Expense[]
}

// ─── USER ──────────────────────────────────────────
enum Role {
  ADMIN
  MANAGER
  EMPLOYEE
}

model User {
  id             String   @id @default(uuid())
  email          String   @unique
  passwordHash   String
  firstName      String
  lastName       String
  role           Role     @default(EMPLOYEE)
  isActive       Boolean  @default(true)
  companyId      String
  managerId      String?  // direct manager relationship
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  company        Company  @relation(fields: [companyId], references: [id])
  manager        User?    @relation("ManagerEmployee", fields: [managerId], references: [id])
  subordinates   User[]   @relation("ManagerEmployee")

  expensesSubmitted  Expense[]         @relation("SubmittedBy")
  approvalActions    ApprovalAction[]
  approverSteps      ApprovalStep[]    @relation("StepApprover")

  @@index([companyId])
  @@index([managerId])
}

// ─── EXPENSE ───────────────────────────────────────
enum ExpenseStatus {
  DRAFT
  PENDING         // submitted, awaiting approvals
  IN_PROGRESS     // at least one approver has acted
  APPROVED
  REJECTED
}

enum ExpenseCategory {
  TRAVEL
  MEALS
  ACCOMMODATION
  OFFICE_SUPPLIES
  TRANSPORT
  ENTERTAINMENT
  SOFTWARE
  OTHER
}

model Expense {
  id              String          @id @default(uuid())
  companyId       String
  submittedById   String
  amount          Decimal         @db.Decimal(12, 2)
  currency        String          // original currency of expense
  convertedAmount Decimal?        @db.Decimal(12, 2) // amount in company currency
  exchangeRate    Decimal?        @db.Decimal(12, 6)
  category        ExpenseCategory
  description     String
  receiptUrl      String?         // uploaded receipt file path/URL
  expenseDate     DateTime
  status          ExpenseStatus   @default(DRAFT)
  isManagerApprover Boolean       @default(false) // if true, manager approves first
  currentStepOrder  Int           @default(0)     // tracks which step we're on
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  // OCR-extracted fields
  ocrVendorName   String?
  ocrRawData      Json?           // full OCR response stored for reference

  company         Company         @relation(fields: [companyId], references: [id])
  submittedBy     User            @relation("SubmittedBy", fields: [submittedById], references: [id])
  approvalSteps   ApprovalStep[]
  approvalActions ApprovalAction[]

  @@index([companyId, status])
  @@index([submittedById])
}

// ─── APPROVAL WORKFLOW ─────────────────────────────
// ApprovalRule: Admin-defined rule templates per company
// These define WHO approves and in WHAT order

enum ApprovalRuleType {
  PERCENTAGE      // e.g., 60% of approvers must approve
  SPECIFIC_USER   // e.g., if CFO approves → auto-approved
  HYBRID          // combination: 60% OR specific user
}

model ApprovalRule {
  id              String           @id @default(uuid())
  companyId       String
  name            String           // e.g., "Standard Approval", "High Value"
  ruleType        ApprovalRuleType @default(PERCENTAGE)
  percentRequired Float?           // e.g., 0.6 for 60%
  specificUserId  String?          // the "auto-approve" user (e.g., CFO)
  isDefault       Boolean          @default(false)
  isActive        Boolean          @default(true)
  createdAt       DateTime         @default(now())

  company         Company          @relation(fields: [companyId], references: [id])
  steps           ApprovalRuleStep[]

  @@index([companyId])
}

// Ordered steps within a rule
model ApprovalRuleStep {
  id             String       @id @default(uuid())
  approvalRuleId String
  stepOrder      Int          // 1, 2, 3...
  approverId     String       // which user/role approves at this step
  stepLabel      String?      // e.g., "Manager", "Finance", "Director"

  approvalRule   ApprovalRule @relation(fields: [approvalRuleId], references: [id], onDelete: Cascade)

  @@unique([approvalRuleId, stepOrder])
}

// ─── PER-EXPENSE APPROVAL TRACKING ────────────────
// When an expense is submitted, steps are generated from the rule

model ApprovalStep {
  id          String              @id @default(uuid())
  expenseId   String
  approverId  String
  stepOrder   Int
  stepLabel   String?
  status      ApprovalStepStatus  @default(PENDING)
  createdAt   DateTime            @default(now())

  expense     Expense             @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  approver    User                @relation("StepApprover", fields: [approverId], references: [id])

  @@unique([expenseId, stepOrder])
  @@index([approverId, status])
}

enum ApprovalStepStatus {
  PENDING
  AWAITING     // it's this approver's turn
  APPROVED
  REJECTED
  SKIPPED      // skipped due to conditional rule
}

// Individual approval/rejection actions (audit trail)
model ApprovalAction {
  id          String   @id @default(uuid())
  expenseId   String
  actorId     String
  action      String   // "APPROVED" | "REJECTED"
  comment     String?
  createdAt   DateTime @default(now())

  expense     Expense  @relation(fields: [expenseId], references: [id], onDelete: Cascade)
  actor       User     @relation(fields: [actorId], references: [id])

  @@index([expenseId])
}
```

---

## 5. API Endpoints

### 5.1 Auth (`/api/auth`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/signup` | Create company + admin user. Calls restcountries API to set company currency based on selected country. Returns JWT tokens. | Public |
| POST | `/login` | Email + password login. Returns access_token (15min) + refresh_token (7d). | Public |
| POST | `/refresh` | Refresh access token using refresh_token. | Public |
| GET | `/me` | Get current user profile + company info. | Authenticated |

**Signup flow detail:**
1. User provides: company name, country, email, password, first/last name.
2. Backend calls `https://restcountries.com/v3.1/all?fields=name,currencies` to resolve country → currency code.
3. Creates Company record with that currency.
4. Creates User with role=ADMIN linked to that company.
5. Returns JWT tokens.

### 5.2 Users (`/api/users`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/` | List all users in company | Admin |
| POST | `/` | Create employee/manager | Admin |
| PATCH | `/:id/role` | Change user role | Admin |
| PATCH | `/:id/manager` | Assign manager to employee | Admin |
| GET | `/:id` | Get user details | Admin |
| DELETE | `/:id` | Deactivate user | Admin |

### 5.3 Expenses (`/api/expenses`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/` | Submit new expense (triggers workflow) | Employee |
| GET | `/` | List own expenses (with filters: status, date range) | Employee |
| GET | `/:id` | Get expense detail + approval progress | Employee (own) / Manager (team) / Admin (all) |
| POST | `/scan-receipt` | Upload receipt image → OCR → return parsed fields | Employee |
| PATCH | `/:id` | Edit draft expense | Employee (own, draft only) |

**Expense submission flow:**
1. Employee submits expense with amount, currency, category, description, date, isManagerApprover flag.
2. If currency ≠ company currency, backend calls `https://api.exchangerate-api.com/v4/latest/{expense_currency}` to convert and stores both amounts + rate.
3. System looks up the company's active approval rule.
4. If `isManagerApprover` is checked AND employee has a manager, insert manager as Step 0 (before rule steps).
5. Generate `ApprovalStep` records from the rule's steps.
6. Set Step 1 (or Step 0 if manager) to `AWAITING`.
7. Set expense status to `PENDING`.

### 5.4 Approvals (`/api/approvals`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/pending` | List expenses awaiting my approval | Manager/Admin |
| POST | `/:expenseId/approve` | Approve with optional comment | Manager/Admin |
| POST | `/:expenseId/reject` | Reject with comment (required) | Manager/Admin |
| GET | `/:expenseId/history` | Get full approval audit trail | Manager/Admin |
| POST | `/:expenseId/override` | Admin override (force approve/reject) | Admin only |

**Approval engine logic (core):**

```
ON APPROVE(expenseId, actorId):
  1. Validate actor is the current step's approver
  2. Mark current ApprovalStep as APPROVED
  3. Create ApprovalAction audit record
  4. CHECK CONDITIONAL RULES:
     a. If ruleType == SPECIFIC_USER and actor == specificUserId:
        → Mark all remaining steps as SKIPPED
        → Set expense status = APPROVED ✓
     b. If ruleType == PERCENTAGE or HYBRID:
        → Count approved steps / total steps
        → If approvedCount / totalSteps >= percentRequired:
           → Mark remaining steps as SKIPPED
           → Set expense status = APPROVED ✓
        → Else if ruleType == HYBRID and actor == specificUserId:
           → Same as (a), auto-approve ✓
  5. If not auto-approved:
     → Advance to next step (set next step to AWAITING)
     → If no more steps → Set expense status = APPROVED ✓
  6. Update expense.currentStepOrder

ON REJECT(expenseId, actorId):
  1. Validate actor is the current step's approver
  2. Mark current ApprovalStep as REJECTED
  3. Create ApprovalAction audit record
  4. Set expense status = REJECTED
  5. (All remaining steps stay PENDING — workflow terminates)
```

### 5.5 Approval Rules (`/api/approval-rules`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/` | List all rules for company | Admin |
| POST | `/` | Create new approval rule with ordered steps | Admin |
| PUT | `/:id` | Update rule (type, percentage, steps) | Admin |
| DELETE | `/:id` | Deactivate rule | Admin |
| PATCH | `/:id/default` | Set as default rule for company | Admin |

### 5.6 Company (`/api/company`)

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/` | Get company details | Authenticated |
| PATCH | `/` | Update company settings | Admin |
| GET | `/currencies` | Proxy to restcountries API (cached) | Admin |

---

## 6. OCR Integration (Mindee)

### Setup
```
MINDEE_API_KEY=your_key_here
```

### Service: `ocr_service.py`

```python
# Pseudocode for the OCR service

async def parse_receipt(file: UploadFile) -> dict:
    """
    Calls Mindee Receipt API v5.
    Endpoint: https://api.mindee.net/v1/products/mindee/expense_receipts/v5/predict
    
    Returns structured data:
    {
        "amount": 45.99,
        "currency": "USD",
        "date": "2025-03-15",
        "vendor_name": "Starbucks",
        "category": "MEALS",         # mapped from Mindee's category
        "description": "auto-generated from line items",
        "line_items": [
            {"description": "Latte", "amount": 5.99},
            {"description": "Sandwich", "amount": 12.00}
        ],
        "raw_text": "...",           # fallback raw OCR text
        "confidence": 0.94           # Mindee confidence score
    }
    """
    # 1. Send image/PDF to Mindee API
    # 2. Parse response, extract fields
    # 3. Map Mindee category → our ExpenseCategory enum
    # 4. Build description from line_items if available
    # 5. Return structured dict for frontend to pre-fill the form
```

### Frontend flow for ScanReceipt.jsx:
1. User taps "Scan Receipt" → camera opens (PWA) or file picker.
2. Image uploaded to `/api/expenses/scan-receipt`.
3. Backend sends to Mindee, returns parsed fields.
4. Frontend pre-fills the expense form with parsed data.
5. User reviews, edits if needed, and submits.

---

## 7. Currency Handling

### On Signup:
```
GET https://restcountries.com/v3.1/all?fields=name,currencies
→ User selects country → extract first currency code → set as company.defaultCurrency
```

### On Expense Submission (if currency differs):
```
GET https://api.exchangerate-api.com/v4/latest/{EXPENSE_CURRENCY}
→ Extract rate for company.defaultCurrency
→ convertedAmount = amount * rate
→ Store: amount, currency, convertedAmount, exchangeRate
```

### Display Rules:
- **Employee view:** Shows original amount + currency.
- **Manager/Admin view:** Shows converted amount in company's default currency (with original in tooltip).

---

## 8. Authentication & Authorization

### JWT Structure:
```json
{
  "sub": "user_uuid",
  "role": "ADMIN|MANAGER|EMPLOYEE",
  "companyId": "company_uuid",
  "exp": 1234567890
}
```

### Middleware:
- `auth_middleware.py`: Validates JWT on every protected route, injects `current_user` into request state.
- `role_middleware.py`: Decorator/dependency for role-based access.

```python
# Usage in routers:
@router.get("/pending")
async def get_pending_approvals(
    current_user: User = Depends(require_role(Role.MANAGER, Role.ADMIN))
):
    ...
```

### Token Flow:
1. Login → returns `access_token` (15min) + `refresh_token` (7 days, stored in httpOnly cookie).
2. Frontend Axios interceptor: on 401 → call `/refresh` → retry original request.
3. Refresh token rotation: each refresh issues new refresh_token, old one invalidated.

---

## 9. Frontend Pages & Behavior

### 9.1 Login / Signup
- Signup: Company name, country (dropdown from restcountries API), email, password.
- On success: redirect to Dashboard.

### 9.2 Dashboard (role-aware)
- **Employee:** Pending expenses count, recent submissions, quick "Submit Expense" button.
- **Manager:** Pending approvals count, team expenses overview.
- **Admin:** All of above + user management stats, rule configuration links.

### 9.3 Submit Expense
- Form: Amount, Currency (dropdown), Category (dropdown), Description, Date, Receipt upload (optional).
- Toggle: "Require Manager Approval First" (only if employee has a manager assigned).
- "Scan Receipt" button → opens camera/upload → auto-fills form via OCR.

### 9.4 Expense History (Employee)
- Table/list view with filters: status, date range, category.
- Each row: amount, category, date, status badge, approval progress indicator.
- Click → detail view with full approval trail.

### 9.5 Approval Queue (Manager/Admin)
- List of expenses with status `AWAITING` for current user.
- Each item shows: employee name, amount (in company currency), category, date.
- Click → detail view with approve/reject buttons + comment field.
- Approval step indicator showing where in the workflow this expense is.

### 9.6 Admin: Manage Users
- Table of all company users.
- Create new user (email, name, role, manager assignment).
- Edit role, assign/change manager.

### 9.7 Admin: Approval Rules
- Create/edit rules with:
  - Rule name
  - Rule type: Percentage / Specific User / Hybrid
  - For percentage: threshold slider (e.g., 60%)
  - For specific user: dropdown to select the auto-approve user
  - Ordered steps: drag-and-drop to reorder approvers
  - Set as default toggle

### 9.8 Admin: Company Settings
- View/edit company name, default currency.

---

## 10. Implementation Order (for Claude Code)

Follow this exact order. Each phase should be fully working before moving to the next.

### Phase 1: Foundation
```
1. Initialize project structure (backend + frontend)
2. Set up Prisma schema + generate client + run migrations
3. FastAPI app skeleton with CORS, error handling
4. React app with Vite + TailwindCSS + React Router
```

### Phase 2: Auth & Users
```
5. Signup endpoint (with restcountries API integration)
6. Login endpoint + JWT generation
7. Auth middleware + refresh token flow
8. Frontend: Login/Signup pages + AuthContext + ProtectedRoute
9. Admin: User CRUD endpoints + ManageUsers page
```

### Phase 3: Core Expense Flow
```
10. Expense submission endpoint (with currency conversion)
11. Expense listing + detail endpoints
12. Frontend: SubmitExpense form + ExpenseHistory page
```

### Phase 4: Approval Workflow
```
13. Approval rules CRUD (admin)
14. Approval step generation on expense submit
15. Approval engine (approve/reject logic with conditional rules)
16. Frontend: ApprovalQueue + ApprovalDetail + ApprovalRules config
17. Approval step progress indicator component
```

### Phase 5: OCR & Polish
```
18. Mindee OCR integration (ocr_service.py)
19. Receipt upload endpoint
20. Frontend: ScanReceipt page with camera/upload + auto-fill
21. Admin override functionality
22. Dashboard with role-aware stats
23. PWA manifest + service worker setup
```

---

## 11. Environment Variables

```env
# Backend (.env)
DATABASE_URL=postgresql://user:password@localhost:5432/reimburse_db
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
MINDEE_API_KEY=your-mindee-api-key
FRONTEND_URL=http://localhost:5173

# Frontend (.env)
VITE_API_URL=http://localhost:8000/api
```

---

## 12. Key Business Rules Summary

1. **First signup** → auto-creates Company + Admin user. Currency set from selected country.
2. **Manager approval gate**: If `isManagerApprover` is checked on expense, the employee's direct manager is inserted as Step 0 before all rule-defined steps.
3. **Sequential approval**: Only the current step's approver sees the expense in their queue. Next step activates only after current step resolves.
4. **Conditional rules**:
   - Percentage: if `approved_count / total_steps >= threshold` → auto-approve, skip remaining.
   - Specific user: if that user approves at any step → auto-approve, skip remaining.
   - Hybrid: either condition triggers auto-approve.
5. **Rejection at any step** → entire expense is rejected, workflow terminates.
6. **Currency**: Expenses can be in any currency. Manager/Admin always sees company currency equivalent.
7. **Admin override**: Admin can force-approve or force-reject any expense regardless of workflow state.

---

