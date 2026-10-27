import request from 'supertest';
import { app } from '../../src/app';
import { loginAgent } from '../helpers/auth';
import { resetDatabase } from '../helpers/db';
import { nextDateOn } from '../helpers/dates';
import { createAdmin, createAppointment, createDoctor, createPatient } from '../helpers/factories';

beforeEach(resetDatabase);

describe('role authorization', () => {
  it('lets only admins into /api/admin', async () => {
    const patient = await loginAgent((await createPatient()).email);
    const doctor = await loginAgent((await createDoctor()).email);
    const admin = await loginAgent((await createAdmin()).email);

    expect((await patient.get('/api/admin/dashboard')).status).toBe(403);
    expect((await doctor.get('/api/admin/dashboard')).status).toBe(403);
    expect((await admin.get('/api/admin/dashboard')).status).toBe(200);
  });

  it('lets only doctors create consultations and prescriptions', async () => {
    const patient = await loginAgent((await createPatient()).email);
    const admin = await loginAgent((await createAdmin()).email);

    expect((await patient.post('/api/consultations').send({})).status).toBe(403);
    expect((await admin.post('/api/prescriptions').send({})).status).toBe(403);
  });

  it('keeps patient-only and doctor-only routes apart', async () => {
    const patient = await loginAgent((await createPatient()).email);
    const doctor = await loginAgent((await createDoctor()).email);

    expect((await patient.get('/api/doctors/profile')).status).toBe(403);
    expect((await patient.get('/api/doctors/dashboard')).status).toBe(403);
    expect((await doctor.get('/api/doctors')).status).toBe(403);
    expect((await doctor.get('/api/patients/dashboard')).status).toBe(403);
  });

  it('keeps admins away from appointment and clinical endpoints', async () => {
    const admin = await loginAgent((await createAdmin()).email);

    expect((await admin.get('/api/appointments')).status).toBe(403);
    expect((await admin.get('/api/consultations')).status).toBe(403);
  });

  it('answers anonymous callers with 401, not 403', async () => {
    expect((await request(app).get('/api/doctors')).status).toBe(401);
    expect((await request(app).get('/api/admin/dashboard')).status).toBe(401);
  });

  it('does not let a patient read another patient appointment (resource-level check)', async () => {
    const doctor = await createDoctor();
    const owner = await createPatient();
    const other = await createPatient();
    const appointment = await createAppointment(owner.patient.id, doctor.doctor.id, nextDateOn('MONDAY'), '09:00');

    const asOwner = await loginAgent(owner.email);
    const asOther = await loginAgent(other.email);
    const asDoctor = await loginAgent(doctor.email);

    expect((await asOwner.get(`/api/appointments/${appointment.id}`)).status).toBe(200);
    expect((await asDoctor.get(`/api/appointments/${appointment.id}`)).status).toBe(200);
    expect((await asOther.get(`/api/appointments/${appointment.id}`)).status).toBe(403);
  });

  it('rejects ids that are not positive integers before they reach the database', async () => {
    const admin = await loginAgent((await createAdmin()).email);
    const patient = await loginAgent((await createPatient()).email);

    expect((await patient.get('/api/appointments/abc')).status).toBe(400);
    expect((await patient.get('/api/appointments/0')).status).toBe(400);
    expect((await admin.put('/api/admin/doctors/-1').send({})).status).toBe(400);
  });

  it('limits what an admin sees of a patient to profile fields', async () => {
    const admin = await loginAgent((await createAdmin()).email);
    const { patient } = await createPatient();

    const res = await admin.get(`/api/patients/${patient.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data).not.toHaveProperty('consultations');
    expect((await admin.get(`/api/patients/${patient.id}/history`)).status).toBe(403);
  });

  it('only shows a doctor the patients they actually have an appointment with', async () => {
    const doctor = await createDoctor();
    const treated = await createPatient();
    const stranger = await createPatient();
    await createAppointment(treated.patient.id, doctor.doctor.id, nextDateOn('MONDAY'), '09:00');
    const agent = await loginAgent(doctor.email);

    expect((await agent.get(`/api/patients/${treated.patient.id}`)).status).toBe(200);
    expect((await agent.get(`/api/patients/${stranger.patient.id}`)).status).toBe(403);
    expect((await agent.get(`/api/patients/${stranger.patient.id}/history`)).status).toBe(403);
  });
});
