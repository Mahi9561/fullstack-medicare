import { Notification } from '../../src/models';
import { loginAgent } from '../helpers/auth';
import { resetDatabase } from '../helpers/db';
import { createPatient } from '../helpers/factories';

beforeEach(resetDatabase);

const notify = (userId: number, message: string, isRead = false) =>
  Notification.create({ user_id: userId, type: 'APPOINTMENT_BOOKED', message, entity_type: null, entity_id: null, is_read: isRead });

describe('notifications', () => {
  it('lists only my notifications, newest first, with an unread filter', async () => {
    const me = await createPatient();
    const someoneElse = await createPatient();
    await notify(me.user.id, 'first', true);
    await notify(me.user.id, 'second');
    await notify(someoneElse.user.id, 'not mine');
    const agent = await loginAgent(me.email);

    const all = await agent.get('/api/notifications');
    expect(all.body.data.map((n: { message: string }) => n.message)).toEqual(['second', 'first']);

    const unread = await agent.get('/api/notifications?unread=true');
    expect(unread.body.data.map((n: { message: string }) => n.message)).toEqual(['second']);
  });

  it('counts unread notifications for the bell', async () => {
    const me = await createPatient();
    await notify(me.user.id, 'a');
    await notify(me.user.id, 'b');
    await notify(me.user.id, 'c', true);

    const res = await (await loginAgent(me.email)).get('/api/notifications/unread-count');

    expect(res.body.data).toEqual({ count: 2 });
  });

  it('marks one notification as read, but only my own', async () => {
    const me = await createPatient();
    const other = await createPatient();
    const mine = await notify(me.user.id, 'mine');
    const theirs = await notify(other.user.id, 'theirs');
    const agent = await loginAgent(me.email);

    expect((await agent.patch(`/api/notifications/${mine.id}/read`)).body.data.is_read).toBe(true);
    expect((await agent.patch(`/api/notifications/${theirs.id}/read`)).status).toBe(404);
    expect((await Notification.findByPk(theirs.id))?.is_read).toBe(false);
  });

  it('marks everything as read at once', async () => {
    const me = await createPatient();
    await notify(me.user.id, 'a');
    await notify(me.user.id, 'b');
    const agent = await loginAgent(me.email);

    await agent.patch('/api/notifications/read-all');

    expect((await agent.get('/api/notifications/unread-count')).body.data.count).toBe(0);
  });
});
