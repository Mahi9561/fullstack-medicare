import type { CookieOptions } from 'express';
import { COOKIE_NAME } from '../config/constants';
import { env, isProduction } from '../config/env';
import { authService } from '../services/auth.service';
import { getActor } from '../utils/actor';
import { sendCreated, sendSuccess } from '../utils/apiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { durationToMs } from '../utils/jwt';

// httpOnly: scripts (and therefore XSS) cannot read the token. SameSite=Lax: it is not sent on cross-site POSTs.
const baseCookie: CookieOptions = { httpOnly: true, sameSite: 'lax', secure: isProduction, path: '/' };

export const authController = {
  register: asyncHandler(async (req, res) => {
    const session = await authService.register(req.body, req.ip ?? null);
    sendCreated(res, session, 'Registration successful. You can now log in.');
  }),

  login: asyncHandler(async (req, res) => {
    const { token, session } = await authService.login(req.body, req.ip ?? null);
    res.cookie(COOKIE_NAME, token, { ...baseCookie, maxAge: durationToMs(env.JWT_EXPIRES_IN) });
    sendSuccess(res, session, 'Login successful');
  }),

  logout: asyncHandler(async (req, res) => {
    await authService.logout(getActor(req));
    res.clearCookie(COOKIE_NAME, baseCookie);
    sendSuccess(res, null, 'Logged out');
  }),

  me: asyncHandler(async (req, res) => {
    sendSuccess(res, await authService.me(getActor(req)));
  }),
};
