/**
 * Singapore Public Holiday Pay & In-Lieu Compensation Engine (`engines/public-holiday-pay-engine.js`)
 *
 * Mengimplementasikan kalkulasi kompensasi kerja pada hari libur nasional resmi (Gazetted Public Holidays)
 * berdasarkan Section 88 Employment Act 1968:
 *   - 11 Hari Libur Nasional Resmi yang Diundangkan per Tahun di Singapura.
 *   - Hak Statuter Karyawan yang Bekerja pada Hari Libur Nasional:
 *       * Opsi 1 (Extra Day's Pay): Tambahan 1 hari gaji pokok di atas gaji bulanan reguler.
 *       * Opsi 2 (Day Off in-Lieu): 1 hari libur kerja pengganti yang disepakati bersama.
 *       * Opsi 3 (Time-Off in-Lieu / TOIL): Hanya untuk manajer dan eksekutif (di luar Part IV).
 *   - Ketentuan Jatuh pada Hari Libur / Istirahat:
 *       * Jatuh pada Rest Day (Minggu): Hari kerja berikutnya (Senin) otomatis menjadi hari libur berbayar.
 *       * Jatuh pada Off Day (Sabtu): Majikan wajib memberikan 1 hari cuti pengganti atau membayar 1 hari upah tambahan.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung kompensasi kerja pada hari libur nasional Singapura.
 *
 * @param {Object} params
 * @param {number} params.monthlyBasicSalarySgd Gaji pokok bulanan karyawan dalam SGD
 * @param {number} [params.normalWorkingDaysPerWeek=5] Jumlah hari kerja normal per minggu (5, 5.5, atau 6 hari)
 * @param {number} [params.holidaysWorkedCount=1] Jumlah hari libur nasional yang dikerjakan
 * @param {string} [params.compensationMode='EXTRA_PAY'] 'EXTRA_PAY' atau 'DAY_OFF_IN_LIEU'
 * @param {boolean} [params.isPartIvCovered=true] Apakah karyawan dilindungi Part IV Employment Act
 * @returns {Object} Rincian kompensasi uang tambahan atau alokasi cuti pengganti
 */
function calculatePublicHolidayCompensation(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const salary = Math.max(0, Number(params.monthlyBasicSalarySgd) || 0);
  const daysPerWeek = Math.min(6, Math.max(4, Number(params.normalWorkingDaysPerWeek) || 5));
  const holidaysWorked = Math.max(1, Math.floor(Number(params.holidaysWorkedCount) || 1));
  const mode = String(params.compensationMode || 'EXTRA_PAY').toUpperCase().trim();
  const isPartIv = params.isPartIvCovered !== undefined ? Boolean(params.isPartIvCovered) : true;

  // Formula Statuter MOM untuk Basic Rate of Pay per Day:
  // (12 * monthlyBasicSalary) / (52 * workingDaysPerWeek)
  const dailyRateOfPay = salary > 0
    ? Number(((12 * salary) / (52 * daysPerWeek)).toFixed(2))
    : 0;

  let extraSalaryPayableSgd = 0;
  let substituteDaysOffGranted = 0;

  if (mode === 'EXTRA_PAY') {
    extraSalaryPayableSgd = Number((dailyRateOfPay * holidaysWorked).toFixed(2));
  } else {
    // DAY_OFF_IN_LIEU
    substituteDaysOffGranted = holidaysWorked;
  }

  return {
    monthlyBasicSalarySgd: salary,
    workingDaysPerWeek: daysPerWeek,
    holidaysWorkedCount: holidaysWorked,
    compensationMode: mode,
    isPartIvCovered: isPartIv,
    calculations: {
      statutoryDailyRateOfPaySgd: dailyRateOfPay,
      extraSalaryPayableSgd,
      substituteDaysOffGrantedDays: substituteDaysOffGranted
    },
    statutoryAdvice: mode === 'EXTRA_PAY'
      ? `Majikan wajib membayarkan tambahan upah sebesar S$${extraSalaryPayableSgd.toLocaleString()} bersamaan dengan pembayaran gaji bulan berjalan.`
      : `Majikan wajib memberikan ${substituteDaysOffGranted} hari libur kerja pengganti yang disepakati bersama oleh karyawan.`
  };
}

/**
 * Mengevaluasi aturan libur nasional pengganti jika jatuh pada Rest Day atau Off Day.
 * @param {string} holidayFallsOn 'REST_DAY' | 'OFF_DAY' | 'NORMAL_WORKING_DAY'
 * @returns {Object}
 */
function evaluateHolidayOnNonWorkingDay(holidayFallsOn) {
  const dayType = String(holidayFallsOn || 'NORMAL_WORKING_DAY').toUpperCase().trim();

  if (dayType === 'REST_DAY') {
    return {
      rule: 'Section 88(4) Employment Act',
      statutoryTreatment: 'Hari kerja berikutnya (umumnya hari Senin) secara hukum otomatis menjadi hari libur nasional resmi pengganti berbayar.'
    };
  } else if (dayType === 'OFF_DAY') {
    return {
      rule: 'Section 88(4) Employment Act',
      statutoryTreatment: 'Majikan wajib memberikan 1 hari libur pengganti atau membayar upah 1 hari kerja ekstra sebagai kompensasi.'
    };
  }

  return {
    rule: 'Section 88(1) Employment Act',
    statutoryTreatment: 'Hari libur nasional normal; karyawan berhak atas libur berbayar penuh.'
  };
}

module.exports = {
  calculatePublicHolidayCompensation,
  evaluateHolidayOnNonWorkingDay
};
