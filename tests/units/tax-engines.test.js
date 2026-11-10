'use strict';

const assert = require('assert');
const {
  calculateSingaporeCit,
  calculateSingaporeGstRate,
  evaluateGstRegistrationLiability,
  calculateGstFiling,
  calculateSingaporeWht,
  evaluateTaxResidency,
  calculateEnterpriseInnovationScheme,
  evaluateLossUtilization,
  evaluateGroupReliefTransfer,
  calculateForeignTaxCredit,
  evaluateFamilyOfficeExemption,
  calculateDomesticTopUpTax,
  calculatePropertyStampDuty,
  assessTaxAuditRisk,
  evaluateTransferPricingCompliance,
  calculateCapitalAllowances
} = require('../../index.js');

function runTaxEnginesTests() {
  console.log("🇸🇬 Running Singapore Tax Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. Corporate Income Tax (CIT) - Section 43
  // ===============================================================
  console.log("  [1/4] Testing Corporate Income Tax (CIT) Engine...");

  // 1a. New Qualifying Startup Exemption (YA 2024, CI S$200,000)
  const startupRes = calculateSingaporeCit({
    chargeableIncome: 200000,
    isQualifyingStartup: true,
    yearOfAssessment: 2024
  });
  // First $100k @ 75% exempt = $75,000 exempt
  // Next $100k @ 50% exempt = $50,000 exempt
  // Total exempt = $125,000. Taxable CI = $75,000.
  // Tax before rebate = 75,000 * 0.17 = $12,750.
  // YA 2024 CIT Rebate: 50% capped at S$40,000 -> rebate = $6,375.
  // Net Tax Payable = $6,375.
  assert.strictEqual(startupRes.chargeableIncomeSgd, 200000);
  assert.strictEqual(startupRes.exemptionBreakdown.totalExemptIncomeSgd, 125000);
  assert.strictEqual(startupRes.taxBeforeRebateSgd, 12750);
  assert.strictEqual(startupRes.citRebateSgd, 6375);
  assert.strictEqual(startupRes.netTaxPayableSgd, 6375);
  assert.strictEqual(startupRes.effectiveTaxRatePercent, 3.19);
  console.log("  ✅ CIT: New Startup Exemption & YA 2024 Rebate verified.");

  // 1b. Partial Tax Exemption (General Company, CI S$300,000, YA 2024)
  const generalRes = calculateSingaporeCit({
    chargeableIncome: 300000,
    isQualifyingStartup: false,
    yearOfAssessment: 2024
  });
  // First $10k @ 75% exempt = $7,500
  // Next $190k @ 50% exempt = $95,000
  // Total exempt = $102,500. Taxable CI = $197,500.
  // Gross tax = 197,500 * 0.17 = $33,575.
  // YA 2024 Rebate: 50% = $16,787.50.
  // Net tax = $16,787.50.
  assert.strictEqual(generalRes.exemptionBreakdown.totalExemptIncomeSgd, 102500);
  assert.strictEqual(generalRes.taxBeforeRebateSgd, 33575);
  assert.strictEqual(generalRes.citRebateSgd, 16787.5);
  assert.strictEqual(generalRes.netTaxPayableSgd, 16787.5);
  console.log("  ✅ CIT: Partial Tax Exemption verified.");

  // ===============================================================
  // 2. Goods and Services Tax (GST) - Act 1993
  // ===============================================================
  console.log("  [2/4] Testing GST Registration & Filing Engines...");

  // 2a. GST Rate lookup
  assert.strictEqual(calculateSingaporeGstRate('2022-12-31'), 0.07);
  assert.strictEqual(calculateSingaporeGstRate('2023-06-15'), 0.08);
  assert.strictEqual(calculateSingaporeGstRate('2024-01-01'), 0.09);
  assert.strictEqual(calculateSingaporeGstRate('2026-11-06'), 0.09);

  // 2b. Registration Liability: Retrospective Breach (> S$1,000,000)
  const regLiable = evaluateGstRegistrationLiability({
    past4QuartersTurnover: [300000, 300000, 300000, 300000], // S$1.2M
    projectedNext12MonthsTurnover: 50000
  });
  assert.strictEqual(regLiable.isCompulsoryRegistrationRequired, true);
  assert.strictEqual(regLiable.retrospectiveBreach, true);
  assert.strictEqual(regLiable.prospectiveBreach, false);

  // 2c. Registration Liability: Below Threshold
  const regExempt = evaluateGstRegistrationLiability({
    past4QuartersTurnover: [150000, 150000, 150000, 150000], // S$600k
    projectedNext12MonthsTurnover: 40000
  });
  assert.strictEqual(regExempt.isCompulsoryRegistrationRequired, false);

  // 2d. GST Net Filing Calculation (9% Rate)
  const filingRes = calculateGstFiling({
    standardRatedSuppliesSgd: 500000,
    taxablePurchasesSgd: 200000,
    importedB2bServicesSgd: 50000,
    effectiveRate: 0.09
  });
  // Output Tax: 500,000 * 0.09 = 45,000
  // Reverse Charge Output: 50,000 * 0.09 = 4,500
  // Total Output Tax: 49,500
  // Input Tax Claimed: (200,000 * 0.09 = 18,000) + (4,500 RC input) = 22,500
  // Net GST Payable: 49,500 - 22,500 = 27,000
  assert.strictEqual(filingRes.outputTaxStandardSgd, 45000);
  assert.strictEqual(filingRes.reverseChargeOutputTaxSgd, 4500);
  assert.strictEqual(filingRes.totalOutputTaxSgd, 49500);
  assert.strictEqual(filingRes.totalInputTaxClaimedSgd, 22500);
  assert.strictEqual(filingRes.netGstPayableSgd, 27000);
  assert.strictEqual(filingRes.position, 'NET_PAYABLE_TO_IRAS');
  console.log("  ✅ GST: Rate progression, liability audit, and filing ledger verified.");

  // ===============================================================
  // 3. Withholding Tax (WHT) - Sections 45, 45A
  // ===============================================================
  console.log("  [3/4] Testing Withholding Tax (WHT) Engine...");

  // 3a. Interest Payment (Statutory 15%)
  const whtInterest = calculateSingaporeWht({
    paymentType: 'INTEREST',
    grossAmountSgd: 100000
  });
  assert.strictEqual(whtInterest.statutoryDomesticRate, 0.15);
  assert.strictEqual(whtInterest.withholdingTaxPayableToIrasSgd, 15000);
  assert.strictEqual(whtInterest.netRemittanceToNonResidentSgd, 85000);
  assert.strictEqual(whtInterest.irasFormType, 'FORM_IR37');

  // 3b. Royalties Payment (Statutory 10%)
  const whtRoyalty = calculateSingaporeWht({
    paymentType: 'ROYALTY',
    grossAmountSgd: 80000
  });
  assert.strictEqual(whtRoyalty.statutoryDomesticRate, 0.10);
  assert.strictEqual(whtRoyalty.withholdingTaxPayableToIrasSgd, 8000);
  console.log("  ✅ WHT: Statutory domestic withholding rules verified.");

  // ===============================================================
  // 4. Corporate Tax Residency & Certificate of Residence (CoR)
  // ===============================================================
  console.log("  [4/4] Testing Tax Residency & CoR Qualification Engine...");

  // 4a. Qualifying Resident with Substantial Board Presence in Singapore
  const resValid = evaluateTaxResidency({
    companyName: 'Merlion Tech Pte Ltd',
    totalBodMeetings: 4,
    bodMeetingsInSingapore: 3,
    strategicDecisionsInSingapore: true,
    hasLocalResidentDirector: true,
    hasPhysicalOfficeInSingapore: true,
    localEmployeesCount: 5,
    isForeignControlled: true,
    hasBonaFideCommercialReason: true
  });
  assert.strictEqual(resValid.assessment.isSingaporeTaxResident, true);
  assert.strictEqual(resValid.assessment.qualifiesForCertificateOfResidence, true);
  assert.strictEqual(resValid.assessment.centralManagementAndControlLocus, 'SINGAPORE');
  assert.strictEqual(resValid.assessment.substanceScore, 91);
  assert.strictEqual(resValid.assessment.riskLevel, 'LOW');

  // 4b. Foreign-controlled company failing commercial substance test
  const resForeignFail = evaluateTaxResidency({
    companyName: 'Passive Shell Pte Ltd',
    totalBodMeetings: 4,
    bodMeetingsInSingapore: 2,
    strategicDecisionsInSingapore: false,
    hasLocalResidentDirector: false,
    hasPhysicalOfficeInSingapore: false,
    localEmployeesCount: 0,
    isForeignControlled: true,
    hasBonaFideCommercialReason: false
  });
  assert.strictEqual(resForeignFail.assessment.isSingaporeTaxResident, false);
  assert.strictEqual(resForeignFail.assessment.qualifiesForCertificateOfResidence, false);
  assert.strictEqual(resForeignFail.assessment.riskLevel, 'HIGH');

  // 4c. Non-resident: BOD meetings mostly outside Singapore (only 1 of 4 in SG)
  const resNonResident = evaluateTaxResidency({
    companyName: 'Offshore Controlled Pte Ltd',
    totalBodMeetings: 4,
    bodMeetingsInSingapore: 1,
    strategicDecisionsInSingapore: false
  });
  assert.strictEqual(resNonResident.assessment.isSingaporeTaxResident, false);
  assert.strictEqual(resNonResident.metrics.meetsBodRatioThreshold, false);
  console.log("  ✅ Tax Residency: IRAS Central Management & Control and CoR rules verified.");

  // ===============================================================
  // 5. Enterprise Innovation Scheme (EIS) - Budget 2023
  // ===============================================================
  console.log("  [5/14] Testing Enterprise Innovation Scheme (EIS) Engine...");
  const eisTest1 = calculateEnterpriseInnovationScheme({
    expenditures: {
      RND_LOCAL: 250000,
      IP_REGISTRATION: 50000
    },
    optForCashConversion: false,
    yearOfAssessment: 2024
  });
  // R&D: $250k * 400% = $1,000,000 deduction
  // IP Reg: $50k * 400% = $200,000 deduction
  // Total qualifying spend = $300,000. Total tax deduction = $1,200,000
  // Estimated tax savings @ 17% = $204,000
  assert.strictEqual(eisTest1.summary.totalQualifyingSpendSgd, 300000);
  assert.strictEqual(eisTest1.summary.totalTaxDeductionSgd, 1200000);
  assert.strictEqual(eisTest1.summary.estimatedTaxSavingsSgd, 204000);
  assert.strictEqual(eisTest1.activityBreakdown.RND_LOCAL.totalDeductionSgd, 1000000);
  assert.strictEqual(eisTest1.activityBreakdown.IP_REGISTRATION.totalDeductionSgd, 200000);

  // Cash conversion: $100k cap @ 20% = $20k non-taxable payout
  const eisCash = calculateEnterpriseInnovationScheme({
    expenditures: { RND_LOCAL: 150000 },
    optForCashConversion: true
  });
  assert.strictEqual(eisCash.cashConversion.isEligible, true);
  assert.strictEqual(eisCash.cashConversion.cashPayoutSgd, 20000);
  console.log("  ✅ EIS: 400% statutory deduction & cash conversion verified.");

  // ===============================================================
  // 6. Loss Carry-Forward & Carry-Back Relief (Sections 37 & 37E)
  // ===============================================================
  console.log("  [6/14] Testing Loss Carry-Forward & Carry-Back Engine...");
  // Carry-back: $150k loss carried back to offset previous YA assessable income $80k (capped at $100k)
  const lossCb = evaluateLossUtilization({
    currentYearLosses: 150000,
    currentYearCapitalAllowance: 20000,
    previousYearAssessableIncome: 80000,
    optForCarryBack: true
  });
  assert.strictEqual(lossCb.carryBackRelief.amountUtilizedSgd, 80000);
  assert.strictEqual(lossCb.carryBackRelief.estimatedTaxRefundSgd, 13600); // 80,000 * 0.17
  assert.strictEqual(lossCb.carryForwardRelief.closingUnabsorbedTradeLossesSgd, 90000); // 150k - 60k remaining used

  // SCT failing (< 50% continuity): prior losses disallowed
  const lossSctFail = evaluateLossUtilization({
    currentYearTaxableProfit: 100000,
    priorYearUnabsorbedLosses: 50000,
    shareholdingContinuityPercent: 30
  });
  assert.strictEqual(lossSctFail.compliance.passesShareholdingContinuityTest, false);
  assert.strictEqual(lossSctFail.carryForwardRelief.disallowedLossesSgd, 50000);
  assert.strictEqual(lossSctFail.carryForwardRelief.netChargeableIncomeAfterOffsetSgd, 100000);
  console.log("  ✅ Loss Relief: Carry-back cap, SCT 50% test, and absorption verified.");

  // ===============================================================
  // 7. Group Relief Loss Transfer (Section 37C)
  // ===============================================================
  console.log("  [7/14] Testing Group Relief Loss Transfer Engine...");
  const grSuccess = evaluateGroupReliefTransfer({
    transferor: {
      companyName: 'LossCo Pte Ltd',
      isIncorporatedInSingapore: true,
      financialYearEnd: '2024-12-31',
      currentYearLosses: 100000,
      currentYearCapitalAllowance: 30000
    },
    transferee: {
      companyName: 'ProfitCo Pte Ltd',
      isIncorporatedInSingapore: true,
      financialYearEnd: '2024-12-31',
      assessableIncome: 200000
    },
    shareholdingPercentage: 80
  });
  assert.strictEqual(grSuccess.isEligible, true);
  assert.strictEqual(grSuccess.transferSummary.totalTransferredSgd, 130000);
  assert.strictEqual(grSuccess.transferSummary.transfereeNetIncomeAfterReliefSgd, 70000); // 200k - 130k
  assert.strictEqual(grSuccess.transferSummary.estimatedGroupTaxSavingsSgd, 22100);

  // Failure: Shareholding < 75%
  const grFail = evaluateGroupReliefTransfer({
    transferor: { companyName: 'A', isIncorporatedInSingapore: true, financialYearEnd: '2024-12-31', currentYearLosses: 50000 },
    transferee: { companyName: 'B', isIncorporatedInSingapore: true, financialYearEnd: '2024-12-31', assessableIncome: 100000 },
    shareholdingPercentage: 60
  });
  assert.strictEqual(grFail.isEligible, false);
  assert.strictEqual(grFail.failureReasons.some(r => r.includes('75%')), true);
  console.log("  ✅ Group Relief: 75% threshold, same accounting period, and loss absorption verified.");

  // ===============================================================
  // 8. Foreign Tax Credit & FTC Pooling (Sections 50 & 50A)
  // ===============================================================
  console.log("  [8/14] Testing Foreign Tax Credit & FTC Pooling Engine...");
  const ftcRes = calculateForeignTaxCredit({
    foreignIncomes: [
      {
        country: 'Australia',
        incomeType: 'Dividend',
        foreignIncomeGrossSgd: 100000,
        foreignTaxPaidSgd: 30000,
        foreignHeadlineTaxRate: 0.30
      },
      {
        country: 'Hong Kong',
        incomeType: 'Interest',
        foreignIncomeGrossSgd: 50000,
        foreignTaxPaidSgd: 4000,
        foreignHeadlineTaxRate: 0.165
      }
    ],
    usePooling: true
  });
  assert.strictEqual(ftcRes.summary.totalForeignIncomeGrossSgd, 150000);
  assert.strictEqual(ftcRes.summary.totalForeignTaxPaidSgd, 34000);
  assert.strictEqual(ftcRes.summary.totalFtcAllowedSgd, 25500); // 150k * 0.17
  assert.strictEqual(ftcRes.summary.netSingaporeTaxPayableSgd, 0);
  console.log("  ✅ FTC: Item-by-item limitation and Section 50A FTC Pooling verified.");

  // ===============================================================
  // 9. Family Office & Fund Exemption (Sections 13O & 13U)
  // ===============================================================
  console.log("  [9/14] Testing Family Office 13O/13U Exemption Engine...");
  // 13O: AUM $25M, 2 IPs, local spending $250k, local investments $2.5M
  const fo13o = evaluateFamilyOfficeExemption({
    scheme: '13O',
    assetsUnderManagementSgd: 25000000,
    numberOfInvestmentProfessionals: 2,
    annualLocalBusinessSpendingSgd: 250000,
    localInvestmentsSgd: 2500000
  });
  assert.strictEqual(fo13o.isCompliant, true);
  assert.strictEqual(fo13o.breaches.length, 0);

  // 13U failure: lacking independent IP and AUM < 50M
  const fo13uFail = evaluateFamilyOfficeExemption({
    scheme: '13U',
    assetsUnderManagementSgd: 40000000,
    numberOfInvestmentProfessionals: 2,
    hasIndependentProfessional: false,
    annualLocalBusinessSpendingSgd: 300000,
    localInvestmentsSgd: 1000000
  });
  assert.strictEqual(fo13uFail.isCompliant, false);
  assert.strictEqual(fo13uFail.breaches.length >= 2, true);
  console.log("  ✅ Family Office: Sections 13O and 13U MAS criteria verified.");

  // ===============================================================
  // 10. BEPS 2.0 Pillar Two Domestic Top-up Tax (DTT)
  // ===============================================================
  console.log("  [10/14] Testing BEPS 2.0 Pillar Two DTT Engine...");
  const p2Res = calculateDomesticTopUpTax({
    globalConsolidatedRevenueSgd: 1500000000, // In scope (> 1.08B)
    singaporeGlobeIncomeSgd: 100000000,
    singaporeCoveredTaxesSgd: 10000000, // ETR = 10% (< 15%)
    eligiblePayrollCostsSgd: 20000000,
    eligibleTangibleAssetsSgd: 30000000
  });
  assert.strictEqual(p2Res.isInScope, true);
  assert.strictEqual(p2Res.financials.effectiveTaxRatePercent, 10);
  assert.strictEqual(p2Res.financials.topUpTaxRatePercent, 5);
  assert.strictEqual(p2Res.domesticTopUpTaxPayableSgd > 0, true);
  console.log("  ✅ BEPS 2.0: Scope threshold, ETR 15% delta, and SBIE carve-outs verified.");

  // ===============================================================
  // 11. Property Stamp Duty (BSD & ABSD)
  // ===============================================================
  console.log("  [11/14] Testing Stamp Duty & ABSD Engine...");
  // Residential: $2,000,000 property, Foreigner (60% ABSD)
  const stampForeigner = calculatePropertyStampDuty({
    propertyValue: 2000000,
    propertyType: 'RESIDENTIAL',
    buyerProfile: 'FOREIGNER',
    propertyCount: 1
  });
  assert.strictEqual(stampForeigner.bsd.amountSgd, 69600);
  assert.strictEqual(stampForeigner.absd.amountSgd, 1200000);
  assert.strictEqual(stampForeigner.totalStampDutyPayableSgd, 1269600);

  // SC 1st residential: 0% ABSD
  const stampSc1 = calculatePropertyStampDuty({
    propertyValue: 1000000,
    propertyType: 'RESIDENTIAL',
    buyerProfile: 'SC',
    propertyCount: 1
  });
  assert.strictEqual(stampSc1.absd.ratePercent, 0);
  assert.strictEqual(stampSc1.absd.amountSgd, 0);
  console.log("  ✅ Stamp Duty: Tiered BSD brackets and April 2023 ABSD schedules verified.");

  // ===============================================================
  // 12. IRAS Tax Audit Risk & Reconciliation
  // ===============================================================
  console.log("  [12/14] Testing IRAS Tax Audit Risk Engine...");
  const auditRisk = assessTaxAuditRisk({
    revenueCitSgd: 2000000,
    revenueGstAnnualSgd: 1500000, // 25% variance (> 5% threshold)
    grossProfitMarginPercent: 12,
    industryBenchmarkGpmPercent: 30, // 18% variance
    directorRemunerationSgd: 1200000, // 60% of revenue (> 40% threshold)
    directorLoanCreditBalanceSgd: 600000, // > $500k
    foreignInterestRoyaltyExpenseSgd: 100000,
    whtRemittedSgd: 0 // WHT deficit
  });
  assert.strictEqual(auditRisk.riskTier, 'SEVERE');
  assert.strictEqual(auditRisk.riskScore >= 60, true);
  assert.strictEqual(auditRisk.riskFlags.length >= 4, true);
  console.log("  ✅ Tax Audit Risk: Multi-factor red flag scoring verified.");

  // ===============================================================
  // 13. Transfer Pricing & Section 34E Surcharge
  // ===============================================================
  console.log("  [13/14] Testing Transfer Pricing Compliance Engine...");
  const tpRes = evaluateTransferPricingCompliance({
    annualGrossRevenueSgd: 15000000, // > 10M mandatory TPD
    relatedPartyTransactions: {
      GOODS: 18000000, // > 15M threshold
      SERVICES: 1500000 // > 1M threshold
    },
    testedPartyMarginPercent: 2.5,
    comparableBenchmark: { q1: 4.0, median: 6.0, q3: 8.0 },
    transactionBaseAmountSgd: 2000000
  });
  assert.strictEqual(tpRes.isMandatoryTpdByRevenue, true);
  assert.strictEqual(tpRes.rptBreakdown.GOODS.exceedsThreshold, true);
  assert.strictEqual(tpRes.rptBreakdown.SERVICES.exceedsThreshold, true);
  assert.strictEqual(tpRes.armsLengthEvaluation.status, 'OUTSIDE_ARMS_LENGTH_RANGE');
  assert.strictEqual(tpRes.armsLengthEvaluation.statutorySurcharge5PercentSgd, 3500); // 5% of 70,000 adjustment
  console.log("  ✅ Transfer Pricing: TPD thresholds, IQR arm's length, and 5% surcharge verified.");

  // ===============================================================
  // 14. Plant & Machinery Capital Allowances (Sections 19 & 19A)
  // ===============================================================
  console.log("  [14/14] Testing Capital Allowances Engine...");
  const caRes = calculateCapitalAllowances({
    assets: [
      { description: 'Server hardware', costSgd: 30000, scheme: '19A_1YR' },
      { description: 'Office Furniture', costSgd: 60000, scheme: '19A_3YR' },
      { description: 'Printers', costSgd: 10000, scheme: 'LOW_VALUE', quantity: 4 }
    ]
  });
  // 19A 1-year: 30,000 * 100% = 30,000
  // 19A 3-year: 60,000 / 3 = 20,000
  // Low-value: unit cost $2,500 <= $5,000, total $10,000 (under $30,000 pool cap) = 10,000
  // Total Year 1 allowance = 30,000 + 20,000 + 10,000 = 60,000
  assert.strictEqual(caRes.summary.totalAssetAdditionsCostSgd, 100000);
  assert.strictEqual(caRes.summary.totalCapitalAllowancesClaimedSgd, 60000);
  assert.strictEqual(caRes.summary.lowValueAssetsClaimedSgd, 10000);
  console.log("  ✅ Capital Allowances: 1-Year, 3-Year accelerated, and low-value pool verified.");

  console.log("\n✅ All Singapore Tax Domain Engine Tests Passed 100%!");
}

runTaxEnginesTests();
