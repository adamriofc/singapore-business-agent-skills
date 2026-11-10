'use strict';

const assert = require('assert');
const {
  auditSingaporeLocalSeo,
  auditSingaporeContentLocalization,
  evaluateSingaporeOutboundCadence,
  planSingaporeSocialCampaign,
  scoreSingaporeB2bLead,
  calculateSingaporeAdsRoi,
  evaluateSingaporeBrandPositioning
} = require('../../index.js');

function runMarketingEnginesTests() {
  console.log("🇸🇬 Running Singapore Marketing & Growth Domain Computational Engine Tests...\n");

  // ===============================================================
  // 1. Singapore Hyper-Local SEO & Geo-Targeting Engine
  // ===============================================================
  console.log("  [1/7] Testing Singapore Hyper-Local SEO Engine (ccTLD, Postal Code, UEN, GBP)...");

  // 1a. High-Authority Singapore Local Domain (.com.sg + UEN + 6-digit postal + CBD keywords + GBP)
  const strongSeo = auditSingaporeLocalSeo({
    domainName: 'enterprise.com.sg',
    targetKeywords: ['Corporate Tax Services CBD', 'Singapore Raffles Place Accounting', 'Audit Firm Marina Bay'],
    hreflangTags: ['en-sg', 'en'],
    localBusinessSchema: {
      postalCode: '048624', // Valid 6-digit Singapore postal code
      uen: '202312345K',    // Valid ACRA UEN
      streetAddress: '10 Collyer Quay, Ocean Financial Centre'
    },
    hasGoogleBusinessProfile: true
  });
  assert.strictEqual(strongSeo.localSeoScore, 100);
  assert.strictEqual(strongSeo.status, 'EXCELLENT_LOCAL_AUTHORITY');
  assert.strictEqual(strongSeo.technicalAudit.hasSingaporeCcTld, true);
  assert.strictEqual(strongSeo.technicalAudit.hasValidSingaporePostalCode, true);
  assert.strictEqual(strongSeo.technicalAudit.hasValidAcraUen, true);
  assert.strictEqual(strongSeo.technicalAudit.matchedCommercialDistricts.length >= 2, true);
  console.log("  ✅ Local SEO: 100% full local authority signals audited.");

  // 1b. Weak Non-Localized Domain (.io, no postal, no UEN, no GBP)
  const weakSeo = auditSingaporeLocalSeo({
    domainName: 'globalstartup.io',
    targetKeywords: ['Cloud Software Solutions'],
    hasGoogleBusinessProfile: false
  });
  assert.strictEqual(weakSeo.localSeoScore < 50, true);
  assert.strictEqual(weakSeo.status, 'WEAK_LOCAL_SIGNALS_REMEDIATION_REQUIRED');
  assert.strictEqual(weakSeo.actionableRecommendations.length >= 4, true);
  console.log("  ✅ Local SEO: Remediation triggers for weak non-local domain verified.");

  // ===============================================================
  // 2. Singapore Content Localization & ASAS Advertising Compliance Engine
  // ===============================================================
  console.log("  [2/7] Testing Content Localization & ASAS Advertising Code Compliance Engine...");

  // 2a. ASAS & HSA Violations (Unsubstantiated superlative + unauthorized medical cure)
  const nonCompliantCopy = auditSingaporeContentLocalization({
    copyText: "We are the BEST IN SINGAPORE clinic! Guaranteed 100% cure for all patients. Our serum CURES chronic fatigue lah!",
    targetAudience: 'B2B_ENTERPRISE',
    hasHsaTherapeuticApproval: false
  });
  assert.strictEqual(nonCompliantCopy.isAsasCompliant, false);
  assert.strictEqual(nonCompliantCopy.totalBreachesDetected >= 2, true);
  assert.strictEqual(nonCompliantCopy.advertisingBreaches.some(b => b.code === 'ASAS_UNSUBSTANTIATED_SUPERLATIVE'), true);
  assert.strictEqual(nonCompliantCopy.advertisingBreaches.some(b => b.code === 'HSA_UNAUTHORIZED_THERAPEUTIC_CLAIM'), true);
  assert.strictEqual(nonCompliantCopy.toneAudit.detectedSinglishTerms.includes('LAH'), true);
  console.log("  ✅ ASAS/HSA: Superlatives, health claims, and inappropriate B2B Singlish flagged.");

  // 2b. Clean, Professional Singapore Corporate B2B Copy
  const compliantCopy = auditSingaporeContentLocalization({
    copyText: "Empowering Singapore enterprises with enterprise-grade financial governance, full ACRA statutory compliance, and IRAS tax automation.",
    targetAudience: 'B2B_ENTERPRISE',
    hasHsaTherapeuticApproval: false
  });
  assert.strictEqual(compliantCopy.isAsasCompliant, true);
  assert.strictEqual(compliantCopy.totalBreachesDetected, 0);
  assert.strictEqual(compliantCopy.localizationQualityScore, 100);
  console.log("  ✅ ASAS: Professional enterprise copy certified 100% compliant.");

  // ===============================================================
  // 3. Singapore B2B Outbound Lead Engine & PDPA BCI Cadence
  // ===============================================================
  console.log("  [3/7] Testing Singapore B2B Outbound Lead Engine (PDPA BCI Exemption & Spam Control Act)...");

  // 3a. Compliant B2B Corporate Capacity (BCI Exemption under PDPA Section 4(4)(d))
  const b2bOutbound = evaluateSingaporeOutboundCadence({
    recipientType: 'B2B_CORPORATE_CAPACITY',
    outboundChannels: ['EMAIL', 'LINKEDIN'],
    hasCheckedDncRegistry: false, // Not required for B2B BCI corporate capacity
    hasFunctionalUnsubscribeMechanism: true,
    hasClearSenderIdentity: true,
    cadenceStepCount: 4
  });
  assert.strictEqual(b2bOutbound.isFullyCompliant, true);
  assert.strictEqual(b2bOutbound.bciExemptionApplies, true);
  assert.strictEqual(b2bOutbound.statutoryAudit.isSpamControlActCompliant, true);
  assert.strictEqual(b2bOutbound.recommendedOutboundCadence.length, 4);
  console.log("  ✅ PDPA BCI: Section 4(4)(d) B2B Corporate Contact exemption confirmed.");

  // 3b. Non-Compliant B2C Consumer Voice Telemarketing without DNC Check
  const b2cViolation = evaluateSingaporeOutboundCadence({
    recipientType: 'B2C_INDIVIDUAL_CONSUMER',
    outboundChannels: ['PHONE_VOICE', 'SMS_WHATSAPP'],
    hasCheckedDncRegistry: false,
    hasFunctionalUnsubscribeMechanism: true
  });
  assert.strictEqual(b2cViolation.isFullyCompliant, false);
  assert.strictEqual(b2cViolation.bciExemptionApplies, false);
  assert.strictEqual(b2cViolation.complianceBreaches.some(b => b.code === 'PDPA_DNC_REGISTRY_CHECK_MISSING'), true);
  console.log("  ✅ PDPA DNC: Consumer telemarketing without 21-day DNC check penalized.");

  // 3c. Spam Control Act Breach (Email missing functional unsubscribe facility)
  const spamViolation = evaluateSingaporeOutboundCadence({
    recipientType: 'B2B_CORPORATE_CAPACITY',
    outboundChannels: ['EMAIL'],
    hasFunctionalUnsubscribeMechanism: false,
    hasClearSenderIdentity: true
  });
  assert.strictEqual(spamViolation.statutoryAudit.isSpamControlActCompliant, false);
  assert.strictEqual(spamViolation.complianceBreaches.some(b => b.code === 'SPAM_CONTROL_ACT_UNSUBSCRIBE_MISSING'), true);
  console.log("  ✅ Spam Control Act: Section 11 mandatory unsubscribe enforcement verified.");

  // ===============================================================
  // 4. Singapore Social Campaign & Influencer ROI Engine
  // ===============================================================
  console.log("  [4/7] Testing Singapore Social Campaign Engine (SGT Optimal Timing & Budget Allocation)...");

  // 4a. LinkedIn B2B Corporate Campaign (S$10,000 budget, MICRO creator tier)
  const linkedinCampaign = planSingaporeSocialCampaign({
    platform: 'LINKEDIN',
    campaignGoal: 'B2B_LEAD_GEN',
    allocatedBudgetSgd: 10000,
    influencerTier: 'MICRO',
    plannedPostCount: 4
  });
  assert.strictEqual(linkedinCampaign.totalBudgetSgd, 10000);
  assert.strictEqual(linkedinCampaign.budgetBreakdownSgd.creatorPartnerships, 4000); // 40%
  assert.strictEqual(linkedinCampaign.budgetBreakdownSgd.paidMediaAmplification, 4500); // 45%
  assert.strictEqual(linkedinCampaign.budgetBreakdownSgd.creativeProduction, 1500); // 15%
  assert.strictEqual(linkedinCampaign.optimalSingaporeTimingWindows.some(w => w.slot === 'CBD Lunch Hour'), true);
  assert.strictEqual(linkedinCampaign.performanceProjections.projectedImpressions > 0, true);
  console.log("  ✅ Social Campaign: LinkedIn SGT CBD timing and budget split audited.");

  // 4b. Instagram Consumer Campaign (S$5,000 budget, NANO tier)
  const igCampaign = planSingaporeSocialCampaign({
    platform: 'INSTAGRAM',
    campaignGoal: 'BRAND_AWARENESS',
    allocatedBudgetSgd: 5000,
    influencerTier: 'NANO'
  });
  assert.strictEqual(igCampaign.influencerStrategy.selectedTier, 'NANO');
  assert.strictEqual(igCampaign.influencerStrategy.benchmarkEngagementRatePercent, 4.5);
  assert.strictEqual(igCampaign.optimalSingaporeTimingWindows.some(w => w.slot === 'Evening Commute'), true);
  console.log("  ✅ Social Campaign: Instagram commuter window and Nano engagement rate verified.");

  // ===============================================================
  // 5. Singapore B2B Lead Scoring & Qualification Engine
  // ===============================================================
  console.log("  [5/7] Testing Singapore B2B Lead Scoring & ICP Qualification Engine...");

  // 5a. Tier 1 Enterprise Lead (S$2M paid-up capital, GST registered, 300 employees, FinTech, C-Suite, Budget confirmed)
  const enterpriseLead = scoreSingaporeB2bLead({
    companyPaidUpCapitalSgd: 2000000,
    isGstRegisteredInIras: true,
    employeeHeadcount: 300,
    ssicSector: 'FINANCIAL_SERVICES',
    decisionMakerSeniority: 'C_SUITE',
    isBudgetConfirmed: true,
    timelineUrgencyMonths: 2
  });
  assert.strictEqual(enterpriseLead.leadScore >= 80, true);
  assert.strictEqual(enterpriseLead.leadTier, 'TIER_1_ENTERPRISE_PRIORITY');
  assert.strictEqual(enterpriseLead.isIcpQualified, true);
  assert.strictEqual(enterpriseLead.recommendedSalesMotion, 'SENIOR_ACCOUNT_EXECUTIVE_OUTBOUND_AND_CUSTOM_POC');
  console.log("  ✅ Lead Scoring: Tier 1 Enterprise priority qualification confirmed.");

  // 5b. Unqualified Low Intent Lead (S$5k capital, non-GST, 3 employees, Individual Contributor, No budget)
  const lowIntentLead = scoreSingaporeB2bLead({
    companyPaidUpCapitalSgd: 5000,
    isGstRegisteredInIras: false,
    employeeHeadcount: 3,
    ssicSector: 'RETAIL_TRADE',
    decisionMakerSeniority: 'INDIVIDUAL_CONTRIBUTOR',
    isBudgetConfirmed: false,
    timelineUrgencyMonths: 12
  });
  assert.strictEqual(lowIntentLead.leadScore < 40, true);
  assert.strictEqual(lowIntentLead.leadTier, 'UNQUALIFIED_LOW_INTENT');
  assert.strictEqual(lowIntentLead.isIcpQualified, false);
  console.log("  ✅ Lead Scoring: Low-intent unqualified lead filtering confirmed.");

  // ===============================================================
  // 6. Singapore Paid Media Ads ROI & 9% GST Impact Engine
  // ===============================================================
  console.log("  [6/7] Testing Singapore Paid Ads ROI & 9% GST Input Tax Deduction Engine...");

  // 6a. GST-Registered Corporate (9% GST is claimable as Input Tax on Form F5)
  const gstRegisteredAds = calculateSingaporeAdsRoi({
    adSpendExcludingGstSgd: 20000,
    acquiredCustomersCount: 50,
    totalAttributedRevenueSgd: 120000,
    customerLifespanMonths: 12,
    monthlyGrossMarginPerCustomerSgd: 300,
    isB2bGstRegistered: true
  });
  assert.strictEqual(gstRegisteredAds.mediaSpendTaxBreakdownSgd.baseAdSpendBeforeGst, 20000);
  assert.strictEqual(gstRegisteredAds.mediaSpendTaxBreakdownSgd.statutory9PercentGst, 1800);
  assert.strictEqual(gstRegisteredAds.mediaSpendTaxBreakdownSgd.grossTotalAdSpend, 21800);
  assert.strictEqual(gstRegisteredAds.mediaSpendTaxBreakdownSgd.isGstClaimableAsInputTax, true);
  assert.strictEqual(gstRegisteredAds.mediaSpendTaxBreakdownSgd.effectiveNetAdCost, 20000);
  assert.strictEqual(gstRegisteredAds.acquisitionMetrics.blendedCacSgd, 400); // 20,000 / 50
  assert.strictEqual(gstRegisteredAds.acquisitionMetrics.customerLtvSgd, 3600); // 12 * 300
  assert.strictEqual(gstRegisteredAds.acquisitionMetrics.ltvToCacRatio, 9.0); // 3600 / 400
  assert.strictEqual(gstRegisteredAds.performanceRatios.returnOnAdSpendRoas, 6.0); // 120,000 / 20,000
  assert.strictEqual(gstRegisteredAds.performanceRatios.marketingEfficiencyTier, 'HEALTHY_SCALABLE_UNIT_ECONOMICS');
  console.log("  ✅ Ads ROI: GST Input Tax credit recovery and unit economics verified.");

  // 6b. Non-GST Registered SME (9% GST is a sunk non-creditable operational expense)
  const nonGstAds = calculateSingaporeAdsRoi({
    adSpendExcludingGstSgd: 10000,
    acquiredCustomersCount: 10,
    totalAttributedRevenueSgd: 20000,
    customerLifespanMonths: 6,
    monthlyGrossMarginPerCustomerSgd: 150,
    isB2bGstRegistered: false
  });
  assert.strictEqual(nonGstAds.mediaSpendTaxBreakdownSgd.effectiveNetAdCost, 10900); // Base + 9% GST
  assert.strictEqual(nonGstAds.mediaSpendTaxBreakdownSgd.isGstClaimableAsInputTax, false);
  assert.strictEqual(nonGstAds.acquisitionMetrics.blendedCacSgd, 1090); // 10,900 / 10
  assert.strictEqual(nonGstAds.acquisitionMetrics.customerLtvSgd, 900); // 6 * 150
  assert.strictEqual(nonGstAds.acquisitionMetrics.ltvToCacRatio, 0.83); // 900 / 1090
  assert.strictEqual(nonGstAds.performanceRatios.marketingEfficiencyTier, 'UNSUSTAINABLE_CASH_DRAIN');
  console.log("  ✅ Ads ROI: Non-creditable GST burden and unsustainable unit economics audited.");

  // ===============================================================
  // 7. Singapore Brand Positioning & Trust Equity Engine
  // ===============================================================
  console.log("  [7/7] Testing Singapore Brand Positioning & Trust Equity Index Engine (IPOS, Green Plan)...");

  // 7a. Premium Category Leader (IPOS Trademark, Green Plan 2030, Made With Passion, 3 Differentiators)
  const leaderBrand = evaluateSingaporeBrandPositioning({
    brandName: 'SingaTrust Enterprise',
    targetSegment: 'REGIONAL_ENTERPRISE',
    priceTier: 'PREMIUM_LUXURY',
    coreDifferentiators: [
      'Mesin kepatuhan deterministik 64 engine tanpa dependensi eksternal',
      'Integrasi menyeluruh standar statuter ACRA, IRAS, MOM, dan MAS',
      'Keamanan kernel sandbox berstandar isolasi enterprise Singapura'
    ],
    hasRegisteredIposTrademark: true,
    alignsWithGreenPlan2030: true,
    hasMadeWithPassionEndorsement: true
  });
  assert.strictEqual(leaderBrand.positioningCoordinates.perceivedPremiumX, 8.0);
  assert.strictEqual(leaderBrand.positioningCoordinates.innovationIntensityY > 0, true);
  assert.strictEqual(leaderBrand.positioningQuadrant, 'PREMIUM_INNOVATOR_CATEGORY_LEADER');
  assert.strictEqual(leaderBrand.singaporeTrustEquity.singaporeTrustIndex, 100);
  assert.strictEqual(leaderBrand.singaporeTrustEquity.defensibilityTier, 'HIGH_STRATEGIC_DEFENSIBILITY');
  assert.strictEqual(typeof leaderBrand.valuePropositionAudit.valuePropositionStatement, 'string');
  console.log("  ✅ Brand Positioning: Premium category leader and 100 Trust Index audited.");

  // 7b. Economy Accessible Brand (No IPOS, No Green Plan, Commoditized)
  const economyBrand = evaluateSingaporeBrandPositioning({
    brandName: 'BudgetTrading SG',
    targetSegment: 'SME_CORPORATE',
    priceTier: 'ECONOMY_ACCESSIBLE',
    coreDifferentiators: [],
    hasRegisteredIposTrademark: false,
    alignsWithGreenPlan2030: false,
    hasMadeWithPassionEndorsement: false
  });
  assert.strictEqual(economyBrand.positioningCoordinates.perceivedPremiumX, -7.0);
  assert.strictEqual(economyBrand.positioningQuadrant, 'COMMODITIZED_MASS_MARKET');
  assert.strictEqual(economyBrand.singaporeTrustEquity.defensibilityTier, 'LOW_VULNERABLE_TO_REGIONAL_SUBSTITUTES');
  console.log("  ✅ Brand Positioning: Commoditized economy position and low defensibility verified.");

  console.log("\n✅ All 7 Singapore Marketing & Growth Domain Engine Tests Passed 100%!");
}

runMarketingEnginesTests();
