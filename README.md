# ReimburseFlow

A multi-tenant expense reimbursement platform with configurable multi-level approval workflows, OCR receipt scanning, and currency conversion.

## Tech Stack

- **Frontend:** React 18 + Vite + TailwindCSS v4 + React Router v6
- **Backend:** Python FastAPI
- **Database:** PostgreSQL
- **ORM:** Prisma (prisma-client-py)
- **Auth:** JWT (access + refresh tokens)

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/akkki007/reimbursement-management-odoo.git
cd reimbursement-management-odoo
```

### 2. Database

Create a PostgreSQL database:

```bash
createdb reimburse_db
```

### 3. Backend

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your database credentials and secrets

# Generate Prisma client and run migrations
prisma generate
prisma db push

# Start the server
uvicorn app.main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API requests to the backend at `http://localhost:8000`.

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/reimburse_db
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
MINDEE_API_KEY=your-mindee-api-key
FRONTEND_URL=http://localhost:5173
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000/api
```

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point
│   │   ├── config.py            # Settings from env vars
│   │   ├── dependencies.py      # DB connection
│   │   ├── routers/             # API route handlers
│   │   ├── services/            # Business logic
│   │   ├── schemas/             # Pydantic request/response models
│   │   ├── models/              # Shared enums
│   │   └── middleware/          # Auth & role middleware
│   └── prisma/
│       └── schema.prisma        # Database schema
├── frontend/
│   └── src/
│       ├── api/                 # Axios client with JWT interceptor
│       ├── context/             # Auth context
│       ├── components/          # Shared UI components
│       ├── pages/               # Route pages
│       └── utils/               # Helpers
└── README.md
```

## Features

- Company signup with automatic currency detection from country
- JWT authentication with refresh token rotation
- Role-based access (Admin / Manager / Employee)
- Multi-level configurable approval workflows
- OCR receipt scanning via Mindee API
- Automatic currency conversion for cross-currency expenses
- Admin dashboard for user, rule, and company management
