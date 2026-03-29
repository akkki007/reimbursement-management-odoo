# ReimburseFlow — What's Implemented

A guide for teammates to test every working feature.

---

## Quick Start

```bash
# 1. Database
createdb reimburse_db   # or use your existing PostgreSQL

# 2. Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Edit .env with your DB credentials:
#   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reimburse_db
#   JWT_SECRET_KEY=any-random-string

# Push schema & seed data
prisma db push
python seed.py

# Start server
uvicorn app.main:app --reload --port 8000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

---

## Test Accounts (all password: `password123`)

| Role | Email | Notes |
|------|-------|-------|
| Admin | admin@acme.com | Full access, can manage users/rules/settings |
| Manager | john@acme.com | Has 3 pending approvals waiting |
| Manager | sarah@acme.com | Finance approver |
| Manager | mitchell@acme.com | Reviewer in approval chain |
| Employee | alice@acme.com | Has submitted expenses, manager is John |
| Employee | bob@acme.com | Has approved + in-progress expenses, manager is Sarah |
| Employee | carol@acme.com | Has a rejected expense, manager is John |

---

## Features to Test

### 1. Authentication
- **Signup** (`/signup`): Create a new company. Country dropdown fetches from restcountries API and auto-sets company currency.
- **Login** (`/login`): Login with any test account above.
- **Token refresh**: Access tokens expire in 15min, refresh happens automatically.
- **Logout**: Click the logout icon in the bottom of the sidebar.

### 2. Dashboard (`/dashboard`)
- Shows **4 stat cards**: Pending, Approved, Rejected, Total submitted — with real counts from the DB.
- **Company expenses chart** (placeholder data for now).
- **Recent expenses** list in the sidebar card.
- **Activity log** shows recent expense submissions with status badges.
- **Pending approval alert** (for managers/admin) shows count of expenses waiting for their action.

### 3. Submit Expense (`/expenses/submit`)
- **Fields**: Description, Expense Date, Category, Paid By (Employee/Company), Amount + Currency, Remarks.
- **Attach Receipt** button at top (UI only — file selected but not uploaded to storage yet).
- **Scan Receipt** link → goes to OCR page.
- **Currency conversion**: If you submit in a currency different from the company's base currency (INR for Acme), it auto-converts using live exchange rates from exchangerate-api.com.
- **Manager approval toggle**: Only shows if the employee has a manager assigned. Adds manager as first approver.
- **Two submit modes**:
  - **Submit** → creates expense and immediately sends to approval workflow.
  - **Save as Draft** → saves but does NOT submit. Appears as "Draft" in expense list.

### 4. My Expenses (`/expenses`)
- **3 summary cards**: "To Submit" (drafts), "Waiting Approval", "Approved" — each with total amount.
- **Full table**: Employee, Description, Date, Category, Paid By, Remarks, Amount, Status.
- **Draft rows** have a "Submit" button to push into the approval workflow.
- **Non-draft rows** are clickable → opens expense detail.
- **Status badges**: Draft (red), Submitted (green), Approved (green), Rejected (red).

### 5. Expense Detail (`/approvals/:expenseId`)
- **Status progress bar**: Draft → Waiting Approval → Approved (or Rejected).
- **Readonly fields** after submission: Description, Date, Category, Paid By, Amount, Currency, Remarks.
- **Currency conversion note** (for managers): shows original amount + converted amount with exchange rate.
- **Approval progress sidebar**: Step-by-step indicators showing each approver's status (Awaiting/Approved/Rejected/Pending/Skipped).
- **Approve/Reject buttons**: Only visible to the current step's approver. Reject requires a comment.
- **Approval log table**: Approver | Status | Time | Comment — shows full audit trail.

### 6. Approval Queue (`/approvals`) — Manager/Admin only
- Lists all expenses with an **AWAITING** step assigned to the current user.
- Shows: Employee name, Description, Category, Amount (in company currency), Date, Current step label.
- Click any row → opens the expense detail to approve/reject.

### 7. Manage Users (`/admin/users`) — Admin only
- **User table**: Name, Email, Role, Manager, Status (Active/Inactive).
- **Add User button**: Modal to create employee/manager/admin with password, role, and manager assignment.
- **Inline role editing**: Click role badge → dropdown to change.
- **Inline manager assignment**: Click manager name → dropdown to reassign.
- **Deactivate**: Removes user access (can't deactivate yourself).

### 8. Approval Rules (`/admin/rules`) — Admin only
- **Create/Edit rules** with:
  - Rule name + Description
  - **Rule type**: Percentage threshold / Specific User auto-approve / Hybrid
  - **"Is manager an approver?" toggle**: If on, submitter's manager approves first before other steps.
  - **"Approvers Sequence" toggle**:
    - **On (Sequential)**: Approvers go in order 1→2→3, each waits for the previous.
    - **Off (Parallel)**: All approvers notified at the same time.
  - **Minimum approval percentage** slider (e.g., 60%).
  - **Approvers table**: Add approvers in numbered order with labels (e.g., "Finance", "Team Lead").
  - **Required checkbox** per approver: If ticked, that approver MUST approve. If a required approver rejects, the entire expense is auto-rejected.
- **Set default**: One rule is the company's default for all new expenses.
- **Deactivate**: Soft-deletes a rule.

### 9. Company Settings (`/admin/settings`) — Admin only
- Edit company name and default currency.
- Currency dropdown fetched from restcountries API.

### 10. Scan Receipt / OCR (`/expenses/scan`)
- Upload or photograph a receipt.
- **"Scan with OCR" button** sends to Mindee API and auto-fills: Amount, Currency, Date, Vendor, Category, Description.
- OCR-filled fields are highlighted with a yellow tint.
- User reviews/edits, then submits.

---

## How to Test OCR

The OCR uses the **Mindee Receipt API**. To test:

1. **Get a free API key** at https://platform.mindee.com (free tier: 250 pages/month).
2. Sign up → Create an API key → Copy it.
3. Set it in `backend/.env`:
   ```
   MINDEE_API_KEY=your-actual-key-here
   ```
4. Restart the backend server.
5. Go to `/expenses/scan`, upload a receipt image, click **"Scan with OCR"**.
6. Fields should auto-populate from the receipt.

**Without a Mindee key**: The scan page still works but returns empty fields with an error message "Mindee API key not configured". You can still manually fill and submit.

---

## Approval Workflow — How to Test the Full Flow

### Test A: Sequential approval (default rule)
1. Login as **alice@acme.com** (employee).
2. Go to Submit Expense → fill form → Submit.
3. Login as **john@acme.com** (manager, Alice's manager).
4. Go to Approvals → you should see Alice's expense → Approve it.
5. Login as **mitchell@acme.com** → Approvals → Approve.
6. Login as **sarah@acme.com** → Approvals → Approve.
7. Login as Alice → expense should show "Approved".

### Test B: Rejection
1. Login as Alice → Submit an expense.
2. Login as John → Approvals → Reject with a comment.
3. Login as Alice → expense shows "Rejected" with the comment in the audit log.

### Test C: Draft flow
1. Login as Alice → Submit Expense → click **"Save as Draft"**.
2. Go to My Expenses → see the draft in "To Submit" card.
3. Click the **Submit** button on the draft row → it enters the approval workflow.

### Test D: Currency conversion
1. Login as Alice → Submit an expense with currency **USD** (company is INR).
2. The amount gets auto-converted to INR using live exchange rates.
3. Login as John → Approvals → see both the original USD amount and the converted INR amount.

### Test E: Admin override
1. Login as **admin@acme.com**.
2. Open any pending expense detail.
3. As admin, you can approve/reject regardless of the workflow step.

---

## Pre-seeded Data

The seed script creates:
- **5 sample expenses** in various states: 2 pending (awaiting John), 1 approved, 1 rejected, 1 in-progress.
- **2 approval rules**: "Standard 3-Step" (sequential, default) and "Quick Parallel".
- John already has **3 pending approvals** in his queue.

---

## API Health Check

```bash
curl http://localhost:8000/api/health
# → {"status":"healthy","service":"ReimburseFlow"}
```

## API Docs (auto-generated)

Visit http://localhost:8000/docs for the full Swagger UI with all endpoints.
