'use strict';

// Table order across the migration files follows foreign-key dependencies.
// Raw DDL is used on purpose: generated columns and CHECK constraints are not expressible through queryInterface.createTable.
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE TABLE appointments (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        patient_id INT UNSIGNED NOT NULL,
        doctor_id INT UNSIGNED NOT NULL,
        appointment_date DATE NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        status ENUM('BOOKED','CONFIRMED','COMPLETED','CANCELLED','NO_SHOW') NOT NULL DEFAULT 'BOOKED',
        reason VARCHAR(500) NOT NULL,
        cancellation_reason VARCHAR(500) NULL,
        active_slot TINYINT GENERATED ALWAYS AS (IF(status IN ('BOOKED','CONFIRMED','COMPLETED'), 1, NULL)) STORED,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uq_doctor_slot (doctor_id, appointment_date, start_time, active_slot),
        KEY idx_appointments_patient_date (patient_id, appointment_date),
        KEY idx_appointments_date_status (appointment_date, status),
        CONSTRAINT fk_appointments_patient FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_appointments_doctor FOREIGN KEY (doctor_id) REFERENCES doctors (id) ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT chk_appointment_times CHECK (end_time > start_time)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('appointments');
  },
};
