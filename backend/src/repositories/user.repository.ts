import type { CreationAttributes } from 'sequelize';
import type { UserStatus } from '../config/constants';
import { Doctor, Patient, User } from '../models';
import type { Tx } from './types';

const profileIncludes = [
  { model: Patient, as: 'patient', required: false },
  { model: Doctor, as: 'doctor', required: false },
];

export const userRepository = {
  findByIdWithProfiles: (id: number) => User.findByPk(id, { include: profileIncludes }),

  findById: (id: number, tx: Tx = {}) => User.findByPk(id, tx),

  /** The only query that returns password_hash (the default scope strips it everywhere else). */
  findByEmailWithPassword: (email: string) => User.unscoped().findOne({ where: { email }, include: profileIncludes }),

  emailExists: async (email: string, tx: Tx = {}) => (await User.count({ where: { email }, ...tx })) > 0,

  create: (values: CreationAttributes<User>, tx: Tx = {}) => User.create(values, tx),

  setStatus: (user: User, status: UserStatus, tx: Tx = {}) => user.update({ status }, tx),
};
