# MediCare Local

A clinic management app that runs entirely on your own machine: patients find doctors and book appointments, doctors run consultations and issue prescriptions, and an administrator manages the clinic. All data is dummy data. There is no Docker, cloud service, SMS or payment integration.

| Part | Stack | Port |
| --- | --- | --- |
| Frontend | React 18, TypeScript, Vite, React Router, Redux Toolkit, Axios, React Hook Form + Zod, Tailwind CSS 4 | 3000 |
| Backend | Node, Express, TypeScript, Sequelize, JWT (httpOnly cookie), bcrypt, Zod | 5000 |
| Database | MySQL 8.0.16 or newer | 3306 |

## Status of this codebase (read this first)

This project was written in a sandbox with no network access and no MySQL server, so it has **never been installed or run end to end**. What was checked there:

- The 23 pure backend unit tests and the 11 pure frontend format tests were executed and pass.
- Both apps were type-checked with `tsc` against real `zod` types and hand-written stubs for the other libraries. That found and fixed one real bug. The remaining output was stub noise only.
- Every frontend service path was cross-checked against the backend route list.

What has **not** been run: `npm install`, the backend integration tests (about 100, they need MySQL), the frontend component tests, and `vite build`. On your machine, run this in both `backend/` and `frontend/` before anything else, and fix whatever it reports:

```bash
npm install && npm run typecheck && npm test
```

Expect a small number of first-run fixes (a typing mismatch against the real library types, a flaky assertion). They are normal for code that has not met its real dependencies yet.

## Setup

You need Node 18.18 or newer, npm, and a running MySQL 8.0.16+ server. MySQL 8.0.16 is the minimum because the schema uses `CHECK` constraints and a generated column.

### 1. Backend

```bash
cd backend
cp .env.example .env          # Windows: copy .env.example .env
# edit .env: set DB_USER and DB_PASSWORD for your MySQL
npm install
npm run db:create             # creates the medicare_local database
npm run db:migrate            # creates the 15 tables
npm run db:seed               # loads demo users, doctors, departments, medications
npm run dev                   # API on http://localhost:5000
```

Check it: open `http://localhost:5000/api/health`. You should see `{"success":true,...}`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # Windows: copy .env.example .env
npm install
npm run dev                   # app on http://localhost:3000
```

Open `http://localhost:3000` (use `localhost`, not `127.0.0.1`, see the cookie note under Common errors).

### Environment variables

| File | Variable | Default | Meaning |
| --- | --- | --- | --- |
| backend/.env | `PORT` | 5000 | API port |
| backend/.env | `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | 127.0.0.1, 3306, medicare_local, root, empty | MySQL connection |
| backend/.env | `DB_NAME_TEST` | medicare_local_test | Database used by `npm test` |
| backend/.env | `JWT_SECRET` | placeholder | Any string of 16+ characters |
| backend/.env | `JWT_EXPIRES_IN` | 1d | Session length |
| backend/.env | `CLIENT_URL` | http://localhost:3000 | The one origin allowed by CORS and cookies |
| frontend/.env | `VITE_API_URL` | http://localhost:5000/api | Where the API lives |

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@medicare.local | Admin@123 |
| Doctors (8) | doctor1@medicare.local to doctor8@medicare.local | Doctor@123 |
| Patients (5) | patient1@medicare.local to patient5@medicare.local | Patient@123 |

The login page also has a "Demo accounts" panel that fills the form for you.

## Commands

| Where | Command | What it does |
| --- | --- | --- |
| backend | `npm run dev` | API with auto-restart |
| backend | `npm run typecheck` | TypeScript check, no output files |
| backend | `npm test` | Unit and integration tests (needs MySQL) |
| backend | `npm run db:reset` | Undo all migrations, migrate again, re-seed |
| backend | `npm run build` then `npm start` | Compile and run the compiled server |
| frontend | `npm run dev` | Vite dev server |
| frontend | `npm run typecheck` | TypeScript check |
| frontend | `npm test` | Vitest, runs once |
| frontend | `npm run build` | Type-check, then production bundle in `dist/` |

### How the backend tests work

`npm test` uses a **real MySQL database** called `medicare_local_test` (from `DB_NAME_TEST`). A Jest global setup creates it if missing and runs the migrations. Your development database is never touched. Tests run one file at a time (`--runInBand`) because they share that database. Your MySQL user needs the `CREATE` privilege for the first run.

The tests use real MySQL on purpose. The most important rule in the app, that two people cannot book the same doctor and time, is enforced by a database index, and a mock database cannot prove that.

## Project layout

```
medicare-local/
  backend/
    migrations/        15 plain-SQL migrations (no sync())
    seeders/           7 seed files
    src/
      config/          env validation, constants, database
      models/          15 Sequelize models + associations
      repositories/    all queries live here
      services/        business rules and transactions
      controllers/     thin HTTP handlers
      routes/          URL -> middleware -> controller
      validators/      Zod schemas for request bodies and queries
      middleware/      authenticate, authorize, validate, rate limit, errors
      domain/          pure logic: slot generation, status rules
    tests/             setup/, helpers/, unit/, integration/
  frontend/
    src/
      pages/           28 pages + 2 error pages, grouped by role
      features/        Redux slices and role-specific forms
      components/      ui/ (building blocks) and common/ (shared pieces)
      services/        Axios client + one file per API area
      store/, routes/, layouts/, hooks/, utils/, types/
  docs/
    API.md             every endpoint
    INTERVIEW_GUIDE.md the design decisions, explained
```

## Manual test script

Do these in order. Each step says what you should see.

| # | Do this | Expected result |
| --- | --- | --- |
| 1 | Open `/register`. Submit empty. | Inline errors under each required field. Nothing is sent. |
| 2 | Register a new patient with a 7-character password. | "Use at least 8 characters". Use `Secret123` instead and it succeeds, then you land on the login page with "Your account is ready". |
| 3 | Try registering again with the same email. | An error on the email field saying it is already registered. |
| 4 | Sign in with your new email and a wrong password. | Red banner "Invalid email or password". You stay on the login page. |
| 5 | Sign in correctly. | You land on the patient dashboard. Reload the page: you are still signed in. |
| 6 | While signed in as a patient, type `/doctor/dashboard` in the address bar. | You are sent to the 403 page. |
| 7 | Open "Find a doctor". Type `Rao`, then pick a specialty. | The list narrows as you type (after a short pause). "N doctors found" updates. |
| 8 | Click Book on a doctor. Pick a future weekday. | Free 30-minute slots appear. Past times and weekends the doctor does not work are absent. |
| 9 | Choose a slot, continue, enter a reason, confirm. | "Appointment booked". It shows under Upcoming as Booked. |
| 10 | **Double booking.** Open a second browser profile (or a private window), sign in as `patient2@medicare.local`, open the same doctor and date, and keep the slot list open. In the first window book 10:00. In the second window pick the same 10:00 and confirm. | The second window shows "Doctor is already booked for this time slot", returns to the slot step, and 10:00 is gone from the list. |
| 11 | As the first patient, cancel that appointment. | It moves to History as Cancelled. In the second window the slot is free again. |
| 12 | Sign in as `doctor1@medicare.local`. Open Appointments, Confirm a booked one. | Status becomes Confirmed. The patient's bell shows a new notification within 30 seconds. |
| 13 | Open the confirmed appointment. Save vital signs, then write symptoms and diagnosis and save. | "Consultation saved. The appointment is now completed." The status badge turns to Completed. |
| 14 | On the same page, add a medicine, dosage, frequency and days, and issue the prescription. | The prescription card appears. The patient sees it under Prescriptions. |
| 15 | Sign in as `admin@medicare.local`. Doctors, Add a doctor. | New doctor appears in the list. That doctor can sign in with the temporary password. |
| 16 | Admin: Reports, choose Last 30 days. | Totals, status bars, per-day bars and a by-doctor table. |
| 17 | Admin: try to open `/doctor/appointments`. | 403 page. Admins see operational data only, never diagnoses. |

### Checking the double-booking rule without a browser

```bash
# log in as two patients, keeping each session cookie in its own file
curl -s -c p1.txt -H 'Content-Type: application/json' \
  -d '{"email":"patient1@medicare.local","password":"Patient@123"}' http://localhost:5000/api/auth/login
curl -s -c p2.txt -H 'Content-Type: application/json' \
  -d '{"email":"patient2@medicare.local","password":"Patient@123"}' http://localhost:5000/api/auth/login

# find a free slot for doctor id 1 (pick a future weekday)
curl -s -b p1.txt 'http://localhost:5000/api/doctors/1/slots?date=2026-10-12'

# book it as patient 1 (201), then as patient 2 (409)
BODY='{"doctor_id":1,"appointment_date":"2026-10-12","start_time":"10:00","reason":"Checkup"}'
curl -s -i -b p1.txt -H 'Content-Type: application/json' -d "$BODY" http://localhost:5000/api/appointments
curl -s -i -b p2.txt -H 'Content-Type: application/json' -d "$BODY" http://localhost:5000/api/appointments
```

The second call returns HTTP 409 with `{"success":false,"message":"Doctor is already booked for this time slot"}`.

## Common errors

| Symptom | Cause and fix |
| --- | --- |
| `ER_ACCESS_DENIED_ERROR` or cannot connect to MySQL | MySQL is not running, or `DB_USER` / `DB_PASSWORD` in `backend/.env` are wrong. |
| `Unknown database 'medicare_local'` | Run `npm run db:create` in `backend/`. |
| `Table '...' doesn't exist` | Run `npm run db:migrate`. |
| SQL syntax error mentioning `CHECK` or `GENERATED` | MySQL is older than 8.0.16 (or an old MariaDB). Upgrade to MySQL 8. |
| Seeder fails with `Duplicate entry` | Seeds were already applied. Run `npm run db:reset` for a clean start. |
| Port 5000 already in use (common on macOS: AirPlay Receiver) | Set `PORT=5001` in `backend/.env` and `VITE_API_URL=http://localhost:5001/api` in `frontend/.env`, then restart both. |
| Port 3000 already in use | Vite is set to fail rather than pick another port, because `CLIENT_URL` must match. Stop the other process. |
| Login succeeds but every later request is 401 | The session cookie is not being sent. Open the app at exactly `http://localhost:3000`, and make sure `CLIENT_URL` in `backend/.env` is that same origin. `127.0.0.1` is a different origin from `localhost`. |
| CORS error in the browser console | Same cause: `CLIENT_URL` does not match the address in the browser bar. |
| `npm install` fails building `bcrypt` | It is a native module. Use a current Node LTS (prebuilt binaries are then downloaded), or install your platform's build tools (Xcode command line tools, `build-essential`, or Windows build tools). |
| "Too many requests" on login | Login and register allow 30 attempts per 15 minutes per IP. Wait, or restart the backend. |
| `npm test` fails creating the test database | The MySQL user needs the `CREATE` privilege. Create `medicare_local_test` yourself and re-run. |
| Fonts look different offline | The page loads two Google Fonts. Offline it falls back to system fonts. Nothing else is affected. |

## What was built, phase by phase

| Phase | Delivered | Where to look |
| --- | --- | --- |
| 1. Setup | Two apps, env validation, Express app with security headers, CORS, rate limits and a single error handler; Vite + Tailwind app | `backend/src/app.ts`, `config/env.ts`, `frontend/vite.config.ts` |
| 2. Database | 15 tables as raw-SQL migrations, 15 models, associations, seeders | `backend/migrations`, `models/index.ts` |
| 3. Auth | Register (patient only), login, logout, `me`; JWT in an httpOnly cookie; role checks; session bootstrap and route guards in the UI | `auth.service.ts`, `middleware/authenticate.ts`, `routes/` |
| 4. Doctor | Search and filter, profile, weekly availability, computed free slots, dashboard | `doctor.service.ts`, `domain/availability.ts` |
| 5. Appointments | Booking with three layers of double-booking protection, and the confirm / cancel / complete / no-show lifecycle | `appointment.service.ts`, migration `...create-appointments.js` |
| 6. Patient | Profile, dashboard, own appointments, consultations, prescriptions, medical records | `patient.service.ts`, `pages/patient/` |
| 7. Consultation | Vital signs, consultation create and edit; saving completes the appointment in one transaction | `consultation.service.ts`, `AppointmentWorkspace.tsx` |
| 8. Prescriptions | Prescriptions with line items from the medication list | `prescription.service.ts`, `PrescriptionBuilder.tsx` |
| 9. Admin | Create and edit doctors, activate or deactivate, departments, medications, reports, audit log | `admin.service.ts`, `pages/admin/` |
| 10. Notifications | In-app notifications written in the same transaction as the event; bell polls every 30 seconds | `notification.service.ts`, `NotificationBell.tsx` |
| 11. Testing | Backend unit and integration tests on real MySQL (including parallel double-booking); frontend Vitest suites | `backend/tests`, `frontend/src/**/*.test.ts(x)` |
| 12. Polish | Consistent validation messages, loading / empty / error states, keyboard and screen reader support, one design system | `components/`, `index.css` |

## Where to read next

- `docs/API.md` lists every endpoint, who may call it, and what it returns.
- `docs/INTERVIEW_GUIDE.md` explains the design decisions in the way you would explain them in a technical interview.
