import type { Response } from 'express';
import type { Paginated } from '../types';

export const sendSuccess = <T>(res: Response, data: T, message = 'Success', status = 200) =>
  res.status(status).json({ success: true, message, data });

export const sendCreated = <T>(res: Response, data: T, message = 'Created') =>
  sendSuccess(res, data, message, 201);

export const sendPaginated = <T>(res: Response, result: Paginated<T>, message = 'Success') =>
  res.status(200).json({ success: true, message, data: result.items, meta: result.meta });
