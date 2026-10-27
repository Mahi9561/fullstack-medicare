import { sequelize } from '../config/database';
import { ConflictError, ForbiddenError, UnauthorizedError } from '../errors';
import type { User } from '../models';
import { doctorRepository } from '../repositories/doctor.repository';
import { patientRepository } from '../repositories/patient.repository';
import { userRepository } from '../repositories/user.repository';
import type { Actor } from '../types';
import { signToken } from '../utils/jwt';
import { DUMMY_HASH, hashPassword, verifyPassword } from '../utils/password';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';
import { auditService } from './audit.service';
import { toOwnDoctor } from './mappers';

/** The shape of GET /auth/me and of a successful login. */
const buildSession = async (user: User) => {
  let profile: unknown = null;
  if (user.role === 'PATIENT') {
    profile = user.patient ?? null;
  } else if (user.role === 'DOCTOR' && user.doctor) {
    const doctor = await doctorRepository.findDetailById(user.doctor.id);
    profile = doctor ? toOwnDoctor(doctor) : null;
  }
  return { user: { id: user.id, email: user.email, role: user.role, status: user.status }, profile };
};

export const authService = {
  /** Public registration always creates a PATIENT. The role is never read from the request. */
  async register(input: RegisterInput, ip: string | null) {
    // Hash before opening the transaction so the DB connection is not held during the slow bcrypt call.
    const password_hash = await hashPassword(input.password);

    const userId = await sequelize.transaction(async (t) => {
      if (await userRepository.emailExists(input.email, { transaction: t })) {
        throw new ConflictError('Email is already registered');
      }
      const user = await userRepository.create({ email: input.email, password_hash, role: 'PATIENT' }, { transaction: t });
      const patient = await patientRepository.create(
        {
          user_id: user.id,
          first_name: input.first_name,
          last_name: input.last_name,
          date_of_birth: input.date_of_birth,
          gender: input.gender,
          phone: input.phone,
          address: input.address,
          emergency_contact: input.emergency_contact,
        },
        { transaction: t },
      );
      await auditService.log({ userId: user.id, ip }, 'REGISTER', { entityType: 'patient', entityId: patient.id }, t);
      return user.id;
    });

    const created = await userRepository.findByIdWithProfiles(userId);
    if (!created) throw new Error('User disappeared right after registration');
    return buildSession(created);
  },

  async login(input: LoginInput, ip: string | null) {
    const user = await userRepository.findByEmailWithPassword(input.email);
    // Always run one bcrypt comparison, even for unknown emails, so timing does not reveal which emails exist.
    const passwordOk = await verifyPassword(input.password, user?.password_hash ?? DUMMY_HASH);
    if (!user || !passwordOk) throw new UnauthorizedError('Invalid email or password');
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenError('This account has been deactivated. Please contact the clinic administrator.');
    }

    await auditService.log({ userId: user.id, ip }, 'LOGIN');
    return { token: signToken({ sub: user.id, role: user.role }), session: await buildSession(user) };
  },

  async me(actor: Actor) {
    const user = await userRepository.findByIdWithProfiles(actor.userId);
    if (!user) throw new UnauthorizedError('Account not found');
    return buildSession(user);
  },

  async logout(actor: Actor) {
    await auditService.log(actor, 'LOGOUT');
  },
};
