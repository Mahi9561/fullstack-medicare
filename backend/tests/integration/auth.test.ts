import request from 'supertest';
import { app } from '../../src/app';
import { AuditLog, Patient, User } from '../../src/models';
import { loginAgent } from '../helpers/auth';
import { resetDatabase } from '../helpers/db';
import { createPatient } from '../helpers/factories';

const validRegistration = {
  email: 'new.patient@test.local',
  password: 'Secret123',
  first_name: 'Nina',
  last_name: 'Shah',
  date_of_birth: '1992-03-14',
  gender: 'FEMALE',
  phone: '+91 98765 43210',
};

beforeEach(resetDatabase);

describe('registration', () => {
  it('creates a user and a patient profile', async () => {
    const res = await request(app).post('/api/auth/register').send(validRegistration);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toMatchObject({ email: validRegistration.email, role: 'PATIENT', status: 'ACTIVE' });
    expect(res.body.data.profile).toMatchObject({ first_name: 'Nina', last_name: 'Shah' });
    expect(await Patient.count()).toBe(1);
    expect(await AuditLog.count({ where: { action: 'REGISTER' } })).toBe(1);
  });

  it('never returns or stores the plain password', async () => {
    const res = await request(app).post('/api/auth/register').send(validRegistration);
    const stored = await User.unscoped().findOne({ where: { email: validRegistration.email } });

    expect(JSON.stringify(res.body)).not.toMatch(/password/i);
    expect(stored?.password_hash).toMatch(/^\$2[aby]\$/);
    expect(stored?.password_hash).not.toBe(validRegistration.password);
  });

  it('ignores a role sent in the body: public registration is always PATIENT', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validRegistration, role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('PATIENT');
  });

  it('rejects a duplicate email with 409', async () => {
    await createPatient({ email: validRegistration.email });
    const res = await request(app).post('/api/auth/register').send(validRegistration);

    expect(res.status).toBe(409);
    expect(res.body).toEqual({ success: false, message: 'Email is already registered' });
  });

  it('reports every invalid field with a 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validRegistration, email: 'not-an-email', password: 'short', gender: 'ROBOT' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['email', 'password', 'gender']));
  });

  it('rejects a date of birth in the future', async () => {
    const res = await request(app).post('/api/auth/register').send({ ...validRegistration, date_of_birth: '2999-01-01' });

    expect(res.status).toBe(400);
    expect(res.body.errors[0].field).toBe('date_of_birth');
  });
});

describe('login', () => {
  it('sets an httpOnly session cookie and returns the session', async () => {
    const { email, password } = await createPatient();
    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ email, role: 'PATIENT' });
    expect(res.body.data.profile).toBeTruthy();
    const cookie = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookie).toMatch(/access_token=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(res.body.token).toBeUndefined();
  });

  it('logs the login in the audit trail', async () => {
    const { email, password, user } = await createPatient();
    await request(app).post('/api/auth/login').send({ email, password });

    expect(await AuditLog.count({ where: { action: 'LOGIN', user_id: user.id } })).toBe(1);
  });
});

describe('invalid login', () => {
  it('rejects a wrong password with 401 and no cookie', async () => {
    const { email } = await createPatient();
    const res = await request(app).post('/api/auth/login').send({ email, password: 'WrongPass1' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Invalid email or password' });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('gives the same answer for an unknown email, so emails cannot be enumerated', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@test.local', password: 'Whatever1' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password');
  });

  it('rejects a malformed body with 400', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'nope' });

    expect(res.status).toBe(400);
  });

  it('blocks a deactivated account even with the right password', async () => {
    const { email, password } = await createPatient({ status: 'INACTIVE' });
    const res = await request(app).post('/api/auth/login').send({ email, password });

    expect(res.status).toBe(403);
    expect(res.headers['set-cookie']).toBeUndefined();
  });
});

describe('protected routes', () => {
  it('returns 401 without a session', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('returns the current user with a valid session', async () => {
    const { email } = await createPatient();
    const agent = await loginAgent(email);
    const res = await agent.get('/api/auth/me');

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });

  it('rejects a forged or tampered token', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', 'access_token=not.a.real-token');

    expect(res.status).toBe(401);
  });

  it('ends the session on logout', async () => {
    const { email } = await createPatient();
    const agent = await loginAgent(email);

    expect((await agent.post('/api/auth/logout')).status).toBe(200);
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });

  it('stops honoring a token as soon as the account is deactivated', async () => {
    const { email, user } = await createPatient();
    const agent = await loginAgent(email);
    await user.update({ status: 'INACTIVE' });

    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});
