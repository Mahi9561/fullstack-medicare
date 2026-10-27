import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { Role } from '../config/constants';

export interface TokenPayload {
  sub: number;
  role: Role;
}

export const signToken = (payload: TokenPayload): string =>
  jwt.sign({ role: payload.role }, env.JWT_SECRET, {
    subject: String(payload.sub),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });

export const verifyToken = (token: string): TokenPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
  const sub = Number(decoded.sub);
  if (!Number.isInteger(sub)) throw new Error('Malformed token subject');
  return { sub, role: decoded.role as Role };
};

const UNIT_MS: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };

/** "30m" -> 1800000. Used so the cookie lives exactly as long as the token. */
export const durationToMs = (value: string): number => {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error(`Invalid duration: ${value}`);
  return Number(match[1]) * UNIT_MS[match[2]];
};
