/**
 * Singapore Business Agent Skills - TypeScript Type Definitions (`index.d.ts`)
 */

export const version: string;
export const name: string;

export interface RulesetVerificationSingle {
  status: string;
  file: string;
  hash: string;
}
export interface RulesetVerificationAll {
  status: string;
  verifiedCount: number;
  results: RulesetVerificationSingle[];
}
export function verifyRulesetIntegrity(fileBasename: string, overrideFilePath?: string | null): RulesetVerificationSingle;
export function verifyAllRulesets(): RulesetVerificationAll;
export const REQUIRED_RULESETS: string[];
export const EXPECTED_HASHES: Record<string, string>;

// --- CIT ---
export interface CitCalculationInput {
  chargeableIncome: number;
  isQualifyingStartup?: boolean;
  yearOfAssessment?: number;
  hasLocalEmployeeWithCpf?: boolean;
}
export interface CitCalculationResult {
  yearOfAssessment: number;
  chargeableIncomeSgd: number;
  standardCitRate: number;
  exemptionScheme: string;
  exemptionBreakdown: {
    tier1ExemptSgd: number;
    tier2ExemptSgd: number;
    totalExemptIncomeSgd: number;
  };
  taxableIncomeAfterExemptionSgd: number;
  taxBeforeRebateSgd: number;
  citRebateSgd: number;
  citCashGrantSgd: number;
  netTaxPayableSgd: number;
  effectiveTaxRatePercent: number;
}
export function calculateSingaporeCit(input: CitCalculationInput): CitCalculationResult;

// --- GST ---
export interface GstLiabilityInput {
  past4QuartersTurnover?: number[];
  projectedNext12MonthsTurnover?: number;
}
export interface GstLiabilityResult {
  thresholdSgd: number;
  past12MonthsTurnoverSgd: number;
  projectedNext12MonthsTurnoverSgd: number;
  retrospectiveBreach: boolean;
  prospectiveBreach: boolean;
  isCompulsoryRegistrationRequired: boolean;
  verdictCode: string;
  registrationDeadlineGuidance: string;
}
export function calculateSingaporeGstRate(dateStr?: string): number;
export function evaluateGstRegistrationLiability(input?: GstLiabilityInput): GstLiabilityResult;

export interface GstFilingInput {
  standardRatedSuppliesSgd: number;
  taxablePurchasesSgd?: number;
  importedB2bServicesSgd?: number;
  effectiveRate?: number;
}
export interface GstFilingResult {
  effectiveRate: number;
  standardRatedSuppliesSgd: number;
  outputTaxStandardSgd: number;
  importedB2bServicesSgd: number;
  reverseChargeOutputTaxSgd: number;
  totalOutputTaxSgd: number;
  taxablePurchasesSgd: number;
  totalInputTaxClaimedSgd: number;
  netGstPayableSgd: number;
  position: 'NET_PAYABLE_TO_IRAS' | 'NET_REFUND_FROM_IRAS';
}
export function calculateGstFiling(input: GstFilingInput): GstFilingResult;

// --- WHT ---
export type PaymentType =
  | 'INTEREST'
  | 'ROYALTY'
  | 'TECHNICAL_OR_MANAGEMENT_FEE'
  | 'DIRECTORS_FEE'
  | 'RENT_MOVABLE_PROPERTY';
export const VALID_PAYMENT_TYPES: PaymentType[];

export interface WhtCalculationInput {
  paymentType: PaymentType | string;
  grossAmountSgd: number;
  isGrossUp?: boolean;
  customTreatyRate?: number;
}
export interface WhtCalculationResult {
  paymentType: string;
  statutoryDomesticRate: number;
  appliedRate: number;
  isTreatyRateApplied: boolean;
  isGrossUpAbsorption: boolean;
  nominalAmountSgd: number;
  recalculatedGrossAmountSgd: number;
  withholdingTaxPayableToIrasSgd: number;
  netRemittanceToNonResidentSgd: number;
  irasFormType: string;
  duePaymentDeadline: string;
}
export function calculateSingaporeWht(input: WhtCalculationInput): WhtCalculationResult;

// --- Tax Residency & Certificate of Residence (CoR) ---
export interface TaxResidencyInput {
  companyName: string;
  uen?: string;
  totalBodMeetings: number;
  bodMeetingsInSingapore?: number;
  strategicDecisionsInSingapore?: boolean;
  hasLocalResidentDirector?: boolean;
  hasPhysicalOfficeInSingapore?: boolean;
  localEmployeesCount?: number;
  isForeignControlled?: boolean;
  hasBonaFideCommercialReason?: boolean;
  targetTreatyPartnerJurisdiction?: string;
}
export interface TaxResidencyResult {
  companyName: string;
  uen: string;
  targetTreatyPartnerJurisdiction: string;
  assessment: {
    isSingaporeTaxResident: boolean;
    qualifiesForCertificateOfResidence: boolean;
    centralManagementAndControlLocus: string;
    substanceScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  metrics: {
    totalBodMeetings: number;
    bodMeetingsInSingapore: number;
    bodSingaporePercentage: number;
    meetsBodRatioThreshold: boolean;
    strategicDecisionsInSingapore: boolean;
    hasLocalResidentDirector: boolean;
    hasPhysicalOfficeInSingapore: boolean;
    localEmployeesCount: number;
    isForeignControlled: boolean;
    passesForeignControlledSubstanceTest: boolean;
  };
  statutoryBasis: {
    governingStatute: string;
    regulatoryAuthority: string;
    guidelineReference: string;
    coreRule: string;
  };
}
export function evaluateTaxResidency(input: TaxResidencyInput): TaxResidencyResult;

// --- CPF ---
export type ResidentialStatus = 'CITIZEN' | 'SPR_YEAR_3_ONWARDS' | 'SPR_YEAR_2' | 'SPR_YEAR_1';
export const RESIDENTIAL_STATUSES: ResidentialStatus[];

export interface CpfCalculationInput {
  ordinaryWage: number;
  additionalWage?: number;
  age: number;
  residentialStatus?: ResidentialStatus | string;
  calendarYear?: number | string;
  ytdOrdinaryWages?: number;
  communityFund?: 'CDAC' | 'MBMF' | 'SINDA' | 'EA' | 'NONE' | 'AUTO' | string;
}
export interface CpfCalculationResult {
  calendarYear: string;
  residentialStatus: string;
  employeeAge: number;
  totalGrossWageSgd: number;
  ordinaryWageBreakdown: {
    actualOwSgd: number;
    owCeilingSgd: number;
    owSubjectToCpfSgd: number;
  };
  additionalWageBreakdown: {
    actualAwSgd: number;
    annualAwCeilingBaseSgd: number;
    ytdOrdinaryWagesSubjectToCpfSgd: number;
    awCeilingRemainingSgd: number;
    awSubjectToCpfSgd: number;
  };
  totalWageSubjectToCpfSgd: number;
  contributionRates: {
    employeeRatePercent: number;
    employerRatePercent: number;
    totalRatePercent: number;
  };
  contributions: {
    employeeCpfSgd: number;
    employerCpfSgd: number;
    totalCpfSgd: number;
  };
  leviesAndFunds: {
    skillsDevelopmentLevySgd: number;
    selfHelpGroupType: string;
    selfHelpGroupDeductionSgd: number;
  };
  netTakeHomePaySgd: number;
  totalEmployerCostSgd: number;
}
export function calculateSingaporeCpf(input: CpfCalculationInput): CpfCalculationResult;

// --- MOM Overtime ---
export type EmployeeCategory = 'WORKMAN' | 'NON_WORKMAN' | 'MANAGER_OR_EXECUTIVE';
export const EMPLOYEE_CATEGORIES: EmployeeCategory[];

export interface MomOvertimeInput {
  employeeCategory: EmployeeCategory | string;
  monthlyBasicSalarySgd: number;
  overtimeHours: number;
  dailyMaxHoursWorked?: number;
  yearsOfService?: number;
}
export interface MomOvertimeResult {
  employeeCategory: string;
  monthlyBasicSalarySgd: number;
  isCoveredUnderPartIV: boolean;
  coverageStatusReason: string;
  overtimeCalculation: {
    cappedSalaryUsedForCalculationSgd: number;
    basicHourlyRateSgd: number;
    statutoryOvertimeRateMultiplier: number;
    overtimeHourlyRateSgd: number;
    overtimeHoursWorked: number;
    totalOvertimePayPayableSgd: number;
  };
  statutoryComplianceAudit: {
    monthlyOvertimeHours: number;
    monthlyStatutoryLimitHours: number;
    exceedsMonthlyOtCap: boolean;
    peakDailyHoursReported: number;
    dailyStatutoryLimitHours: number;
    exceedsDailyWorkCap: boolean;
    isFullyCompliant: boolean;
  };
  entitlements: {
    completedYearsOfService: number;
    statutoryAnnualLeaveDays: number;
  };
}
export function calculateMomOvertimeAndCompliance(input: MomOvertimeInput): MomOvertimeResult;

// --- COMPASS ---
export type SectorType = 'NON_FINANCIAL_SERVICES' | 'FINANCIAL_SERVICES';
export type QualificationLevel = 'TOP_TIER' | 'DEGREE_EQUIVALENT' | 'NO_DEGREE';
export const SECTOR_TYPES: SectorType[];
export const QUALIFICATION_LEVELS: QualificationLevel[];

export interface CompassInput {
  monthlySalarySgd: number;
  candidateAge: number;
  sector?: SectorType | string;
  isIntraCorporateTransferee?: boolean;
  salaryPercentileRank?: 'P90_AND_ABOVE' | 'P65_TO_P89' | 'BELOW_P65' | string;
  qualificationLevel?: QualificationLevel | string;
  firmPmetCount?: number;
  candidateNationalityPmetPercentage?: number;
  firmLocalSharePercentile?: 'ABOVE_P50' | 'BETWEEN_P20_AND_P50' | 'BELOW_P20' | string;
  isOnShortageOccupationList?: boolean;
  hasStrategicEconomicPriority?: boolean;
}
export interface CompassResult {
  isExemptFromCompass: boolean;
  exemptionReason?: string;
  sector?: string;
  candidateAge?: number;
  proposedSalarySgd?: number;
  statutoryMinimumQualifyingSalarySgd?: number;
  meetsMinimumQualifyingSalary: boolean;
  criteriaBreakdown?: {
    c1SalaryPoints: number;
    c2QualificationPoints: number;
    c3DiversityPoints: number;
    c4LocalSupportPoints: number;
    c5SkillsShortageBonusPoints: number;
    c6StrategicBonusPoints: number;
  };
  totalCompassScore: number;
  compassPassThreshold: number;
  isPassMarkMet: boolean;
  isSmallFirmExemptionApplied?: boolean;
  eligibilityVerdict: string;
}
export function evaluateCompassEpEligibility(input: CompassInput): CompassResult;
export function getMinimumQualifyingSalary(age: number, sector?: string): number;

// --- Foreign Workforce Quota ---
export type WorkforceSector = 'SERVICES' | 'MANUFACTURING' | 'CONSTRUCTION';
export const SUPPORTED_SECTORS: WorkforceSector[];

export interface QuotaInput {
  sector: WorkforceSector | string;
  localHeadcount?: number;
  localEmployees?: Array<{ monthlySalarySgd: number }>;
  currentSPassCount?: number;
  currentWorkPermitCount?: number;
}
export interface QuotaResult {
  sector: string;
  localWorkforceHeadcount: number;
  dependencyRatioCeilingPercent: number;
  sPassSubDrcPercent: number;
  statutoryMaxAllowable: {
    maxTotalForeignWorkers: number;
    maxSPassHolders: number;
  };
  currentEmployed: {
    currentSPassCount: number;
    currentWorkPermitCount: number;
    currentTotalForeignWorkers: number;
  };
  quotaHeadroom: {
    totalForeignHeadroom: number;
    sPassHeadroom: number;
  };
  complianceAudit: {
    isWithinTotalDrcQuota: boolean;
    isWithinSPassQuota: boolean;
    isFullyCompliant: boolean;
    statusMessage: string;
  };
  estimatedMonthlyLevySgd: {
    sPassLevySgd: number;
    workPermitLevySgd: number;
    totalForeignWorkerLevySgd: number;
  };
}
export function calculateForeignWorkforceQuota(input: QuotaInput): QuotaResult;
export function calculateLocalHeadcount(localEmployees?: Array<{ monthlySalarySgd: number }>): number;

// --- ACRA Deadlines ---
export interface AcraDeadlineInput {
  financialYearEndDate: string;
  isListedCompany?: boolean;
  currentDate?: string;
  isAgmDispensed?: boolean;
  hasResidentDirector?: boolean;
  isSoleDirectorSecretary?: boolean;
}
export interface AcraDeadlineResult {
  companyType: string;
  financialYearEndDate: string;
  statutoryFilingTimeline: {
    agmDeadlineDate: string;
    arFilingDeadlineDate: string;
    agmIntervalMonthsAfterFye: number;
    arIntervalMonthsAfterFye: number;
  };
  filingStatusAudit: {
    referenceDate: string;
    isAnnualReturnOverdue: boolean;
    daysOverdue: number;
    penaltyTier: string;
    statutoryLatePenaltySgd: number;
  };
  governanceAudit: {
    hasResidentDirector: boolean;
    isSoleDirectorAlsoSecretary: boolean;
    isGovernanceCompliant: boolean;
    violations: string[];
  };
}
export function calculateAcraStatutoryDeadlines(input: AcraDeadlineInput): AcraDeadlineResult;
export function addMonthsToDate(dateStr: string, monthsToAdd: number): string;

// --- Small Company Audit Exemption ---
export interface YearFinancials {
  annualRevenueSgd: number;
  totalAssetsSgd: number;
  fullTimeEmployees: number;
}
export interface AuditExemptionInput {
  isPrivateCompany?: boolean;
  isNewlyIncorporated?: boolean;
  currentYearFinancials: YearFinancials;
  priorYearFinancials?: YearFinancials;
  isPartOfCorporateGroup?: boolean;
  groupCurrentYearFinancials?: YearFinancials;
  groupPriorYearFinancials?: YearFinancials;
}
export interface AuditExemptionResult {
  isPrivateCompany: boolean;
  isNewlyIncorporated: boolean;
  isPartOfCorporateGroup: boolean;
  statutoryThresholds: {
    maxAnnualRevenueSgd: number;
    maxTotalAssetsSgd: number;
    maxFullTimeEmployees: number;
    conditionsRequiredCount: number;
  };
  standaloneEvaluation: {
    currentYear: unknown;
    priorYear: unknown;
    isStandaloneQualified: boolean;
  };
  groupEvaluation?: unknown;
  isExemptFromAudit: boolean;
  auditRequirementStatus: string;
  verdictCode: string;
}
export function evaluateSmallCompanyAuditExemption(input: AuditExemptionInput): AuditExemptionResult;

// --- PDPA Breach ---
export const SIGNIFICANT_HARM_PRESCRIBED: string[];
export interface PdpaBreachInput {
  affectedIndividualsCount: number;
  compromisedDataCategories?: string[];
  isDataEncryptedRobustly?: boolean;
  remedialActionEliminatedHarm?: boolean;
  annualSingaporeTurnoverSgd?: number;
  assessmentCompletedTimestamp?: string;
}
export interface PdpaBreachResult {
  affectedIndividualsCount: number;
  compromisedDataCategories: string[];
  detectedSignificantHarmCategories: string[];
  assessmentResults: {
    isSignificantScaleBreach: boolean;
    hasSignificantHarmData: boolean;
    isDataEncryptedRobustly: boolean;
    remedialActionEliminatedHarm: boolean;
  };
  statutoryNotificationRequirements: {
    isMandatoryToNotifyPdpc: boolean;
    pdpcNotificationDeadlineHours: number;
    pdpcDeadlineTimestamp: string;
    isMandatoryToNotifyIndividuals: boolean;
    individualNotificationExemptionReason: string;
  };
  statutoryPenaltyExposure: {
    annualSingaporeTurnoverSgd: number;
    penaltyFrameworkTier: string;
    maximumStatutoryFinancialPenaltySgd: number;
  };
  complianceVerdict: string;
}
export function evaluatePdpaBreachNotification(input: PdpaBreachInput): PdpaBreachResult;

// --- SORA WACC ---
export interface WaccInput {
  marketValueOfEquitySgd: number;
  marketValueOfDebtSgd?: number;
  riskFreeRate?: number;
  equityBeta?: number;
  equityRiskPremium?: number;
  soraBaseRate?: number;
  debtCreditSpread?: number;
  citTaxRate?: number;
}
export interface WaccResult {
  capitalStructure: {
    marketValueOfEquitySgd: number;
    marketValueOfDebtSgd: number;
    totalFirmValueSgd: number;
    equityWeightPercent: number;
    debtWeightPercent: number;
  };
  costOfEquityModel: {
    framework: string;
    riskFreeRatePercent: number;
    equityBeta: number;
    equityRiskPremiumPercent: number;
    costOfEquityKePercent: number;
  };
  costOfDebtModel: {
    soraBenchmarkRatePercent: number;
    creditSpreadPercent: number;
    preTaxCostOfDebtKdPercent: number;
    singaporeCitTaxShieldPercent: number;
    afterTaxCostOfDebtPercent: number;
  };
  waccResult: {
    weightedAverageCostOfCapitalPercent: number;
    waccDecimal: number;
  };
}
export function calculateSingaporeWacc(input: WaccInput): WaccResult;

// --- Working Capital ---
export interface WorkingCapitalInput {
  currentAssetsSgd: number;
  currentLiabilitiesSgd: number;
  cashAndEquivalentsSgd?: number;
  tradeReceivablesSgd?: number;
  inventorySgd?: number;
  tradePayablesSgd?: number;
  annualRevenueSgd: number;
  annualCogsSgd: number;
}
export interface WorkingCapitalResult {
  liquidityMetrics: {
    currentAssetsSgd: number;
    currentLiabilitiesSgd: number;
    netWorkingCapitalSgd: number;
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
    isSolventShortTerm: boolean;
  };
  cashConversionCycle: {
    daysSalesOutstandingDso: number;
    daysInventoryOutstandingDio: number;
    daysPayableOutstandingDpo: number;
    operatingCycleDays: number;
    cashConversionCycleDays: number;
  };
  capitalRequirements: {
    dailyOperatingCostSgd: number;
    workingCapitalRequiredForCccSgd: number;
    workingCapitalSurplusOrDeficitSgd: number;
    position: 'WORKING_CAPITAL_SURPLUS' | 'WORKING_CAPITAL_DEFICIT';
  };
}
export function calculateSingaporeWorkingCapital(input: WorkingCapitalInput): WorkingCapitalResult;

// --- Enterprise Grant ---
export type GrantScheme = 'EDG' | 'PSG' | 'MRA';
export const SUPPORTED_GRANTS: GrantScheme[];

export interface EnterpriseGrantInput {
  grantScheme: GrantScheme | string;
  qualifyingProjectCostSgd: number;
  localShareholdingPercentage: number;
  isRegisteredInSingapore?: boolean;
  groupAnnualTurnoverSgd?: number;
  groupEmployeeCount?: number;
  isSustainabilityOrDeepTech?: boolean;
  mraCumulativeClaimedSgd?: number;
}
export interface EnterpriseGrantResult {
  grantScheme: string;
  qualifyingProjectCostSgd: number;
  isEligibleForGrant: boolean;
  disqualificationReasons?: string[];
  eligibilityAudit?: {
    isRegisteredInSingapore: boolean;
    localShareholdingPercent: number;
    isLocalShareholdingSatisfied: boolean;
    isSmeQualified: boolean;
  };
  fundingCalculation?: {
    statutorySupportRatePercent: number;
    schemeMaximumCapSgd: number | string;
    cumulativePriorClaimedSgd: number;
    availableCapHeadroomSgd: number | string;
    approvedGrantFundingSgd: number;
    companyCoPaymentShareSgd: number;
    effectiveSubsidyPercent: number;
  };
}
export function evaluateEnterpriseGrant(input: EnterpriseGrantInput): EnterpriseGrantResult;

// --- Corporate Structuring & Holding Governance ---
export interface CorporateStructuringInput {
  dividendAmountSgd: number;
  equityShareholdingPercent?: number;
  shareHoldingDurationMonths?: number;
  sourceJurisdictionHeadlineCitRate?: number;
  subjectToTaxInSource?: boolean;
  isBonaFideResident?: boolean;
  annualMaintenanceCostSgd?: number;
}
export interface CorporateStructuringResult {
  dividendGrossAmount: number;
  equityShareholdingPercentage: number;
  holdingPeriodMonths: number;
  singaporeHoldingAssessment: {
    qualifiesForSection138Fsie: boolean;
    singaporeCorporateTaxRate: number;
    singaporeCorporateTaxPayable: number;
    singaporeOutboundDividendWhtRate: number;
    singaporeOutboundDividendWhtPayable: number;
    netDividendRepatriated: number;
    annualHoldingMaintenanceCost: number;
    netCashDeliverable: number;
    effectiveSingaporeTaxRate: number;
  };
  capitalGainsSection13W: {
    qualifiesForSection13WSafeHarbour: boolean;
    meetsShareholdingThreshold: boolean;
    meetsHoldingPeriodThreshold: boolean;
    capitalGainsTaxRateInSingapore: number;
    statutoryExemptionStatus: string;
  };
  statutoryBasis: {
    fsieStatute: string;
    capitalGainsStatute: string;
    singleTierStatute: string;
    governingAuthority: string;
  };
}
export function evaluateCorporateStructuring(input: CorporateStructuringInput): CorporateStructuringResult;

// --- Security Sanitizer ---
export function sanitizeUntrustedPayload(untrustedText: string): string;
export function wrapUntrustedPayload(documentContent: string, customInstruction?: string): string;
export interface IsolatedPayloadResult {
  rawPrompt: string;
  isolatedPayload: string;
  sanitizedPayload: string;
  isProtected: boolean;
}
export function extractIsolatedPayload(isolatedPromptText: string): IsolatedPayloadResult;

// --- Enterprise Innovation Scheme (EIS) ---
export interface EisActivityInput {
  activityKey: string;
  expenditureSgd: number;
}
export interface EisInput {
  activities?: EisActivityInput[];
  rdExpenditureSgd?: number;
  ipRegistrationExpenditureSgd?: number;
  ipAcquisitionExpenditureSgd?: number;
  trainingExpenditureSgd?: number;
  polyExpenditureSgd?: number;
  optForCashPayout?: boolean;
}
export interface EisResult {
  activitiesBreakdown: unknown[];
  totalQualifyingExpenditureSgd: number;
  totalTaxDeductionSgd: number;
  estimatedTaxSavingsSgd: number;
  cashConversionOption?: unknown;
  statutoryBasis: unknown;
}
export function calculateEnterpriseInnovationScheme(input?: EisInput): EisResult;

// --- Loss Carry-Forward & Carry-Back Relief ---
export interface LossUtilizationInput {
  currentYearTradeLossesSgd?: number;
  currentYearCapitalAllowancesSgd?: number;
  priorYearAssessableIncomeSgd?: number;
  optForCarryBack?: boolean;
  currentYearChargeableProfitSgd?: number;
  unabsorbedLossesBroughtForwardSgd?: number;
  meetsShareholdingContinuityTest?: boolean;
  meetsSameBusinessTest?: boolean;
}
export interface LossUtilizationResult {
  carryBackRelief: unknown;
  carryForwardRelief: unknown;
  compliance: unknown;
}
export function evaluateLossUtilization(input?: LossUtilizationInput): LossUtilizationResult;

// --- Group Relief Loss Transfer ---
export interface GroupReliefMemberInput {
  uen?: string;
  companyName: string;
  currentYearTradeLossesSgd?: number;
  currentYearCapitalAllowancesSgd?: number;
  currentYearDonationsSgd?: number;
  assessableIncomeBeforeReliefSgd?: number;
}
export interface GroupReliefInput {
  transferor: GroupReliefMemberInput;
  transferee: GroupReliefMemberInput;
  shareholdingPercentage: number;
  isSameFinancialYearEnd?: boolean;
  isSingaporeIncorporatedGroup?: boolean;
}
export interface GroupReliefResult {
  isEligible: boolean;
  transferSummary: unknown;
  transferredBreakdown: unknown;
}
export function evaluateGroupReliefTransfer(input: GroupReliefInput): GroupReliefResult;

// --- Foreign Tax Credit (FTC) & Pooling ---
export interface ForeignIncomeItem {
  countryCode: string;
  incomeType: string;
  grossForeignIncomeSgd: number;
  foreignTaxPaidSgd: number;
  headlineForeignCitRatePercent: number;
  singaporeAllocatedExpensesSgd?: number;
}
export interface ForeignTaxCreditInput {
  foreignIncomes: ForeignIncomeItem[];
  usePooling?: boolean;
  singaporeCitRate?: number;
}
export interface ForeignTaxCreditResult {
  summary: unknown;
  poolingDetails?: unknown;
  itemized: unknown[];
}
export function calculateForeignTaxCredit(input: ForeignTaxCreditInput): ForeignTaxCreditResult;

// --- Family Office & Fund Tax Exemption (13O/13U) ---
export interface FamilyOfficeInput {
  scheme: '13O' | '13U' | string;
  assetsUnderManagementSgd: number;
  numberOfInvestmentProfessionals: number;
  hasIndependentInvestmentProfessional?: boolean;
  annualLocalBusinessSpendingSgd?: number;
  localInvestmentsSgd?: number;
}
export interface FamilyOfficeResult {
  scheme: string;
  isCompliant: boolean;
  breaches: string[];
  metrics: unknown;
  statutorySummary: unknown;
}
export function evaluateFamilyOfficeExemption(input: FamilyOfficeInput): FamilyOfficeResult;

// --- BEPS 2.0 Pillar Two Domestic Top-up Tax (DTT) ---
export interface PillarTwoInput {
  globalConsolidatedRevenueSgd: number;
  singaporeGlobeIncomeSgd: number;
  singaporeCoveredTaxesSgd: number;
  eligiblePayrollCostsSgd?: number;
  eligibleTangibleAssetsSgd?: number;
  transitionYear?: number;
}
export interface PillarTwoResult {
  isInScope: boolean;
  effectiveTaxRatePercent: number;
  topUpTaxRatePercent: number;
  financials: unknown;
  substanceExclusion: unknown;
  domesticTopUpTaxPayableSgd: number;
}
export function calculateDomesticTopUpTax(input: PillarTwoInput): PillarTwoResult;

// --- Property Stamp Duty (BSD & ABSD) ---
export interface StampDutyInput {
  propertyValue: number;
  propertyType?: 'RESIDENTIAL' | 'NON_RESIDENTIAL' | string;
  buyerProfile?: 'SC' | 'SPR' | 'FOREIGNER' | 'ENTITY_OR_TRUST' | string;
  propertyCountOwned?: number;
}
export interface StampDutyResult {
  propertyValueSgd: number;
  propertyType: string;
  buyerProfile: string;
  propertyCountOwned: number;
  bsd: unknown;
  absd: unknown;
  totalStampDutyPayableSgd: number;
}
export function calculatePropertyStampDuty(input: StampDutyInput): StampDutyResult;

// --- Tax Audit & Reconciliation Risk ---
export interface TaxAuditRiskInput {
  revenueCitSgd: number;
  revenueGstAnnualSgd: number;
  grossProfitMarginPercent: number;
  industryBenchmarkGpmPercent?: number;
  directorRemunerationSgd?: number;
  directorLoanBalanceSgd?: number;
  crossBorderExpenseSgd?: number;
  crossBorderWhtRemittedSgd?: number;
}
export interface TaxAuditRiskResult {
  riskScore: number;
  riskTier: string;
  riskFlags: string[];
  auditRecommendation: string;
  componentScores: unknown;
}
export function assessTaxAuditRisk(input: TaxAuditRiskInput): TaxAuditRiskResult;

// --- Transfer Pricing & Arm's Length Compliance ---
export interface RelatedPartyTransactionInput {
  transactionType: 'PURCHASE_SALE_GOODS' | 'LOANS' | 'SERVICES' | 'ROYALTIES' | string;
  amountSgd: number;
}
export interface TransferPricingInput {
  annualGrossRevenueSgd: number;
  priorYearRequiredTpd?: boolean;
  relatedPartyTransactions?: RelatedPartyTransactionInput[];
  testedPartyOperatingMarginPercent?: number;
  interquartileRange?: { p25: number; median: number; p75: number };
  baseAmountForAdjustmentSgd?: number;
}
export interface TransferPricingResult {
  isMandatoryTpdByRevenue: boolean;
  hasRptExceedingThreshold: boolean;
  rptBreakdown: unknown[];
  armsLengthEvaluation?: unknown;
}
export function evaluateTransferPricingCompliance(input: TransferPricingInput): TransferPricingResult;

// --- Capital Allowances Plant & Machinery ---
export interface AssetForAllowanceInput {
  description: string;
  costSgd: number;
  claimMethod: 'S19A_3_YEAR' | 'S19A_1_YEAR' | 'LOW_VALUE_POOL' | 'S19_STANDARD' | string;
  taxYearAcquired?: number;
  disposalProceedsSgd?: number;
  taxWrittenDownValueSgd?: number;
}
export interface CapitalAllowanceInput {
  assets: AssetForAllowanceInput[];
  yearOfAssessment?: number;
}
export interface CapitalAllowanceResult {
  summary: unknown;
  itemizedClaims: unknown[];
}
export function calculateCapitalAllowances(input: CapitalAllowanceInput): CapitalAllowanceResult;

// --- Annual Leave Entitlement ---
export interface AnnualLeaveInput {
  completedYearsOfService: number;
  completedMonthsInCurrentYear: number;
  annualLeaveTakenDays?: number;
  contractualAnnualLeaveDays?: number;
  monthlyBasicSalarySgd?: number;
  isPartIvCovered?: boolean;
}
export interface AnnualLeaveResult {
  completedYearsOfService: number;
  effectiveAnnualEntitlementDays: number;
  proratedCalculation: unknown;
  encashment?: unknown;
}
export function calculateAnnualLeaveEntitlement(input: AnnualLeaveInput): AnnualLeaveResult;

// --- Sick & Hospitalisation Leave ---
export interface SickLeaveInput {
  monthsOfService: number;
  outpatientSickLeaveTakenDays?: number;
  hospitalisationLeaveTakenDays?: number;
  hasCertifiedMedicalCertificate?: boolean;
}
export interface SickLeaveResult {
  monthsOfService: number;
  isEligibleForPaidSickLeave: boolean;
  entitlements: unknown;
  usage: unknown;
  balances: unknown;
}
export function calculateSickLeaveEntitlement(input: SickLeaveInput): SickLeaveResult;

// --- Retrenchment Benefit & MOM Notification ---
export interface RetrenchmentBenefitInput {
  monthlySalarySgd: number;
  yearsOfService: number;
  weeksPerYearOfService?: number;
  companySizeEmployees?: number;
  employeesRetrenchedPast6Months?: number;
  daysSinceRetrenchmentNotification?: number;
}
export interface RetrenchmentBenefitResult {
  employeeBenefit: unknown;
  momNotification: unknown;
}
export function calculateRetrenchmentBenefit(input: RetrenchmentBenefitInput): RetrenchmentBenefitResult;

// --- Parental Leave Schemes (GPML & GPPL) ---
export interface ParentalLeaveInput {
  leaveType: 'MATERNITY' | 'PATERNITY' | string;
  monthlyGrossSalarySgd: number;
  childOrderNumber?: number;
  monthsOfService: number;
  isChildSingaporeCitizen?: boolean;
  isLawfullyMarried?: boolean;
}
export interface ParentalLeaveResult {
  leaveType: string;
  isCdcaQualifying: boolean;
  leaveDuration: unknown;
  financialBreakdown: unknown;
}
export function calculateParentalLeave(input: ParentalLeaveInput): ParentalLeaveResult;

// --- Workplace Fairness & Anti-Discrimination ---
export interface WorkplaceFairnessInput {
  textToAudit: string;
  hasGenuineOccupationalRequirement?: boolean;
  gorJustification?: string;
  hasInternalGrievanceMechanism?: boolean;
}
export interface WorkplaceFairnessResult {
  complianceScore: number;
  riskTier: string;
  violations: unknown[];
  tafepStatutoryGuidance: string[];
}
export function auditWorkplaceFairness(input: WorkplaceFairnessInput): WorkplaceFairnessResult;

// --- Progressive Wage Model & Local Qualifying Salary ---
export interface ProgressiveWageInput {
  monthlyGrossSalarySgd: number;
  pwmSectorKey?: string;
  isLocalEmployee?: boolean;
}
export interface ProgressiveWageResult {
  monthlyGrossSalarySgd: number;
  isLocalEmployee: boolean;
  lqsEvaluation: unknown;
  pwmEvaluation?: unknown;
}
export function evaluateProgressiveWageCompliance(input: ProgressiveWageInput): ProgressiveWageResult;

// --- Key Employment Terms (KETs) ---
export interface KeyEmploymentTermsInput {
  includedItemFlags?: Record<string, boolean>;
  daysSinceEmploymentCommenced?: number;
  isWrittenFormat?: boolean;
}
export interface KeyEmploymentTermsResult {
  complianceScore: number;
  isFullyCompliant: boolean;
  timingAudit: unknown;
  missingMandatoryItems: string[];
  enforcementExposure: unknown;
}
export function auditKeyEmploymentTerms(input?: KeyEmploymentTermsInput): KeyEmploymentTermsResult;

// --- Itemised Payslip ---
export interface ItemisedPayslipInput {
  includedFields?: Record<string, boolean>;
  employeeWorkedOvertime?: boolean;
  daysAfterSalaryPaymentDelivered?: number;
  maintainsRecordsForTwoYears?: boolean;
}
export interface ItemisedPayslipResult {
  complianceScore: number;
  isFullyCompliant: boolean;
  timingAudit: unknown;
  missingMandatoryFields: string[];
  enforcementExposure: unknown;
}
export function auditItemisedPayslip(input?: ItemisedPayslipInput): ItemisedPayslipResult;

// --- Public Holiday Pay & In-Lieu ---
export interface PublicHolidayCompensationInput {
  monthlyBasicSalarySgd: number;
  workingDaysPerWeek?: number;
  publicHolidaysWorkedCount?: number;
  compensationMode?: 'EXTRA_DAYS_PAY' | 'DAY_OFF_IN_LIEU' | string;
  isPartIvCovered?: boolean;
}
export interface PublicHolidayCompensationResult {
  monthlyBasicSalarySgd: number;
  calculations: unknown;
  statutoryAdvice: string[];
}
export function calculatePublicHolidayCompensation(input: PublicHolidayCompensationInput): PublicHolidayCompensationResult;

// --- Employment Contract & Restrictive Covenants ---
export interface EmploymentContractInput {
  contractualEmployerNoticeWeeks: number;
  contractualEmployeeNoticeWeeks: number;
  yearsOfService: number;
  probationDurationMonths?: number;
  nonCompeteClause?: {
    durationMonths?: number;
    geographicalScope?: string;
    protectsLegitimateInterest?: boolean;
  };
}
export interface EmploymentContractResult {
  complianceScore: number;
  isFullyCompliant: boolean;
  noticePeriodAudit: unknown;
  nonCompeteAudit?: unknown;
}
export function auditEmploymentContract(input: EmploymentContractInput): EmploymentContractResult;

// --- Commercial Contract Risk Review (SIAC & Common Law) ---
export interface ContractRiskInput {
  governingLawCountry?: 'SINGAPORE' | 'FOREIGN' | 'SILENT' | string;
  disputeForum?: 'SIAC' | 'SINGAPORE_COURTS' | 'FOREIGN_COURTS' | 'FOREIGN_ARBITRATION' | 'SILENT' | string;
  contractValueSgd: number;
  liabilityCapSgd?: number;
  hasUnlimitedIndemnity?: boolean;
  excludesConsequentialLoss?: boolean;
  hasUnilateralTerminationForConvenience?: boolean;
  terminationNoticeDays?: number;
}
export interface ContractRiskResult {
  contractValueSgd: number;
  riskScore: number;
  riskTier: string;
  isAcceptableWithoutRedline: boolean;
  clauseEvaluations: unknown;
  highRiskFlags: unknown[];
  redlineRecommendations: string[];
  singaporeLawSuitability: unknown;
}
export function evaluateContractRisk(input: ContractRiskInput): ContractRiskResult;

// --- Corporate Secretarial & RORC (ACRA S.171 & S.386AF) ---
export interface CorporateSecretarialInput {
  companyType?: 'PRIVATE' | 'PUBLIC' | string;
  monthsSinceIncorporation?: number;
  secretaryProfile?: {
    isAppointed?: boolean;
    isOrdinarilyResidentInSingapore?: boolean;
    isAlsoSoleDirector?: boolean;
    professionalQualification?: string;
  };
  rorcCompliance?: {
    isRorcMaintained?: boolean;
    daysSinceControllerInfoChange?: number;
    isLodgedWithAcraCentralRegister?: boolean;
  };
}
export interface CorporateSecretarialResult {
  companyType: string;
  complianceScore: number;
  complianceTier: string;
  isFullyCompliant: boolean;
  breaches: unknown[];
  remedialActions: string[];
  rorcStatus: unknown;
  secretaryAudit: unknown;
  statutoryReferences: unknown;
}
export function auditCorporateSecretarial(input: CorporateSecretarialInput): CorporateSecretarialResult;

// --- IPOS Trademark Eligibility & Classifications ---
export interface TrademarkEligibilityInput {
  markName: string;
  niceClasses: number[];
  usesPreApprovedSpecification?: boolean;
  isInventedWord?: boolean;
  hasPriorIdenticalMarkInSameClass?: boolean;
  hasVisualPhoneticSimilarity?: boolean;
}
export interface TrademarkEligibilityResult {
  markName: string;
  registrabilityScore: number;
  outcomeVerdict: string;
  niceClassificationAudit: unknown;
  statutoryFilingFees: {
    feePerClassSgd: number;
    specificationType: string;
    totalFeesPayableSgd: number;
    validityPeriodYears: number;
  };
  refusalRisksDetected: unknown[];
  legalAdvice: string;
}
export interface IposFilingFeesInput {
  classes?: number | number[];
  niceClasses?: number[];
  usesPreApprovedSpecification?: boolean;
}
export interface IposFilingFeesResult {
  classCount: number;
  feePerClassSgd: number;
  specificationType: string;
  totalFeesPayableSgd: number;
  validityPeriodYears: number;
}
export function evaluateTrademarkRegistrability(input: TrademarkEligibilityInput): TrademarkEligibilityResult;
export function calculateIposFilingFees(input: IposFilingFeesInput): IposFilingFeesResult;

// --- ACRA Striking-Off Readiness (Section 344A) ---
export interface StrikingOffInput {
  hasCommencedBusiness?: boolean;
  hasCeasedTrading?: boolean;
  hasOutstandingIrasTaxMatters?: boolean;
  hasActiveBankAccounts?: boolean;
  hasOutstandingDebtsToGovernmentOrThirdParties?: boolean;
  hasOngoingLitigation?: boolean;
  hasMajorityShareholderApproval?: boolean;
  isSubjectToInsolvencyProceedings?: boolean;
}
export interface StrikingOffResult {
  isEligibleToApply: boolean;
  readinessStatus: string;
  checklistStatus: unknown;
  totalOutstandingBlockers: number;
  outstandingBlockersList: unknown[];
  gazetteTimelineEstimation: unknown;
  statutoryAdvice: string;
}
export function evaluateStrikingOffReadiness(input: StrikingOffInput): StrikingOffResult;

// --- Director Duties & Disqualification (Companies Act S.145/148/149) ---
export interface DirectorEligibilityInput {
  directorName?: string;
  age: number;
  residentialStatus: 'SC' | 'SPR' | 'EP' | 'ENTREPASS' | 'FOREIGN_NON_RESIDENT' | string;
  isUndischargedBankrupt?: boolean;
  hasFraudOrDishonestyConviction?: boolean;
  convictionSentenceEndDate?: string;
  unfitDirectorDisqualificationEndDate?: string;
  isAlsoSoleDirector?: boolean;
  isAlsoSoleCompanySecretary?: boolean;
  hasDisclosedConflictOfInterest?: boolean;
}
export interface DirectorEligibilityResult {
  directorName: string;
  isLegallyEligible: boolean;
  complianceScore: number;
  status: string;
  profileAudit: unknown;
  totalDisqualifications: number;
  disqualificationsList: unknown[];
  governanceRisksList: string[];
  statutoryAdvice: string;
}
export function evaluateDirectorEligibility(input: DirectorEligibilityInput): DirectorEligibilityResult;

// --- TADM & Employment Claims Tribunal Dispute Resolution ---
export interface TadmDisputeInput {
  claimType: 'SALARY_ARREARS' | 'SALARY_IN_LIEU_OF_NOTICE' | 'WRONGFUL_DISMISSAL' | 'MATERNITY_BENEFIT' | 'RETRENCHMENT_BENEFIT' | 'UNAUTHORIZED_DEDUCTIONS' | string;
  claimAmountSgd: number;
  isUnionMember?: boolean;
  monthsSinceDisputeEvent?: number;
  wasEmploymentTerminated?: boolean;
}
export interface TadmDisputeResult {
  claimType: string;
  claimAmountSgd: number;
  isEligibleForTadmMediation: boolean;
  disputeForum: string;
  statutoryLimitCheck: unknown;
  tadmFilingFeeEstimateSgd: number;
  jurisdictionRules: unknown;
  statutoryAdvice: string;
}
export interface TadmFeeInput {
  claimAmountSgd: number;
}
export interface TadmFeeResult {
  claimAmountSgd: number;
  applicableFeeSgd: number;
  statutoryBasis: string;
}
export function evaluateTadmDispute(input: TadmDisputeInput): TadmDisputeResult;
export function calculateTadmRegistrationFee(input: TadmFeeInput): TadmFeeResult;

// --- SFRS Accounting Framework & SFRS 115 Revenue Allocation ---
export interface SfrsFrameworkInput {
  annualRevenueSgd: number;
  totalAssetsSgd: number;
  employeeHeadcount: number;
  isPubliclyAccountable?: boolean;
}
export interface SfrsFrameworkResult {
  recommendedFramework: string;
  isEligibleForSmallEntitySfrs: boolean;
  criteriaMetCount: number;
  thresholdChecks: unknown;
  statutoryReference: string;
}
export interface PerformanceObligationItem {
  id: string;
  description: string;
  standaloneSellingPriceSgd: number;
}
export interface Sfrs115AllocationInput {
  totalTransactionPriceSgd: number;
  performanceObligations: PerformanceObligationItem[];
}
export interface Sfrs115AllocationResult {
  totalTransactionPriceSgd: number;
  totalStandaloneSellingPriceSgd: number;
  bundleDiscountSgd: number;
  allocations: Array<{
    id: string;
    description: string;
    standaloneSellingPriceSgd: number;
    weightRatio: number;
    allocatedRevenueSgd: number;
  }>;
}
export function evaluateSfrsFramework(input: SfrsFrameworkInput): SfrsFrameworkResult;
export function allocateTransactionPriceSfrs115(input: Sfrs115AllocationInput): Sfrs115AllocationResult;

// --- SFRS 1 Financial Statements Presentation ---
export interface IncomeStatementInput {
  revenueSgd: number;
  costOfSalesSgd?: number;
  operatingExpensesSgd?: number;
  depreciationAmortisationSgd?: number;
  financeCostsSgd?: number;
  incomeTaxExpenseSgd?: number;
}
export interface IncomeStatementResult {
  revenueSgd: number;
  costOfSalesSgd: number;
  grossProfitSgd: number;
  grossProfitMarginPercent: number;
  operatingExpensesSgd: number;
  ebitdaSgd: number;
  depreciationAmortisationSgd: number;
  ebitOperatingProfitSgd: number;
  financeCostsSgd: number;
  profitBeforeTaxPbtSgd: number;
  incomeTaxExpenseSgd: number;
  netProfitAfterTaxNpatSgd: number;
  netProfitMarginPercent: number;
}
export interface BalanceSheetInput {
  currentAssets?: {
    cashAndCashEquivalentsSgd?: number;
    tradeAndOtherReceivablesSgd?: number;
    inventoriesSgd?: number;
    otherCurrentAssetsSgd?: number;
  };
  nonCurrentAssets?: {
    propertyPlantEquipmentSgd?: number;
    rightOfUseAssetsSgd?: number;
    intangibleAssetsSgd?: number;
    otherNonCurrentAssetsSgd?: number;
  };
  currentLiabilities?: {
    tradeAndOtherPayablesSgd?: number;
    shortTermBorrowingsSgd?: number;
    leaseLiabilitiesCurrentSgd?: number;
    currentTaxPayableSgd?: number;
  };
  nonCurrentLiabilities?: {
    longTermBorrowingsSgd?: number;
    leaseLiabilitiesNonCurrentSgd?: number;
    deferredTaxLiabilitiesSgd?: number;
  };
  equity?: {
    shareCapitalSgd?: number;
    retainedEarningsSgd?: number;
    otherReservesSgd?: number;
  };
}
export interface BalanceSheetResult {
  totalCurrentAssetsSgd: number;
  totalNonCurrentAssetsSgd: number;
  totalAssetsSgd: number;
  totalCurrentLiabilitiesSgd: number;
  totalNonCurrentLiabilitiesSgd: number;
  totalLiabilitiesSgd: number;
  totalEquitySgd: number;
  totalLiabilitiesAndEquitySgd: number;
  isBalanced: boolean;
  discrepancySgd: number;
  verificationStatus: string;
}
export function compileIncomeStatement(input: IncomeStatementInput): IncomeStatementResult;
export function compileBalanceSheet(input: BalanceSheetInput): BalanceSheetResult;

// --- Capital Budgeting & Investment Valuation ---
export interface CapitalInvestmentInput {
  projectName?: string;
  initialInvestmentSgd: number;
  annualCashFlowsSgd: number[];
  hurdleDiscountRatePercent?: number;
}
export interface CapitalInvestmentResult {
  projectName: string;
  hurdleRatePercent: number;
  initialInvestmentSgd: number;
  evaluationMetrics: {
    netPresentValueSgd: number;
    internalRateOfReturnPercent: number | null;
    profitabilityIndex: number;
    undiscountedPaybackYears: number | null;
    discountedPaybackYears: number | null;
  };
  investmentDecision: {
    isAcceptable: boolean;
    verdict: string;
    reasoning: string;
  };
}
export function calculateNpv(initialOutflow: number, cashFlows: number[], discountRate: number): number;
export function calculateIrr(initialOutflow: number, cashFlows: number[]): number | null;
export function calculatePaybackPeriod(initialOutflow: number, cashFlows: number[], discountRate?: number): { undiscountedPaybackYears: number | null; discountedPaybackYears: number | null };
export function evaluateCapitalInvestment(input: CapitalInvestmentInput): CapitalInvestmentResult;

// --- SFRS 109 Expected Credit Loss (ECL) & IRAS Tax Deductibility ---
export interface Sfrs109EclInput {
  currentReceivablesSgd?: number;
  pastDue1To30DaysSgd?: number;
  pastDue31To60DaysSgd?: number;
  pastDue61To90DaysSgd?: number;
  moreThan90DaysSgd?: number;
  macroeconomicMultiplier?: number;
  specificImpairmentSgd?: number;
}
export interface Sfrs109EclResult {
  grossTradeReceivablesSgd: number;
  macroeconomicAdjustmentMultiplier: number;
  eclProvisionMatrix: unknown;
  totalGeneralEclAllowanceSgd: number;
  specificImpairmentAllowanceSgd: number;
  totalEclAllowanceSgd: number;
  netTradeReceivablesSgd: number;
  effectiveProvisionRatePercent: number;
  irasTaxTreatment: {
    taxDeductibleSpecificProvisionSgd: number;
    nonDeductibleGeneralProvisionSgd: number;
    fiscalAdjustmentNote: string;
  };
}
export function calculateSfrs109Ecl(input: Sfrs109EclInput): Sfrs109EclResult;

// --- SFRS 2 Inventory Valuation ---
export interface InventoryBatchInput {
  units: number;
  unitCostSgd: number;
}
export interface FifoInventoryInput {
  purchases: InventoryBatchInput[];
  unitsSold: number;
}
export interface WeightedAverageInventoryInput {
  purchases: InventoryBatchInput[];
  unitsSold: number;
}
export interface LowerOfCostAndNrvInput {
  inventoryCostSgd: number;
  estimatedSellingPriceSgd: number;
  estimatedCompletionCostSgd?: number;
  estimatedSellingExpenseSgd?: number;
}
export interface InventoryValuationResult {
  unitsSold: number;
  endingInventoryUnits: number;
  costOfGoodsSoldSgd: number;
  endingInventoryValueSgd: number;
  averageUnitCostSgd?: number;
}
export interface LowerOfCostAndNrvResult {
  costSgd: number;
  netRealisableValueSgd: number;
  finalCarryingValueBalanceSheetSgd: number;
  isWriteDownRequired: boolean;
  inventoryWriteDownExpenseSgd: number;
  sfrsComplianceNote: string;
}
export function calculateFifoInventory(input: FifoInventoryInput): InventoryValuationResult;
export function calculateWeightedAverageInventory(input: WeightedAverageInventoryInput): InventoryValuationResult;
export function evaluateLowerOfCostAndNrv(input: LowerOfCostAndNrvInput): LowerOfCostAndNrvResult;

// --- SFRS Financial Ratio Analysis ---
export interface FinancialRatioInput {
  currentAssetsSgd?: number;
  currentLiabilitiesSgd?: number;
  cashAndEquivalentsSgd?: number;
  inventorySgd?: number;
  tradeReceivablesSgd?: number;
  totalAssetsSgd?: number;
  totalLiabilitiesSgd?: number;
  totalDebtSgd?: number;
  totalEquitySgd?: number;
  revenueSgd?: number;
  costOfGoodsSoldSgd?: number;
  ebitOperatingProfitSgd?: number;
  netProfitSgd?: number;
  interestExpenseSgd?: number;
}
export interface FinancialRatioResult {
  liquidityRatios: {
    currentRatio: number | null;
    quickRatio: number | null;
    cashRatio: number | null;
  };
  solvencyRatios: {
    debtToEquityRatio: number | null;
    debtToAssetsRatio: number | null;
    interestCoverageRatio: number | null;
  };
  profitabilityRatios: {
    grossProfitMarginPercent: number;
    operatingProfitMarginPercent: number;
    netProfitMarginPercent: number;
    returnOnAssetsPercent: number;
    returnOnEquityPercent: number;
  };
  efficiencyRatios: {
    assetTurnoverTimes: number | null;
    receivablesTurnoverTimes: number | null;
    inventoryTurnoverTimes: number | null;
  };
  overallHealthAssessment: {
    healthScore: number;
    verdict: string;
    summary: string;
  };
}
export function analyzeFinancialRatios(input: FinancialRatioInput): FinancialRatioResult;

// --- Direct Cash Flow Forecasting & Runway ---
export interface WeeklyCashFlowForecastItem {
  weekNumber: number;
  operatingReceiptsSgd?: number;
  otherInflowsSgd?: number;
  payrollAndLeviesSgd?: number;
  rentAndUtilitiesSgd?: number;
  tradeCreditorPaymentsSgd?: number;
  taxAndOtherOutflowsSgd?: number;
}
export interface CashFlowForecastInput {
  startingCashBalanceSgd: number;
  weeklyForecasts: WeeklyCashFlowForecastItem[];
  minimumCashReserveSgd?: number;
}
export interface CashFlowForecastResult {
  startingCashBalanceSgd: number;
  endingCashBalanceSgd: number;
  totalProjectedInflowsSgd: number;
  totalProjectedOutflowsSgd: number;
  burnRateAnalysis: {
    averageMonthlyGrossBurnSgd: number;
    averageMonthlyNetBurnSgd: number;
    cashRunwayMonths: number | string;
  };
  minimumCashPoint: {
    lowestBalanceSgd: number;
    occurredInWeekNumber: number;
    isDeficit: boolean;
  };
  liquidityRiskAssessment: {
    isSolventThroughoutPeriod: boolean;
    hasBreachedMinimumReserve: boolean;
    totalWeeksBelowReserve: number;
    deficitAlerts: unknown[];
  };
  weeklySchedule: unknown[];
}
export function forecastWeeklyCashFlow(input: CashFlowForecastInput): CashFlowForecastResult;

// --- Cost-Volume-Profit & Break-Even Analysis ---
export interface BreakEvenInput {
  fixedCostsSgd: number;
  unitSellingPriceSgd: number;
  unitVariableCostSgd: number;
  projectedSalesUnits?: number;
  targetNetProfitSgd?: number;
}
export interface BreakEvenResult {
  unitSellingPriceSgd: number;
  unitVariableCostSgd: number;
  unitContributionMarginSgd: number;
  contributionMarginRatioPercent: number;
  fixedCostsSgd: number;
  breakEvenMetrics: {
    breakEvenUnits: number;
    breakEvenRevenueSgd: number;
  };
  projectedSalesPerformance?: unknown;
  targetProfitScenario?: unknown;
}
export function calculateBreakEvenAnalysis(input: BreakEvenInput): BreakEvenResult;

// --- SaaS & Digital Unit Economics ---
export interface UnitEconomicsInput {
  averageMonthlyRevenuePerUserSgd: number;
  grossMarginPercent: number;
  monthlyCustomerChurnRatePercent: number;
  monthlySalesAndMarketingSpendSgd: number;
  newCustomersAcquiredMonthly: number;
}
export interface UnitEconomicsResult {
  customerAcquisitionCostSgd: number;
  customerLifetimeValueSgd: number;
  ltvToCacRatio: number;
  cacPaybackPeriodMonths: number;
  retentionMetrics: {
    averageLifespanMonths: number;
    monthlyChurnRatePercent: number;
    monthlyGrossProfitPerUserSgd: number;
  };
  businessHealthRating: string;
  strategicAdvice: string;
}
export function evaluateUnitEconomics(input: UnitEconomicsInput): UnitEconomicsResult;

// --- Variable Capital Company (VCC) Distribution Waterfall ---
export interface VccWaterfallInput {
  totalDistributableProceedsSgd: number;
  lpInvestedCapitalSgd: number;
  preferredReturnHurdleRatePercent?: number;
  investmentHoldingPeriodYears?: number;
  carriedInterestPercent?: number;
  hasGpCatchUp?: boolean;
}
export interface VccWaterfallResult {
  totalProceedsDistributedSgd: number;
  lpInvestedCapitalSgd: number;
  totalNetProfitSgd: number;
  lpReturnsSummary: {
    totalCapitalAndProfitsToLpSgd: number;
    lpNetProfitSgd: number;
    netMoicMultiple: number;
  };
  gpReturnsSummary: {
    totalCarriedInterestToGpSgd: number;
    effectiveCarryPercentOfProfits: number;
  };
  waterfallTiersBreakdown: unknown;
}
export function calculateVccDistributionWaterfall(input: VccWaterfallInput): VccWaterfallResult;

// --- SFRS 116 Leases & ROU Asset Amortisation ---
export interface Sfrs116LeaseInput {
  annualLeasePaymentSgd: number;
  leaseTermYears: number;
  incrementalBorrowingRatePercent: number;
  initialDirectCostsSgd?: number;
  leasePrepaymentsSgd?: number;
  leaseIncentivesReceivedSgd?: number;
  paymentsMadeAtBeginningOfPeriod?: boolean;
}
export interface Sfrs116LeaseResult {
  isExemptFromCapitalisation: boolean;
  initialRightOfUseAssetSgd: number;
  initialLeaseLiabilitySgd: number;
  annualRouDepreciationSgd: number;
  balanceSheetClassificationYear1: {
    currentLeaseLiabilitySgd: number;
    nonCurrentLeaseLiabilitySgd: number;
    totalLeaseLiabilitySgd: number;
  };
  amortisationSchedule: unknown[];
}
export function calculateSfrs116Lease(input: Sfrs116LeaseInput): Sfrs116LeaseResult;
export function calculateLeasePv(annualPayment: number, termYears: number, ibrDecimal: number, paymentsAtBeginning?: boolean): number;

// --- Foreign Exchange Risk & Hedging (SFRS 109 / 121) ---
export interface FxForwardHedgeInput {
  foreignCurrency?: string;
  foreignExposureAmount: number;
  contractForwardRate: number;
  currentSpotRate: number;
  positionType?: 'BUY_FORWARD_IMPORTER' | 'SELL_FORWARD_EXPORTER' | string;
}
export interface FxForwardHedgeResult {
  foreignCurrency: string;
  foreignExposureAmount: number;
  contractForwardRate: number;
  currentSpotRate: number;
  positionType: string;
  hedgedSettlementValueSgd: number;
  unhedgedMarketValueSgd: number;
  hedgingMarkToMarketSgd: number;
  hedgingResultStatus: string;
  accountingClassification: {
    standard: string;
    recognition: string;
  };
  advisoryNote: string;
}
export function calculateTheoreticalForwardRate(spotRate: number, domesticRateSora: number, foreignInterestRate: number, daysToMaturity?: number): number;
export function evaluateFxForwardHedge(input: FxForwardHedgeInput): FxForwardHedgeResult;

// --- Market Entry & Regional Expansion (Strategic) ---
export const SUPPORTED_VEHICLES: string[];
export interface MarketEntryInput {
  targetStructure?: 'SUBSIDIARY' | 'BRANCH' | 'REPRESENTATIVE_OFFICE' | string;
  parentJurisdiction?: string;
  projectedAnnualRevenueSgd?: number;
  projectedLocalOperatingExpensesSgd?: number;
  projectedLocalHeadcount?: number;
  plansRegionalExpansion?: boolean;
  targetAseanMarkets?: string[];
  holdsForeignIntellectualPropertyOrShares?: boolean;
}
export interface MarketEntryResult {
  targetStructure: string;
  parentJurisdiction: string;
  isApprovedForMarketEntry: boolean;
  feasibilityScore: number;
  statutoryProfile: {
    isLegallyPermittedForCommercialRevenue: boolean;
    limitedLiabilityProtection: boolean;
    qualifiesForStartupTaxExemption: boolean;
    requiredLocalOfficers: string[];
    acraRegistrationForm: string;
  };
  economicSubstanceEvaluation: {
    holdsForeignAssetsOrActsAsRegionalHub: boolean;
    projectedLocalHeadcount: number;
    projectedLocalOperatingExpensesSgd: number;
    passesEconomicSubstance: boolean;
    economicSubstanceStatus: string;
  };
  regionalHubRouting: {
    plansRegionalExpansion: boolean;
    targetAseanMarketsCount: number;
    targetAseanMarkets: string[];
    applicableFtaFrameworks: string[];
  };
  totalComplianceBlockers: number;
  complianceBlockers: unknown[];
  statutoryNote: string;
}
export function evaluateMarketEntrySg(input?: MarketEntryInput): MarketEntryResult;

// --- Industry Cluster & Competitive Moat (Strategic) ---
export const SUPPORTED_CLUSTERS: string[];
export interface FiveForcesScoresInput {
  threatOfNewEntrants?: number;
  threatOfSubstitutes?: number;
  buyerPower?: number;
  supplierPower?: number;
  competitiveRivalry?: number;
}
export interface CompetitiveMoatInput {
  industryCluster?: 'FINTECH' | 'BIOMEDICAL' | 'LOGISTICS_MARITIME' | 'TECH_AI' | 'GENERAL_COMMERCIAL' | string;
  hasValuableAsset?: boolean;
  hasRareCapability?: boolean;
  isCostlyToImitate?: boolean;
  isOrganizedToCaptureValue?: boolean;
  holdsStatutoryLicense?: boolean;
  holdsRegisteredIpInIpos?: boolean;
  fiveForcesScores?: FiveForcesScoresInput;
}
export interface CompetitiveMoatResult {
  industryCluster: string;
  vrioAudit: {
    isValuable: boolean;
    isRare: boolean;
    isCostlyToImitate: boolean;
    isOrganized: boolean;
    competitiveImplication: string;
    vrioMoatScore: number;
  };
  clusterRegulatoryContext: {
    regulatoryBarrierStrength: string;
    relevantRegulators: string[];
    holdsStatutoryLicense: boolean;
    holdsRegisteredIpInIpos: boolean;
  };
  fiveForcesAudit: {
    forcesIntensity: unknown;
    averageForceIntensity: number;
    industryAttractiveness: string;
  };
  strategicMoatVerdict: string;
}
export function evaluateCompetitiveMoatSg(input?: CompetitiveMoatInput): CompetitiveMoatResult;

// --- Macroeconomic Stress Testing (Strategic) ---
export const SUPPORTED_SCENARIOS: string[];
export interface MacroScenarioInput {
  baselineRevenueSgd: number;
  baselineOpexSgd: number;
  scenarioType?: 'BASE_CASE' | 'MAS_TIGHTENING_SGD_APPRECIATION' | 'REGIONAL_TRADE_DISRUPTION' | 'STAGFLATION_SHOCK' | 'CUSTOM' | string;
  foreignRevenueSharePercent?: number;
  importedGoodsSharePercent?: number;
  customSgdNeerShiftPercent?: number;
  customInflationShiftPercent?: number;
  customSupplyChainCostMultiplier?: number;
}
export interface MacroScenarioResult {
  scenarioType: string;
  macroParametersApplied: {
    sgdNeerAppreciationRate: number;
    inflationShiftRate: number;
    supplyChainCostMultiplier: number;
    foreignRevenueExposurePercent: number;
    importedCostExposurePercent: number;
  };
  baselineFinancialsSgd: {
    annualRevenue: number;
    annualOpEx: number;
    netProfit: number;
    netProfitMarginPercent: number;
  };
  stressedFinancialsSgd: {
    adjustedAnnualRevenue: number;
    adjustedAnnualOpEx: number;
    adjustedNetProfit: number;
    adjustedNetProfitMarginPercent: number;
    profitChangeSgd: number;
    marginShiftPercentPoints: number;
  };
  stressResilienceTier: string;
  isNetProfitPositive: boolean;
}
export function simulateMacroScenarioSg(input: MacroScenarioInput): MacroScenarioResult;

// --- Strategic Risk Matrix & ERM (Strategic) ---
export const RISK_CATEGORIES: string[];
export interface StrategicRiskItem {
  id?: string;
  title?: string;
  category?: 'REGULATORY_COMPLIANCE' | 'FINANCIAL_MARKET' | 'OPERATIONAL_SUPPLY' | 'REPUTATIONAL_CYBER' | string;
  likelihood?: number;
  impact?: number;
  velocity?: number;
}
export interface StrategicRiskInput {
  risks: StrategicRiskItem[];
  hasBoardRiskCommittee?: boolean;
  hasDocumentedErmPolicy?: boolean;
}
export interface StrategicRiskResult {
  totalRisksEvaluated: number;
  overallPosture: string;
  corporateGovernanceIndex: number;
  severityBreakdown: {
    criticalExtremeCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
  };
  boardOversightAudit: {
    hasBoardRiskCommittee: boolean;
    hasDocumentedErmPolicy: boolean;
    sgxCodeOfCorporateGovernanceCompliant: boolean;
  };
  prioritizedRiskHeatmap: unknown[];
}
export function evaluateStrategicRiskSg(input: StrategicRiskInput): StrategicRiskResult;

// --- Hyper-Local SEO & Geo-Targeting (Marketing) ---
export const SINGAPORE_DISTRICTS: string[];
export interface LocalBusinessSchemaInput {
  postalCode?: string;
  uen?: string;
  streetAddress?: string;
}
export interface LocalSeoInput {
  domainName: string;
  targetKeywords?: string[];
  hreflangTags?: string[];
  localBusinessSchema?: LocalBusinessSchemaInput;
  hasGoogleBusinessProfile?: boolean;
}
export interface LocalSeoResult {
  domainName: string;
  localSeoScore: number;
  status: string;
  technicalAudit: {
    hasSingaporeCcTld: boolean;
    hasHreflangEnSg: boolean;
    hasValidSingaporePostalCode: boolean;
    hasValidAcraUen: boolean;
    hasGoogleBusinessProfile: boolean;
    matchedCommercialDistricts: string[];
  };
  passedSignalsCount: number;
  passedSignals: string[];
  actionableRecommendations: string[];
}
export function auditSingaporeLocalSeo(input: LocalSeoInput): LocalSeoResult;

// --- Content Localization & Advertising Code (Marketing) ---
export const SUPPORTED_AUDIENCES: string[];
export interface ContentLocalizationInput {
  copyText: string;
  targetAudience?: 'B2B_ENTERPRISE' | 'B2C_CONSUMER' | 'GOVERNMENT_PUBLIC_SECTOR' | string;
  allowColloquialSinglish?: boolean;
  hasHsaTherapeuticApproval?: boolean;
}
export interface ContentLocalizationResult {
  targetAudience: string;
  localizationQualityScore: number;
  isAsasCompliant: boolean;
  totalBreachesDetected: number;
  advertisingBreaches: unknown[];
  toneAudit: {
    detectedSinglishTerms: string[];
    toneObservations: unknown[];
  };
  statutoryNotice: string;
}
export function auditSingaporeContentLocalization(input: ContentLocalizationInput): ContentLocalizationResult;

// --- B2B Outbound Cadence & PDPA Compliance (Marketing) ---
export const SUPPORTED_RECIPIENTS: string[];
export const SUPPORTED_CHANNELS: string[];
export interface B2bOutboundInput {
  recipientType?: 'B2B_CORPORATE_CAPACITY' | 'B2C_INDIVIDUAL_CONSUMER' | string;
  outboundChannels?: string[];
  hasCheckedDncRegistry?: boolean;
  hasFunctionalUnsubscribeMechanism?: boolean;
  hasClearSenderIdentity?: boolean;
  cadenceStepCount?: number;
}
export interface B2bOutboundResult {
  recipientType: string;
  isFullyCompliant: boolean;
  bciExemptionApplies: boolean;
  statutoryAudit: {
    isSpamControlActCompliant: boolean;
    isPdpaCompliant: boolean;
    hasB2bBciExemption: boolean;
    channelsConfigured: string[];
  };
  totalBreachesDetected: number;
  complianceBreaches: unknown[];
  recommendedOutboundCadence: unknown[];
  statutoryNotice: string;
}
export function evaluateSingaporeOutboundCadence(input?: B2bOutboundInput): B2bOutboundResult;

// --- Multi-Platform Social Campaign Planning (Marketing) ---
export const SUPPORTED_PLATFORMS: string[];
export const INFLUENCER_TIERS: string[];
export interface SocialCampaignInput {
  platform: 'LINKEDIN' | 'INSTAGRAM' | 'TIKTOK' | 'LEMON8' | string;
  allocatedBudgetSgd: number;
  campaignGoal?: string;
  influencerTier?: 'NANO' | 'MICRO' | 'MID_TIER' | 'MACRO' | string;
  plannedPostCount?: number;
}
export interface SocialCampaignResult {
  platform: string;
  campaignGoal: string;
  totalBudgetSgd: number;
  budgetBreakdownSgd: {
    creatorPartnerships: number;
    paidMediaAmplification: number;
    creativeProduction: number;
  };
  influencerStrategy: {
    selectedTier: string;
    estimatedCreatorsEngaged: number;
    benchmarkEngagementRatePercent: number;
  };
  performanceProjections: {
    projectedImpressions: number;
    projectedEngagements: number;
    projectedClickThroughs: number;
    effectiveCostPerEngagementSgd: number;
  };
  optimalSingaporeTimingWindows: unknown[];
  targetAudienceSummary: string;
}
export function planSingaporeSocialCampaign(input: SocialCampaignInput): SocialCampaignResult;

// --- Enterprise B2B Lead Scoring & ICP (Marketing) ---
export const SUPPORTED_SENIORITIES: string[];
export const HIGH_PRIORITY_SSIC_CLUSTERS: string[];
export interface B2bLeadScoringInput {
  companyPaidUpCapitalSgd?: number;
  isGstRegisteredInIras?: boolean;
  employeeHeadcount?: number;
  ssicSector?: string;
  decisionMakerSeniority?: 'C_SUITE' | 'VP_DIRECTOR' | 'MANAGER' | 'INDIVIDUAL_CONTRIBUTOR' | string;
  isBudgetConfirmed?: boolean;
  timelineUrgencyMonths?: number;
}
export interface B2bLeadScoringResult {
  leadScore: number;
  leadTier: string;
  isIcpQualified: boolean;
  scoringBreakdown: unknown;
  companyProfileEvaluated: {
    acraPaidUpCapitalSgd: number;
    isGstRegisteredInIras: boolean;
    employeeCount: number;
    ssicSector: string;
    isHighPriorityCluster: boolean;
  };
  buyingCommitteeEvaluation: {
    seniority: string;
    budgetConfirmed: boolean;
    urgencyTimelineMonths: number;
  };
  recommendedSalesMotion: string;
}
export function scoreSingaporeB2bLead(input?: B2bLeadScoringInput): B2bLeadScoringResult;

// --- Paid Advertising ROI & 9% GST (Marketing) ---
export const STATUTORY_GST_RATE: number;
export interface AdsRoiInput {
  adSpendExcludingGstSgd: number;
  acquiredCustomersCount: number;
  totalAttributedRevenueSgd: number;
  customerLifespanMonths?: number;
  monthlyGrossMarginPerCustomerSgd?: number;
  isB2bGstRegistered?: boolean;
}
export interface AdsRoiResult {
  mediaSpendTaxBreakdownSgd: {
    baseAdSpendBeforeGst: number;
    statutory9PercentGst: number;
    grossTotalAdSpend: number;
    isGstClaimableAsInputTax: boolean;
    effectiveNetAdCost: number;
  };
  acquisitionMetrics: {
    acquiredCustomersCount: number;
    blendedCacSgd: number;
    customerLtvSgd: number;
    ltvToCacRatio: number;
  };
  performanceRatios: {
    attributedRevenueSgd: number;
    returnOnAdSpendRoas: number;
    marketingEfficiencyTier: string;
  };
  statutoryTaxAdvice: string;
}
export function calculateSingaporeAdsRoi(input: AdsRoiInput): AdsRoiResult;

// --- Strategic Brand Positioning & Value Proposition (Marketing) ---
export const SUPPORTED_SEGMENTS: string[];
export const PRICE_TIERS: string[];
export interface BrandPositioningInput {
  brandName: string;
  targetSegment?: 'REGIONAL_ENTERPRISE' | 'MASS_AFFLUENT_LOCAL' | 'SME_CORPORATE' | 'CROSS_BORDER_EXPORTER' | string;
  priceTier?: 'PREMIUM_LUXURY' | 'MID_TIER_VALUE' | 'ECONOMY_ACCESSIBLE' | string;
  coreDifferentiators?: string[];
  hasRegisteredIposTrademark?: boolean;
  alignsWithGreenPlan2030?: boolean;
  hasMadeWithPassionEndorsement?: boolean;
}
export interface BrandPositioningResult {
  brandName: string;
  targetSegment: string;
  priceTier: string;
  positioningCoordinates: {
    perceivedPremiumX: number;
    innovationIntensityY: number;
  };
  positioningQuadrant: string;
  singaporeTrustEquity: {
    singaporeTrustIndex: number;
    hasRegisteredIposTrademark: boolean;
    alignsWithGreenPlan2030: boolean;
    hasMadeWithPassionEndorsement: boolean;
    defensibilityTier: string;
  };
  valuePropositionAudit: {
    differentiatorsCount: number;
    coreDifferentiators: string[];
    valuePropositionStatement: string;
  };
}
export function evaluateSingaporeBrandPositioning(input: BrandPositioningInput): BrandPositioningResult;



