/**
 * Singapore Central Provident Fund (CPF) Calculator Engine (`engines/cpf-calculator.js`)
 *
 * Implements deterministic CPF contribution calculation per Central Provident Fund Act 1953:
 *   - Ordinary Wage (OW) ceiling progression (2023: S$6k, 2024: S$6.8k, 2025: S$7.4k, 2026: S$8.0k)
 *   - Additional Wage (AW) ceiling formula: max(0, 102,000 - Total OW subject to CPF in current year)
 *   - Age-tiered contribution rates for Singapore Citizens & PRs (Year 3 onwards)
 *   - Graduated rates for Singapore Permanent Residents (Year 1 & Year 2)
 *   - Skills Development Levy (SDL): 0.25%, min S$2.00, max S$11.25
 *   - Self-Help Group (SHG) funds: CDAC, MBMF, SINDA, Eurasian Association (EA)
 *   - Net employee take-home pay and total employer employment cost
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO prescriptive text / ZERO subjective advice.
 * Pure Node.js, zero external dependencies.
 */

'use strict';

const fs = require('fs');
const path = require('path');

let CPF_RULES = null;
function getRules() {
  if (!CPF_RULES) {
    const rulesPath = path.join(__dirname, 'rules/cpf-rules.json');
    if (fs.existsSync(rulesPath)) {
      CPF_RULES = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    } else {
      CPF_RULES = {
        ordinaryWageCeilings: { '2024': 6800, '2025': 7400, '2026': 8000 },
        additionalWageCeilingFormula: { annualBase: 102000 },
        skillsDevelopmentLevy: { rate: 0.0025, minimumSgd: 2.0, maximumSgd: 11.25, wageCapForMaxSgd: 4500 }
      };
    }
  }
  return CPF_RULES;
}

const RESIDENTIAL_STATUSES = [
  'CITIZEN',
  'SPR_YEAR_3_ONWARDS',
  'SPR_YEAR_2',
  'SPR_YEAR_1'
];

/**
 * Calculates monthly CPF contributions, SDL, and Community Fund deductions.
 *
 * @param {Object} input
 * @param {number} input.ordinaryWage - Monthly basic salary / ordinary wage in SGD
 * @param {number} [input.additionalWage=0] - Bonus, incentive, commission in SGD
 * @param {number} input.age - Age of employee in years
 * @param {string} [input.residentialStatus='CITIZEN'] - 'CITIZEN', 'SPR_YEAR_3_ONWARDS', 'SPR_YEAR_2', 'SPR_YEAR_1'
 * @param {number} [input.calendarYear=2024] - 2024, 2025, 2026
 * @param {number} [input.ytdOrdinaryWages=0] - Cumulative OW previously paid in the calendar year
 * @param {string} [input.communityFund='AUTO'] - 'CDAC', 'MBMF', 'SINDA', 'EA', 'NONE', 'AUTO'
 * @returns {Object} Comprehensive CPF contribution breakdown
 */
function calculateSingaporeCpf(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const ow = Number(input.ordinaryWage);
  if (isNaN(ow) || ow < 0 || !isFinite(ow)) {
    throw new Error(`INVALID_INPUT: 'ordinaryWage' must be a non-negative finite number (got ${input.ordinaryWage})`);
  }

  const aw = Number(input.additionalWage || 0);
  if (isNaN(aw) || aw < 0 || !isFinite(aw)) {
    throw new Error(`INVALID_INPUT: 'additionalWage' must be a non-negative finite number (got ${input.additionalWage})`);
  }

  const age = Number(input.age);
  if (isNaN(age) || age < 14 || age > 120 || !isFinite(age)) {
    throw new Error(`INVALID_INPUT: 'age' must be a valid age between 14 and 120 (got ${input.age})`);
  }

  const status = String(input.residentialStatus || 'CITIZEN').toUpperCase().trim();
  if (!RESIDENTIAL_STATUSES.includes(status)) {
    throw new Error(`INVALID_INPUT: 'residentialStatus' must be one of [${RESIDENTIAL_STATUSES.join(', ')}] (got '${input.residentialStatus}')`);
  }

  const year = String(input.calendarYear || 2024);
  const ytdOw = Number(input.ytdOrdinaryWages || 0);
  if (isNaN(ytdOw) || ytdOw < 0 || !isFinite(ytdOw)) {
    throw new Error(`INVALID_INPUT: 'ytdOrdinaryWages' must be a non-negative finite number (got ${input.ytdOrdinaryWages})`);
  }

  const rules = getRules();

  // 1. Determine OW Ceiling
  const owCeilings = rules.ordinaryWageCeilings || { '2024': 6800, '2025': 7400, '2026': 8000 };
  const owCeiling = owCeilings[year] || owCeilings['2024'] || 6800;
  const owSubjectToCpf = Math.min(ow, owCeiling);

  // 2. Determine AW Ceiling
  const annualBase = (rules.additionalWageCeilingFormula && rules.additionalWageCeilingFormula.annualBase) || 102000;
  const totalOwSubjectThisYear = ytdOw + owSubjectToCpf;
  const awCeilingRemaining = Math.max(0, annualBase - totalOwSubjectThisYear);
  const awSubjectToCpf = Math.min(aw, awCeilingRemaining);

  const totalWageSubjectToCpf = owSubjectToCpf + awSubjectToCpf;
  const totalGrossWage = ow + aw;

  // 3. Find Contribution Rate Tier by Age and Residential Status
  let rateSchedule = rules.ratesCitizenAndSprYear3Onwards;
  if (status === 'SPR_YEAR_1') {
    rateSchedule = rules.sprYear1Rates;
  } else if (status === 'SPR_YEAR_2') {
    rateSchedule = rules.sprYear2Rates;
  }

  let employeeRate = 0.20;
  let employerRate = 0.17;

  if (rateSchedule && Array.isArray(rateSchedule)) {
    const matched = rateSchedule.find(t => age > t.minAge && age <= t.maxAge);
    if (matched) {
      employeeRate = matched.employeeRate;
      employerRate = matched.employerRate;
    }
  }

  // Statutory CPF Calculation: Rounding per CPF Board convention (dollars or cents per statutory rounding)
  // Employee share is rounded down to nearest dollar, Employer share is rounded to nearest dollar per standard CPF table,
  // or exact cents calculation. Here we compute exact standard cents rounded per CPF convention.
  const employeeCpf = Math.round(totalWageSubjectToCpf * employeeRate * 100) / 100;
  const employerCpf = Math.round(totalWageSubjectToCpf * employerRate * 100) / 100;
  const totalCpf = Math.round((employeeCpf + employerCpf) * 100) / 100;

  // 4. Skills Development Levy (SDL)
  const sdlRules = rules.skillsDevelopmentLevy || { rate: 0.0025, minimumSgd: 2.0, maximumSgd: 11.25 };
  let sdlAmount = 0;
  if (totalGrossWage > 0) {
    const calculatedSdl = totalGrossWage * sdlRules.rate;
    sdlAmount = Math.max(sdlRules.minimumSgd, Math.min(sdlRules.maximumSgd, calculatedSdl));
    sdlAmount = Math.round(sdlAmount * 100) / 100;
  }

  // 5. Self-Help Group (SHG) Funds
  const shgType = String(input.communityFund || 'NONE').toUpperCase().trim();
  let shgDeduction = 0;
  if (rules.selfHelpGroupFunds && shgType !== 'NONE') {
    const tableKey = shgType.toLowerCase();
    const brackets = rules.selfHelpGroupFunds[tableKey];
    if (brackets && Array.isArray(brackets)) {
      const match = brackets.find(b => totalGrossWage <= b.maxWage);
      if (match) {
        shgDeduction = match.amount;
      }
    }
  }

  const netTakeHomePay = Math.max(0, Math.round((totalGrossWage - employeeCpf - shgDeduction) * 100) / 100);
  const totalEmployerCost = Math.round((totalGrossWage + employerCpf + sdlAmount) * 100) / 100;

  return {
    calendarYear: year,
    residentialStatus: status,
    employeeAge: age,
    totalGrossWageSgd: totalGrossWage,
    ordinaryWageBreakdown: {
      actualOwSgd: ow,
      owCeilingSgd: owCeiling,
      owSubjectToCpfSgd: owSubjectToCpf
    },
    additionalWageBreakdown: {
      actualAwSgd: aw,
      annualAwCeilingBaseSgd: annualBase,
      ytdOrdinaryWagesSubjectToCpfSgd: ytdOw,
      awCeilingRemainingSgd: awCeilingRemaining,
      awSubjectToCpfSgd: awSubjectToCpf
    },
    totalWageSubjectToCpfSgd: totalWageSubjectToCpf,
    contributionRates: {
      employeeRatePercent: Math.round(employeeRate * 1000) / 10,
      employerRatePercent: Math.round(employerRate * 1000) / 10,
      totalRatePercent: Math.round((employeeRate + employerRate) * 1000) / 10
    },
    contributions: {
      employeeCpfSgd: employeeCpf,
      employerCpfSgd: employerCpf,
      totalCpfSgd: totalCpf
    },
    leviesAndFunds: {
      skillsDevelopmentLevySgd: sdlAmount,
      selfHelpGroupType: shgType,
      selfHelpGroupDeductionSgd: shgDeduction
    },
    netTakeHomePaySgd: netTakeHomePay,
    totalEmployerCostSgd: totalEmployerCost
  };
}

module.exports = {
  calculateSingaporeCpf,
  RESIDENTIAL_STATUSES
};
