/**
 * Singapore SFRS 109 Expected Credit Loss (ECL) & Provision Matrix Engine (`engines/ecl-sfrs109-engine.js`)
 *
 * Mengimplementasikan pengukuran penurunan nilai piutang usaha (Impairment of Trade Receivables)
 * berdasarkan model Expected Credit Loss (ECL) sederhana (Simplified Approach) sesuai SFRS 109:
 *   - Matriks Umur Piutang (Aging Schedule Provision Matrix):
 *       * Current (Not past due).
 *       * 1 - 30 days past due.
 *       * 31 - 60 days past due.
 *       * 61 - 90 days past due.
 *       * > 90 days past due (Default / credit-impaired).
 *   - Penyesuaian Informasi Berwawasan ke Depan (Forward-Looking Macroeconomic Factor / MAS GDP Outlook).
 *   - Audit Fiskal IRAS (Section 14(1)(a) Income Tax Act):
 *       * Specific Bad Debt Provision: Tax-deductible jika debitur spesifik telah pailit/gagal bayar.
 *       * General ECL Provision (Matriks Kolektif): Non-deductible (Koreksi Fiskal Positif).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const DEFAULT_HISTORICAL_LOSS_RATES = {
  CURRENT: 0.005, // 0.5%
  PAST_DUE_1_30: 0.02, // 2.0%
  PAST_DUE_31_60: 0.06, // 6.0%
  PAST_DUE_61_90: 0.15, // 15.0%
  MORE_THAN_90: 0.50 // 50.0%
};

/**
 * Menghitung cadangan penurunan nilai piutang usaha per SFRS 109 dan rekonsiliasi pajak IRAS.
 *
 * @param {Object} params
 * @param {Object} params.agingBucketsSgd Nilai nominal piutang pada masing-masing bucket
 * @param {number} [params.agingBucketsSgd.current=0] Belum jatuh tempo
 * @param {number} [params.agingBucketsSgd.pastDue1To30=0] Terlambat 1 - 30 hari
 * @param {number} [params.agingBucketsSgd.pastDue31To60=0] Terlambat 31 - 60 hari
 * @param {number} [params.agingBucketsSgd.pastDue61To90=0] Terlambat 61 - 90 hari
 * @param {number} [params.agingBucketsSgd.moreThan90=0] Terlambat > 90 hari
 * @param {number} [params.macroeconomicMultiplier=1.0] Faktor penyesuaian makroekonomi (misal 1.1 jika ekonomi lesu)
 * @param {number} [params.specificImpairmentSgd=0] Cadangan penurunan nilai spesifik atas debitur pailit
 * @returns {Object} Rincian ECL per bucket, total cadangan, dan perlakuan pajak IRAS
 */
function calculateSfrs109Ecl(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const buckets = params.agingBucketsSgd || params;
  const current = Math.max(0, Number(buckets.current !== undefined ? buckets.current : buckets.currentReceivablesSgd) || 0);
  const pd1_30 = Math.max(0, Number(buckets.pastDue1To30 !== undefined ? buckets.pastDue1To30 : buckets.pastDue1To30DaysSgd) || 0);
  const pd31_60 = Math.max(0, Number(buckets.pastDue31To60 !== undefined ? buckets.pastDue31To60 : buckets.pastDue31To60DaysSgd) || 0);
  const pd61_90 = Math.max(0, Number(buckets.pastDue61To90 !== undefined ? buckets.pastDue61To90 : buckets.pastDue61To90DaysSgd) || 0);
  const gt90 = Math.max(0, Number(buckets.moreThan90 !== undefined ? buckets.moreThan90 : buckets.moreThan90DaysSgd) || 0);

  const multiplier = Math.max(0.5, Math.min(2.5, Number(params.macroeconomicMultiplier) || 1.0));
  const specific = Math.max(0, Number(params.specificImpairmentSgd) || 0);

  const totalGrossReceivables = Math.round((current + pd1_30 + pd31_60 + pd61_90 + gt90) * 100) / 100;

  // Hitung ECL per bucket
  const calcBucket = (balance, baseRate) => {
    const adjustedRate = Math.min(1.0, Math.round(baseRate * multiplier * 10000) / 10000);
    const ecl = Math.round(balance * adjustedRate * 100) / 100;
    return {
      grossBalanceSgd: balance,
      baseLossRatePercent: Math.round(baseRate * 10000) / 100,
      adjustedLossRatePercent: Math.round(adjustedRate * 10000) / 100,
      eclAllowanceSgd: ecl
    };
  };

  const currentResult = calcBucket(current, DEFAULT_HISTORICAL_LOSS_RATES.CURRENT);
  const pd1_30Result = calcBucket(pd1_30, DEFAULT_HISTORICAL_LOSS_RATES.PAST_DUE_1_30);
  const pd31_60Result = calcBucket(pd31_60, DEFAULT_HISTORICAL_LOSS_RATES.PAST_DUE_31_60);
  const pd61_90Result = calcBucket(pd61_90, DEFAULT_HISTORICAL_LOSS_RATES.PAST_DUE_61_90);
  const gt90Result = calcBucket(gt90, DEFAULT_HISTORICAL_LOSS_RATES.MORE_THAN_90);

  const totalGeneralEcl = Math.round((
    currentResult.eclAllowanceSgd +
    pd1_30Result.eclAllowanceSgd +
    pd31_60Result.eclAllowanceSgd +
    pd61_90Result.eclAllowanceSgd +
    gt90Result.eclAllowanceSgd
  ) * 100) / 100;

  const totalAllowanceSgd = Math.round((totalGeneralEcl + specific) * 100) / 100;
  const netReceivablesSgd = Math.round((totalGrossReceivables - totalAllowanceSgd) * 100) / 100;

  return {
    grossTradeReceivablesSgd: totalGrossReceivables,
    macroeconomicAdjustmentMultiplier: multiplier,
    eclProvisionMatrix: {
      current: currentResult,
      pastDue1To30Days: pd1_30Result,
      pastDue31To60Days: pd31_60Result,
      pastDue61To90Days: pd61_90Result,
      moreThan90Days: gt90Result
    },
    totalGeneralEclAllowanceSgd: totalGeneralEcl,
    specificImpairmentAllowanceSgd: specific,
    totalEclAllowanceSgd: totalAllowanceSgd,
    netTradeReceivablesSgd: netReceivablesSgd,
    effectiveProvisionRatePercent: totalGrossReceivables > 0
      ? Math.round((totalAllowanceSgd / totalGrossReceivables) * 10000) / 100
      : 0,
    irasTaxTreatment: {
      taxDeductibleSpecificProvisionSgd: specific,
      nonDeductibleGeneralProvisionSgd: totalGeneralEcl,
      fiscalAdjustmentNote: `Berdasarkan aturan IRAS, cadangan kerugian umum (General ECL S$${totalGeneralEcl.toLocaleString()}) wajib dikoreksi positif fiskal (Non-Deductible). Hanya cadangan spesifik atas piutang tak tertagih yang telah terbukti gagal bayar (S$${specific.toLocaleString()}) yang dapat menjadi pengurang pajak badan.`
    }
  };
}

module.exports = {
  calculateSfrs109Ecl,
  DEFAULT_HISTORICAL_LOSS_RATES
};
