/**
 * Singapore Foreign Workforce Quota & Levy (DRC / FWL) Engine (`engines/foreign-workforce-quota-engine.js`)
 *
 * Implements deterministic calculation of foreign workforce quotas and levies under
 * MOM Employment of Foreign Manpower Act (EFMA):
 *   - Local Qualifying Salary (LQS) evaluation (S$1,600 = 1.0 headcount, S$800-S$1,599 = 0.5 headcount)
 *   - Dependency Ratio Ceiling (DRC) by sector (Services 35%, Manufacturing 60%, Construction 87.5%)
 *   - S-Pass sub-DRC ceilings (Services 10%, Manufacturing 15%, Construction 15%)
 *   - Available quota headroom calculation
 *   - Monthly Foreign Worker Levy (FWL) estimate
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
        foreignWorkforceQuotas: {
          services: { dependencyRatioCeilingPercent: 35.0, sPassSubDrcPercent: 10.0, levies: { sPassTier1: 330, sPassTier2: 650, workPermitBasic: 450 } },
          manufacturing: { dependencyRatioCeilingPercent: 60.0, sPassSubDrcPercent: 15.0, levies: { sPassTier1: 330, sPassTier2: 650, workPermitBasic: 370 } },
          construction: { dependencyRatioCeilingPercent: 87.5, sPassSubDrcPercent: 15.0, levies: { sPassTier1: 330, sPassTier2: 650, workPermitHigherSkilled: 300 } }
        },
        localQualifyingSalary: { monthlySgd: 1600 }
      };
    }
  }
  return MOM_RULES;
}

const SUPPORTED_SECTORS = ['SERVICES', 'MANUFACTURING', 'CONSTRUCTION'];

/**
 * Calculates local headcount based on LQS thresholds.
 *
 * @param {Array<{monthlySalarySgd: number}>} localEmployees
 * @returns {number} Weighted local headcount
 */
function calculateLocalHeadcount(localEmployees = []) {
  if (!Array.isArray(localEmployees)) return 0;
  let count = 0;
  localEmployees.forEach(emp => {
    const sal = Number(emp.monthlySalarySgd || 0);
    if (sal >= 1600) {
      count += 1.0;
    } else if (sal >= 800) {
      count += 0.5;
    }
  });
  return count;
}

/**
 * Evaluates foreign workforce quotas (DRC & S-Pass sub-DRC) and calculates monthly levy burden.
 *
 * @param {Object} input
 * @param {string} input.sector - 'SERVICES', 'MANUFACTURING', 'CONSTRUCTION'
 * @param {number} [input.localHeadcount] - Pre-calculated local headcount, OR pass localEmployees array
 * @param {Array<{monthlySalarySgd: number}>} [input.localEmployees] - Array of local staff salaries
 * @param {number} [input.currentSPassCount=0] - Existing S-Pass holders employed
 * @param {number} [input.currentWorkPermitCount=0] - Existing Work Permit holders employed
 * @returns {Object} Quota capacity, headroom, and levy estimate
 */
function calculateForeignWorkforceQuota(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const sector = String(input.sector || 'SERVICES').toUpperCase().trim();
  if (!SUPPORTED_SECTORS.includes(sector)) {
    throw new Error(`INVALID_INPUT: 'sector' must be one of [${SUPPORTED_SECTORS.join(', ')}] (got '${input.sector}')`);
  }

  let localHeadcount = 0;
  if (input.localHeadcount !== undefined) {
    localHeadcount = Number(input.localHeadcount);
    if (isNaN(localHeadcount) || localHeadcount < 0 || !isFinite(localHeadcount)) {
      throw new Error(`INVALID_INPUT: 'localHeadcount' must be a non-negative finite number (got ${input.localHeadcount})`);
    }
  } else if (Array.isArray(input.localEmployees)) {
    localHeadcount = calculateLocalHeadcount(input.localEmployees);
  } else {
    localHeadcount = 0;
  }

  const currentSPass = Number(input.currentSPassCount || 0);
  const currentWp = Number(input.currentWorkPermitCount || 0);

  if (isNaN(currentSPass) || currentSPass < 0 || !isFinite(currentSPass)) {
    throw new Error(`INVALID_INPUT: 'currentSPassCount' must be a non-negative finite number (got ${input.currentSPassCount})`);
  }
  if (isNaN(currentWp) || currentWp < 0 || !isFinite(currentWp)) {
    throw new Error(`INVALID_INPUT: 'currentWorkPermitCount' must be a non-negative finite number (got ${input.currentWorkPermitCount})`);
  }

  const rules = getRules().foreignWorkforceQuotas[sector.toLowerCase()];
  const drcRate = rules.dependencyRatioCeilingPercent / 100.0;
  const sPassDrcRate = rules.sPassSubDrcPercent / 100.0;

  // MOM Statutory Quota formula:
  // Max Foreign Workers = floor( (Local Headcount * DRC) / (1 - DRC) )
  const maxTotalForeigners = Math.floor((localHeadcount * drcRate) / (1.0 - drcRate));
  const maxSPass = Math.floor((localHeadcount * sPassDrcRate) / (1.0 - sPassDrcRate));

  const currentTotalForeigners = currentSPass + currentWp;
  const totalHeadroom = maxTotalForeigners - currentTotalForeigners;
  const sPassHeadroom = maxSPass - currentSPass;

  const isWithinTotalDrc = currentTotalForeigners <= maxTotalForeigners;
  const isWithinSPassDrc = currentSPass <= maxSPass;
  const isCompliant = isWithinTotalDrc && isWithinSPassDrc;

  // Monthly Levy Estimation
  const sPassLevyRate = rules.levies.sPassTier1 || 330;
  const wpLevyRate = rules.levies.workPermitBasic || rules.levies.workPermitHigherSkilled || 450;

  const monthlySPassLevy = currentSPass * sPassLevyRate;
  const monthlyWpLevy = currentWp * wpLevyRate;
  const totalMonthlyFwl = monthlySPassLevy + monthlyWpLevy;

  return {
    sector,
    localWorkforceHeadcount: localHeadcount,
    dependencyRatioCeilingPercent: rules.dependencyRatioCeilingPercent,
    sPassSubDrcPercent: rules.sPassSubDrcPercent,
    statutoryMaxAllowable: {
      maxTotalForeignWorkers: maxTotalForeigners,
      maxSPassHolders: maxSPass
    },
    currentEmployed: {
      currentSPassCount: currentSPass,
      currentWorkPermitCount: currentWp,
      currentTotalForeignWorkers: currentTotalForeigners
    },
    quotaHeadroom: {
      totalForeignHeadroom: totalHeadroom,
      sPassHeadroom: sPassHeadroom
    },
    complianceAudit: {
      isWithinTotalDrcQuota: isWithinTotalDrc,
      isWithinSPassQuota: isWithinSPassDrc,
      isFullyCompliant: isCompliant,
      statusMessage: isCompliant ? 'COMPLIANT_WITHIN_QUOTA' : 'BREACH_QUOTA_EXCEEDED'
    },
    estimatedMonthlyLevySgd: {
      sPassLevySgd: monthlySPassLevy,
      workPermitLevySgd: monthlyWpLevy,
      totalForeignWorkerLevySgd: totalMonthlyFwl
    }
  };
}

module.exports = {
  calculateForeignWorkforceQuota,
  calculateLocalHeadcount,
  SUPPORTED_SECTORS
};
