import { Op, Sequelize, type WhereOptions } from 'sequelize';

/** Escapes LIKE wildcards so a search for "50%" matches the text, not everything. */
export const escapeLike = (value: string): string => value.replace(/[\\%_]/g, '\\$&');

/** Matches "first", "last" or "first last" against a model that has first_name and last_name. */
export const nameSearch = (modelName: string, term: string): WhereOptions => {
  const pattern = `%${escapeLike(term.trim())}%`;
  return Sequelize.where(
    Sequelize.fn('CONCAT', Sequelize.col(`${modelName}.first_name`), ' ', Sequelize.col(`${modelName}.last_name`)),
    { [Op.like]: pattern },
  );
};

export const likeContains = (term: string) => ({ [Op.like]: `%${escapeLike(term.trim())}%` });

/** Combines optional conditions with AND. Returns undefined when there are none, so no empty WHERE is built. */
export const andWhere = (conditions: WhereOptions[]): WhereOptions | undefined =>
  conditions.length ? { [Op.and]: conditions } : undefined;
