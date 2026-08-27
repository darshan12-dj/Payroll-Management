# PayrollPro — Payroll Management System

A full-stack payroll management system built with **React (Vite + Tailwind CSS)** on the frontend and **Node.js / Express / MongoDB (Mongoose)** on the backend, with JWT authentication, role-based access control, real payroll calculations, PDF payslip generation, and exportable reports.

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Recharts, Lucide Icons, react-hot-toast, axios |
| Backend | Node.js, Express.js, REST API |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt password hashing, role-based middleware |
| PDF | pdfkit (payslips), pdfkit/ExcelJS (report exports) |

## 2. Project Structure

```
payroll-management/
├── client/                 React (Vite) frontend
│   └── src/
│       ├── components/     Reusable UI + feature components
│       ├── pages/          Route-level pages
│       ├── layouts/        Sidebar / Topbar / DashboardLayout
│       ├── context/        AuthContext
│       ├── services/       axios API clients (one file per resource)
│       ├── hooks/          useDebounce, etc.
│       └── utils/          Formatters
├── server/                 Express backend
│   ├── config/             DB connection, shared constants
│   ├── models/             Mongoose schemas
│   ├── controllers/        Route handlers
│   ├── routes/             Express routers
│   ├── middleware/         auth, RBAC, error handling, uploads, validation
│   ├── services/           payrollCalculator, pdfService, exportService, attendanceService
│   ├── seed/                Demo data seed script
│   └── uploads/             Uploaded profile photos + generated payslip PDFs
├── .env.example
└── README.md
```

## 3. Prerequisites

- **Node.js** 18+ and npm
- **MongoDB** 6+, either:
  - running locally (`mongod` on `mongodb://127.0.0.1:27017`), or
  - a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (get a connection string)

## 4. Setup

```bash
# 1. Install all dependencies (root, server, client)
npm run install:all

# 2. Configure environment variables
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit server/.env and set MONGO_URI to your MongoDB instance (see below),
# and set JWT_SECRET / JWT_RESET_SECRET to long random strings.

# 3. Make sure MongoDB is running
#    Local install:   mongod --dbpath /path/to/data
#    Atlas:           just make sure MONGO_URI in server/.env points to your cluster

# 4. Seed the database with realistic demo data
npm run seed

# 5. Run both the API and the frontend together
npm run dev
```

The frontend runs at **http://localhost:5173** and the API at **http://localhost:5000/api**.

Working `.env` files with sane local defaults are already included in this project so `npm run dev` works immediately against a local MongoDB — **rotate `JWT_SECRET` / `JWT_RESET_SECRET` before deploying anywhere real.**

### Running client/server separately

```bash
npm run server   # starts the Express API only (nodemon, port 5000)
npm run client   # starts the Vite dev server only (port 5173)
```

## 5. Demo Login Credentials

After running `npm run seed`, these accounts are ready to use:

| Role | Email | Password |
|---|---|---|
| Admin / HR | `admin@northbridge-tech.com` | `Admin@12345` |
| Payroll Manager | `payroll.manager@northbridge-tech.com` | `Payroll@12345` |
| Employee | `employee@northbridge-tech.com` | `Employee@12345` |

The login page also has one-click buttons that fill these in for you.

Seeded data includes: 7 departments, 24 employees with realistic profiles and salary structures, ~2 months of daily attendance history, a mix of pending/approved/rejected leave requests, 3 months of processed/paid payroll runs, real generated payslip PDFs for every payroll record, and starter notifications.

## 6. Key Functionality

- **Auth**: JWT login, forgot/reset password flow (reset link is returned in the API response and logged to the server console since no email provider is wired up — see "Where to plug in a real email service" below), change password, protected + role-based routes, session persistence via localStorage + `/auth/me`.
- **Employees**: full CRUD, profile photo upload, search/filter/sort/pagination, deactivate (soft delete) or hard delete, detailed profile with tabs (personal, employment, salary, attendance, payroll history).
- **Departments**: CRUD, department head assignment, live employee counts.
- **Attendance**: daily marking (Present/Absent/Half Day/Leave/Late + overtime hours), monthly calendar view, stats cards, employees can view their own history only.
- **Leave**: apply/approve/reject workflow, leave types (Casual/Sick/Earned/Unpaid), status tracking.
- **Salary Structure**: per-employee earnings & deductions configuration with a live, server-calculated preview (the frontend never computes payroll math itself).
- **Payroll Processing**: month/year/department selection, automatic calculation from attendance + salary structure, preview table before processing, duplicate-processing prevention (unique DB index + explicit check), Draft/Pending/Processed/Paid statuses.
- **Payslips**: professional PDF generation (company header, employee + bank info, earnings/deductions breakdown, net pay), in-app preview, download, print.
- **Reports**: Payroll / Attendance / Salary / Deduction reports, exportable as CSV, Excel (.xlsx), and PDF.
- **Notifications**: in-app notification center + topbar dropdown for payroll processed, payslip generated, leave approved/rejected, new employee added, etc.
- **Global Search**: debounced search across employees, departments, payroll records, and payslips.
- **Settings**: company profile, payroll configuration (working days, overtime rate, pay cycle), personal account settings (name, photo, password).

## 7. Role Permissions

| Feature | Admin | Payroll Manager | Employee |
|---|:---:|:---:|:---:|
| Manage employees (create/edit/deactivate) | ✅ | view only | own profile only |
| Manage departments | ✅ | — | — |
| Mark attendance | ✅ | ✅ | view own only |
| Apply / approve leave | apply + approve | apply + approve | apply only |
| Configure salary structures | ✅ | view only | own (view only) |
| Process payroll | ✅ | ✅ | — |
| View/generate payslips | ✅ | ✅ | own only, view/download |
| Reports | ✅ | ✅ | — |
| Manage users | ✅ | — | — |

The API enforces every one of these boundaries server-side (see `server/middleware/auth.js`'s `authorize()` and `restrictEmployeeSelf()`), not just in the UI.

## 8. Where to plug in a real email service

Password-reset emails and any other transactional email are currently surfaced directly in the API response / server console (clearly marked "local development mode" in the UI) so the whole flow is testable without external dependencies. To wire up real email delivery in production, drop a provider call (SendGrid, AWS SES, Postmark, etc.) into `server/controllers/authController.js`'s `forgotPassword` function where the `resetUrl` is generated. Likewise, a company logo upload can be pointed at S3/Cloudinary/etc.; the `Settings` model already has a `logo` URL field ready to receive it.

## 9. Verification performed in this environment

This project was built and verified in a sandboxed cloud environment without outbound access to MongoDB's download servers (so a local `mongod` could not be installed here to run a full live database). What was verified directly:

- The full frontend (`npm run build`) compiles cleanly with no errors.
- The Express server boots successfully and its health check responds correctly (`GET /api/health`).
- Every backend JavaScript file passes a Node.js syntax check.
- The payroll calculation engine (`server/services/payrollCalculator.js`) has unit tests (`server/services/__tests__/payrollCalculator.test.js`, runnable with `node services/__tests__/payrollCalculator.test.js`) verifying gross/deduction/net math and attendance proration — all passing.
- With no reachable database, DB-backed API routes correctly return a clean JSON error instead of crashing the process, confirming the error-handling middleware degrades gracefully.

**On your machine with a real MongoDB connection**, `npm run seed` followed by `npm run dev` will give you the fully working application end-to-end — please run through the demo accounts above to confirm before relying on it for anything important, and let me know if anything doesn't behave as expected so it can be fixed.
