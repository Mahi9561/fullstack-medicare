'use strict';

// Table order across the migration files follows foreign-key dependencies.
// Raw DDL is used on purpose: generated columns and CHECK constraints are not expressible through queryInterface.createTable.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE doctors (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        user_id INT UNSIGNED NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        specialization VARCHAR(100) NOT NULL,
        qualification VARCHAR(255) NOT NULL,
        experience_years TINYINT UNSIGNED NOT NULL DEFAULT 0,
        consultation_fee DECIMAL(10,2) NOT NULL,
        bio TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_doctors_user (user_id),
        KEY idx_doctors_specialization (specialization),
        KEY idx_doctors_name (last_name, first_name),
        CONSTRAINT fk_doctors_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('doctors');
  },
};
