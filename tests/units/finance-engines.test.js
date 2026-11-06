'use strict';

const assert = require('assert');
const {
  calculateSingaporeWacc,
  calculateSingaporeWorkingCapital
} = require('../../index.js');

function runFinanceEnginesTests() {
  console.log("🇸🇬 Running Singapore Corporate Finance Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. SORA Benchmark & Corporate WACC Engine
  // ===============================================================
  console.log("  [1/2] Testing SORA Benchmark & Corporate WACC Engine...");

  // 1a. Standard Capital Structure (Equity S$6M, Debt S$4M = Total S$10M, We = 60%, Wd = 40%)
  // Rf = 3.0%, Beta = 1.2, ERP = 5.5% -> Ke = 3.0% + (1.2 * 5.5%) = 3.0% + 6.6% = 9.6%
  // SORA = 3.5%, Spread = 1.5% -> Kd_pre = 5.0%
  // CIT = 17% -> Kd_after = 5.0% * (1 - 0.17) = 5.0% * 0.83 = 4.15%
  // WACC = (0.60 * 9.6%) + (0.40 * 4.15%) = 5.76% + 1.66% = 7.42%
  const waccRes = calculateSingaporeWacc({
    marketValueOfEquitySgd: 6000000,
    marketValueOfDebtSgd: 4000000,
    riskFreeRate: 0.030,
    equityBeta: 1.2,
    equityRiskPremium: 0.055,
    soraBaseRate: 0.035,
    debtCreditSpread: 0.015,
    citTaxRate: 0.17
  });

  assert.strictEqual(waccRes.capitalStructure.equityWeightPercent, 60);
  assert.strictEqual(waccRes.capitalStructure.debtWeightPercent, 40);
  assert.strictEqual(waccRes.costOfEquityModel.costOfEquityKePercent, 9.6);
  assert.strictEqual(waccRes.costOfDebtModel.preTaxCostOfDebtKdPercent, 5.0);
  assert.strictEqual(waccRes.costOfDebtModel.afterTaxCostOfDebtPercent, 4.15);
  assert.strictEqual(waccRes.waccResult.weightedAverageCostOfCapitalPercent, 7.42);
  console.log("  ✅ SORA WACC: Capital structure weights, CAPM Ke, SORA Kd with 17% CIT tax shield verified.");

  // 1b. 100% Equity Financed Firm (Debt = 0)
  const allEquity = calculateSingaporeWacc({
    marketValueOfEquitySgd: 5000000,
    marketValueOfDebtSgd: 0,
    riskFreeRate: 0.030,
    equityBeta: 1.0,
    equityRiskPremium: 0.050
  });
  assert.strictEqual(allEquity.capitalStructure.equityWeightPercent, 100);
  assert.strictEqual(allEquity.capitalStructure.debtWeightPercent, 0);
  assert.strictEqual(allEquity.costOfEquityModel.costOfEquityKePercent, 8.0);
  assert.strictEqual(allEquity.waccResult.weightedAverageCostOfCapitalPercent, 8.0);
  console.log("  ✅ SORA WACC: 100% equity capital structure boundary verified.");

  // ===============================================================
  // 2. Working Capital & Cash Conversion Cycle (CCC) Engine
  // ===============================================================
  console.log("  [2/2] Testing Working Capital & Cash Conversion Cycle (CCC) Engine...");

  // 2a. Comprehensive Liquidity & CCC Cycle Test
  // Current Assets: S$2,000,000 (Cash 500k, AR 700k, Inv 800k)
  // Current Liabilities: S$1,000,000 (AP 400k, Other CL 600k)
  // Revenue: S$7,300,000. COGS: S$3,650,000.
  // NWC = 2,000,000 - 1,000,000 = S$1,000,000.
  // Current Ratio = 2,000,000 / 1,000,000 = 2.00
  // Quick Ratio = (500k + 700k) / 1,000,000 = 1.20
  // Cash Ratio = 500k / 1,000,000 = 0.50
  // DSO = (700,000 / 7,300,000) * 365 = 35.0 days
  // DIO = (800,000 / 3,650,000) * 365 = 80.0 days
  // DPO = (400,000 / 3,650,000) * 365 = 40.0 days
  // Operating Cycle = 35 + 80 = 115 days
  // CCC = 115 - 40 = 75 days
  // Daily COGS = 3,650,000 / 365 = S$10,000 / day
  // Working Capital Required for CCC = 10,000 * 75 = S$750,000
  // Surplus = 1,000,000 - 750,000 = S$250,000 (SURPLUS)
  const wcRes = calculateSingaporeWorkingCapital({
    currentAssetsSgd: 2000000,
    currentLiabilitiesSgd: 1000000,
    cashAndEquivalentsSgd: 500000,
    tradeReceivablesSgd: 700000,
    inventorySgd: 800000,
    tradePayablesSgd: 400000,
    annualRevenueSgd: 7300000,
    annualCogsSgd: 3650000
  });

  assert.strictEqual(wcRes.liquidityMetrics.netWorkingCapitalSgd, 1000000);
  assert.strictEqual(wcRes.liquidityMetrics.currentRatio, 2.0);
  assert.strictEqual(wcRes.liquidityMetrics.quickRatio, 1.2);
  assert.strictEqual(wcRes.liquidityMetrics.cashRatio, 0.5);
  assert.strictEqual(wcRes.liquidityMetrics.isSolventShortTerm, true);
  assert.strictEqual(wcRes.cashConversionCycle.daysSalesOutstandingDso, 35);
  assert.strictEqual(wcRes.cashConversionCycle.daysInventoryOutstandingDio, 80);
  assert.strictEqual(wcRes.cashConversionCycle.daysPayableOutstandingDpo, 40);
  assert.strictEqual(wcRes.cashConversionCycle.operatingCycleDays, 115);
  assert.strictEqual(wcRes.cashConversionCycle.cashConversionCycleDays, 75);
  assert.strictEqual(wcRes.capitalRequirements.workingCapitalRequiredForCccSgd, 750000);
  assert.strictEqual(wcRes.capitalRequirements.workingCapitalSurplusOrDeficitSgd, 250000);
  assert.strictEqual(wcRes.capitalRequirements.position, 'WORKING_CAPITAL_SURPLUS');
  console.log("  ✅ Working Capital: Liquidity ratios, DSO/DIO/DPO, CCC (75 days), and capital surplus verified.");

  console.log("\n✅ All Singapore Corporate Finance Domain Engine Tests Passed 100%!");
}

runFinanceEnginesTests();
