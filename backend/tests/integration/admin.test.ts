import request from 'supertest';
import { app } from '../../src/app';
import { addDays, todayLocal } from '../../src/utils/dateTime';
import { loginAgent, type TestAgent } from '../helpers/auth';
import { resetDatabase } from '../helpers/db';
import { nextDateOn } from '../helpers/dates';
import { createAdmin, createAppointment, createDepartment, createDoctor, createMedication, createPatient, PASSWORD } from '../helpers/factories';

let admin: TestAgent;

beforeEach(async () => {
  await resetDatabase();
  admin = await loginAgent((await createAdmin()).email);
});

const newDoctor = (departmentIds: number[], overrides: Record<string, unknown> = {}) => ({
  email: 'new.doctor@test.local',
  password: 'Doctor123',
  first_name: 'Nila',
  last_name: 'Menon',
  specialization: 'Neurology',
  qualification: 'MBBS, DM',
  experience_years: 9,
  consultation_fee: 900,
  bio: 'Neurologist',
  department_ids: departmentIds,
  ...overrides,
});

describe('doctor management', () => {
  it('creates the account, profile and department links in one go', async () => {
    const neurology = await createDepartment('Neurology');
    const res = await admin.post('/api/admin/doctors').send(newDoctor([neurology.id]));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: 'new.doctor@test.local', status: 'ACTIVE', specialization: 'Neurology' });
    expect(res.body.data.departments).toEqual([expect.objectContaining({ name: 'Neurology' })]);

    const doctor = await loginAgent('new.doctor@test.local', 'Doctor123');
    expect((await doctor.get('/api/doctors/profile')).status).toBe(200);
  });

  it('rejects a duplicate email, an unknown department and a weak password', async () => {
    const neurology = await createDepartment('Neurology');
    await createPatient({ email: 'new.doctor@test.local' });

    expect((await admin.post('/api/admin/doctors').send(newDoctor([neurology.id]))).status).toBe(409);
    expect((await admin.post('/api/admin/doctors').send(newDoctor([999999], { email: 'a@test.local' }))).status).toBe(400);
    expect((await admin.post('/api/admin/doctors').send(newDoctor([neurology.id], { email: 'b@test.local', password: 'weak' }))).status).toBe(400);
  });

  it('updates the profile and replaces the departments', async () => {
    const neurology = await createDepartment('Neurology');
    const cardiology = await createDepartment('Cardiology');
    const created = await admin.post('/api/admin/doctors').send(newDoctor([neurology.id]));

    const res = await admin
      .put(`/api/admin/doctors/${created.body.data.id}`)
      .send({ ...newDoctor([cardiology.id]), consultation_fee: 1200 });

    expect(res.status).toBe(200);
    expect(res.body.data.consultation_fee).toBe(1200);
    expect(res.body.data.departments.map((d: { name: string }) => d.name)).toEqual(['Cardiology']);
  });

  it('deactivates a doctor: no login, no search results, no bookings, history kept', async () => {
    const doctor = await createDoctor({ first_name: 'Hidden' });
    const patient = await loginAgent((await createPatient()).email);

    const off = await admin.patch(`/api/admin/doctors/${doctor.doctor.id}/status`).send({ status: 'INACTIVE' });
    expect(off.status).toBe(200);
    expect(off.body.data.status).toBe('INACTIVE');

    const login = await request(app).post('/api/auth/login').send({ email: doctor.email, password: PASSWORD });
    expect(login.status).toBe(403);
    expect((await patient.get('/api/doctors?search=hidden')).body.data).toHaveLength(0);

    const on = await admin.patch(`/api/admin/doctors/${doctor.doctor.id}/status`).send({ status: 'ACTIVE' });
    expect(on.body.data.status).toBe('ACTIVE');
    expect((await patient.get('/api/doctors?search=hidden')).body.data).toHaveLength(1);
  });

  it('lists doctors including inactive ones, with email and status', async () => {
    await createDoctor({ first_name: 'Active' });
    await createDoctor({ first_name: 'Dormant', status: 'INACTIVE' });

    const res = await admin.get('/api/admin/doctors');

    expect(res.body.meta.total).toBe(2);
    expect(res.body.data[0]).toHaveProperty('email');
    expect(res.body.data.map((d: { status: string }) => d.status).sort()).toEqual(['ACTIVE', 'INACTIVE']);
  });
});

describe('dashboard and reports', () => {
  it('counts patients, doctors and appointments', async () => {
    const doctor = await createDoctor();
    const patient = await createPatient();
    const date = nextDateOn('MONDAY');
    await createAppointment(patient.patient.id, doctor.doctor.id, date, '09:00', 'COMPLETED');
    await createAppointment(patient.patient.id, doctor.doctor.id, date, '09:30', 'CANCELLED');
    await createAppointment(patient.patient.id, doctor.doctor.id, date, '10:00', 'BOOKED');

    const res = await admin.get('/api/admin/dashboard');

    expect(res.body.data).toMatchObject({
      total_patients: 1,
      total_doctors: 1,
      total_appointments: 3,
      completed_appointments: 1,
      cancelled_appointments: 1,
    });
  });

  it('groups appointments by status, doctor and day, filling in zeros', async () => {
    const doctor = await createDoctor();
    await createDoctor(); // a doctor with no appointments still appears in the report
    const patient = await createPatient();
    const date = nextDateOn('MONDAY');
    await createAppointment(patient.patient.id, doctor.doctor.id, date, '09:00', 'COMPLETED');
    await createAppointment(patient.patient.id, doctor.doctor.id, date, '09:30', 'CANCELLED');

    const res = await admin.get(`/api/admin/reports?from=${todayLocal()}&to=${addDays(todayLocal(), 14)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.by_status).toHaveLength(5);
    expect(res.body.data.by_status.find((s: { status: string }) => s.status === 'COMPLETED').count).toBe(1);
    expect(res.body.data.by_status.find((s: { status: string }) => s.status === 'BOOKED').count).toBe(0);
    expect(res.body.data.by_doctor).toHaveLength(2);
    expect(res.body.data.by_doctor[0]).toMatchObject({ doctor_id: doctor.doctor.id, total: 2, completed: 1, cancelled: 1 });
    expect(res.body.data.by_day).toEqual([{ day: date, count: 2 }]);
  });

  it('rejects an inverted or oversized date range', async () => {
    expect((await admin.get('/api/admin/reports?from=2026-10-10&to=2026-10-01')).status).toBe(400);
    expect((await admin.get('/api/admin/reports?from=2020-01-01&to=2026-10-01')).status).toBe(400);
  });
});

describe('departments', () => {
  it('lets admins manage them and everyone else see only active ones', async () => {
    const created = await admin.post('/api/departments').send({ name: 'Oncology', description: 'Cancer care' });
    expect(created.status).toBe(201);
    expect((await admin.post('/api/departments').send({ name: 'Oncology' })).status).toBe(409);

    await admin.patch(`/api/departments/${created.body.data.id}/status`).send({ is_active: false });
    const patient = await loginAgent((await createPatient()).email);

    expect((await admin.get('/api/departments')).body.data).toHaveLength(1);
    expect((await patient.get('/api/departments')).body.data).toHaveLength(0);
    expect((await patient.post('/api/departments').send({ name: 'Nope' })).status).toBe(403);
  });
});

describe('medications', () => {
  it('lets admins add, edit and deactivate; doctors only see active ones', async () => {
    const created = await admin.post('/api/medications').send({ name: 'Cetirizine 10 mg', description: 'Antihistamine' });
    expect(created.status).toBe(201);
    expect((await admin.post('/api/medications').send({ name: 'Cetirizine 10 mg' })).status).toBe(409);

    const renamed = await admin.put(`/api/medications/${created.body.data.id}`).send({ name: 'Cetirizine 5 mg' });
    expect(renamed.body.data.name).toBe('Cetirizine 5 mg');

    await createMedication({ name: 'Old drug', is_active: false });
    const doctor = await loginAgent((await createDoctor()).email);

    expect((await doctor.get('/api/medications')).body.data).toHaveLength(1);
    expect((await admin.get('/api/medications')).body.data).toHaveLength(2);
    expect((await admin.get('/api/medications?active=false')).body.data).toHaveLength(1);

    await admin.patch(`/api/medications/${created.body.data.id}/status`).send({ is_active: false });
    expect((await doctor.get('/api/medications')).body.data).toHaveLength(0);
    expect((await doctor.post('/api/medications').send({ name: 'Nope' })).status).toBe(403);
  });
});
