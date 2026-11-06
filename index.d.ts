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

// --- DTA SG-ID ---
export type FlowDirection = 'SG_TO_ID' | 'ID_TO_SG';
export type TreatyIncomeType = 'DIVIDENDS' | 'INTEREST' | 'ROYALTIES' | 'MANAGEMENT_OR_TECH_SERVICES';
export const FLOW_DIRECTIONS: FlowDirection[];
export const TREATY_INCOME_TYPES: TreatyIncomeType[];

export interface DtaSgIdInput {
  incomeType: TreatyIncomeType | string;
  flowDirection?: FlowDirection | string;
  grossAmountSgdOrIdr: number;
  equityHoldingPercentage?: number;
  royaltyCategory?: 'EQUIPMENT' | 'PATENT_COPYRIGHT' | string;
  hasValidCorOrDgtForm?: boolean;
}
export interface DtaSgIdResult {
  treatyName: string;
  incomeType: string;
  flowDirection: string;
  hasValidResidenceDocumentation: boolean;
  treatyArticle: string;
  domesticStatutoryRate: number;
  treatyRate: number;
  grossAmount: number;
  domesticTaxPayable: number;
  treatyTaxPayable: number;
  taxSavingsBenefit: number;
  reliefStatus: string;
}
export function evaluateDtaSgIdRelief(input: DtaSgIdInput): DtaSgIdResult;

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

// --- Cross Border Holding ---
export interface CrossBorderHoldingInput {
  dividendAmountIdrOrSgd: number;
  equityShareholdingPercent?: number;
  shareHoldingDurationMonths?: number;
  hasValidCorCertificate?: boolean;
  operatingTaxRateInOrigin?: number;
  estimatedAnnualSgMaintenanceCostSgd?: number;
}
export interface CrossBorderHoldingResult {
  dividendGrossAmount: number;
  equityShareholdingPercentage: number;
  hasValidCorCertificate: boolean;
  directHoldingScenario: {
    framework: string;
    withholdingTaxRate: number;
    withholdingTaxPayable: number;
    netCashDelivered: number;
    effectiveTaxLeakagePercent: number;
  };
  singaporeHoldingScenario: {
    framework: string;
    indonesiaOutboundWhtRate: number;
    indonesiaWhtTaxPayable: number;
    dividendReceivedBySgHoldCo: number;
    section13_8_FsieExemptionApplies: boolean;
    singaporeCitOnForeignDividend: number;
    singaporeOutboundDividendWhtRate: number;
    netCashDelivered: number;
    effectiveTaxLeakagePercent: number;
  };
  comparativeAnalysis: {
    grossTaxSavingsBenefit: number;
    annualSgHoldingMaintenanceCostEstimate: number;
    isHoldingStructureEconomicallySuperior: boolean;
    netFinancialEfficiencyDelta: number;
  };
  statutorySafeHarbours: {
    section13W_CapitalGainsSafeHarbourQualified: boolean;
    section13W_CriteriaMet: {
      holdingPercentageMeets20Percent: boolean;
      holdingPeriodMeets24Months: boolean;
    };
  };
}
export function evaluateCrossBorderHoldingStructure(input: CrossBorderHoldingInput): CrossBorderHoldingResult;

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

