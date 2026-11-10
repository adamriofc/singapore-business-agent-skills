/**
 * Singapore Paid Media ROI & Digital Tax Engine (`engines/sg-ads-roi-engine.js`)
 *
 * Implements deterministic advertising unit economics, CAC, LTV, ROAS, and statutory
 * Singapore 9% GST imported digital services taxation impact:
 *   - 9% GST statutory rate progression on overseas digital ad spend (Meta, Google, LinkedIn).
 *   - Blended Customer Acquisition Cost (CAC) computation.
 *   - Customer Lifetime Value (LTV) and LTV:CAC health ratio benchmarking.
 *   - Return on Ad Spend (ROAS) and Blended Marketing Efficiency Ratio (MER).
 *
 * DOCTRINE: Pure numerical computation and deterministic unit economics formulas.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const STATUTORY_GST_RATE = 0.09; // 9% GST active in Singapore

/**
 * Calculates paid advertising unit economics inclusive of Singapore statutory GST.
 *
 * @param {Object} input
 * @param {number} input.adSpendExcludingGstSgd - Base invoice ad spend before GST in SGD
 * @param {number} input.acquiredCustomersCount - Number of acquired paying customers
 * @param {number} input.totalAttributedRevenueSgd - Total attributed sales revenue in SGD
 * @param {number} [input.customerLifespanMonths=12] - Average customer lifetime in months
 * @param {number} [input.monthlyGrossMarginPerCustomerSgd=250] - Monthly gross margin per customer in SGD
 * @param {boolean} [input.isB2bGstRegistered=true] - Whether buyer claims input tax credit on GST
 * @returns {Object} Deterministic paid media ROI and tax impact report
 */
function calculateSingaporeAdsRoi(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const baseSpend = Math.max(0, Number(input.adSpendExcludingGstSgd) || 0);
  if (baseSpend <= 0) {
    throw new Error("INVALID_INPUT: 'adSpendExcludingGstSgd' must be a positive number greater than zero");
  }

  const customers = Math.max(0, Math.floor(Number(input.acquiredCustomersCount) || 0));
  const revenue = Math.max(0, Number(input.totalAttributedRevenueSgd) || 0);
  const lifespan = Math.max(1, Math.floor(Number(input.customerLifespanMonths) || 12));
  const monthlyMargin = Math.max(0, Number(input.monthlyGrossMarginPerCustomerSgd) || 0);
  const isGstRegistered = input.isB2bGstRegistered !== undefined ? Boolean(input.isB2bGstRegistered) : true;

  // 1. Statutory 9% GST Calculation on Digital Advertising Services
  const gstPayableSgd = Number((baseSpend * STATUTORY_GST_RATE).toFixed(2));
  const grossAdSpendSgd = Number((baseSpend + gstPayableSgd).toFixed(2));

  // If entity is GST-registered, GST is claimable as Input Tax (effective cost = baseSpend).
  // If not GST-registered (exempt/non-registered SME), 9% GST is a sunk operational cost.
  const effectiveAdCostSgd = isGstRegistered ? baseSpend : grossAdSpendSgd;

  // 2. CAC Computation
  const effectiveCacSgd = customers > 0
    ? Number((effectiveAdCostSgd / customers).toFixed(2))
    : 0;

  // 3. LTV Computation (Lifespan in months * monthly gross margin per customer)
  const customerLtvSgd = Number((lifespan * monthlyMargin).toFixed(2));

  // 4. LTV:CAC Ratio
  const ltvCacRatio = effectiveCacSgd > 0
    ? Number((customerLtvSgd / effectiveCacSgd).toFixed(2))
    : 0;

  // 5. ROAS (Attributed Revenue / Effective Ad Spend)
  const roas = effectiveAdCostSgd > 0
    ? Number((revenue / effectiveAdCostSgd).toFixed(2))
    : 0;

  // 6. Campaign Health Evaluation
  let efficiencyVerdict = 'HEALTHY_SCALABLE_UNIT_ECONOMICS';
  if (ltvCacRatio < 1.0 && customers > 0) {
    efficiencyVerdict = 'UNSUSTAINABLE_CASH_DRAIN';
  } else if (ltvCacRatio < 3.0 && customers > 0) {
    efficiencyVerdict = 'MODERATE_EFFICIENCY_OPTIMIZATION_RECOMMENDED';
  } else if (customers === 0) {
    efficiencyVerdict = 'ZERO_CONVERSION_CRITICAL_REVIEW';
  }

  return {
    mediaSpendTaxBreakdownSgd: {
      baseAdSpendBeforeGst: baseSpend,
      statutory9PercentGst: gstPayableSgd,
      grossTotalAdSpend: grossAdSpendSgd,
      isGstClaimableAsInputTax: isGstRegistered,
      effectiveNetAdCost: effectiveAdCostSgd
    },
    acquisitionMetrics: {
      acquiredCustomersCount: customers,
      blendedCacSgd: effectiveCacSgd,
      customerLtvSgd: customerLtvSgd,
      ltvToCacRatio: ltvCacRatio
    },
    performanceRatios: {
      attributedRevenueSgd: revenue,
      returnOnAdSpendRoas: roas,
      marketingEfficiencyTier: efficiencyVerdict
    },
    statutoryTaxAdvice: isGstRegistered
      ? "Perusahaan terdaftar GST dapat mengklaim PPN Masukan (Input Tax) 9% atas faktur iklan digital luar negeri melalui Form F5."
      : "Perusahaan non-GST harus memperhitungkan beban statuter 9% GST sebagai biaya operasional tambahan yang tidak dapat dikreditkan."
  };
}

module.exports = {
  calculateSingaporeAdsRoi,
  STATUTORY_GST_RATE
};
