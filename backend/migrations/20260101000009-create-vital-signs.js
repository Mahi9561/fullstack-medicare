'use strict';

// Table order across the migration files follows foreign-key dependencies.
// Raw DDL is used on purpose: generated columns and CHECK constraints are not expressible through queryInterface.createTable.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE vital_signs (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        appointment_id INT UNSIGNED NOT NULL,
        patient_id INT UNSIGNED NOT NULL,
        doctor_id INT UNSIGNED NOT NULL,
        bp_systolic SMALLINT UNSIGNED NULL,
        bp_diastolic SMALLINT UNSIGNED NULL,
        heart_rate SMALLINT UNSIGNED NULL,
        temperature_f DECIMAL(4,1) NULL,
        weight_kg DECIMAL(5,2) NULL,
        height_cm DECIMAL(5,1) NULL,
        spo2 TINYINT UNSIGNED NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_vital_signs_appointment (appointment_id),
        KEY idx_vital_signs_patient (patient_id, created_at),
        CONSTRAINT fk_vital_signs_appointment FOREIGN KEY (appointment_id) REFERENCES appointments (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_vital_signs_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_vital_signs_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT chk_vital_signs_spo2 CHECK (spo2 IS NULL OR spo2 BETWEEN 0 AND 100)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('vital_signs');
  },
};
