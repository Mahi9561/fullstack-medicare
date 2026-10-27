import { AuditLog, Notification, Prescription, PrescriptionItem } from '../../src/models';
import { loginAgent } from '../helpers/auth';
import { resetDatabase } from '../helpers/db';
import { nextDateOn } from '../helpers/dates';
import { createAppointment, createConsultation, createDoctor, createMedication, createPatient } from '../helpers/factories';

beforeEach(resetDatabase);

const setup = async () => {
  const doctor = await createDoctor();
  const patient = await createPatient();
  const appointment = await createAppointment(patient.patient.id, doctor.doctor.id, nextDateOn('MONDAY'), '09:00', 'COMPLETED');
  const consultation = await createConsultation(appointment);
  const paracetamol = await createMedication({ name: 'Paracetamol 500 mg' });
  const ibuprofen = await createMedication({ name: 'Ibuprofen 400 mg' });
  const withdrawn = await createMedication({ name: 'Withdrawn drug', is_active: false });
  return { doctor, patient, consultation, paracetamol, ibuprofen, withdrawn };
};

const item = (medication_id: number, extra: Record<string, unknown> = {}) => ({
  medication_id,
  dosage: '500mg',
  frequency: '2 times/day',
  duration_days: 5,
  ...extra,
});

describe('prescription creation', () => {
  it('saves the prescription and all its items', async () => {
    const { doctor, consultation, paracetamol, ibuprofen } = await setup();
    const agent = await loginAgent(doctor.email);

    const res = await agent.post('/api/prescriptions').send({
      consultation_id: consultation.id,
      notes: 'Take after food',
      items: [item(paracetamol.id), item(ibuprofen.id, { instructions: 'With water' })],
    });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ consultation_id: consultation.id, notes: 'Take after food' });
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.items.map((i: { medication: { name: string } }) => i.medication.name)).toEqual([
      'Paracetamol 500 mg',
      'Ibuprofen 400 mg',
    ]);
    expect(res.body.data.consultation.doctor.id).toBe(doctor.doctor.id);
  });

  it('notifies the patient and writes an audit row', async () => {
    const { doctor, patient, consultation, paracetamol } = await setup();
    await (await loginAgent(doctor.email))
      .post('/api/prescriptions')
      .send({ consultation_id: consultation.id, items: [item(paracetamol.id)] });

    expect(await Notification.count({ where: { user_id: patient.user.id, type: 'PRESCRIPTION_CREATED' } })).toBe(1);
    expect(await AuditLog.count({ where: { action: 'PRESCRIPTION_CREATED' } })).toBe(1);
  });

  it('requires at least one item and complete item fields', async () => {
    const { doctor, consultation, paracetamol } = await setup();
    const agent = await loginAgent(doctor.email);

    const empty = await agent.post('/api/prescriptions').send({ consultation_id: consultation.id, items: [] });
    expect(empty.status).toBe(400);

    const incomplete = await agent
      .post('/api/prescriptions')
      .send({ consultation_id: consultation.id, items: [{ medication_id: paracetamol.id, frequency: 'Daily', duration_days: 3 }] });
    expect(incomplete.status).toBe(400);
    expect(incomplete.body.errors.map((e: { field: string }) => e.field)).toContain('items.0.dosage');
  });

  it('rejects duplicate, inactive and unknown medications without saving anything', async () => {
    const { doctor, consultation, paracetamol, withdrawn } = await setup();
    const agent = await loginAgent(doctor.email);
    const send = (items: unknown[]) => agent.post('/api/prescriptions').send({ consultation_id: consultation.id, items });

    expect((await send([item(paracetamol.id), item(paracetamol.id)])).status).toBe(400);
    expect((await send([item(paracetamol.id), item(withdrawn.id)])).status).toBe(400);
    expect((await send([item(paracetamol.id), item(999999)])).status).toBe(400);

    expect(await Prescription.count()).toBe(0);
    expect(await PrescriptionItem.count()).toBe(0);
  });

  it("refuses another doctor's consultation, and patients", async () => {
    const { patient, consultation, paracetamol } = await setup();
    const other = await createDoctor();
    const body = { consultation_id: consultation.id, items: [item(paracetamol.id)] };

    expect((await (await loginAgent(other.email)).post('/api/prescriptions').send(body)).status).toBe(403);
    expect((await (await loginAgent(patient.email)).post('/api/prescriptions').send(body)).status).toBe(403);
  });

  it('allows one prescription per consultation and 404s on an unknown consultation', async () => {
    const { doctor, consultation, paracetamol } = await setup();
    const agent = await loginAgent(doctor.email);
    const body = { consultation_id: consultation.id, items: [item(paracetamol.id)] };

    expect((await agent.post('/api/prescriptions').send(body)).status).toBe(201);
    expect((await agent.post('/api/prescriptions').send(body)).status).toBe(409);
    expect((await agent.post('/api/prescriptions').send({ ...body, consultation_id: 999999 })).status).toBe(404);
  });
});

describe('reading and editing prescriptions', () => {
  const createOne = async () => {
    const data = await setup();
    const res = await (await loginAgent(data.doctor.email))
      .post('/api/prescriptions')
      .send({ consultation_id: data.consultation.id, items: [item(data.paracetamol.id), item(data.ibuprofen.id)] });
    return { ...data, prescriptionId: res.body.data.id as number };
  };

  it('lets the patient and the doctor read it, and nobody else', async () => {
    const { doctor, patient, prescriptionId } = await createOne();
    const stranger = await createPatient();

    expect((await (await loginAgent(patient.email)).get(`/api/prescriptions/${prescriptionId}`)).status).toBe(200);
    expect((await (await loginAgent(doctor.email)).get(`/api/prescriptions/${prescriptionId}`)).status).toBe(200);
    expect((await (await loginAgent(stranger.email)).get(`/api/prescriptions/${prescriptionId}`)).status).toBe(403);
  });

  it('shows the patient their prescriptions with items, and the doctor the ones they issued', async () => {
    const { doctor, patient } = await createOne();

    const mine = await (await loginAgent(patient.email)).get('/api/patients/prescriptions');
    expect(mine.body.meta.total).toBe(1);
    expect(mine.body.data[0].items).toHaveLength(2);

    const issued = await (await loginAgent(doctor.email)).get('/api/prescriptions');
    expect(issued.body.meta.total).toBe(1);
    expect(issued.body.data[0].items).toHaveLength(2);
  });

  it('replaces notes and items together when the author edits', async () => {
    const { doctor, ibuprofen, prescriptionId } = await createOne();
    const other = await createDoctor();
    const body = { notes: 'Changed', items: [item(ibuprofen.id, { duration_days: 7 })] };

    const edited = await (await loginAgent(doctor.email)).put(`/api/prescriptions/${prescriptionId}`).send(body);
    expect(edited.status).toBe(200);
    expect(edited.body.data.notes).toBe('Changed');
    expect(edited.body.data.items).toHaveLength(1);
    expect(edited.body.data.items[0].duration_days).toBe(7);

    expect((await (await loginAgent(other.email)).put(`/api/prescriptions/${prescriptionId}`).send(body)).status).toBe(403);
  });
});
