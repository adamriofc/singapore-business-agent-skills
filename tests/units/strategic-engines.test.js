'use strict';

const assert = require('assert');
const {
  evaluateEnterpriseGrant,
  evaluateCorporateStructuring,
  evaluateMarketEntrySg,
  evaluateCompetitiveMoatSg,
  simulateMacroScenarioSg,
  evaluateStrategicRiskSg
} = require('../../index.js');

function runStrategicEnginesTests() {
  console.log("🇸🇬 Running Singapore Strategic Planning & Governance Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. Enterprise Singapore (EnterpriseSG) Grant Engine
  // ===============================================================
  console.log("  [1/6] Testing Enterprise Government Grant Engine (EDG/PSG/MRA)...");

  // 1a. Standard EDG Grant (50% co-funding, Project S$200,000, 35% local equity)
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
    localShareholdingPercentage: 20
  });
  assert.strictEqual(grantDisqualified.isEligibleForGrant, false);
  assert.strictEqual(grantDisqualified.disqualificationReasons.includes('LOCAL_SHAREHOLDING_BELOW_STATUTORY_30_PERCENT_THRESHOLD'), true);
  console.log("  ✅ Grant: Disqualification for local equity < 30% audited.");

  // ===============================================================
  // 2. Singapore Corporate Structuring & Holding Governance Engine
  // ===============================================================
  console.log("  [2/6] Testing Corporate Structuring & Holding Governance Engine (FSIE Sec 13(8), Sec 13W, Single-Tier)...");

  // 2a. S$1,000,000 Foreign Dividend (Source CIT 22% >= 15%, 100% equity, 24 mo holding)
  const holdingEval = evaluateCorporateStructuring({
    dividendAmountSgd: 1000000,
    equityShareholdingPercent: 100,
    shareHoldingDurationMonths: 24,
    sourceJurisdictionHeadlineCitRate: 0.22,
    subjectToTaxInSource: true,
    isBonaFideResident: true,
    annualMaintenanceCostSgd: 8000
  });

  assert.strictEqual(holdingEval.singaporeHoldingAssessment.qualifiesForSection138Fsie, true);
  assert.strictEqual(holdingEval.singaporeHoldingAssessment.singaporeCorporateTaxRate, 0);
  assert.strictEqual(holdingEval.singaporeHoldingAssessment.singaporeCorporateTaxPayable, 0);
  assert.strictEqual(holdingEval.singaporeHoldingAssessment.singaporeOutboundDividendWhtRate, 0);
  assert.strictEqual(holdingEval.singaporeHoldingAssessment.singaporeOutboundDividendWhtPayable, 0);
  assert.strictEqual(holdingEval.singaporeHoldingAssessment.netDividendRepatriated, 1000000);
  assert.strictEqual(holdingEval.singaporeHoldingAssessment.netCashDeliverable, 992000);
  assert.strictEqual(holdingEval.capitalGainsSection13W.qualifiesForSection13WSafeHarbour, true);
  assert.strictEqual(holdingEval.capitalGainsSection13W.statutoryExemptionStatus, 'CONFIRMED_SAFE_HARBOUR_EXEMPT');
  console.log("  ✅ Structuring: Section 13(8) FSIE exemption & Section 13W safe harbour verified.");

  // 2b. Disqualified FSIE (Source headline CIT rate 10% < 15% threshold)
  const disqualifiedFsie = evaluateCorporateStructuring({
    dividendAmountSgd: 500000,
    sourceJurisdictionHeadlineCitRate: 0.10,
    subjectToTaxInSource: true,
    isBonaFideResident: true
  });
  assert.strictEqual(disqualifiedFsie.singaporeHoldingAssessment.qualifiesForSection138Fsie, false);
  assert.strictEqual(disqualifiedFsie.singaporeHoldingAssessment.singaporeCorporateTaxRate, 0.17);
  assert.strictEqual(disqualifiedFsie.singaporeHoldingAssessment.singaporeCorporateTaxPayable, 85000);
  console.log("  ✅ Structuring: Section 13(8) headline rate < 15% disqualification verified.");

  // 2c. Section 13W Non-Qualification (< 24 months holding duration)
  const shortHolding = evaluateCorporateStructuring({
    dividendAmountSgd: 200000,
    equityShareholdingPercent: 50,
    shareHoldingDurationMonths: 12
  });
  assert.strictEqual(shortHolding.capitalGainsSection13W.qualifiesForSection13WSafeHarbour, false);
  assert.strictEqual(shortHolding.capitalGainsSection13W.statutoryExemptionStatus, 'SUBJECT_TO_BADGES_OF_TRADE_REVIEW');
  console.log("  ✅ Structuring: Section 13W holding period constraint verified.");

  // ===============================================================
  // 3. Singapore Market Entry & Regional Expansion Engine
  // ===============================================================
  console.log("  [3/6] Testing Market Entry & Regional Expansion Engine (Subsidiary vs Branch vs Rep Office)...");

  // 3a. Subsidiary (Pte Ltd) Setup with ASEAN expansion
  const subEntry = evaluateMarketEntrySg({
    targetStructure: 'SUBSIDIARY',
    projectedAnnualRevenueSgd: 2500000,
    projectedLocalOperatingExpensesSgd: 400000,
    projectedLocalHeadcount: 5,
    plansRegionalExpansion: true,
    targetAseanMarkets: ['ID', 'MY', 'VN'],
    holdsForeignIntellectualPropertyOrShares: true
  });
  assert.strictEqual(subEntry.targetStructure, 'SUBSIDIARY');
  assert.strictEqual(subEntry.statutoryProfile.limitedLiabilityProtection, true);
  assert.strictEqual(subEntry.statutoryProfile.qualifiesForStartupTaxExemption, true);
  assert.strictEqual(subEntry.economicSubstanceEvaluation.passesEconomicSubstance, true);
  assert.strictEqual(subEntry.regionalHubRouting.targetAseanMarketsCount, 3);
  assert.strictEqual(subEntry.isApprovedForMarketEntry, true);
  console.log("  ✅ Market Entry: Subsidiary entity with Section 10L substance verified.");

  // 3b. Branch Office Setup
  const branchEntry = evaluateMarketEntrySg({
    targetStructure: 'BRANCH',
    projectedAnnualRevenueSgd: 1000000,
    projectedLocalOperatingExpensesSgd: 150000,
    projectedLocalHeadcount: 2
  });
  assert.strictEqual(branchEntry.targetStructure, 'BRANCH');
  assert.strictEqual(branchEntry.statutoryProfile.limitedLiabilityProtection, false);
  assert.strictEqual(branchEntry.statutoryProfile.qualifiesForStartupTaxExemption, false);
  console.log("  ✅ Market Entry: Foreign branch office characteristics audited.");

  // 3c. Representative Office (Disallowed Commercial Revenue)
  const roEntry = evaluateMarketEntrySg({
    targetStructure: 'REPRESENTATIVE_OFFICE',
    projectedAnnualRevenueSgd: 500000,
    projectedLocalOperatingExpensesSgd: 80000,
    projectedLocalHeadcount: 1
  });
  assert.strictEqual(roEntry.statutoryProfile.isLegallyPermittedForCommercialRevenue, false);
  assert.strictEqual(roEntry.isApprovedForMarketEntry, false);
  assert.strictEqual(roEntry.totalComplianceBlockers >= 1, true);
  console.log("  ✅ Market Entry: Representative Office commercial revenue restriction verified.");

  // ===============================================================
  // 4. Industry Cluster & Competitive Moat Engine
  // ===============================================================
  console.log("  [4/6] Testing Competitive Moat & VRIO Framework Engine...");

  // 4a. FinTech Cluster with Sustainable Moat (VRIO = All true, MAS license, IPOS patent)
  const fintechMoat = evaluateCompetitiveMoatSg({
    industryCluster: 'FINTECH',
    hasValuableAsset: true,
    hasRareCapability: true,
    isCostlyToImitate: true,
    isOrganizedToCaptureValue: true,
    holdsStatutoryLicense: true,
    holdsRegisteredIpInIpos: true
  });
  assert.strictEqual(fintechMoat.vrioAudit.competitiveImplication, 'SUSTAINED_COMPETITIVE_ADVANTAGE');
  assert.strictEqual(fintechMoat.vrioAudit.vrioMoatScore >= 80, true);
  assert.strictEqual(fintechMoat.strategicMoatVerdict, 'ROBUST_SINGAPORE_MOAT');
  assert.strictEqual(fintechMoat.clusterRegulatoryContext.holdsStatutoryLicense, true);
  console.log("  ✅ Moat: FinTech Wide Moat with MAS regulatory barrier verified.");

  // 4b. General Commercial with Competitive Parity
  const parityMoat = evaluateCompetitiveMoatSg({
    industryCluster: 'GENERAL_COMMERCIAL',
    hasValuableAsset: true,
    hasRareCapability: false,
    isCostlyToImitate: false,
    isOrganizedToCaptureValue: true
  });
  assert.strictEqual(parityMoat.vrioAudit.competitiveImplication, 'COMPETITIVE_PARITY');
  assert.strictEqual(parityMoat.strategicMoatVerdict, 'VULNERABLE_TO_REGIONAL_COMPETITION');
  console.log("  ✅ Moat: Competitive Parity and No Moat classification verified.");

  // ===============================================================
  // 5. Macroeconomic Stress Testing Engine
  // ===============================================================
  console.log("  [5/6] Testing Macroeconomic Stress Testing Engine (MAS S$NEER, Inflation, Disruptions)...");

  // 5a. MAS S$NEER Tightening & Appreciation (Revenue S$10M, OpEx S$7M)
  const masTightening = simulateMacroScenarioSg({
    baselineRevenueSgd: 10000000,
    baselineOpexSgd: 7000000,
    scenarioType: 'MAS_TIGHTENING_SGD_APPRECIATION',
    foreignRevenueSharePercent: 60,
    importedGoodsSharePercent: 40
  });
  assert.strictEqual(masTightening.scenarioType, 'MAS_TIGHTENING_SGD_APPRECIATION');
  assert.strictEqual(masTightening.stressedFinancialsSgd.adjustedAnnualRevenue < 10000000, true);
  assert.strictEqual(masTightening.stressedFinancialsSgd.adjustedAnnualOpEx < 7000000, true);
  assert.strictEqual(typeof masTightening.stressResilienceTier, 'string');
  console.log("  ✅ Macro: MAS S$NEER tightening currency shock simulation verified.");

  // 5b. Stagflation Shock Scenario
  const stagflation = simulateMacroScenarioSg({
    baselineRevenueSgd: 5000000,
    baselineOpexSgd: 4000000,
    scenarioType: 'STAGFLATION_SHOCK'
  });
  assert.strictEqual(stagflation.stressedFinancialsSgd.profitChangeSgd < 0, true);
  console.log("  ✅ Macro: Stagflation margin compression verified.");

  // ===============================================================
  // 6. Strategic Risk Matrix & ERM Heatmap Engine
  // ===============================================================
  console.log("  [6/6] Testing Corporate Strategic Risk Matrix & ERM Heatmap Engine (SGX Rule 1207(10))...");

  const riskAssessment = evaluateStrategicRiskSg({
    risks: [
      { id: 'R1', title: 'PDPA Data Breach Risk', category: 'REPUTATIONAL_CYBER', likelihood: 4, impact: 5, velocity: 3 },
      { id: 'R2', title: 'MAS Regulatory Non-Compliance', category: 'REGULATORY_COMPLIANCE', likelihood: 3, impact: 4, velocity: 2 },
      { id: 'R3', title: 'Foreign FX Volatility', category: 'FINANCIAL_MARKET', likelihood: 3, impact: 3, velocity: 2 },
      { id: 'R4', title: 'Key Supplier Disruption', category: 'OPERATIONAL_SUPPLY', likelihood: 2, impact: 3, velocity: 1 }
    ],
    hasBoardRiskCommittee: true,
    hasDocumentedErmPolicy: true
  });
  assert.strictEqual(riskAssessment.totalRisksEvaluated, 4);
  assert.strictEqual(riskAssessment.severityBreakdown.criticalExtremeCount, 1);
  assert.strictEqual(riskAssessment.severityBreakdown.highCount, 1);
  assert.strictEqual(riskAssessment.boardOversightAudit.hasBoardRiskCommittee, true);
  assert.strictEqual(riskAssessment.boardOversightAudit.sgxCodeOfCorporateGovernanceCompliant, true);
  console.log("  ✅ Strategic Risk: Enterprise ERM heatmap and SGX Board compliance verified.");

  console.log("\n✅ All 6 Singapore Strategic Planning & Governance Domain Engine Tests Passed 100%!");
}

runStrategicEnginesTests();
