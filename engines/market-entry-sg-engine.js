/**
 * Singapore Market Entry & Regional Expansion Engine (`engines/market-entry-sg-engine.js`)
 *
 * Implements deterministic corporate market entry and regional HQ structuring evaluations
 * based on Singapore ACRA, EnterpriseSG, EDB, and IRAS statutory frameworks:
 *   - Entity Vehicle Selection (Private Limited Subsidiary vs Branch Office vs Representative Office).
 *   - Tax incentive eligibility and statutory structure differences (Companies Act Cap. 50 vs Section 368).
 *   - Section 10L Economic Substance Test (adequacy of local headcount and operating expenditure).
 *   - ASEAN Regional Expansion & Free Trade Agreement (FTA/RCEP/CPTPP) routing analysis.
 *
 * DOCTRINE: Pure numerical computation and statutory formula evaluation.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SUPPORTED_VEHICLES = ['SUBSIDIARY', 'BRANCH', 'REPRESENTATIVE_OFFICE'];

const ASEAN_MEMBERS = ['ID', 'MY', 'TH', 'VN', 'PH', 'BN', 'KH', 'LA', 'MM'];

/**
 * Evaluates market entry structure, statutory setup requirements, and regional routing.
 *
 * @param {Object} input
 * @param {string} input.targetStructure - 'SUBSIDIARY', 'BRANCH', 'REPRESENTATIVE_OFFICE'
 * @param {string} [input.parentJurisdiction='FOREIGN'] - Parent company incorporation jurisdiction
 * @param {number} [input.projectedAnnualRevenueSgd=1000000] - Projected Singapore entity annual revenue
 * @param {number} [input.projectedLocalOperatingExpensesSgd=200000] - Projected annual local OpEx
 * @param {number} [input.projectedLocalHeadcount=3] - Number of full-time staff based in Singapore
 * @param {boolean} [input.plansRegionalExpansion=true] - Whether Singapore entity acts as regional hub
 * @param {string[]} [input.targetAseanMarkets=[]] - Array of ISO country codes in ASEAN
 * @param {boolean} [input.holdsForeignIntellectualPropertyOrShares=false] - Section 10L foreign asset holding flag
 * @returns {Object} Deterministic market entry and statutory feasibility report
 */
function evaluateMarketEntrySg(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const structure = String(input.targetStructure || 'SUBSIDIARY').toUpperCase().trim();
  if (!SUPPORTED_VEHICLES.includes(structure)) {
    throw new Error(`INVALID_INPUT: 'targetStructure' must be one of [${SUPPORTED_VEHICLES.join(', ')}] (got '${input.targetStructure}')`);
  }

  const revenue = Math.max(0, Number(input.projectedAnnualRevenueSgd) || 0);
  const opex = Math.max(0, Number(input.projectedLocalOperatingExpensesSgd) || 0);
  const headcount = Math.max(0, Math.floor(Number(input.projectedLocalHeadcount) || 0));
  const parentJurisdiction = String(input.parentJurisdiction || 'FOREIGN').trim();
  const plansRegional = Boolean(input.plansRegionalExpansion);
  const targetMarkets = Array.isArray(input.targetAseanMarkets)
    ? input.targetAseanMarkets.map(m => String(m).toUpperCase().trim())
    : [];
  const holdsForeignAssets = Boolean(input.holdsForeignIntellectualPropertyOrShares);

  // 1. Vehicle Characteristic & Statutory Feasibility
  let isLegallyPermittedForCommercialRevenue = true;
  let limitedLiabilityProtection = false;
  let qualifiesForStartupTaxExemption = false;
  let requiredLocalOfficers = [];
  let acraRegistrationForm = '';

  if (structure === 'SUBSIDIARY') {
    limitedLiabilityProtection = true;
    qualifiesForStartupTaxExemption = true;
    requiredLocalOfficers = [
      'At least 1 Ordinarily Resident Director (Singapore Citizen, PR, or EntrePass/EP)',
      'At least 1 Company Secretary ordinarily resident in Singapore (Section 171)'
    ];
    acraRegistrationForm = 'ACRA BizFile+ Incorporation of Singapore Private Limited Company (Pte. Ltd.)';
  } else if (structure === 'BRANCH') {
    limitedLiabilityProtection = false; // Parent company absorbs all legal liability
    qualifiesForStartupTaxExemption = false; // Branches do not qualify for S.43 startup exemption
    requiredLocalOfficers = [
      'At least 1 Authorized Representative resident in Singapore (Section 368 Companies Act)'
    ];
    acraRegistrationForm = 'ACRA BizFile+ Registration of Foreign Company Branch in Singapore';
  } else if (structure === 'REPRESENTATIVE_OFFICE') {
    isLegallyPermittedForCommercialRevenue = false; // RO cannot engage in commercial trading or invoicing
    limitedLiabilityProtection = false;
    qualifiesForStartupTaxExemption = false;
    requiredLocalOfficers = [
      '1 Chief Representative appointed by foreign parent headquarters'
    ];
    acraRegistrationForm = 'Enterprise Singapore (EnterpriseSG) Representative Office Registration (Max 3-year validity)';
  }

  // 2. Commercial Compliance Audit
  const blockers = [];
  if (structure === 'REPRESENTATIVE_OFFICE' && revenue > 0) {
    blockers.push({
      code: 'REPRESENTATIVE_OFFICE_COMMERCIAL_VIOLATION',
      severity: 'CRITICAL',
      issue: 'Representative Offices in Singapore are strictly prohibited from revenue-generating commercial trading or issuing client invoices under EnterpriseSG statutory guidelines.'
    });
  }

  // 3. Section 10L Economic Substance Evaluation (for foreign asset holding / regional hub)
  let economicSubstanceStatus = 'NOT_APPLICABLE';
  let passesEconomicSubstance = true;
  if (holdsForeignAssets || plansRegional) {
    // S.10L requirements: adequate headcount (>= 2 local professionals) and adequate OpEx (>= S$100,000)
    const hasAdequateHeadcount = headcount >= 2;
    const hasAdequateOpex = opex >= 100000;

    if (hasAdequateHeadcount && hasAdequateOpex) {
      economicSubstanceStatus = 'SATISFIES_ECONOMIC_SUBSTANCE_REQUIREMENTS';
      passesEconomicSubstance = true;
    } else {
      economicSubstanceStatus = 'SUBSTANCE_DEFICIENT_RISK_UNDER_SECTION_10L';
      passesEconomicSubstance = false;
      blockers.push({
        code: 'SECTION_10L_ECONOMIC_SUBSTANCE_DEFICIENCY',
        severity: 'HIGH',
        issue: `Singapore regional entity holds foreign assets or coordinates regional entities but has ${headcount} staff (min 2 recommended) and S$${opex.toLocaleString()} local OpEx (min S$100,000 recommended), risking foreign asset disposal gains being deemed taxable under Section 10L.`
      });
    }
  }

  // 4. Regional Trade & FTA Reach Assessment
  const validAseanMarkets = targetMarkets.filter(m => ASEAN_MEMBERS.includes(m));
  const ftaAgreementsApplicable = [
    'ASEAN Trade in Goods Agreement (ATIGA)',
    'Regional Comprehensive Economic Partnership (RCEP)',
    'Comprehensive and Progressive Agreement for Trans-Pacific Partnership (CPTPP)'
  ];

  const overallFeasibilityScore = Math.max(0, 100 - (blockers.length * 35));
  const isApprovedForMarketEntry = blockers.filter(b => b.severity === 'CRITICAL').length === 0;

  return {
    targetStructure: structure,
    parentJurisdiction,
    isApprovedForMarketEntry,
    feasibilityScore: overallFeasibilityScore,
    statutoryProfile: {
      isLegallyPermittedForCommercialRevenue,
      limitedLiabilityProtection,
      qualifiesForStartupTaxExemption,
      requiredLocalOfficers,
      acraRegistrationForm
    },
    economicSubstanceEvaluation: {
      holdsForeignAssetsOrActsAsRegionalHub: holdsForeignAssets || plansRegional,
      projectedLocalHeadcount: headcount,
      projectedLocalOperatingExpensesSgd: opex,
      passesEconomicSubstance,
      economicSubstanceStatus
    },
    regionalHubRouting: {
      plansRegionalExpansion: plansRegional,
      targetAseanMarketsCount: validAseanMarkets.length,
      targetAseanMarkets: validAseanMarkets,
      applicableFtaFrameworks: ftaAgreementsApplicable
    },
    totalComplianceBlockers: blockers.length,
    complianceBlockers: blockers,
    statutoryNote: isApprovedForMarketEntry
      ? "Struktur pasar Singapura yang dipilih memenuhi parameter kepatuhan statuter ACRA dan IRAS."
      : "Ditemukan pelanggaran statuter krusial. Struktur entitas harus disesuaikan sebelum pengajuan izin ACRA/EnterpriseSG."
  };
}

module.exports = {
  evaluateMarketEntrySg,
  SUPPORTED_VEHICLES
};
