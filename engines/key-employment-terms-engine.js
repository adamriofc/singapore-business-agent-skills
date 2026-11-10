/**
 * Singapore Key Employment Terms (KETs) Compliance Engine (`engines/key-employment-terms-engine.js`)
 *
 * Mengimplementasikan audit kepatuhan penerbitan dokumen Key Employment Terms (KETs) berdasarkan
 * Section 95A Employment Act 1968:
 *   - Kewajiban Statuter: Diberikan secara tertulis dalam waktu 14 hari sejak tanggal mulai kerja
 *     kepada seluruh karyawan yang bekerja berkelanjutan minimal 14 hari.
 *   - 14 Item Statuter Wajib MOM:
 *       1. Employer Full Name & Employee Full Name
 *       2. Job Title & Main Duties
 *       3. Start Date of Employment
 *       4. Duration of Employment (if on fixed-term contract)
 *       5. Daily Working Hours, Number of Working Days & Rest Days
 *       6. Salary Period
 *       7. Basic Rate of Pay
 *       8. Fixed Allowances
 *       9. Fixed Deductions
 *       10. Overtime Payment Period & Overtime Rate of Pay
 *       11. Other Salary-Related Components (e.g. Bonuses, Incentives)
 *       12. Types of Leaves (Annual, Sick, Hospitalisation, Maternity/Paternity)
 *       13. Other Medical Benefits
 *       14. Notice Period for Termination of Employment
 *   - Skor Kepatuhan KETs (0 - 100) dan estimasi eksposur sanksi MOM.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const STATUTORY_KETS_MANDATORY_ITEMS = [
  { id: 'EMPLOYER_EMPLOYEE_NAMES', name: 'Employer & Employee Full Names', weight: 8 },
  { id: 'JOB_TITLE_DUTIES', name: 'Job Title & Main Duties', weight: 7 },
  { id: 'START_DATE', name: 'Employment Start Date', weight: 7 },
  { id: 'EMPLOYMENT_DURATION', name: 'Contract Duration (or Permanent status)', weight: 7 },
  { id: 'HOURS_DAYS_REST', name: 'Working Hours, Working Days per Week & Rest Days', weight: 8 },
  { id: 'SALARY_PERIOD', name: 'Salary Period (e.g. Monthly / Fortnightly)', weight: 7 },
  { id: 'BASIC_PAY', name: 'Basic Rate of Pay', weight: 10 },
  { id: 'FIXED_ALLOWANCES', name: 'Fixed Allowances Itemisation', weight: 7 },
  { id: 'FIXED_DEDUCTIONS', name: 'Fixed Deductions Itemisation', weight: 7 },
  { id: 'OVERTIME_RATE', name: 'Overtime Payment Period & Rate of Pay', weight: 8 },
  { id: 'OTHER_BONUS_INCENTIVE', name: 'Other Salary-Related Components', weight: 6 },
  { id: 'STATUTORY_LEAVES', name: 'Types of Paid Leave Entitlements', weight: 8 },
  { id: 'MEDICAL_BENEFITS', name: 'Medical & Healthcare Benefits', weight: 5 },
  { id: 'NOTICE_PERIOD', name: 'Termination Notice Period', weight: 5 }
];

const MOM_ADMINISTRATIVE_PENALTY_FIRST_OFFENCE = 1000;  // Denda administratif pelanggaran pertama
const MOM_ADMINISTRATIVE_PENALTY_SUBSEQUENT = 2000;     // Denda perulangan

/**
 * Mengaudit kelengkapan dokumen KETs perusahaan.
 *
 * @param {Object} params
 * @param {Object} params.includedItemFlags Objek boolean yang menandai keberadaan item KETs
 *   Contoh: { EMPLOYER_EMPLOYEE_NAMES: true, BASIC_PAY: true, ... }
 * @param {number} [params.daysSinceStartOfEmployment=7] Jumlah hari sejak karyawan mulai bekerja
 * @param {boolean} [params.isWrittenDocumentProvided=true] Apakah dokumen diberikan secara tertulis/elektronik resmi
 * @returns {Object} Skor kelengkapan, item yang hilang, dan status kepatuhan hukum MOM
 */
function auditKeyEmploymentTerms(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const items = params.includedItemFlags || {};
  const daysSinceStart = Math.max(0, Number(params.daysSinceStartOfEmployment) || 0);
  const isWritten = params.isWrittenDocumentProvided !== undefined
    ? Boolean(params.isWrittenDocumentProvided)
    : true;

  let totalScore = 0;
  const missingItems = [];
  const presentItems = [];

  for (const item of STATUTORY_KETS_MANDATORY_ITEMS) {
    if (items[item.id]) {
      totalScore += item.weight;
      presentItems.push(item.name);
    } else {
      missingItems.push({
        id: item.id,
        name: item.name,
        statutoryRequirement: `Mandatori di bawah Employment Act Section 95A: ${item.name}`
      });
    }
  }

  const isTimingCompliant = daysSinceStart <= 14;
  if (!isTimingCompliant) {
    totalScore = Math.max(0, totalScore - 15);
  }
  if (!isWritten) {
    totalScore = Math.max(0, totalScore - 25);
  }

  const isFullyCompliant = missingItems.length === 0 && isTimingCompliant && isWritten;

  return {
    complianceScore: totalScore,
    isFullyCompliant,
    timingAudit: {
      daysSinceStart,
      statutoryDeadlineDays: 14,
      isTimingCompliant,
      warning: !isTimingCompliant ? `Melebihi batas waktu 14 hari sejak mulai kerja (${daysSinceStart} hari).` : null
    },
    formatAudit: {
      isWrittenDocumentProvided: isWritten,
      warning: !isWritten ? "KETs wajib diberikan dalam format tertulis atau salinan elektronik resmi." : null
    },
    itemsCount: {
      totalMandatory: STATUTORY_KETS_MANDATORY_ITEMS.length,
      presentCount: presentItems.length,
      missingCount: missingItems.length
    },
    missingMandatoryItems: missingItems,
    enforcementExposure: {
      potentialFineFirstOffenceSgd: !isFullyCompliant ? MOM_ADMINISTRATIVE_PENALTY_FIRST_OFFENCE : 0,
      potentialFineSubsequentSgd: !isFullyCompliant ? MOM_ADMINISTRATIVE_PENALTY_SUBSEQUENT : 0,
      statutoryAdvice: isFullyCompliant
        ? "Dokumen KETs lengkap dan memenuhi Section 95A Employment Act."
        : `Ditemukan ${missingItems.length} item statuter yang belum lengkap. Kegagalan menerbitkan KETs dapat dikenakan denda administratif MOM hingga S$1.000 per karyawan.`
    }
  };
}

module.exports = {
  auditKeyEmploymentTerms,
  STATUTORY_KETS_MANDATORY_ITEMS,
  MOM_ADMINISTRATIVE_PENALTY_FIRST_OFFENCE
};
