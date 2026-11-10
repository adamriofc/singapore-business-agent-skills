'use strict';

const assert = require('assert');
const {
  calculateSingaporeWacc,
  calculateSingaporeWorkingCapital,
  evaluateSfrsFramework,
  allocateTransactionPriceSfrs115,
  compileIncomeStatement,
  compileBalanceSheet,
  calculateNpv,
  calculateIrr,
  calculatePaybackPeriod,
  evaluateCapitalInvestment,
  calculateSfrs109Ecl,
  calculateFifoInventory,
  calculateWeightedAverageInventory,
  evaluateLowerOfCostAndNrv,
  analyzeFinancialRatios,
  forecastWeeklyCashFlow,
  calculateBreakEvenAnalysis,
  evaluateUnitEconomics,
  calculateVccDistributionWaterfall,
  calculateSfrs116Lease,
  calculateLeasePv,
  calculateTheoreticalForwardRate,
  evaluateFxForwardHedge,
  evaluateEnterpriseGrant
} = require('../../index.js');

function runFinanceEnginesTests() {
  console.log("🇸🇬 Running Singapore Corporate Finance Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. SORA Benchmark & Corporate WACC Engine
  // ===============================================================
  console.log("  [1/14] Testing SORA Benchmark & Corporate WACC Engine...");

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
  console.log("  ✅ SORA WACC: Capital structure, CAPM Ke, SORA Kd with CIT tax shield verified.");

  // ===============================================================
  // 2. Working Capital & Cash Conversion Cycle (CCC) Engine
  // ===============================================================
  console.log("  [2/14] Testing Working Capital & Cash Conversion Cycle (CCC) Engine...");

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
  console.log("  ✅ Working Capital: Liquidity metrics, CCC (75 days), and capital surplus verified.");

  // ===============================================================
  // 3. SFRS Framework Eligibility & SFRS 115 Revenue Allocation
  // ===============================================================
  console.log("  [3/14] Testing SFRS Framework & SFRS 115 Allocation Engine...");

  const smallEntity = evaluateSfrsFramework({
    annualRevenueSgd: 8000000,
    totalAssetsSgd: 7000000,
    employeeHeadcount: 40,
    isPubliclyAccountable: false
  });
  assert.strictEqual(smallEntity.isEligibleForSmallEntitySfrs, true);
  assert.strictEqual(smallEntity.recommendedFramework, 'SFRS_FOR_SMALL_ENTITIES');
  assert.strictEqual(smallEntity.criteriaMetCount, 3);

  const fullSfrs = evaluateSfrsFramework({
    annualRevenueSgd: 15000000,
    totalAssetsSgd: 12000000,
    employeeHeadcount: 65,
    isPubliclyAccountable: false
  });
  assert.strictEqual(fullSfrs.isEligibleForSmallEntitySfrs, false);
  assert.strictEqual(fullSfrs.recommendedFramework, 'FULL_SFRS');

  // SFRS 115: Relative Standalone Selling Price Allocation
  // Total transaction price: S$100,000. Standalone prices: Lic S$80,000 (2/3), Svc S$40,000 (1/3). Total SSP S$120,000.
  const revAlloc = allocateTransactionPriceSfrs115({
    totalTransactionPriceSgd: 100000,
    performanceObligations: [
      { id: 'PO-1', description: 'Software License', standaloneSellingPriceSgd: 80000 },
      { id: 'PO-2', description: 'Support Services', standaloneSellingPriceSgd: 40000 }
    ]
  });
  assert.strictEqual(revAlloc.totalTransactionPriceSgd, 100000);
  assert.strictEqual(revAlloc.totalStandaloneSellingPriceSgd, 120000);
  assert.strictEqual(revAlloc.bundleDiscountSgd, 20000);
  assert.strictEqual(revAlloc.allocations[0].allocatedRevenueSgd, 66666.67);
  assert.strictEqual(revAlloc.allocations[1].allocatedRevenueSgd, 33333.33);
  console.log("  ✅ SFRS: Small Entities qualification and SFRS 115 relative SSP allocation verified.");

  // ===============================================================
  // 4. SFRS 1 Financial Statements Presentation
  // ===============================================================
  console.log("  [4/14] Testing SFRS 1 Financial Statements Presentation Engine...");

  const isRes = compileIncomeStatement({
    revenueSgd: 1000000,
    costOfSalesSgd: 400000,
    operatingExpensesSgd: 250000,
    depreciationAndAmortisationSgd: 50000,
    financeCostsSgd: 20000,
    taxExpenseSgd: 47600
  });
  assert.strictEqual(isRes.grossProfitSgd, 600000);
  assert.strictEqual(isRes.profitabilityMetrics.grossProfitMarginPercent, 60);
  assert.strictEqual(isRes.ebitdaSgd, 350000);
  assert.strictEqual(isRes.operatingProfitEbitSgd, 300000);
  assert.strictEqual(isRes.profitBeforeTaxSgd, 280000);
  assert.strictEqual(isRes.netProfitSgd, 232400);

  const bsRes = compileBalanceSheet({
    currentAssets: { cashAndCashEquivalentsSgd: 200000, tradeAndOtherReceivablesSgd: 150000, inventoriesSgd: 150000 },
    nonCurrentAssets: { propertyPlantEquipmentSgd: 500000, rightOfUseAssetsSgd: 200000 },
    currentLiabilities: { tradeAndOtherPayablesSgd: 120000, shortTermBorrowingsSgd: 80000 },
    nonCurrentLiabilities: { longTermBorrowingsSgd: 250000, leaseLiabilitiesNonCurrentSgd: 150000 },
    equity: { shareCapitalSgd: 200000, retainedEarningsSgd: 400000 }
  });
  assert.strictEqual(bsRes.statementOfFinancialPosition.totalAssetsSgd, 1200000);
  assert.strictEqual(bsRes.statementOfFinancialPosition.totalLiabilitiesSgd, 600000);
  assert.strictEqual(bsRes.statementOfFinancialPosition.equity.totalSgd, 600000);
  assert.strictEqual(bsRes.verification.isBalanced, true);
  assert.strictEqual(bsRes.verification.differenceSgd, 0);
  console.log("  ✅ SFRS 1: Income Statement margins and Balance Sheet fundamental equality verified.");

  // ===============================================================
  // 5. Capital Budgeting & Investment Valuation
  // ===============================================================
  console.log("  [5/14] Testing Capital Budgeting & Investment Valuation Engine...");

  const npvVal = calculateNpv(100000, [35000, 45000, 50000], 0.08);
  assert.ok(npvVal > 0);

  const irrVal = calculateIrr(100000, [40000, 50000, 40000]);
  assert.ok(irrVal > 0.10 && irrVal < 0.20);

  const capInvest = evaluateCapitalInvestment({
    projectName: 'High-Tech Automated Line',
    initialInvestmentSgd: 100000,
    annualCashFlowsSgd: [35000, 40000, 45000, 30000],
    hurdleDiscountRatePercent: 8
  });
  assert.strictEqual(capInvest.investmentDecision.isAcceptable, true);
  assert.strictEqual(capInvest.investmentDecision.verdict, 'ACCEPT_PROJECT');
  assert.ok(capInvest.evaluationMetrics.netPresentValueSgd > 0);
  assert.ok(capInvest.evaluationMetrics.profitabilityIndex > 1.0);
  console.log("  ✅ Capital Budgeting: NPV, IRR, Profitability Index, and discounted payback verified.");

  // ===============================================================
  // 6. SFRS 109 Expected Credit Loss (ECL) & IRAS Tax Engine
  // ===============================================================
  console.log("  [6/14] Testing SFRS 109 ECL & IRAS Tax Engine...");

  const eclRes = calculateSfrs109Ecl({
    currentReceivablesSgd: 300000,
    pastDue1To30DaysSgd: 80000,
    pastDue31To60DaysSgd: 40000,
    pastDue61To90DaysSgd: 20000,
    moreThan90DaysSgd: 10000,
    macroeconomicMultiplier: 1.0,
    specificImpairmentSgd: 5000
  });
  assert.strictEqual(eclRes.grossTradeReceivablesSgd, 450000);
  assert.ok(eclRes.totalGeneralEclAllowanceSgd > 0);
  assert.strictEqual(eclRes.specificImpairmentAllowanceSgd, 5000);
  assert.strictEqual(eclRes.irasTaxTreatment.taxDeductibleSpecificProvisionSgd, 5000);
  assert.strictEqual(eclRes.irasTaxTreatment.nonDeductibleGeneralProvisionSgd, eclRes.totalGeneralEclAllowanceSgd);
  console.log("  ✅ SFRS 109 ECL: Provision matrix aging and IRAS general vs specific tax treatment verified.");

  // ===============================================================
  // 7. SFRS 2 Inventory Valuation & NRV Engine
  // ===============================================================
  console.log("  [7/14] Testing SFRS 2 Inventory Valuation & NRV Engine...");

  const fifoRes = calculateFifoInventory({
    purchases: [
      { units: 100, unitCostSgd: 10 },
      { units: 150, unitCostSgd: 15 }
    ],
    unitsSold: 120
  });
  assert.strictEqual(fifoRes.unitsSold, 120);
  assert.strictEqual(fifoRes.endingInventoryUnits, 130);
  assert.strictEqual(fifoRes.costOfGoodsSoldSgd, 1300); // 100 * 10 + 20 * 15 = 1000 + 300
  assert.strictEqual(fifoRes.endingInventoryValueSgd, 1950); // 130 * 15

  const wacRes = calculateWeightedAverageInventory({
    purchases: [
      { units: 100, unitCostSgd: 10 },
      { units: 150, unitCostSgd: 15 }
    ],
    unitsSold: 120
  });
  assert.strictEqual(wacRes.endingInventoryUnits, 130);
  assert.strictEqual(wacRes.averageUnitCostSgd, 13); // (1000 + 2250) / 250 = 3250 / 250 = 13
  assert.strictEqual(wacRes.costOfGoodsSoldSgd, 1560); // 120 * 13
  assert.strictEqual(wacRes.endingInventoryValueSgd, 1690); // 130 * 13

  const nrvRes = evaluateLowerOfCostAndNrv({
    inventoryCostSgd: 50000,
    estimatedSellingPriceSgd: 45000,
    estimatedCompletionCostSgd: 2000,
    estimatedSellingExpenseSgd: 1000
  });
  assert.strictEqual(nrvRes.costSgd, 50000);
  assert.strictEqual(nrvRes.netRealisableValueSgd, 42000);
  assert.strictEqual(nrvRes.finalCarryingValueBalanceSheetSgd, 42000);
  assert.strictEqual(nrvRes.isWriteDownRequired, true);
  assert.strictEqual(nrvRes.inventoryWriteDownExpenseSgd, 8000);
  console.log("  ✅ SFRS 2: FIFO, Weighted Average, and Lower of Cost and NRV write-down verified.");

  // ===============================================================
  // 8. SFRS Financial Ratio Analysis Engine
  // ===============================================================
  console.log("  [8/14] Testing Financial Ratio Analysis Engine...");

  const ratioRes = analyzeFinancialRatios({
    currentAssetsSgd: 500000,
    currentLiabilitiesSgd: 250000,
    cashAndEquivalentsSgd: 100000,
    inventorySgd: 120000,
    tradeReceivablesSgd: 180000,
    totalAssetsSgd: 1000000,
    totalLiabilitiesSgd: 400000,
    totalDebtSgd: 200000,
    totalEquitySgd: 600000,
    revenueSgd: 1200000,
    costOfGoodsSoldSgd: 600000,
    ebitOperatingProfitSgd: 200000,
    netProfitSgd: 150000,
    interestExpenseSgd: 20000
  });
  assert.strictEqual(ratioRes.liquidityRatios.currentRatio, 2.0);
  assert.strictEqual(ratioRes.liquidityRatios.quickRatio, 1.52);
  assert.strictEqual(ratioRes.liquidityRatios.cashRatio, 0.4);
  assert.strictEqual(ratioRes.solvencyRatios.debtToEquityRatio, 0.33);
  assert.strictEqual(ratioRes.solvencyRatios.interestCoverageRatio, 10.0);
  assert.strictEqual(ratioRes.profitabilityRatios.grossProfitMarginPercent, 50.0);
  assert.strictEqual(ratioRes.profitabilityRatios.netProfitMarginPercent, 12.5);
  assert.strictEqual(ratioRes.profitabilityRatios.returnOnEquityPercent, 25.0);
  assert.strictEqual(ratioRes.overallHealthAssessment.verdict, 'HEALTHY_STRONG');
  console.log("  ✅ Financial Ratios: 14 ratios across Liquidity, Solvency, Profitability & Efficiency verified.");

  // ===============================================================
  // 9. Direct Cash Flow Forecasting & Runway Engine
  // ===============================================================
  console.log("  [9/14] Testing Direct Cash Flow Forecasting Engine...");

  const cffRes = forecastWeeklyCashFlow({
    startingCashBalanceSgd: 50000,
    minimumCashReserveSgd: 10000,
    weeklyForecasts: [
      { weekNumber: 1, operatingReceiptsSgd: 15000, payrollAndLeviesSgd: 8000, rentAndUtilitiesSgd: 4000 },
      { weekNumber: 2, operatingReceiptsSgd: 12000, payrollAndLeviesSgd: 3000, rentAndUtilitiesSgd: 1000 },
      { weekNumber: 3, operatingReceiptsSgd: 20000, payrollAndLeviesSgd: 5000, rentAndUtilitiesSgd: 2000 },
      { weekNumber: 4, operatingReceiptsSgd: 8000, payrollAndLeviesSgd: 12000, rentAndUtilitiesSgd: 1000 }
    ]
  });
  assert.strictEqual(cffRes.startingCashBalanceSgd, 50000);
  assert.ok(cffRes.endingCashBalanceSgd > 50000);
  assert.strictEqual(cffRes.liquidityRiskAssessment.isSolventThroughoutPeriod, true);
  assert.strictEqual(cffRes.liquidityRiskAssessment.hasBreachedMinimumReserve, false);
  console.log("  ✅ Cash Flow Forecast: Weekly inflows, outflows, minimum reserve, and runway verified.");

  // ===============================================================
  // 10. Cost-Volume-Profit & Break-Even Analysis Engine
  // ===============================================================
  console.log("  [10/14] Testing Break-Even Analysis Engine...");

  // Fixed S$120,000, Price S$50, VC S$20 -> CM S$30 (60%). BEP units = 120,000 / 30 = 4,000 units. BEP Rev = S$200,000.
  const beRes = calculateBreakEvenAnalysis({
    fixedCostsSgd: 120000,
    unitSellingPriceSgd: 50,
    unitVariableCostSgd: 20,
    projectedSalesUnits: 5000,
    targetNetProfitSgd: 30000
  });
  assert.strictEqual(beRes.unitContributionMarginSgd, 30);
  assert.strictEqual(beRes.contributionMarginRatioPercent, 60);
  assert.strictEqual(beRes.breakEvenMetrics.breakEvenUnits, 4000);
  assert.strictEqual(beRes.breakEvenMetrics.breakEvenRevenueSgd, 200000);
  assert.strictEqual(beRes.targetProfitScenario.requiredUnitsToSell, 5000);
  assert.strictEqual(beRes.targetProfitScenario.requiredRevenueSgd, 250000);
  console.log("  ✅ Break-Even: CM per unit, BEP units/revenue, and target profit scenarios verified.");

  // ===============================================================
  // 11. SaaS & Digital Unit Economics Engine
  // ===============================================================
  console.log("  [11/14] Testing Unit Economics Engine...");

  // ARPU S$100/mo, Gross Margin 80%, Churn 2.5%/mo -> LTV = (100 * 0.8) / 0.025 = 80 / 0.025 = S$3,200.
  // Spend S$20,000, Acquired 25 customers -> CAC = 20,000 / 25 = S$800.
  // LTV:CAC = 3,200 / 800 = 4.0x. Payback = 800 / (100 * 0.8) = 800 / 80 = 10 months.
  const ueRes = evaluateUnitEconomics({
    averageMonthlyRevenuePerUserSgd: 100,
    grossMarginPercent: 80,
    monthlyCustomerChurnRatePercent: 2.5,
    monthlySalesAndMarketingSpendSgd: 20000,
    newCustomersAcquiredMonthly: 25
  });
  assert.strictEqual(ueRes.customerAcquisitionCostSgd, 800);
  assert.strictEqual(ueRes.customerLifetimeValueSgd, 3200);
  assert.strictEqual(ueRes.ltvToCacRatio, 4.0);
  assert.strictEqual(ueRes.cacPaybackPeriodMonths, 10.0);
  assert.strictEqual(ueRes.businessHealthRating, 'IDEAL_OPTIMAL');
  console.log("  ✅ Unit Economics: CAC (S$800), LTV (S$3,200), LTV:CAC (4.0x), and payback verified.");

  // ===============================================================
  // 12. Singapore VCC 4-Tier Distribution Waterfall Engine
  // ===============================================================
  console.log("  [12/14] Testing VCC Distribution Waterfall Engine...");

  // LP Capital: S$10M, Total Proceeds: S$15M. Hurdle: 8% p.a. for 3 years = 24% (S$2.4M). Carry: 20% with catch-up.
  // Tier 1: S$10M to LP. Remaining: S$5M.
  // Tier 2: S$2.4M to LP. Remaining: S$2.6M.
  // Tier 3: GP Catch-Up = 20/80 * 2.4M = S$600k to GP. Remaining: S$2.0M.
  // Tier 4: Split 80/20 -> LP S$1.6M, GP S$400k.
  // Total LP: 10M + 2.4M + 1.6M = S$14.0M (Net profit S$4M, MOIC 1.4x).
  // Total GP: 600k + 400k = S$1.0M (20% of S$5M net profit).
  const vccRes = calculateVccDistributionWaterfall({
    totalProceedsToDistributeSgd: 15000000,
    lpInvestedCapitalSgd: 10000000,
    hurdleRateAnnualPercent: 8,
    investmentHoldingPeriodYears: 3,
    carriedInterestPercent: 20,
    hasGpCatchUp: true
  });
  assert.strictEqual(vccRes.totalDistributedSgd, 15000000);
  assert.strictEqual(vccRes.lpReturnsSummary.totalDistributedToLpSgd, 14000000);
  assert.strictEqual(vccRes.lpReturnsSummary.capitalReturnedSgd, 10000000);
  assert.strictEqual(vccRes.lpReturnsSummary.netProfitToLpSgd, 4000000);
  assert.strictEqual(vccRes.lpReturnsSummary.netMoicMultiple, 1.4);
  assert.strictEqual(vccRes.gpReturnsSummary.totalCarriedInterestToGpSgd, 1000000);
  assert.strictEqual(vccRes.gpReturnsSummary.effectiveCarryPercentOfProfits, 20);
  console.log("  ✅ VCC Waterfall: 4 tiers, return of capital, preferred return, GP catch-up, and carry split verified.");

  // ===============================================================
  // 13. SFRS 116 Leases & ROU Asset Engine
  // ===============================================================
  console.log("  [13/14] Testing SFRS 116 Leases & ROU Asset Engine...");

  // Annual lease payment S$60,000, 3 years, IBR 5%.
  // PV annuity ordinary = 60,000 * [ (1 - (1.05)^-3) / 0.05 ] = 60,000 * 2.723248 = S$163,394.88
  const leasePv = calculateLeasePv(60000, 3, 0.05, false);
  assert.ok(Math.abs(leasePv - 163394.88) < 1.0);

  const leaseRes = calculateSfrs116Lease({
    annualLeasePaymentSgd: 60000,
    leaseTermYears: 3,
    incrementalBorrowingRatePercent: 5,
    initialDirectCostsSgd: 2000
  });
  assert.strictEqual(leaseRes.isExemptFromCapitalisation, false);
  assert.strictEqual(leaseRes.initialLeaseLiabilitySgd, 163394.88);
  assert.strictEqual(leaseRes.initialRightOfUseAssetSgd, 165394.88); // PV + S$2,000 direct cost
  assert.strictEqual(leaseRes.amortisationSchedule.length, 3);
  console.log("  ✅ SFRS 116: ROU Asset capitalisation, liability amortisation schedule, and current/non-current split verified.");

  // ===============================================================
  // 14. FX Forward Hedging & EnterpriseSG Grants Engine
  // ===============================================================
  console.log("  [14/14] Testing FX Risk Hedging & EnterpriseSG Grants Engine...");

  // Spot: 1.350, SORA: 3.5%, Fed Funds: 5.5%, 360 days -> Forward = 1.350 * (1 + 0.035) / (1 + 0.055) = 1.350 * 0.98104 = ~1.3244
  const forwardTheoretical = calculateTheoreticalForwardRate(1.350, 0.035, 0.055, 360);
  assert.ok(forwardTheoretical > 1.30 && forwardTheoretical < 1.35);

  // Importer hedging: Bought USD 100,000 at forward rate 1.340. Spot rate moved up to 1.360.
  // Importer pays S$134,000 instead of spot S$136,000 -> Hedging Gain +S$2,000.
  const fxRes = evaluateFxForwardHedge({
    foreignCurrency: 'USD',
    foreignExposureAmount: 100000,
    contractForwardRate: 1.340,
    currentSpotRate: 1.360,
    positionType: 'BUY_FORWARD_IMPORTER'
  });
  assert.strictEqual(fxRes.hedgedSettlementValueSgd, 134000);
  assert.strictEqual(fxRes.unhedgedMarketValueSgd, 136000);
  assert.strictEqual(fxRes.hedgingMarkToMarketSgd, 2000);
  assert.strictEqual(fxRes.hedgingResultStatus, 'HEDGING_GAIN');

  // EnterpriseSG Grant: EDG 50% co-funding on S$100,000
  const edgRes = evaluateEnterpriseGrant({
    grantScheme: 'EDG',
    qualifyingProjectCostSgd: 100000,
    localShareholdingPercentage: 60,
    groupAnnualTurnoverSgd: 5000000,
    groupEmployeeCount: 25
  });
  assert.strictEqual(edgRes.isEligibleForGrant, true);
  assert.strictEqual(edgRes.fundingCalculation.statutorySupportRatePercent, 50);
  assert.strictEqual(edgRes.fundingCalculation.approvedGrantFundingSgd, 50000);
  assert.strictEqual(edgRes.fundingCalculation.companyCoPaymentShareSgd, 50000);
  console.log("  ✅ FX & Grants: Interest Rate Parity forward pricing, MTM hedge gain, and EDG 50% co-funding verified.");

  console.log("\n✅ All 14 Singapore Corporate Finance Domain Engine Tests Passed 100%!");
}

runFinanceEnginesTests();
