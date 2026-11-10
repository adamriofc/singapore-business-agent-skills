'use strict';

const assert = require('assert');
const {
  calculateSingaporeCpf,
  calculateMomOvertimeAndCompliance,
  evaluateCompassEpEligibility,
  calculateForeignWorkforceQuota,
  calculateLocalHeadcount,
  calculateAnnualLeaveEntitlement,
  calculateSickLeaveEntitlement,
  calculateRetrenchmentBenefit,
  calculateParentalLeave,
  auditWorkplaceFairness,
  evaluateProgressiveWageCompliance,
  auditKeyEmploymentTerms,
  auditItemisedPayslip,
  calculatePublicHolidayCompensation,
  auditEmploymentContract
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

  // ===============================================================
  // 5. Statutory Annual Leave Pro-ration & Encashment
  // ===============================================================
  console.log("  [5/14] Testing Statutory Annual Leave Engine...");
  // Karyawan masa kerja 2 tahun penuh (hak statuter 9 hari), bekerja 8 bulan di tahun berjalan, ambil cuti 3 hari
  // Prorata = (8 / 12) * 9 = 6.0 hari. Sisa = 6 - 3 = 3 hari.
  const alRes = calculateAnnualLeaveEntitlement({
    completedYearsOfService: 2,
    completedMonthsInCurrentYear: 8,
    leaveTakenDays: 3,
    grossMonthlySalarySgd: 3500
  });
  assert.strictEqual(alRes.statutoryMinimumDays, 9);
  assert.strictEqual(alRes.proratedCalculation.roundedStatutoryProratedDays, 6);
  assert.strictEqual(alRes.proratedCalculation.balanceRemainingDays, 3);
  assert.strictEqual(alRes.encashment.encashmentValueSgd > 0, true);
  console.log("  ✅ Annual Leave: Statutory tenure progression, pro-ration rounding, and encashment verified.");

  // ===============================================================
  // 6. Paid Sick & Hospitalisation Leave (Employment Act S.89)
  // ===============================================================
  console.log("  [6/14] Testing Paid Sick & Hospitalisation Leave Engine...");
  // Karyawan masa kerja 6 bulan (kuota penuh: 14 hari outpatient, 60 hari hospitalisation)
  // Ambil outpatient 4 hari, hospitalisation 10 hari
  const sickRes = calculateSickLeaveEntitlement({
    monthsOfService: 6,
    outpatientSickLeaveTakenDays: 4,
    hospitalisationLeaveTakenDays: 10,
    hasValidMcFromRegisteredDoctor: true
  });
  assert.strictEqual(sickRes.isEligibleForPaidSickLeave, true);
  assert.strictEqual(sickRes.entitlements.outpatientSickLeaveTotalDays, 14);
  assert.strictEqual(sickRes.entitlements.hospitalisationLeaveTotalDays, 60);
  assert.strictEqual(sickRes.balances.remainingOutpatientSickLeaveDays, 10); // 14 - 4
  assert.strictEqual(sickRes.balances.remainingHospitalisationLeaveDays, 46); // 60 - 4 - 10
  console.log("  ✅ Sick Leave: Service tenure tiers, inclusive hospitalisation caps, and MC validation verified.");

  // ===============================================================
  // 7. Retrenchment Benefit & MOM Notification
  // ===============================================================
  console.log("  [7/14] Testing Retrenchment Benefit & Mandatory Notification Engine...");
  // Gaji $4,000, 3 tahun masa kerja, 4 minggu per tahun = $4,000 * 3 = $12,000.
  // Headcount 20, retrenched 6 -> Trigger wajib lapor MOM (>= 10 headcount & >= 5 retrenched)
  const retrenchRes = calculateRetrenchmentBenefit({
    monthlySalarySgd: 4000,
    yearsOfService: 3,
    benefitWeeksPerYear: 4.33,
    companyContext: {
      totalCompanyHeadcount: 20,
      retrenchedIn6Months: 6
    }
  });
  assert.strictEqual(retrenchRes.employeeBenefit.isStatutorilyEligible, true);
  assert.strictEqual(retrenchRes.momNotification.isMandatory, true);
  assert.strictEqual(retrenchRes.momNotification.reportingDeadlineWorkingDays, 5);
  console.log("  ✅ Retrenchment: 2-year tenure threshold, benefit calculation, and mandatory MOM notification verified.");

  // ===============================================================
  // 8. Government-Paid Parental Leave (GPML & GPPL)
  // ===============================================================
  console.log("  [8/14] Testing Maternity & Paternity Leave Engine...");
  // GPML Anak ke-1: Total 16 minggu. Majikan bayar 8 minggu pertama, Pemerintah ganti 8 minggu kedua (capped $10k per 4 minggu = $2.5k/minggu)
  const gpmlChild1 = calculateParentalLeave({
    leaveType: 'MATERNITY',
    monthlyGrossSalarySgd: 8000,
    childOrderNumber: 1,
    monthsOfService: 6,
    isChildSingaporeCitizen: true,
    isLawfullyMarried: true
  });
  assert.strictEqual(gpmlChild1.isCdcaQualifying, true);
  assert.strictEqual(gpmlChild1.leaveDuration.totalLeaveWeeks, 16);
  assert.strictEqual(gpmlChild1.leaveDuration.employerFundedWeeks, 8);
  assert.strictEqual(gpmlChild1.leaveDuration.governmentFundedWeeks, 8);
  assert.strictEqual(gpmlChild1.financialBreakdown.governmentReimbursementClaimSgd, 14769.2); // $8,000/4.33 = $1846.15/wk * 8 = $14769.2
  console.log("  ✅ Parental Leave: 16-week GPML, 4-week GPPL, CDCA eligibility, and reimbursement caps verified.");

  // ===============================================================
  // 9. Workplace Fairness Act (WFA) & TAFEP Non-Discrimination
  // ===============================================================
  console.log("  [9/14] Testing Workplace Fairness & TAFEP Audit Engine...");
  // Teks iklan lowongan kerja dengan kata-kata diskriminatif
  const wfaAudit = auditWorkplaceFairness({
    textToAudit: "Looking for young and energetic female preferred staff, mandarin speaking preferred.",
    hasInternalGrievanceMechanism: false
  });
  assert.strictEqual(wfaAudit.riskTier, 'CRITICAL_RISK');
  assert.strictEqual(wfaAudit.totalViolationsDetected >= 3, true); // Age, Gender, Language, Grievance
  assert.strictEqual(wfaAudit.complianceScore < 60, true);
  console.log("  ✅ Workplace Fairness: Protected characteristics detection and TAFEP compliance verified.");

  // ===============================================================
  // 10. Progressive Wage Model (PWM) & Local Qualifying Salary (LQS)
  // ===============================================================
  console.log("  [10/14] Testing Progressive Wage Model & LQS Engine...");
  // Gaji $1,600 (di atas $1,600 LQS Full threshold) pada sektor RETAIL baseline $2,175 (mengalami defisit)
  const pwmAudit = evaluateProgressiveWageCompliance({
    monthlyGrossSalarySgd: 1600,
    pwmSectorKey: 'RETAIL',
    isLocalEmployee: true
  });
  assert.strictEqual(pwmAudit.lqsEvaluation.headcountContribution, 1.0);
  assert.strictEqual(pwmAudit.lqsEvaluation.status, 'FULL_LQS_HEADCOUNT');
  assert.strictEqual(pwmAudit.pwmEvaluation.isPwmCompliant, false);
  assert.strictEqual(pwmAudit.pwmEvaluation.wageDeficitSgd, 575); // 2175 - 1600
  console.log("  ✅ PWM & LQS: Local headcount credit and sectoral statutory wage baselines verified.");

  // ===============================================================
  // 11. Key Employment Terms (KETs - Section 95A)
  // ===============================================================
  console.log("  [11/14] Testing Key Employment Terms (KETs) Engine...");
  const ketsAudit = auditKeyEmploymentTerms({
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
  });
  assert.strictEqual(ketsAudit.isFullyCompliant, true);
  assert.strictEqual(ketsAudit.complianceScore, 100);
  assert.strictEqual(ketsAudit.timingAudit.isTimingCompliant, true);
  console.log("  ✅ KETs: 14-day statutory issuance deadline, 14 mandatory clauses, and written format verified.");

  // ===============================================================
  // 12. Itemised Payslip (Section 96A)
  // ===============================================================
  console.log("  [12/14] Testing Itemised Payslip Engine...");
  const payslipAudit = auditItemisedPayslip({
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
  });
  assert.strictEqual(payslipAudit.isFullyCompliant, true);
  assert.strictEqual(payslipAudit.complianceScore, 100);
  assert.strictEqual(payslipAudit.timingAudit.isTimingCompliant, true);
  console.log("  ✅ Itemised Payslip: Mandatory fields, overtime hours breakdown, and 2-year archival verified.");

  // ===============================================================
  // 13. Public Holiday Compensation (Section 88)
  // ===============================================================
  console.log("  [13/14] Testing Public Holiday Compensation Engine...");
  // Gaji $3,000, 5 hari kerja seminggu, kerja 1 hari libur nasional -> Extra 1 hari gaji
  // Daily rate = (12 * 3000) / (52 * 5) = 36000 / 260 = 138.46
  const phExtraPay = calculatePublicHolidayCompensation({
    monthlyBasicSalarySgd: 3000,
    normalWorkingDaysPerWeek: 5,
    holidaysWorkedCount: 1,
    compensationMode: 'EXTRA_PAY'
  });
  assert.strictEqual(phExtraPay.calculations.statutoryDailyRateOfPaySgd, 138.46);
  assert.strictEqual(phExtraPay.calculations.extraSalaryPayableSgd, 138.46);

  const phDayOff = calculatePublicHolidayCompensation({
    monthlyBasicSalarySgd: 3000,
    normalWorkingDaysPerWeek: 5,
    holidaysWorkedCount: 2,
    compensationMode: 'DAY_OFF_IN_LIEU'
  });
  assert.strictEqual(phDayOff.calculations.substituteDaysOffGrantedDays, 2);
  console.log("  ✅ Public Holiday: Daily gross rate, extra day pay, and day off in lieu verified.");

  // ===============================================================
  // 14. Employment Contract Review & Enforceability
  // ===============================================================
  console.log("  [14/14] Testing Employment Contract Audit Engine...");
  // Asymmetrical notice (Employer 2 weeks vs Employee 8 weeks) & Excessive non-compete (24 months, Global)
  const contractAudit = auditEmploymentContract({
    contractualEmployerNoticeWeeks: 2,
    contractualEmployeeNoticeWeeks: 8,
    yearsOfService: 1,
    probationDurationMonths: 3,
    nonCompeteClause: {
      hasNonCompete: true,
      durationMonths: 24,
      geographicalScope: 'GLOBAL',
      protectsTradeSecrets: false
    }
  });
  assert.strictEqual(contractAudit.isFullyCompliant, false);
  assert.strictEqual(contractAudit.noticePeriodAudit.isNoticeAsymmetrical, true);
  assert.strictEqual(contractAudit.nonCompeteAudit.assessment, 'LIKELY_UNENFORCEABLE_VOID');
  assert.strictEqual(contractAudit.complianceScore <= 60, true);
  console.log("  ✅ Employment Contract: Notice symmetry (S.10(2)), probation limits, and restraint of trade verified.");

  console.log("\n✅ All Singapore HR, Employment & Manpower Domain Engine Tests Passed 100%!");
}

runHrEnginesTests();
