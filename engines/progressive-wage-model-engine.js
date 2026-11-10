/**
 * Singapore Progressive Wage Model (PWM) & Local Qualifying Salary (LQS) Engine (`engines/progressive-wage-model-engine.js`)
 *
 * Mengimplementasikan evaluasi kepatuhan kerangka Progressive Wage Model (PWM) dan
 * Local Qualifying Salary (LQS) berdasarkan mandat Tripartit MOM, NTUC, dan SNEF:
 *   - Sektor Mandatori PWM:
 *       * Cleaning (Pembersihan).
 *       * Security (Keamanan).
 *       * Landscape Maintenance (Lansekap).
 *       * Retail (Ritel).
 *       * Food Services (Layanan Makanan & Minuman / F&B).
 *       * Waste Management (Pengelolaan Limbah).
 *       * Occupational PWM: Administrators (Staf Administrasi) & Drivers (Pengemudi).
 *   - Standar Local Qualifying Salary (LQS):
 *       * Full Local Headcount (1.0): Gaji kotor bulanan >= S$1.600.
 *       * Half Local Headcount (0.5): Gaji kotor bulanan S$800 s/d < S$1.600.
 *       * Zero Headcount (0.0): Gaji kotor bulanan < S$800.
 *   - Audit defisit gaji (Wage Deficit) dan dampak langsung terhadap kuota izin kerja asing (DRC).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const LQS_FULL_THRESHOLD_SGD = 1600; // Local Qualifying Salary penuh S$1,600
const LQS_HALF_THRESHOLD_SGD = 800;  // Ambang batas setengah kuota S$800

// Baseline Gaji Minimal Statuter PWM per Sektor (Jalur Jenjang Masuk / Entry Level)
const PWM_SECTOR_BASELINES_SGD = {
  CLEANING: { sector: 'Cleaning', role: 'General Cleaner / Indoor', minGrossMonthlySalarySgd: 1740 },
  SECURITY: { sector: 'Security', role: 'Security Officer (SO)', minGrossMonthlySalarySgd: 2650 },
  LANDSCAPE: { sector: 'Landscape', role: 'Landscape Maintenance Worker', minGrossMonthlySalarySgd: 1850 },
  RETAIL: { sector: 'Retail', role: 'Retail Assistant / Cashier', minGrossMonthlySalarySgd: 2175 },
  FOOD_SERVICES: { sector: 'Food Services', role: 'Service Crew / Kitchen Helper', minGrossMonthlySalarySgd: 1850 },
  WASTE_MANAGEMENT: { sector: 'Waste Management', role: 'Waste Collector (Crew)', minGrossMonthlySalarySgd: 2210 },
  OCCUPATIONAL_ADMIN: { sector: 'Occupational PWM', role: 'Administrative Assistant', minGrossMonthlySalarySgd: 1800 },
  OCCUPATIONAL_DRIVER: { sector: 'Occupational PWM', role: 'General Driver', minGrossMonthlySalarySgd: 1970 }
};

/**
 * Mengevaluasi pemenuhan upah minimum PWM dan kontribusi terhadap kuota LQS MOM.
 *
 * @param {Object} params
 * @param {number} params.monthlyGrossSalarySgd Gaji bulanan kotor aktual karyawan
 * @param {string} [params.pwmSectorKey] Kunci sektor PWM ('CLEANING', 'RETAIL', dll.) jika relevan
 * @param {boolean} [params.isLocalEmployee=true] Apakah karyawan Warga Negara Singapura (SC) atau Permanent Resident (SPR)
 * @returns {Object} Evaluasi kepatuhan PWM, kuota headcount LQS, dan defisit upah jika ada
 */
function evaluateProgressiveWageCompliance(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const salary = Math.max(0, Number(params.monthlyGrossSalarySgd) || 0);
  const sectorKey = String(params.pwmSectorKey || '').toUpperCase().trim();
  const isLocal = params.isLocalEmployee !== undefined ? Boolean(params.isLocalEmployee) : true;

  // 1. Evaluasi Local Qualifying Salary (LQS)
  let lqsHeadcountContribution = 0.0;
  let lqsStatus = 'INSUFFICIENT';

  if (isLocal) {
    if (salary >= LQS_FULL_THRESHOLD_SGD) {
      lqsHeadcountContribution = 1.0;
      lqsStatus = 'FULL_LQS_HEADCOUNT';
    } else if (salary >= LQS_HALF_THRESHOLD_SGD) {
      lqsHeadcountContribution = 0.5;
      lqsStatus = 'HALF_LQS_HEADCOUNT';
    } else {
      lqsHeadcountContribution = 0.0;
      lqsStatus = 'ZERO_LQS_HEADCOUNT';
    }
  }

  // 2. Evaluasi Sektor PWM jika diisi
  let pwmAudit = null;
  const sectorConfig = PWM_SECTOR_BASELINES_SGD[sectorKey];

  if (sectorConfig) {
    const requiredMinSalary = sectorConfig.minGrossMonthlySalarySgd;
    const isPwmCompliant = salary >= requiredMinSalary;
    const wageDeficitSgd = Math.max(0, requiredMinSalary - salary);

    pwmAudit = {
      sector: sectorConfig.sector,
      standardRole: sectorConfig.role,
      requiredMinGrossSalarySgd: requiredMinSalary,
      actualGrossSalarySgd: salary,
      isPwmCompliant,
      wageDeficitSgd,
      complianceNote: isPwmCompliant
        ? "Gaji memenuhi ambang batas baseline PWM yang disyaratkan MOM."
        : `Defisit gaji S$${wageDeficitSgd.toLocaleString()} di bawah baseline PWM sektor ${sectorConfig.sector}. Perusahaan berisiko diblokir dari izin mempekerjakan tenaga kerja asing.`
    };
  }

  return {
    monthlyGrossSalarySgd: salary,
    isLocalEmployee: isLocal,
    lqsEvaluation: {
      lqsFullThresholdSgd: LQS_FULL_THRESHOLD_SGD,
      lqsHalfThresholdSgd: LQS_HALF_THRESHOLD_SGD,
      headcountContribution: lqsHeadcountContribution,
      status: lqsStatus,
      explanation: isLocal
        ? `Gaji S$${salary.toLocaleString()} menyumbang ${lqsHeadcountContribution} pekerja lokal untuk perhitungan kuota rasio ketergantungan (DRC) MOM.`
        : "Karyawan non-lokal (asing) tidak diperhitungkan dalam kuota LQS."
    },
    pwmEvaluation: pwmAudit
  };
}

module.exports = {
  evaluateProgressiveWageCompliance,
  LQS_FULL_THRESHOLD_SGD,
  LQS_HALF_THRESHOLD_SGD,
  PWM_SECTOR_BASELINES_SGD
};
