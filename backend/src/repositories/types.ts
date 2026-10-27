import type { Transaction } from 'sequelize';

/** Optional transaction handed down from a service. Repositories never open transactions themselves. */
export interface Tx {
  transaction?: Transaction;
}

export interface Paging {
  limit: number;
  offset: number;
}
