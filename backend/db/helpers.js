'use strict';

// Shared by the seeders. Lives outside seeders/ because sequelize-cli would try to run every file in that folder.
const bcrypt = require('bcrypt');
const { QueryTypes } = require('sequelize');

const hash = (plain) => bcrypt.hashSync(plain, 10);

/** INSERT one row and return its auto-increment id. */
async function insert(queryInterface, table, row) {
  const columns = Object.keys(row);
  const [id] = await queryInterface.sequelize.query(
    `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((c) => `:${c}`).join(', ')})`,
    { replacements: row, type: QueryTypes.INSERT },
  );
  return id;
}

function select(queryInterface, sql, replacements = {}) {
  return queryInterface.sequelize.query(sql, { replacements, type: QueryTypes.SELECT });
}

const pad = (n) => String(n).padStart(2, '0');
const toDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Local date `days` from today, as YYYY-MM-DD. */
function dateOffset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toDate(d);
}

/** First Monday-to-Friday date that is at least `minDays` from today. */
function nextWeekday(minDays) {
  const d = new Date();
  d.setDate(d.getDate() + minDays);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  return toDate(d);
}

module.exports = { hash, insert, select, dateOffset, nextWeekday };
