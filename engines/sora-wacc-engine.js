/**
 * Singapore SORA Benchmark & Corporate WACC Engine (`engines/sora-wacc-engine.js`)
 *
 * Implements deterministic calculation of Singapore corporate Weighted Average Cost of Capital (WACC)
 * utilizing the Singapore Overnight Rate Average (SORA) benchmark and Singapore tax shielding:
 *   - Cost of Equity (Ke) via Capital Asset Pricing Model (CAPM): Ke = Rf + Beta * (Rm - Rf)
 *   - Cost of Debt (Kd): Base rate (SORA 1M/3M/6M or SGS bond rate) + corporate credit spread
 *   - After-tax Cost of Debt accounting for Singapore 17% CIT tax shield: Kd_after_tax = Kd * (1 - 0.17)
 *   - Capital structure weights: Equity weight (We = E / (E + D)), Debt weight (Wd = D / (E + D))
 *   - Final WACC formula: WACC = (We * Ke) + (Wd * Kd_after_tax)
 *
 * DOCTRINE: Pure numerical computation and financial formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

/**
 * Calculates corporate Weighted Average Cost of Capital (WACC) under Singapore market parameters.
 *
 * @param {Object} input
 * @param {number} input.marketValueOfEquitySgd - Total market value of equity in SGD
 * @param {number} input.marketValueOfDebtSgd - Total market value of interest-bearing debt in SGD
 * @param {number} [input.riskFreeRate=0.030] - Risk-free rate (e.g. 10-year SGS bond yield, default 3.0%)
 * @param {number} [input.equityBeta=1.0] - Stock beta / systematic risk
 * @param {number} [input.equityRiskPremium=0.055] - Market risk premium (Rm - Rf, default 5.5%)
 * @param {number} [input.soraBaseRate=0.032] - SORA benchmark rate (e.g. 3-Month Compounded SORA, default 3.2%)
 * @param {number} [input.debtCreditSpread=0.015] - Borrowing spread over SORA (e.g. 150 bps = 0.015)
 * @param {number} [input.citTaxRate=0.17] - Singapore Corporate Income Tax rate (default 17%)
 * @returns {Object} Comprehensive WACC and cost of capital decomposition
 */
function calculateSingaporeWacc(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const equity = Number(input.marketValueOfEquitySgd);
  const debt = Number(input.marketValueOfDebtSgd || 0);

  if (isNaN(equity) || equity <= 0 || !isFinite(equity)) {
    throw new Error(`INVALID_INPUT: 'marketValueOfEquitySgd' must be a positive finite number (got ${input.marketValueOfEquitySgd})`);
  }
  if (isNaN(debt) || debt < 0 || !isFinite(debt)) {
    throw new Error(`INVALID_INPUT: 'marketValueOfDebtSgd' must be a non-negative finite number (got ${input.marketValueOfDebtSgd})`);
  }

  const rf = input.riskFreeRate !== undefined ? Number(input.riskFreeRate) : 0.030;
  const beta = input.equityBeta !== undefined ? Number(input.equityBeta) : 1.0;
  const erp = input.equityRiskPremium !== undefined ? Number(input.equityRiskPremium) : 0.055;

  const sora = input.soraBaseRate !== undefined ? Number(input.soraBaseRate) : 0.032;
  const spread = input.debtCreditSpread !== undefined ? Number(input.debtCreditSpread) : 0.015;
  const cit = input.citTaxRate !== undefined ? Number(input.citTaxRate) : 0.17;

  if (isNaN(rf) || rf < 0 || rf > 0.5) throw new Error(`INVALID_INPUT: 'riskFreeRate' must be between 0 and 0.5 (got ${input.riskFreeRate})`);
  if (isNaN(beta) || beta < 0 || beta > 10) throw new Error(`INVALID_INPUT: 'equityBeta' must be between 0 and 10 (got ${input.equityBeta})`);
  if (isNaN(erp) || erp < 0 || erp > 0.5) throw new Error(`INVALID_INPUT: 'equityRiskPremium' must be between 0 and 0.5 (got ${input.equityRiskPremium})`);
  if (isNaN(sora) || sora < 0 || sora > 0.5) throw new Error(`INVALID_INPUT: 'soraBaseRate' must be between 0 and 0.5 (got ${input.soraBaseRate})`);
  if (isNaN(spread) || spread < 0 || spread > 0.5) throw new Error(`INVALID_INPUT: 'debtCreditSpread' must be between 0 and 0.5 (got ${input.debtCreditSpread})`);
  if (isNaN(cit) || cit < 0 || cit > 0.5) throw new Error(`INVALID_INPUT: 'citTaxRate' must be between 0 and 0.5 (got ${input.citTaxRate})`);

  // 1. Capital Structure Weights
  const totalValue = equity + debt;
  const weightEquity = equity / totalValue;
  const weightDebt = debt / totalValue;

  // 2. Cost of Equity (Ke) = Rf + Beta * ERP
  const costOfEquity = rf + (beta * erp);

  // 3. Cost of Debt (Kd)
  const preTaxCostOfDebt = sora + spread;
  const afterTaxCostOfDebt = preTaxCostOfDebt * (1 - cit);

  // 4. WACC = (We * Ke) + (Wd * Kd_after_tax)
  const wacc = (weightEquity * costOfEquity) + (weightDebt * afterTaxCostOfDebt);

  return {
    capitalStructure: {
      marketValueOfEquitySgd: equity,
      marketValueOfDebtSgd: debt,
      totalFirmValueSgd: totalValue,
      equityWeightPercent: Math.round(weightEquity * 10000) / 100,
      debtWeightPercent: Math.round(weightDebt * 10000) / 100
    },
    costOfEquityModel: {
      framework: 'CAPM',
      riskFreeRatePercent: Math.round(rf * 10000) / 100,
      equityBeta: beta,
      equityRiskPremiumPercent: Math.round(erp * 10000) / 100,
      costOfEquityKePercent: Math.round(costOfEquity * 10000) / 100
    },
    costOfDebtModel: {
      soraBenchmarkRatePercent: Math.round(sora * 10000) / 100,
      creditSpreadPercent: Math.round(spread * 10000) / 100,
      preTaxCostOfDebtKdPercent: Math.round(preTaxCostOfDebt * 10000) / 100,
      singaporeCitTaxShieldPercent: Math.round(cit * 10000) / 100,
      afterTaxCostOfDebtPercent: Math.round(afterTaxCostOfDebt * 10000) / 100
    },
    waccResult: {
      weightedAverageCostOfCapitalPercent: Math.round(wacc * 10000) / 100,
      waccDecimal: Math.round(wacc * 100000) / 100000
    }
  };
}

module.exports = {
  calculateSingaporeWacc
};
