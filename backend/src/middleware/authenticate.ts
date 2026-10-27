import { COOKIE_NAME } from '../config/constants';
import { UnauthorizedError } from '../errors';
import { userRepository } from '../repositories/user.repository';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyToken } from '../utils/jwt';

/**
 * Verifies the JWT cookie, then reloads the user on every request so that deactivating
 * an account takes effect immediately instead of when the token expires.
 */
export const authenticateUser = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME] as string | undefined;
  if (!token) throw new UnauthorizedError('Authentication required');

  let userId: number;
  try {
    userId = verifyToken(token).sub;
  } catch {
    throw new UnauthorizedError('Your session is invalid or has expired. Please log in again.');
  }

  const user = await userRepository.findByIdWithProfiles(userId);
  if (!user || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Your account is not active');
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    patientId: user.patient?.id ?? null,
    doctorId: user.doctor?.id ?? null,
  };
  next();
});
