'use strict';

// Table order across the migration files follows foreign-key dependencies.
// Raw DDL is used on purpose: generated columns and CHECK constraints are not expressible through queryInterface.createTable.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE prescription_items (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        prescription_id INT UNSIGNED NOT NULL,
        medication_id INT UNSIGNED NOT NULL,
        dosage VARCHAR(100) NOT NULL,
        frequency VARCHAR(100) NOT NULL,
        duration_days SMALLINT UNSIGNED NOT NULL,
        instructions VARCHAR(255) NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_prescription_medication (prescription_id, medication_id),
        KEY idx_prescription_items_medication (medication_id),
        CONSTRAINT fk_prescription_items_prescription FOREIGN KEY (prescription_id) REFERENCES prescriptions (id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_prescription_items_medication FOREIGN KEY (medication_id) REFERENCES medications (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prescription_items');
  },
};
