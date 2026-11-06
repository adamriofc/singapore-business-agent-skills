'use strict';

const assert = require('assert');
const {
  calculateAcraStatutoryDeadlines,
  evaluateSmallCompanyAuditExemption,
  evaluatePdpaBreachNotification
} = require('../../index.js');

function runLegalEnginesTests() {
  console.log("🇸🇬 Running Singapore Corporate Governance & Legal Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. ACRA Statutory Filing Deadlines & Governance Audit
  // ===============================================================
  console.log("  [1/3] Testing ACRA Deadlines & Governance Engine...");

  // 1a. Private Non-Listed Company (FYE 2025-12-31, Ref Date: 2026-06-01)
  const acraPte = calculateAcraStatutoryDeadlines({
    financialYearEndDate: '2025-12-31',
    isListedCompany: false,
    hasResidentDirector: true,
    isSoleDirectorSecretary: false,
    currentDate: '2026-06-01'
  });
  // AGM: 6 months after FYE -> 2026-06-30
  // AR: 7 months after FYE -> 2026-07-31
  // On 2026-06-01, AR is not overdue, penalty = 0
  assert.strictEqual(acraPte.companyType, 'PRIVATE_NON_LISTED');
  assert.strictEqual(acraPte.statutoryFilingTimeline.agmDeadlineDate, '2026-06-30');
  assert.strictEqual(acraPte.statutoryFilingTimeline.arFilingDeadlineDate, '2026-07-31');
  assert.strictEqual(acraPte.filingStatusAudit.isAnnualReturnOverdue, false);
  assert.strictEqual(acraPte.filingStatusAudit.statutoryLatePenaltySgd, 0);
  assert.strictEqual(acraPte.governanceAudit.isGovernanceCompliant, true);
  console.log("  ✅ ACRA: Private non-listed statutory AGM (6m) & AR (7m) timeline verified.");

  // 1b. Public Listed Company (FYE 2025-12-31, Ref Date: 2026-06-01)
  // AGM: 4 months -> 2026-04-30
  // AR: 5 months -> 2026-05-31
  // On 2026-06-01, AR is overdue by 1 day -> Tier 1 penalty S$300
  const acraListed = calculateAcraStatutoryDeadlines({
    financialYearEndDate: '2025-12-31',
    isListedCompany: true,
    currentDate: '2026-06-01'
  });
  assert.strictEqual(acraListed.companyType, 'PUBLIC_LISTED');
  assert.strictEqual(acraListed.statutoryFilingTimeline.agmDeadlineDate, '2026-04-30');
  assert.strictEqual(acraListed.statutoryFilingTimeline.arFilingDeadlineDate, '2026-05-31');
  assert.strictEqual(acraListed.filingStatusAudit.isAnnualReturnOverdue, true);
  assert.strictEqual(acraListed.filingStatusAudit.penaltyTier, 'TIER_1_UP_TO_3_MONTHS');
  assert.strictEqual(acraListed.filingStatusAudit.statutoryLatePenaltySgd, 300);
  console.log("  ✅ ACRA: Public listed statutory AGM (4m) & AR (5m) and Tier 1 late penalty verified.");

  // 1c. Severe Overdue (>90 days) & Governance Breaches
  const acraBreach = calculateAcraStatutoryDeadlines({
    financialYearEndDate: '2025-06-30',
    isListedCompany: false,
    hasResidentDirector: false,
    isSoleDirectorSecretary: true,
    currentDate: '2026-06-01'
  });
  // AR was 2026-01-31. On 2026-06-01, overdue > 90 days -> Tier 2 penalty S$600
  assert.strictEqual(acraBreach.filingStatusAudit.isAnnualReturnOverdue, true);
  assert.strictEqual(acraBreach.filingStatusAudit.penaltyTier, 'TIER_2_MORE_THAN_3_MONTHS');
  assert.strictEqual(acraBreach.filingStatusAudit.statutoryLatePenaltySgd, 600);
  assert.strictEqual(acraBreach.governanceAudit.isGovernanceCompliant, false);
  assert.strictEqual(acraBreach.governanceAudit.violations.length, 2);
  console.log("  ✅ ACRA: Tier 2 late penalty (S$600) and Section 145/171 governance breaches detected.");

  // ===============================================================
  // 2. ACRA Small Company Audit Exemption (13th Schedule Companies Act)
  // ===============================================================
  console.log("  [2/3] Testing Small Company Audit Exemption Engine...");

  // 2a. Standalone Qualifying Company (Meets 3/3 in both years: Rev <= 10M, Assets <= 10M, Emp <= 50)
  const auditExempt = evaluateSmallCompanyAuditExemption({
    isPrivateCompany: true,
    currentYearFinancials: {
      annualRevenueSgd: 4500000,
      totalAssetsSgd: 3200000,
      fullTimeEmployees: 18
    },
    priorYearFinancials: {
      annualRevenueSgd: 3800000,
      totalAssetsSgd: 2700000,
      fullTimeEmployees: 15
    }
  });
  assert.strictEqual(auditExempt.isExemptFromAudit, true);
  assert.strictEqual(auditExempt.auditRequirementStatus, 'AUDIT_EXEMPT_UNAUDITED_STATEMENTS_PERMITTED');
  assert.strictEqual(auditExempt.verdictCode, 'QUALIFIES_AS_SMALL_COMPANY_AUDIT_EXEMPT');
  console.log("  ✅ Audit Exemption: Standalone private company meeting 2-of-3 criteria qualifies.");

  // 2b. Newly Incorporated Company (First FY)
  const auditNew = evaluateSmallCompanyAuditExemption({
    isPrivateCompany: true,
    isNewlyIncorporated: true,
    currentYearFinancials: {
      annualRevenueSgd: 1500000,
      totalAssetsSgd: 800000,
      fullTimeEmployees: 8
    }
  });
  assert.strictEqual(auditNew.isExemptFromAudit, true);
  assert.strictEqual(auditNew.standaloneEvaluation.isStandaloneQualified, true);
  console.log("  ✅ Audit Exemption: Newly incorporated company qualified on Year 1 financials.");

  // 2c. Corporate Group Disqualification
  // Standalone qualifies (S$2M rev), but Consolidated Group exceeds thresholds (S$25M rev, S$30M assets, 120 emp)
  const auditGroupFail = evaluateSmallCompanyAuditExemption({
    isPrivateCompany: true,
    currentYearFinancials: {
      annualRevenueSgd: 2000000,
      totalAssetsSgd: 1500000,
      fullTimeEmployees: 10
    },
    priorYearFinancials: {
      annualRevenueSgd: 1800000,
      totalAssetsSgd: 1200000,
      fullTimeEmployees: 9
    },
    isPartOfCorporateGroup: true,
    groupCurrentYearFinancials: {
      annualRevenueSgd: 25000000,
      totalAssetsSgd: 30000000,
      fullTimeEmployees: 120
    },
    groupPriorYearFinancials: {
      annualRevenueSgd: 22000000,
      totalAssetsSgd: 28000000,
      fullTimeEmployees: 110
    }
  });
  assert.strictEqual(auditGroupFail.standaloneEvaluation.isStandaloneQualified, true);
  assert.strictEqual(auditGroupFail.groupEvaluation.isGroupQualified, false);
  assert.strictEqual(auditGroupFail.isExemptFromAudit, false);
  assert.strictEqual(auditGroupFail.auditRequirementStatus, 'STATUTORY_AUDIT_MANDATORY');
  assert.strictEqual(auditGroupFail.verdictCode, 'FAILS_GROUP_LEVEL_SMALL_GROUP_CONSOLIDATED_TEST');
  console.log("  ✅ Audit Exemption: Group consolidation test disqualification accurately audited.");

  // ===============================================================
  // 3. PDPA Mandatory Data Breach Notification & Penalty
  // ===============================================================
  console.log("  [3/3] Testing PDPA Breach Notification & Penalty Engine...");

  // 3a. Significant Harm Breach (<500 individuals, but compromised NRIC & Financial Data)
  const pdpaHarm = evaluatePdpaBreachNotification({
    affectedIndividualsCount: 85,
    compromisedDataCategories: ['NRIC_OR_FIN', 'FINANCIAL_ACCOUNTS_OR_CREDIT_CARDS'],
    annualSingaporeTurnoverSgd: 5000000,
    assessmentCompletedTimestamp: '2026-11-06T10:00:00.000Z'
  });
  assert.strictEqual(pdpaHarm.statutoryNotificationRequirements.isMandatoryToNotifyPdpc, true);
  assert.strictEqual(pdpaHarm.statutoryNotificationRequirements.pdpcNotificationDeadlineHours, 72);
  assert.strictEqual(pdpaHarm.statutoryNotificationRequirements.pdpcDeadlineTimestamp, '2026-11-09T10:00:00.000Z');
  assert.strictEqual(pdpaHarm.statutoryNotificationRequirements.isMandatoryToNotifyIndividuals, true);
  assert.strictEqual(pdpaHarm.statutoryPenaltyExposure.maximumStatutoryFinancialPenaltySgd, 1000000); // Standard S$1M cap
  console.log("  ✅ PDPA: Significant harm (NRIC) triggers mandatory 72-hour PDPC and individual notice.");

  // 3b. Significant Scale (>= 500 individuals) with Remedial Action eliminating harm
  const pdpaScaleRemedial = evaluatePdpaBreachNotification({
    affectedIndividualsCount: 1200,
    compromisedDataCategories: ['EMAIL_ADDRESSES', 'NAMES'],
    remedialActionEliminatedHarm: true,
    annualSingaporeTurnoverSgd: 80000000 // Large enterprise > S$10M turnover
  });
  assert.strictEqual(pdpaScaleRemedial.assessmentResults.isSignificantScaleBreach, true);
  assert.strictEqual(pdpaScaleRemedial.statutoryNotificationRequirements.isMandatoryToNotifyPdpc, true);
  // Remedial action exempts notifying individuals
  assert.strictEqual(pdpaScaleRemedial.statutoryNotificationRequirements.isMandatoryToNotifyIndividuals, false);
  assert.strictEqual(pdpaScaleRemedial.statutoryNotificationRequirements.individualNotificationExemptionReason, 'EXEMPT_REMEDIAL_ACTION_ELIMINATED_RISK_OF_SIGNIFICANT_HARM');
  // Large Enterprise penalty: 10% of S$80M = S$8M
  assert.strictEqual(pdpaScaleRemedial.statutoryPenaltyExposure.penaltyFrameworkTier, 'LARGE_ENTERPRISE_10_PERCENT_TURNOVER');
  assert.strictEqual(pdpaScaleRemedial.statutoryPenaltyExposure.maximumStatutoryFinancialPenaltySgd, 8000000);
  console.log("  ✅ PDPA: Significant scale with remedial exemption and 10% turnover penalty ceiling verified.");

  console.log("\n✅ All Singapore Corporate Governance & Legal Domain Engine Tests Passed 100%!");
}

runLegalEnginesTests();
