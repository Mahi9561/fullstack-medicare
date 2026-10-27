import request from 'supertest';
import { app } from '../../src/app';
import { PASSWORD } from './factories';

export type TestAgent = ReturnType<typeof request.agent>;

/** A Supertest agent that has logged in, so it carries the httpOnly session cookie like a browser would. */
export const loginAgent = async (email: string, password: string = PASSWORD): Promise<TestAgent> => {
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/login').send({ email, password });
  if (res.status !== 200) {
    throw new Error(`Test login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return agent;
};
