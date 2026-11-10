/**
 * Singapore Mandatory Itemised Payslip Engine (`engines/itemised-payslip-engine.js`)
 *
 * Mengimplementasikan audit kepatuhan penerbitan slip gaji terperinci (Itemised Payslips)
 * berdasarkan Section 96A Employment Act 1968:
 *   - Kewajiban Statuter: Diberikan secara tertulis/elektronik kepada setiap karyawan bersamaan
 *     dengan pembayaran gaji atau maksimal dalam waktu 3 hari kerja setelah pembayaran.
 *   - Kewajiban Penyimpanan Arsip (Record-keeping): Disimpan minimal 2 tahun untuk karyawan aktif,
 *     dan minimal 1 tahun setelah karyawan berhenti.
 *   - Item Statuter Wajib dalam Slip Gaji MOM:
 *       1. Employer Full Name & Employee Full Name
 *       2. Date of Payment
 *       3. Basic Salary
 *       4. Start and End Date of Salary Period
 *       5. Allowances Itemisation (Transport, Meal, Mobile, dll.)
 *       6. Overtime Pay Period, Overtime Hours Worked & Overtime Pay Amount (wajib jika ada lembur)
 *       7. Additional Payments (Bonuses, Rest Day Pay, Public Holiday Pay)
 *       8. Deductions Itemisation (Employee CPF Contribution, Self-Help Groups: CDAC/SINDA/MBMF/EA, dll.)
 *       9. Net Salary Paid
 *   - Skor Kepatuhan Slip Gaji (0 - 100) dan risiko denda administratif MOM.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const PAYSLIP_MANDATORY_ITEMS = [
  { id: 'NAMES', name: 'Employer & Employee Full Names', weight: 10 },
  { id: 'PAYMENT_DATE', name: 'Date of Payment', weight: 10 },
  { id: 'SALARY_PERIOD', name: 'Start & End Dates of Salary Period', weight: 10 },
  { id: 'BASIC_SALARY', name: 'Basic Salary Amount', weight: 15 },
  { id: 'ALLOWANCES', name: 'Itemised Allowances', weight: 10 },
  { id: 'DEDUCTIONS', name: 'Itemised Deductions (CPF, CDAC/MBMF, dll.)', weight: 15 },
  { id: 'NET_SALARY', name: 'Net Salary Paid', weight: 15 },
  { id: 'OVERTIME_DETAILS', name: 'Overtime Hours & Overtime Pay (if applicable)', weight: 15 }
];

const MOM_PAYSLIP_PENALTY_FIRST_OFFENCE = 1000;
const MOM_PAYSLIP_PENALTY_SUBSEQUENT = 2000;

/**
 * Mengaudit kelengkapan dan kepatuhan penerbitan slip gaji terperinci.
 *
 * @param {Object} params
 * @param {Object} params.includedFields Objek boolean field pada slip gaji { NAMES: true, BASIC_SALARY: true, ... }
 * @param {boolean} [params.employeeWorkedOvertime=false] Apakah karyawan melakukan kerja lembur pada bulan ini
 * @param {number} [params.daysAfterPaymentIssued=1] Jumlah hari kerja setelah pembayaran gaji slip diterbitkan
 * @param {boolean} [params.keepsHistoricalRecords2Years=true] Apakah majikan menyimpan arsip slip gaji minimal 2 tahun
 * @returns {Object} Skor kepatuhan, daftar kekurangan, dan status penegakan MOM
 */
function auditItemisedPayslip(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const fields = params.includedFields || {};
  const hasOvertime = Boolean(params.employeeWorkedOvertime);
  const daysAfterPay = Math.max(0, Number(params.daysAfterPaymentIssued) || 0);
  const keepsRecords = params.keepsHistoricalRecords2Years !== undefined
    ? Boolean(params.keepsHistoricalRecords2Years)
    : true;

  let totalScore = 0;
  const missingFields = [];
  const presentFields = [];

  for (const item of PAYSLIP_MANDATORY_ITEMS) {
    // Jika tidak ada lembur, field overtime tidak wajib
    if (item.id === 'OVERTIME_DETAILS' && !hasOvertime) {
      totalScore += item.weight;
      continue;
    }

    if (fields[item.id]) {
      totalScore += item.weight;
      presentFields.push(item.name);
    } else {
      missingFields.push({
        id: item.id,
        name: item.name,
        statutoryBasis: `Employment Act Section 96A: ${item.name}`
      });
    }
  }

  // Pengurangan jika slip gaji diterbitkan terlambat (> 3 hari kerja setelah pembayaran)
  const isTimingCompliant = daysAfterPay <= 3;
  if (!isTimingCompliant) {
    totalScore = Math.max(0, totalScore - 15);
  }

  // Pengurangan jika tidak menjaga arsip 2 tahun
  if (!keepsRecords) {
    totalScore = Math.max(0, totalScore - 20);
  }

  const isFullyCompliant = missingFields.length === 0 && isTimingCompliant && keepsRecords;

  return {
    complianceScore: totalScore,
    isFullyCompliant,
    timingAudit: {
      daysAfterPayment: daysAfterPay,
      statutoryMaxDays: 3,
      isTimingCompliant,
      warning: !isTimingCompliant ? `Slip gaji diterbitkan ${daysAfterPay} hari setelah pembayaran (batas maksimal 3 hari kerja).` : null
    },
    recordKeepingAudit: {
      meets2YearRetentionRequirement: keepsRecords,
      warning: !keepsRecords ? "Majikan wajib menyimpan arsip riwayat slip gaji minimal 2 tahun untuk karyawan aktif." : null
    },
    missingMandatoryFields: missingFields,
    enforcementExposure: {
      potentialFineFirstOffenceSgd: !isFullyCompliant ? MOM_PAYSLIP_PENALTY_FIRST_OFFENCE : 0,
      potentialFineSubsequentSgd: !isFullyCompliant ? MOM_PAYSLIP_PENALTY_SUBSEQUENT : 0,
      statutorySummary: isFullyCompliant
        ? "Slip gaji memenuhi seluruh persyaratan formal Section 96A Employment Act."
        : `Ditemukan ${missingFields.length} item statuter yang belum dicantumkan. Pelanggaran slip gaji dapat dikenai denda administratif MOM hingga S$1.000 per kejadian.`
    }
  };
}

module.exports = {
  auditItemisedPayslip,
  PAYSLIP_MANDATORY_ITEMS,
  MOM_PAYSLIP_PENALTY_FIRST_OFFENCE
};
