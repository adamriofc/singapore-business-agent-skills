'use strict';

const assert = require('assert');
const {
  calculateSingaporeCit,
  calculateSingaporeGstRate,
  evaluateGstRegistrationLiability,
  calculateGstFiling,
  calculateSingaporeWht,
  evaluateDtaSgIdRelief
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
  // 4. Singapore-Indonesia Double Tax Agreement (DTA) Relief
  // ===============================================================
  console.log("  [4/4] Testing SG-ID Bilateral DTA Relief Engine...");

  // 4a. Outbound ID to SG Dividends (SG Parent owns 100% equity with valid COR)
  const dtaDiv = evaluateDtaSgIdRelief({
    incomeType: 'DIVIDENDS',
    grossAmountSgdOrIdr: 1000000000, // IDR 1B
    flowDirection: 'ID_TO_SG',
    equityHoldingPercentage: 100,
    hasValidCorOrDgtForm: true
  });
  // Domestic ID PPh 26 = 20% (200,000,000)
  // Treaty Art 10 (>= 25% equity + COR) = 10% (100,000,000)
  // Tax savings = 100,000,000
  assert.strictEqual(dtaDiv.domesticStatutoryRate, 0.20);
  assert.strictEqual(dtaDiv.treatyRate, 0.10);
  assert.strictEqual(dtaDiv.treatyTaxPayable, 100000000);
  assert.strictEqual(dtaDiv.taxSavingsBenefit, 100000000);
  assert.strictEqual(dtaDiv.treatyArticle, 'Article 10 (Dividends)');
  assert.strictEqual(dtaDiv.reliefStatus, 'TREATY_RELIEF_APPLIED');

  // 4b. Outbound ID to SG Dividends without COR (Treaty Relief Denied)
  const dtaNoCor = evaluateDtaSgIdRelief({
    incomeType: 'DIVIDENDS',
    grossAmountSgdOrIdr: 1000000000,
    flowDirection: 'ID_TO_SG',
    equityHoldingPercentage: 100,
    hasValidCorOrDgtForm: false
  });
  assert.strictEqual(dtaNoCor.treatyRate, 0.20);
  assert.strictEqual(dtaNoCor.taxSavingsBenefit, 0);
  assert.strictEqual(dtaNoCor.reliefStatus, 'DISQUALIFIED_MISSING_COR_DGT');

  // 4c. Technical Services (Business Profits / PE)
  const dtaServices = evaluateDtaSgIdRelief({
    incomeType: 'MANAGEMENT_OR_TECH_SERVICES',
    grossAmountSgdOrIdr: 500000000,
    flowDirection: 'ID_TO_SG',
    hasValidCorOrDgtForm: true
  });
  assert.strictEqual(dtaServices.treatyRate, 0.0);
  assert.strictEqual(dtaServices.treatyTaxPayable, 0);
  assert.strictEqual(dtaServices.taxSavingsBenefit, 100000000); // 20% of 500M = 100M
  console.log("  ✅ DTA: Bilateral SG-ID treaty articles and compliance prerequisites verified.");

  console.log("\n✅ All Singapore Tax Domain Engine Tests Passed 100%!");
}

runTaxEnginesTests();
