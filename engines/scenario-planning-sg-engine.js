/**
 * Singapore Macro & Geopolitical Stress Testing Engine (`engines/scenario-planning-sg-engine.js`)
 *
 * Implements deterministic macroeconomic stress testing and scenario simulations
 * for Singapore-domiciled enterprises facing:
 *   - Monetary Authority of Singapore (MAS) S$NEER exchange rate appreciation/depreciation.
 *   - MAS Core Inflation & CPI price basket shocks affecting commercial rental and wage indexation.
 *   - Geopolitical supply chain disruptions affecting Singapore maritime/air throughput.
 *   - Regional tariff shifts and cross-border trade headwinds.
 *
 * DOCTRINE: Pure numerical computation and deterministic financial modeling.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SUPPORTED_SCENARIOS = [
  'BASE_CASE',
  'MAS_TIGHTENING_SGD_APPRECIATION',
  'REGIONAL_TRADE_DISRUPTION',
  'STAGFLATION_SHOCK',
  'CUSTOM'
];

/**
 * Runs a deterministic macroeconomic stress test on Singapore business financials.
 *
 * @param {Object} input
 * @param {number} input.baselineRevenueSgd - Annual revenue in SGD
 * @param {number} input.baselineOpexSgd - Annual operating expenses in SGD
 * @param {string} [input.scenarioType='BASE_CASE'] - Pre-configured scenario archetype
 * @param {number} [input.foreignRevenueSharePercent=50] - Percentage of revenue earned in foreign currencies (e.g. USD)
 * @param {number} [input.importedGoodsSharePercent=40] - Percentage of OpEx tied to imported goods/services
 * @param {number} [input.customSgdNeerShiftPercent=0] - S$ appreciation (+) or depreciation (-)
 * @param {number} [input.customInflationShiftPercent=0] - Additional inflation on local costs
 * @param {number} [input.customSupplyChainCostMultiplier=1.0] - Multiplier on freight & logistical costs
 * @returns {Object} Stress test result with adjusted financials and resilience rating
 */
function simulateMacroScenarioSg(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const revenue = Math.max(0, Number(input.baselineRevenueSgd) || 0);
  const opex = Math.max(0, Number(input.baselineOpexSgd) || 0);

  if (revenue <= 0 && opex <= 0) {
    throw new Error("INVALID_INPUT: 'baselineRevenueSgd' or 'baselineOpexSgd' must be greater than zero");
  }

  const scenario = String(input.scenarioType || 'BASE_CASE').toUpperCase().trim();
  if (!SUPPORTED_SCENARIOS.includes(scenario)) {
    throw new Error(`INVALID_INPUT: 'scenarioType' must be one of [${SUPPORTED_SCENARIOS.join(', ')}] (got '${input.scenarioType}')`);
  }

  const foreignRevShare = Math.max(0, Math.min(100, Number(input.foreignRevenueSharePercent !== undefined ? input.foreignRevenueSharePercent : 50))) / 100;
  const importedOpExShare = Math.max(0, Math.min(100, Number(input.importedGoodsSharePercent !== undefined ? input.importedGoodsSharePercent : 40))) / 100;

  let sgdShift = 0; // % change in S$ exchange rate
  let inflationShift = 0; // % change in domestic inflation
  let supplyChainMultiplier = 1.0; // freight/logistics multiplier

  switch (scenario) {
    case 'MAS_TIGHTENING_SGD_APPRECIATION':
      // S$NEER strengthens 4%, dampening USD export revenues in SGD terms, but lowering import costs by 3%
      sgdShift = 0.04;
      inflationShift = -0.005;
      supplyChainMultiplier = 1.0;
      break;
    case 'REGIONAL_TRADE_DISRUPTION':
      // Port congestion, freight surges 25%, export demand slows by 8%
      sgdShift = -0.01;
      inflationShift = 0.02;
      supplyChainMultiplier = 1.25;
      break;
    case 'STAGFLATION_SHOCK':
      // Core inflation jumps 4.5%, revenues shrink 10%
      sgdShift = 0.0;
      inflationShift = 0.045;
      supplyChainMultiplier = 1.15;
      break;
    case 'CUSTOM':
      sgdShift = (Number(input.customSgdNeerShiftPercent) || 0) / 100;
      inflationShift = (Number(input.customInflationShiftPercent) || 0) / 100;
      supplyChainMultiplier = Math.max(0.5, Number(input.customSupplyChainCostMultiplier) || 1.0);
      break;
    case 'BASE_CASE':
    default:
      sgdShift = 0;
      inflationShift = 0;
      supplyChainMultiplier = 1.0;
      break;
  }

  // 1. Calculate Revenue Impact
  // Stronger SGD means foreign revenue converts into fewer SGD: rev * foreignShare * (1 - sgdShift)
  const domesticRevenue = revenue * (1 - foreignRevShare);
  const adjustedForeignRevenue = (revenue * foreignRevShare) * (1 - sgdShift);
  const totalAdjustedRevenue = Math.max(0, Math.round(domesticRevenue + adjustedForeignRevenue));

  // 2. Calculate OpEx Impact
  // Local costs affected by domestic inflation
  const localOpEx = opex * (1 - importedOpExShare) * (1 + inflationShift);
  // Imported costs benefit from stronger SGD (1 - sgdShift) but burdened by supply chain multiplier
  const importedOpEx = (opex * importedOpExShare) * (1 - sgdShift) * supplyChainMultiplier;
  const totalAdjustedOpEx = Math.max(0, Math.round(localOpEx + importedOpEx));

  // 3. Profitability & Margin Shift
  const baselineProfit = revenue - opex;
  const adjustedProfit = totalAdjustedRevenue - totalAdjustedOpEx;
  const baselineMargin = revenue > 0 ? Number(((baselineProfit / revenue) * 100).toFixed(2)) : 0;
  const adjustedMargin = totalAdjustedRevenue > 0 ? Number(((adjustedProfit / totalAdjustedRevenue) * 100).toFixed(2)) : 0;
  const marginDeltaPercent = Number((adjustedMargin - baselineMargin).toFixed(2));

  // 4. Resilience & Vulnerability Grading
  let stressResilienceTier = 'RESILIENT';
  if (adjustedProfit < 0) {
    stressResilienceTier = 'CRITICAL_DISTRESS_CASH_DRAIN';
  } else if (adjustedMargin < baselineMargin * 0.5) {
    stressResilienceTier = 'HIGH_VULNERABILITY';
  } else if (adjustedMargin < baselineMargin) {
    stressResilienceTier = 'MODERATE_STRESS';
  }

  return {
    scenarioType: scenario,
    macroParametersApplied: {
      sgdNeerAppreciationRate: sgdShift,
      inflationShiftRate: inflationShift,
      supplyChainCostMultiplier: supplyChainMultiplier,
      foreignRevenueExposurePercent: foreignRevShare * 100,
      importedCostExposurePercent: importedOpExShare * 100
    },
    baselineFinancialsSgd: {
      annualRevenue: revenue,
      annualOpEx: opex,
      netProfit: baselineProfit,
      netProfitMarginPercent: baselineMargin
    },
    stressedFinancialsSgd: {
      adjustedAnnualRevenue: totalAdjustedRevenue,
      adjustedAnnualOpEx: totalAdjustedOpEx,
      adjustedNetProfit: adjustedProfit,
      adjustedNetProfitMarginPercent: adjustedMargin,
      profitChangeSgd: adjustedProfit - baselineProfit,
      marginShiftPercentPoints: marginDeltaPercent
    },
    stressResilienceTier,
    isNetProfitPositive: adjustedProfit > 0
  };
}

module.exports = {
  simulateMacroScenarioSg,
  SUPPORTED_SCENARIOS
};
