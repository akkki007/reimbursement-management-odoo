# ReimburseFlow — Pitch Video Script

## Tagline
> "From receipt to reimbursement — automated, transparent, fast."

---

## Opening (15 sec)

Managing employee expenses is broken. Paper receipts get lost, approvals sit in email for days, and finance teams drown in spreadsheets. **ReimburseFlow** fixes this — a modern expense reimbursement platform with smart OCR, multi-level approvals, and real-time currency conversion.

---

## Demo Flow (use seed data: all passwords = `password123`)

### Scene 1: Admin Sets Up the Company (1 min)

**Login as:** `admin@technova.com`

**Show:**
1. **Dashboard** — Admin sees company-wide expense overview: pending count, approved count, total value, activity log
2. **Manage Users** (`/admin/users`) — Show the user table with roles (Admin, Manager, Employee), manager assignments
   - Click **"Add User"** — create a new employee, password is optional
   - Click **"Send password"** — generates a random password and emails it to the user
   - Show inline role editing and manager assignment dropdowns
3. **Approval Rules** (`/admin/rules`) — Show the 3 pre-configured rules:
   - **Standard Sequential**: Priya (Team Lead) -> Neha (Finance) -> Arjun (Director), 60% threshold
   - **Quick Parallel**: All approvers notified at once, 50% threshold
   - **High-Value Hybrid**: Arjun (Director) can auto-approve at any step, otherwise 100% needed
   - Explain: *"Admin defines who approves, in what order, and what shortcuts exist"*
4. **Company Settings** (`/admin/settings`) — Show company currency (INR)

**Key talking point:**
> "The admin configures the approval workflow once. From then on, every expense follows the rules automatically."

---

### Scene 2: Employee Submits Expenses (1.5 min)

**Login as:** `ankit@technova.com` (Employee under Priya)

**Show:**
1. **Dashboard** — Employee sees their own expense stats
2. **Submit Expense** (`/expenses/submit`) — Fill out the form:
   - Description: "Client meeting lunch"
   - Category: Meals
   - Amount: 2200, Currency: INR
   - Attach a receipt (file upload)
   - Click **"Submit"** — expense enters the approval pipeline
   - Also show **"Save as draft"** option
3. **Scan Receipt** (`/expenses/scan`) — The star feature:
   - Upload a receipt image
   - Click **"Scan with OCR"** — the local Ollama model extracts amount, currency, vendor, date, category
   - Form auto-fills with extracted data
   - Employee reviews, edits if needed
   - Can **Save as draft** or **Submit** directly
4. **Expense History** (`/expenses`) — Show the list with status badges (Draft, Pending, Approved, Rejected)
   - Click into an expense to see the approval progress tracker

**Key talking points:**
> "OCR eliminates manual data entry. Snap a photo, review the auto-filled fields, submit."
> "Foreign currency? No problem — amounts auto-convert to INR using live exchange rates."

---

### Scene 3: Currency Conversion (30 sec)

**Still as Ankit:**

1. Submit a new expense in **USD** (e.g., $50 for a SaaS subscription)
2. Show the conversion notice: *"This amount will be auto-converted to INR using today's exchange rate"*
3. After submission, show that both original amount (USD) and converted amount (INR) are stored

**Key talking point:**
> "Employees submit in whatever currency they paid. Managers always see the company currency equivalent."

---

### Scene 4: Manager Approves/Rejects (1.5 min)

**Login as:** `priya@technova.com` (Manager — Team Lead)

**Show:**
1. **Approval Queue** (`/approvals`) — Priya sees 4 pending expenses waiting for her action
   - Each shows: employee name, amount (in INR), category, date
2. Click into **Divya's cab fare (INR 4,500)**:
   - See the full expense detail with description, category, amount, date
   - See the **receipt attachment** — click "View attached receipt" to open it
   - See the **Approval Progress** sidebar: 3 steps — Team Lead (current), Finance, Director
   - Type a comment, click **"Approve"**
   - Step 1 turns green, Step 2 (Neha/Finance) becomes active
3. Click into **Meera's hotel stay (INR 12,000)** — this is already at step 2 (Priya already approved)
   - Show the approval log: Priya's approval with timestamp and comment
4. Go back, click into another expense and **Reject** it:
   - Add a comment (required for rejection): "Missing receipt, please re-submit"
   - Entire workflow terminates — expense status becomes Rejected

**Key talking points:**
> "Approvals flow sequentially — each approver only sees the expense when it's their turn."
> "One rejection at any step terminates the workflow. No ambiguity."

---

### Scene 5: The 60% Auto-Approval Rule (30 sec)

**Login as:** `neha@technova.com` (Finance Manager)

**Show:**
1. Neha sees Divya's cab fare (Priya already approved at step 1)
2. Neha approves at step 2
3. **Result:** 2 out of 3 steps approved = 66% >= 60% threshold
4. Step 3 (Arjun/Director) is automatically **SKIPPED**
5. Expense status jumps to **APPROVED**

**Key talking point:**
> "The 60% threshold means not everyone needs to approve. When the threshold is met, remaining steps are skipped automatically."

---

### Scene 6: Admin Override (20 sec)

**Login as:** `admin@technova.com`

**Show:**
1. Go to any pending or in-progress expense
2. Click **"Override"** → Force Approve
3. All remaining steps get skipped, expense is approved immediately

**Key talking point:**
> "Admin can override any expense at any time — force approve or force reject, regardless of where it is in the workflow."

---

### Scene 7: First Login Password Flow (30 sec)

**Show:**
1. Admin creates a new user without a password
2. Admin clicks **"Send password"** — a temporary password is emailed
3. New user logs in with that temporary password
4. **Forced redirect** to Set Password page — "You're using a temporary password. Please set a new password."
5. User sets their own password, proceeds to dashboard

**Key talking point:**
> "Secure onboarding — admin never needs to share passwords verbally. Users are forced to set their own on first login."

---

### Scene 8: Forgot Password (15 sec)

**Show:**
1. On the login page, click **"Forgot password?"**
2. Enter email + new password + confirm
3. Password updated, redirect to login

---

## Feature Highlights Slide (15 sec)

| Feature | Detail |
|---|---|
| Multi-level approval workflows | Sequential, parallel, or hybrid rules |
| Conditional auto-approval | Percentage threshold + specific user shortcuts |
| OCR receipt scanning | Local Ollama model — no external API needed |
| Multi-currency support | Auto-conversion via live exchange rates |
| Role-based access | Admin, Manager, Employee — each sees what they need |
| Receipt attachments | Upload and view receipts at every step |
| Admin override | Force approve/reject at any time |
| Secure auth | JWT tokens, bcrypt passwords, forced password change |
| Audit trail | Every approval action logged with timestamp + comment |

---

## Tech Stack Slide (10 sec)

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Python FastAPI |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + bcrypt |
| OCR | Ollama (local, glm-ocr model) |
| Currency | exchangerate-api.com (live rates) |

---

## Closing (10 sec)

> "ReimburseFlow turns a 2-week reimbursement cycle into a 2-minute workflow. Built for teams that value transparency, speed, and control."

---

## Demo Accounts Quick Reference

```
Company: TechNova Solutions (INR)
All passwords: password123

ADMIN
  admin@technova.com     Rajesh Kapoor

MANAGERS
  priya@technova.com     Priya Sharma       (Team Lead — 4 pending approvals)
  arjun@technova.com     Arjun Mehta        (Director)
  neha@technova.com      Neha Gupta         (Finance — 2 awaiting her)

EMPLOYEES
  ankit@technova.com     Ankit Verma        (reports to Priya)
  divya@technova.com     Divya Patel        (reports to Priya)
  rohan@technova.com     Rohan Singh        (reports to Arjun)
  meera@technova.com     Meera Iyer         (reports to Arjun)
  karan@technova.com     Karan Joshi        (reports to Neha)
```

## Running the Demo

```bash
# 1. Seed the database
cd backend
source venv/bin/activate
python seed.py

# 2. Start backend
uvicorn app.main:app --reload --port 8000

# 3. Start frontend (new terminal)
cd frontend
npm run dev
```
