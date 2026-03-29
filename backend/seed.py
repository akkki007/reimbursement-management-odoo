"""
Seed script for ReimburseFlow.
Creates a company, users (admin, managers, employees), approval rules, and sample expenses.

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

PASSWORD = "password123"  # default password for all seed users


async def main():
    await db.connect()

    # Clean existing data (order matters for FK constraints)
    await db.approvalaction.delete_many()
    await db.approvalstep.delete_many()
    await db.expense.delete_many()
    await db.approvalrulestep.delete_many()
    await db.approvalrule.delete_many()
    await db.user.delete_many()
    await db.company.delete_many()

    print("Cleaned existing data.")

    # ── Company ──────────────────────────────────────
    company = await db.company.create(
        data={
            "name": "Acme Corporation",
            "country": "India",
            "defaultCurrency": "INR",
        }
    )
    print(f"Created company: {company.name} (currency: {company.defaultCurrency})")

    # ── Users ────────────────────────────────────────
    admin = await db.user.create(
        data={
            "email": "admin@acme.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Marc",
            "lastName": "Admin",
            "role": "ADMIN",
            "companyId": company.id,
        }
    )
    print(f"Created admin: {admin.email}")

    manager_john = await db.user.create(
        data={
            "email": "john@acme.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "John",
            "lastName": "Manager",
            "role": "MANAGER",
            "companyId": company.id,
        }
    )

    manager_sarah = await db.user.create(
        data={
            "email": "sarah@acme.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Sarah",
            "lastName": "Finance",
            "role": "MANAGER",
            "companyId": company.id,
        }
    )

    mitchell = await db.user.create(
        data={
            "email": "mitchell@acme.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Mitchell",
            "lastName": "Reviewer",
            "role": "MANAGER",
            "companyId": company.id,
        }
    )

    emp_alice = await db.user.create(
        data={
            "email": "alice@acme.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Alice",
            "lastName": "Developer",
            "role": "EMPLOYEE",
            "companyId": company.id,
            "managerId": manager_john.id,
        }
    )

    emp_bob = await db.user.create(
        data={
            "email": "bob@acme.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Bob",
            "lastName": "Designer",
            "role": "EMPLOYEE",
            "companyId": company.id,
            "managerId": manager_sarah.id,
        }
    )

    emp_carol = await db.user.create(
        data={
            "email": "carol@acme.com",
            "passwordHash": hash_password(PASSWORD),
            "firstName": "Carol",
            "lastName": "Marketing",
            "role": "EMPLOYEE",
            "companyId": company.id,
            "managerId": manager_john.id,
        }
    )

    print(f"Created 3 managers: John, Sarah, Mitchell")
    print(f"Created 3 employees: Alice (→John), Bob (→Sarah), Carol (→John)")

    # ── Approval Rules ───────────────────────────────

    # Rule 1: Sequential 3-step approval (default)
    rule1 = await db.approvalrule.create(
        data={
            "companyId": company.id,
            "name": "Standard 3-Step Approval",
            "description": "Sequential approval: John → Mitchell → Sarah. John is required.",
            "ruleType": "PERCENTAGE",
            "percentRequired": 0.6,
            "isSequential": True,
            "isManagerApprover": True,
            "isDefault": True,
        }
    )
    await db.approvalrulestep.create(data={"approvalRuleId": rule1.id, "stepOrder": 1, "approverId": manager_john.id, "stepLabel": "Team Lead", "isRequired": True})
    await db.approvalrulestep.create(data={"approvalRuleId": rule1.id, "stepOrder": 2, "approverId": mitchell.id, "stepLabel": "Reviewer"})
    await db.approvalrulestep.create(data={"approvalRuleId": rule1.id, "stepOrder": 3, "approverId": manager_sarah.id, "stepLabel": "Finance"})
    print(f"Created rule: {rule1.name} (sequential, default)")

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
    await db.approvalrulestep.create(data={"approvalRuleId": rule2.id, "stepOrder": 1, "approverId": manager_john.id, "stepLabel": "Team Lead", "isRequired": False})
    await db.approvalrulestep.create(data={"approvalRuleId": rule2.id, "stepOrder": 2, "approverId": manager_sarah.id, "stepLabel": "Finance", "isRequired": True})
    print(f"Created rule: {rule2.name} (parallel)")

    # ── Sample Expenses ──────────────────────────────
    now = datetime.now(timezone.utc)

    # Expense 1: Alice's pending expense
    exp1 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_alice.id,
            "amount": 2500.00,
            "currency": "INR",
            "category": "TRAVEL",
            "description": "Train tickets to Mumbai for client meeting",
            "expenseDate": (now - timedelta(days=2)),
            "status": "PENDING",
            "isManagerApprover": True,
            "currentStepOrder": 0,
        }
    )
    # Create approval steps for exp1 (manager first, then rule steps)
    await db.approvalstep.create(data={"expenseId": exp1.id, "approverId": manager_john.id, "stepOrder": 0, "stepLabel": "Manager", "isRequired": True, "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp1.id, "approverId": manager_john.id, "stepOrder": 1, "stepLabel": "Team Lead", "isRequired": True, "status": "PENDING"})
    await db.approvalstep.create(data={"expenseId": exp1.id, "approverId": mitchell.id, "stepOrder": 2, "stepLabel": "Reviewer", "isRequired": False, "status": "PENDING"})
    await db.approvalstep.create(data={"expenseId": exp1.id, "approverId": manager_sarah.id, "stepOrder": 3, "stepLabel": "Finance", "isRequired": False, "status": "PENDING"})
    print(f"Created expense: {exp1.description} (PENDING, awaiting John)")

    # Expense 2: Bob's approved expense
    exp2 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_bob.id,
            "amount": 45.99,
            "currency": "USD",
            "convertedAmount": 3839.57,
            "exchangeRate": 83.48,
            "category": "MEALS",
            "description": "Team lunch at restaurant",
            "expenseDate": (now - timedelta(days=5)),
            "status": "APPROVED",
            "isManagerApprover": False,
            "currentStepOrder": 1,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp2.id, "approverId": manager_sarah.id, "stepOrder": 0, "stepLabel": "Finance", "isRequired": True, "status": "APPROVED"})
    await db.approvalaction.create(data={"expenseId": exp2.id, "actorId": manager_sarah.id, "action": "APPROVED", "comment": "Looks good, approved."})
    print(f"Created expense: {exp2.description} (APPROVED)")

    # Expense 3: Carol's rejected expense
    exp3 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_carol.id,
            "amount": 15000.00,
            "currency": "INR",
            "category": "ENTERTAINMENT",
            "description": "VIP concert tickets for client entertainment",
            "expenseDate": (now - timedelta(days=3)),
            "status": "REJECTED",
            "isManagerApprover": True,
            "currentStepOrder": 0,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp3.id, "approverId": manager_john.id, "stepOrder": 0, "stepLabel": "Manager", "isRequired": True, "status": "REJECTED"})
    await db.approvalaction.create(data={"expenseId": exp3.id, "actorId": manager_john.id, "action": "REJECTED", "comment": "Amount too high for entertainment. Please get pre-approval."})
    print(f"Created expense: {exp3.description} (REJECTED)")

    # Expense 4: Alice's another pending expense
    exp4 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_alice.id,
            "amount": 850.00,
            "currency": "INR",
            "category": "SOFTWARE",
            "description": "Annual Figma license renewal",
            "expenseDate": (now - timedelta(days=1)),
            "status": "PENDING",
            "isManagerApprover": False,
            "currentStepOrder": 0,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp4.id, "approverId": manager_john.id, "stepOrder": 0, "stepLabel": "Team Lead", "isRequired": True, "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp4.id, "approverId": mitchell.id, "stepOrder": 1, "stepLabel": "Reviewer", "isRequired": False, "status": "PENDING"})
    await db.approvalstep.create(data={"expenseId": exp4.id, "approverId": manager_sarah.id, "stepOrder": 2, "stepLabel": "Finance", "isRequired": False, "status": "PENDING"})
    print(f"Created expense: {exp4.description} (PENDING, awaiting John)")

    # Expense 5: Bob's in-progress expense
    exp5 = await db.expense.create(
        data={
            "companyId": company.id,
            "submittedById": emp_bob.id,
            "amount": 3200.00,
            "currency": "INR",
            "category": "ACCOMMODATION",
            "description": "Hotel stay for 2 nights - Bangalore trip",
            "expenseDate": (now - timedelta(days=4)),
            "status": "IN_PROGRESS",
            "isManagerApprover": True,
            "currentStepOrder": 1,
        }
    )
    await db.approvalstep.create(data={"expenseId": exp5.id, "approverId": manager_sarah.id, "stepOrder": 0, "stepLabel": "Manager", "isRequired": True, "status": "APPROVED"})
    await db.approvalstep.create(data={"expenseId": exp5.id, "approverId": manager_john.id, "stepOrder": 1, "stepLabel": "Team Lead", "isRequired": True, "status": "AWAITING"})
    await db.approvalstep.create(data={"expenseId": exp5.id, "approverId": mitchell.id, "stepOrder": 2, "stepLabel": "Reviewer", "isRequired": False, "status": "PENDING"})
    await db.approvalaction.create(data={"expenseId": exp5.id, "actorId": manager_sarah.id, "action": "APPROVED", "comment": "Manager approved."})
    print(f"Created expense: {exp5.description} (IN_PROGRESS, step 2)")

    await db.disconnect()

    print("\n✓ Seed complete!")
    print("\nTest accounts (all password: password123):")
    print("  Admin:    admin@acme.com")
    print("  Manager:  john@acme.com / sarah@acme.com / mitchell@acme.com")
    print("  Employee: alice@acme.com / bob@acme.com / carol@acme.com")
    print("\nJohn has 3 pending approvals to review.")


if __name__ == "__main__":
    asyncio.run(main())
