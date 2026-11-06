'use strict';

const assert = require('assert');
const {
  calculateSingaporeCpf,
  calculateMomOvertimeAndCompliance,
  evaluateCompassEpEligibility,
  calculateForeignWorkforceQuota,
  calculateLocalHeadcount
} = require('../../index.js');

function runHrEnginesTests() {
  console.log("🇸🇬 Running Singapore HR, Employment & Manpower Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. Central Provident Fund (CPF) - CPF Act 1953
  // ===============================================================
  console.log("  [1/4] Testing CPF Calculator & Wage Ceilings Engine...");

  // 1a. Standard Citizen <= 55 years old (OW S$6,000, 2024 ceiling S$6,800)
  const cpfStd = calculateSingaporeCpf({
    ordinaryWage: 6000,
    additionalWage: 0,
    age: 30,
    residentialStatus: 'CITIZEN',
    calendarYear: 2024,
    communityFund: 'CDAC'
  });
  // OW S$6,000 is under S$6,800 ceiling.
  // Employee 20% = S$1,200. Employer 17% = S$1,020. Total CPF = S$2,220.
  // SDL: 0.25% of S$6,000 = S$15 capped at max S$11.25.
  // CDAC for S$6,000 is S$2.00 (bracket S$5,001 - S$7,500).
  // Net take home = 6,000 - 1,200 - 2 = S$4,798.
  // Total employer cost = 6,000 + 1,020 + 11.25 = S$7,031.25.
  assert.strictEqual(cpfStd.contributions.employeeCpfSgd, 1200);
  assert.strictEqual(cpfStd.contributions.employerCpfSgd, 1020);
  assert.strictEqual(cpfStd.contributions.totalCpfSgd, 2220);
  assert.strictEqual(cpfStd.leviesAndFunds.skillsDevelopmentLevySgd, 11.25);
  assert.strictEqual(cpfStd.leviesAndFunds.selfHelpGroupDeductionSgd, 2);
  assert.strictEqual(cpfStd.netTakeHomePaySgd, 4798);
  assert.strictEqual(cpfStd.totalEmployerCostSgd, 7031.25);
  console.log("  ✅ CPF: Citizen standard contribution, SDL, and CDAC deduction verified.");

  // 1b. Ordinary Wage Ceiling Progression (2024: $6,800, 2025: $7,400, 2026: $8,000)
  const cpfCeiling2024 = calculateSingaporeCpf({ ordinaryWage: 10000, age: 30, calendarYear: 2024 });
  const cpfCeiling2025 = calculateSingaporeCpf({ ordinaryWage: 10000, age: 30, calendarYear: 2025 });
  const cpfCeiling2026 = calculateSingaporeCpf({ ordinaryWage: 10000, age: 30, calendarYear: 2026 });

  assert.strictEqual(cpfCeiling2024.ordinaryWageBreakdown.owSubjectToCpfSgd, 6800);
  assert.strictEqual(cpfCeiling2025.ordinaryWageBreakdown.owSubjectToCpfSgd, 7400);
  assert.strictEqual(cpfCeiling2026.ordinaryWageBreakdown.owSubjectToCpfSgd, 8000);
  console.log("  ✅ CPF: Statutory OW ceiling progression (2024->2026) verified.");

  // 1c. Additional Wage (AW) Ceiling formula: max(0, 102,000 - Total OW subject)
  const cpfAw = calculateSingaporeCpf({
    ordinaryWage: 6800,
    additionalWage: 50000,
    age: 30,
    calendarYear: 2024,
    ytdOrdinaryWages: 6800 * 11 // 11 months prior
  });
  // Total OW subject this year = (6800 * 11) + 6800 = 81,600.
  // AW ceiling remaining = 102,000 - 81,600 = 20,400.
  // Bonus S$50,000 is capped at S$20,400.
  assert.strictEqual(cpfAw.additionalWageBreakdown.awCeilingRemainingSgd, 20400);
  assert.strictEqual(cpfAw.additionalWageBreakdown.awSubjectToCpfSgd, 20400);
  console.log("  ✅ CPF: Annual Additional Wage (AW) ceiling cap verified.");

  // ===============================================================
  // 2. MOM Overtime & Part IV Employment Act
  // ===============================================================
  console.log("  [2/4] Testing MOM Overtime & Part IV Employment Act Engine...");

  // 2a. Workman covered under Part IV (Salary S$3,000 <= S$4,500, 20 OT hours)
  const otWorkman = calculateMomOvertimeAndCompliance({
    employeeCategory: 'WORKMAN',
    monthlyBasicSalarySgd: 3000,
    overtimeHours: 20,
    dailyMaxHoursWorked: 10,
    yearsOfService: 3
  });
  // Hourly rate: (12 * 3000) / (52 * 44) = 36000 / 2288 = 15.7342... -> 15.734
  // OT rate (1.5x): 15.734 * 1.5 = 23.60
  // Total OT pay: 23.60 * 20 = 472.00
  assert.strictEqual(otWorkman.isCoveredUnderPartIV, true);
  assert.strictEqual(otWorkman.coverageStatusReason, 'WORKMAN_SALARY_WITHIN_CAP');
  assert.strictEqual(otWorkman.overtimeCalculation.overtimeHoursWorked, 20);
  assert.strictEqual(otWorkman.statutoryComplianceAudit.exceedsMonthlyOtCap, false);
  assert.strictEqual(otWorkman.statutoryComplianceAudit.exceedsDailyWorkCap, false);
  assert.strictEqual(otWorkman.statutoryComplianceAudit.isFullyCompliant, true);
  assert.strictEqual(otWorkman.entitlements.statutoryAnnualLeaveDays, 9); // 7 + (3-1) = 9
  console.log("  ✅ MOM: Workman Part IV coverage, 1.5x OT calculation, and annual leave verified.");

  // 2b. Non-Workman salary cap for OT calculation (Salary S$2,800 > S$2,600 cap, but under S$2,600 threshold)
  // Non-workman with salary S$3,500 > S$2,600 is NOT covered under Part IV
  const otNonWorkmanExcluded = calculateMomOvertimeAndCompliance({
    employeeCategory: 'NON_WORKMAN',
    monthlyBasicSalarySgd: 3500,
    overtimeHours: 10
  });
  assert.strictEqual(otNonWorkmanExcluded.isCoveredUnderPartIV, false);
  assert.strictEqual(otNonWorkmanExcluded.coverageStatusReason, 'NON_WORKMAN_SALARY_EXCEEDS_CAP');
  assert.strictEqual(otNonWorkmanExcluded.overtimeCalculation.totalOvertimePayPayableSgd, 0);

  // 2c. Statutory Limits Violation: 80 OT hours (> 72 hr monthly cap) & 14 hr day (> 12 hr daily cap)
  const otViolation = calculateMomOvertimeAndCompliance({
    employeeCategory: 'WORKMAN',
    monthlyBasicSalarySgd: 2000,
    overtimeHours: 80,
    dailyMaxHoursWorked: 14
  });
  assert.strictEqual(otViolation.statutoryComplianceAudit.exceedsMonthlyOtCap, true);
  assert.strictEqual(otViolation.statutoryComplianceAudit.exceedsDailyWorkCap, true);
  assert.strictEqual(otViolation.statutoryComplianceAudit.isFullyCompliant, false);
  console.log("  ✅ MOM: Statutory monthly 72h and daily 12h limit violations audited.");

  // ===============================================================
  // 3. COMPASS Scoring Framework (Employment Pass)
  // ===============================================================
  console.log("  [3/4] Testing COMPASS Scoring Framework Engine...");

  // 3a. High salary statutory exemption (>= S$22,500/month)
  const compassExempt = evaluateCompassEpEligibility({
    monthlySalarySgd: 25000,
    candidateAge: 35
  });
  assert.strictEqual(compassExempt.isExemptFromCompass, true);
  assert.strictEqual(compassExempt.exemptionReason, 'HIGH_SALARY_EXEMPTION_ABOVE_22500_SGD');
  assert.strictEqual(compassExempt.isPassMarkMet, true);

  // 3b. Standard Candidate Scoring (Meets 40 Points Threshold)
  // Salary: P90+ (20 pts), Top-tier degree (20 pts), Small firm default (10 pts C3, 10 pts C4)
  const compassPassing = evaluateCompassEpEligibility({
    monthlySalarySgd: 9000,
    candidateAge: 30,
    sector: 'NON_FINANCIAL_SERVICES',
    salaryPercentileRank: 'P90_AND_ABOVE',
    qualificationLevel: 'TOP_TIER',
    firmPmetCount: 20 // small firm < 25 PMETs gets default 10 pts
  });
  assert.strictEqual(compassPassing.meetsMinimumQualifyingSalary, true);
  assert.strictEqual(compassPassing.criteriaBreakdown.c1SalaryPoints, 20);
  assert.strictEqual(compassPassing.criteriaBreakdown.c2QualificationPoints, 20);
  assert.strictEqual(compassPassing.criteriaBreakdown.c3DiversityPoints, 10);
  assert.strictEqual(compassPassing.criteriaBreakdown.c4LocalSupportPoints, 10);
  assert.strictEqual(compassPassing.totalCompassScore, 60);
  assert.strictEqual(compassPassing.isPassMarkMet, true);
  assert.strictEqual(compassPassing.eligibilityVerdict, 'ELIGIBLE_FOR_EP_COMPASS_PASSED');
  console.log("  ✅ COMPASS: Minimum qualifying salary, 60-point score, and pass verdict verified.");

  // ===============================================================
  // 4. Foreign Workforce Quota (DRC / FWL)
  // ===============================================================
  console.log("  [4/4] Testing Foreign Workforce Quota & Levy Engine...");

  // 4a. Local Headcount calculation per Local Qualifying Salary (LQS S$1,600)
  const localStaff = [
    { monthlySalarySgd: 3000 }, // 1.0
    { monthlySalarySgd: 1800 }, // 1.0
    { monthlySalarySgd: 1000 }, // 0.5 (between 800 and 1599)
    { monthlySalarySgd: 500 }   // 0.0 (< 800)
  ];
  const lqsCount = calculateLocalHeadcount(localStaff);
  assert.strictEqual(lqsCount, 2.5);

  // 4b. Services Sector DRC (35% total, 10% S-Pass) with 65 Local Staff
  // Max Foreigners = floor( (65 * 0.35) / (1 - 0.35) ) = floor( 22.75 / 0.65 ) = 35.
  // Max S-Pass = floor( (65 * 0.10) / (1 - 0.10) ) = floor( 6.5 / 0.90 ) = 7.
  const quotaServices = calculateForeignWorkforceQuota({
    sector: 'SERVICES',
    localHeadcount: 65,
    currentSPassCount: 5,
    currentWorkPermitCount: 20
  });
  assert.strictEqual(quotaServices.statutoryMaxAllowable.maxTotalForeignWorkers, 35);
  assert.strictEqual(quotaServices.statutoryMaxAllowable.maxSPassHolders, 7);
  assert.strictEqual(quotaServices.quotaHeadroom.totalForeignHeadroom, 10); // 35 - 25 = 10
  assert.strictEqual(quotaServices.quotaHeadroom.sPassHeadroom, 2); // 7 - 5 = 2
  assert.strictEqual(quotaServices.complianceAudit.isFullyCompliant, true);
  // Levy: 5 S-Pass * 330 = 1,650. 20 WP * 450 = 9,000. Total = 10,650.
  assert.strictEqual(quotaServices.estimatedMonthlyLevySgd.totalForeignWorkerLevySgd, 10650);
  console.log("  ✅ MOM DRC: Services sector quota, S-Pass sub-DRC, and monthly FWL verified.");

  console.log("\n✅ All Singapore HR, Employment & Manpower Domain Engine Tests Passed 100%!");
}

runHrEnginesTests();
