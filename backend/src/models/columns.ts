import { DataTypes, type Model, type ModelAttributeColumnOptions } from 'sequelize';

/** MySQL returns TIME as "HH:mm:ss"; the API speaks "HH:mm". */
export const timeColumn = (field: string, allowNull = false): ModelAttributeColumnOptions => ({
  type: DataTypes.TIME,
  allowNull,
  get(this: Model): unknown {
    const raw = this.getDataValue(field as never) as unknown;
    return typeof raw === 'string' ? raw.slice(0, 5) : raw;
  },
});

/** mysql2 returns DECIMAL as a string to avoid float rounding; the API wants numbers. */
export const decimalColumn = (field: string, precision: number, scale: number, allowNull = false): ModelAttributeColumnOptions => ({
  type: DataTypes.DECIMAL(precision, scale),
  allowNull,
  get(this: Model): unknown {
    const raw = this.getDataValue(field as never) as unknown;
    return raw === null || raw === undefined ? raw : Number(raw);
  },
});
