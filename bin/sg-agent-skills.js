#!/usr/bin/env node

/**
 * Singapore Business Agent Skills - Command Line Interface (`bin/sg-agent-skills.js`)
 *
 * Production CLI interface for autonomous computational reasoning across Singapore
 * corporate law, tax, CPF, MOM, and cross-border Singapore-Indonesia operations.
 */

'use strict';

const sbas = require('../index.js');

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
Singapore Business Agent Skills (SBAS) - CLI v${sbas.version}

Usage:
  sg-agent-skills <command> [options]

Commands:
  cit         Calculate Corporate Income Tax (IRAS)
  gst         Calculate GST filing or evaluate compulsory registration
  cpf         Calculate Central Provident Fund (CPF), SDL & SHG deductions
  compass     Evaluate MOM COMPASS score & EP eligibility
  wht         Calculate statutory Withholding Tax (IRAS)
  dta         Evaluate Bilateral DTA relief (Singapore-Indonesia)
  acra        Calculate ACRA statutory deadlines (AGM & Annual Return)
  audit       Evaluate Small Company Audit Exemption (Thirteenth Schedule)
  pdpa        Evaluate PDPA mandatory data breach notification
  wacc        Calculate SORA-linked Weighted Average Cost of Capital
  quota       Calculate Foreign Workforce Quota (DRC & S-Pass)
  integrity   Verify cryptographic SHA256 ruleset integrity
  --version   Print version
  --help      Print help

Example:
  sg-agent-skills cit --income=150000 --startup=true
  sg-agent-skills cpf --ow=6500 --age=30 --status=CITIZEN
  sg-agent-skills compass --salary=6000 --age=28 --sector=NON_FINANCIAL_SERVICES
`);
}

function parseFlags(rawArgs) {
  const flags = {};
  rawArgs.forEach(arg => {
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx !== -1) {
        const key = arg.slice(2, eqIdx);
        let val = arg.slice(eqIdx + 1);
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(Number(val))) val = Number(val);
        flags[key] = val;
      } else {
        flags[arg.slice(2)] = true;
      }
    }
  });
  return flags;
}

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  printHelp();
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log(`v${sbas.version}`);
  process.exit(0);
}

const command = args[0].toLowerCase();
const flags = parseFlags(args.slice(1));

try {
  let result = null;

  switch (command) {
    case 'cit':
      result = sbas.calculateSingaporeCit({
        chargeableIncome: flags.income || 0,
        isQualifyingStartup: Boolean(flags.startup),
        yearOfAssessment: flags.ya || 2024,
        hasLocalEmployeeWithCpf: Boolean(flags.hasLocalEmployee)
      });
      break;

    case 'gst':
      if (flags.supplies !== undefined) {
        result = sbas.calculateGstFiling({
          standardRatedSuppliesSgd: flags.supplies || 0,
          taxablePurchasesSgd: flags.purchases || 0,
          importedB2bServicesSgd: flags.imported || 0,
          effectiveRate: flags.rate !== undefined ? flags.rate : 0.09
        });
      } else {
        result = sbas.evaluateGstRegistrationLiability({
          past4QuartersTurnover: flags.pastTurnover ? String(flags.pastTurnover).split(',').map(Number) : [250000, 250000, 260000, 260000],
          projectedNext12MonthsTurnover: flags.projected || 0
        });
      }
      break;

    case 'cpf':
      result = sbas.calculateSingaporeCpf({
        ordinaryWage: flags.ow || 5000,
        additionalWage: flags.aw || 0,
        age: flags.age || 30,
        residentialStatus: flags.status || 'CITIZEN',
        calendarYear: flags.year || 2024,
        communityFund: flags.fund || 'AUTO'
      });
      break;

    case 'compass':
      result = sbas.evaluateCompassEpEligibility({
        monthlySalarySgd: flags.salary || 6000,
        candidateAge: flags.age || 28,
        sector: flags.sector || 'NON_FINANCIAL_SERVICES',
        qualificationLevel: flags.qual || 'DEGREE_EQUIVALENT',
        salaryPercentileRank: flags.rank || 'P65_TO_P89'
      });
      break;

    case 'wht':
      result = sbas.calculateSingaporeWht({
        paymentType: flags.type || 'INTEREST',
        grossAmountSgd: flags.amount || 10000,
        isGrossUp: Boolean(flags.grossup),
        customTreatyRate: flags.treatyRate
      });
      break;

    case 'dta':
      result = sbas.evaluateDtaSgIdRelief({
        incomeType: flags.type || 'DIVIDENDS',
        flowDirection: flags.flow || 'ID_TO_SG',
        grossAmountSgdOrIdr: flags.amount || 100000000,
        equityHoldingPercentage: flags.equity !== undefined ? flags.equity : 100
      });
      break;

    case 'acra':
      result = sbas.calculateAcraStatutoryDeadlines({
        financialYearEndDate: flags.fye || '2024-12-31',
        isListedCompany: Boolean(flags.listed)
      });
      break;

    case 'audit':
      result = sbas.evaluateSmallCompanyAuditExemption({
        isPrivateCompany: flags.private !== false,
        isNewlyIncorporated: Boolean(flags.new),
        currentYearFinancials: {
          annualRevenueSgd: flags.revenue || 5000000,
          totalAssetsSgd: flags.assets || 4000000,
          fullTimeEmployees: flags.employees || 20
        },
        priorYearFinancials: flags.new ? undefined : {
          annualRevenueSgd: flags.priorRevenue || 4500000,
          totalAssetsSgd: flags.priorAssets || 3800000,
          fullTimeEmployees: flags.priorEmployees || 18
        }
      });
      break;

    case 'pdpa':
      result = sbas.evaluatePdpaBreachNotification({
        affectedIndividualsCount: flags.count || 600,
        compromisedDataCategories: flags.categories ? String(flags.categories).split(',') : ['NRIC_OR_FIN'],
        annualSingaporeTurnoverSgd: flags.turnover || 5000000
      });
      break;

    case 'wacc':
      result = sbas.calculateSingaporeWacc({
        marketValueOfEquitySgd: flags.equity || 10000000,
        marketValueOfDebtSgd: flags.debt || 5000000
      });
      break;

    case 'quota':
      result = sbas.calculateForeignWorkforceQuota({
        sector: flags.sector || 'SERVICES',
        localHeadcount: flags.local || 10,
        currentSPassCount: flags.spass || 1,
        currentWorkPermitCount: flags.wp || 2
      });
      break;

    case 'integrity':
      result = flags.file ? sbas.verifyRulesetIntegrity(flags.file) : sbas.verifyAllRulesets();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }

  console.log(JSON.stringify(result, null, 2));
} catch (err) {
  console.error(`Error executing ${command}:`, err.message);
  process.exit(1);
}
