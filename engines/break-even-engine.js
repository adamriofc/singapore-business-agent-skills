/**
 * Singapore Corporate Break-Even & Contribution Margin Engine (`engines/break-even-engine.js`)
 *
 * Mengimplementasikan analisis Cost-Volume-Profit (CVP) dan titik impas (Break-Even Analysis):
 *   - Contribution Margin per Unit (CM) & Contribution Margin Ratio (CMR).
 *   - Break-Even Point in Units (BEP Unit = Fixed Costs / CM).
 *   - Break-Even Point in Revenue (BEP SGD = Fixed Costs / CMR).
 *   - Margin of Safety (MoS nominal SGD & persentase terhadap penjualan aktual).
 *   - Target Profit Planning (Perhitungan unit & omset yang diperlukan untuk mencapai target laba).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung Break-Even Point, Margin of Safety, dan target penjualan laba.
 *
 * @param {Object} params
 * @param {number} params.totalFixedCostsSgd Total biaya tetap tahunan/bulanan (sewa, gaji pokok, lisensi, depresiasi)
 * @param {number} params.unitSellingPriceSgd Harga jual per unit produk/jasa dalam SGD
 * @param {number} params.unitVariableCostSgd Biaya variabel per unit dalam SGD (HPP langsung, komisi, delivery)
 * @param {number} [params.actualOrProjectedUnitsSold=0] Estimasi atau volume penjualan aktual dalam unit
 * @param {number} [params.targetNetProfitSgd=0] Target laba bersih yang diinginkan
 * @returns {Object} BEP unit, BEP SGD, Margin of Safety, dan analisis target profit
 */
function calculateBreakEvenAnalysis(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const fixedCosts = Math.max(0, Number(params.totalFixedCostsSgd !== undefined ? params.totalFixedCostsSgd : params.fixedCostsSgd) || 0);
  const price = Math.max(0, Number(params.unitSellingPriceSgd) || 0);
  const varCost = Math.max(0, Number(params.unitVariableCostSgd) || 0);
  const unitsSold = Math.max(0, Number(params.actualOrProjectedUnitsSold !== undefined ? params.actualOrProjectedUnitsSold : params.projectedSalesUnits) || 0);
  const targetProfit = Math.max(0, Number(params.targetNetProfitSgd) || 0);

  if (price <= varCost) {
    throw new RangeError("Harga jual per unit ('unitSellingPriceSgd') harus lebih besar daripada biaya variabel per unit ('unitVariableCostSgd').");
  }

  const unitContributionMargin = Math.round((price - varCost) * 100) / 100;
  const contributionMarginRatio = Math.round((unitContributionMargin / price) * 10000) / 10000;
  const cmRatioPercent = Math.round(contributionMarginRatio * 10000) / 100;

  // BEP calculations
  const bepUnits = Math.ceil(fixedCosts / unitContributionMargin);
  const bepRevenueSgd = Math.round((fixedCosts / contributionMarginRatio) * 100) / 100;

  // Actual sales performance & Margin of Safety
  const actualRevenueSgd = Math.round((unitsSold * price) * 100) / 100;
  const actualProfitSgd = Math.round(((unitsSold * unitContributionMargin) - fixedCosts) * 100) / 100;

  let marginOfSafetySgd = 0;
  let marginOfSafetyPercent = 0;
  if (actualRevenueSgd > bepRevenueSgd) {
    marginOfSafetySgd = Math.round((actualRevenueSgd - bepRevenueSgd) * 100) / 100;
    marginOfSafetyPercent = Math.round((marginOfSafetySgd / actualRevenueSgd) * 10000) / 100;
  }

  // Target profit planning
  const targetRequiredUnits = Math.ceil((fixedCosts + targetProfit) / unitContributionMargin);
  const targetRequiredRevenueSgd = Math.round(((fixedCosts + targetProfit) / contributionMarginRatio) * 100) / 100;

  return {
    unitContributionMarginSgd: unitContributionMargin,
    contributionMarginRatioPercent: cmRatioPercent,
    costStructure: {
      totalFixedCostsSgd: fixedCosts,
      unitSellingPriceSgd: price,
      unitVariableCostSgd: varCost,
      unitContributionMarginSgd: unitContributionMargin,
      contributionMarginRatioPercent: cmRatioPercent
    },
    breakEvenPoint: {
      breakEvenUnits: bepUnits,
      breakEvenRevenueSgd: bepRevenueSgd
    },
    breakEvenMetrics: {
      breakEvenUnits: bepUnits,
      breakEvenRevenueSgd: bepRevenueSgd
    },
    actualPerformance: {
      projectedUnitsSold: unitsSold,
      projectedRevenueSgd: actualRevenueSgd,
      projectedNetProfitSgd: actualProfitSgd,
      isProfitable: actualProfitSgd > 0,
      marginOfSafetySgd,
      marginOfSafetyPercent
    },
    targetProfitScenario: {
      targetProfitSgd: targetProfit,
      requiredUnitsToSell: targetRequiredUnits,
      requiredRevenueSgd: targetRequiredRevenueSgd
    }
  };
}

module.exports = {
  calculateBreakEvenAnalysis
};
