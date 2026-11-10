#!/usr/bin/env node

/**
 * Singapore Business Agent Skills - Command Line Interface (`bin/sg-agent-skills.js`)
 *
 * Production CLI interface for autonomous computational reasoning across Singapore
 * corporate law, tax, CPF, MOM, corporate governance, and statutory finance.
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
  tax-residency Evaluate Singapore Corporate Tax Residency & CoR (IRAS)
  structuring Evaluate Singapore Corporate Structuring & Holding (FSIE / Sec 13W)
  acra        Calculate ACRA statutory deadlines (AGM & Annual Return)
  audit       Evaluate Small Company Audit Exemption (Thirteenth Schedule)
  pdpa        Evaluate PDPA mandatory data breach notification
  wacc        Calculate SORA-linked Weighted Average Cost of Capital
  quota       Calculate Foreign Workforce Quota (DRC & S-Pass)
  eis         Calculate Enterprise Innovation Scheme (EIS) 400% tax deductions
  loss-carry  Evaluate Loss Carry-Forward and Carry-Back Relief (Sections 37/37E)
  group-relief Evaluate Group Relief loss transfer (Section 37C)
  ftc         Calculate Foreign Tax Credit (FTC) & Pooling (Sections 50/50A)
  family-office Evaluate Section 13O / 13U Family Office Tax Exemption
  pillar-two  Calculate BEPS 2.0 Pillar Two Domestic Top-up Tax (DTT)
  stamp-duty  Calculate Buyer's Stamp Duty (BSD) & ABSD on properties
  tax-audit   Assess IRAS Tax Audit Risk & GST/CIT Reconciliation
  transfer-pricing Evaluate Transfer Pricing & Section 34E Surcharge Risk
  capital-allowance Calculate Plant & Machinery Capital Allowances (Sections 19/19A)
  annual-leave Calculate statutory paid annual leave and encashment
  sick-leave  Calculate statutory sick & hospitalisation leave (Section 89)
  retrenchment Calculate retrenchment benefits and mandatory MOM notification
  parental-leave Calculate GPML & GPPL parental leave and CDCA reimbursement
  workplace-fairness Audit recruitment/HR text against WFA & TAFEP guidelines
  pwm         Evaluate Progressive Wage Model (PWM) & LQS headcount quotas
  kets        Audit Key Employment Terms (Section 95A) 14 mandatory items
  payslip     Audit mandatory itemised payslip statutory fields (Section 96A)
  holiday-pay Calculate public holiday compensation and in-lieu pay
  contract-audit Audit employment contract notice symmetry & non-compete
  contract-risk Audit B2B commercial contract risk & SIAC / Common Law clauses
  corp-sec    Audit Corporate Secretarial & RORC register compliance (ACRA)
  trademark   Evaluate IPOS trademark registrability & statutory filing fees
  striking-off Evaluate ACRA Section 344A corporate striking-off readiness
  director-audit Audit director eligibility, bankruptcy, and disqualifications
  tadm        Evaluate TADM mediation & ECT claims tribunal jurisdiction
  sfrs-eval   Evaluate SFRS for Small Entities vs Full SFRS framework
  sfrs-revenue Allocate contract revenue under SFRS 115 relative SSP model
  income-statement Compile and structure SFRS 1 Income Statement (P&L)
  balance-sheet Compile SFRS 1 Statement of Financial Position & balance check
  capital-budgeting Evaluate CapEx investment with NPV, IRR, and payback
  ecl         Calculate SFRS 109 Expected Credit Loss & IRAS tax deductibility
  inventory-val Calculate inventory valuation (FIFO/WAC) & NRV write-down
  ratios      Analyze 14 standard corporate financial ratios across 4 pillars
  cash-flow-forecast Model 13-week direct cash flow forecast, burn rate & runway
  break-even  Compute Cost-Volume-Profit, Break-Even Point & Margin of Safety
  unit-economics Model LTV, CAC, LTV:CAC ratio, and CAC payback period
  vcc-waterfall Model Singapore VCC 4-tier distribution waterfall & carried interest
  lease-sfrs116 Model SFRS 116 lease capitalisation, ROU assets & liability
  fx-hedging  Model FX forward hedging, MTM valuation & Interest Rate Parity
  grant       Evaluate Enterprise Singapore Grants (EnterpriseSG EDG / MRA / PSG)
  market-entry Evaluate Singapore Market Entry, structure, and ASEAN expansion
  moat        Evaluate Industry Cluster Moat & VRIO Defensibility in Singapore
  scenario    Simulate Macroeconomic & Geopolitical Stress Scenarios (MAS S$NEER)
  risk        Evaluate Strategic Risk Matrix & ERM Heatmap (SGX Corporate Governance)
  seo         Audit Singapore hyper-local SEO signals, ccTLD, and postal codes
  copy        Audit marketing copy against ASAS Code of Advertising Practice
  outbound    Audit B2B sales cadence for PDPA Section 4(4)(d) BCI exemption & DNC
  social      Model Singapore social media campaign budgets and transit timing
  lead        Score B2B leads using ACRA capital, IRAS GST status, and SSIC cluster
  ad-roi      Calculate paid ad CAC/LTV and statutory 9% GST imported digital tax
  brand       Formulate Singapore brand positioning coordinates & trust index
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

    case 'tax-residency':
      result = sbas.evaluateTaxResidency({
        companyName: flags.company || 'Singapore Corporate Entity',
        totalBodMeetings: flags.totalBod || 4,
        bodMeetingsInSingapore: flags.sgBod || 3,
        strategicDecisionsInSingapore: flags.strategic !== false,
        hasLocalResidentDirector: flags.localDir !== false,
        hasPhysicalOfficeInSingapore: flags.office !== false,
        localEmployeesCount: flags.employees || 2,
        isForeignControlled: Boolean(flags.foreignControlled)
      });
      break;

    case 'structuring':
      result = sbas.evaluateCorporateStructuring({
        dividendAmountSgd: flags.dividend || 500000,
        equityShareholdingPercent: flags.equity !== undefined ? flags.equity : 100,
        shareHoldingDurationMonths: flags.months || 24,
        sourceJurisdictionHeadlineCitRate: flags.sourceCit || 0.20,
        subjectToTaxInSource: flags.subjectToTax !== false,
        isBonaFideResident: flags.resident !== false,
        annualMaintenanceCostSgd: flags.maintCost || 8000
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

    case 'eis':
      result = sbas.calculateEnterpriseInnovationScheme({
        expenditures: {
          RND_LOCAL: flags.rd || 0,
          IP_REGISTRATION: flags.ipReg || 0,
          IP_ACQUISITION_LICENSING: flags.ipAcq || 0,
          TRAINING_INNOVATION: flags.training || 0,
          POLY_ITE_COLLABORATION: flags.poly || 0
        },
        optForCashConversion: Boolean(flags.cashPayout),
        yearOfAssessment: flags.ya || 2024
      });
      break;

    case 'loss-carry':
      result = sbas.evaluateLossUtilization({
        currentYearTradeLossesSgd: flags.losses || 0,
        currentYearCapitalAllowancesSgd: flags.ca || 0,
        priorYearAssessableIncomeSgd: flags.prevIncome || 0,
        optForCarryBack: Boolean(flags.carryBack),
        currentYearChargeableProfitSgd: flags.profit || 0,
        unabsorbedLossesBroughtForwardSgd: flags.priorLosses || 0,
        meetsShareholdingContinuityTest: flags.sct !== false,
        meetsSameBusinessTest: flags.sbt !== false
      });
      break;

    case 'group-relief':
      result = sbas.evaluateGroupReliefTransfer({
        transferor: {
          companyName: flags.fromCompany || 'Transferor Pte Ltd',
          currentYearTradeLossesSgd: flags.fromLosses || 0,
          currentYearCapitalAllowancesSgd: flags.fromCa || 0,
          currentYearDonationsSgd: flags.fromDonations || 0
        },
        transferee: {
          companyName: flags.toCompany || 'Transferee Pte Ltd',
          assessableIncomeBeforeReliefSgd: flags.toIncome || 0
        },
        shareholdingPercentage: flags.shareholding !== undefined ? flags.shareholding : 100,
        isSameFinancialYearEnd: flags.sameFye !== false
      });
      break;

    case 'ftc':
      result = sbas.calculateForeignTaxCredit({
        foreignIncomes: flags.income ? [{
          countryCode: flags.country || 'US',
          incomeType: flags.type || 'DIVIDEND',
          grossForeignIncomeSgd: flags.income || 100000,
          foreignTaxPaidSgd: flags.foreignTax || 15000,
          headlineForeignCitRatePercent: flags.foreignRate || 21
        }] : [],
        usePooling: Boolean(flags.pooling)
      });
      break;

    case 'family-office':
      result = sbas.evaluateFamilyOfficeExemption({
        scheme: flags.scheme || '13O',
        assetsUnderManagementSgd: flags.aum || 20000000,
        numberOfInvestmentProfessionals: flags.ips || 2,
        hasIndependentInvestmentProfessional: Boolean(flags.independentIp),
        annualLocalBusinessSpendingSgd: flags.spending || 200000,
        localInvestmentsSgd: flags.localInv || 2000000
      });
      break;

    case 'pillar-two':
      result = sbas.calculateDomesticTopUpTax({
        globalConsolidatedRevenueSgd: flags.globalRevenue || 1200000000,
        singaporeGlobeIncomeSgd: flags.globeIncome || 50000000,
        singaporeCoveredTaxesSgd: flags.coveredTaxes || 4000000,
        eligiblePayrollCostsSgd: flags.payroll || 10000000,
        eligibleTangibleAssetsSgd: flags.assets || 20000000
      });
      break;

    case 'stamp-duty':
      result = sbas.calculatePropertyStampDuty({
        propertyValue: flags.value || 1500000,
        propertyType: flags.type || 'RESIDENTIAL',
        buyerProfile: flags.buyer || 'SC',
        propertyCountOwned: flags.count !== undefined ? flags.count : 0
      });
      break;

    case 'tax-audit':
      result = sbas.assessTaxAuditRisk({
        revenueCitSgd: flags.citRevenue || 1000000,
        revenueGstAnnualSgd: flags.gstRevenue || 1000000,
        grossProfitMarginPercent: flags.gpm !== undefined ? flags.gpm : 25,
        industryBenchmarkGpmPercent: flags.benchGpm || 25,
        directorRemunerationSgd: flags.remun || 120000,
        directorLoanBalanceSgd: flags.loan || 0,
        crossBorderExpenseSgd: flags.foreignExpense || 0,
        crossBorderWhtRemittedSgd: flags.whtRemitted || 0
      });
      break;

    case 'transfer-pricing':
      result = sbas.evaluateTransferPricingCompliance({
        annualGrossRevenueSgd: flags.revenue || 12000000,
        priorYearRequiredTpd: Boolean(flags.priorTpd),
        testedPartyOperatingMarginPercent: flags.margin !== undefined ? flags.margin : 5,
        interquartileRange: { p25: 4, median: 6, p75: 8 },
        baseAmountForAdjustmentSgd: flags.baseAmount || 1000000
      });
      break;

    case 'capital-allowance':
      result = sbas.calculateCapitalAllowances({
        assets: flags.cost ? [{
          description: flags.desc || 'Equipment',
          costSgd: flags.cost || 10000,
          claimMethod: flags.method || 'S19A_3_YEAR'
        }] : [{
          description: 'Office Laptops',
          costSgd: 15000,
          claimMethod: 'S19A_1_YEAR'
        }]
      });
      break;

    case 'annual-leave':
      result = sbas.calculateAnnualLeaveEntitlement({
        completedYearsOfService: flags.years || 3,
        completedMonthsInCurrentYear: flags.months || 6,
        annualLeaveTakenDays: flags.taken || 0,
        monthlyBasicSalarySgd: flags.salary || 3500
      });
      break;

    case 'sick-leave':
      result = sbas.calculateSickLeaveEntitlement({
        monthsOfService: flags.months || 8,
        outpatientSickLeaveTakenDays: flags.outpatientTaken || 2,
        hospitalisationLeaveTakenDays: flags.hospTaken || 0,
        hasCertifiedMedicalCertificate: flags.mc !== false
      });
      break;

    case 'retrenchment':
      result = sbas.calculateRetrenchmentBenefit({
        monthlySalarySgd: flags.salary || 5000,
        yearsOfService: flags.years || 4,
        weeksPerYearOfService: flags.weeks || 4,
        companySizeEmployees: flags.companySize || 20,
        employeesRetrenchedPast6Months: flags.retrenchedCount || 6
      });
      break;

    case 'parental-leave':
      result = sbas.calculateParentalLeave({
        leaveType: flags.type || 'MATERNITY',
        monthlyGrossSalarySgd: flags.salary || 6000,
        childOrderNumber: flags.child || 1,
        monthsOfService: flags.months || 6,
        isChildSingaporeCitizen: flags.citizen !== false,
        isLawfullyMarried: flags.married !== false
      });
      break;

    case 'workplace-fairness':
      result = sbas.auditWorkplaceFairness({
        textToAudit: flags.text || 'Looking for young and energetic mandarin-speaking sales executive',
        hasGenuineOccupationalRequirement: Boolean(flags.gor)
      });
      break;

    case 'pwm':
      result = sbas.evaluateProgressiveWageCompliance({
        monthlyGrossSalarySgd: flags.salary || 2000,
        pwmSectorKey: flags.sector || 'RETAIL',
        isLocalEmployee: flags.local !== false
      });
      break;

    case 'kets':
      result = sbas.auditKeyEmploymentTerms({
        daysSinceEmploymentCommenced: flags.days || 10,
        isWrittenFormat: flags.written !== false
      });
      break;

    case 'payslip':
      result = sbas.auditItemisedPayslip({
        employeeWorkedOvertime: Boolean(flags.ot),
        daysAfterSalaryPaymentDelivered: flags.days || 2,
        maintainsRecordsForTwoYears: flags.records !== false
      });
      break;

    case 'holiday-pay':
      result = sbas.calculatePublicHolidayCompensation({
        monthlyBasicSalarySgd: flags.salary || 3000,
        workingDaysPerWeek: flags.daysPerWeek || 5,
        publicHolidaysWorkedCount: flags.count || 1,
        compensationMode: flags.mode || 'EXTRA_DAYS_PAY'
      });
      break;

    case 'contract-audit':
      result = sbas.auditEmploymentContract({
        contractualEmployerNoticeWeeks: flags.employerNotice || 4,
        contractualEmployeeNoticeWeeks: flags.employeeNotice || 4,
        yearsOfService: flags.years || 2,
        probationDurationMonths: flags.probation || 3,
        nonCompeteClause: flags.nonCompete ? {
          durationMonths: flags.ncDuration || 6,
          geographicalScope: flags.ncScope || 'Singapore',
          protectsLegitimateInterest: flags.ncLegit !== false
        } : undefined
      });
      break;

    case 'contract-risk':
      result = sbas.evaluateContractRisk({
        governingLawCountry: flags.law || 'SINGAPORE',
        disputeForum: flags.forum || 'SIAC',
        contractValueSgd: flags.value || 500000,
        liabilityCapSgd: flags.cap !== undefined ? flags.cap : 500000,
        hasUnlimitedIndemnity: Boolean(flags.unlimitedIndemnity),
        excludesConsequentialLoss: flags.excludeConsequential !== false,
        hasUnilateralTerminationForConvenience: Boolean(flags.unilateralTermination),
        terminationNoticeDays: flags.noticeDays || 30
      });
      break;

    case 'corp-sec':
      result = sbas.auditCorporateSecretarial({
        companyType: flags.type || 'PRIVATE',
        monthsSinceIncorporation: flags.months || 5,
        secretaryProfile: {
          isAppointed: flags.appointed !== false,
          isOrdinarilyResidentInSingapore: flags.resident !== false,
          isAlsoSoleDirector: Boolean(flags.soleDirector)
        },
        rorcCompliance: {
          isRorcMaintained: flags.rorc !== false,
          daysSinceControllerInfoChange: flags.rorcDays || 5,
          isLodgedWithAcraCentralRegister: flags.rorcLodged !== false
        }
      });
      break;

    case 'trademark':
      result = sbas.evaluateTrademarkRegistrability({
        markName: flags.name || 'NovaTech Solutions',
        niceClasses: flags.classes ? String(flags.classes).split(',').map(Number) : [9, 42],
        usesPreApprovedSpecification: flags.preApproved !== false,
        isInventedWord: Boolean(flags.invented),
        hasPriorIdenticalMarkInSameClass: Boolean(flags.identical),
        hasVisualPhoneticSimilarity: Boolean(flags.similar)
      });
      break;

    case 'striking-off':
      result = sbas.evaluateStrikingOffReadiness({
        hasCommencedBusiness: flags.commenced !== false,
        hasCeasedTrading: flags.ceased !== false,
        hasOutstandingIrasTaxMatters: Boolean(flags.taxMatters),
        hasActiveBankAccounts: Boolean(flags.bankActive),
        hasOutstandingDebtsToGovernmentOrThirdParties: Boolean(flags.debts),
        hasOngoingLitigation: Boolean(flags.litigation),
        hasMajorityShareholderApproval: flags.approved !== false,
        isSubjectToInsolvencyProceedings: Boolean(flags.insolvency)
      });
      break;

    case 'director-audit':
      result = sbas.evaluateDirectorEligibility({
        directorName: flags.name || 'John Tan',
        age: flags.age || 35,
        residentialStatus: flags.status || 'SC',
        isUndischargedBankrupt: Boolean(flags.bankrupt),
        hasFraudOrDishonestyConviction: Boolean(flags.fraud),
        isAlsoSoleDirector: Boolean(flags.soleDirector),
        isAlsoSoleCompanySecretary: Boolean(flags.soleSec),
        hasDisclosedConflictOfInterest: flags.conflict !== false
      });
      break;

    case 'tadm':
      result = sbas.evaluateTadmDispute({
        claimType: flags.type || 'SALARY_ARREARS',
        claimAmountSgd: flags.amount || 12000,
        isUnionMember: Boolean(flags.union),
        monthsSinceDisputeEvent: flags.months || 3,
        wasEmploymentTerminated: flags.terminated !== false
      });
      break;

    case 'sfrs-eval':
      result = sbas.evaluateSfrsFramework({
        annualRevenueSgd: flags.revenue || 8000000,
        totalAssetsSgd: flags.assets || 6000000,
        employeeHeadcount: flags.employees || 35,
        isPubliclyAccountable: Boolean(flags.publicAccountable)
      });
      break;

    case 'sfrs-revenue':
      result = sbas.allocateTransactionPriceSfrs115({
        totalTransactionPriceSgd: flags.price || 100000,
        performanceObligations: [
          { id: '1', description: 'Software License', standaloneSellingPriceSgd: flags.ssp1 || 80000 },
          { id: '2', description: 'Implementation & Maintenance', standaloneSellingPriceSgd: flags.ssp2 || 40000 }
        ]
      });
      break;

    case 'income-statement':
      result = sbas.compileIncomeStatement({
        revenueSgd: flags.revenue || 1000000,
        costOfSalesSgd: flags.cogs || 400000,
        operatingExpensesSgd: flags.opex || 300000,
        depreciationAmortisationSgd: flags.deprec || 50000,
        financeCostsSgd: flags.finance || 20000,
        incomeTaxExpenseSgd: flags.tax || 39100
      });
      break;

    case 'balance-sheet':
      result = sbas.compileBalanceSheet({
        currentAssets: { cashAndCashEquivalentsSgd: flags.cash || 300000, tradeAndOtherReceivablesSgd: 200000 },
        nonCurrentAssets: { propertyPlantEquipmentSgd: flags.ppe || 500000 },
        currentLiabilities: { tradeAndOtherPayablesSgd: flags.payables || 150000 },
        nonCurrentLiabilities: { longTermBorrowingsSgd: flags.loans || 250000 },
        equity: { shareCapitalSgd: flags.capital || 100000, retainedEarningsSgd: flags.retained || 500000 }
      });
      break;

    case 'capital-budgeting':
      result = sbas.evaluateCapitalInvestment({
        projectName: flags.name || 'Equipment Upgrade',
        initialInvestmentSgd: flags.initial || 100000,
        annualCashFlowsSgd: flags.cfs ? String(flags.cfs).split(',').map(Number) : [35000, 40000, 45000, 30000],
        hurdleDiscountRatePercent: flags.hurdle || 8
      });
      break;

    case 'ecl':
      result = sbas.calculateSfrs109Ecl({
        currentReceivablesSgd: flags.current || 200000,
        pastDue1To30DaysSgd: flags.pd1 || 50000,
        pastDue31To60DaysSgd: flags.pd31 || 20000,
        pastDue61To90DaysSgd: flags.pd61 || 10000,
        moreThan90DaysSgd: flags.gt90 || 5000,
        macroeconomicMultiplier: flags.multiplier || 1.1,
        specificImpairmentSgd: flags.specific || 0
      });
      break;

    case 'inventory-val':
      if (flags.nrv) {
        result = sbas.evaluateLowerOfCostAndNrv({
          inventoryCostSgd: flags.cost || 50000,
          estimatedSellingPriceSgd: flags.price || 45000,
          estimatedCompletionCostSgd: flags.completion || 2000,
          estimatedSellingExpenseSgd: flags.sellingExpense || 1000
        });
      } else {
        result = sbas.calculateFifoInventory({
          purchases: [
            { units: 100, unitCostSgd: 10 },
            { units: 150, unitCostSgd: 12 }
          ],
          unitsSold: flags.sold || 120
        });
      }
      break;

    case 'ratios':
      result = sbas.analyzeFinancialRatios({
        currentAssetsSgd: flags.ca || 500000,
        currentLiabilitiesSgd: flags.cl || 250000,
        cashAndEquivalentsSgd: flags.cash || 100000,
        inventorySgd: flags.inv || 120000,
        tradeReceivablesSgd: flags.ar || 180000,
        totalAssetsSgd: flags.assets || 1000000,
        totalLiabilitiesSgd: flags.liab || 400000,
        totalDebtSgd: flags.debt || 200000,
        totalEquitySgd: flags.equity || 600000,
        revenueSgd: flags.revenue || 1200000,
        costOfGoodsSoldSgd: flags.cogs || 600000,
        ebitOperatingProfitSgd: flags.ebit || 200000,
        netProfitSgd: flags.profit || 150000,
        interestExpenseSgd: flags.interest || 20000
      });
      break;

    case 'cash-flow-forecast':
      result = sbas.forecastWeeklyCashFlow({
        startingCashBalanceSgd: flags.cash || 50000,
        minimumCashReserveSgd: flags.reserve || 10000,
        weeklyForecasts: [
          { weekNumber: 1, operatingReceiptsSgd: 15000, payrollAndLeviesSgd: 8000, rentAndUtilitiesSgd: 4000 },
          { weekNumber: 2, operatingReceiptsSgd: 12000, payrollAndLeviesSgd: 3000, rentAndUtilitiesSgd: 1000 },
          { weekNumber: 3, operatingReceiptsSgd: 20000, payrollAndLeviesSgd: 5000, rentAndUtilitiesSgd: 2000 },
          { weekNumber: 4, operatingReceiptsSgd: 8000, payrollAndLeviesSgd: 12000, rentAndUtilitiesSgd: 1000 }
        ]
      });
      break;

    case 'break-even':
      result = sbas.calculateBreakEvenAnalysis({
        fixedCostsSgd: flags.fixed || 120000,
        unitSellingPriceSgd: flags.price || 50,
        unitVariableCostSgd: flags.variable || 20,
        projectedSalesUnits: flags.units || 5000,
        targetNetProfitSgd: flags.targetProfit || 30000
      });
      break;

    case 'unit-economics':
      result = sbas.evaluateUnitEconomics({
        averageMonthlyRevenuePerUserSgd: flags.arpu || 120,
        grossMarginPercent: flags.margin || 75,
        monthlyCustomerChurnRatePercent: flags.churn || 3,
        monthlySalesAndMarketingSpendSgd: flags.spend || 30000,
        newCustomersAcquiredMonthly: flags.acquired || 50
      });
      break;

    case 'vcc-waterfall':
      result = sbas.calculateVccDistributionWaterfall({
        totalDistributableProceedsSgd: flags.proceeds || 15000000,
        lpInvestedCapitalSgd: flags.capital || 10000000,
        preferredReturnHurdleRatePercent: flags.hurdle || 8,
        investmentHoldingPeriodYears: flags.years || 3,
        carriedInterestPercent: flags.carry || 20,
        hasGpCatchUp: flags.catchUp !== false
      });
      break;

    case 'lease-sfrs116':
      result = sbas.calculateSfrs116Lease({
        annualLeasePaymentSgd: flags.payment || 60000,
        leaseTermYears: flags.term || 3,
        incrementalBorrowingRatePercent: flags.ibr || 5,
        initialDirectCostsSgd: flags.directCost || 2000
      });
      break;

    case 'fx-hedging':
      result = sbas.evaluateFxForwardHedge({
        foreignCurrency: flags.ccy || 'USD',
        foreignExposureAmount: flags.amount || 100000,
        contractForwardRate: flags.forward || 1.345,
        currentSpotRate: flags.spot || 1.360,
        positionType: flags.type || 'BUY_FORWARD_IMPORTER'
      });
      break;

    case 'grant':
      result = sbas.evaluateEnterpriseGrant({
        grantType: flags.grant || 'EDG',
        applicantProfile: {
          localEquityPercent: flags.equity !== undefined ? flags.equity : 40,
          isFinanciallyViable: flags.viable !== false,
          groupAnnualSalesSgd: flags.sales || 15000000,
          groupEmployment: flags.employees || 45
        },
        projectCostSgd: flags.cost || 100000,
        projectCategory: flags.category || 'MARKET_EXPANSION'
      });
      break;

    case 'market-entry':
      result = sbas.evaluateMarketEntrySg({
        targetStructure: flags.structure || 'SUBSIDIARY',
        parentJurisdiction: flags.parent || 'United States',
        projectedAnnualRevenueSgd: flags.revenue || 500000,
        projectedLocalOperatingExpensesSgd: flags.opex || 250000,
        projectedLocalHeadcount: flags.headcount || 3,
        plansRegionalExpansion: flags.regional !== false,
        targetAseanMarkets: flags.markets ? String(flags.markets).split(',') : ['MALAYSIA', 'INDONESIA'],
        holdsForeignIntellectualPropertyOrShares: Boolean(flags.holdsIp)
      });
      break;

    case 'moat':
      result = sbas.evaluateCompetitiveMoatSg({
        industryCluster: flags.cluster || 'FINTECH',
        hasValuableAsset: flags.valuable !== false,
        hasRareCapability: flags.rare !== false,
        isCostlyToImitate: flags.costlyToImitate !== false,
        isOrganizedToCaptureValue: flags.organized !== false,
        holdsStatutoryLicense: Boolean(flags.license),
        holdsRegisteredIpInIpos: Boolean(flags.ipos)
      });
      break;

    case 'scenario':
      result = sbas.simulateMacroScenarioSg({
        baselineRevenueSgd: flags.revenue || 2000000,
        baselineOpexSgd: flags.opex || 1500000,
        scenarioType: flags.scenario || 'MAS_TIGHTENING_SGD_APPRECIATION',
        foreignRevenueSharePercent: flags.foreignRev || 40,
        importedGoodsSharePercent: flags.importedCost || 30
      });
      break;

    case 'risk':
      result = sbas.evaluateStrategicRiskSg({
        risks: flags.title ? [{
          title: flags.title,
          category: flags.category || 'REGULATORY_COMPLIANCE',
          likelihood: flags.likelihood || 3,
          impact: flags.impact || 4,
          velocity: flags.velocity || 3
        }] : [
          { title: 'Data Privacy Violation', category: 'REGULATORY_COMPLIANCE', likelihood: 3, impact: 4, velocity: 4 },
          { title: 'SGD Appreciation Compression', category: 'FINANCIAL_MARKET', likelihood: 4, impact: 3, velocity: 2 }
        ],
        hasBoardRiskCommittee: flags.riskCommittee !== false,
        hasDocumentedErmPolicy: flags.ermPolicy !== false
      });
      break;

    case 'seo':
      result = sbas.auditSingaporeLocalSeo({
        domainName: flags.domain || 'techcorp.com.sg',
        targetKeywords: flags.keywords ? String(flags.keywords).split(',') : ['fintech singapore', 'cbd cloud hosting'],
        hreflangTags: flags.hreflang ? String(flags.hreflang).split(',') : ['en-SG', 'en'],
        localBusinessSchema: {
          postalCode: flags.postal ? String(flags.postal) : '048624',
          uen: flags.uen || '202412345A'
        },
        hasGoogleBusinessProfile: flags.gbp !== false
      });
      break;

    case 'copy':
      result = sbas.auditSingaporeContentLocalization({
        copyText: flags.text || 'We are the #1 best fintech platform in Singapore lah!',
        targetAudience: flags.audience || 'B2B_ENTERPRISE',
        allowColloquialSinglish: Boolean(flags.singlish),
        hasHsaTherapeuticApproval: Boolean(flags.hsa)
      });
      break;

    case 'outbound':
      result = sbas.evaluateSingaporeOutboundCadence({
        recipientType: flags.recipient || 'B2B_CORPORATE_CAPACITY',
        outboundChannels: flags.channels ? String(flags.channels).split(',') : ['EMAIL', 'LINKEDIN'],
        hasCheckedDncRegistry: Boolean(flags.dnc),
        hasFunctionalUnsubscribeMechanism: flags.unsubscribe !== false,
        hasClearSenderIdentity: flags.identity !== false,
        cadenceStepCount: flags.steps || 4
      });
      break;

    case 'social':
      result = sbas.planSingaporeSocialCampaign({
        platform: flags.platform || 'LINKEDIN',
        allocatedBudgetSgd: flags.budget || 12000,
        campaignGoal: flags.goal || 'B2B_LEAD_GENERATION',
        influencerTier: flags.tier || 'MICRO',
        plannedPostCount: flags.posts || 10
      });
      break;

    case 'lead':
      result = sbas.scoreSingaporeB2bLead({
        companyPaidUpCapitalSgd: flags.capital || 100000,
        isGstRegisteredInIras: flags.gst !== false,
        employeeHeadcount: flags.employees || 35,
        ssicSector: flags.ssic || 'FINANCIAL_SERVICES',
        decisionMakerSeniority: flags.seniority || 'C_SUITE',
        isBudgetConfirmed: Boolean(flags.budgetConfirmed),
        timelineUrgencyMonths: flags.urgencyMonths || 2
      });
      break;

    case 'ad-roi':
      result = sbas.calculateSingaporeAdsRoi({
        adSpendExcludingGstSgd: flags.spend || 10000,
        acquiredCustomersCount: flags.customers || 25,
        totalAttributedRevenueSgd: flags.revenue || 45000,
        customerLifespanMonths: flags.lifespan || 12,
        monthlyGrossMarginPerCustomerSgd: flags.margin || 200,
        isB2bGstRegistered: flags.gstRegistered !== false
      });
      break;

    case 'brand':
      result = sbas.evaluateSingaporeBrandPositioning({
        brandName: flags.name || 'NovaSG',
        targetSegment: flags.segment || 'REGIONAL_ENTERPRISE',
        priceTier: flags.tier || 'PREMIUM_LUXURY',
        coreDifferentiators: flags.diff ? String(flags.diff).split(',') : ['Enterprise Grade', 'MAS Compliant'],
        hasRegisteredIposTrademark: flags.ipos !== false,
        alignsWithGreenPlan2030: Boolean(flags.green),
        hasMadeWithPassionEndorsement: Boolean(flags.passion)
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
