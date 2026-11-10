/**
 * Singapore Statutory Annual Leave Entitlement Engine (`engines/annual-leave-engine.js`)
 *
 * Mengimplementasikan kalkulasi cuti tahunan statuter berdasarkan Employment Act 1968
 * (khususnya Part IV, Section 43):
 *   - Hak Cuti Tahunan Minimal berdasarkan Masa Kerja (Years of Service):
 *       * Tahun ke-1: 7 hari kerja
 *       * Tahun ke-2: 8 hari kerja
 *       * Tahun ke-3: 9 hari kerja
 *       * Tahun ke-4: 10 hari kerja
 *       * Tahun ke-5: 11 hari kerja
 *       * Tahun ke-6: 12 hari kerja
 *       * Tahun ke-7: 13 hari kerja
 *       * Tahun ke-8 dan seterusnya: 14 hari kerja (maksimum batas minimum statuter)
 *   - Pro-rata Cuti Tahunan untuk tahun berjalan yang belum genap 12 bulan
 *     (Formula MOM: (Jumlah bulan bekerja penuh / 12) x Hak cuti tahunan; pembulatan: jika pecahan >= 0.5 dihitung 1 hari penuh).
 *   - Evaluasi hak pembayaran ganti rugi sisa cuti saat pemutusan hubungan kerja (encashment of unused leave).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Mendapatkan hak cuti tahunan statuter berdasarkan tahun masa kerja penuh.
 * @param {number} completedYears Masa kerja yang telah diselesaikan (tahun)
 * @returns {number} Jumlah hari cuti tahunan
 */
function getStatutoryAnnualLeaveDays(completedYears) {
  const yrs = Math.max(0, Math.floor(Number(completedYears) || 0));
  if (yrs <= 0) return 7; // Tahun pertama berjalan
  if (yrs === 1) return 8; // Memasuki tahun kedua
  if (yrs === 2) return 9;
  if (yrs === 3) return 10;
  if (yrs === 4) return 11;
  if (yrs === 5) return 12;
  if (yrs === 6) return 13;
  return 14; // 7 tahun ke atas
}

/**
 * Menghitung pro-rata hak cuti tahunan berdasarkan formula resmi MOM.
 *
 * @param {Object} params
 * @param {number} params.completedYearsOfService Jumlah tahun kerja penuh yang telah diselesaikan
 * @param {number} params.completedMonthsInCurrentYear Jumlah bulan kerja penuh di tahun berjalan (1 - 12)
 * @param {number} [params.leaveTakenDays=0] Jumlah cuti yang telah diambil di tahun berjalan
 * @param {number} [params.contractualAnnualLeaveDays] Hak cuti menurut perjanjian kerja (bila lebih tinggi dari statuter)
 * @param {number} [params.grossMonthlySalarySgd=0] Gaji bulanan kotor (untuk kalkulasi encashment)
 * @returns {Object} Rincian hak cuti tahunan dan nilai encashment
 */
function calculateAnnualLeaveEntitlement(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const completedYears = Math.max(0, Math.floor(Number(params.completedYearsOfService) || 0));
  const monthsInYear = Math.min(12, Math.max(1, Math.floor(Number(params.completedMonthsInCurrentYear) || 12)));
  const leaveTaken = Math.max(0, Number(params.leaveTakenDays) || 0);
  const salary = Math.max(0, Number(params.grossMonthlySalarySgd) || 0);

  // Hak Cuti Statuter vs Kontraktual
  const statutoryBaseDays = getStatutoryAnnualLeaveDays(completedYears);
  const contractualBase = Number(params.contractualAnnualLeaveDays);
  const annualBaseDays = (!isNaN(contractualBase) && contractualBase >= statutoryBaseDays)
    ? contractualBase
    : statutoryBaseDays;

  // Formula Pro-rata MOM: (months / 12) * annualDays
  const rawProrated = (monthsInYear / 12) * annualBaseDays;
  const fraction = rawProrated - Math.floor(rawProrated);
  // Aturan pembulatan MOM: jika sisa pecahan >= 0.5, bulatkan ke atas menjadi 1 hari
  const roundedProratedDays = fraction >= 0.5 ? Math.ceil(rawProrated) : Math.floor(rawProrated);

  const balanceLeaveDays = Math.max(0, roundedProratedDays - leaveTaken);

  // Perhitungan encashment sisa cuti per formula Employment Act:
  // Gross Rate of Pay per Day = (12 * Monthly Salary) / (52 * Working days per week) atau standar 26 hari
  const dailyRateOfPay = salary > 0 ? Number(((12 * salary) / (52 * 5.5)).toFixed(2)) : 0;
  const encashmentValueSgd = Number((balanceLeaveDays * dailyRateOfPay).toFixed(2));

  return {
    completedYearsOfService: completedYears,
    completedMonthsInCurrentYear: monthsInYear,
    statutoryMinimumDays: statutoryBaseDays,
    effectiveAnnualEntitlementDays: annualBaseDays,
    proratedCalculation: {
      rawProratedDays: Number(rawProrated.toFixed(2)),
      roundedStatutoryProratedDays: roundedProratedDays,
      leaveTakenDays: leaveTaken,
      balanceRemainingDays: balanceLeaveDays
    },
    encashment: {
      estimatedDailyRateOfPaySgd: dailyRateOfPay,
      encashmentValueSgd: encashmentValueSgd
    },
    isPartIvApplicableNotice: "Cuti tahunan statuter dijamin secara hukum bagi karyawan yang dilindungi Part IV Employment Act (pekerja manual bergaji <= S$4.500 atau non-manual <= S$2.600)."
  };
}

module.exports = {
  calculateAnnualLeaveEntitlement,
  getStatutoryAnnualLeaveDays
};
