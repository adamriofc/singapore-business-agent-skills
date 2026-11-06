/**
 * Singapore Ministry of Manpower (MOM) Overtime & Part IV Employment Act Engine (`engines/mom-overtime-engine.js`)
 *
 * Implements deterministic calculation and statutory audit under Part IV of Singapore Employment Act 1968:
 *   - Part IV coverage determination (Workmen <= S$4,500/mo, Non-Workmen <= S$2,600/mo, Excludes Managers/Execs)
 *   - Basic hourly rate calculation: (12 * monthlyBasicSalary) / (52 * 44)
 *   - Overtime rate: 1.5x basic hourly rate (capped at S$2,600/mo for non-workmen)
 *   - Monthly 72-hour statutory overtime limit audit
 *   - Daily 12-hour statutory work limit audit
 *   - Statutory annual leave entitlement schedule (7 to 14 days)
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let MOM_RULES = null;
function getRules() {
  if (!MOM_RULES) {
    const rulesPath = path.join(__dirname, 'rules/mom-workforce-rules.json');
    if (fs.existsSync(rulesPath)) {
      MOM_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      MOM_RULES = {
        partIVEmploymentAct: {
          coverage: { workmenWageCapSgd: 4500, nonWorkmenWageCapSgd: 2600 },
          workingHours: { maxStandardHoursPerWeek: 44, maxOvertimeHoursPerMonth: 72, maxTotalDailyHoursIncludingOvertime: 12 },
          overtimeFormula: { rateMultiplier: 1.5, nonWorkmenCapSalaryForOvertimeSgd: 2600 }
        }
      };
    }
  }
  return MOM_RULES;
}

const EMPLOYEE_CATEGORIES = ['WORKMAN', 'NON_WORKMAN', 'MANAGER_OR_EXECUTIVE'];

/**
 * Evaluates Part IV coverage and calculates statutory overtime pay.
 *
 * @param {Object} input
 * @param {string} input.employeeCategory - 'WORKMAN', 'NON_WORKMAN', 'MANAGER_OR_EXECUTIVE'
 * @param {number} input.monthlyBasicSalarySgd - Basic monthly salary in SGD
 * @param {number} input.overtimeHours - Overtime hours worked in the month
 * @param {number} [input.dailyMaxHoursWorked=0] - Peak total hours worked in a single day
 * @param {number} [input.yearsOfService=1] - Completed years of service (for annual leave calculation)
 * @returns {Object} Deterministic overtime and Part IV compliance analysis
 */
function calculateMomOvertimeAndCompliance(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const cat = String(input.employeeCategory || '').toUpperCase().trim();
  if (!EMPLOYEE_CATEGORIES.includes(cat)) {
    throw new Error(`INVALID_INPUT: 'employeeCategory' must be one of [${EMPLOYEE_CATEGORIES.join(', ')}] (got '${input.employeeCategory}')`);
  }

  const basic = Number(input.monthlyBasicSalarySgd);
  if (isNaN(basic) || basic < 0 || !isFinite(basic)) {
    throw new Error(`INVALID_INPUT: 'monthlyBasicSalarySgd' must be a non-negative finite number (got ${input.monthlyBasicSalarySgd})`);
  }

  const otHours = Number(input.overtimeHours || 0);
  if (isNaN(otHours) || otHours < 0 || !isFinite(otHours)) {
    throw new Error(`INVALID_INPUT: 'overtimeHours' must be a non-negative finite number (got ${input.overtimeHours})`);
  }

  const peakDailyHours = Number(input.dailyMaxHoursWorked || 0);
  const yearsService = Number(input.yearsOfService || 1);

  const rules = getRules().partIVEmploymentAct;
  const coverageRules = rules.coverage;
  const limits = rules.workingHours;

  // 1. Determine Part IV Coverage
  let isCovered = false;
  let coverageReason = 'EXCLUDED_ROLE';

  if (cat === 'WORKMAN') {
    if (basic <= coverageRules.workmenWageCapSgd) {
      isCovered = true;
      coverageReason = 'WORKMAN_SALARY_WITHIN_CAP';
    } else {
      coverageReason = 'WORKMAN_SALARY_EXCEEDS_CAP';
    }
  } else if (cat === 'NON_WORKMAN') {
    if (basic <= coverageRules.nonWorkmenWageCapSgd) {
      isCovered = true;
      coverageReason = 'NON_WORKMAN_SALARY_WITHIN_CAP';
    } else {
      coverageReason = 'NON_WORKMAN_SALARY_EXCEEDS_CAP';
    }
  } else {
    isCovered = false;
    coverageReason = 'MANAGER_OR_EXECUTIVE_EXCLUDED_FROM_PART_IV';
  }

  // 2. Overtime Rate Calculation
  // Standard formula: (12 * monthlyBasicSalary) / (52 * 44)
  let salaryForCalculation = basic;
  if (cat === 'NON_WORKMAN') {
    salaryForCalculation = Math.min(basic, rules.overtimeFormula.nonWorkmenCapSalaryForOvertimeSgd || 2600);
  }

  const basicHourlyRate = Math.round(((12 * salaryForCalculation) / (52 * limits.maxStandardHoursPerWeek)) * 1000) / 1000;
  const overtimeHourlyRate = Math.round(basicHourlyRate * rules.overtimeFormula.rateMultiplier * 100) / 100;
  const totalOvertimePay = isCovered ? Math.round(overtimeHourlyRate * otHours * 100) / 100 : 0;

  // 3. Compliance and Limit Checks
  const exceedsMonthlyOtLimit = otHours > limits.maxOvertimeHoursPerMonth;
  const exceedsDailyHourLimit = peakDailyHours > limits.maxTotalDailyHoursIncludingOvertime;

  // 4. Statutory Annual Leave Schedule per Employment Act
  let statutoryAnnualLeaveDays = 7;
  if (yearsService > 1) {
    statutoryAnnualLeaveDays = Math.min(14, 7 + (yearsService - 1));
  }

  return {
    employeeCategory: cat,
    monthlyBasicSalarySgd: basic,
    isCoveredUnderPartIV: isCovered,
    coverageStatusReason: coverageReason,
    overtimeCalculation: {
      cappedSalaryUsedForCalculationSgd: salaryForCalculation,
      basicHourlyRateSgd: basicHourlyRate,
      statutoryOvertimeRateMultiplier: rules.overtimeFormula.rateMultiplier,
      overtimeHourlyRateSgd: overtimeHourlyRate,
      overtimeHoursWorked: otHours,
      totalOvertimePayPayableSgd: totalOvertimePay
    },
    statutoryComplianceAudit: {
      monthlyOvertimeHours: otHours,
      monthlyStatutoryLimitHours: limits.maxOvertimeHoursPerMonth,
      exceedsMonthlyOtCap: exceedsMonthlyOtLimit,
      peakDailyHoursReported: peakDailyHours,
      dailyStatutoryLimitHours: limits.maxTotalDailyHoursIncludingOvertime,
      exceedsDailyWorkCap: exceedsDailyHourLimit,
      isFullyCompliant: !exceedsMonthlyOtLimit && !exceedsDailyHourLimit
    },
    entitlements: {
      completedYearsOfService: yearsService,
      statutoryAnnualLeaveDays: statutoryAnnualLeaveDays
    }
  };
}

module.exports = {
  calculateMomOvertimeAndCompliance,
  EMPLOYEE_CATEGORIES
};
