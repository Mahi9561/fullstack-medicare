# API reference

Base URL: `http://localhost:5000/api`. All bodies are JSON. Field names are snake_case.

## Conventions

**Authentication.** `POST /auth/login` sets an `access_token` cookie (httpOnly, SameSite=Lax). The browser sends it automatically; the frontend never sees the token. There is no `Authorization` header. When calling from a script, keep the cookie (`curl -c` and `-b`).

**Success envelope.**

```json
{ "success": true, "message": "Success", "data": { } }
```

Paginated lists return the items as `data` and add a `meta` object:

```json
{ "success": true, "message": "Success", "data": [ ], "meta": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 } }
```

`totalPages` is the one camelCase key in the API. The frontend, the backend and the tests all agree on it.

**Error envelope.**

```json
{ "success": false, "message": "Validation failed", "errors": [ { "field": "email", "message": "Enter a valid email address" } ] }
```

`errors` is present for validation failures only. Nested fields use dotted paths such as `items.0.dosage`.

**Status codes.**

| Code | Meaning |
| --- | --- |
| 200, 201 | Success, created |
| 400 | Validation failed, or the request breaks a rule (for example booking a time in the past, or a time that is not a real slot) |
| 401 | No valid session cookie, a deactivated account, or wrong email or password at login |
| 403 | Signed in, but your role may not call this endpoint, or the record belongs to someone else |
| 404 | The record does not exist (or, for booking, the doctor is missing or inactive) |
| 409 | Conflict: double booking, duplicate email, illegal status change |
| 429 | Too many requests (login and register: 30 per 15 minutes per IP) |

**Pagination query.** Every list accepts `page` (default 1) and `limit` (default 10, **maximum 50**). A larger `limit` is a 400.

**Dates and times.** Dates are `YYYY-MM-DD`, times are `HH:mm` (24-hour), both in the clinic's local time. Slots are 30 minutes long.

**Appointment statuses.** `BOOKED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`. Legal moves:

| From | To |
| --- | --- |
| BOOKED | CONFIRMED, CANCELLED, NO_SHOW |
| CONFIRMED | COMPLETED, CANCELLED, NO_SHOW |
| COMPLETED, CANCELLED, NO_SHOW | (final) |

Any other move is a 409. `BOOKED`, `CONFIRMED` and `COMPLETED` hold the doctor's slot. `CANCELLED` and `NO_SHOW` release it.

## Health

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | public | Liveness check |

## Auth

| Method | Path | Who | Body or notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | public | `email`, `password` (8 to 72 chars, a letter and a number), `first_name`, `last_name`, `date_of_birth`, `gender` (`MALE`, `FEMALE`, `OTHER`), `phone`, optional `address`, `emergency_contact`. Creates a **PATIENT** only. Returns 201 with `{ user, profile }` and does not sign in. Duplicate email is 409. |
| POST | `/auth/login` | public | `email`, `password`. Sets the cookie. Returns `{ user, profile }`. A deactivated account cannot sign in. |
| POST | `/auth/logout` | any signed-in | Clears the cookie. |
| GET | `/auth/me` | any signed-in | Returns `{ user, profile }`. The frontend calls it on page load to restore the session. |

Doctors are created by an admin. The admin account is seeded.

## Doctors

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| GET | `/doctors` | PATIENT | Search active doctors. Query: `search` (name), `specialization`, `page`, `limit`. |
| GET | `/doctors/:id` | PATIENT | One doctor with departments. |
| GET | `/doctors/:id/availability` | PATIENT, DOCTOR | Weekly working windows. |
| GET | `/doctors/:id/slots?date=YYYY-MM-DD` | PATIENT | Free 30-minute slots that day: the doctor's windows, minus slots held by BOOKED, CONFIRMED or COMPLETED appointments, minus times already past. Returns `{ date, slots: [{ start_time, end_time }] }`. |
| GET | `/doctors/profile` | DOCTOR | Own profile. |
| PUT | `/doctors/profile` | DOCTOR | `first_name`, `last_name`, `specialization`, `qualification`, `experience_years` (0 to 80), `consultation_fee` (0 to 1,000,000), `bio` (nullable). |
| PUT | `/doctors/availability` | DOCTOR | `{ windows: [{ day_of_week, start_time, end_time }] }`. **Replaces** the whole schedule. Maximum 28 windows. End must be after start. |
| GET | `/doctors/dashboard` | DOCTOR | Counts plus today's schedule. |
| GET | `/doctors/patients` | DOCTOR | Patients with a non-cancelled appointment with this doctor. Query: `search`, `page`, `limit`. |

## Appointments

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/appointments` | PATIENT | Book. Body: `doctor_id`, `appointment_date`, `start_time`, `reason` (1 to 500 chars). 201 on success. 400 if in the past or not a real slot, 404 if the doctor is missing or inactive, **409 `Doctor is already booked for this time slot`** if taken. |
| GET | `/appointments` | PATIENT, DOCTOR | Own appointments only (a patient sees theirs, a doctor sees theirs). Query: `scope` (`upcoming` or `history`), `status`, `date`, `page`, `limit`. |
| GET | `/appointments/:id` | PATIENT, DOCTOR | Detail with patient, doctor, consultation stub and vital signs. Only if it is yours. |
| PATCH | `/appointments/:id/confirm` | DOCTOR | BOOKED to CONFIRMED. Notifies the patient. |
| PATCH | `/appointments/:id/cancel` | PATIENT, DOCTOR | Body: optional `reason`. Frees the slot. Notifies the other party. |
| PATCH | `/appointments/:id/complete` | DOCTOR | CONFIRMED to COMPLETED without a consultation. Normally saving a consultation does this for you. |
| PATCH | `/appointments/:id/no-show` | DOCTOR | Only after the start time has passed. |
| PUT | `/appointments/:id/vital-signs` | DOCTOR | Create or replace. Fields (all optional, but at least one): `bp_systolic`, `bp_diastolic` (give both or neither, diastolic below systolic), `heart_rate`, `temperature_f`, `weight_kg`, `height_cm`, `spo2`. Out-of-range values are 400. |
| GET | `/appointments/:id/vital-signs` | PATIENT, DOCTOR | Read them. |

How double booking is prevented is explained in `INTERVIEW_GUIDE.md`. The API contract is simply: of any number of simultaneous requests for one slot, exactly one gets 201 and the rest get 409.

## Patients

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| GET | `/patients/profile` | PATIENT | Own profile. |
| PUT | `/patients/profile` | PATIENT | `first_name`, `last_name`, `date_of_birth`, `gender`, `phone`, `address`, `emergency_contact`. |
| GET | `/patients/dashboard` | PATIENT | Next appointment, counts, recent consultations and prescriptions. |
| GET | `/patients/appointments` | PATIENT | Same as `GET /appointments` for a patient. |
| GET | `/patients/consultations` | PATIENT | Own consultations, paginated. |
| GET | `/patients/prescriptions` | PATIENT | Own prescriptions with items, paginated. |
| GET | `/patients/medical-records` | PATIENT | Own medical records, paginated. |
| GET | `/patients/:id` | DOCTOR, ADMIN | Basic profile. A doctor needs a non-cancelled appointment with that patient. |
| GET | `/patients/:id/history` | DOCTOR | `{ patient, consultations, prescriptions, vital_signs, medical_records }`. Same relationship rule. An admin cannot read it. |

## Consultations

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/consultations` | DOCTOR | Body: `appointment_id`, `symptoms`, `diagnosis`, optional `notes`. The appointment must belong to this doctor (403 otherwise) and be CONFIRMED (409 otherwise). In **one transaction** it saves the consultation, moves the appointment to COMPLETED, writes audit rows and notifies the patient. One consultation per appointment (a second is 409). |
| GET | `/consultations` | DOCTOR | Own consultations, paginated. |
| GET | `/consultations/:id` | PATIENT, DOCTOR | Detail with prescription and items. Only the patient it is about or the doctor who wrote it. |
| PUT | `/consultations/:id` | DOCTOR | Edit `symptoms`, `diagnosis` or `notes`. |

## Prescriptions

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| POST | `/prescriptions` | DOCTOR | Body: `consultation_id`, optional `notes`, `items` (1 to 20): `medication_id`, `dosage`, `frequency`, `duration_days` (1 to 365), optional `instructions`. One prescription per consultation (a second is 409). Each medication must exist, be active, and appear only once, otherwise 400. Notifies the patient. |
| GET | `/prescriptions` | DOCTOR | Own prescriptions, paginated. |
| GET | `/prescriptions/:id` | PATIENT, DOCTOR | Detail with medication names. |
| PUT | `/prescriptions/:id` | DOCTOR | Replace `notes` and the full `items` list. |

## Medications, departments, medical records

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| GET | `/medications` | DOCTOR, ADMIN | Query: `search`, `active` (`true` or `false`), `page`, `limit`. |
| POST | `/medications` | ADMIN | `name`, optional `description`. |
| PUT | `/medications/:id` | ADMIN | Same body. |
| PATCH | `/medications/:id/status` | ADMIN | `{ is_active }`. Deactivate instead of deleting, so old prescriptions stay readable. |
| GET | `/departments` | any signed-in | All departments. Admins see inactive ones too. |
| POST | `/departments` | ADMIN | `name`, optional `description`. |
| PUT | `/departments/:id` | ADMIN | Same body. |
| PATCH | `/departments/:id/status` | ADMIN | `{ is_active }`. |
| POST | `/medical-records` | DOCTOR | `patient_id`, `title`, `record_type` (`LAB_REPORT`, `IMAGING`, `VACCINATION`, `ALLERGY`, `PROCEDURE`, `OTHER`), `description`, `record_date` (today or earlier). Needs a non-cancelled appointment with that patient. |

## Notifications

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| GET | `/notifications` | any signed-in | Own notifications, newest first. Query: `unread=true`, `page`, `limit`. |
| GET | `/notifications/unread-count` | any signed-in | The number behind the bell. |
| PATCH | `/notifications/read-all` | any signed-in | Returns `{ updated: n }`. |
| PATCH | `/notifications/:id/read` | any signed-in | Only your own. |

Types: `APPOINTMENT_BOOKED`, `APPOINTMENT_CONFIRMED`, `APPOINTMENT_CANCELLED`, `APPOINTMENT_COMPLETED`, `PRESCRIPTION_CREATED`. Each is written inside the same transaction as the event that caused it, so a notification never exists without its event, or the other way round.

## Admin

Every `/admin` route requires the ADMIN role.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/dashboard` | `total_patients`, `total_doctors`, `total_appointments`, `completed_appointments`, `cancelled_appointments`, `todays_appointments`. |
| GET | `/admin/reports?from=&to=` | Defaults to the last 30 days. Range is at most 366 days (400 otherwise). Returns `from`, `to`, `total`, `by_status` (always all five statuses, zero-filled), `by_doctor`, `by_day`. |
| GET | `/admin/doctors` | Query: `search`, `page`, `limit`. |
| POST | `/admin/doctors` | Creates the login and the doctor profile together: `email`, `password`, the profile fields, `department_ids`. |
| PUT | `/admin/doctors/:id` | Profile fields and `department_ids`. Credentials are not editable here. |
| PATCH | `/admin/doctors/:id/status` | `{ status: "ACTIVE" | "INACTIVE" }`. An inactive doctor cannot sign in and disappears from patient search. Their history is kept. |
| GET | `/admin/patients` | Query: `search`, `page`, `limit`. Contact details only, never clinical data. |
| GET | `/admin/appointments` | Query: `status`, `doctor_id`, `date`, `page`, `limit`. Read-only. |

## Who can see what

| Data | Patient | Doctor | Admin |
| --- | --- | --- | --- |
| Own appointments | Yes | Yes | No (use `/admin/appointments`) |
| Anyone's appointments | No | No | Yes, read-only |
| Consultations, prescriptions, vital signs | Own | Only for patients with a non-cancelled appointment with them | No |
| Patient contact details | Own | Same relationship rule | Yes |
| Doctor, department and medication management | No | No | Yes |
