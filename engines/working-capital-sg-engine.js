/**
 * Singapore Working Capital & Cash Conversion Cycle (CCC) Engine (`engines/working-capital-sg-engine.js`)
 *
 * Implements deterministic calculation of corporate working capital efficiency and liquidity
 * under Singapore Financial Reporting Standards (SFRS):
 *   - Net Working Capital (NWC = Current Assets - Current Liabilities)
 *   - Liquidity Ratios (Current Ratio, Quick Acid-Test Ratio, Cash Ratio)
 *   - Cash Conversion Cycle components (DSO, DIO, DPO, and Net CCC in days)
 *   - Working capital funding requirement and cash buffer gap in SGD
 *
 * DOCTRINE: Pure numerical computation and financial formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

/**
 * Calculates working capital metrics, ratios, and Cash Conversion Cycle.
 *
 * @param {Object} input
 * @param {number} input.currentAssetsSgd - Total current assets in SGD
 * @param {number} input.currentLiabilitiesSgd - Total current liabilities in SGD
 * @param {number} input.cashAndEquivalentsSgd - Cash and short-term deposits in SGD
 * @param {number} input.tradeReceivablesSgd - Accounts receivable in SGD
 * @param {number} input.inventorySgd - Inventory / stock in SGD
 * @param {number} input.tradePayablesSgd - Accounts payable to trade suppliers in SGD
 * @param {number} input.annualRevenueSgd - Annual revenue / credit sales in SGD
 * @param {number} input.annualCogsSgd - Annual Cost of Goods Sold in SGD
 * @returns {Object} Comprehensive liquidity, working capital, and CCC analysis
 */
function calculateSingaporeWorkingCapital(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const ca = Number(input.currentAssetsSgd);
  const cl = Number(input.currentLiabilitiesSgd);
  const cash = Number(input.cashAndEquivalentsSgd || 0);
  const ar = Number(input.tradeReceivablesSgd || 0);
  const inv = Number(input.inventorySgd || 0);
  const ap = Number(input.tradePayablesSgd || 0);
  const rev = Number(input.annualRevenueSgd);
  const cogs = Number(input.annualCogsSgd);

  if (isNaN(ca) || ca < 0 || !isFinite(ca)) throw new Error(`INVALID_INPUT: 'currentAssetsSgd' must be a non-negative finite number (got ${input.currentAssetsSgd})`);
  if (isNaN(cl) || cl <= 0 || !isFinite(cl)) throw new Error(`INVALID_INPUT: 'currentLiabilitiesSgd' must be a positive finite number (got ${input.currentLiabilitiesSgd})`);
  if (isNaN(cash) || cash < 0 || !isFinite(cash)) throw new Error(`INVALID_INPUT: 'cashAndEquivalentsSgd' must be a non-negative finite number (got ${input.cashAndEquivalentsSgd})`);
  if (isNaN(ar) || ar < 0 || !isFinite(ar)) throw new Error(`INVALID_INPUT: 'tradeReceivablesSgd' must be a non-negative finite number (got ${input.tradeReceivablesSgd})`);
  if (isNaN(inv) || inv < 0 || !isFinite(inv)) throw new Error(`INVALID_INPUT: 'inventorySgd' must be a non-negative finite number (got ${input.inventorySgd})`);
  if (isNaN(ap) || ap < 0 || !isFinite(ap)) throw new Error(`INVALID_INPUT: 'tradePayablesSgd' must be a non-negative finite number (got ${input.tradePayablesSgd})`);
  if (isNaN(rev) || rev <= 0 || !isFinite(rev)) throw new Error(`INVALID_INPUT: 'annualRevenueSgd' must be a positive finite number (got ${input.annualRevenueSgd})`);
  if (isNaN(cogs) || cogs <= 0 || !isFinite(cogs)) throw new Error(`INVALID_INPUT: 'annualCogsSgd' must be a positive finite number (got ${input.annualCogsSgd})`);

  // 1. Net Working Capital
  const nwc = Math.round((ca - cl) * 100) / 100;

  // 2. Liquidity Ratios
  const currentRatio = Math.round((ca / cl) * 100) / 100;
  const quickAssets = cash + ar;
  const quickRatio = Math.round((quickAssets / cl) * 100) / 100;
  const cashRatio = Math.round((cash / cl) * 100) / 100;

  // 3. Operating Cycle & Cash Conversion Cycle (in days)
  const dso = Math.round(((ar / rev) * 365) * 10) / 10;
  const dio = Math.round(((inv / cogs) * 365) * 10) / 10;
  const dpo = Math.round(((ap / cogs) * 365) * 10) / 10;
  const operatingCycle = Math.round((dso + dio) * 10) / 10;
  const ccc = Math.round((operatingCycle - dpo) * 10) / 10;

  // 4. Working Capital Funding Requirement
  const dailyCogs = cogs / 365;
  const workingCapitalRequirement = Math.round(dailyCogs * ccc * 100) / 100;
  const workingCapitalSurplusDeficit = Math.round((nwc - workingCapitalRequirement) * 100) / 100;

  return {
    liquidityMetrics: {
      currentAssetsSgd: ca,
      currentLiabilitiesSgd: cl,
      netWorkingCapitalSgd: nwc,
      currentRatio: currentRatio,
      quickRatio: quickRatio,
      cashRatio: cashRatio,
      isSolventShortTerm: currentRatio >= 1.0
    },
    cashConversionCycle: {
      daysSalesOutstandingDso: dso,
      daysInventoryOutstandingDio: dio,
      daysPayableOutstandingDpo: dpo,
      operatingCycleDays: operatingCycle,
      cashConversionCycleDays: ccc
    },
    capitalRequirements: {
      dailyOperatingCostSgd: Math.round(dailyCogs * 100) / 100,
      workingCapitalRequiredForCccSgd: workingCapitalRequirement,
      workingCapitalSurplusOrDeficitSgd: workingCapitalSurplusDeficit,
      position: workingCapitalSurplusDeficit >= 0 ? 'WORKING_CAPITAL_SURPLUS' : 'WORKING_CAPITAL_DEFICIT'
    }
  };
}

module.exports = {
  calculateSingaporeWorkingCapital
};
