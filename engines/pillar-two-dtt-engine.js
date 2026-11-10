/**
 * Singapore BEPS 2.0 Pillar Two Domestic Top-up Tax (DTT) Engine (`engines/pillar-two-dtt-engine.js`)
 *
 * Mengimplementasikan kalkulasi pajak tambahan domestik (Domestic Top-up Tax / DTT) dan
 * Multinational Enterprise Top-up Tax (MTT) berdasarkan kerangka BEPS 2.0 Pillar Two di Singapura
 * (berlaku untuk tahun finansial yang dimulai pada atau setelah 1 Januari 2025).
 *
 * Aturan Statuter:
 *   - Ruang Lingkup: Grup Perusahaan Multinasional (MNE) dengan pendapatan konsolidasi tahunan
 *     minimal €750 juta (ambang batas ekuivalen Singapura: S$1.080.000.000).
 *   - Tarif Minimum Global (GloBE Minimum Tax Rate): 15,00%.
 *   - Effective Tax Rate (ETR) Singapura: Covered Taxes / GloBE Net Income.
 *   - Top-up Tax Rate: max(0, 15% - ETR).
 *   - Substance-based Income Exclusion (SBIE): Pengecualian penghasilan berbasis substansi riil
 *     (payroll carve-out + tangible asset carve-out).
 *   - DTT Payable: Top-up Tax Rate x (GloBE Net Income - SBIE).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const GLOBE_MINIMUM_TAX_RATE = 0.15; // 15%
const MNE_REVENUE_THRESHOLD_SGD = 1080000000; // S$1.08 Miliar (~€750 Juta)

// Rasio Carve-out Transisional SBIE (Standar Transisi 2025/2026 OECD GloBE)
const SBIE_DEFAULT_PAYROLL_CARVEOUT = 0.098; // 9.8% pada 2025
const SBIE_DEFAULT_TANGIBLE_CARVEOUT = 0.078; // 7.8% pada 2025

/**
 * Menghitung kewajiban Domestic Top-up Tax (DTT) di bawah BEPS 2.0 Pillar Two.
 *
 * @param {Object} params
 * @param {number} params.globalConsolidatedRevenueSgd Pendapatan konsolidasi grup global dalam SGD
 * @param {number} params.singaporeGlobeIncomeSgd Laba bersih fiskal GloBE di Singapura
 * @param {number} params.singaporeCoveredTaxesSgd Pajak yang dicakup (Covered Taxes) yang dibayar di Singapura
 * @param {number} [params.eligiblePayrollCostsSgd=0] Biaya gaji karyawan yang memenuhi syarat untuk SBIE
 * @param {number} [params.eligibleTangibleAssetsSgd=0] Nilai buku aset berwujud yang memenuhi syarat untuk SBIE
 * @param {number} [params.payrollCarveoutRate=0.098] Rasio carve-out biaya gaji
 * @param {number} [params.tangibleCarveoutRate=0.078] Rasio carve-out aset berwujud
 * @returns {Object} Rincian perhitungan ETR dan kewajiban DTT
 */
function calculateDomesticTopUpTax(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const globalRevenue = Math.max(0, Number(params.globalConsolidatedRevenueSgd) || 0);
  const globeIncome = Math.max(0, Number(params.singaporeGlobeIncomeSgd) || 0);
  const coveredTaxes = Math.max(0, Number(params.singaporeCoveredTaxesSgd) || 0);
  const payrollCosts = Math.max(0, Number(params.eligiblePayrollCostsSgd) || 0);
  const tangibleAssets = Math.max(0, Number(params.eligibleTangibleAssetsSgd) || 0);
  const payrollRate = Number(params.payrollCarveoutRate) || SBIE_DEFAULT_PAYROLL_CARVEOUT;
  const tangibleRate = Number(params.tangibleCarveoutRate) || SBIE_DEFAULT_TANGIBLE_CARVEOUT;

  const isInScope = globalRevenue >= MNE_REVENUE_THRESHOLD_SGD;

  if (!isInScope || globeIncome <= 0) {
    return {
      isInScope,
      globalRevenueSgd: globalRevenue,
      revenueThresholdSgd: MNE_REVENUE_THRESHOLD_SGD,
      effectiveTaxRatePercent: 0,
      minimumTaxRatePercent: GLOBE_MINIMUM_TAX_RATE * 100,
      topUpTaxRatePercent: 0,
      sbieSgd: 0,
      excessProfitSgd: 0,
      domesticTopUpTaxPayableSgd: 0,
      status: !isInScope
        ? "Di luar cakupan BEPS 2.0 (Pendapatan global < S$1,08 Miliar)."
        : "Tidak ada laba bersih GloBE di Singapura (Nol DTT)."
    };
  }

  // Komputasi Effective Tax Rate (ETR)
  const etrDecimal = coveredTaxes / globeIncome;
  const etrPercent = Number((etrDecimal * 100).toFixed(4));

  const topUpTaxRateDecimal = Math.max(0, GLOBE_MINIMUM_TAX_RATE - etrDecimal);
  const topUpTaxRatePercent = Number((topUpTaxRateDecimal * 100).toFixed(4));

  // Komputasi Substance-based Income Exclusion (SBIE)
  const payrollCarveout = Number((payrollCosts * payrollRate).toFixed(2));
  const tangibleCarveout = Number((tangibleAssets * tangibleRate).toFixed(2));
  const totalSbie = Math.min(globeIncome, payrollCarveout + tangibleCarveout);

  // Excess Profit setelah pengecualian substansi
  const excessProfit = Math.max(0, globeIncome - totalSbie);

  // Pajak Tambahan Domestik (DTT)
  const dttPayable = Number((excessProfit * topUpTaxRateDecimal).toFixed(2));

  return {
    isInScope: true,
    globalRevenueSgd: globalRevenue,
    revenueThresholdSgd: MNE_REVENUE_THRESHOLD_SGD,
    financials: {
      globeIncomeSgd: globeIncome,
      coveredTaxesSgd: coveredTaxes,
      effectiveTaxRatePercent: etrPercent,
      minimumTaxRatePercent: GLOBE_MINIMUM_TAX_RATE * 100,
      topUpTaxRatePercent: topUpTaxRatePercent
    },
    substanceExclusion: {
      payrollCarveoutSgd: payrollCarveout,
      tangibleCarveoutSgd: tangibleCarveout,
      totalSbieSgd: totalSbie,
      excessProfitSgd: excessProfit
    },
    domesticTopUpTaxPayableSgd: dttPayable,
    status: dttPayable > 0
      ? `Terkena kewajiban DTT sebesar S$${dttPayable.toLocaleString()} karena ETR Singapura (${etrPercent}%) < 15,00%.`
      : `Tidak ada kewajiban DTT (ETR Singapura ${etrPercent}% >= 15,00% atau diproteksi oleh SBIE).`
  };
}

module.exports = {
  calculateDomesticTopUpTax,
  GLOBE_MINIMUM_TAX_RATE,
  MNE_REVENUE_THRESHOLD_SGD
};
