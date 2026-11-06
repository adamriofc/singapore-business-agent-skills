'use strict';

const assert = require('assert');
const {
  evaluateEnterpriseGrant,
  evaluateCrossBorderHoldingStructure
} = require('../../index.js');

function runStrategicEnginesTests() {
  console.log("🇸🇬 Running Singapore Strategic Planning & Cross-Border Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. Enterprise Singapore (EnterpriseSG) Grant Engine
  // ===============================================================
  console.log("  [1/2] Testing Enterprise Government Grant Engine (EDG/PSG/MRA)...");

  // 1a. Standard EDG Grant (50% co-funding, Project S$200,000, 30% local equity)
  const edgStd = evaluateEnterpriseGrant({
    grantScheme: 'EDG',
    qualifyingProjectCostSgd: 200000,
    localShareholdingPercentage: 35,
    isRegisteredInSingapore: true,
    groupAnnualTurnoverSgd: 5000000,
    groupEmployeeCount: 25
  });
  assert.strictEqual(edgStd.isEligibleForGrant, true);
  assert.strictEqual(edgStd.fundingCalculation.statutorySupportRatePercent, 50);
  assert.strictEqual(edgStd.fundingCalculation.approvedGrantFundingSgd, 100000);
  assert.strictEqual(edgStd.fundingCalculation.companyCoPaymentShareSgd, 100000);
  console.log("  ✅ Grant: Standard EDG 50% co-funding calculation verified.");

  // 1b. Enhanced EDG Grant (70% for Sustainability/Deep Tech)
  const edgEnhanced = evaluateEnterpriseGrant({
    grantScheme: 'EDG',
    qualifyingProjectCostSgd: 300000,
    localShareholdingPercentage: 50,
    isSustainabilityOrDeepTech: true
  });
  assert.strictEqual(edgEnhanced.fundingCalculation.statutorySupportRatePercent, 70);
  assert.strictEqual(edgEnhanced.fundingCalculation.approvedGrantFundingSgd, 210000);
  assert.strictEqual(edgEnhanced.fundingCalculation.companyCoPaymentShareSgd, 90000);
  console.log("  ✅ Grant: Enhanced EDG 70% sustainability/deep-tech rate verified.");

  // 1c. MRA Grant with Statutory Cap (S$100,000 per market, prior claim S$80,000)
  // Project S$60,000 -> 50% = S$30,000. Available headroom = S$20,000. Capped at S$20,000.
  const mraCapped = evaluateEnterpriseGrant({
    grantScheme: 'MRA',
    qualifyingProjectCostSgd: 60000,
    localShareholdingPercentage: 100,
    mraCumulativeClaimedSgd: 80000
  });
  assert.strictEqual(mraCapped.fundingCalculation.availableCapHeadroomSgd, 20000);
  assert.strictEqual(mraCapped.fundingCalculation.approvedGrantFundingSgd, 20000);
  assert.strictEqual(mraCapped.fundingCalculation.companyCoPaymentShareSgd, 40000);
  console.log("  ✅ Grant: MRA S$100k market cap constraint and remaining headroom verified.");

  // 1d. Disqualification: Local equity < 30%
  const grantDisqualified = evaluateEnterpriseGrant({
    grantScheme: 'EDG',
    qualifyingProjectCostSgd: 100000,
    localShareholdingPercentage: 20 // Below 30% statutory minimum
  });
  assert.strictEqual(grantDisqualified.isEligibleForGrant, false);
  assert.strictEqual(grantDisqualified.disqualificationReasons.includes('LOCAL_SHAREHOLDING_BELOW_STATUTORY_30_PERCENT_THRESHOLD'), true);
  console.log("  ✅ Grant: Disqualification for local equity < 30% audited.");

  // ===============================================================
  // 2. SG-ID Cross-Border Holding Structure Engine
  // ===============================================================
  console.log("  [2/2] Testing Cross-Border Holding Structure Engine (SG-ID DTA & Sec 13W)...");

  // 2a. S$1,000,000 Dividend Repatriation (ID PT -> SG HoldCo 100% -> Ultimate Beneficiary)
  // Direct: 20% Indonesian PPh 26 = S$200,000. Net = S$800,000.
  // SG HoldCo: 10% DTA WHT = S$100,000.
  // Singapore Section 13(8) FSIE: 0% tax (Indonesian CIT 22% >= 15%).
  // Singapore Outbound WHT: 0% (Single-Tier).
  // Net cash = S$900,000. Gross tax savings = S$100,000.
  // Maintenance cost S$8,000 -> Net economic benefit delta = S$92,000.
  // Section 13W: 100% holding for 24 months -> Qualified safe harbour.
  const holdingEval = evaluateCrossBorderHoldingStructure({
    dividendAmountIdrOrSgd: 1000000,
    equityShareholdingPercent: 100,
    shareHoldingDurationMonths: 24,
    hasValidCorCertificate: true,
    operatingTaxRateInOrigin: 0.22,
    estimatedAnnualSgMaintenanceCostSgd: 8000
  });

  assert.strictEqual(holdingEval.directHoldingScenario.withholdingTaxRate, 0.20);
  assert.strictEqual(holdingEval.directHoldingScenario.withholdingTaxPayable, 200000);
  assert.strictEqual(holdingEval.singaporeHoldingScenario.indonesiaOutboundWhtRate, 0.10);
  assert.strictEqual(holdingEval.singaporeHoldingScenario.indonesiaWhtTaxPayable, 100000);
  assert.strictEqual(holdingEval.singaporeHoldingScenario.section13_8_FsieExemptionApplies, true);
  assert.strictEqual(holdingEval.singaporeHoldingScenario.singaporeCitOnForeignDividend, 0);
  assert.strictEqual(holdingEval.singaporeHoldingScenario.netCashDelivered, 900000);
  assert.strictEqual(holdingEval.comparativeAnalysis.grossTaxSavingsBenefit, 100000);
  assert.strictEqual(holdingEval.comparativeAnalysis.netFinancialEfficiencyDelta, 92000);
  assert.strictEqual(holdingEval.comparativeAnalysis.isHoldingStructureEconomicallySuperior, true);
  assert.strictEqual(holdingEval.statutorySafeHarbours.section13W_CapitalGainsSafeHarbourQualified, true);
  console.log("  ✅ Holding: SG-ID DTA dividend waterfall, Sec 13(8) FSIE, and Sec 13W safe harbour verified.");

  console.log("\n✅ All Singapore Strategic Planning & Cross-Border Domain Engine Tests Passed 100%!");
}

runStrategicEnginesTests();
