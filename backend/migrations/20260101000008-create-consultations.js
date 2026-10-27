'use strict';

// Table order across the migration files follows foreign-key dependencies.
// Raw DDL is used on purpose: generated columns and CHECK constraints are not expressible through queryInterface.createTable.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE consultations (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        appointment_id INT UNSIGNED NOT NULL,
        patient_id INT UNSIGNED NOT NULL,
        doctor_id INT UNSIGNED NOT NULL,
        symptoms TEXT NOT NULL,
        diagnosis TEXT NOT NULL,
        notes TEXT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_consultations_appointment (appointment_id),
        KEY idx_consultations_patient (patient_id, created_at),
        KEY idx_consultations_doctor (doctor_id, created_at),
        CONSTRAINT fk_consultations_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_consultations_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_consultations_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE RESTRICT ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('consultations');
  },
};
