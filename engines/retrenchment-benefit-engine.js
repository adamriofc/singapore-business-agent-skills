/**
 * Singapore Retrenchment Benefit & MOM Notification Engine (`engines/retrenchment-benefit-engine.js`)
 *
 * Mengimplementasikan kalkulasi pesangon pemutusan hubungan kerja (Retrenchment Benefit) dan
 * evaluasi kewajiban pelaporan wajib MOM berdasarkan Tripartite Advisory on Managing Excess Manpower
 * and Responsible Retrenchment serta Employment Act 1968:
 *   - Periode Kelayakan Statuter: Minimal 2 tahun masa kerja berkelanjutan untuk berhak menuntut kompensasi.
 *   - Norma Pembayaran Tripartit (Tripartite Norm): 2 minggu (0.5 bulan) hingga 1 bulan gaji per tahun masa kerja.
 *   - Kewajiban Pelaporan Wajib MOM (Mandatory Retrenchment Notification):
 *       * Berlaku bagi perusahaan dengan total tenaga kerja >= 10 orang.
 *       * Terpicu jika mem-PHK 5 karyawan atau lebih dalam kurun waktu 6 bulan bergulir.
 *       * Wajib dilaporkan ke MOM secara online dalam waktu 5 hari kerja sejak karyawan diberitahu.
 *       * Sanksi denda administratif hingga S$5.000 per pelanggaran.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const STATUTORY_MIN_YEARS_FOR_RETRENCHMENT = 2; // Syarat minimal 2 tahun kerja
const MOM_MANDATORY_NOTIF_EMPLOYEE_COUNT_MIN = 10;
const MOM_MANDATORY_NOTIF_RETRENCHED_COUNT_MIN = 5;
const MOM_NOTIF_DEADLINE_WORKING_DAYS = 5;

/**
 * Menghitung kompensasi retrenchment benefit dan mengevaluasi kewajiban lapor MOM.
 *
 * @param {Object} params
 * @param {number} params.monthlySalarySgd Gaji bulanan karyawan
 * @param {number} params.yearsOfService Masa kerja karyawan dalam tahun
 * @param {number} [params.benefitWeeksPerYear=4] Norma pembayaran per tahun masa kerja (2 s/d 4.33 minggu; default 4 minggu ~ 1 bulan)
 * @param {Object} [params.companyContext] Konteks perusahaan untuk kewajiban lapor MOM
 * @param {number} [params.companyContext.totalCompanyHeadcount=15] Total jumlah karyawan perusahaan
 * @param {number} [params.companyContext.retrenchedIn6Months=1] Total karyawan yang di-PHK dalam 6 bulan terakhir
 * @returns {Object} Rincian perhitungan pesangon retrenchment dan status kepatuhan MOM
 */
function calculateRetrenchmentBenefit(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const salary = Math.max(0, Number(params.monthlySalarySgd) || 0);
  const years = Math.max(0, Number(params.yearsOfService) || 0);
  const weeksPerYear = Math.max(1, Number(params.benefitWeeksPerYear) || 4); // 4 minggu ~ 1 bulan gaji

  const isStatutorilyEligible = years >= STATUTORY_MIN_YEARS_FOR_RETRENCHMENT;

  // Konversi gaji bulanan ke mingguan (standar MOM: (12 * monthlySalary) / 52)
  const weeklySalary = Number(((12 * salary) / 52).toFixed(2));
  const benefitPerYearSgd = Number((weeklySalary * weeksPerYear).toFixed(2));

  let totalRetrenchmentBenefitSgd = 0;
  if (isStatutorilyEligible) {
    totalRetrenchmentBenefitSgd = Number((benefitPerYearSgd * years).toFixed(2));
  }

  // Evaluasi Kewajiban Lapor Wajib ke MOM (Mandatory Retrenchment Notification)
  const companyContext = params.companyContext || {};
  const totalHeadcount = Math.max(0, Number(companyContext.totalCompanyHeadcount) || 0);
  const retrenchedCount = Math.max(1, Number(companyContext.retrenchedIn6Months) || 1);

  const isMandatoryNotificationTriggered =
    totalHeadcount >= MOM_MANDATORY_NOTIF_EMPLOYEE_COUNT_MIN &&
    retrenchedCount >= MOM_MANDATORY_NOTIF_RETRENCHED_COUNT_MIN;

  return {
    employeeBenefit: {
      monthlySalarySgd: salary,
      yearsOfService: years,
      isStatutorilyEligible,
      minStatutoryYearsRequired: STATUTORY_MIN_YEARS_FOR_RETRENCHMENT,
      weeklySalarySgd: weeklySalary,
      formulaUsed: `${weeksPerYear} minggu gaji (${(weeksPerYear / 4.33).toFixed(2)} bulan) per tahun masa kerja`,
      totalBenefitPayableSgd: totalRetrenchmentBenefitSgd,
      eligibilityNote: isStatutorilyEligible
        ? "Karyawan memenuhi kualifikasi statuter Tripartit MOM untuk menerima manfaat retrenchment."
        : "Masa kerja kurang dari 2 tahun; pemberian kompensasi bersifat diskresi murni perusahaan (ex-gratia)."
    },
    momNotification: {
      isMandatory: isMandatoryNotificationTriggered,
      reportingDeadlineWorkingDays: MOM_NOTIF_DEADLINE_WORKING_DAYS,
      criteria: {
        companyHeadcount: totalHeadcount,
        minHeadcountRequired: MOM_MANDATORY_NOTIF_EMPLOYEE_COUNT_MIN,
        retrenchedIn6Months: retrenchedCount,
        minRetrenchedCountTrigger: MOM_MANDATORY_NOTIF_RETRENCHED_COUNT_MIN
      },
      statutoryComplianceAction: isMandatoryNotificationTriggered
        ? "WAJIB: Perusahaan harus menyampaikan notifikasi retrenchment resmi ke MOM dalam 5 hari kerja sejak pemberitahuan diberikan kepada karyawan."
        : "TIDAK WAJIB: Jumlah karyawan terimbas belum memenuhi ambang batas wajib pelaporan MOM."
    }
  };
}

module.exports = {
  calculateRetrenchmentBenefit,
  STATUTORY_MIN_YEARS_FOR_RETRENCHMENT,
  MOM_MANDATORY_NOTIF_EMPLOYEE_COUNT_MIN,
  MOM_MANDATORY_NOTIF_RETRENCHED_COUNT_MIN
};
