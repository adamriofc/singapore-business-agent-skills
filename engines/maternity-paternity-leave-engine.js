/**
 * Singapore Maternity & Paternity Leave (CDCA) Engine (`engines/maternity-paternity-leave-engine.js`)
 *
 * Mengimplementasikan kalkulasi hak cuti melahirkan dan ayah serta penggantian dana pemerintah
 * (Government Reimbursement) berdasarkan Child Development Co-Savings Act 2001 (CDCA) dan Employment Act 1968:
 *   - Government-Paid Maternity Leave (GPML):
 *       * Total 16 minggu (112 hari kalender).
 *       * Anak ke-1 & ke-2: 8 minggu pertama ditanggung majikan (employer-paid),
 *         8 minggu berikutnya diganti pemerintah (pagu maksimal S$10.000 per 4 minggu / S$2.500 per minggu).
 *       * Anak ke-3 dan seterusnya: Seluruh 16 minggu diganti oleh pemerintah (maks S$40.000 total).
 *   - Government-Paid Paternity Leave (GPPL):
 *       * 4 minggu hak cuti ayah.
 *       * Seluruh 4 minggu diganti oleh pemerintah (pagu maksimal S$2.500 per minggu / S$10.000 total).
 *   - Kriteria Statuter Kualifikasi:
 *       * Anak berstatus Warga Negara Singapura (Singapore Citizen).
 *       * Menikah secara sah menurut hukum pada saat kelahiran anak.
 *       * Masa kerja berkelanjutan minimal 3 bulan sebelum tanggal kelahiran anak.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const CDCA_WEEKLY_GOVT_CAP_SGD = 2500; // Pagu penggantian mingguan pemerintah S$2,500
const GPML_TOTAL_WEEKS = 16;
const GPPL_TOTAL_WEEKS = 4;
const CDCA_MIN_SERVICE_MONTHS = 3;

/**
 * Menghitung hak cuti dan pembagian beban biaya (employer vs government reimbursement).
 *
 * @param {Object} params
 * @param {string} params.leaveType 'MATERNITY' (GPML) atau 'PATERNITY' (GPPL)
 * @param {number} params.monthlyGrossSalarySgd Gaji bulanan kotor karyawan
 * @param {number} [params.childOrderNumber=1] Urutan kelahiran anak (1, 2, 3+)
 * @param {number} params.monthsOfService Masa kerja karyawan sebelum persalinan (bulan)
 * @param {boolean} [params.isChildSingaporeCitizen=true] Apakah anak Warga Negara Singapura
 * @param {boolean} [params.isLawfullyMarried=true] Apakah orang tua menikah secara sah
 * @returns {Object} Rincian alokasi biaya dan hak cuti
 */
function calculateParentalLeave(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const leaveType = String(params.leaveType || 'MATERNITY').toUpperCase().trim();
  const salary = Math.max(0, Number(params.monthlyGrossSalarySgd) || 0);
  const childOrder = Math.max(1, Math.floor(Number(params.childOrderNumber) || 1));
  const monthsOfService = Math.max(0, Math.floor(Number(params.monthsOfService) || 0));
  const isCitizen = params.isChildSingaporeCitizen !== undefined ? Boolean(params.isChildSingaporeCitizen) : true;
  const isMarried = params.isLawfullyMarried !== undefined ? Boolean(params.isLawfullyMarried) : true;

  // Verifikasi Kualifikasi Statuter CDCA
  const qualifiesService = monthsOfService >= CDCA_MIN_SERVICE_MONTHS;
  const isCdcaQualifying = qualifiesService && isCitizen && isMarried;

  // Gaji mingguan riil karyawan ((12 * monthlySalary) / 52)
  const actualWeeklySalary = Number(((12 * salary) / 52).toFixed(2));

  let totalLeaveWeeks = 0;
  let employerFundedWeeks = 0;
  let governmentFundedWeeks = 0;

  if (leaveType === 'PATERNITY') {
    totalLeaveWeeks = isCdcaQualifying ? GPPL_TOTAL_WEEKS : 0;
    employerFundedWeeks = 0;
    governmentFundedWeeks = isCdcaQualifying ? GPPL_TOTAL_WEEKS : 0;
  } else {
    // MATERNITY
    totalLeaveWeeks = GPML_TOTAL_WEEKS; // Jika non-CDCA namun EA qualifying, dapat 12-16 minggu
    if (isCdcaQualifying) {
      if (childOrder <= 2) {
        employerFundedWeeks = 8;
        governmentFundedWeeks = 8;
      } else {
        // Anak ke-3 dan seterusnya
        employerFundedWeeks = 0;
        governmentFundedWeeks = 16;
      }
    } else {
      // Non-CDCA: Hanya berlaku ketentuan dasar Employment Act (8 minggu employer-paid, 4-8 minggu diskresi/unpaid)
      employerFundedWeeks = 8;
      governmentFundedWeeks = 0;
    }
  }

  // Komputasi Biaya Majikan
  const employerCostSgd = Number((actualWeeklySalary * employerFundedWeeks).toFixed(2));

  // Komputasi Penggantian Dana Pemerintah (dibatasi cap S$2,500/minggu)
  const effectiveGovtWeeklyRate = Math.min(actualWeeklySalary, CDCA_WEEKLY_GOVT_CAP_SGD);
  const governmentReimbursementSgd = Number((effectiveGovtWeeklyRate * governmentFundedWeeks).toFixed(2));

  // Selisih yang tidak diganti pemerintah jika gaji melebihi cap
  const unrecoverableWageDiffSgd = Number(((actualWeeklySalary - effectiveGovtWeeklyRate) * governmentFundedWeeks).toFixed(2));

  const totalEmployeePayout = Number((employerCostSgd + (actualWeeklySalary * governmentFundedWeeks)).toFixed(2));

  return {
    leaveType,
    childOrderNumber: childOrder,
    isCdcaQualifying,
    qualificationAudit: {
      meets3MonthsServiceRequirement: qualifiesService,
      isChildSingaporeCitizen: isCitizen,
      isLawfullyMarried: isMarried
    },
    leaveDuration: {
      totalLeaveWeeks,
      totalLeaveDays: totalLeaveWeeks * 7,
      employerFundedWeeks,
      governmentFundedWeeks
    },
    financialBreakdown: {
      employeeActualWeeklySalarySgd: actualWeeklySalary,
      employerDirectCostSgd: employerCostSgd,
      governmentReimbursementClaimSgd: governmentReimbursementSgd,
      unrecoverableExcessAboveCapSgd: unrecoverableWageDiffSgd,
      totalPaidToEmployeeSgd: totalEmployeePayout,
      weeklyStatutoryCapSgd: CDCA_WEEKLY_GOVT_CAP_SGD
    },
    statutoryAdvice: isCdcaQualifying
      ? `Perusahaan dapat mengajukan klaim penggantian dana pemerintah secara online melalui portal GPL (Government-Paid Leave) hingga S$${governmentReimbursementSgd.toLocaleString()}.`
      : "Karyawan tidak memenuhi salah satu syarat CDCA; penggantian dana pemerintah tidak dapat diklaim."
  };
}

module.exports = {
  calculateParentalLeave,
  CDCA_WEEKLY_GOVT_CAP_SGD,
  GPML_TOTAL_WEEKS,
  GPPL_TOTAL_WEEKS
};
