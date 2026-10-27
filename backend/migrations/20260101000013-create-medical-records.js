'use strict';

// Table order across the migration files follows foreign-key dependencies.
// Raw DDL is used on purpose: generated columns and CHECK constraints are not expressible through queryInterface.createTable.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE medical_records (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        patient_id INT UNSIGNED NOT NULL,
        doctor_id INT UNSIGNED NOT NULL,
        title VARCHAR(200) NOT NULL,
        record_type ENUM('LAB_REPORT','IMAGING','VACCINATION','ALLERGY','PROCEDURE','OTHER') NOT NULL,
        description TEXT NOT NULL,
        record_date DATE NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_medical_records_patient (patient_id, record_date),
        KEY idx_medical_records_doctor (doctor_id),
        CONSTRAINT fk_medical_records_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_medical_records_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('medical_records');
  },
};
