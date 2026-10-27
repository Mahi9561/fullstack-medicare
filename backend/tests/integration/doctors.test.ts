import { loginAgent, type TestAgent } from '../helpers/auth';
import { resetDatabase } from '../helpers/db';
import { createDepartment, createDoctor, createPatient, linkDoctorToDepartment } from '../helpers/factories';

let patient: TestAgent;

beforeEach(async () => {
  await resetDatabase();
  const asha = await createDoctor({ first_name: 'Asha', last_name: 'Rao', specialization: 'Cardiology' });
  await createDoctor({ first_name: 'Bela', last_name: 'Rao', specialization: 'Dermatology' });
  await createDoctor({ first_name: 'Chetan', last_name: 'Mehta', specialization: 'Cardiology' });
  await createDoctor({ first_name: 'Dev', last_name: 'Rao', specialization: 'Cardiology', status: 'INACTIVE' });
  const cardiology = await createDepartment('Cardiology');
  await linkDoctorToDepartment(asha.doctor.id, cardiology.id);
  patient = await loginAgent((await createPatient()).email);
});

const names = (body: { data: { first_name: string }[] }) => body.data.map((d) => d.first_name).sort();

describe('doctor search', () => {
  it('lists active doctors only', async () => {
    const res = await patient.get('/api/doctors');

    expect(res.status).toBe(200);
    expect(names(res.body)).toEqual(['Asha', 'Bela', 'Chetan']);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10, total: 3, totalPages: 1 });
  });

  it('searches by first name, last name or full name', async () => {
    expect(names((await patient.get('/api/doctors?search=rao')).body)).toEqual(['Asha', 'Bela']);
    expect(names((await patient.get('/api/doctors?search=chet')).body)).toEqual(['Chetan']);
    expect(names((await patient.get('/api/doctors?search=asha%20rao')).body)).toEqual(['Asha']);
  });

  it('filters by specialization', async () => {
    const res = await patient.get('/api/doctors?specialization=Cardiology');

    expect(names(res.body)).toEqual(['Asha', 'Chetan']);
  });

  it('combines search and specialization', async () => {
    const res = await patient.get('/api/doctors?search=rao&specialization=Cardiology');

    expect(names(res.body)).toEqual(['Asha']);
  });

  it('paginates in SQL and reports the total', async () => {
    const page1 = await patient.get('/api/doctors?limit=2&page=1');
    const page2 = await patient.get('/api/doctors?limit=2&page=2');

    expect(page1.body.data).toHaveLength(2);
    expect(page2.body.data).toHaveLength(1);
    expect(page2.body.meta).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('treats LIKE wildcards as plain text', async () => {
    const res = await patient.get('/api/doctors?search=%25');

    expect(res.body.data).toHaveLength(0);
  });

  it('includes departments and hides login emails', async () => {
    const res = await patient.get('/api/doctors?search=asha');

    expect(res.body.data[0].departments).toEqual([expect.objectContaining({ name: 'Cardiology' })]);
    expect(res.body.data[0]).not.toHaveProperty('email');
    expect(res.body.data[0]).not.toHaveProperty('user');
  });

  it('rejects a page size above the cap', async () => {
    expect((await patient.get('/api/doctors?limit=500')).status).toBe(400);
    expect((await patient.get('/api/doctors?page=0')).status).toBe(400);
  });

  it('returns 404 for an inactive doctor profile', async () => {
    const list = await patient.get('/api/doctors?search=asha');
    const id = list.body.data[0].id;

    expect((await patient.get(`/api/doctors/${id}`)).status).toBe(200);
    expect((await patient.get('/api/doctors/999999')).status).toBe(404);
  });
});
