/**
 * Singapore Business Agent Skills — Root SDK Interface (`index.js`)
 *
 * Universal, zero-dependency, pure Node.js SDK interface for enterprise backends,
 * AI agent frameworks, and custom applications.
 *
 * Provides direct access to deterministic computational and statutory compliance engines:
 *   - Tax: CIT (Section 43 & Startup Exemption 43A), GST (Section 19), WHT (Section 45/45A), Tax Residency & CoR (Section 2)
 *   - HR: CPF Statutory Contributions, MOM Overtime (Part IV Employment Act), COMPASS Scoring, Foreign Workforce Quota
 *   - Legal: ACRA Statutory Deadlines (AGM/AR), Small Company Audit Exemption (13th Schedule), PDPA Breach Assessment (Section 26D)
 *   - Finance: SORA WACC Floating Debt Cost, Working Capital & Cash Conversion Cycle
 *   - Strategy & Governance: Enterprise Singapore Grant Assessment, Singapore Corporate Structuring & Holding (FSIE Section 13(8) / 13W)
 *   - Security: Closed Delimiter Prompt Sanitization
 *
 * ZERO runtime dependencies, 100% deterministic Node.js standard library implementation.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// --- Statutory Ruleset Integrity ---
const integrity = require('./engines/rules/integrity.js');

// --- Tax Engines (IRAS & Treaties) ---
const citEngine = require('./engines/cit-tax-engine.js');
const gstEngine = require('./engines/gst-engine.js');
const whtEngine = require('./engines/wht-engine.js');
const taxResidencyEngine = require('./engines/tax-residency-engine.js');
const eisTaxEngine = require('./engines/eis-tax-engine.js');
const lossCarryEngine = require('./engines/loss-carry-engine.js');
const groupReliefEngine = require('./engines/group-relief-engine.js');
const foreignTaxCreditEngine = require('./engines/dtl-foreign-tax-credit-engine.js');
const familyOfficeEngine = require('./engines/s13o-s13u-family-office-engine.js');
const pillarTwoEngine = require('./engines/pillar-two-dtt-engine.js');
const stampDutyEngine = require('./engines/stamp-duty-absd-engine.js');
const taxAuditRiskEngine = require('./engines/tax-audit-risk-engine.js');
const transferPricingEngine = require('./engines/transfer-pricing-engine.js');
const capitalAllowanceEngine = require('./engines/capital-allowance-engine.js');

// --- Human Resources & Immigration Engines (MOM & CPF) ---
const cpfEngine = require('./engines/cpf-calculator.js');
const momOvertimeEngine = require('./engines/mom-overtime-engine.js');
const compassEngine = require('./engines/compass-scoring-engine.js');
const foreignWorkforceQuotaEngine = require('./engines/foreign-workforce-quota-engine.js');
const annualLeaveEngine = require('./engines/annual-leave-engine.js');
const sickLeaveEngine = require('./engines/sick-hospitalisation-leave-engine.js');
const retrenchmentEngine = require('./engines/retrenchment-benefit-engine.js');
const parentalLeaveEngine = require('./engines/maternity-paternity-leave-engine.js');
const workplaceFairnessEngine = require('./engines/workplace-fairness-engine.js');
const pwmEngine = require('./engines/progressive-wage-model-engine.js');
const ketsEngine = require('./engines/key-employment-terms-engine.js');
const payslipEngine = require('./engines/itemised-payslip-engine.js');
const publicHolidayEngine = require('./engines/public-holiday-pay-engine.js');
const employmentContractEngine = require('./engines/employment-contract-engine.js');

// --- Legal & Governance Engines (ACRA & PDPC) ---
const acraDeadlineEngine = require('./engines/acra-statutory-deadline-engine.js');
const smallCompanyAuditEngine = require('./engines/small-company-audit-engine.js');
const pdpaBreachEngine = require('./engines/pdpa-breach-engine.js');
const contractRiskEngine = require('./engines/contract-risk-engine.js');
const corporateSecretarialEngine = require('./engines/corporate-secretarial-engine.js');
const iposTrademarkEngine = require('./engines/ipos-trademark-engine.js');
const strikingOffEngine = require('./engines/striking-off-engine.js');
const directorDutiesEngine = require('./engines/director-duties-engine.js');
const tadmDisputeEngine = require('./engines/tadm-dispute-engine.js');

// --- Financial & Capital Structuring Engines (MAS & SFRS) ---
const soraWaccEngine = require('./engines/sora-wacc-engine.js');
const workingCapitalSgEngine = require('./engines/working-capital-sg-engine.js');
const sfrsAccountingEngine = require('./engines/sfrs-accounting-engine.js');
const financialStatementsEngine = require('./engines/financial-statements-engine.js');
const capitalBudgetingEngine = require('./engines/capital-budgeting-engine.js');
const eclSfrs109Engine = require('./engines/ecl-sfrs109-engine.js');
const inventoryValuationEngine = require('./engines/inventory-valuation-engine.js');
const financialRatioEngine = require('./engines/financial-ratio-engine.js');
const cashFlowForecastEngine = require('./engines/cash-flow-forecast-engine.js');
const breakEvenEngine = require('./engines/break-even-engine.js');
const unitEconomicsEngine = require('./engines/unit-economics-engine.js');
const vccWaterfallEngine = require('./engines/vcc-waterfall-engine.js');
const leaseSfrs116Engine = require('./engines/lease-sfrs116-engine.js');
const fxHedgingEngine = require('./engines/fx-hedging-engine.js');

// --- Strategic & Governance Engines ---
const enterpriseGrantEngine = require('./engines/enterprise-grant-engine.js');
const corporateStructuringEngine = require('./engines/corporate-structuring-engine.js');
const marketEntryEngine = require('./engines/market-entry-sg-engine.js');
const competitiveMoatEngine = require('./engines/competitive-intel-sg-engine.js');
const scenarioPlanningEngine = require('./engines/scenario-planning-sg-engine.js');
const strategicRiskEngine = require('./engines/strategic-risk-sg-engine.js');

// --- Marketing & Growth Engines ---
const sgSeoGeoEngine = require('./engines/sg-seo-geo-engine.js');
const sgContentLocalizationEngine = require('./engines/sg-content-localization-engine.js');
const sgB2bOutboundEngine = require('./engines/sg-b2b-outbound-engine.js');
const sgSocialCampaignEngine = require('./engines/sg-social-campaign-engine.js');
const sgLeadQualificationEngine = require('./engines/sg-lead-qualification-engine.js');
const sgAdsRoiEngine = require('./engines/sg-ads-roi-engine.js');
const sgBrandPositioningEngine = require('./engines/sg-brand-positioning-engine.js');

// --- Security Sanitizer ---
const securitySanitizer = require('./engines/security-sanitizer.js');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

module.exports = {
  version: pkg.version,
  name: pkg.name,

  // Ruleset verification
  verifyRulesetIntegrity: integrity.verifyRulesetIntegrity,
  verifyAllRulesets: integrity.verifyAllRulesets,
  REQUIRED_RULESETS: integrity.REQUIRED_RULESETS,
  EXPECTED_HASHES: integrity.EXPECTED_HASHES,

  // 1. Corporate Income Tax (IRAS)
  calculateSingaporeCit: citEngine.calculateSingaporeCit,

  // 2. Goods & Services Tax (IRAS)
  calculateSingaporeGstRate: gstEngine.calculateSingaporeGstRate,
  evaluateGstRegistrationLiability: gstEngine.evaluateGstRegistrationLiability,
  calculateGstFiling: gstEngine.calculateGstFiling,

  // 3. Withholding Tax (IRAS)
  calculateSingaporeWht: whtEngine.calculateSingaporeWht,
  VALID_PAYMENT_TYPES: whtEngine.VALID_PAYMENT_TYPES,

  // 4. Corporate Tax Residency & Certificate of Residence (IRAS)
  evaluateTaxResidency: taxResidencyEngine.evaluateTaxResidency,

  // 4a. Enterprise Innovation Scheme (IRAS / Budget 2023)
  calculateEnterpriseInnovationScheme: eisTaxEngine.calculateEnterpriseInnovationScheme,

  // 4b. Loss Carry-Forward & Carry-Back Relief (IRAS)
  evaluateLossUtilization: lossCarryEngine.evaluateLossUtilization,

  // 4c. Group Relief Loss Transfer (IRAS)
  evaluateGroupReliefTransfer: groupReliefEngine.evaluateGroupReliefTransfer,

  // 4d. Foreign Tax Credit & Pooling (IRAS)
  calculateForeignTaxCredit: foreignTaxCreditEngine.calculateForeignTaxCredit,

  // 4e. Family Office & Fund Tax Exemption (MAS / Sections 13O & 13U)
  evaluateFamilyOfficeExemption: familyOfficeEngine.evaluateFamilyOfficeExemption,

  // 4f. BEPS 2.0 Pillar Two Domestic Top-up Tax (IRAS / OECD)
  calculateDomesticTopUpTax: pillarTwoEngine.calculateDomesticTopUpTax,

  // 4g. Buyer's Stamp Duty & ABSD (IRAS)
  calculatePropertyStampDuty: stampDutyEngine.calculatePropertyStampDuty,

  // 4h. Tax Audit & Reconciliation Risk (IRAS)
  assessTaxAuditRisk: taxAuditRiskEngine.assessTaxAuditRisk,

  // 4i. Transfer Pricing & Arm's Length Compliance (IRAS)
  evaluateTransferPricingCompliance: transferPricingEngine.evaluateTransferPricingCompliance,

  // 4j. Capital Allowance Plant & Machinery (IRAS)
  calculateCapitalAllowances: capitalAllowanceEngine.calculateCapitalAllowances,

  // 5. CPF & Levies (CPF Board & MOM)
  calculateSingaporeCpf: cpfEngine.calculateSingaporeCpf,
  RESIDENTIAL_STATUSES: cpfEngine.RESIDENTIAL_STATUSES,

  // 6. Overtime & Part IV Compliance (MOM)
  calculateMomOvertimeAndCompliance: momOvertimeEngine.calculateMomOvertimeAndCompliance,
  EMPLOYEE_CATEGORIES: momOvertimeEngine.EMPLOYEE_CATEGORIES,

  // 7. COMPASS EP Scoring (MOM)
  evaluateCompassEpEligibility: compassEngine.evaluateCompassEpEligibility,
  getMinimumQualifyingSalary: compassEngine.getMinimumQualifyingSalary,
  SECTOR_TYPES: compassEngine.SECTOR_TYPES,
  QUALIFICATION_LEVELS: compassEngine.QUALIFICATION_LEVELS,

  // 8. Foreign Workforce Quotas & Levies (MOM)
  calculateForeignWorkforceQuota: foreignWorkforceQuotaEngine.calculateForeignWorkforceQuota,
  calculateLocalHeadcount: foreignWorkforceQuotaEngine.calculateLocalHeadcount,
  SUPPORTED_SECTORS: foreignWorkforceQuotaEngine.SUPPORTED_SECTORS,

  // 8a. Statutory Annual Leave & Encashment (MOM)
  calculateAnnualLeaveEntitlement: annualLeaveEngine.calculateAnnualLeaveEntitlement,

  // 8b. Statutory Sick & Hospitalisation Leave (MOM)
  calculateSickLeaveEntitlement: sickLeaveEngine.calculateSickLeaveEntitlement,

  // 8c. Retrenchment Benefit & Mandatory MOM Notification
  calculateRetrenchmentBenefit: retrenchmentEngine.calculateRetrenchmentBenefit,

  // 8d. Parental Leave Schemes GPML & GPPL (CDCA / MOM)
  calculateParentalLeave: parentalLeaveEngine.calculateParentalLeave,

  // 8e. Workplace Fairness & Anti-Discrimination (WFA / TAFEP)
  auditWorkplaceFairness: workplaceFairnessEngine.auditWorkplaceFairness,

  // 8f. Progressive Wage Model & Local Qualifying Salary (MOM)
  evaluateProgressiveWageCompliance: pwmEngine.evaluateProgressiveWageCompliance,

  // 8g. Key Employment Terms Compliance (MOM)
  auditKeyEmploymentTerms: ketsEngine.auditKeyEmploymentTerms,

  // 8h. Mandatory Itemised Payslip (MOM)
  auditItemisedPayslip: payslipEngine.auditItemisedPayslip,

  // 8i. Public Holiday Pay & In-Lieu Compensation (MOM)
  calculatePublicHolidayCompensation: publicHolidayEngine.calculatePublicHolidayCompensation,

  // 8j. Employment Contract & Restrictive Covenants Audit
  auditEmploymentContract: employmentContractEngine.auditEmploymentContract,

  // 9. ACRA Statutory Deadlines & Penalties (ACRA)
  calculateAcraStatutoryDeadlines: acraDeadlineEngine.calculateAcraStatutoryDeadlines,
  addMonthsToDate: acraDeadlineEngine.addMonthsToDate,

  // 10. Small Company Audit Exemption (ACRA)
  evaluateSmallCompanyAuditExemption: smallCompanyAuditEngine.evaluateSmallCompanyAuditExemption,

  // 11. PDPA Data Breach Notification & Fines (PDPC)
  evaluatePdpaBreachNotification: pdpaBreachEngine.evaluatePdpaBreachNotification,
  SIGNIFICANT_HARM_PRESCRIBED: pdpaBreachEngine.SIGNIFICANT_HARM_PRESCRIBED,

  // 11a. Commercial Contract Risk & Common Law Liability (UCTA / SIAC)
  evaluateContractRisk: contractRiskEngine.evaluateContractRisk,

  // 11b. Corporate Secretarial & Beneficial Ownership RORC (ACRA)
  auditCorporateSecretarial: corporateSecretarialEngine.auditCorporateSecretarial,

  // 11c. IPOS Trademark Classification & Registrability
  evaluateTrademarkRegistrability: iposTrademarkEngine.evaluateTrademarkRegistrability,
  calculateIposFilingFees: iposTrademarkEngine.calculateIposFilingFees,

  // 11d. Corporate Striking-Off Readiness & Timelines (ACRA S.344A)
  evaluateStrikingOffReadiness: strikingOffEngine.evaluateStrikingOffReadiness,

  // 11e. Director Duties & Disqualification Audit (Companies Act S.145/148/149)
  evaluateDirectorEligibility: directorDutiesEngine.evaluateDirectorEligibility,

  // 11f. TADM & Employment Claims Tribunal Dispute Resolution (ECA S.12)
  evaluateTadmDispute: tadmDisputeEngine.evaluateTadmDispute,
  calculateTadmRegistrationFee: tadmDisputeEngine.calculateTadmRegistrationFee,

  // 12. SORA WACC & Cost of Capital (MAS)
  calculateSingaporeWacc: soraWaccEngine.calculateSingaporeWacc,

  // 13. Working Capital & Cash Conversion Cycle
  calculateSingaporeWorkingCapital: workingCapitalSgEngine.calculateSingaporeWorkingCapital,

  // 13a. SFRS Accounting Framework & SFRS 115 Revenue Allocation
  evaluateSfrsFramework: sfrsAccountingEngine.evaluateSfrsFramework,
  allocateTransactionPriceSfrs115: sfrsAccountingEngine.allocateTransactionPriceSfrs115,

  // 13b. SFRS 1 Financial Statements Presentation (P&L, Balance Sheet)
  compileIncomeStatement: financialStatementsEngine.compileIncomeStatement,
  compileBalanceSheet: financialStatementsEngine.compileBalanceSheet,

  // 13c. Capital Budgeting & Investment Valuation (NPV, IRR, Payback)
  calculateNpv: capitalBudgetingEngine.calculateNpv,
  calculateIrr: capitalBudgetingEngine.calculateIrr,
  calculatePaybackPeriod: capitalBudgetingEngine.calculatePaybackPeriod,
  evaluateCapitalInvestment: capitalBudgetingEngine.evaluateCapitalInvestment,

  // 13d. SFRS 109 Expected Credit Loss (ECL) & IRAS Tax Deductibility
  calculateSfrs109Ecl: eclSfrs109Engine.calculateSfrs109Ecl,

  // 13e. SFRS 2 Inventory Valuation (FIFO, WAC, NRV Write-Down)
  calculateFifoInventory: inventoryValuationEngine.calculateFifoInventory,
  calculateWeightedAverageInventory: inventoryValuationEngine.calculateWeightedAverageInventory,
  evaluateLowerOfCostAndNrv: inventoryValuationEngine.evaluateLowerOfCostAndNrv,

  // 13f. SFRS Financial Ratio Analysis (14 Standard Ratios)
  analyzeFinancialRatios: financialRatioEngine.analyzeFinancialRatios,

  // 13g. Direct Cash Flow Forecasting & Runway Engine
  forecastWeeklyCashFlow: cashFlowForecastEngine.forecastWeeklyCashFlow,

  // 13h. Cost-Volume-Profit & Break-Even Analysis
  calculateBreakEvenAnalysis: breakEvenEngine.calculateBreakEvenAnalysis,

  // 13i. SaaS & Digital Business Unit Economics (LTV, CAC, Payback)
  evaluateUnitEconomics: unitEconomicsEngine.evaluateUnitEconomics,

  // 13j. Variable Capital Company (VCC) Distribution Waterfall
  calculateVccDistributionWaterfall: vccWaterfallEngine.calculateVccDistributionWaterfall,

  // 13k. SFRS 116 Leases & ROU Asset Amortisation
  calculateSfrs116Lease: leaseSfrs116Engine.calculateSfrs116Lease,
  calculateLeasePv: leaseSfrs116Engine.calculateLeasePv,

  // 13l. Foreign Exchange Hedging & MTM Valuation (SFRS 109 / 121)
  calculateTheoreticalForwardRate: fxHedgingEngine.calculateTheoreticalForwardRate,
  evaluateFxForwardHedge: fxHedgingEngine.evaluateFxForwardHedge,

  // 14. Enterprise Singapore Grants (EnterpriseSG)
  evaluateEnterpriseGrant: enterpriseGrantEngine.evaluateEnterpriseGrant,
  SUPPORTED_GRANTS: enterpriseGrantEngine.SUPPORTED_GRANTS,

  // 15. Corporate Structuring & Holding Governance (ACRA/IRAS)
  evaluateCorporateStructuring: corporateStructuringEngine.evaluateCorporateStructuring,

  // 16. Market Entry & Regional Expansion (ACRA/EnterpriseSG/EDB)
  evaluateMarketEntrySg: marketEntryEngine.evaluateMarketEntrySg,
  SUPPORTED_VEHICLES: marketEntryEngine.SUPPORTED_VEHICLES,

  // 17. Industry Cluster & Competitive Moat (VRIO / MAS / HSA / IMDA)
  evaluateCompetitiveMoatSg: competitiveMoatEngine.evaluateCompetitiveMoatSg,
  SUPPORTED_CLUSTERS: competitiveMoatEngine.SUPPORTED_CLUSTERS,

  // 18. Macroeconomic & Geopolitical Scenario Stress Testing (MAS S$NEER)
  simulateMacroScenarioSg: scenarioPlanningEngine.simulateMacroScenarioSg,
  SUPPORTED_SCENARIOS: scenarioPlanningEngine.SUPPORTED_SCENARIOS,

  // 19. Strategic Risk Matrix & ERM Heatmap (Code of Corporate Governance 2018)
  evaluateStrategicRiskSg: strategicRiskEngine.evaluateStrategicRiskSg,
  RISK_CATEGORIES: strategicRiskEngine.RISK_CATEGORIES,

  // 20. Hyper-Local SEO & Geo-Targeting (Google SG / ccTLD / UEN Schema)
  auditSingaporeLocalSeo: sgSeoGeoEngine.auditSingaporeLocalSeo,
  SINGAPORE_DISTRICTS: sgSeoGeoEngine.SINGAPORE_DISTRICTS,

  // 21. Content Localization & Advertising Code (ASAS / SCAP / CCCS)
  auditSingaporeContentLocalization: sgContentLocalizationEngine.auditSingaporeContentLocalization,
  SUPPORTED_AUDIENCES: sgContentLocalizationEngine.SUPPORTED_AUDIENCES,

  // 22. B2B Outbound Cadence & PDPA Compliance (BCI / DNC / Spam Control Act)
  evaluateSingaporeOutboundCadence: sgB2bOutboundEngine.evaluateSingaporeOutboundCadence,
  SUPPORTED_RECIPIENTS: sgB2bOutboundEngine.SUPPORTED_RECIPIENTS,
  SUPPORTED_CHANNELS: sgB2bOutboundEngine.SUPPORTED_CHANNELS,

  // 23. Multi-Platform Social Campaign Planning (LinkedIn SG / SGT Peak Transit)
  planSingaporeSocialCampaign: sgSocialCampaignEngine.planSingaporeSocialCampaign,
  SUPPORTED_PLATFORMS: sgSocialCampaignEngine.SUPPORTED_PLATFORMS,
  INFLUENCER_TIERS: sgSocialCampaignEngine.INFLUENCER_TIERS,

  // 24. Enterprise B2B Lead Scoring & ICP (ACRA Capital / IRAS GST / SSIC)
  scoreSingaporeB2bLead: sgLeadQualificationEngine.scoreSingaporeB2bLead,
  SUPPORTED_SENIORITIES: sgLeadQualificationEngine.SUPPORTED_SENIORITIES,
  HIGH_PRIORITY_SSIC_CLUSTERS: sgLeadQualificationEngine.HIGH_PRIORITY_SSIC_CLUSTERS,

  // 25. Paid Advertising ROI & Digital Services Tax (Statutory 9% GST / CAC / LTV)
  calculateSingaporeAdsRoi: sgAdsRoiEngine.calculateSingaporeAdsRoi,
  STATUTORY_GST_RATE: sgAdsRoiEngine.STATUTORY_GST_RATE,

  // 26. Strategic Brand Positioning & Value Proposition (IPOS Trust / Made With Passion)
  evaluateSingaporeBrandPositioning: sgBrandPositioningEngine.evaluateSingaporeBrandPositioning,
  SUPPORTED_SEGMENTS: sgBrandPositioningEngine.SUPPORTED_SEGMENTS,
  PRICE_TIERS: sgBrandPositioningEngine.PRICE_TIERS,

  // 27. Security Sanitizer & Boundary Isolation
  sanitizeUntrustedPayload: securitySanitizer.sanitizeUntrustedPayload,
  wrapUntrustedPayload: securitySanitizer.wrapUntrustedPayload,
  extractIsolatedPayload: securitySanitizer.extractIsolatedPayload
};
