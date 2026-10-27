'use strict';

// [name, description, is_active]
const MEDICATIONS = [
  ['Paracetamol 500 mg', 'Pain relief and fever reduction', true],
  ['Ibuprofen 400 mg', 'Anti-inflammatory pain relief', true],
  ['Diclofenac 50 mg', 'Anti-inflammatory for joint and muscle pain', true],
  ['Amoxicillin 500 mg', 'Penicillin-type antibiotic', true],
  ['Azithromycin 500 mg', 'Macrolide antibiotic for chest and throat infections', true],
  ['Cefixime 200 mg', 'Cephalosporin antibiotic', true],
  ['Metronidazole 400 mg', 'Antibiotic for gut and dental infections', true],
  ['Cetirizine 10 mg', 'Antihistamine for allergies', true],
  ['Montelukast 10 mg', 'Asthma and allergy control', true],
  ['Salbutamol inhaler 100 mcg', 'Quick-relief inhaler for wheezing', true],
  ['Omeprazole 20 mg', 'Reduces stomach acid', true],
  ['Pantoprazole 40 mg', 'Reduces stomach acid, longer acting', true],
  ['Ondansetron 4 mg', 'Controls nausea and vomiting', true],
  ['ORS sachet', 'Oral rehydration salts', true],
  ['Metformin 500 mg', 'First-line treatment for type 2 diabetes', true],
  ['Amlodipine 5 mg', 'Lowers blood pressure', true],
  ['Losartan 50 mg', 'Lowers blood pressure and protects the kidneys', true],
  ['Atorvastatin 10 mg', 'Lowers cholesterol', true],
  ['Aspirin 75 mg', 'Low-dose blood thinner', true],
  ['Clopidogrel 75 mg', 'Blood thinner after heart events', true],
  ['Prednisolone 10 mg', 'Corticosteroid for inflammation', true],
  ['Levothyroxine 50 mcg', 'Thyroid hormone replacement', true],
  ['Vitamin D3 60000 IU', 'Weekly vitamin D supplement', true],
  ['Iron and folic acid', 'Supplement for anemia', true],
  ['Rofecoxib 25 mg', 'Withdrawn from the market. Kept inactive so old records stay readable.', false],
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'medications',
      MEDICATIONS.map(([name, description, is_active]) => ({ name, description, is_active })),
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('medications', null, {});
  },
};
