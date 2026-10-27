import type { PageMeta, PageParams } from '../types';

export const offsetOf = ({ page, limit }: PageParams): number => (page - 1) * limit;

export const buildMeta = ({ page, limit }: PageParams, total: number): PageMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
