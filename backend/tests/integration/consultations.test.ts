import type { AppointmentStatus } from '../../src/config/constants';
import { Appointment, AuditLog, Consultation, Notification } from '../../src/models';
import { loginAgent } from '../helpers/auth';
import { resetDatabase } from '../helpers/db';
import { nextDateOn } from '../helpers/dates';
import { createAppointment, createConsultation, createDoctor, createPatient } from '../helpers/factories';

beforeEach(resetDatabase);

const setup = async (status: AppointmentStatus = 'CONFIRMED') => {
  const doctor = await createDoctor();
  const patient = await createPatient();
  const appointment = await createAppointment(patient.patient.id, doctor.doctor.id, nextDateOn('MONDAY'), '09:00', status);
  return { doctor, patient, appointment };
};

const payload = (appointmentId: number) => ({
  appointment_id: appointmentId,
  symptoms: 'Fever and cough for three days',
  diagnosis: 'Viral upper respiratory infection',
  notes: 'Rest and fluids',
});

describe('consultation creation', () => {
  it('saves the consultation and completes the appointment together', async () => {
    const { doctor, patient, appointment } = await setup();
    const agent = await loginAgent(doctor.email);

    const res = await agent.post('/api/consultations').send(payload(appointment.id));

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      appointment_id: appointment.id,
      patient_id: patient.patient.id,
      doctor_id: doctor.doctor.id,
      diagnosis: 'Viral upper respiratory infection',
    });
    expect((await Appointment.findByPk(appointment.id))?.status).toBe('COMPLETED');
  });

  it('notifies the patient and writes audit rows', async () => {
    const { doctor, patient, appointment } = await setup();
    await (await loginAgent(doctor.email)).post('/api/consultations').send(payload(appointment.id));

    expect(await Notification.count({ where: { user_id: patient.user.id, type: 'APPOINTMENT_COMPLETED' } })).toBe(1);
    expect(await AuditLog.count({ where: { action: 'CONSULTATION_CREATED' } })).toBe(1);
  });

  it('copies patient and doctor from the appointment and ignores spoofed ids in the body', async () => {
    const { doctor, patient, appointment } = await setup();
    const stranger = await createPatient();
    const agent = await loginAgent(doctor.email);

    const res = await agent
      .post('/api/consultations')
      .send({ ...payload(appointment.id), patient_id: stranger.patient.id, doctor_id: 999999 });

    expect(res.status).toBe(201);
    expect(res.body.data.patient_id).toBe(patient.patient.id);
    expect(res.body.data.doctor_id).toBe(doctor.doctor.id);
  });

  it('needs a CONFIRMED appointment', async () => {
    const { doctor, appointment } = await setup('BOOKED');
    const res = await (await loginAgent(doctor.email)).post('/api/consultations').send(payload(appointment.id));

    expect(res.status).toBe(409);
    expect(await Consultation.count()).toBe(0);
    expect((await Appointment.findByPk(appointment.id))?.status).toBe('BOOKED');
  });

  it('cannot be created twice for one appointment', async () => {
    const { doctor, appointment } = await setup();
    const agent = await loginAgent(doctor.email);

    expect((await agent.post('/api/consultations').send(payload(appointment.id))).status).toBe(201);
    expect((await agent.post('/api/consultations').send(payload(appointment.id))).status).toBe(409);
    expect(await Consultation.count()).toBe(1);
  });

  it('leaves the appointment untouched when the consultation cannot be saved', async () => {
    const { doctor, appointment } = await setup();
    await createConsultation(appointment); // a consultation already exists, so the new one must fail

    const res = await (await loginAgent(doctor.email)).post('/api/consultations').send(payload(appointment.id));

    expect(res.status).toBe(409);
    expect((await Appointment.findByPk(appointment.id))?.status).toBe('CONFIRMED');
  });

  it("refuses another doctor's appointment, and patients", async () => {
    const { patient, appointment } = await setup();
    const other = await createDoctor();

    expect((await (await loginAgent(other.email)).post('/api/consultations').send(payload(appointment.id))).status).toBe(403);
    expect((await (await loginAgent(patient.email)).post('/api/consultations').send(payload(appointment.id))).status).toBe(403);
  });

  it('validates the body and returns 404 for an unknown appointment', async () => {
    const { doctor, appointment } = await setup();
    const agent = await loginAgent(doctor.email);

    const invalid = await agent.post('/api/consultations').send({ appointment_id: appointment.id, symptoms: 'Cough' });
    expect(invalid.status).toBe(400);
    expect(invalid.body.errors.map((e: { field: string }) => e.field)).toContain('diagnosis');

    expect((await agent.post('/api/consultations').send(payload(999999))).status).toBe(404);
  });
});

describe('reading and editing consultations', () => {
  it('lets the patient and the doctor read it, and nobody else', async () => {
    const { doctor, patient, appointment } = await setup('COMPLETED');
    const consultation = await createConsultation(appointment);
    const stranger = await createPatient();
    const otherDoctor = await createDoctor();

    expect((await (await loginAgent(patient.email)).get(`/api/consultations/${consultation.id}`)).status).toBe(200);
    expect((await (await loginAgent(doctor.email)).get(`/api/consultations/${consultation.id}`)).status).toBe(200);
    expect((await (await loginAgent(stranger.email)).get(`/api/consultations/${consultation.id}`)).status).toBe(403);
    expect((await (await loginAgent(otherDoctor.email)).get(`/api/consultations/${consultation.id}`)).status).toBe(403);
  });

  it('lists consultations for the doctor and for the patient', async () => {
    const { doctor, patient, appointment } = await setup('COMPLETED');
    await createConsultation(appointment);

    const asDoctor = await (await loginAgent(doctor.email)).get('/api/consultations');
    const asPatient = await (await loginAgent(patient.email)).get('/api/patients/consultations');

    expect(asDoctor.body.meta.total).toBe(1);
    expect(asPatient.body.data).toHaveLength(1);
    expect(asPatient.body.data[0].doctor.id).toBe(doctor.doctor.id);
  });

  it('lets only the author edit it', async () => {
    const { doctor, appointment } = await setup('COMPLETED');
    const consultation = await createConsultation(appointment);
    const other = await createDoctor();

    const edited = await (await loginAgent(doctor.email)).put(`/api/consultations/${consultation.id}`).send({ diagnosis: 'Updated diagnosis' });
    expect(edited.status).toBe(200);
    expect(edited.body.data.diagnosis).toBe('Updated diagnosis');
    expect(edited.body.data.symptoms).toBe('Cough');

    expect((await (await loginAgent(other.email)).put(`/api/consultations/${consultation.id}`).send({ diagnosis: 'Hijack' })).status).toBe(403);
    expect((await (await loginAgent(doctor.email)).put(`/api/consultations/${consultation.id}`).send({})).status).toBe(400);
  });
});
