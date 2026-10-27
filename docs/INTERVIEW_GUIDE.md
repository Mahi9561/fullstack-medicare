# Interview guide: the decisions behind MediCare Local

Written for a developer with 4 to 5 years of experience. Each section gives the question you are likely to be asked, a short answer you can say out loud, where it lives in the code, and the follow-ups to be ready for. Where something is a compromise, it says so. Interviewers trust candidates who name their trade-offs.

## 1. How is the backend layered, and why?

**The short answer.** A request passes through middleware, then a controller, a service, a repository, and finally a model. Each layer has one job, so each can be tested and changed on its own.

| Layer | Job | Example |
| --- | --- | --- |
| Routes | Map a URL to middleware plus a controller | `routes/appointment.routes.ts` |
| Middleware | Authenticate, check role, validate input | `authenticateUser`, `authorizeRole('DOCTOR')`, `validate({ body })` |
| Controller | Read the request, call one service method, send the response | `controllers/*.ts`, a few lines each |
| Service | Business rules, ownership checks, transactions | `services/appointment.service.ts` |
| Repository | Every database query, nothing else | `repositories/appointment.repository.ts` |
| Domain | Pure functions with no I/O | `domain/appointmentStatus.ts`, slot generation |

**Why it matters.** The rule "an appointment can go from CONFIRMED to COMPLETED but not from CANCELLED to anything" is a plain function (`canTransition`) with no database. It is unit-tested in milliseconds. If that rule lived inside a controller next to Sequelize calls, you could only test it with a database.

**Follow-up: isn't this over-engineered for a small app?** The cost is a few extra files. The benefit shows up the first time a rule changes: you edit one service, not five route handlers. For a clinic app with clear rules (status machine, slot grid, ownership) the layering pays for itself.

## 2. Why a JWT in an httpOnly cookie instead of localStorage?

**The short answer.** Anything in `localStorage` can be read by any script on the page, so a single cross-site scripting bug leaks every user's token. An httpOnly cookie cannot be read by JavaScript at all.

**How it is done.** On login the server sets a cookie named `access_token` with `httpOnly`, `SameSite=Lax`, `secure` in production, and a lifetime taken from `JWT_EXPIRES_IN` (`auth.controller.ts`). The frontend never touches the token. Axios is created with `withCredentials: true`, and the backend's CORS is configured with one explicit origin plus `credentials: true` (it cannot be `*` when credentials are involved).

**On page load** the app calls `GET /auth/me`. If the cookie is valid it returns the user, and the Redux store is restored. That is how a refresh keeps you signed in without storing anything in the browser.

**The honest trade-off: CSRF.** Cookies are sent automatically, which creates cross-site request forgery risk that `Authorization` headers do not have. Here it is handled by three things together: `SameSite=Lax` (the cookie is not sent on cross-site POST requests), CORS limited to `CLIENT_URL`, and the API only changes data with POST, PUT and PATCH, never GET. For an app where the frontend and API are served from different sites you would add a CSRF token.

**Follow-up: a JWT cannot be revoked, can it?** Not by itself. The middleware reloads the user from the database on every request and rejects the request if the account is no longer ACTIVE (`middleware/authenticate.ts`). So deactivating a doctor takes effect on their very next request, not when the token expires. The cost is one indexed lookup per request.

## 3. Authentication, role authorization, resource authorization

Interviewers like this one because candidates blur the three.

| Question | Answered by | Failure |
| --- | --- | --- |
| Who are you? | `authenticateUser` (valid cookie, active account) | 401 |
| What kind of user are you? | `authorizeRole('DOCTOR')` on the route | 403 |
| Is this record yours? | The service, using the record's owner | 403 |

A role check alone is not enough. Two doctors both pass `authorizeRole('DOCTOR')`, but doctor A must not edit doctor B's consultation. That check is in the service: `consultation.doctor_id !== doctorId` throws 403 (`consultation.service.ts`). Likewise a doctor may open a patient's history only if they have a non-cancelled appointment with that patient (`assertDoctorTreats` in `patient.service.ts`).

The failure to name is **broken object-level authorization**, the top item on the OWASP API list: an endpoint that checks the role but not the owner, so changing `/appointments/12` to `/appointments/13` shows someone else's data. There are tests for this in `tests/integration/authorization.test.ts`.

**Least privilege for the admin.** The admin manages doctors, departments and medications, and can see appointment lists, but cannot read diagnoses, prescriptions or vital signs. A clinic administrator rarely needs clinical data, and the safest data to leak is data nobody could read.

## 4. How do you prevent double booking?

This is the headline feature, so know it cold.

**The short answer.** Three layers, each covering a failure the others cannot. A row lock makes concurrent bookings take turns, an explicit check gives a friendly error, and a unique index in the database makes a double booking impossible even if the code is wrong.

**The flow** (`appointment.service.ts`, `book`), all inside one transaction:

1. Lock the doctor's row with `SELECT ... FOR UPDATE`. Any other booking for the same doctor waits here until this transaction ends.
2. Confirm the requested time is a real slot from the doctor's working hours on the 30-minute grid. Otherwise 400.
3. Ask whether a BOOKED, CONFIRMED or COMPLETED appointment already holds that doctor, date and start time. If so, return **409 `Doctor is already booked for this time slot`**.
4. Insert the appointment.
5. If the insert violates the unique index, translate that error into the same 409.

**The index** (`create-appointments` migration):

```sql
active_slot TINYINT GENERATED ALWAYS AS
  (IF(status IN ('BOOKED','CONFIRMED','COMPLETED'), 1, NULL)) STORED,
UNIQUE KEY uq_doctor_slot (doctor_id, appointment_date, start_time, active_slot)
```

**Why a generated column?** MySQL has no partial unique index ("unique only where status is active"). But a unique index treats every `NULL` as different from every other `NULL`. So an appointment that holds the slot gets `active_slot = 1` and collides with another one. A cancelled or no-show appointment gets `NULL` and never collides. When someone cancels, the status update makes MySQL recompute the column to `NULL`, which frees the slot with no delete and no cleanup job, and the cancelled row stays for history.

**Why three layers and not just the index?** The index alone would be correct, but the user would see a raw database error, and you would have no way to explain why. **Why not just the check?** Two requests can both run the check, both see "free", and both insert. That is a classic time-of-check to time-of-use race. The lock closes it for code that goes through this service, and the index closes it for everything else: a second server instance, a script, a future code path that forgets the lock. The database is the only component that sees every writer, so it gets the final say.

**Why lock the doctor row and not the slot?** The slot row does not exist yet, so there is nothing to lock. The doctor row always exists and is a natural per-doctor mutex. The cost is that two bookings for the same doctor run one after the other, which takes milliseconds. Different doctors do not block each other.

**Follow-up: what isolation level?** No special one. MySQL's default is REPEATABLE READ, and the design does not depend on it: `FOR UPDATE` is a locking read that sees the latest committed data, and the unique index is enforced regardless of isolation level.

**How it is proven.** `tests/integration/appointments.test.ts` sends two simultaneous requests for one slot and expects exactly `[201, 409]`, then five simultaneous requests and expects one 201 and four 409. A separate test inserts a duplicate straight into the table to prove the index works without the application logic. Another proves cancelling frees the slot.

## 5. Why transactions, and what goes inside them?

**The short answer.** Several rows must change together or not at all. Booking writes the appointment, an audit log row, and a notification for the doctor. Saving a consultation writes the consultation, moves the appointment to COMPLETED, writes two audit rows, and notifies the patient.

If those were separate statements, a crash between them could leave a completed appointment with no consultation, or a notification about a booking that rolled back. Using a managed transaction (`sequelize.transaction(async t => { ... })`) means any thrown error rolls everything back, and the transaction object `t` is passed down into every repository call.

**A subtle point worth saying.** Notifications are created inside the transaction on purpose. A notification that exists must describe an event that really happened, and an event that happened must not lose its notification.

## 6. Why migrations instead of `sequelize.sync()`?

`sync()` creates tables from model definitions. It is fine for a throwaway demo and wrong for anything else:

- It has no history, so you cannot move a database from version 3 to version 4.
- `sync({ alter: true })` can drop data when it guesses wrong.
- It cannot express everything this schema needs: the `CHECK` constraints, the generated `active_slot` column, and the unique index on it.

Migrations here are plain JavaScript files containing raw DDL, so the SQL you review is the SQL that runs. `npm run db:reset` replays all of them, which also proves the whole chain works from empty. The models describe the tables for queries only.

## 7. Pagination and includes: the LIMIT trap

**The trap.** If you paginate a query that joins a one-to-many relation, the database applies `LIMIT 10` to the joined rows, not to the parents. A prescription with four items would consume four of your ten rows, and pages would show fewer prescriptions than asked for, sometimes cutting one in half.

**The fix** (`prescription.repository.ts`): load the child rows with `separate: true`, which runs them as a second query keyed by the parent ids. `LIMIT` then counts prescriptions, and `findAndCountAll` reports a correct total.

**Other pagination rules.** `limit` has a hard maximum of 50, so nobody can ask for a million rows. Every list returns `meta` with `page`, `limit`, `total` and `totalPages`. The frontend's `Pagination` component renders nothing when there is only one page.

## 8. Validation: why Zod, and why on both sides?

The server is the authority. Every route runs `validate({ body, query, params })`, which parses the input with a Zod schema and **replaces** the raw value with the parsed result. So services receive clean, typed data: strings trimmed, numbers coerced from query strings, blank optional text turned into `null` (`nullableText`). Keys the schema does not list are dropped, which also blocks mass assignment: a registration body containing `"role": "ADMIN"` loses that field before it reaches any code. A single `z.infer` gives the TypeScript type, so the schema and the type cannot drift apart.

The browser repeats the important rules with React Hook Form and a Zod resolver, purely for speed: the user sees "Use at least 8 characters" before any request. If the two ever disagree, the server wins. The server also returns errors as `errors: [{ field, message }]`, and the forms map those back onto the right inputs, so a rule that only the server knows (for example, the diastolic value must be below the systolic) still lands next to the field that caused it.

## 9. One place where errors become responses

Services throw typed errors (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`). One error-handling middleware at the end of the chain turns them into the response envelope. It also maps a Zod error to 400, a Sequelize unique-constraint error to 409, and anything unexpected to a generic 500 that does not leak internals. An `asyncHandler` wrapper forwards rejected promises to it, which Express 4 does not do on its own.

The payoff: no controller has a `try/catch`, status codes are consistent across the API, and the frontend can rely on one error shape.

## 10. Where the schema is deliberately denormalized

`consultations` and `vital_signs` carry `patient_id` and `doctor_id` even though both can be reached through `appointment_id`. The reason is the most common queries: "all consultations for this patient" and "all consultations by this doctor" become a single indexed lookup instead of a join, and the ownership checks above are a plain column comparison. The risk is the values disagreeing with the appointment. That is controlled by writing them only in the service, copied from the appointment row, inside the same transaction.

Notifications store the finished `message` text rather than rebuilding it from the current names on read, so an old notification keeps saying what was true at the time.

## 11. Testing concurrency, and why real MySQL

A mocked database cannot test "two requests arrive at once", because a mock has no locks and no unique index. The race that matters is a property of MySQL, so those tests run against a real MySQL database, `medicare_local_test`, which the Jest global setup creates and migrates. Tests run one file at a time (`--runInBand`) because they share it.

Pure logic (date and time helpers, slot generation, the status machine) is tested without any database, which is why those tests run anywhere and in milliseconds. The split is deliberate: unit tests for rules, integration tests for anything that depends on the database or on the full HTTP stack.

## 12. Notifications: polling or WebSockets?

The bell asks for the unread count every 30 seconds. That is plain HTTP, works with the cookie as is, needs no extra infrastructure and no connection state on the server, and is trivial to debug. The cost is up to 30 seconds of delay and a steady trickle of small requests.

For one clinic that is the right size. The answer changes when you need instant delivery or have thousands of simultaneous users: then use Server-Sent Events (one-way, simpler than WebSockets, enough for notifications) or WebSockets. Saying "I chose the simplest thing that meets the requirement, and here is the trigger for upgrading" is a strong answer.

## 13. Frontend decisions

**State.** Redux Toolkit holds what many screens share: the session (user and profile), the appointment list, the doctor search with its filters, and notifications. Data a single page needs once (a dashboard, a history list) lives in a small `useAsync` hook with local state. Putting everything in Redux would add ceremony without benefit.

**One wrapper for API calls.** `createApiThunk` turns an API function into a thunk whose failures become a plain `{ message, status, fieldErrors }` object, so reducers and components deal with one error shape.

**Expired sessions.** The Axios response interceptor calls a handler on a 401, except for the auth endpoints themselves (a wrong password at login is a 401 too, and is not an expired session). The store registers that handler at startup (`setUnauthorizedHandler` in `store.ts`) rather than the API client importing the store, which would be a circular import.

**Route protection.** `ProtectedRoute` waits for the session check (so a refresh does not flash the login page), then redirects anonymous visitors to `/login` and remembers where they were going. `RoleRoute` sends a signed-in user of the wrong role to `/403`. Remember these only improve the experience: the real protection is on the API, because anyone can edit client code.

**Accessibility.** Slots are a radio group with `aria-checked`, form fields have real labels and error messages, status and error areas use live regions or `role="alert"`, and nothing relies on color alone (every status badge has text).

## 14. Smaller decisions that come up

- **snake_case everywhere.** Model attributes equal column names, and the API returns snake_case, so there is no mapping layer to get wrong. The one exception is `meta.totalPages`.
- **`INT UNSIGNED` keys.** Auto-increment ids never go negative, which doubles the range at no cost.
- **Audit log.** Sensitive actions (register, login, logout, status changes, profile edits, completing visits) write a row with who, what, and which entity. Changes to data write it in the same transaction as the change, so the log cannot claim something that rolled back. Login and logout change nothing, so they are logged on their own.
- **Soft state, not deletes.** Doctors, departments and medications are deactivated, never deleted, so old prescriptions and appointments keep pointing at something real.
- **Rate limiting.** 1000 requests per 15 minutes per IP overall, and 30 on login and register to slow password guessing. Disabled under test.
- **Passwords.** bcrypt. Passwords are capped at 72 characters because bcrypt silently ignores anything after 72 bytes, and a validation error is better than a silent truncation.
- **Local time.** Appointment dates and times are stored as plain `DATE` and `TIME` in the clinic's local time, with no time zone conversion, because a clinic appointment is "10:00 at the clinic", not an instant.

## 15. What I would improve next (say this at the end)

1. **Revocation and refresh.** Short-lived access tokens plus a refresh token, so a stolen cookie has a small window. Today the 1-day lifetime plus the active-account check is the whole story.
2. **A booking horizon on the server.** The UI limits dates to 60 days ahead, but the API accepts any future date that has availability. The rule belongs in the service.
3. **A cancellation window.** Today a patient can cancel up to the start time.
4. **Medication search.** The prescription form loads up to 50 active medicines into a dropdown. A searchable picker backed by the API's `search` parameter scales better.
5. **End-to-end tests.** Playwright running the manual test script in the README against a seeded database. Unit and integration tests cover the rules, but not the browser flow.
6. **Server-sent events** for notifications, if instant delivery ever matters.
7. **Make `totalPages` snake_case** for consistency (backend, frontend and tests change together).

## 16. Rapid-fire answers

| Question | Answer |
| --- | --- |
| Why Zod and not Joi? | One schema gives both validation and the TypeScript type. |
| Why a repository layer on top of an ORM? | Queries live in one place, services stay readable, and swapping or mocking data access touches one folder. |
| Why not GraphQL? | The screens map to a fixed set of role-scoped resources. REST with clear permissions is simpler to secure and test. |
| What happens if two doctors edit availability at once? | They edit their own schedules only, and the endpoint replaces the whole schedule in one transaction. |
| How do you stop a patient booking a time in the past? | The service rejects it with 400, and the slot list already excludes past times. |
| What is the single most important test? | Five simultaneous bookings of one slot: one 201, four 409. |
| What did you leave out on purpose? | Docker, cloud services, email or SMS, payments, microservices. The brief was a local-only app, and each would add moving parts without helping the problem. |
