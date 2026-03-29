"""
Seed script for ReimburseFlow.
Creates a realistic demo dataset: company, users, approval rules, and expenses in various states.

Usage:
    cd backend
    source venv/bin/activate
    python seed.py
"""

import asyncio
from datetime import datetime, timedelta, timezone
from prisma import Prisma
from app.services.auth_service import hash_password

db = Prisma()

PASSWORD = "password123"


async def main():
    await db.connect()

    # ── Clean existing data (FK order) ──────────────
    await db.approvalaction.delete_many()
    await db.approvalstep.delete_many()
    await db.expense.delete_many()
    await db.approvalrulestep.delete_many()
    await db.approvalrule.delete_many()
    await db.user.delete_many()
    await db.company.delete_many()

    print("Cleaned existing data.\n")

    now = datetime.now(timezone.utc)

    # ════════════════════════════════════════════════
    #  COMPANY
    # ════════════════════════════════════════════════
    company = await db.company.create(
        data={
            "name": "TechNova Solutions",
            "country": "India",
            "defaultCurrency": "INR",
        }
    )
    print(f"Company: {company.name} ({company.defaultCurrency})")

    # ════════════════════════════════════════════════
    #  USERS
    # ════════════════════════════════════════════════

    # --- Admin ---
    admin = await db.user.create(
        data={
            "email": "admin@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Rajesh",
            "lastName": "Kapoor",
            "role": "ADMIN",
            "companyId": company.id,
        }
    )

    # --- Managers ---
    mgr_priya = await db.user.create(
        data={
            "email": "priya@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Priya",
            "lastName": "Sharma",
            "role": "MANAGER",
            "companyId": company.id,
        }
    )

    mgr_arjun = await db.user.create(
        data={
            "email": "arjun@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Arjun",
            "lastName": "Mehta",
            "role": "MANAGER",
            "companyId": company.id,
        }
    )

    mgr_neha = await db.user.create(
        data={
            "email": "neha@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Neha",
            "lastName": "Gupta",
            "role": "MANAGER",
            "companyId": company.id,
        }
    )

    # --- Employees (under Priya) ---
    emp_ankit = await db.user.create(
        data={
            "email": "ankit@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Ankit",
            "lastName": "Verma",
            "role": "EMPLOYEE",
            "companyId": company.id,
            "managerId": mgr_priya.id,
        }
    )

    emp_divya = await db.user.create(
        data={
            "email": "divya@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Divya",
            "lastName": "Patel",
            "role": "EMPLOYEE",
            "companyId": company.id,
            "managerId": mgr_priya.id,
        }
    )

    # --- Employees (under Arjun) ---
    emp_rohan = await db.user.create(
        data={
            "email": "rohan@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Rohan",
            "lastName": "Singh",
            "role": "EMPLOYEE",
            "companyId": company.id,
            "managerId": mgr_arjun.id,
        }
    )

    emp_meera = await db.user.create(
        data={
            "email": "meera@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Meera",
            "lastName": "Iyer",
            "role": "EMPLOYEE",
            "companyId": company.id,
            "managerId": mgr_arjun.id,
        }
    )

    # --- Employee (under Neha) ---
    emp_karan = await db.user.create(
        data={
            "email": "karan@technova.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Karan",
            "lastName": "Joshi",
            "role": "EMPLOYEE",
            "companyId": company.id,
            "managerId": mgr_neha.id,
        }
    )

    print(f"Admin:     {admin.email}")
    print(f"Managers:  {mgr_priya.email}, {mgr_arjun.email}, {mgr_neha.email}")
    print(f"Employees: {emp_ankit.email} (->Priya), {emp_divya.email} (->Priya)")
    print(f"           {emp_rohan.email} (->Arjun), {emp_meera.email} (->Arjun)")
    print(f"           {emp_karan.email} (->Neha)")

    # ════════════════════════════════════════════════
    #  APPROVAL RULES
    # ════════════════════════════════════════════════

    # Rule 1: Standard sequential (DEFAULT)
    # Priya (Team Lead) → Neha (Finance) → Arjun (Director)
    rule1 = await db.approvalrule.create(
        data={
            "companyId": company.id,
            "name": "Standard Sequential Approval",
            "description": "3-step sequential: Team Lead -> Finance -> Director. 60% threshold.",
            "ruleType": "PERCENTAGE",
            "percentRequired": 0.6,
            "isSequential": True,
            "isManagerApprover": False,
            "isDefault": True,
        }
    )
    await db.approvalrulestep.create(data={"approvalRuleId": rule1.id, "stepOrder": 1, "approverId": mgr_priya.id, "stepLabel": "Team Lead", "isRequired": True})
    await db.approvalrulestep.create(data={"approvalRuleId": rule1.id, "stepOrder": 2, "approverId": mgr_neha.id, "stepLabel": "Finance", "isRequired": False})
    await db.approvalrulestep.create(data={"approvalRuleId": rule1.id, "stepOrder": 3, "approverId": mgr_arjun.id, "stepLabel": "Director", "isRequired": False})
    print(f"\nRule 1: {rule1.name} (sequential, DEFAULT)")
    print(f"  Steps: Priya (Team Lead, required) -> Neha (Finance) -> Arjun (Director)")
    print(f"  Auto-approves at 60% (2 of 3 approvals)")

    # Rule 2: Parallel approval
    rule2 = await db.approvalrule.create(
        data={
            "companyId": company.id,
            "name": "Quick Parallel Approval",
            "description": "All approvers notified at once. 50% must approve.",
            "ruleType": "PERCENTAGE",
            "percentRequired": 0.5,
            "isSequential": False,
            "isManagerApprover": False,
            "isDefault": False,
        }
    )
    await db.approvalrulestep.create(data={"approvalRuleId": rule2.id, "stepOrder": 1, "approverId": mgr_priya.id, "stepLabel": "Team Lead"})
    await db.approvalrulestep.create(data={"approvalRuleId": rule2.id, "stepOrder": 2, "approverId": mgr_neha.id, "stepLabel": "Finance", "isRequired": True})
    print(f"\nRule 2: {rule2.name} (parallel)")
    print(f"  Steps: Priya (Team Lead) + Neha (Finance, required) — 50% threshold")

    # Rule 3: Hybrid with specific user (CFO auto-approve)
    rule3 = await db.approvalrule.create(
        data={
            "companyId": company.id,
            "name": "High-Value Hybrid Approval",
            "description": "Director can auto-approve at any step. Otherwise 100% needed.",
            "ruleType": "HYBRID",
            "percentRequired": 1.0,
            "specificUserId": mgr_arjun.id,
            "isSequential": True,
            "isManagerApprover": False,
            "isDefault": False,
        }
    )
    await db.approvalrulestep.create(data={"approvalRuleId": rule3.id, "stepOrder": 1, "approverId": mgr_priya.id, "stepLabel": "Team Lead", "isRequired": True})
    await db.approvalrulestep.create(data={"approvalRuleId": rule3.id, "stepOrder": 2, "approverId": mgr_arjun.id, "stepLabel": "Director", "isRequired": True})
    await db.approvalrulestep.create(data={"approvalRuleId": rule3.id, "stepOrder": 3, "approverId": mgr_neha.id, "stepLabel": "Finance", "isRequired": True})
    print(f"\nRule 3: {rule3.name} (hybrid)")
    print(f"  Steps: Priya -> Arjun (auto-approve power) -> Neha — 100% or Arjun skips rest")

    # ════════════════════════════════════════════════
    #  EXPENSES — various statuses for demo
    # ════════════════════════════════════════════════

    print("\n--- Expenses ---")

    # ── 1. DRAFT — Ankit saved but hasn't submitted ──
    exp_draft = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_ankit.id,
            "amount": 1200.00,
            "currency": "INR",
            "category": "OFFICE_SUPPLIES",
            "description": "Ergonomic keyboard and mouse",
            "remarks": "Recommended by doctor for RSI prevention",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=1)),
            "status": "DRAFT",
        }
    )
    print(f"  DRAFT:       {exp_draft.description} (Ankit)")

    # ── 2. PENDING — Divya just submitted, waiting on step 1 ──
    exp_pending1 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_divya.id,
            "amount": 4500.00,
            "currency": "INR",
            "category": "TRAVEL",
            "description": "Cab fare for client visit to Pune office",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=2)),
            "status": "PENDING",
            "currentStepOrder": 0,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_pending1.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp_pending1.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "PENDING"})
    await db.approvalstep.create(data={"expenseId": exp_pending1.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "PENDING"})
    print(f"  PENDING:     {exp_pending1.description} (Divya -> awaiting Priya)")

    # ── 3. PENDING — Rohan submitted a foreign currency expense ──
    exp_pending2 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_rohan.id,
            "amount": 89.99,
            "currency": "USD",
            "convertedAmount": 7511.57,
            "exchangeRate": 83.47,
            "category": "SOFTWARE",
            "description": "Annual GitHub Copilot subscription",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=3)),
            "status": "PENDING",
            "currentStepOrder": 0,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_pending2.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp_pending2.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "PENDING"})
    await db.approvalstep.create(data={"expenseId": exp_pending2.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "PENDING"})
    print(f"  PENDING:     {exp_pending2.description} (Rohan, $89.99 -> INR 7,511.57)")

    # ── 4. PENDING — Karan's meal expense ──
    exp_pending3 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_karan.id,
            "amount": 1850.00,
            "currency": "INR",
            "category": "MEALS",
            "description": "Team dinner after product launch",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=1)),
            "status": "PENDING",
            "currentStepOrder": 0,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_pending3.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp_pending3.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "PENDING"})
    await db.approvalstep.create(data={"expenseId": exp_pending3.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "PENDING"})
    print(f"  PENDING:     {exp_pending3.description} (Karan -> awaiting Priya)")

    # ── 5. IN_PROGRESS — Meera's expense, step 1 approved, step 2 awaiting ──
    exp_progress = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_meera.id,
            "amount": 12000.00,
            "currency": "INR",
            "category": "ACCOMMODATION",
            "description": "Hotel stay for 3 nights - Bangalore conference",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=5)),
            "status": "IN_PROGRESS",
            "currentStepOrder": 1,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_progress.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "APPROVED"})
    await db.approvalstep.create(data={"expenseId": exp_progress.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp_progress.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "PENDING"})
    await db.approvalaction.create(data={"expenseId": exp_progress.id, "actorId": mgr_priya.id, "action": "APPROVED", "comment": "Conference attendance approved by VP."})
    print(f"  IN_PROGRESS: {exp_progress.description} (Meera, step 1 done -> awaiting Neha)")

    # ── 6. IN_PROGRESS — Ankit's transport, step 1 done ──
    exp_progress2 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_ankit.id,
            "amount": 3500.00,
            "currency": "INR",
            "category": "TRANSPORT",
            "description": "Airport pickup and drop for client visit",
            "paidBy": "COMPANY",
            "expenseDate": (now - timedelta(days=4)),
            "status": "IN_PROGRESS",
            "currentStepOrder": 1,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_progress2.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "APPROVED"})
    await db.approvalstep.create(data={"expenseId": exp_progress2.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp_progress2.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "PENDING"})
    await db.approvalaction.create(data={"expenseId": exp_progress2.id, "actorId": mgr_priya.id, "action": "APPROVED", "comment": "Client visit verified."})
    print(f"  IN_PROGRESS: {exp_progress2.description} (Ankit, step 1 done -> awaiting Neha)")

    # ── 7. APPROVED — Divya's flight (fully approved) ──
    exp_approved1 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_divya.id,
            "amount": 8500.00,
            "currency": "INR",
            "category": "TRAVEL",
            "description": "Return flight tickets Delhi-Mumbai",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=10)),
            "status": "APPROVED",
            "currentStepOrder": 2,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_approved1.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "APPROVED"})
    await db.approvalstep.create(data={"expenseId": exp_approved1.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "APPROVED"})
    await db.approvalstep.create(data={"expenseId": exp_approved1.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "SKIPPED"})
    await db.approvalaction.create(data={"expenseId": exp_approved1.id, "actorId": mgr_priya.id, "action": "APPROVED", "comment": "Pre-approved travel."})
    await db.approvalaction.create(data={"expenseId": exp_approved1.id, "actorId": mgr_neha.id, "action": "APPROVED", "comment": "Within budget. 60% threshold met."})
    print(f"  APPROVED:    {exp_approved1.description} (Divya, 2/3 approved -> 60% auto-approved)")

    # ── 8. APPROVED — Rohan's meals (foreign currency) ──
    exp_approved2 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_rohan.id,
            "amount": 35.50,
            "currency": "EUR",
            "convertedAmount": 3230.05,
            "exchangeRate": 90.99,
            "category": "MEALS",
            "description": "Client dinner in Berlin",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=8)),
            "status": "APPROVED",
            "currentStepOrder": 2,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_approved2.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "APPROVED"})
    await db.approvalstep.create(data={"expenseId": exp_approved2.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "APPROVED"})
    await db.approvalstep.create(data={"expenseId": exp_approved2.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "SKIPPED"})
    await db.approvalaction.create(data={"expenseId": exp_approved2.id, "actorId": mgr_priya.id, "action": "APPROVED"})
    await db.approvalaction.create(data={"expenseId": exp_approved2.id, "actorId": mgr_neha.id, "action": "APPROVED", "comment": "Currency converted correctly."})
    print(f"  APPROVED:    {exp_approved2.description} (Rohan, EUR 35.50 -> INR 3,230.05)")

    # ── 9. APPROVED — Karan's software (admin override) ──
    exp_override = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_karan.id,
            "amount": 2400.00,
            "currency": "INR",
            "category": "SOFTWARE",
            "description": "JetBrains IDE annual license",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=12)),
            "status": "APPROVED",
            "currentStepOrder": 0,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_override.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "SKIPPED"})
    await db.approvalstep.create(data={"expenseId": exp_override.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "SKIPPED"})
    await db.approvalaction.create(data={"expenseId": exp_override.id, "actorId": admin.id, "action": "OVERRIDE_APPROVED", "comment": "Bulk license purchase pre-approved by CTO."})
    print(f"  APPROVED:    {exp_override.description} (Karan, admin override by Rajesh)")

    # ── 10. REJECTED — Meera's entertainment (rejected at step 1) ──
    exp_rejected1 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_meera.id,
            "amount": 25000.00,
            "currency": "INR",
            "category": "ENTERTAINMENT",
            "description": "Corporate box tickets for IPL match",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=6)),
            "status": "REJECTED",
            "currentStepOrder": 0,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_rejected1.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "REJECTED"})
    await db.approvalstep.create(data={"expenseId": exp_rejected1.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "PENDING"})
    await db.approvalstep.create(data={"expenseId": exp_rejected1.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "PENDING"})
    await db.approvalaction.create(data={"expenseId": exp_rejected1.id, "actorId": mgr_priya.id, "action": "REJECTED", "comment": "Entertainment expenses above 10K need pre-approval from Director."})
    print(f"  REJECTED:    {exp_rejected1.description} (Meera, rejected by Priya)")

    # ── 11. REJECTED — Ankit's expense (rejected at step 2) ──
    exp_rejected2 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_ankit.id,
            "amount": 18000.00,
            "currency": "INR",
            "category": "TRAVEL",
            "description": "Business class upgrade for domestic flight",
            "paidBy": "EMPLOYEE",
            "expenseDate": (now - timedelta(days=7)),
            "status": "REJECTED",
            "currentStepOrder": 1,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_rejected2.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "APPROVED"})
    await db.approvalstep.create(data={"expenseId": exp_rejected2.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "REJECTED"})
    await db.approvalstep.create(data={"expenseId": exp_rejected2.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "PENDING"})
    await db.approvalaction.create(data={"expenseId": exp_rejected2.id, "actorId": mgr_priya.id, "action": "APPROVED", "comment": "Travel is valid."})
    await db.approvalaction.create(data={"expenseId": exp_rejected2.id, "actorId": mgr_neha.id, "action": "REJECTED", "comment": "Company policy: economy class only for domestic. Please rebook."})
    print(f"  REJECTED:    {exp_rejected2.description} (Ankit, approved by Priya, rejected by Neha)")

    # ── 12. PENDING — Divya's recent expense ──
    exp_pending4 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_divya.id,
            "amount": 650.00,
            "currency": "INR",
            "category": "OFFICE_SUPPLIES",
            "description": "Notebook and stationery for Q2 planning",
            "paidBy": "EMPLOYEE",
            "expenseDate": now,
            "status": "PENDING",
            "currentStepOrder": 0,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp_pending4.id, "approverId": mgr_priya.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp_pending4.id, "approverId": mgr_neha.id, "stepOrder": 1, "stepLabel": "Finance", "status": "PENDING"})
    await db.approvalstep.create(data={"expenseId": exp_pending4.id, "approverId": mgr_arjun.id, "stepOrder": 2, "stepLabel": "Director", "status": "PENDING"})
    print(f"  PENDING:     {exp_pending4.description} (Divya -> awaiting Priya)")

    await db.disconnect()

    print("\n" + "=" * 60)
    print("  SEED COMPLETE")
    print("=" * 60)
    print(f"\nCompany: TechNova Solutions (INR)")
    print(f"\nAll passwords: {PASSWORD}")
    print(f"\n{'Email':<28} {'Role':<10} {'Manager':<10}")
    print("-" * 50)
    print(f"{'admin@technova.com':<28} {'ADMIN':<10} {'—':<10}")
    print(f"{'priya@technova.com':<28} {'MANAGER':<10} {'—':<10}")
    print(f"{'arjun@technova.com':<28} {'MANAGER':<10} {'—':<10}")
    print(f"{'neha@technova.com':<28} {'MANAGER':<10} {'—':<10}")
    print(f"{'ankit@technova.com':<28} {'EMPLOYEE':<10} {'Priya':<10}")
    print(f"{'divya@technova.com':<28} {'EMPLOYEE':<10} {'Priya':<10}")
    print(f"{'rohan@technova.com':<28} {'EMPLOYEE':<10} {'Arjun':<10}")
    print(f"{'meera@technova.com':<28} {'EMPLOYEE':<10} {'Arjun':<10}")
    print(f"{'karan@technova.com':<28} {'EMPLOYEE':<10} {'Neha':<10}")
    print(f"\n12 expenses: 1 draft, 4 pending, 2 in-progress, 3 approved, 2 rejected")
    print(f"3 approval rules: sequential (default), parallel, hybrid")
    print(f"\nPriya has 4 pending approvals to review.")
    print(f"Neha has 2 in-progress expenses awaiting her action.")


if __name__ == "__main__":
    asyncio.run(main())
