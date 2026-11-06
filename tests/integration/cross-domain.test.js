'use strict';

const assert = require('assert');
const sbas = require('../../index.js');

function runCrossDomainIntegrationTest() {
  console.log("🇸🇬 Running Full Cross-Domain Singapore Business Lifecycle Integration Test...\n");

  // ===============================================================
  // STAGE 1: Incorporation & Corporate Secretarial Governance (ACRA)
  // ===============================================================
  console.log("  [Stage 1] Incorporating 'SingaTech Pte Ltd' & Setting ACRA Statutory Calendar...");
  const acraSetup = sbas.calculateAcraStatutoryDeadlines({
    financialYearEndDate: '2024-12-31',
    isListedCompany: false,
    hasResidentDirector: true,
    isSoleDirectorSecretary: false,
    currentDate: '2025-05-15'
  });
  assert.strictEqual(acraSetup.statutoryFilingTimeline.agmDeadlineDate, '2025-06-30');
  assert.strictEqual(acraSetup.statutoryFilingTimeline.arFilingDeadlineDate, '2025-07-31');
  assert.strictEqual(acraSetup.filingStatusAudit.isAnnualReturnOverdue, false);
  assert.strictEqual(acraSetup.governanceAudit.isGovernanceCompliant, true);

  // Year 1 Audit Exemption
  const auditExempt = sbas.evaluateSmallCompanyAuditExemption({
    isPrivateCompany: true,
    isNewlyIncorporated: true,
    currentYearFinancials: {
      annualRevenueSgd: 2500000,
      totalAssetsSgd: 1800000,
      fullTimeEmployees: 12
    }
  });
  assert.strictEqual(auditExempt.isExemptFromAudit, true);
  console.log("  ✅ Stage 1 Complete: ACRA compliance established & Small Company Audit Exemption secured.");

  // ===============================================================
  // STAGE 2: Workforce Deployment & Talent Onboarding (MOM / CPF)
  // ===============================================================
  console.log("  [Stage 2] Onboarding Local Team & Foreign Engineering Lead...");

  // Local Staff CPF: S$6,000 monthly wage, Citizen age 32
  const localCpf = sbas.calculateSingaporeCpf({
    ordinaryWage: 6000,
    age: 32,
    residentialStatus: 'CITIZEN',
    calendarYear: 2024,
    communityFund: 'CDAC'
  });
  assert.strictEqual(localCpf.contributions.employeeCpfSgd, 1200);
  assert.strictEqual(localCpf.contributions.employerCpfSgd, 1020);
  assert.strictEqual(localCpf.leviesAndFunds.skillsDevelopmentLevySgd, 11.25);

  // Foreign EP Lead COMPASS scoring: S$9,500 salary, Top-Tier Degree, Sector Non-Financial
  const compassEp = sbas.evaluateCompassEpEligibility({
    monthlySalarySgd: 9500,
    candidateAge: 31,
    sector: 'NON_FINANCIAL_SERVICES',
    salaryPercentileRank: 'P90_AND_ABOVE',
    qualificationLevel: 'TOP_TIER',
    firmPmetCount: 15 // Small firm default 10 pts each for C3 and C4
  });
  assert.strictEqual(compassEp.meetsMinimumQualifyingSalary, true);
  assert.strictEqual(compassEp.totalCompassScore, 60);
  assert.strictEqual(compassEp.isPassMarkMet, true);

  // DRC Quota Check: Services Sector with 10 local staff, 1 S-Pass
  const drcCheck = sbas.calculateForeignWorkforceQuota({
    sector: 'SERVICES',
    localHeadcount: 10,
    currentSPassCount: 1,
    currentWorkPermitCount: 0
  });
  assert.strictEqual(drcCheck.complianceAudit.isFullyCompliant, true);
  console.log("  ✅ Stage 2 Complete: CPF payroll verified, EP COMPASS cleared (60 pts), & MOM DRC compliant.");

  // ===============================================================
  // STAGE 3: Revenue Generation, GST & Corporate Tax (IRAS)
  // ===============================================================
  console.log("  [Stage 3] Financial Operations, GST Filing & Year-End CIT Assessment...");

  // GST Filing: S$600k sales, S$200k purchases, 9% standard rate
  const gstFiling = sbas.calculateGstFiling({
    standardRatedSuppliesSgd: 600000,
    taxablePurchasesSgd: 200000,
    effectiveRate: 0.09
  });
  assert.strictEqual(gstFiling.totalOutputTaxSgd, 54000);
  assert.strictEqual(gstFiling.totalInputTaxClaimedSgd, 18000);
  assert.strictEqual(gstFiling.netGstPayableSgd, 36000);

  // Corporate Income Tax (CIT) for Qualifying Startup, Net Chargeable Income S$180,000
  const citTax = sbas.calculateSingaporeCit({
    chargeableIncome: 180000,
    isQualifyingStartup: true,
    yearOfAssessment: 2024,
    hasLocalEmployeeWithCpf: true
  });
  assert.strictEqual(citTax.exemptionScheme, 'START_UP_TAX_EXEMPTION_SUTE');
  // Tier 1 exempt: 75% of 100k = 75k. Tier 2 exempt: 50% of 80k = 40k. Total exempt = 115k.
  assert.strictEqual(citTax.exemptionBreakdown.totalExemptIncomeSgd, 115000);
  assert.strictEqual(citTax.taxableIncomeAfterExemptionSgd, 65000);
  console.log("  ✅ Stage 3 Complete: Quarterly GST settled & SUTE startup tax exemptions calculated.");

  // ===============================================================
  // STAGE 4: Capital Structure & Working Capital
  // ===============================================================
  console.log("  [Stage 4] Treasury Management, SORA WACC & Working Capital Efficiency...");

  const wacc = sbas.calculateSingaporeWacc({
    marketValueOfEquitySgd: 3000000,
    marketValueOfDebtSgd: 1000000,
    riskFreeRate: 0.030,
    equityBeta: 1.1,
    equityRiskPremium: 0.055,
    soraBaseRate: 0.032,
    debtCreditSpread: 0.015,
    citTaxRate: 0.17
  });
  assert.strictEqual(wacc.capitalStructure.equityWeightPercent, 75);
  assert.strictEqual(wacc.capitalStructure.debtWeightPercent, 25);
  assert.strictEqual(typeof wacc.waccResult.weightedAverageCostOfCapitalPercent, 'number');

  const wc = sbas.calculateSingaporeWorkingCapital({
    currentAssetsSgd: 1500000,
    currentLiabilitiesSgd: 600000,
    cashAndEquivalentsSgd: 400000,
    tradeReceivablesSgd: 500000,
    inventorySgd: 600000,
    tradePayablesSgd: 250000,
    annualRevenueSgd: 4500000,
    annualCogsSgd: 2250000
  });
  assert.strictEqual(wc.liquidityMetrics.isSolventShortTerm, true);
  assert.strictEqual(wc.capitalRequirements.position, 'WORKING_CAPITAL_SURPLUS');
  console.log("  ✅ Stage 4 Complete: SORA-linked WACC and SFRS working capital surplus verified.");

  // ===============================================================
  // STAGE 5: Regional Expansion & Cross-Border SG-ID Operations
  // ===============================================================
  console.log("  [Stage 5] EnterpriseSG Grant Application & Cross-Border Holding Optimization...");

  // EnterpriseSG MRA Grant for expanding to Indonesia: S$50k budget
  const mraGrant = sbas.evaluateEnterpriseGrant({
    grantScheme: 'MRA',
    qualifyingProjectCostSgd: 50000,
    localShareholdingPercentage: 60,
    isRegisteredInSingapore: true
  });
  assert.strictEqual(mraGrant.isEligibleForGrant, true);
  assert.strictEqual(mraGrant.fundingCalculation.approvedGrantFundingSgd, 25000);

  // Cross-Border Holding Structure: Repatriating S$500k dividend from Indonesian subsidiary
  const crossBorder = sbas.evaluateCrossBorderHoldingStructure({
    dividendAmountIdrOrSgd: 500000,
    equityShareholdingPercent: 100,
    shareHoldingDurationMonths: 24,
    hasValidCorCertificate: true,
    operatingTaxRateInOrigin: 0.22,
    estimatedAnnualSgMaintenanceCostSgd: 8000
  });
  // DTA Art 10 reduces Indonesian WHT from 20% (100k) to 10% (50k) -> S$50,000 tax saved
  assert.strictEqual(crossBorder.singaporeHoldingScenario.indonesiaOutboundWhtRate, 0.10);
  assert.strictEqual(crossBorder.comparativeAnalysis.grossTaxSavingsBenefit, 50000);
  assert.strictEqual(crossBorder.comparativeAnalysis.netFinancialEfficiencyDelta, 42000); // 50k - 8k = 42k
  assert.strictEqual(crossBorder.statutorySafeHarbours.section13W_CapitalGainsSafeHarbourQualified, true);
  console.log("  ✅ Stage 5 Complete: MRA grant secured & SG-ID cross-border holding tax savings realized.");

  console.log("\n==================================================================");
  console.log("🎉 Full End-to-End Cross-Domain Singapore Lifecycle Integration Test PASSED 100%!");
  console.log("==================================================================\n");
}

runCrossDomainIntegrationTest();
