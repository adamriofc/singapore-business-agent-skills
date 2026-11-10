/**
 * Singapore Business Agent Skills — Golden Corpus Suite Generator (`scripts/build-golden-suite.js`)
 *
 * Generates and validates 130 golden test cases across 6 domains (28+ subdomains)
 * with deterministic precision and zero-drift guarantee.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const engines = require(path.join(ROOT, 'index.js'));

function runCase(c) {
  const fn = engines[c.engine];
  if (typeof fn !== 'function') {
    throw new Error(`Engine '${c.engine}' not found in index.js for case '${c.caseId}'`);
  }

  let res;
  if (c.engine === 'calculateSingaporeGstRate') {
    res = fn(c.input.dateStr);
  } else {
    res = fn(c.input);
  }

  const flattened = {};

  if (typeof res === 'number') {
    flattened.rate = res;
    flattened.value = res;
    flattened.result = res;
    flattened.npvSgd = res;
    flattened.irr = res;
    flattened.forwardRate = res;
    return flattened;
  }

  function recurse(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [k, v] of Object.entries(obj)) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        recurse(v);
      } else {
        flattened[k] = v;
      }
    }
  }

  recurse(res);
  return flattened;
}

function assertMatch(caseId, expected, actual) {
  for (const [key, expVal] of Object.entries(expected)) {
    const actVal = actual[key];
    if (typeof expVal === 'number' && typeof actVal === 'number') {
      if (Math.abs(expVal - actVal) > 0.0001) {
        throw new Error(`[${caseId}] Numeric mismatch for '${key}': expected ${expVal}, got ${actVal}`);
      }
    } else if (expVal !== actVal) {
      throw new Error(`[${caseId}] Value mismatch for '${key}': expected ${JSON.stringify(expVal)}, got ${JSON.stringify(actVal)}`);
    }
  }
}

// =========================================================================
// 1. TAX DOMAIN (25 Cases)
// =========================================================================
const taxCases = [
  // 9 existing cases
  {
    caseId: "CIT-STARTUP-YA2024",
    description: "New Startup Exemption YA 2024 Chargeable Income S$200,000 with 50% CIT Rebate",
    engine: "calculateSingaporeCit",
    input: { chargeableIncome: 200000, isQualifyingStartup: true, yearOfAssessment: 2024 },
    expected: { chargeableIncomeSgd: 200000, totalExemptIncomeSgd: 125000, taxBeforeRebateSgd: 12750, citRebateSgd: 6375, netTaxPayableSgd: 6375, effectiveTaxRatePercent: 3.19 }
  },
  {
    caseId: "CIT-PARTIAL-YA2024",
    description: "Partial Tax Exemption (General Company) YA 2024 Chargeable Income S$300,000",
    engine: "calculateSingaporeCit",
    input: { chargeableIncome: 300000, isQualifyingStartup: false, yearOfAssessment: 2024 },
    expected: { totalExemptIncomeSgd: 102500, taxBeforeRebateSgd: 33575, citRebateSgd: 16787.5, netTaxPayableSgd: 16787.5 }
  },
  {
    caseId: "CIT-LOSS-MAKING",
    description: "Loss making Singapore company (zero tax payable)",
    engine: "calculateSingaporeCit",
    input: { chargeableIncome: 0, isQualifyingStartup: false, yearOfAssessment: 2024 },
    expected: { chargeableIncomeSgd: 0, netTaxPayableSgd: 0, effectiveTaxRatePercent: 0 }
  },
  {
    caseId: "GST-RATE-2024",
    description: "Singapore statutory GST rate effective from 1 Jan 2024 (9%)",
    engine: "calculateSingaporeGstRate",
    input: { dateStr: "2024-01-01" },
    expected: { rate: 0.09 }
  },
  {
    caseId: "GST-REG-RETROSPECTIVE",
    description: "Compulsory GST Registration retrospective breach (> S$1,000,000)",
    engine: "evaluateGstRegistrationLiability",
    input: { past4QuartersTurnover: [300000, 300000, 300000, 300000], projectedNext12MonthsTurnover: 50000 },
    expected: { isCompulsoryRegistrationRequired: true, retrospectiveBreach: true, prospectiveBreach: false }
  },
  {
    caseId: "GST-FILING-9PCT",
    description: "GST Form 5 Net Filing calculation under 9% rate with reverse charge",
    engine: "calculateGstFiling",
    input: { standardRatedSuppliesSgd: 500000, taxablePurchasesSgd: 200000, importedB2bServicesSgd: 50000, effectiveRate: 0.09 },
    expected: { outputTaxStandardSgd: 45000, reverseChargeOutputTaxSgd: 4500, totalOutputTaxSgd: 49500, totalInputTaxClaimedSgd: 22500, netGstPayableSgd: 27000, position: "NET_PAYABLE_TO_IRAS" }
  },
  {
    caseId: "WHT-INTEREST-DOMESTIC",
    description: "Section 45 Non-resident interest payment statutory domestic 15% withholding",
    engine: "calculateSingaporeWht",
    input: { paymentType: "INTEREST", grossAmountSgd: 100000 },
    expected: { statutoryDomesticRate: 0.15, withholdingTaxPayableToIrasSgd: 15000, netRemittanceToNonResidentSgd: 85000, irasFormType: "FORM_IR37" }
  },
  {
    caseId: "WHT-ROYALTY-DOMESTIC",
    description: "Section 45 Non-resident royalty payment statutory domestic 10% withholding",
    engine: "calculateSingaporeWht",
    input: { paymentType: "ROYALTY", grossAmountSgd: 80000 },
    expected: { statutoryDomesticRate: 0.10, withholdingTaxPayableToIrasSgd: 8000, netRemittanceToNonResidentSgd: 72000 }
  },
  {
    caseId: "TAX-RESIDENCY-COR-QUALIFIED",
    description: "Singapore corporate tax residency and Certificate of Residence (CoR) qualification",
    engine: "evaluateTaxResidency",
    input: { companyName: "Merlion Tech Pte Ltd", totalBodMeetings: 4, bodMeetingsInSingapore: 3, strategicDecisionsInSingapore: true, hasLocalResidentDirector: true, hasPhysicalOfficeInSingapore: true, localEmployeesCount: 5, isForeignControlled: true, hasBonaFideCommercialReason: true },
    expected: { isSingaporeTaxResident: true, qualifiesForCertificateOfResidence: true, centralManagementAndControlLocus: "SINGAPORE", riskLevel: "LOW" }
  },
  // 16 additional cases to reach 25
  {
    caseId: "TAX-RESIDENCY-FOREIGN-FAIL",
    description: "Foreign controlled paper company failing commercial substance test",
    engine: "evaluateTaxResidency",
    input: { companyName: "Passive Shell Pte Ltd", totalBodMeetings: 4, bodMeetingsInSingapore: 2, strategicDecisionsInSingapore: false, hasLocalResidentDirector: false, hasPhysicalOfficeInSingapore: false, localEmployeesCount: 0, isForeignControlled: true, hasBonaFideCommercialReason: false },
    expected: { isSingaporeTaxResident: false, qualifiesForCertificateOfResidence: false, riskLevel: "HIGH" }
  },
  {
    caseId: "TAX-EIS-RND-IP",
    description: "Enterprise Innovation Scheme 400% enhanced deduction on R&D and IP registration",
    engine: "calculateEnterpriseInnovationScheme",
    input: { expenditures: { RND_LOCAL: 250000, IP_REGISTRATION: 50000 }, optForCashConversion: false, yearOfAssessment: 2024 },
    expected: { totalQualifyingSpendSgd: 300000, totalTaxDeductionSgd: 1200000, estimatedTaxSavingsSgd: 204000 }
  },
  {
    caseId: "TAX-EIS-CASH-PAYOUT",
    description: "Enterprise Innovation Scheme cash conversion payout capped at S$20,000",
    engine: "calculateEnterpriseInnovationScheme",
    input: { expenditures: { RND_LOCAL: 150000 }, optForCashConversion: true },
    expected: { isEligible: true, cashPayoutSgd: 20000, maxPossiblePayoutSgd: 20000 }
  },
  {
    caseId: "TAX-LOSS-CARRY-BACK",
    description: "Section 37E loss carry-back relief against previous year assessable income",
    engine: "evaluateLossUtilization",
    input: { currentYearLosses: 150000, currentYearCapitalAllowance: 20000, previousYearAssessableIncome: 80000, optForCarryBack: true },
    expected: { amountUtilizedSgd: 80000, estimatedTaxRefundSgd: 13600, closingUnabsorbedTradeLossesSgd: 90000 }
  },
  {
    caseId: "TAX-LOSS-SCT-FAIL",
    description: "Shareholding Continuity Test failure disallowing prior year losses",
    engine: "evaluateLossUtilization",
    input: { currentYearTaxableProfit: 100000, priorYearUnabsorbedLosses: 50000, shareholdingContinuityPercent: 30 },
    expected: { passesShareholdingContinuityTest: false, disallowedLossesSgd: 50000, netChargeableIncomeAfterOffsetSgd: 100000 }
  },
  {
    caseId: "TAX-GROUP-RELIEF-SUCCESS",
    description: "Section 37C Group Relief transfer with 80% common shareholding",
    engine: "evaluateGroupReliefTransfer",
    input: {
      transferor: { companyName: "LossCo Pte Ltd", isIncorporatedInSingapore: true, financialYearEnd: "2024-12-31", currentYearLosses: 100000, currentYearCapitalAllowance: 30000 },
      transferee: { companyName: "ProfitCo Pte Ltd", isIncorporatedInSingapore: true, financialYearEnd: "2024-12-31", assessableIncome: 200000 },
      shareholdingPercentage: 80
    },
    expected: { isEligible: true, totalTransferredSgd: 130000, transfereeNetIncomeAfterReliefSgd: 70000, estimatedGroupTaxSavingsSgd: 22100 }
  },
  {
    caseId: "TAX-GROUP-RELIEF-FAIL-THRESHOLD",
    description: "Group Relief disallowance due to common shareholding below 75%",
    engine: "evaluateGroupReliefTransfer",
    input: {
      transferor: { companyName: "A", isIncorporatedInSingapore: true, financialYearEnd: "2024-12-31", currentYearLosses: 50000 },
      transferee: { companyName: "B", isIncorporatedInSingapore: true, financialYearEnd: "2024-12-31", assessableIncome: 100000 },
      shareholdingPercentage: 60
    },
    expected: { isEligible: false }
  },
  {
    caseId: "TAX-FTC-POOLING",
    description: "Foreign Tax Credit pooling under Section 50A on overseas dividends and interest",
    engine: "calculateForeignTaxCredit",
    input: {
      foreignIncomes: [
        { country: "Australia", incomeType: "Dividend", foreignIncomeGrossSgd: 100000, foreignTaxPaidSgd: 30000, foreignHeadlineTaxRate: 0.30 },
        { country: "Hong Kong", incomeType: "Interest", foreignIncomeGrossSgd: 50000, foreignTaxPaidSgd: 4000, foreignHeadlineTaxRate: 0.165 }
      ],
      usePooling: true
    },
    expected: { totalForeignIncomeGrossSgd: 150000, totalForeignTaxPaidSgd: 34000, totalFtcAllowedSgd: 25500, netSingaporeTaxPayableSgd: 0 }
  },
  {
    caseId: "TAX-FAMILY-OFFICE-13O-COMPLIANT",
    description: "MAS Section 13O Family Office Fund Exemption compliance verification",
    engine: "evaluateFamilyOfficeExemption",
    input: { scheme: "13O", assetsUnderManagementSgd: 25000000, numberOfInvestmentProfessionals: 2, annualLocalBusinessSpendingSgd: 250000, localInvestmentsSgd: 2500000 },
    expected: { isCompliant: true }
  },
  {
    caseId: "TAX-BEPS-PILLAR-TWO",
    description: "BEPS 2.0 Pillar Two Domestic Top-up Tax (DTT) calculation",
    engine: "calculateDomesticTopUpTax",
    input: { globalConsolidatedRevenueSgd: 1500000000, singaporeGlobeIncomeSgd: 100000000, singaporeCoveredTaxesSgd: 10000000, eligiblePayrollCostsSgd: 20000000, eligibleTangibleAssetsSgd: 30000000 },
    expected: { isInScope: true, effectiveTaxRatePercent: 10, topUpTaxRatePercent: 5 }
  },
  {
    caseId: "TAX-STAMP-DUTY-FOREIGNER",
    description: "Property Stamp Duty BSD and ABSD for Foreigner purchasing residential property",
    engine: "calculatePropertyStampDuty",
    input: { propertyValue: 2000000, propertyType: "RESIDENTIAL", buyerProfile: "FOREIGNER", propertyCount: 1 },
    expected: { amountSgd: 1200000, totalStampDutyPayableSgd: 1269600 }
  },
  {
    caseId: "TAX-STAMP-DUTY-SC-FIRST",
    description: "Singapore Citizen purchasing first residential property (0% ABSD)",
    engine: "calculatePropertyStampDuty",
    input: { propertyValue: 1000000, propertyType: "RESIDENTIAL", buyerProfile: "SC", propertyCount: 1 },
    expected: { ratePercent: 0, amountSgd: 0 }
  },
  {
    caseId: "TAX-AUDIT-RISK-SEVERE",
    description: "IRAS multi-factor audit risk evaluation detecting revenue and margin anomalies",
    engine: "assessTaxAuditRisk",
    input: { revenueCitSgd: 2000000, revenueGstAnnualSgd: 1500000, grossProfitMarginPercent: 12, industryBenchmarkGpmPercent: 30, directorRemunerationSgd: 1200000, directorLoanCreditBalanceSgd: 600000, foreignInterestRoyaltyExpenseSgd: 100000, whtRemittedSgd: 0 },
    expected: { riskTier: "SEVERE" }
  },
  {
    caseId: "TAX-TRANSFER-PRICING-MANDATORY",
    description: "Mandatory Transfer Pricing Documentation and Section 34E 5% surcharge assessment",
    engine: "evaluateTransferPricingCompliance",
    input: { annualGrossRevenueSgd: 15000000, relatedPartyTransactions: { GOODS: 18000000, SERVICES: 1500000 }, testedPartyMarginPercent: 2.5, comparableBenchmark: { q1: 4.0, median: 6.0, q3: 8.0 }, transactionBaseAmountSgd: 2000000 },
    expected: { isMandatoryTpdByRevenue: true, status: "OUTSIDE_ARMS_LENGTH_RANGE", statutorySurcharge5PercentSgd: 3500 }
  },
  {
    caseId: "TAX-CAPITAL-ALLOWANCES-ACCELERATED",
    description: "Section 19A accelerated capital allowances on equipment additions",
    engine: "calculateCapitalAllowances",
    input: { assets: [{ description: "Server hardware", costSgd: 30000, scheme: "19A_1YR" }, { description: "Office Furniture", costSgd: 60000, scheme: "19A_3YR" }, { description: "Printers", costSgd: 10000, scheme: "LOW_VALUE", quantity: 4 }] },
    expected: { totalAssetAdditionsCostSgd: 100000, totalCapitalAllowancesClaimedSgd: 60000, lowValueAssetsClaimedSgd: 10000 }
  },
  {
    caseId: "GST-RATE-2023",
    description: "Singapore statutory GST rate effective during calendar year 2023 (8%)",
    engine: "calculateSingaporeGstRate",
    input: { dateStr: "2023-06-15" },
    expected: { rate: 0.08 }
  }
];

// =========================================================================
// 2. HR DOMAIN (25 Cases)
// =========================================================================
const hrCases = [
  // 7 existing cases
  {
    caseId: "CPF-CITIZEN-STANDARD-2024",
    description: "CPF Standard Citizen <= 55 yo Ordinary Wage S$6,000 in 2024 with SDL & CDAC",
    engine: "calculateSingaporeCpf",
    input: { ordinaryWage: 6000, additionalWage: 0, age: 30, residentialStatus: "CITIZEN", calendarYear: 2024, communityFund: "CDAC" },
    expected: { employeeCpfSgd: 1200, employerCpfSgd: 1020, totalCpfSgd: 2220, skillsDevelopmentLevySgd: 11.25, selfHelpGroupDeductionSgd: 2, netTakeHomePaySgd: 4798, totalEmployerCostSgd: 7031.25 }
  },
  {
    caseId: "CPF-OW-CEILING-2024",
    description: "CPF Ordinary Wage statutory ceiling in calendar year 2024 (S$6,800)",
    engine: "calculateSingaporeCpf",
    input: { ordinaryWage: 10000, age: 30, calendarYear: 2024 },
    expected: { owSubjectToCpfSgd: 6800 }
  },
  {
    caseId: "CPF-OW-CEILING-2025",
    description: "CPF Ordinary Wage statutory ceiling in calendar year 2025 (S$7,400)",
    engine: "calculateSingaporeCpf",
    input: { ordinaryWage: 10000, age: 30, calendarYear: 2025 },
    expected: { owSubjectToCpfSgd: 7400 }
  },
  {
    caseId: "CPF-OW-CEILING-2026",
    description: "CPF Ordinary Wage statutory ceiling in calendar year 2026 (S$8,000)",
    engine: "calculateSingaporeCpf",
    input: { ordinaryWage: 10000, age: 30, calendarYear: 2026 },
    expected: { owSubjectToCpfSgd: 8000 }
  },
  {
    caseId: "CPF-AW-CEILING-BONUS",
    description: "CPF Annual Additional Wage (AW) ceiling cap on S$50,000 bonus",
    engine: "calculateSingaporeCpf",
    input: { ordinaryWage: 6800, additionalWage: 50000, age: 30, calendarYear: 2024, ytdOrdinaryWages: 74800 },
    expected: { awCeilingRemainingSgd: 20400, awSubjectToCpfSgd: 20400 }
  },
  {
    caseId: "MOM-OVERTIME-WORKMAN",
    description: "Workman Part IV overtime 1.5x calculation and monthly cap audit",
    engine: "calculateMomOvertimeAndCompliance",
    input: { employeeCategory: "WORKMAN", monthlyBasicSalarySgd: 3000, overtimeHours: 20, dailyMaxHoursWorked: 10, yearsOfService: 3 },
    expected: { isCoveredUnderPartIV: true, coverageStatusReason: "WORKMAN_SALARY_WITHIN_CAP", overtimeHoursWorked: 20, exceedsMonthlyOtCap: false, exceedsDailyWorkCap: false, isFullyCompliant: true, statutoryAnnualLeaveDays: 9 }
  },
  {
    caseId: "MOM-COMPASS-STANDARD-PASS",
    description: "COMPASS EP scoring framework evaluating standard candidate scoring 60 points",
    engine: "evaluateCompassEpEligibility",
    input: { monthlySalarySgd: 9000, candidateAge: 30, sector: "NON_FINANCIAL_SERVICES", salaryPercentileRank: "P90_AND_ABOVE", qualificationLevel: "TOP_TIER", firmPmetCount: 20 },
    expected: { meetsMinimumQualifyingSalary: true, c1SalaryPoints: 20, c2QualificationPoints: 20, c3DiversityPoints: 10, c4LocalSupportPoints: 10, totalCompassScore: 60, isPassMarkMet: true, eligibilityVerdict: "ELIGIBLE_FOR_EP_COMPASS_PASSED" }
  },
  // 18 additional cases to reach 25
  {
    caseId: "MOM-COMPASS-HIGH-SALARY-EXEMPT",
    description: "COMPASS exemption for high-earning candidate earning S$25,000/month",
    engine: "evaluateCompassEpEligibility",
    input: { monthlySalarySgd: 25000, candidateAge: 35 },
    expected: { isExemptFromCompass: true, exemptionReason: "HIGH_SALARY_EXEMPTION_ABOVE_22500_SGD", isPassMarkMet: true }
  },
  {
    caseId: "MOM-OT-NON-WORKMAN-EXCLUDED",
    description: "Non-workman earning > S$2,600 excluded from Part IV overtime entitlement",
    engine: "calculateMomOvertimeAndCompliance",
    input: { employeeCategory: "NON_WORKMAN", monthlyBasicSalarySgd: 3500, overtimeHours: 10 },
    expected: { isCoveredUnderPartIV: false, coverageStatusReason: "NON_WORKMAN_SALARY_EXCEEDS_CAP", totalOvertimePayPayableSgd: 0 }
  },
  {
    caseId: "MOM-OT-BREACH-HOURS",
    description: "MOM Part IV violation for monthly overtime exceeding statutory 72h cap",
    engine: "calculateMomOvertimeAndCompliance",
    input: { employeeCategory: "WORKMAN", monthlyBasicSalarySgd: 2000, overtimeHours: 80, dailyMaxHoursWorked: 14 },
    expected: { exceedsMonthlyOtCap: true, exceedsDailyWorkCap: true, isFullyCompliant: false }
  },
  {
    caseId: "MOM-DRC-SERVICES-QUOTA",
    description: "Foreign workforce quota and levy computation for Services sector",
    engine: "calculateForeignWorkforceQuota",
    input: { sector: "SERVICES", localHeadcount: 65, currentSPassCount: 5, currentWorkPermitCount: 20 },
    expected: { maxTotalForeignWorkers: 35, maxSPassHolders: 7, totalForeignHeadroom: 10, sPassHeadroom: 2, isFullyCompliant: true, totalForeignWorkerLevySgd: 10650 }
  },
  {
    caseId: "MOM-ANNUAL-LEAVE-PRORATED",
    description: "Statutory annual leave entitlement and pro-ration calculation",
    engine: "calculateAnnualLeaveEntitlement",
    input: { completedYearsOfService: 2, completedMonthsInCurrentYear: 8, leaveTakenDays: 3, grossMonthlySalarySgd: 3500 },
    expected: { statutoryMinimumDays: 9, roundedStatutoryProratedDays: 6, balanceRemainingDays: 3 }
  },
  {
    caseId: "MOM-SICK-LEAVE-QUALIFYING",
    description: "Paid sick and hospitalisation leave entitlement after 6 months of service",
    engine: "calculateSickLeaveEntitlement",
    input: { monthsOfService: 6, outpatientSickLeaveTakenDays: 4, hospitalisationLeaveTakenDays: 10, hasValidMcFromRegisteredDoctor: true },
    expected: { isEligibleForPaidSickLeave: true, outpatientSickLeaveTotalDays: 14, hospitalisationLeaveTotalDays: 60, remainingOutpatientSickLeaveDays: 10, remainingHospitalisationLeaveDays: 46 }
  },
  {
    caseId: "MOM-RETRENCHMENT-MANDATORY",
    description: "Retrenchment benefit calculation and mandatory notification to MOM",
    engine: "calculateRetrenchmentBenefit",
    input: { monthlySalarySgd: 4000, yearsOfService: 3, benefitWeeksPerYear: 4.33, companyContext: { totalCompanyHeadcount: 20, retrenchedIn6Months: 6 } },
    expected: { isStatutorilyEligible: true, isMandatory: true, reportingDeadlineWorkingDays: 5 }
  },
  {
    caseId: "MOM-PARENTAL-GPML-CHILD1",
    description: "Government-Paid Maternity Leave (GPML) 16-week benefit calculation for 1st child",
    engine: "calculateParentalLeave",
    input: { leaveType: "MATERNITY", monthlyGrossSalarySgd: 8000, childOrderNumber: 1, monthsOfService: 6, isChildSingaporeCitizen: true, isLawfullyMarried: true },
    expected: { isCdcaQualifying: true, totalLeaveWeeks: 16, employerFundedWeeks: 8, governmentFundedWeeks: 8, governmentReimbursementClaimSgd: 14769.2 }
  },
  {
    caseId: "MOM-PARENTAL-GPPL-FATHER",
    description: "Government-Paid Paternity Leave (GPPL) 4-week fully government funded benefit",
    engine: "calculateParentalLeave",
    input: { leaveType: "PATERNITY", monthlyGrossSalarySgd: 6000, childOrderNumber: 1, monthsOfService: 6, isChildSingaporeCitizen: true, isLawfullyMarried: true },
    expected: { isCdcaQualifying: true, totalLeaveWeeks: 4, employerFundedWeeks: 0, governmentFundedWeeks: 4 }
  },
  {
    caseId: "MOM-WFA-DISCRIMINATORY-AD",
    description: "Workplace Fairness Act audit detecting discriminatory recruitment copy",
    engine: "auditWorkplaceFairness",
    input: { textToAudit: "Looking for young and energetic female preferred staff, mandarin speaking preferred.", hasInternalGrievanceMechanism: false },
    expected: { riskTier: "CRITICAL_RISK" }
  },
  {
    caseId: "MOM-PWM-RETAIL-DEFICIT",
    description: "Progressive Wage Model wage compliance evaluation in Retail sector",
    engine: "evaluateProgressiveWageCompliance",
    input: { monthlyGrossSalarySgd: 1600, pwmSectorKey: "RETAIL", isLocalEmployee: true },
    expected: { headcountContribution: 1.0, status: "FULL_LQS_HEADCOUNT", isPwmCompliant: false, wageDeficitSgd: 575 }
  },
  {
    caseId: "MOM-KETS-COMPLIANT",
    description: "Key Employment Terms compliance audit for written employment contract",
    engine: "auditKeyEmploymentTerms",
    input: {
      includedItemFlags: {
        EMPLOYER_EMPLOYEE_NAMES: true,
        JOB_TITLE_DUTIES: true,
        START_DATE: true,
        EMPLOYMENT_DURATION: true,
        HOURS_DAYS_REST: true,
        SALARY_PERIOD: true,
        BASIC_PAY: true,
        FIXED_ALLOWANCES: true,
        FIXED_DEDUCTIONS: true,
        OVERTIME_RATE: true,
        OTHER_BONUS_INCENTIVE: true,
        STATUTORY_LEAVES: true,
        MEDICAL_BENEFITS: true,
        NOTICE_PERIOD: true
      },
      daysSinceStartOfEmployment: 10,
      isWrittenDocumentProvided: true
    },
    expected: { isFullyCompliant: true, complianceScore: 100 }
  },
  {
    caseId: "MOM-PAYSLIP-ITEMISED-AUDIT",
    description: "Itemised payslip statutory compliance audit under Employment Act Section 95A",
    engine: "auditItemisedPayslip",
    input: {
      includedFields: {
        NAMES: true,
        PAYMENT_DATE: true,
        SALARY_PERIOD: true,
        BASIC_SALARY: true,
        ALLOWANCES: true,
        DEDUCTIONS: true,
        NET_SALARY: true,
        OVERTIME_DETAILS: true
      },
      employeeWorkedOvertime: true,
      daysAfterPaymentIssued: 2,
      keepsHistoricalRecords2Years: true
    },
    expected: { isFullyCompliant: true, complianceScore: 100 }
  },
  {
    caseId: "MOM-PUBLIC-HOLIDAY-PAY",
    description: "Public Holiday work compensation calculation (extra 1 day salary or day-off in lieu)",
    engine: "calculatePublicHolidayCompensation",
    input: {
      monthlyBasicSalarySgd: 3000,
      normalWorkingDaysPerWeek: 5,
      holidaysWorkedCount: 1,
      compensationMode: "EXTRA_PAY"
    },
    expected: { compensationMode: "EXTRA_PAY", statutoryDailyRateOfPaySgd: 138.46, extraSalaryPayableSgd: 138.46 }
  },
  {
    caseId: "MOM-CONTRACT-NON-COMPETE",
    description: "Employment contract audit evaluating geographic scope and restrictive covenants",
    engine: "auditEmploymentContract",
    input: {
      contractualEmployerNoticeWeeks: 2,
      contractualEmployeeNoticeWeeks: 8,
      yearsOfService: 1,
      probationDurationMonths: 3,
      nonCompeteClause: {
        hasNonCompete: true,
        durationMonths: 24,
        geographicalScope: "GLOBAL",
        protectsTradeSecrets: false
      }
    },
    expected: { isNoticeAsymmetrical: true, assessment: "LIKELY_UNENFORCEABLE_VOID" }
  },
  {
    caseId: "CPF-NON-CITIZEN-PR1",
    description: "CPF calculation for Permanent Resident in 1st year of approval",
    engine: "calculateSingaporeCpf",
    input: { ordinaryWage: 5000, age: 28, residentialStatus: "SPR_YEAR_1", calendarYear: 2024 },
    expected: { employeeCpfSgd: 250, employerCpfSgd: 200, totalCpfSgd: 450 }
  },
  {
    caseId: "CPF-SENIOR-CITIZEN-65",
    description: "CPF contribution schedule for senior citizen employee aged 65 in 2024",
    engine: "calculateSingaporeCpf",
    input: { ordinaryWage: 4000, age: 65, residentialStatus: "CITIZEN", calendarYear: 2024 },
    expected: { employeeCpfSgd: 420, employerCpfSgd: 460, totalCpfSgd: 880 }
  },
  {
    caseId: "MOM-DRC-MANUFACTURING",
    description: "Foreign workforce quota calculation for Manufacturing sector (60% DRC)",
    engine: "calculateForeignWorkforceQuota",
    input: { sector: "MANUFACTURING", localHeadcount: 40, currentSPassCount: 4, currentWorkPermitCount: 20 },
    expected: { maxTotalForeignWorkers: 60, isFullyCompliant: true }
  }
];

// =========================================================================
// 3. LEGAL DOMAIN (22 Cases)
// =========================================================================
const legalCases = [
  // 4 existing cases
  {
    caseId: "ACRA-PRIVATE-COMPLIANT",
    description: "ACRA private non-listed company statutory filing deadlines (AGM 6m, AR 7m)",
    engine: "calculateAcraStatutoryDeadlines",
    input: { financialYearEndDate: "2025-12-31", isListedCompany: false, hasResidentDirector: true, isSoleDirectorSecretary: false, currentDate: "2026-06-01" },
    expected: { companyType: "PRIVATE_NON_LISTED", agmDeadlineDate: "2026-06-30", arFilingDeadlineDate: "2026-07-31", isAnnualReturnOverdue: false, statutoryLatePenaltySgd: 0, isGovernanceCompliant: true }
  },
  {
    caseId: "ACRA-LISTED-OVERDUE-T1",
    description: "ACRA public listed company overdue filing with Tier 1 statutory late penalty",
    engine: "calculateAcraStatutoryDeadlines",
    input: { financialYearEndDate: "2025-12-31", isListedCompany: true, currentDate: "2026-06-01" },
    expected: { companyType: "PUBLIC_LISTED", agmDeadlineDate: "2026-04-30", arFilingDeadlineDate: "2026-05-31", isAnnualReturnOverdue: true, penaltyTier: "TIER_1_UP_TO_3_MONTHS", statutoryLatePenaltySgd: 300 }
  },
  {
    caseId: "ACRA-SMALL-COMPANY-EXEMPT",
    description: "ACRA Small Company Audit Exemption meeting statutory 2-of-3 criteria",
    engine: "evaluateSmallCompanyAuditExemption",
    input: { isPrivateCompany: true, currentYearFinancials: { annualRevenueSgd: 4500000, totalAssetsSgd: 3200000, fullTimeEmployees: 18 }, priorYearFinancials: { annualRevenueSgd: 3800000, totalAssetsSgd: 2700000, fullTimeEmployees: 15 } },
    expected: { isExemptFromAudit: true, auditRequirementStatus: "AUDIT_EXEMPT_UNAUDITED_STATEMENTS_PERMITTED", verdictCode: "QUALIFIES_AS_SMALL_COMPANY_AUDIT_EXEMPT" }
  },
  {
    caseId: "PDPA-BREACH-NRIC-72H",
    description: "PDPA mandatory data breach notification for significant harm (NRIC/FIN)",
    engine: "evaluatePdpaBreachNotification",
    input: { affectedIndividualsCount: 85, compromisedDataCategories: ["NRIC_OR_FIN", "FINANCIAL_ACCOUNTS_OR_CREDIT_CARDS"], annualSingaporeTurnoverSgd: 5000000, assessmentCompletedTimestamp: "2026-11-06T10:00:00.000Z" },
    expected: { isMandatoryToNotifyPdpc: true, pdpcNotificationDeadlineHours: 72, maximumStatutoryFinancialPenaltySgd: 1000000 }
  },
  // 18 additional cases to reach 22
  {
    caseId: "ACRA-OVERDUE-TIER-2-PENALTY",
    description: "ACRA statutory late penalty Tier 2 for filings overdue by more than 3 months",
    engine: "calculateAcraStatutoryDeadlines",
    input: { financialYearEndDate: "2025-06-30", isListedCompany: false, hasResidentDirector: false, isSoleDirectorSecretary: true, currentDate: "2026-06-01" },
    expected: { isAnnualReturnOverdue: true, penaltyTier: "TIER_2_MORE_THAN_3_MONTHS", statutoryLatePenaltySgd: 600, isGovernanceCompliant: false }
  },
  {
    caseId: "PDPA-BREACH-MINOR-INTERNAL",
    description: "PDPA minor non-reportable incident below 500 records and no significant harm data",
    engine: "evaluatePdpaBreachNotification",
    input: { affectedIndividualsCount: 20, compromisedDataCategories: ["EMAIL_ADDRESSES"], remedialActionEliminatedHarm: true, annualSingaporeTurnoverSgd: 2000000 },
    expected: { isMandatoryToNotifyPdpc: false }
  },
  {
    caseId: "ACRA-AUDIT-REQUIRED-LARGE",
    description: "Large corporate company failing small company criteria requiring statutory audit",
    engine: "evaluateSmallCompanyAuditExemption",
    input: { isPrivateCompany: true, currentYearFinancials: { annualRevenueSgd: 15000000, totalAssetsSgd: 12000000, fullTimeEmployees: 80 }, priorYearFinancials: { annualRevenueSgd: 14000000, totalAssetsSgd: 11000000, fullTimeEmployees: 75 } },
    expected: { isExemptFromAudit: false, auditRequirementStatus: "STATUTORY_AUDIT_MANDATORY" }
  },
  {
    caseId: "LEGAL-DIRECTOR-ELIGIBLE",
    description: "Evaluation of director eligibility under Companies Act Section 145/148",
    engine: "evaluateDirectorEligibility",
    input: { directorName: "Alice Wong", age: 32, residentialStatus: "SC", isUndischargedBankrupt: false, hasFraudOrDishonestyConviction: false },
    expected: { isLegallyEligible: true, status: "QUALIFIED_FOR_DIRECTORSHIP" }
  },
  {
    caseId: "LEGAL-DIRECTOR-DISQUALIFIED-BANKRUPTCY",
    description: "Director disqualification due to undischarged bankruptcy under Section 148",
    engine: "evaluateDirectorEligibility",
    input: { directorName: "Bob Smith", age: 40, residentialStatus: "SC", isUndischargedBankrupt: true, hasFraudOrDishonestyConviction: false },
    expected: { isLegallyEligible: false, status: "LEGALLY_DISQUALIFIED" }
  },
  {
    caseId: "LEGAL-STRIKING-OFF-READY",
    description: "Evaluation of company readiness for voluntary striking off under Section 344A",
    engine: "evaluateStrikingOffReadiness",
    input: { hasCommencedBusiness: false, hasOutstandingIrasTaxMatters: false, hasActiveBankAccounts: false, hasOutstandingDebtsToGovernmentOrThirdParties: false, hasOngoingLitigation: false, hasMajorityShareholderApproval: true },
    expected: { isEligibleToApply: true, readinessStatus: "READY_FOR_STRIKING_OFF_APPLICATION" }
  },
  {
    caseId: "LEGAL-STRIKING-OFF-BLOCKED-TAX",
    description: "Striking off blocked due to outstanding tax liabilities with IRAS",
    engine: "evaluateStrikingOffReadiness",
    input: { hasCommencedBusiness: true, hasCeasedTrading: false, hasOutstandingIrasTaxMatters: true, hasActiveBankAccounts: true, hasOutstandingDebtsToGovernmentOrThirdParties: true },
    expected: { isEligibleToApply: false, readinessStatus: "BLOCKED_BY_STATUTORY_REQUIREMENTS" }
  },
  {
    caseId: "LEGAL-TRADEMARK-DISTINCTIVE",
    description: "IPOS trademark registrability evaluation for arbitrary and distinctive mark",
    engine: "evaluateTrademarkRegistrability",
    input: { markName: "Zalvoria", niceClasses: [9, 42], usesPreApprovedSpecification: true, isInventedWord: true },
    expected: { outcomeVerdict: "HIGH_CHANCE_OF_REGISTRATION", totalValidClasses: 2 }
  },
  {
    caseId: "LEGAL-TRADEMARK-DESCRIPTIVE-FAIL",
    description: "IPOS trademark objection risk due to purely descriptive characteristics",
    engine: "evaluateTrademarkRegistrability",
    input: { markName: "Singapore Best Tech", niceClasses: [9], isInventedWord: false, hasPriorIdenticalMarkInSameClass: true },
    expected: { outcomeVerdict: "LIKELY_REJECTED" }
  },
  {
    caseId: "LEGAL-IPOS-FEES-CALCULATION",
    description: "IPOS statutory trademark application fee calculation across multiple classes",
    engine: "calculateIposFilingFees",
    input: { classes: [9, 35, 42], usesPreApprovedSpecification: true },
    expected: { classCount: 3, feePerClassSgd: 280, totalFeesPayableSgd: 840 }
  },
  {
    caseId: "LEGAL-CONTRACT-HIGH-RISK",
    description: "Commercial contract risk review detecting uncapped liability and foreign governing law",
    engine: "evaluateContractRisk",
    input: { governingLawCountry: "FOREIGN", disputeForum: "FOREIGN_COURTS", contractValueSgd: 1000000, liabilityCapSgd: null, hasUnlimitedIndemnity: true, excludesConsequentialLoss: false, hasUnilateralTerminationForConvenience: true, terminationNoticeDays: 7 },
    expected: { riskTier: "CRITICAL" }
  },
  {
    caseId: "LEGAL-CONTRACT-BALANCED-SG",
    description: "Commercial contract review compliant with Singapore governing law and SIAC arbitration",
    engine: "evaluateContractRisk",
    input: { governingLawCountry: "SINGAPORE", disputeForum: "SIAC", contractValueSgd: 500000, liabilityCapSgd: 500000, hasUnlimitedIndemnity: false, excludesConsequentialLoss: true, hasUnilateralTerminationForConvenience: false, terminationNoticeDays: 30 },
    expected: { riskTier: "LOW", contractRiskScore: 0 }
  },
  {
    caseId: "LEGAL-CORP-SEC-COMPLIANT",
    description: "Corporate secretarial statutory register and AGM compliance audit",
    engine: "auditCorporateSecretarial",
    input: { companyType: "PRIVATE", monthsSinceIncorporation: 4, secretaryProfile: { isAppointed: true, isOrdinarilyResidentInSingapore: true, isAlsoSoleDirector: false }, rorcCompliance: { isRorcMaintained: true, daysSinceControllerInfoChange: 5, isLodgedWithAcraCentralRegister: true } },
    expected: { isFullyCompliant: true, complianceScore: 100 }
  },
  {
    caseId: "LEGAL-CORP-SEC-DEFICIT",
    description: "Corporate secretarial audit detecting vacancy of company secretary > 6 months",
    engine: "auditCorporateSecretarial",
    input: { companyType: "PRIVATE", monthsSinceIncorporation: 8, secretaryProfile: { isAppointed: false }, rorcCompliance: { isRorcMaintained: false, daysSinceControllerInfoChange: 20, isLodgedWithAcraCentralRegister: false } },
    expected: { isFullyCompliant: false }
  },
  {
    caseId: "LEGAL-TADM-SALARY-DISPUTE",
    description: "TADM employment claim eligibility evaluation under Employment Claims Act",
    engine: "evaluateTadmDispute",
    input: { claimType: "SALARY_ARREARS", claimAmountSgd: 15000, isUnionMember: false, monthsSinceDisputeEvent: 4, wasEmploymentTerminated: true },
    expected: { isEligibleForTadmMediation: true, isWithinStatutoryClaimLimit: true }
  },
  {
    caseId: "LEGAL-TADM-FEE-LOW-CLAIM",
    description: "TADM statutory mediation registration fee calculation for claim <= S$10,000",
    engine: "calculateTadmRegistrationFee",
    input: { claimAmountSgd: 8000 },
    expected: { applicableFeeSgd: 10 }
  },
  {
    caseId: "LEGAL-TADM-FEE-HIGH-CLAIM",
    description: "TADM registration fee calculation for claim > S$10,000",
    engine: "calculateTadmRegistrationFee",
    input: { claimAmountSgd: 18000 },
    expected: { applicableFeeSgd: 20 }
  },
  {
    caseId: "PDPA-BREACH-MAJOR-500",
    description: "PDPA mandatory reporting triggered by affected count >= 500 individuals",
    engine: "evaluatePdpaBreachNotification",
    input: { affectedIndividualsCount: 650, compromisedDataCategories: ["EMAIL_ADDRESSES", "NAMES"], annualSingaporeTurnoverSgd: 80000000 },
    expected: { isSignificantScaleBreach: true, isMandatoryToNotifyPdpc: true }
  }
];

// =========================================================================
// 4. FINANCE DOMAIN (25 Cases)
// =========================================================================
const financeCases = [
  {
    caseId: "SORA-WACC-STANDARD",
    description: "Corporate WACC under SORA benchmark with standard 60/40 capital structure and 17% CIT tax shield",
    engine: "calculateSingaporeWacc",
    input: { marketValueOfEquitySgd: 6000000, marketValueOfDebtSgd: 4000000, riskFreeRate: 0.030, equityBeta: 1.2, equityRiskPremium: 0.055, soraBaseRate: 0.035, debtCreditSpread: 0.015, citTaxRate: 0.17 },
    expected: { equityWeightPercent: 60, debtWeightPercent: 40, costOfEquityKePercent: 9.6, preTaxCostOfDebtKdPercent: 5.0, afterTaxCostOfDebtPercent: 4.15, weightedAverageCostOfCapitalPercent: 7.42 }
  },
  {
    caseId: "SORA-WACC-ALL-EQUITY",
    description: "100% Equity financed Singapore company WACC boundary",
    engine: "calculateSingaporeWacc",
    input: { marketValueOfEquitySgd: 5000000, marketValueOfDebtSgd: 0, riskFreeRate: 0.030, equityBeta: 1.0, equityRiskPremium: 0.050 },
    expected: { equityWeightPercent: 100, debtWeightPercent: 0, costOfEquityKePercent: 8.0, weightedAverageCostOfCapitalPercent: 8.0 }
  },
  {
    caseId: "WORKING-CAPITAL-CCC-SURPLUS",
    description: "Singapore SME working capital liquidity, Cash Conversion Cycle (75 days), and capital surplus",
    engine: "calculateSingaporeWorkingCapital",
    input: { currentAssetsSgd: 2000000, currentLiabilitiesSgd: 1000000, cashAndEquivalentsSgd: 500000, tradeReceivablesSgd: 700000, inventorySgd: 800000, tradePayablesSgd: 400000, annualRevenueSgd: 7300000, annualCogsSgd: 3650000 },
    expected: { netWorkingCapitalSgd: 1000000, currentRatio: 2.0, quickRatio: 1.2, cashRatio: 0.5, isSolventShortTerm: true, daysSalesOutstandingDso: 35, daysInventoryOutstandingDio: 80, daysPayableOutstandingDpo: 40, operatingCycleDays: 115, cashConversionCycleDays: 75, workingCapitalRequiredForCccSgd: 750000, workingCapitalSurplusOrDeficitSgd: 250000, position: "WORKING_CAPITAL_SURPLUS" }
  },
  {
    caseId: "FIN-WORKING-CAPITAL-DEFICIT",
    description: "Working capital liquidity strain with negative working capital position",
    engine: "calculateSingaporeWorkingCapital",
    input: { currentAssetsSgd: 800000, currentLiabilitiesSgd: 1200000, cashAndEquivalentsSgd: 50000, tradeReceivablesSgd: 450000, inventorySgd: 300000, tradePayablesSgd: 800000, annualRevenueSgd: 3650000, annualCogsSgd: 2500000 },
    expected: { netWorkingCapitalSgd: -400000, isSolventShortTerm: false, position: "WORKING_CAPITAL_DEFICIT" }
  },
  {
    caseId: "FIN-SFRS-115-TRANSACTION-ALLOCATION",
    description: "SFRS 115 transaction price allocation based on standalone selling prices",
    engine: "allocateTransactionPriceSfrs115",
    input: {
      totalTransactionPriceSgd: 100000,
      performanceObligations: [
        { id: "SOFTWARE_LICENSE", standaloneSellingPriceSgd: 80000 },
        { id: "IMPLEMENTATION_SERVICE", standaloneSellingPriceSgd: 40000 }
      ]
    },
    expected: { totalTransactionPriceSgd: 100000, totalStandaloneSellingPriceSgd: 120000, bundleDiscountSgd: 20000 }
  },
  {
    caseId: "FIN-SFRS-INCOME-STATEMENT",
    description: "Compilation of SFRS compliant multi-step Income Statement",
    engine: "compileIncomeStatement",
    input: { revenueSgd: 1000000, costOfSalesSgd: 400000, operatingExpensesSgd: 250000, depreciationAndAmortisationSgd: 50000, financeCostsSgd: 20000, taxExpenseSgd: 47600 },
    expected: { grossProfitSgd: 600000, ebitdaSgd: 350000, operatingProfitEbitSgd: 300000, profitBeforeTaxSgd: 280000, netProfitSgd: 232400 }
  },
  {
    caseId: "FIN-SFRS-BALANCE-SHEET",
    description: "Compilation of SFRS compliant Balance Sheet verifying fundamental accounting equation",
    engine: "compileBalanceSheet",
    input: {
      currentAssets: { cashAndCashEquivalentsSgd: 200000, tradeAndOtherReceivablesSgd: 150000, inventoriesSgd: 150000 },
      nonCurrentAssets: { propertyPlantEquipmentSgd: 500000, rightOfUseAssetsSgd: 200000 },
      currentLiabilities: { tradeAndOtherPayablesSgd: 120000, shortTermBorrowingsSgd: 80000 },
      nonCurrentLiabilities: { longTermBorrowingsSgd: 250000, leaseLiabilitiesNonCurrentSgd: 150000 },
      equity: { shareCapitalSgd: 200000, retainedEarningsSgd: 400000 }
    },
    expected: { totalAssetsSgd: 1200000, totalLiabilitiesSgd: 600000, isBalanced: true, differenceSgd: 0 }
  },
  {
    caseId: "FIN-NPV-CALCULATION",
    description: "Net Present Value calculation for enterprise capital project",
    engine: "calculateNpv",
    input: { initialOutlaySgd: 100000, annualCashFlowsSgd: [35000, 45000, 50000], discountRate: 0.08 },
    expected: { value: 10679.27 }
  },
  {
    caseId: "FIN-IRR-CALCULATION",
    description: "Internal Rate of Return evaluation against corporate cost of capital hurdle",
    engine: "calculateIrr",
    input: { initialOutlaySgd: 100000, annualCashFlowsSgd: [40000, 50000, 40000] },
    expected: { value: 0.1433 }
  },
  {
    caseId: "FIN-PAYBACK-PERIOD",
    description: "Payback period evaluation determining time to recoup initial investment",
    engine: "calculatePaybackPeriod",
    input: { initialOutlaySgd: 200000, annualCashFlowsSgd: [80000, 80000, 80000, 80000], discountRate: 0.08 },
    expected: { undiscountedPaybackYears: 2.5 }
  },
  {
    caseId: "FIN-CAPITAL-INVESTMENT-COMPREHENSIVE",
    description: "Multi-metric capital investment appraisal (NPV, IRR, Payback, PI)",
    engine: "evaluateCapitalInvestment",
    input: { projectName: "High-Tech Automated Line", initialInvestmentSgd: 100000, annualCashFlowsSgd: [35000, 40000, 45000, 30000], discountRate: 0.08 },
    expected: { isAcceptable: true, verdict: "ACCEPT_PROJECT" }
  },
  {
    caseId: "FIN-SFRS-109-ECL-MATRIX",
    description: "SFRS 109 Expected Credit Loss impairment matrix on trade receivables aging",
    engine: "calculateSfrs109Ecl",
    input: { currentReceivablesSgd: 300000, pastDue1To30DaysSgd: 80000, pastDue31To60DaysSgd: 40000, pastDue61To90DaysSgd: 20000, moreThan90DaysSgd: 10000, macroeconomicMultiplier: 1.0, specificImpairmentSgd: 5000 },
    expected: { grossTradeReceivablesSgd: 450000, totalGeneralEclAllowanceSgd: 13500, specificImpairmentAllowanceSgd: 5000, totalEclAllowanceSgd: 18500, netTradeReceivablesSgd: 431500, taxDeductibleSpecificProvisionSgd: 5000, nonDeductibleGeneralProvisionSgd: 13500 }
  },
  {
    caseId: "FIN-INVENTORY-FIFO",
    description: "SFRS 2 First-In First-Out inventory valuation and cost of goods sold",
    engine: "calculateFifoInventory",
    input: { purchases: [{ units: 100, unitCostSgd: 10 }, { units: 150, unitCostSgd: 15 }], unitsSold: 120 },
    expected: { unitsSold: 120, endingInventoryUnits: 130, costOfGoodsSoldSgd: 1300, endingInventoryValueSgd: 1950 }
  },
  {
    caseId: "FIN-INVENTORY-WAC",
    description: "SFRS 2 Weighted Average Cost inventory valuation method",
    engine: "calculateWeightedAverageInventory",
    input: { purchases: [{ units: 100, unitCostSgd: 10 }, { units: 150, unitCostSgd: 15 }], unitsSold: 120 },
    expected: { endingInventoryUnits: 130, averageUnitCostSgd: 13, costOfGoodsSoldSgd: 1560, endingInventoryValueSgd: 1690 }
  },
  {
    caseId: "FIN-INVENTORY-NRV-WRITEDOWN",
    description: "Lower of cost and Net Realisable Value (NRV) write-down under SFRS 2",
    engine: "evaluateLowerOfCostAndNrv",
    input: { inventoryCostSgd: 50000, estimatedSellingPriceSgd: 45000, estimatedCompletionCostSgd: 2000, estimatedSellingExpenseSgd: 1000 },
    expected: { costSgd: 50000, netRealisableValueSgd: 42000, finalCarryingValueBalanceSheetSgd: 42000, isWriteDownRequired: true, inventoryWriteDownExpenseSgd: 8000 }
  },
  {
    caseId: "FIN-RATIOS-14-STANDARD",
    description: "Comprehensive financial ratio analysis across liquidity, solvency and profitability",
    engine: "analyzeFinancialRatios",
    input: { currentAssetsSgd: 500000, currentLiabilitiesSgd: 250000, cashAndEquivalentsSgd: 100000, inventorySgd: 120000, tradeReceivablesSgd: 180000, totalAssetsSgd: 1000000, totalLiabilitiesSgd: 400000, totalDebtSgd: 200000, totalEquitySgd: 600000, revenueSgd: 1200000, costOfGoodsSoldSgd: 600000, ebitOperatingProfitSgd: 200000, netProfitSgd: 150000, interestExpenseSgd: 20000 },
    expected: { currentRatio: 2.0, quickRatio: 1.52, cashRatio: 0.4, debtToEquityRatio: 0.33, interestCoverageRatio: 10.0, grossProfitMarginPercent: 50.0, netProfitMarginPercent: 12.5, returnOnEquityPercent: 25.0, verdict: "HEALTHY_STRONG" }
  },
  {
    caseId: "FIN-CASH-FLOW-RUNWAY",
    description: "Direct weekly cash flow forecasting and runway liquidity audit",
    engine: "forecastWeeklyCashFlow",
    input: { startingCashBalanceSgd: 50000, minimumCashReserveSgd: 10000, weeklyForecasts: [{ weekNumber: 1, operatingReceiptsSgd: 15000, payrollAndLeviesSgd: 8000, rentAndUtilitiesSgd: 4000 }, { weekNumber: 2, operatingReceiptsSgd: 12000, payrollAndLeviesSgd: 3000, rentAndUtilitiesSgd: 1000 }, { weekNumber: 3, operatingReceiptsSgd: 20000, payrollAndLeviesSgd: 5000, rentAndUtilitiesSgd: 2000 }, { weekNumber: 4, operatingReceiptsSgd: 8000, payrollAndLeviesSgd: 12000, rentAndUtilitiesSgd: 1000 }] },
    expected: { startingCashBalanceSgd: 50000, isSolventThroughoutPeriod: true, hasBreachedMinimumReserve: false }
  },
  {
    caseId: "FIN-BREAK-EVEN-CVP",
    description: "Cost-Volume-Profit and break-even unit and revenue analysis",
    engine: "calculateBreakEvenAnalysis",
    input: { fixedCostsSgd: 120000, unitSellingPriceSgd: 50, unitVariableCostSgd: 20, projectedSalesUnits: 5000, targetNetProfitSgd: 30000 },
    expected: { unitContributionMarginSgd: 30, contributionMarginRatioPercent: 60, breakEvenUnits: 4000, breakEvenRevenueSgd: 200000, requiredUnitsToSell: 5000, requiredRevenueSgd: 250000 }
  },
  {
    caseId: "FIN-SAAS-UNIT-ECONOMICS",
    description: "SaaS unit economics evaluating LTV:CAC ratio and payback period",
    engine: "evaluateUnitEconomics",
    input: { averageMonthlyRevenuePerUserSgd: 100, grossMarginPercent: 80, monthlyCustomerChurnRatePercent: 2.5, monthlySalesAndMarketingSpendSgd: 20000, newCustomersAcquiredMonthly: 25 },
    expected: { customerAcquisitionCostSgd: 800, customerLifetimeValueSgd: 3200, ltvToCacRatio: 4.0, cacPaybackPeriodMonths: 10.0, businessHealthRating: "IDEAL_OPTIMAL" }
  },
  {
    caseId: "FIN-VCC-WATERFALL",
    description: "Variable Capital Company fund distribution waterfall (hurdle & carried interest)",
    engine: "calculateVccDistributionWaterfall",
    input: { totalProceedsToDistributeSgd: 15000000, lpInvestedCapitalSgd: 10000000, hurdleRateAnnualPercent: 8, investmentHoldingPeriodYears: 3, carriedInterestPercent: 20, hasGpCatchUp: true },
    expected: { totalDistributedSgd: 15000000, totalDistributedToLpSgd: 14000000, capitalReturnedSgd: 10000000, netProfitToLpSgd: 4000000, netMoicMultiple: 1.4, totalCarriedInterestToGpSgd: 1000000, effectiveCarryPercentOfProfits: 20 }
  },
  {
    caseId: "FIN-SFRS-116-LEASE",
    description: "SFRS 116 Right-of-Use asset and lease liability amortization schedule",
    engine: "calculateSfrs116Lease",
    input: { annualLeasePaymentSgd: 60000, leaseTermYears: 3, incrementalBorrowingRatePercent: 5, initialDirectCostsSgd: 2000 },
    expected: { isExemptFromCapitalisation: false, initialLeaseLiabilitySgd: 163394.88, initialRightOfUseAssetSgd: 165394.88 }
  },
  {
    caseId: "FIN-FX-THEORETICAL-FORWARD",
    description: "Foreign exchange forward contract theoretical rate using interest rate parity",
    engine: "calculateTheoreticalForwardRate",
    input: { spotRate: 1.350, domesticRateAnnual: 0.035, foreignRateAnnual: 0.055, daysToMaturity: 360 },
    expected: { value: 1.3248 }
  },
  {
    caseId: "FIN-FX-FORWARD-HEDGE-GAIN",
    description: "Foreign exchange forward hedge evaluation with MTM gain",
    engine: "evaluateFxForwardHedge",
    input: { foreignCurrency: "USD", foreignExposureAmount: 100000, contractForwardRate: 1.340, currentSpotRate: 1.360, positionType: "BUY_FORWARD_IMPORTER" },
    expected: { hedgedSettlementValueSgd: 134000, unhedgedMarketValueSgd: 136000, hedgingMarkToMarketSgd: 2000, hedgingResultStatus: "HEDGING_GAIN" }
  },
  {
    caseId: "FIN-SFRS-FRAMEWORK-SMALL",
    description: "SFRS for Small Entities qualification evaluation",
    engine: "evaluateSfrsFramework",
    input: { annualRevenueSgd: 8000000, totalAssetsSgd: 7000000, employeeHeadcount: 40, isPubliclyAccountable: false },
    expected: { recommendedFramework: "SFRS_FOR_SMALL_ENTITIES", isEligibleForSmallEntitySfrs: true, criteriaMetCount: 3 }
  },
  {
    caseId: "FIN-SFRS-FRAMEWORK-FULL",
    description: "Full SFRS mandatory application when threshold exceeded",
    engine: "evaluateSfrsFramework",
    input: { annualRevenueSgd: 15000000, totalAssetsSgd: 12000000, employeeHeadcount: 65, isPubliclyAccountable: false },
    expected: { recommendedFramework: "FULL_SFRS", isEligibleForSmallEntitySfrs: false, criteriaMetCount: 1 }
  }
];

// =========================================================================
// 5. STRATEGIC DOMAIN (15 Cases)
// =========================================================================
const strategicCases = [
  {
    caseId: "ENTERPRISE-EDG-STANDARD",
    description: "Enterprise Singapore EDG standard 50% co-funding grant evaluation",
    engine: "evaluateEnterpriseGrant",
    input: { grantScheme: "EDG", qualifyingProjectCostSgd: 200000, localShareholdingPercentage: 35, isRegisteredInSingapore: true, groupAnnualTurnoverSgd: 5000000, groupEmployeeCount: 25 },
    expected: { isEligibleForGrant: true, statutorySupportRatePercent: 50, approvedGrantFundingSgd: 100000, companyCoPaymentShareSgd: 100000 }
  },
  {
    caseId: "ENTERPRISE-MRA-CAPPED",
    description: "Enterprise Singapore MRA grant statutory cap constraint (S$100k per market)",
    engine: "evaluateEnterpriseGrant",
    input: { grantScheme: "MRA", qualifyingProjectCostSgd: 60000, localShareholdingPercentage: 100, mraCumulativeClaimedSgd: 80000 },
    expected: { availableCapHeadroomSgd: 20000, approvedGrantFundingSgd: 20000, companyCoPaymentShareSgd: 40000 }
  },
  {
    caseId: "CORP-STRUCTURING-FSIE-13W",
    description: "Singapore holding corporate structuring with Section 13(8) FSIE and Section 13W safe harbour",
    engine: "evaluateCorporateStructuring",
    input: { dividendAmountSgd: 1000000, equityShareholdingPercent: 100, shareHoldingDurationMonths: 24, sourceJurisdictionHeadlineCitRate: 0.22, subjectToTaxInSource: true, isBonaFideResident: true, annualMaintenanceCostSgd: 8000 },
    expected: { dividendGrossAmount: 1000000, equityShareholdingPercentage: 100, holdingPeriodMonths: 24, qualifiesForSection138Fsie: true, singaporeCorporateTaxRate: 0, singaporeCorporateTaxPayable: 0, singaporeOutboundDividendWhtRate: 0, netDividendRepatriated: 1000000, annualHoldingMaintenanceCost: 8000, netCashDeliverable: 992000, qualifiesForSection13WSafeHarbour: true, statutoryExemptionStatus: "CONFIRMED_SAFE_HARBOUR_EXEMPT" }
  },
  {
    caseId: "STRAT-EDG-ENHANCED-SUSTAINABILITY",
    description: "Enhanced EDG 70% co-funding for sustainability and deep-tech innovation",
    engine: "evaluateEnterpriseGrant",
    input: { grantScheme: "EDG", qualifyingProjectCostSgd: 300000, localShareholdingPercentage: 60, isSustainabilityOrDeepTech: true },
    expected: { isEligibleForGrant: true, statutorySupportRatePercent: 70, approvedGrantFundingSgd: 210000 }
  },
  {
    caseId: "STRAT-GRANT-DISQUALIFIED-EQUITY",
    description: "Enterprise Singapore grant disqualification for local equity < 30%",
    engine: "evaluateEnterpriseGrant",
    input: { grantScheme: "EDG", qualifyingProjectCostSgd: 100000, localShareholdingPercentage: 20 },
    expected: { isEligibleForGrant: false }
  },
  {
    caseId: "STRAT-FSIE-LOW-TAX-DISQUALIFIED",
    description: "Section 13(8) FSIE exemption disqualified due to source headline tax < 15%",
    engine: "evaluateCorporateStructuring",
    input: { dividendAmountSgd: 500000, equityShareholdingPercent: 100, shareHoldingDurationMonths: 12, sourceJurisdictionHeadlineCitRate: 0.10, subjectToTaxInSource: true },
    expected: { qualifiesForSection138Fsie: false }
  },
  {
    caseId: "STRAT-SECTION-13W-DISQUALIFIED",
    description: "Section 13W capital gains safe harbour failure due to holding duration < 24m",
    engine: "evaluateCorporateStructuring",
    input: { dividendAmountSgd: 500000, equityShareholdingPercent: 25, shareHoldingDurationMonths: 12, sourceJurisdictionHeadlineCitRate: 0.20 },
    expected: { qualifiesForSection13WSafeHarbour: false }
  },
  {
    caseId: "STRAT-MARKET-ENTRY-SUBSIDIARY",
    description: "Market entry vehicle evaluation: Private Limited Subsidiary with limited liability",
    engine: "evaluateMarketEntrySg",
    input: { targetStructure: "SUBSIDIARY", projectedAnnualRevenueSgd: 2500000, projectedLocalOperatingExpensesSgd: 400000, projectedLocalHeadcount: 5, hasForeignHoldingCompany: true },
    expected: { targetStructure: "SUBSIDIARY", limitedLiabilityProtection: true, isApprovedForMarketEntry: true }
  },
  {
    caseId: "STRAT-MARKET-ENTRY-BRANCH",
    description: "Market entry foreign branch office with parent legal liability",
    engine: "evaluateMarketEntrySg",
    input: { targetStructure: "BRANCH", projectedAnnualRevenueSgd: 1000000, projectedLocalOperatingExpensesSgd: 150000, projectedLocalHeadcount: 2 },
    expected: { targetStructure: "BRANCH", limitedLiabilityProtection: false, qualifiesForStartupTaxExemption: false }
  },
  {
    caseId: "STRAT-MARKET-ENTRY-REP-OFFICE",
    description: "Representative Office vehicle restricted to non-commercial liaison activities",
    engine: "evaluateMarketEntrySg",
    input: { targetStructure: "REPRESENTATIVE_OFFICE", projectedAnnualRevenueSgd: 500000, projectedLocalOperatingExpensesSgd: 80000, projectedLocalHeadcount: 1 },
    expected: { targetStructure: "REPRESENTATIVE_OFFICE", isLegallyPermittedForCommercialRevenue: false, isApprovedForMarketEntry: false }
  },
  {
    caseId: "STRAT-COMPETITIVE-MOAT-FINTECH",
    description: "VRIO competitive moat audit in Singapore FinTech cluster with MAS regulatory barrier",
    engine: "evaluateCompetitiveMoatSg",
    input: { industryCluster: "FINTECH", hasValuableAsset: true, hasRareCapability: true, isCostlyToImitate: true, isOrganizedToCaptureValue: true, holdsStatutoryLicense: true, holdsRegisteredIpInIpos: true },
    expected: { competitiveImplication: "SUSTAINED_COMPETITIVE_ADVANTAGE", strategicMoatVerdict: "ROBUST_SINGAPORE_MOAT" }
  },
  {
    caseId: "STRAT-COMPETITIVE-MOAT-COMMODITY",
    description: "Competitive parity classification for undifferentiated retail trader",
    engine: "evaluateCompetitiveMoatSg",
    input: { industryCluster: "GENERAL_COMMERCIAL", hasValuableAsset: true, hasRareCapability: false, isCostlyToImitate: false, isOrganizedToCaptureValue: true },
    expected: { competitiveImplication: "COMPETITIVE_PARITY", strategicMoatVerdict: "VULNERABLE_TO_REGIONAL_COMPETITION" }
  },
  {
    caseId: "STRAT-SCENARIO-SNEER-APPRECIATION",
    description: "Macro stress test simulating aggressive MAS S$NEER monetary policy tightening",
    engine: "simulateMacroScenarioSg",
    input: { baselineRevenueSgd: 10000000, baselineOpexSgd: 7000000, scenarioType: "MAS_TIGHTENING_SGD_APPRECIATION", foreignRevenueSharePercent: 60, importedGoodsSharePercent: 40 },
    expected: { scenarioType: "MAS_TIGHTENING_SGD_APPRECIATION" }
  },
  {
    caseId: "STRAT-SCENARIO-INTEREST-RATE-HIKE",
    description: "Macroeconomic scenario evaluating interest rate spike on debt-leveraged SME",
    engine: "simulateMacroScenarioSg",
    input: { baselineRevenueSgd: 5000000, baselineOpexSgd: 4000000, scenarioType: "STAGFLATION_SHOCK" },
    expected: { scenarioType: "STAGFLATION_SHOCK" }
  },
  {
    caseId: "STRAT-RISK-MATRIX-CYBER",
    description: "Strategic risk assessment for cyber attack on financial services firm",
    engine: "evaluateStrategicRiskSg",
    input: { risks: [{ id: "R1", title: "PDPA Data Breach Risk", category: "REPUTATIONAL_CYBER", likelihood: 4, impact: 5, velocity: 3 }, { id: "R2", title: "MAS Regulatory Non-Compliance", category: "REGULATORY_COMPLIANCE", likelihood: 3, impact: 4, velocity: 2 }], hasBoardRiskCommittee: true, hasDocumentedErmPolicy: true },
    expected: { totalRisksEvaluated: 2, criticalExtremeCount: 1, hasBoardRiskCommittee: true, sgxCodeOfCorporateGovernanceCompliant: true }
  }
];

// =========================================================================
// 6. MARKETING DOMAIN (18 Cases)
// =========================================================================
const marketingCases = [
  {
    caseId: "MKT-SEO-HIGH-AUTHORITY",
    description: "Hyper-local SEO evaluation for high authority Singapore .com.sg domain",
    engine: "auditSingaporeLocalSeo",
    input: {
      domainName: "enterprise.com.sg",
      targetKeywords: ["Corporate Tax Services CBD", "Singapore Raffles Place Accounting"],
      hreflangTags: ["en-sg", "en"],
      localBusinessSchema: { postalCode: "048624", uen: "202312345K" },
      hasGoogleBusinessProfile: true
    },
    expected: { localSeoScore: 100, status: "EXCELLENT_LOCAL_AUTHORITY", hasSingaporeCcTld: true, hasValidSingaporePostalCode: true, hasValidAcraUen: true }
  },
  {
    caseId: "MKT-SEO-WEAK-REMEDIATION",
    description: "Hyper-local SEO audit for weak non-local domain requiring remediation",
    engine: "auditSingaporeLocalSeo",
    input: { domainName: "globalstartup.io", targetKeywords: ["Cloud Software Solutions"], hasGoogleBusinessProfile: false },
    expected: { status: "WEAK_LOCAL_SIGNALS_REMEDIATION_REQUIRED", hasSingaporeCcTld: false, hasValidSingaporePostalCode: false }
  },
  {
    caseId: "MKT-SEO-MODERATE-LOCAL",
    description: "Local SEO presence with verified Google Business Profile and postal code but .com domain",
    engine: "auditSingaporeLocalSeo",
    input: {
      domainName: "regionalhub.com",
      targetKeywords: ["Jurong Industrial Warehousing"],
      hreflangTags: ["en-sg"],
      localBusinessSchema: { postalCode: "609966", uen: "202100123A" },
      hasGoogleBusinessProfile: true
    },
    expected: { status: "MODERATE_LOCAL_PRESENCE", hasSingaporeCcTld: false, hasValidSingaporePostalCode: true }
  },
  {
    caseId: "MKT-CONTENT-ASAS-COMPLIANT",
    description: "B2B enterprise marketing copy certified 100% compliant with ASAS standards",
    engine: "auditSingaporeContentLocalization",
    input: { copyText: "Empowering Singapore enterprises with enterprise-grade financial governance and ACRA statutory compliance.", targetAudience: "B2B_ENTERPRISE" },
    expected: { targetAudience: "B2B_ENTERPRISE", localizationQualityScore: 100, isAsasCompliant: true, totalBreachesDetected: 0 }
  },
  {
    caseId: "MKT-CONTENT-ASAS-BREACH",
    description: "Marketing copy audit flagging prohibited superlatives and therapeutic cures",
    engine: "auditSingaporeContentLocalization",
    input: { copyText: "We are the BEST IN SINGAPORE clinic! Guaranteed 100% cure for all patients. Our serum CURES chronic fatigue lah!", targetAudience: "B2B_ENTERPRISE", hasHsaTherapeuticApproval: false },
    expected: { isAsasCompliant: false }
  },
  {
    caseId: "MKT-CONTENT-SINGLISH-CONSUMER",
    description: "B2C consumer lifestyle copy with permitted colloquial Singlish nuances",
    engine: "auditSingaporeContentLocalization",
    input: { copyText: "Don't say bo-jio! Chope your weekend dining table now and enjoy shiok deals!", targetAudience: "B2C_CONSUMER", allowColloquialSinglish: true },
    expected: { isAsasCompliant: true }
  },
  {
    caseId: "MKT-OUTBOUND-B2B-BCI-COMPLIANT",
    description: "B2B corporate outbound cadence compliant with PDPA Section 4(4)(d) BCI exemption",
    engine: "evaluateSingaporeOutboundCadence",
    input: { recipientType: "B2B_CORPORATE_CAPACITY", outboundChannels: ["EMAIL", "LINKEDIN"], hasFunctionalUnsubscribeMechanism: true, hasClearSenderIdentity: true },
    expected: { isFullyCompliant: true, bciExemptionApplies: true, isSpamControlActCompliant: true, totalBreachesDetected: 0 }
  },
  {
    caseId: "MKT-OUTBOUND-B2C-DNC-VIOLATION",
    description: "B2C telemarketing cadence flagged for missing DNC Registry check",
    engine: "evaluateSingaporeOutboundCadence",
    input: { recipientType: "B2C_INDIVIDUAL_CONSUMER", outboundChannels: ["PHONE_VOICE", "SMS_WHATSAPP"], hasCheckedDncRegistry: false, hasFunctionalUnsubscribeMechanism: true },
    expected: { isFullyCompliant: false, bciExemptionApplies: false }
  },
  {
    caseId: "MKT-OUTBOUND-SPAM-ACT-VIOLATION",
    description: "Email outbound violating Spam Control Act Section 11 by omitting unsubscribe",
    engine: "evaluateSingaporeOutboundCadence",
    input: { recipientType: "B2B_CORPORATE_CAPACITY", outboundChannels: ["EMAIL"], hasFunctionalUnsubscribeMechanism: false, hasClearSenderIdentity: true },
    expected: { isSpamControlActCompliant: false }
  },
  {
    caseId: "MKT-SOCIAL-LINKEDIN-B2B",
    description: "LinkedIn corporate social campaign with optimal SGT CBD timing and micro-influencer budget",
    engine: "planSingaporeSocialCampaign",
    input: { platform: "LINKEDIN", campaignGoal: "B2B_LEAD_GEN", allocatedBudgetSgd: 10000, influencerTier: "MICRO" },
    expected: { platform: "LINKEDIN", totalBudgetSgd: 10000, creatorPartnerships: 4000, paidMediaAmplification: 4500, creativeProduction: 1500, benchmarkEngagementRatePercent: 2.8 }
  },
  {
    caseId: "MKT-SOCIAL-INSTAGRAM-CONSUMER",
    description: "Instagram lifestyle campaign planned for evening commuter engagement",
    engine: "planSingaporeSocialCampaign",
    input: { platform: "INSTAGRAM", campaignGoal: "BRAND_AWARENESS", allocatedBudgetSgd: 5000, influencerTier: "NANO" },
    expected: { platform: "INSTAGRAM", selectedTier: "NANO", benchmarkEngagementRatePercent: 4.5 }
  },
  {
    caseId: "MKT-SOCIAL-TIKTOK-GENZ",
    description: "TikTok campaign planned with high-engagement video creator allocation",
    engine: "planSingaporeSocialCampaign",
    input: { platform: "TIKTOK", campaignGoal: "BRAND_AWARENESS", allocatedBudgetSgd: 8000, influencerTier: "MID_TIER" },
    expected: { platform: "TIKTOK", totalBudgetSgd: 8000 }
  },
  {
    caseId: "MKT-LEAD-TIER-1-ENTERPRISE",
    description: "Lead qualification engine scoring Tier 1 high-intent Enterprise corporate",
    engine: "scoreSingaporeB2bLead",
    input: { companyPaidUpCapitalSgd: 2000000, isGstRegisteredInIras: true, employeeHeadcount: 300, ssicSector: "FINANCIAL_SERVICES", decisionMakerSeniority: "C_SUITE", isBudgetConfirmed: true },
    expected: { leadScore: 100, leadTier: "TIER_1_ENTERPRISE_PRIORITY", isIcpQualified: true, recommendedSalesMotion: "SENIOR_ACCOUNT_EXECUTIVE_OUTBOUND_AND_CUSTOM_POC" }
  },
  {
    caseId: "MKT-LEAD-UNQUALIFIED-FILTER",
    description: "Lead qualification filtering out low-capital non-GST low-intent inquiry",
    engine: "scoreSingaporeB2bLead",
    input: { companyPaidUpCapitalSgd: 5000, isGstRegisteredInIras: false, employeeHeadcount: 3, ssicSector: "RETAIL_TRADE", decisionMakerSeniority: "INDIVIDUAL_CONTRIBUTOR", isBudgetConfirmed: false },
    expected: { leadTier: "UNQUALIFIED_LOW_INTENT", isIcpQualified: false }
  },
  {
    caseId: "MKT-LEAD-MID-MARKET-TIER-2",
    description: "Lead qualification scoring Mid-Market corporate prospect (Tier 2)",
    engine: "scoreSingaporeB2bLead",
    input: { companyPaidUpCapitalSgd: 100000, isGstRegisteredInIras: true, employeeHeadcount: 35, ssicSector: "INFORMATION_COMMUNICATIONS", decisionMakerSeniority: "DIRECTOR_VP", isBudgetConfirmed: true },
    expected: { leadTier: "TIER_2_MID_MARKET", isIcpQualified: true }
  },
  {
    caseId: "MKT-ADS-GST-REGISTERED-SCALABLE",
    description: "Paid digital media ads ROI factoring 9% GST Input Tax recovery on Form F5",
    engine: "calculateSingaporeAdsRoi",
    input: { adSpendExcludingGstSgd: 20000, acquiredCustomersCount: 50, totalAttributedRevenueSgd: 120000, customerLifespanMonths: 12, monthlyGrossMarginPerCustomerSgd: 300, isB2bGstRegistered: true },
    expected: { baseAdSpendBeforeGst: 20000, statutory9PercentGst: 1800, grossTotalAdSpend: 21800, isGstClaimableAsInputTax: true, effectiveNetAdCost: 20000, blendedCacSgd: 400, customerLtvSgd: 3600, ltvToCacRatio: 9.0, returnOnAdSpendRoas: 6.0, marketingEfficiencyTier: "HEALTHY_SCALABLE_UNIT_ECONOMICS" }
  },
  {
    caseId: "MKT-ADS-NON-GST-UNSUSTAINABLE",
    description: "Paid ads unit economics for non-GST registered SME suffering sunk 9% GST burden",
    engine: "calculateSingaporeAdsRoi",
    input: { adSpendExcludingGstSgd: 10000, acquiredCustomersCount: 10, totalAttributedRevenueSgd: 20000, customerLifespanMonths: 6, monthlyGrossMarginPerCustomerSgd: 150, isB2bGstRegistered: false },
    expected: { effectiveNetAdCost: 10900, isGstClaimableAsInputTax: false, blendedCacSgd: 1090, customerLtvSgd: 900, ltvToCacRatio: 0.83, marketingEfficiencyTier: "UNSUSTAINABLE_CASH_DRAIN" }
  },
  {
    caseId: "MKT-BRAND-PREMIUM-CATEGORY-LEADER",
    description: "Brand positioning and trust equity index audit for Singapore category leader",
    engine: "evaluateSingaporeBrandPositioning",
    input: {
      brandName: "SingaTrust Enterprise",
      targetSegment: "REGIONAL_ENTERPRISE",
      priceTier: "PREMIUM_LUXURY",
      coreDifferentiators: ["Deterministic 64 engines", "ACRA/IRAS alignment", "Sandbox isolation"],
      hasRegisteredIposTrademark: true,
      alignsWithGreenPlan2030: true,
      hasMadeWithPassionEndorsement: true
    },
    expected: { perceivedPremiumX: 8.0, positioningQuadrant: "PREMIUM_INNOVATOR_CATEGORY_LEADER", singaporeTrustIndex: 100, defensibilityTier: "HIGH_STRATEGIC_DEFENSIBILITY" }
  }
];

// Helper to validate and write suite
function processDomain(domainName, cases) {
  console.log(`\n📂 Processing Domain [${domainName}] — ${cases.length} cases:`);
  cases.forEach(c => {
    const act = runCase(c);
    assertMatch(c.caseId, c.expected, act);
    process.stdout.write(`  ✅ Case [${c.caseId}] verified\n`);
  });

  const outPath = path.join(ROOT, 'tests/golden', `${domainName}.json`);
  fs.writeFileSync(outPath, JSON.stringify(cases, null, 2) + '\n', 'utf8');
  console.log(`  💾 Saved to ${outPath} (${cases.length} cases)`);
}

function buildSuite() {
  console.log("🇸🇬 Building Full 130 Golden Test Case Suite across 6 Domains...\n");
  processDomain('tax-sg', taxCases);
  processDomain('hr-sg', hrCases);
  processDomain('legal-sg', legalCases);
  processDomain('finance-sg', financeCases);
  processDomain('strategic-sg', strategicCases);
  processDomain('marketing-sg', marketingCases);

  const total = taxCases.length + hrCases.length + legalCases.length + financeCases.length + strategicCases.length + marketingCases.length;
  console.log(`\n🎉 Suite Generation Complete! Total Golden Cases: ${total} (Target: 125+)`);
}

buildSuite();
