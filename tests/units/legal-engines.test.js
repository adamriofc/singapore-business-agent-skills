'use strict';

const assert = require('assert');
const {
  calculateAcraStatutoryDeadlines,
  evaluateSmallCompanyAuditExemption,
  evaluatePdpaBreachNotification,
  evaluateContractRisk,
  auditCorporateSecretarial,
  evaluateTrademarkRegistrability,
  calculateIposFilingFees,
  evaluateStrikingOffReadiness,
  evaluateDirectorEligibility,
  evaluateTadmDispute,
  calculateTadmRegistrationFee
} = require('../../index.js');

function runLegalEnginesTests() {
  console.log("🇸🇬 Running Singapore Corporate Governance & Legal Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. ACRA Statutory Filing Deadlines & Governance Audit
  // ===============================================================
  console.log("  [1/9] Testing ACRA Deadlines & Governance Engine...");

  // 1a. Private Non-Listed Company (FYE 2025-12-31, Ref Date: 2026-06-01)
  const acraPte = calculateAcraStatutoryDeadlines({
    financialYearEndDate: '2025-12-31',
    isListedCompany: false,
    hasResidentDirector: true,
    isSoleDirectorSecretary: false,
    currentDate: '2026-06-01'
  });
  assert.strictEqual(acraPte.companyType, 'PRIVATE_NON_LISTED');
  assert.strictEqual(acraPte.statutoryFilingTimeline.agmDeadlineDate, '2026-06-30');
  assert.strictEqual(acraPte.statutoryFilingTimeline.arFilingDeadlineDate, '2026-07-31');
  assert.strictEqual(acraPte.filingStatusAudit.isAnnualReturnOverdue, false);
  assert.strictEqual(acraPte.filingStatusAudit.statutoryLatePenaltySgd, 0);
  assert.strictEqual(acraPte.governanceAudit.isGovernanceCompliant, true);
  console.log("  ✅ ACRA: Private non-listed statutory AGM (6m) & AR (7m) timeline verified.");

  // 1b. Public Listed Company (FYE 2025-12-31, Ref Date: 2026-06-01)
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
  assert.strictEqual(acraBreach.filingStatusAudit.isAnnualReturnOverdue, true);
  assert.strictEqual(acraBreach.filingStatusAudit.penaltyTier, 'TIER_2_MORE_THAN_3_MONTHS');
  assert.strictEqual(acraBreach.filingStatusAudit.statutoryLatePenaltySgd, 600);
  assert.strictEqual(acraBreach.governanceAudit.isGovernanceCompliant, false);
  assert.strictEqual(acraBreach.governanceAudit.violations.length, 2);
  console.log("  ✅ ACRA: Tier 2 late penalty (S$600) and Section 145/171 governance breaches detected.");

  // ===============================================================
  // 2. ACRA Small Company Audit Exemption (13th Schedule Companies Act)
  // ===============================================================
  console.log("  [2/9] Testing Small Company Audit Exemption Engine...");

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
  console.log("  ✅ Audit Exemption: Standalone, newly incorporated, and group consolidation audits verified.");

  // ===============================================================
  // 3. PDPA Mandatory Data Breach Notification & Penalty
  // ===============================================================
  console.log("  [3/9] Testing PDPA Breach Notification & Penalty Engine...");

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
  assert.strictEqual(pdpaHarm.statutoryPenaltyExposure.maximumStatutoryFinancialPenaltySgd, 1000000);

  const pdpaScaleRemedial = evaluatePdpaBreachNotification({
    affectedIndividualsCount: 1200,
    compromisedDataCategories: ['EMAIL_ADDRESSES', 'NAMES'],
    remedialActionEliminatedHarm: true,
    annualSingaporeTurnoverSgd: 80000000
  });
  assert.strictEqual(pdpaScaleRemedial.assessmentResults.isSignificantScaleBreach, true);
  assert.strictEqual(pdpaScaleRemedial.statutoryNotificationRequirements.isMandatoryToNotifyPdpc, true);
  assert.strictEqual(pdpaScaleRemedial.statutoryNotificationRequirements.isMandatoryToNotifyIndividuals, false);
  assert.strictEqual(pdpaScaleRemedial.statutoryPenaltyExposure.maximumStatutoryFinancialPenaltySgd, 8000000);
  console.log("  ✅ PDPA: Significant harm (NRIC) and large enterprise turnover cap (10%) verified.");

  // ===============================================================
  // 4. Commercial Contract Risk Review (SIAC & Common Law)
  // ===============================================================
  console.log("  [4/9] Testing Commercial Contract Risk Review Engine...");

  // 4a. Safe Singapore standard contract
  const safeContract = evaluateContractRisk({
    governingLawCountry: 'SINGAPORE',
    disputeForum: 'SIAC',
    contractValueSgd: 500000,
    liabilityCapSgd: 500000,
    hasUnlimitedIndemnity: false,
    excludesConsequentialLoss: true,
    hasUnilateralTerminationForConvenience: false,
    terminationNoticeDays: 30
  });
  assert.strictEqual(safeContract.contractRiskScore, 0);
  assert.strictEqual(safeContract.riskTier, 'LOW');
  assert.strictEqual(safeContract.totalFlagsDetected, 0);

  // 4b. Dangerous foreign contract
  const dangerousContract = evaluateContractRisk({
    governingLawCountry: 'FOREIGN',
    disputeForum: 'FOREIGN_COURTS',
    contractValueSgd: 1000000,
    liabilityCapSgd: null, // uncapped liability
    hasUnlimitedIndemnity: true,
    excludesConsequentialLoss: false,
    hasUnilateralTerminationForConvenience: true,
    terminationNoticeDays: 7
  });
  assert.ok(dangerousContract.contractRiskScore >= 70);
  assert.strictEqual(dangerousContract.riskTier, 'CRITICAL');
  assert.ok(dangerousContract.totalFlagsDetected >= 4);
  assert.ok(dangerousContract.recommendedRedlines.length >= 3);
  console.log("  ✅ Contract Risk: Low-risk Singapore arbitration and high-risk foreign terms verified.");

  // ===============================================================
  // 5. Corporate Secretarial & RORC Compliance Engine
  // ===============================================================
  console.log("  [5/9] Testing Corporate Secretarial & RORC Engine...");

  const compliantSec = auditCorporateSecretarial({
    companyType: 'PRIVATE',
    monthsSinceIncorporation: 4,
    secretaryProfile: {
      isAppointed: true,
      isOrdinarilyResidentInSingapore: true,
      isAlsoSoleDirector: false
    },
    rorcCompliance: {
      isRorcMaintained: true,
      daysSinceControllerInfoChange: 5,
      isLodgedWithAcraCentralRegister: true
    }
  });
  assert.strictEqual(compliantSec.isFullyCompliant, true);
  assert.strictEqual(compliantSec.complianceScore, 100);
  assert.strictEqual(compliantSec.breaches.length, 0);

  const nonCompliantSec = auditCorporateSecretarial({
    companyType: 'PRIVATE',
    monthsSinceIncorporation: 8,
    secretaryProfile: {
      isAppointed: false
    },
    rorcCompliance: {
      isRorcMaintained: false,
      daysSinceControllerInfoChange: 20,
      isLodgedWithAcraCentralRegister: false
    }
  });
  assert.strictEqual(nonCompliantSec.isFullyCompliant, false);
  assert.ok(nonCompliantSec.complianceScore < 70);
  assert.ok(nonCompliantSec.breaches.length >= 2);
  console.log("  ✅ Corporate Secretarial: S.171 secretary appointment & S.386AF RORC lodgment verified.");

  // ===============================================================
  // 6. IPOS Trademark Eligibility & Classification Engine
  // ===============================================================
  console.log("  [6/9] Testing IPOS Trademark Engine...");

  const tmInvented = evaluateTrademarkRegistrability({
    markName: 'Zalvoria',
    niceClasses: [9, 42],
    usesPreApprovedSpecification: true,
    isInventedWord: true
  });
  assert.strictEqual(tmInvented.outcomeVerdict, 'HIGH_CHANCE_OF_REGISTRATION');
  assert.strictEqual(tmInvented.niceClassificationAudit.totalValidClasses, 2);
  assert.strictEqual(tmInvented.statutoryFilingFees.totalFeesPayableSgd, 560); // 2 * 280

  const feesCustom = calculateIposFilingFees({
    classes: [9, 35, 42],
    usesPreApprovedSpecification: false
  });
  assert.strictEqual(feesCustom.classCount, 3);
  assert.strictEqual(feesCustom.feePerClassSgd, 380);
  assert.strictEqual(feesCustom.totalFeesPayableSgd, 1140);
  console.log("  ✅ IPOS: Form TM4 pre-approved (S$280) and custom (S$380) statutory fees verified.");

  // ===============================================================
  // 7. ACRA Striking-Off Readiness Engine (Section 344A)
  // ===============================================================
  console.log("  [7/9] Testing Striking-Off Readiness Engine...");

  const readyStriking = evaluateStrikingOffReadiness({
    hasCommencedBusiness: false,
    hasOutstandingIrasTaxMatters: false,
    hasActiveBankAccounts: false,
    hasOutstandingDebtsToGovernmentOrThirdParties: false,
    hasOngoingLitigation: false,
    hasMajorityShareholderApproval: true
  });
  assert.strictEqual(readyStriking.isEligibleToApply, true);
  assert.strictEqual(readyStriking.readinessStatus, 'READY_FOR_STRIKING_OFF_APPLICATION');
  assert.strictEqual(readyStriking.totalOutstandingBlockers, 0);

  const blockedStriking = evaluateStrikingOffReadiness({
    hasCommencedBusiness: true,
    hasCeasedTrading: false,
    hasOutstandingIrasTaxMatters: true,
    hasActiveBankAccounts: true,
    hasOutstandingDebtsToGovernmentOrThirdParties: true
  });
  assert.strictEqual(blockedStriking.isEligibleToApply, false);
  assert.strictEqual(blockedStriking.readinessStatus, 'BLOCKED_BY_STATUTORY_REQUIREMENTS');
  assert.ok(blockedStriking.totalOutstandingBlockers >= 3);
  console.log("  ✅ Striking-Off: S.344A statutory clearances (IRAS, bank, debts) verified.");

  // ===============================================================
  // 8. Director Eligibility & Disqualification Engine (S.145/148/149)
  // ===============================================================
  console.log("  [8/9] Testing Director Duties & Eligibility Engine...");

  const validDirector = evaluateDirectorEligibility({
    directorName: 'Alice Wong',
    age: 32,
    residentialStatus: 'SC',
    isUndischargedBankrupt: false,
    hasFraudOrDishonestyConviction: false
  });
  assert.strictEqual(validDirector.isLegallyEligible, true);
  assert.strictEqual(validDirector.status, 'QUALIFIED_FOR_DIRECTORSHIP');
  assert.strictEqual(validDirector.totalDisqualifications, 0);

  const disqualifiedDirector = evaluateDirectorEligibility({
    directorName: 'Bob Smith',
    age: 17, // Under 18
    residentialStatus: 'FOREIGN_NON_RESIDENT',
    isUndischargedBankrupt: true, // S.148 bankrupt
    hasFraudOrDishonestyConviction: true // S.154 fraud
  });
  assert.strictEqual(disqualifiedDirector.isLegallyEligible, false);
  assert.strictEqual(disqualifiedDirector.status, 'LEGALLY_DISQUALIFIED');
  assert.ok(disqualifiedDirector.totalDisqualifications >= 3);
  console.log("  ✅ Director Duties: Age, bankruptcy (S.148), and fraud conviction disqualifications verified.");

  // ===============================================================
  // 9. TADM & Employment Claims Tribunal Dispute Resolution Engine
  // ===============================================================
  console.log("  [9/9] Testing TADM & ECT Dispute Resolution Engine...");

  // Non-union salary claim S$15,000 (within S$20,000 statutory cap)
  const tadmStandard = evaluateTadmDispute({
    claimType: 'SALARY_ARREARS',
    claimAmountSgd: 15000,
    isUnionMember: false,
    monthsSinceDisputeEvent: 4,
    wasEmploymentTerminated: true
  });
  assert.strictEqual(tadmStandard.isEligibleForTadmMediation, true);
  assert.strictEqual(tadmStandard.disputeForum, 'TADM_THEN_EMPLOYMENT_CLAIMS_TRIBUNAL');
  assert.strictEqual(tadmStandard.statutoryLimitCheck.isWithinStatutoryClaimLimit, true);
  assert.strictEqual(tadmStandard.tadmFilingFeeEstimateSgd, 20);

  // Union claim exceeding cap (e.g. S$35,000 > S$30,000)
  const tadmExceed = evaluateTadmDispute({
    claimType: 'SALARY_ARREARS',
    claimAmountSgd: 35000,
    isUnionMember: true
  });
  assert.strictEqual(tadmExceed.statutoryLimitCheck.isWithinStatutoryClaimLimit, false);
  assert.strictEqual(tadmExceed.disputeForum, 'STATE_COURTS_OR_HIGH_COURT_CIVIL_LITIGATION');

  const feeTest1 = calculateTadmRegistrationFee({ claimAmountSgd: 8000 });
  assert.strictEqual(feeTest1.applicableFeeSgd, 10);
  const feeTest2 = calculateTadmRegistrationFee({ claimAmountSgd: 18000 });
  assert.strictEqual(feeTest2.applicableFeeSgd, 20);
  console.log("  ✅ TADM & ECT: S$20,000 / S$30,000 claim ceilings and sliding scale fees verified.");

  console.log("\n✅ All 10 Singapore Corporate Governance & Legal Domain Engine Tests Passed 100%!");
}

runLegalEnginesTests();
