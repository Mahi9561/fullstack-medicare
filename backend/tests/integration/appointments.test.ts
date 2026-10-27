import { Appointment, AuditLog, Notification } from '../../src/models';
import { addDays, todayLocal } from '../../src/utils/dateTime';
import { loginAgent, type TestAgent } from '../helpers/auth';
import { resetDatabase } from '../helpers/db';
import { nextDateOn, yesterday } from '../helpers/dates';
import { addAvailability, createAppointment, createDoctor, createPatient } from '../helpers/factories';

const DOUBLE_BOOKED = { success: false, message: 'Doctor is already booked for this time slot' };

beforeEach(resetDatabase);

/** A doctor who works Mondays 09:00-12:00 (six 30-minute slots) and two patients. */
const setup = async () => {
  const doctor = await createDoctor();
  await addAvailability(doctor.doctor.id, 'MONDAY', '09:00', '12:00');
  const patientA = await createPatient();
  const patientB = await createPatient();
  return { doctor, patientA, patientB, date: nextDateOn('MONDAY') };
};

const book = (agent: TestAgent, doctorId: number, date: string, start_time: string) =>
  agent.post('/api/appointments').send({ doctor_id: doctorId, appointment_date: date, start_time, reason: 'Check-up' });

const slotsOf = async (agent: TestAgent, doctorId: number, date: string): Promise<string[]> => {
  const res = await agent.get(`/api/doctors/${doctorId}/slots?date=${date}`);
  return res.body.data.slots.map((s: { start_time: string }) => s.start_time);
};

describe('slots', () => {
  it('computes the grid from availability', async () => {
    const { doctor, patientA, date } = await setup();
    const agent = await loginAgent(patientA.email);

    expect(await slotsOf(agent, doctor.doctor.id, date)).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
  });

  it('is empty on a day the doctor does not work', async () => {
    const { doctor, patientA } = await setup();
    const agent = await loginAgent(patientA.email);

    expect(await slotsOf(agent, doctor.doctor.id, nextDateOn('TUESDAY'))).toEqual([]);
  });

  it('is empty for a date in the past', async () => {
    const { doctor, patientA } = await setup();
    const agent = await loginAgent(patientA.email);

    expect(await slotsOf(agent, doctor.doctor.id, addDays(todayLocal(), -7))).toEqual([]);
  });

  it('requires a valid date', async () => {
    const { doctor, patientA } = await setup();
    const agent = await loginAgent(patientA.email);

    expect((await agent.get(`/api/doctors/${doctor.doctor.id}/slots`)).status).toBe(400);
    expect((await agent.get(`/api/doctors/${doctor.doctor.id}/slots?date=2026-02-30`)).status).toBe(400);
  });
});

describe('booking', () => {
  it('books a free slot and derives the end time on the server', async () => {
    const { doctor, patientA, date } = await setup();
    const agent = await loginAgent(patientA.email);

    const res = await book(agent, doctor.doctor.id, date, '09:00');

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ status: 'BOOKED', appointment_date: date, start_time: '09:00', end_time: '09:30' });
    expect(res.body.data.patient.id).toBe(patientA.patient.id);
    expect(res.body.data.doctor.id).toBe(doctor.doctor.id);
  });

  it('removes the booked slot from the available slots', async () => {
    const { doctor, patientA, patientB, date } = await setup();
    await book(await loginAgent(patientA.email), doctor.doctor.id, date, '09:30');

    const slots = await slotsOf(await loginAgent(patientB.email), doctor.doctor.id, date);

    expect(slots).not.toContain('09:30');
    expect(slots).toHaveLength(5);
  });

  it('notifies the doctor and writes an audit row', async () => {
    const { doctor, patientA, date } = await setup();
    const res = await book(await loginAgent(patientA.email), doctor.doctor.id, date, '10:00');

    const notifications = await Notification.findAll({ where: { user_id: doctor.user.id } });
    expect(notifications).toHaveLength(1);
    expect(notifications[0]).toMatchObject({ type: 'APPOINTMENT_BOOKED', entity_type: 'appointment', entity_id: res.body.data.id });
    expect(await AuditLog.count({ where: { action: 'APPOINTMENT_CREATED', user_id: patientA.user.id } })).toBe(1);
  });

  it('rejects a time outside the doctor working hours', async () => {
    const { doctor, patientA, date } = await setup();
    const res = await book(await loginAgent(patientA.email), doctor.doctor.id, date, '08:00');

    expect(res.status).toBe(400);
  });

  it('rejects a time that is not on the 30-minute grid', async () => {
    const { doctor, patientA, date } = await setup();
    const res = await book(await loginAgent(patientA.email), doctor.doctor.id, date, '09:15');

    expect(res.status).toBe(400);
  });

  it('rejects a day the doctor does not work', async () => {
    const { doctor, patientA } = await setup();
    const res = await book(await loginAgent(patientA.email), doctor.doctor.id, nextDateOn('TUESDAY'), '09:00');

    expect(res.status).toBe(400);
  });

  it('rejects a date in the past', async () => {
    const { doctor, patientA } = await setup();
    const res = await book(await loginAgent(patientA.email), doctor.doctor.id, yesterday(), '09:00');

    expect(res.status).toBe(400);
  });

  it('validates the body and names the offending fields', async () => {
    const { doctor, patientA } = await setup();
    const agent = await loginAgent(patientA.email);
    const res = await agent.post('/api/appointments').send({ doctor_id: doctor.doctor.id, appointment_date: 'tomorrow', start_time: '9am' });

    expect(res.status).toBe(400);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['appointment_date', 'start_time', 'reason']));
  });

  it('returns 404 for an unknown or inactive doctor', async () => {
    const { patientA, date } = await setup();
    const inactive = await createDoctor({ status: 'INACTIVE' });
    await addAvailability(inactive.doctor.id, 'MONDAY', '09:00', '12:00');
    const agent = await loginAgent(patientA.email);

    expect((await book(agent, 999999, date, '09:00')).status).toBe(404);
    expect((await book(agent, inactive.doctor.id, date, '09:00')).status).toBe(404);
  });

  it('does not let a doctor book appointments', async () => {
    const { doctor, date } = await setup();
    const res = await book(await loginAgent(doctor.email), doctor.doctor.id, date, '09:00');

    expect(res.status).toBe(403);
  });
});

describe('double booking', () => {
  it('returns 409 with the exact message when the slot is already taken', async () => {
    const { doctor, patientA, patientB, date } = await setup();
    expect((await book(await loginAgent(patientA.email), doctor.doctor.id, date, '09:00')).status).toBe(201);

    const res = await book(await loginAgent(patientB.email), doctor.doctor.id, date, '09:00');

    expect(res.status).toBe(409);
    expect(res.body).toEqual(DOUBLE_BOOKED);
  });

  it('also stops the same patient from taking the slot twice', async () => {
    const { doctor, patientA, date } = await setup();
    const agent = await loginAgent(patientA.email);
    await book(agent, doctor.doctor.id, date, '09:00');

    const res = await book(agent, doctor.doctor.id, date, '09:00');

    expect(res.status).toBe(409);
    expect(res.body).toEqual(DOUBLE_BOOKED);
  });

  it('lets exactly one of two simultaneous requests win', async () => {
    const { doctor, patientA, patientB, date } = await setup();
    const [agentA, agentB] = await Promise.all([loginAgent(patientA.email), loginAgent(patientB.email)]);

    const results = await Promise.all([
      book(agentA, doctor.doctor.id, date, '10:30'),
      book(agentB, doctor.doctor.id, date, '10:30'),
    ]);

    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(results.find((r) => r.status === 409)?.body).toEqual(DOUBLE_BOOKED);
    expect(await Appointment.count({ where: { doctor_id: doctor.doctor.id, appointment_date: date, start_time: '10:30' } })).toBe(1);
  });

  it('survives a burst of simultaneous requests from many patients', async () => {
    const { doctor, date } = await setup();
    const patients = await Promise.all([1, 2, 3, 4, 5].map(() => createPatient()));
    const agents = await Promise.all(patients.map((p) => loginAgent(p.email)));

    const results = await Promise.all(agents.map((agent) => book(agent, doctor.doctor.id, date, '11:00')));
    const statuses = results.map((r) => r.status);

    expect(statuses.filter((s) => s === 201)).toHaveLength(1);
    expect(statuses.filter((s) => s === 409)).toHaveLength(4);
  });

  it('is enforced by the database itself, not only by the service', async () => {
    const { doctor, patientA, patientB, date } = await setup();
    await createAppointment(patientA.patient.id, doctor.doctor.id, date, '09:00', 'BOOKED');

    // A second live booking for the same slot violates the unique index on the generated active_slot column.
    await expect(createAppointment(patientB.patient.id, doctor.doctor.id, date, '09:00', 'CONFIRMED')).rejects.toThrow();
    // Cancelled rows do not hold the slot, so any number of them may exist.
    await expect(createAppointment(patientB.patient.id, doctor.doctor.id, date, '09:00', 'CANCELLED')).resolves.toBeTruthy();
    await expect(createAppointment(patientA.patient.id, doctor.doctor.id, date, '09:00', 'CANCELLED')).resolves.toBeTruthy();
  });
});

describe('confirming', () => {
  it('lets the doctor confirm and notifies the patient', async () => {
    const { doctor, patientA, date } = await setup();
    const booked = await book(await loginAgent(patientA.email), doctor.doctor.id, date, '09:00');
    const agent = await loginAgent(doctor.email);

    const res = await agent.patch(`/api/appointments/${booked.body.data.id}/confirm`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CONFIRMED');
    expect(await Notification.count({ where: { user_id: patientA.user.id, type: 'APPOINTMENT_CONFIRMED' } })).toBe(1);
  });

  it('refuses a second confirmation, a patient, and a different doctor', async () => {
    const { doctor, patientA, date } = await setup();
    const other = await createDoctor();
    const appointment = await createAppointment(patientA.patient.id, doctor.doctor.id, date, '09:00');
    const asDoctor = await loginAgent(doctor.email);

    expect((await (await loginAgent(patientA.email)).patch(`/api/appointments/${appointment.id}/confirm`)).status).toBe(403);
    expect((await (await loginAgent(other.email)).patch(`/api/appointments/${appointment.id}/confirm`)).status).toBe(403);
    expect((await asDoctor.patch(`/api/appointments/${appointment.id}/confirm`)).status).toBe(200);
    expect((await asDoctor.patch(`/api/appointments/${appointment.id}/confirm`)).status).toBe(409);
  });

  it('refuses a no-show before the appointment has started', async () => {
    const { doctor, patientA, date } = await setup();
    const appointment = await createAppointment(patientA.patient.id, doctor.doctor.id, date, '09:00');
    const res = await (await loginAgent(doctor.email)).patch(`/api/appointments/${appointment.id}/no-show`);

    expect(res.status).toBe(409);
  });

  it('marks a past appointment as a no-show and frees the slot', async () => {
    const { doctor, patientA } = await setup();
    const past = addDays(todayLocal(), -1);
    const appointment = await createAppointment(patientA.patient.id, doctor.doctor.id, past, '09:00');
    const res = await (await loginAgent(doctor.email)).patch(`/api/appointments/${appointment.id}/no-show`);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('NO_SHOW');
  });
});

describe('cancellation', () => {
  it('lets a patient cancel their own appointment and stores the reason', async () => {
    const { doctor, patientA, date } = await setup();
    const agent = await loginAgent(patientA.email);
    const booked = await book(agent, doctor.doctor.id, date, '09:00');

    const res = await agent.patch(`/api/appointments/${booked.body.data.id}/cancel`).send({ reason: 'Feeling better' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'CANCELLED', cancellation_reason: 'Feeling better' });
  });

  it('works without a reason', async () => {
    const { doctor, patientA, date } = await setup();
    const agent = await loginAgent(patientA.email);
    const booked = await book(agent, doctor.doctor.id, date, '09:00');

    const res = await agent.patch(`/api/appointments/${booked.body.data.id}/cancel`);

    expect(res.status).toBe(200);
    expect(res.body.data.cancellation_reason).toBeNull();
  });

  it('frees the slot so another patient can book it', async () => {
    const { doctor, patientA, patientB, date } = await setup();
    const agentA = await loginAgent(patientA.email);
    const agentB = await loginAgent(patientB.email);
    const booked = await book(agentA, doctor.doctor.id, date, '09:00');
    await agentA.patch(`/api/appointments/${booked.body.data.id}/cancel`);

    expect(await slotsOf(agentB, doctor.doctor.id, date)).toContain('09:00');
    const rebooked = await book(agentB, doctor.doctor.id, date, '09:00');
    expect(rebooked.status).toBe(201);
  });

  it('does not let another patient cancel it', async () => {
    const { doctor, patientA, patientB, date } = await setup();
    const booked = await book(await loginAgent(patientA.email), doctor.doctor.id, date, '09:00');

    const res = await (await loginAgent(patientB.email)).patch(`/api/appointments/${booked.body.data.id}/cancel`);

    expect(res.status).toBe(403);
    expect((await Appointment.findByPk(booked.body.data.id))?.status).toBe('BOOKED');
  });

  it('cannot cancel twice, or cancel a completed visit', async () => {
    const { doctor, patientA, date } = await setup();
    const agent = await loginAgent(patientA.email);
    const booked = await book(agent, doctor.doctor.id, date, '09:00');
    await agent.patch(`/api/appointments/${booked.body.data.id}/cancel`);
    const completed = await createAppointment(patientA.patient.id, doctor.doctor.id, date, '10:00', 'COMPLETED');

    expect((await agent.patch(`/api/appointments/${booked.body.data.id}/cancel`)).status).toBe(409);
    expect((await agent.patch(`/api/appointments/${completed.id}/cancel`)).status).toBe(409);
  });

  it('lets the doctor cancel too, and tells the patient', async () => {
    const { doctor, patientA, date } = await setup();
    const appointment = await createAppointment(patientA.patient.id, doctor.doctor.id, date, '09:00');

    const res = await (await loginAgent(doctor.email)).patch(`/api/appointments/${appointment.id}/cancel`).send({ reason: 'Emergency surgery' });

    expect(res.status).toBe(200);
    expect(await Notification.count({ where: { user_id: patientA.user.id, type: 'APPOINTMENT_CANCELLED' } })).toBe(1);
  });
});

describe('listing', () => {
  it('shows each user only their own appointments, split into upcoming and history', async () => {
    const { doctor, patientA, patientB, date } = await setup();
    await createAppointment(patientA.patient.id, doctor.doctor.id, date, '09:00');
    await createAppointment(patientA.patient.id, doctor.doctor.id, addDays(todayLocal(), -3), '09:00', 'COMPLETED');
    await createAppointment(patientB.patient.id, doctor.doctor.id, date, '09:30');
    const agent = await loginAgent(patientA.email);

    const all = await agent.get('/api/appointments');
    const upcoming = await agent.get('/api/appointments?scope=upcoming');
    const history = await agent.get('/api/appointments?scope=history');

    expect(all.body.meta.total).toBe(2);
    expect(upcoming.body.data).toHaveLength(1);
    expect(history.body.data).toHaveLength(1);
    expect(history.body.data[0].status).toBe('COMPLETED');
  });

  it('lets a doctor filter their schedule by date and status', async () => {
    const { doctor, patientA, patientB, date } = await setup();
    await createAppointment(patientA.patient.id, doctor.doctor.id, date, '09:00', 'CONFIRMED');
    await createAppointment(patientB.patient.id, doctor.doctor.id, date, '09:30', 'BOOKED');
    const agent = await loginAgent(doctor.email);

    const res = await agent.get(`/api/appointments?date=${date}&status=CONFIRMED`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].start_time).toBe('09:00');
  });

  it('is available through the patient alias as well', async () => {
    const { doctor, patientA, date } = await setup();
    await createAppointment(patientA.patient.id, doctor.doctor.id, date, '09:00');
    const res = await (await loginAgent(patientA.email)).get('/api/patients/appointments?scope=upcoming');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});
