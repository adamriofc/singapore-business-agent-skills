/**
 * Singapore Multi-Platform Social Campaign Engine (`engines/sg-social-campaign-engine.js`)
 *
 * Implements deterministic campaign scheduling and budget allocation algorithms
 * optimized for Singapore social media platforms and commuter engagement patterns:
 *   - Platforms: LinkedIn Singapore, Instagram SG, TikTok SG, Lemon8 SG.
 *   - Singapore peak commuter transit and CBD lunch hour timing (UTC+8 / SGT).
 *   - Local influencer tier pricing benchmarks (Nano, Micro, Mid-Tier, Macro).
 *   - Deterministic reach, engagement rate, and click-through projections.
 *
 * DOCTRINE: Pure numerical computation and deterministic campaign modeling.
 * ZERO external dependencies. Pure Node.js.
 */

'use strict';

const SUPPORTED_PLATFORMS = ['LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'LEMON8'];
const INFLUENCER_TIERS = ['NANO', 'MICRO', 'MID_TIER', 'MACRO'];

/**
 * Plans a social campaign in Singapore with timing windows and performance projections.
 *
 * @param {Object} input
 * @param {string} input.platform - 'LINKEDIN', 'INSTAGRAM', 'TIKTOK', 'LEMON8'
 * @param {string} [input.campaignGoal='BRAND_AWARENESS'] - 'B2B_LEAD_GEN', 'BRAND_AWARENESS', 'PRODUCT_LAUNCH', 'TALENT_RECRUITMENT'
 * @param {number} input.allocatedBudgetSgd - Total campaign media & creator budget in SGD
 * @param {string} [input.influencerTier='MICRO'] - 'NANO', 'MICRO', 'MID_TIER', 'MACRO'
 * @param {number} [input.plannedPostCount=4] - Number of planned organic/paid posts
 * @returns {Object} Deterministic campaign schedule, optimal SGT windows, and KPI projections
 */
function planSingaporeSocialCampaign(input = {}) {
  if (!input || typeof input !== 'object') {
    throw new Error("INVALID_INPUT: Input must be a valid configuration object");
  }

  const platform = String(input.platform || 'LINKEDIN').toUpperCase().trim();
  if (!SUPPORTED_PLATFORMS.includes(platform)) {
    throw new Error(`INVALID_INPUT: 'platform' must be one of [${SUPPORTED_PLATFORMS.join(', ')}] (got '${input.platform}')`);
  }

  const budget = Math.max(0, Number(input.allocatedBudgetSgd) || 0);
  if (budget <= 0) {
    throw new Error("INVALID_INPUT: 'allocatedBudgetSgd' must be a positive number greater than zero");
  }

  const goal = String(input.campaignGoal || 'BRAND_AWARENESS').toUpperCase().trim();
  const tier = String(input.influencerTier || 'MICRO').toUpperCase().trim();
  const posts = Math.max(1, Math.min(20, Math.floor(Number(input.plannedPostCount) || 4)));

  // 1. SGT Optimal Timing Windows based on Singapore Commuter & Work Routine
  let optimalTimingWindows = [];
  let primaryAudience = '';

  switch (platform) {
    case 'LINKEDIN':
      primaryAudience = 'Singapore corporate professionals, C-suite, tech and finance executives';
      optimalTimingWindows = [
        { slot: 'Morning Commute', timeSgt: '07:45 - 08:30 SGT', rationale: 'North-South / East-West MRT line transit reading' },
        { slot: 'CBD Lunch Hour', timeSgt: '12:00 - 13:15 SGT', rationale: 'Peak mobile browsing during Raffles Place/Tanjong Pagar dining' },
        { slot: 'Pre-EOD Catchup', timeSgt: '17:30 - 18:15 SGT', rationale: 'Wrapping corporate emails and evening wrap-up' }
      ];
      break;
    case 'INSTAGRAM':
      primaryAudience = 'Young working adults, lifestyle consumers, F&B and retail enthusiasts';
      optimalTimingWindows = [
        { slot: 'CBD Lunch', timeSgt: '12:30 - 13:30 SGT', rationale: 'Mid-day visual feed check' },
        { slot: 'Evening Commute', timeSgt: '18:15 - 19:30 SGT', rationale: 'Post-work MRT & bus transit' },
        { slot: 'Night Leisure', timeSgt: '21:00 - 22:30 SGT', rationale: 'Home relaxation and Stories/Reels browsing' }
      ];
      break;
    case 'TIKTOK':
    case 'LEMON8':
      primaryAudience = 'Gen Z, millennial creators, beauty, foodies, and lifestyle shoppers';
      optimalTimingWindows = [
        { slot: 'Afternoon Tea', timeSgt: '15:30 - 16:30 SGT', rationale: 'Afternoon break browsing' },
        { slot: 'Evening Prime', timeSgt: '20:00 - 22:45 SGT', rationale: 'Peak algorithmic video consumption hours in Singapore' }
      ];
      break;
  }

  // 2. Local Creator Tier Benchmarks
  let benchmarkCostPerCreatorSgd = 500;
  let benchmarkEngagementRate = 0.028;

  switch (tier) {
    case 'NANO':
      benchmarkCostPerCreatorSgd = 250;
      benchmarkEngagementRate = 0.045; // 4.5%
      break;
    case 'MICRO':
      benchmarkCostPerCreatorSgd = 650;
      benchmarkEngagementRate = 0.028; // 2.8%
      break;
    case 'MID_TIER':
      benchmarkCostPerCreatorSgd = 2200;
      benchmarkEngagementRate = 0.018; // 1.8%
      break;
    case 'MACRO':
      benchmarkCostPerCreatorSgd = 6000;
      benchmarkEngagementRate = 0.012; // 1.2%
      break;
  }

  // 3. Budget Allocation Breakdown (40% Creator, 45% Paid Boost / Ad Spend, 15% Production)
  const creatorBudgetSgd = Math.round(budget * 0.40);
  const paidAmplificationBudgetSgd = Math.round(budget * 0.45);
  const productionBudgetSgd = Math.round(budget * 0.15);

  const creatorsAfforded = Math.max(1, Math.floor(creatorBudgetSgd / benchmarkCostPerCreatorSgd));

  // 4. Projection Metrics
  // Blended CPM in Singapore: ~S$12.50 for Meta/IG, ~S$18.00 for LinkedIn, ~S$8.00 for TikTok
  let cpmSgd = 12.50;
  if (platform === 'LINKEDIN') cpmSgd = 22.00;
  else if (platform === 'TIKTOK') cpmSgd = 8.50;

  const paidImpressions = Math.round((paidAmplificationBudgetSgd / cpmSgd) * 1000);
  const organicCreatorImpressions = creatorsAfforded * 8000;
  const totalProjectedImpressions = paidImpressions + organicCreatorImpressions;

  const totalProjectedEngagements = Math.round(totalProjectedImpressions * benchmarkEngagementRate);
  const estimatedClicks = Math.round(totalProjectedImpressions * 0.012); // ~1.2% CTR in SG

  return {
    platform,
    campaignGoal: goal,
    totalBudgetSgd: budget,
    budgetBreakdownSgd: {
      creatorPartnerships: creatorBudgetSgd,
      paidMediaAmplification: paidAmplificationBudgetSgd,
      creativeProduction: productionBudgetSgd
    },
    influencerStrategy: {
      selectedTier: tier,
      estimatedCreatorsEngaged: creatorsAfforded,
      benchmarkEngagementRatePercent: Number((benchmarkEngagementRate * 100).toFixed(2))
    },
    performanceProjections: {
      projectedImpressions: totalProjectedImpressions,
      projectedEngagements: totalProjectedEngagements,
      projectedClickThroughs: estimatedClicks,
      effectiveCostPerEngagementSgd: totalProjectedEngagements > 0 ? Number((budget / totalProjectedEngagements).toFixed(2)) : 0
    },
    optimalSingaporeTimingWindows: optimalTimingWindows,
    targetAudienceSummary: primaryAudience
  };
}

module.exports = {
  planSingaporeSocialCampaign,
  SUPPORTED_PLATFORMS,
  INFLUENCER_TIERS
};
