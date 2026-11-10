/**
 * Singapore Enterprise Innovation Scheme (EIS) Engine (`engines/eis-tax-engine.js`)
 *
 * Mengimplementasikan kalkulasi insentif Enterprise Innovation Scheme (EIS) berdasarkan
 * Income Tax Act 1947 (Sections 14B, 14C, 14D, 14E, 14U) yang diperkenalkan pada Budget 2023.
 *
 * Fitur Utama:
 *   - Pengurangan pajak 400% (100% baseline deduction + 300% enhanced deduction)
 *     pada 5 aktivitas inovasi yang memenuhi syarat (qualifying activities).
 *   - Batas pagu (cap) statuter S$400.000 per aktivitas per Tahun Pajak (YA).
 *   - Opsi konversi kas (Cash Conversion Option): konversi hingga S$100.000 dari total
 *     pengeluaran yang memenuhi syarat menjadi hibah tunai nontaksabel sebesar 20%
 *     (maksimum S$20.000 per YA untuk bisnis yang belum menguntungkan).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

// 5 Aktivitas Inovasi yang Memenuhi Syarat EIS
const EIS_ACTIVITIES = {
  RND_LOCAL: {
    key: 'RND_LOCAL',
    name: 'Qualifying R&D Conducted in Singapore',
    section: 'Section 14C / 14D',
    capSgd: 400000,
    enhancedRate: 3.00, // +300% enhanced (total 400%)
    baseRate: 1.00
  },
  IP_REGISTRATION: {
    key: 'IP_REGISTRATION',
    name: 'Registration of Qualifying Intellectual Property Rights',
    section: 'Section 14A',
    capSgd: 400000,
    enhancedRate: 3.00,
    baseRate: 1.00
  },
  IP_ACQUISITION_LICENSING: {
    key: 'IP_ACQUISITION_LICENSING',
    name: 'Acquisition and Licensing of Qualifying IPRs',
    section: 'Section 14U',
    capSgd: 400000,
    enhancedRate: 3.00,
    baseRate: 1.00
  },
  TRAINING_INNOVATION: {
    key: 'TRAINING_INNOVATION',
    name: 'Innovation Training Courses via Approved Partners',
    section: 'Section 14',
    capSgd: 400000,
    enhancedRate: 3.00,
    baseRate: 1.00
  },
  POLY_ITE_COLLABORATION: {
    key: 'POLY_ITE_COLLABORATION',
    name: 'Innovation Projects Carried out with Polytechnics and ITE',
    section: 'Section 14B',
    capSgd: 400000,
    enhancedRate: 3.00,
    baseRate: 1.00
  }
};

const CASH_CONVERSION_MAX_EXPENDITURE = 100000; // Cap pengeluaran konversi kas: S$100,000
const CASH_CONVERSION_PAYOUT_RATE = 0.20;       // Rasio pembayaran kas: 20% (maks S$20,000)
const STATUTORY_CIT_RATE = 0.17;                // Tarif PPh Badan Singapura 17%

/**
 * Menghitung manfaat pajak Enterprise Innovation Scheme (EIS).
 *
 * @param {Object} params
 * @param {Object} params.expenditures Objek pengeluaran per aktivitas (misal { RND_LOCAL: 250000, IP_REGISTRATION: 50000 })
 * @param {boolean} [params.optForCashConversion=false] Opsi konversi kas untuk entitas belum profit
 * @param {number} [params.yearOfAssessment=2024] Tahun Pajak (YA)
 * @returns {Object} Hasil rincian kalkulasi deduksi pajak & konversi kas EIS
 */
function calculateEnterpriseInnovationScheme(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const expenditures = params.expenditures || {};
  const optForCashConversion = Boolean(params.optForCashConversion);
  const ya = Number(params.yearOfAssessment) || 2024;

  let totalQualifyingSpend = 0;
  let totalCappedSpend = 0;
  let totalBaseDeduction = 0;
  let totalEnhancedDeduction = 0;
  let totalTaxDeduction = 0;

  const activityBreakdown = {};

  for (const [key, config] of Object.entries(EIS_ACTIVITIES)) {
    const rawSpend = Number(expenditures[key]) || 0;
    const qualifyingSpend = Math.max(0, rawSpend);
    const cappedSpend = Math.min(qualifyingSpend, config.capSgd);
    const excessSpend = Math.max(0, qualifyingSpend - config.capSgd);

    const baseDeduction = qualifyingSpend * config.baseRate;
    const enhancedDeduction = cappedSpend * config.enhancedRate;
    const totalDeductionForActivity = baseDeduction + enhancedDeduction;

    totalQualifyingSpend += qualifyingSpend;
    totalCappedSpend += cappedSpend;
    totalBaseDeduction += baseDeduction;
    totalEnhancedDeduction += enhancedDeduction;
    totalTaxDeduction += totalDeductionForActivity;

    activityBreakdown[key] = {
      name: config.name,
      section: config.section,
      qualifyingSpendSgd: qualifyingSpend,
      capSgd: config.capSgd,
      cappedSpendSgd: cappedSpend,
      excessSpendSgd: excessSpend,
      baseDeductionSgd: baseDeduction,
      enhancedDeductionSgd: enhancedDeduction,
      totalDeductionSgd: totalDeductionForActivity
    };
  }

  // Estimasi penghematan pajak aktual pada tarif CIT 17%
  let taxSavingsAtCitRate = Number((totalTaxDeduction * STATUTORY_CIT_RATE).toFixed(2));

  // Penanganan Opsi Konversi Kas (Cash Conversion Option)
  let cashConversionPayout = 0;
  let cashConversionExpenditureUsed = 0;

  if (optForCashConversion && totalCappedSpend > 0) {
    cashConversionExpenditureUsed = Math.min(totalCappedSpend, CASH_CONVERSION_MAX_EXPENDITURE);
    cashConversionPayout = Number((cashConversionExpenditureUsed * CASH_CONVERSION_PAYOUT_RATE).toFixed(2));
  }

  return {
    yearOfAssessment: ya,
    optForCashConversion,
    summary: {
      totalQualifyingSpendSgd: totalQualifyingSpend,
      totalCappedSpendSgd: totalCappedSpend,
      totalBaseDeductionSgd: totalBaseDeduction,
      totalEnhancedDeductionSgd: totalEnhancedDeduction,
      totalTaxDeductionSgd: totalTaxDeduction,
      estimatedTaxSavingsSgd: taxSavingsAtCitRate,
      effectiveDeductionMultiplier: totalQualifyingSpend > 0
        ? Number((totalTaxDeduction / totalQualifyingSpend).toFixed(2))
        : 0
    },
    cashConversion: {
      isEligible: totalCappedSpend > 0,
      expenditureConvertedSgd: cashConversionExpenditureUsed,
      cashPayoutSgd: cashConversionPayout,
      maxPossiblePayoutSgd: CASH_CONVERSION_MAX_EXPENDITURE * CASH_CONVERSION_PAYOUT_RATE
    },
    activityBreakdown
  };
}

module.exports = {
  calculateEnterpriseInnovationScheme,
  EIS_ACTIVITIES,
  CASH_CONVERSION_MAX_EXPENDITURE,
  CASH_CONVERSION_PAYOUT_RATE
};
