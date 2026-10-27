import bcrypt from 'bcrypt';

const COST = 10;

export const hashPassword = (plain: string): Promise<string> => bcrypt.hash(plain, COST);

export const verifyPassword = (plain: string, hash: string): Promise<boolean> => bcrypt.compare(plain, hash);

/**
 * Compared against when the email is unknown, so "no such user" and "wrong password"
 * take about the same time and cannot be told apart by timing.
 */
export const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', COST);
