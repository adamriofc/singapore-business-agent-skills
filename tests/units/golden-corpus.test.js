'use strict';

const assert = require('assert');
const engines = require('../../index.js');

function runCase(engineName, input) {
  const fn = engines[engineName];
  if (typeof fn !== 'function') throw new Error('Missing engine: ' + engineName);
  let res;
  if (engineName === 'calculateSingaporeGstRate') {
    res = fn(input.dateStr);
  } else {
    res = fn(input);
  }
  const flattened = {};
  if (typeof res === 'number') {
    flattened.rate = res;
    flattened.value = res;
    flattened.result = res;
    flattened.npvSgd = res;
    flattened.irr = res;
    flattened.forwardRate = res;
    return flattened;
  }
  function recurse(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
    for (const [k, v] of Object.entries(obj)) {
      if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
        recurse(v);
      } else {
        flattened[k] = v;
      }
    }
  }
  recurse(res);
  return flattened;
}

function runGoldenCorpusTests() {
  console.log('🇸🇬 Running 130 Golden Corpus Static Verification Tests across 6 Domains...\n');
  // ==========================================
  // Domain: tax-sg (25 cases)
  // ==========================================
  console.log('  📂 Testing tax-sg golden cases...');
  { // Case: CIT-STARTUP-YA2024
    const input = {"chargeableIncome":200000,"isQualifyingStartup":true,"yearOfAssessment":2024};
    const res1 = runCase("calculateSingaporeCit", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CIT-STARTUP-YA2024');
    assert.ok(typeof res1["chargeableIncomeSgd"] === 'number' && Math.abs(res1["chargeableIncomeSgd"] - 200000) <= 0.0001, 'CIT-STARTUP-YA2024 numeric chargeableIncomeSgd expected 200000');
    assert.ok(typeof res1["totalExemptIncomeSgd"] === 'number' && Math.abs(res1["totalExemptIncomeSgd"] - 125000) <= 0.0001, 'CIT-STARTUP-YA2024 numeric totalExemptIncomeSgd expected 125000');
    assert.ok(typeof res1["taxBeforeRebateSgd"] === 'number' && Math.abs(res1["taxBeforeRebateSgd"] - 12750) <= 0.0001, 'CIT-STARTUP-YA2024 numeric taxBeforeRebateSgd expected 12750');
    assert.ok(typeof res1["citRebateSgd"] === 'number' && Math.abs(res1["citRebateSgd"] - 6375) <= 0.0001, 'CIT-STARTUP-YA2024 numeric citRebateSgd expected 6375');
    assert.ok(typeof res1["netTaxPayableSgd"] === 'number' && Math.abs(res1["netTaxPayableSgd"] - 6375) <= 0.0001, 'CIT-STARTUP-YA2024 numeric netTaxPayableSgd expected 6375');
    assert.ok(typeof res1["effectiveTaxRatePercent"] === 'number' && Math.abs(res1["effectiveTaxRatePercent"] - 3.19) <= 0.0001, 'CIT-STARTUP-YA2024 numeric effectiveTaxRatePercent expected 3.19');
    const res2 = runCase("calculateSingaporeCit", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CIT-STARTUP-YA2024');
    const res3 = runCase("calculateSingaporeCit", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CIT-STARTUP-YA2024');
  }
  { // Case: CIT-PARTIAL-YA2024
    const input = {"chargeableIncome":300000,"isQualifyingStartup":false,"yearOfAssessment":2024};
    const res1 = runCase("calculateSingaporeCit", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CIT-PARTIAL-YA2024');
    assert.ok(typeof res1["totalExemptIncomeSgd"] === 'number' && Math.abs(res1["totalExemptIncomeSgd"] - 102500) <= 0.0001, 'CIT-PARTIAL-YA2024 numeric totalExemptIncomeSgd expected 102500');
    assert.ok(typeof res1["taxBeforeRebateSgd"] === 'number' && Math.abs(res1["taxBeforeRebateSgd"] - 33575) <= 0.0001, 'CIT-PARTIAL-YA2024 numeric taxBeforeRebateSgd expected 33575');
    assert.ok(typeof res1["citRebateSgd"] === 'number' && Math.abs(res1["citRebateSgd"] - 16787.5) <= 0.0001, 'CIT-PARTIAL-YA2024 numeric citRebateSgd expected 16787.5');
    assert.ok(typeof res1["netTaxPayableSgd"] === 'number' && Math.abs(res1["netTaxPayableSgd"] - 16787.5) <= 0.0001, 'CIT-PARTIAL-YA2024 numeric netTaxPayableSgd expected 16787.5');
    const res2 = runCase("calculateSingaporeCit", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CIT-PARTIAL-YA2024');
    const res3 = runCase("calculateSingaporeCit", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CIT-PARTIAL-YA2024');
  }
  { // Case: CIT-LOSS-MAKING
    const input = {"chargeableIncome":0,"isQualifyingStartup":false,"yearOfAssessment":2024};
    const res1 = runCase("calculateSingaporeCit", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CIT-LOSS-MAKING');
    assert.ok(typeof res1["chargeableIncomeSgd"] === 'number' && Math.abs(res1["chargeableIncomeSgd"] - 0) <= 0.0001, 'CIT-LOSS-MAKING numeric chargeableIncomeSgd expected 0');
    assert.ok(typeof res1["netTaxPayableSgd"] === 'number' && Math.abs(res1["netTaxPayableSgd"] - 0) <= 0.0001, 'CIT-LOSS-MAKING numeric netTaxPayableSgd expected 0');
    assert.ok(typeof res1["effectiveTaxRatePercent"] === 'number' && Math.abs(res1["effectiveTaxRatePercent"] - 0) <= 0.0001, 'CIT-LOSS-MAKING numeric effectiveTaxRatePercent expected 0');
    const res2 = runCase("calculateSingaporeCit", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CIT-LOSS-MAKING');
    const res3 = runCase("calculateSingaporeCit", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CIT-LOSS-MAKING');
  }
  { // Case: GST-RATE-2024
    const input = {"dateStr":"2024-01-01"};
    const res1 = runCase("calculateSingaporeGstRate", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for GST-RATE-2024');
    assert.ok(typeof res1["rate"] === 'number' && Math.abs(res1["rate"] - 0.09) <= 0.0001, 'GST-RATE-2024 numeric rate expected 0.09');
    const res2 = runCase("calculateSingaporeGstRate", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for GST-RATE-2024');
    const res3 = runCase("calculateSingaporeGstRate", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for GST-RATE-2024');
  }
  { // Case: GST-REG-RETROSPECTIVE
    const input = {"past4QuartersTurnover":[300000,300000,300000,300000],"projectedNext12MonthsTurnover":50000};
    const res1 = runCase("evaluateGstRegistrationLiability", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for GST-REG-RETROSPECTIVE');
    assert.strictEqual(res1["isCompulsoryRegistrationRequired"], true, 'GST-REG-RETROSPECTIVE value isCompulsoryRegistrationRequired mismatch');
    assert.strictEqual(res1["retrospectiveBreach"], true, 'GST-REG-RETROSPECTIVE value retrospectiveBreach mismatch');
    assert.strictEqual(res1["prospectiveBreach"], false, 'GST-REG-RETROSPECTIVE value prospectiveBreach mismatch');
    const res2 = runCase("evaluateGstRegistrationLiability", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for GST-REG-RETROSPECTIVE');
    const res3 = runCase("evaluateGstRegistrationLiability", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for GST-REG-RETROSPECTIVE');
  }
  { // Case: GST-FILING-9PCT
    const input = {"standardRatedSuppliesSgd":500000,"taxablePurchasesSgd":200000,"importedB2bServicesSgd":50000,"effectiveRate":0.09};
    const res1 = runCase("calculateGstFiling", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for GST-FILING-9PCT');
    assert.ok(typeof res1["outputTaxStandardSgd"] === 'number' && Math.abs(res1["outputTaxStandardSgd"] - 45000) <= 0.0001, 'GST-FILING-9PCT numeric outputTaxStandardSgd expected 45000');
    assert.ok(typeof res1["reverseChargeOutputTaxSgd"] === 'number' && Math.abs(res1["reverseChargeOutputTaxSgd"] - 4500) <= 0.0001, 'GST-FILING-9PCT numeric reverseChargeOutputTaxSgd expected 4500');
    assert.ok(typeof res1["totalOutputTaxSgd"] === 'number' && Math.abs(res1["totalOutputTaxSgd"] - 49500) <= 0.0001, 'GST-FILING-9PCT numeric totalOutputTaxSgd expected 49500');
    assert.ok(typeof res1["totalInputTaxClaimedSgd"] === 'number' && Math.abs(res1["totalInputTaxClaimedSgd"] - 22500) <= 0.0001, 'GST-FILING-9PCT numeric totalInputTaxClaimedSgd expected 22500');
    assert.ok(typeof res1["netGstPayableSgd"] === 'number' && Math.abs(res1["netGstPayableSgd"] - 27000) <= 0.0001, 'GST-FILING-9PCT numeric netGstPayableSgd expected 27000');
    assert.strictEqual(res1["position"], "NET_PAYABLE_TO_IRAS", 'GST-FILING-9PCT value position mismatch');
    const res2 = runCase("calculateGstFiling", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for GST-FILING-9PCT');
    const res3 = runCase("calculateGstFiling", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for GST-FILING-9PCT');
  }
  { // Case: WHT-INTEREST-DOMESTIC
    const input = {"paymentType":"INTEREST","grossAmountSgd":100000};
    const res1 = runCase("calculateSingaporeWht", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for WHT-INTEREST-DOMESTIC');
    assert.ok(typeof res1["statutoryDomesticRate"] === 'number' && Math.abs(res1["statutoryDomesticRate"] - 0.15) <= 0.0001, 'WHT-INTEREST-DOMESTIC numeric statutoryDomesticRate expected 0.15');
    assert.ok(typeof res1["withholdingTaxPayableToIrasSgd"] === 'number' && Math.abs(res1["withholdingTaxPayableToIrasSgd"] - 15000) <= 0.0001, 'WHT-INTEREST-DOMESTIC numeric withholdingTaxPayableToIrasSgd expected 15000');
    assert.ok(typeof res1["netRemittanceToNonResidentSgd"] === 'number' && Math.abs(res1["netRemittanceToNonResidentSgd"] - 85000) <= 0.0001, 'WHT-INTEREST-DOMESTIC numeric netRemittanceToNonResidentSgd expected 85000');
    assert.strictEqual(res1["irasFormType"], "FORM_IR37", 'WHT-INTEREST-DOMESTIC value irasFormType mismatch');
    const res2 = runCase("calculateSingaporeWht", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for WHT-INTEREST-DOMESTIC');
    const res3 = runCase("calculateSingaporeWht", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for WHT-INTEREST-DOMESTIC');
  }
  { // Case: WHT-ROYALTY-DOMESTIC
    const input = {"paymentType":"ROYALTY","grossAmountSgd":80000};
    const res1 = runCase("calculateSingaporeWht", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for WHT-ROYALTY-DOMESTIC');
    assert.ok(typeof res1["statutoryDomesticRate"] === 'number' && Math.abs(res1["statutoryDomesticRate"] - 0.1) <= 0.0001, 'WHT-ROYALTY-DOMESTIC numeric statutoryDomesticRate expected 0.1');
    assert.ok(typeof res1["withholdingTaxPayableToIrasSgd"] === 'number' && Math.abs(res1["withholdingTaxPayableToIrasSgd"] - 8000) <= 0.0001, 'WHT-ROYALTY-DOMESTIC numeric withholdingTaxPayableToIrasSgd expected 8000');
    assert.ok(typeof res1["netRemittanceToNonResidentSgd"] === 'number' && Math.abs(res1["netRemittanceToNonResidentSgd"] - 72000) <= 0.0001, 'WHT-ROYALTY-DOMESTIC numeric netRemittanceToNonResidentSgd expected 72000');
    const res2 = runCase("calculateSingaporeWht", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for WHT-ROYALTY-DOMESTIC');
    const res3 = runCase("calculateSingaporeWht", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for WHT-ROYALTY-DOMESTIC');
  }
  { // Case: TAX-RESIDENCY-COR-QUALIFIED
    const input = {"companyName":"Merlion Tech Pte Ltd","totalBodMeetings":4,"bodMeetingsInSingapore":3,"strategicDecisionsInSingapore":true,"hasLocalResidentDirector":true,"hasPhysicalOfficeInSingapore":true,"localEmployeesCount":5,"isForeignControlled":true,"hasBonaFideCommercialReason":true};
    const res1 = runCase("evaluateTaxResidency", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-RESIDENCY-COR-QUALIFIED');
    assert.strictEqual(res1["isSingaporeTaxResident"], true, 'TAX-RESIDENCY-COR-QUALIFIED value isSingaporeTaxResident mismatch');
    assert.strictEqual(res1["qualifiesForCertificateOfResidence"], true, 'TAX-RESIDENCY-COR-QUALIFIED value qualifiesForCertificateOfResidence mismatch');
    assert.strictEqual(res1["centralManagementAndControlLocus"], "SINGAPORE", 'TAX-RESIDENCY-COR-QUALIFIED value centralManagementAndControlLocus mismatch');
    assert.strictEqual(res1["riskLevel"], "LOW", 'TAX-RESIDENCY-COR-QUALIFIED value riskLevel mismatch');
    const res2 = runCase("evaluateTaxResidency", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-RESIDENCY-COR-QUALIFIED');
    const res3 = runCase("evaluateTaxResidency", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-RESIDENCY-COR-QUALIFIED');
  }
  { // Case: TAX-RESIDENCY-FOREIGN-FAIL
    const input = {"companyName":"Passive Shell Pte Ltd","totalBodMeetings":4,"bodMeetingsInSingapore":2,"strategicDecisionsInSingapore":false,"hasLocalResidentDirector":false,"hasPhysicalOfficeInSingapore":false,"localEmployeesCount":0,"isForeignControlled":true,"hasBonaFideCommercialReason":false};
    const res1 = runCase("evaluateTaxResidency", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-RESIDENCY-FOREIGN-FAIL');
    assert.strictEqual(res1["isSingaporeTaxResident"], false, 'TAX-RESIDENCY-FOREIGN-FAIL value isSingaporeTaxResident mismatch');
    assert.strictEqual(res1["qualifiesForCertificateOfResidence"], false, 'TAX-RESIDENCY-FOREIGN-FAIL value qualifiesForCertificateOfResidence mismatch');
    assert.strictEqual(res1["riskLevel"], "HIGH", 'TAX-RESIDENCY-FOREIGN-FAIL value riskLevel mismatch');
    const res2 = runCase("evaluateTaxResidency", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-RESIDENCY-FOREIGN-FAIL');
    const res3 = runCase("evaluateTaxResidency", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-RESIDENCY-FOREIGN-FAIL');
  }
  { // Case: TAX-EIS-RND-IP
    const input = {"expenditures":{"RND_LOCAL":250000,"IP_REGISTRATION":50000},"optForCashConversion":false,"yearOfAssessment":2024};
    const res1 = runCase("calculateEnterpriseInnovationScheme", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-EIS-RND-IP');
    assert.ok(typeof res1["totalQualifyingSpendSgd"] === 'number' && Math.abs(res1["totalQualifyingSpendSgd"] - 300000) <= 0.0001, 'TAX-EIS-RND-IP numeric totalQualifyingSpendSgd expected 300000');
    assert.ok(typeof res1["totalTaxDeductionSgd"] === 'number' && Math.abs(res1["totalTaxDeductionSgd"] - 1200000) <= 0.0001, 'TAX-EIS-RND-IP numeric totalTaxDeductionSgd expected 1200000');
    assert.ok(typeof res1["estimatedTaxSavingsSgd"] === 'number' && Math.abs(res1["estimatedTaxSavingsSgd"] - 204000) <= 0.0001, 'TAX-EIS-RND-IP numeric estimatedTaxSavingsSgd expected 204000');
    const res2 = runCase("calculateEnterpriseInnovationScheme", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-EIS-RND-IP');
    const res3 = runCase("calculateEnterpriseInnovationScheme", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-EIS-RND-IP');
  }
  { // Case: TAX-EIS-CASH-PAYOUT
    const input = {"expenditures":{"RND_LOCAL":150000},"optForCashConversion":true};
    const res1 = runCase("calculateEnterpriseInnovationScheme", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-EIS-CASH-PAYOUT');
    assert.strictEqual(res1["isEligible"], true, 'TAX-EIS-CASH-PAYOUT value isEligible mismatch');
    assert.ok(typeof res1["cashPayoutSgd"] === 'number' && Math.abs(res1["cashPayoutSgd"] - 20000) <= 0.0001, 'TAX-EIS-CASH-PAYOUT numeric cashPayoutSgd expected 20000');
    assert.ok(typeof res1["maxPossiblePayoutSgd"] === 'number' && Math.abs(res1["maxPossiblePayoutSgd"] - 20000) <= 0.0001, 'TAX-EIS-CASH-PAYOUT numeric maxPossiblePayoutSgd expected 20000');
    const res2 = runCase("calculateEnterpriseInnovationScheme", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-EIS-CASH-PAYOUT');
    const res3 = runCase("calculateEnterpriseInnovationScheme", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-EIS-CASH-PAYOUT');
  }
  { // Case: TAX-LOSS-CARRY-BACK
    const input = {"currentYearLosses":150000,"currentYearCapitalAllowance":20000,"previousYearAssessableIncome":80000,"optForCarryBack":true};
    const res1 = runCase("evaluateLossUtilization", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-LOSS-CARRY-BACK');
    assert.ok(typeof res1["amountUtilizedSgd"] === 'number' && Math.abs(res1["amountUtilizedSgd"] - 80000) <= 0.0001, 'TAX-LOSS-CARRY-BACK numeric amountUtilizedSgd expected 80000');
    assert.ok(typeof res1["estimatedTaxRefundSgd"] === 'number' && Math.abs(res1["estimatedTaxRefundSgd"] - 13600) <= 0.0001, 'TAX-LOSS-CARRY-BACK numeric estimatedTaxRefundSgd expected 13600');
    assert.ok(typeof res1["closingUnabsorbedTradeLossesSgd"] === 'number' && Math.abs(res1["closingUnabsorbedTradeLossesSgd"] - 90000) <= 0.0001, 'TAX-LOSS-CARRY-BACK numeric closingUnabsorbedTradeLossesSgd expected 90000');
    const res2 = runCase("evaluateLossUtilization", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-LOSS-CARRY-BACK');
    const res3 = runCase("evaluateLossUtilization", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-LOSS-CARRY-BACK');
  }
  { // Case: TAX-LOSS-SCT-FAIL
    const input = {"currentYearTaxableProfit":100000,"priorYearUnabsorbedLosses":50000,"shareholdingContinuityPercent":30};
    const res1 = runCase("evaluateLossUtilization", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-LOSS-SCT-FAIL');
    assert.strictEqual(res1["passesShareholdingContinuityTest"], false, 'TAX-LOSS-SCT-FAIL value passesShareholdingContinuityTest mismatch');
    assert.ok(typeof res1["disallowedLossesSgd"] === 'number' && Math.abs(res1["disallowedLossesSgd"] - 50000) <= 0.0001, 'TAX-LOSS-SCT-FAIL numeric disallowedLossesSgd expected 50000');
    assert.ok(typeof res1["netChargeableIncomeAfterOffsetSgd"] === 'number' && Math.abs(res1["netChargeableIncomeAfterOffsetSgd"] - 100000) <= 0.0001, 'TAX-LOSS-SCT-FAIL numeric netChargeableIncomeAfterOffsetSgd expected 100000');
    const res2 = runCase("evaluateLossUtilization", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-LOSS-SCT-FAIL');
    const res3 = runCase("evaluateLossUtilization", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-LOSS-SCT-FAIL');
  }
  { // Case: TAX-GROUP-RELIEF-SUCCESS
    const input = {"transferor":{"companyName":"LossCo Pte Ltd","isIncorporatedInSingapore":true,"financialYearEnd":"2024-12-31","currentYearLosses":100000,"currentYearCapitalAllowance":30000},"transferee":{"companyName":"ProfitCo Pte Ltd","isIncorporatedInSingapore":true,"financialYearEnd":"2024-12-31","assessableIncome":200000},"shareholdingPercentage":80};
    const res1 = runCase("evaluateGroupReliefTransfer", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-GROUP-RELIEF-SUCCESS');
    assert.strictEqual(res1["isEligible"], true, 'TAX-GROUP-RELIEF-SUCCESS value isEligible mismatch');
    assert.ok(typeof res1["totalTransferredSgd"] === 'number' && Math.abs(res1["totalTransferredSgd"] - 130000) <= 0.0001, 'TAX-GROUP-RELIEF-SUCCESS numeric totalTransferredSgd expected 130000');
    assert.ok(typeof res1["transfereeNetIncomeAfterReliefSgd"] === 'number' && Math.abs(res1["transfereeNetIncomeAfterReliefSgd"] - 70000) <= 0.0001, 'TAX-GROUP-RELIEF-SUCCESS numeric transfereeNetIncomeAfterReliefSgd expected 70000');
    assert.ok(typeof res1["estimatedGroupTaxSavingsSgd"] === 'number' && Math.abs(res1["estimatedGroupTaxSavingsSgd"] - 22100) <= 0.0001, 'TAX-GROUP-RELIEF-SUCCESS numeric estimatedGroupTaxSavingsSgd expected 22100');
    const res2 = runCase("evaluateGroupReliefTransfer", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-GROUP-RELIEF-SUCCESS');
    const res3 = runCase("evaluateGroupReliefTransfer", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-GROUP-RELIEF-SUCCESS');
  }
  { // Case: TAX-GROUP-RELIEF-FAIL-THRESHOLD
    const input = {"transferor":{"companyName":"A","isIncorporatedInSingapore":true,"financialYearEnd":"2024-12-31","currentYearLosses":50000},"transferee":{"companyName":"B","isIncorporatedInSingapore":true,"financialYearEnd":"2024-12-31","assessableIncome":100000},"shareholdingPercentage":60};
    const res1 = runCase("evaluateGroupReliefTransfer", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-GROUP-RELIEF-FAIL-THRESHOLD');
    assert.strictEqual(res1["isEligible"], false, 'TAX-GROUP-RELIEF-FAIL-THRESHOLD value isEligible mismatch');
    const res2 = runCase("evaluateGroupReliefTransfer", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-GROUP-RELIEF-FAIL-THRESHOLD');
    const res3 = runCase("evaluateGroupReliefTransfer", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-GROUP-RELIEF-FAIL-THRESHOLD');
  }
  { // Case: TAX-FTC-POOLING
    const input = {"foreignIncomes":[{"country":"Australia","incomeType":"Dividend","foreignIncomeGrossSgd":100000,"foreignTaxPaidSgd":30000,"foreignHeadlineTaxRate":0.3},{"country":"Hong Kong","incomeType":"Interest","foreignIncomeGrossSgd":50000,"foreignTaxPaidSgd":4000,"foreignHeadlineTaxRate":0.165}],"usePooling":true};
    const res1 = runCase("calculateForeignTaxCredit", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-FTC-POOLING');
    assert.ok(typeof res1["totalForeignIncomeGrossSgd"] === 'number' && Math.abs(res1["totalForeignIncomeGrossSgd"] - 150000) <= 0.0001, 'TAX-FTC-POOLING numeric totalForeignIncomeGrossSgd expected 150000');
    assert.ok(typeof res1["totalForeignTaxPaidSgd"] === 'number' && Math.abs(res1["totalForeignTaxPaidSgd"] - 34000) <= 0.0001, 'TAX-FTC-POOLING numeric totalForeignTaxPaidSgd expected 34000');
    assert.ok(typeof res1["totalFtcAllowedSgd"] === 'number' && Math.abs(res1["totalFtcAllowedSgd"] - 25500) <= 0.0001, 'TAX-FTC-POOLING numeric totalFtcAllowedSgd expected 25500');
    assert.ok(typeof res1["netSingaporeTaxPayableSgd"] === 'number' && Math.abs(res1["netSingaporeTaxPayableSgd"] - 0) <= 0.0001, 'TAX-FTC-POOLING numeric netSingaporeTaxPayableSgd expected 0');
    const res2 = runCase("calculateForeignTaxCredit", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-FTC-POOLING');
    const res3 = runCase("calculateForeignTaxCredit", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-FTC-POOLING');
  }
  { // Case: TAX-FAMILY-OFFICE-13O-COMPLIANT
    const input = {"scheme":"13O","assetsUnderManagementSgd":25000000,"numberOfInvestmentProfessionals":2,"annualLocalBusinessSpendingSgd":250000,"localInvestmentsSgd":2500000};
    const res1 = runCase("evaluateFamilyOfficeExemption", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-FAMILY-OFFICE-13O-COMPLIANT');
    assert.strictEqual(res1["isCompliant"], true, 'TAX-FAMILY-OFFICE-13O-COMPLIANT value isCompliant mismatch');
    const res2 = runCase("evaluateFamilyOfficeExemption", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-FAMILY-OFFICE-13O-COMPLIANT');
    const res3 = runCase("evaluateFamilyOfficeExemption", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-FAMILY-OFFICE-13O-COMPLIANT');
  }
  { // Case: TAX-BEPS-PILLAR-TWO
    const input = {"globalConsolidatedRevenueSgd":1500000000,"singaporeGlobeIncomeSgd":100000000,"singaporeCoveredTaxesSgd":10000000,"eligiblePayrollCostsSgd":20000000,"eligibleTangibleAssetsSgd":30000000};
    const res1 = runCase("calculateDomesticTopUpTax", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-BEPS-PILLAR-TWO');
    assert.strictEqual(res1["isInScope"], true, 'TAX-BEPS-PILLAR-TWO value isInScope mismatch');
    assert.ok(typeof res1["effectiveTaxRatePercent"] === 'number' && Math.abs(res1["effectiveTaxRatePercent"] - 10) <= 0.0001, 'TAX-BEPS-PILLAR-TWO numeric effectiveTaxRatePercent expected 10');
    assert.ok(typeof res1["topUpTaxRatePercent"] === 'number' && Math.abs(res1["topUpTaxRatePercent"] - 5) <= 0.0001, 'TAX-BEPS-PILLAR-TWO numeric topUpTaxRatePercent expected 5');
    const res2 = runCase("calculateDomesticTopUpTax", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-BEPS-PILLAR-TWO');
    const res3 = runCase("calculateDomesticTopUpTax", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-BEPS-PILLAR-TWO');
  }
  { // Case: TAX-STAMP-DUTY-FOREIGNER
    const input = {"propertyValue":2000000,"propertyType":"RESIDENTIAL","buyerProfile":"FOREIGNER","propertyCount":1};
    const res1 = runCase("calculatePropertyStampDuty", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-STAMP-DUTY-FOREIGNER');
    assert.ok(typeof res1["amountSgd"] === 'number' && Math.abs(res1["amountSgd"] - 1200000) <= 0.0001, 'TAX-STAMP-DUTY-FOREIGNER numeric amountSgd expected 1200000');
    assert.ok(typeof res1["totalStampDutyPayableSgd"] === 'number' && Math.abs(res1["totalStampDutyPayableSgd"] - 1269600) <= 0.0001, 'TAX-STAMP-DUTY-FOREIGNER numeric totalStampDutyPayableSgd expected 1269600');
    const res2 = runCase("calculatePropertyStampDuty", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-STAMP-DUTY-FOREIGNER');
    const res3 = runCase("calculatePropertyStampDuty", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-STAMP-DUTY-FOREIGNER');
  }
  { // Case: TAX-STAMP-DUTY-SC-FIRST
    const input = {"propertyValue":1000000,"propertyType":"RESIDENTIAL","buyerProfile":"SC","propertyCount":1};
    const res1 = runCase("calculatePropertyStampDuty", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-STAMP-DUTY-SC-FIRST');
    assert.ok(typeof res1["ratePercent"] === 'number' && Math.abs(res1["ratePercent"] - 0) <= 0.0001, 'TAX-STAMP-DUTY-SC-FIRST numeric ratePercent expected 0');
    assert.ok(typeof res1["amountSgd"] === 'number' && Math.abs(res1["amountSgd"] - 0) <= 0.0001, 'TAX-STAMP-DUTY-SC-FIRST numeric amountSgd expected 0');
    const res2 = runCase("calculatePropertyStampDuty", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-STAMP-DUTY-SC-FIRST');
    const res3 = runCase("calculatePropertyStampDuty", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-STAMP-DUTY-SC-FIRST');
  }
  { // Case: TAX-AUDIT-RISK-SEVERE
    const input = {"revenueCitSgd":2000000,"revenueGstAnnualSgd":1500000,"grossProfitMarginPercent":12,"industryBenchmarkGpmPercent":30,"directorRemunerationSgd":1200000,"directorLoanCreditBalanceSgd":600000,"foreignInterestRoyaltyExpenseSgd":100000,"whtRemittedSgd":0};
    const res1 = runCase("assessTaxAuditRisk", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-AUDIT-RISK-SEVERE');
    assert.strictEqual(res1["riskTier"], "SEVERE", 'TAX-AUDIT-RISK-SEVERE value riskTier mismatch');
    const res2 = runCase("assessTaxAuditRisk", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-AUDIT-RISK-SEVERE');
    const res3 = runCase("assessTaxAuditRisk", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-AUDIT-RISK-SEVERE');
  }
  { // Case: TAX-TRANSFER-PRICING-MANDATORY
    const input = {"annualGrossRevenueSgd":15000000,"relatedPartyTransactions":{"GOODS":18000000,"SERVICES":1500000},"testedPartyMarginPercent":2.5,"comparableBenchmark":{"q1":4,"median":6,"q3":8},"transactionBaseAmountSgd":2000000};
    const res1 = runCase("evaluateTransferPricingCompliance", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-TRANSFER-PRICING-MANDATORY');
    assert.strictEqual(res1["isMandatoryTpdByRevenue"], true, 'TAX-TRANSFER-PRICING-MANDATORY value isMandatoryTpdByRevenue mismatch');
    assert.strictEqual(res1["status"], "OUTSIDE_ARMS_LENGTH_RANGE", 'TAX-TRANSFER-PRICING-MANDATORY value status mismatch');
    assert.ok(typeof res1["statutorySurcharge5PercentSgd"] === 'number' && Math.abs(res1["statutorySurcharge5PercentSgd"] - 3500) <= 0.0001, 'TAX-TRANSFER-PRICING-MANDATORY numeric statutorySurcharge5PercentSgd expected 3500');
    const res2 = runCase("evaluateTransferPricingCompliance", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-TRANSFER-PRICING-MANDATORY');
    const res3 = runCase("evaluateTransferPricingCompliance", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-TRANSFER-PRICING-MANDATORY');
  }
  { // Case: TAX-CAPITAL-ALLOWANCES-ACCELERATED
    const input = {"assets":[{"description":"Server hardware","costSgd":30000,"scheme":"19A_1YR"},{"description":"Office Furniture","costSgd":60000,"scheme":"19A_3YR"},{"description":"Printers","costSgd":10000,"scheme":"LOW_VALUE","quantity":4}]};
    const res1 = runCase("calculateCapitalAllowances", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for TAX-CAPITAL-ALLOWANCES-ACCELERATED');
    assert.ok(typeof res1["totalAssetAdditionsCostSgd"] === 'number' && Math.abs(res1["totalAssetAdditionsCostSgd"] - 100000) <= 0.0001, 'TAX-CAPITAL-ALLOWANCES-ACCELERATED numeric totalAssetAdditionsCostSgd expected 100000');
    assert.ok(typeof res1["totalCapitalAllowancesClaimedSgd"] === 'number' && Math.abs(res1["totalCapitalAllowancesClaimedSgd"] - 60000) <= 0.0001, 'TAX-CAPITAL-ALLOWANCES-ACCELERATED numeric totalCapitalAllowancesClaimedSgd expected 60000');
    assert.ok(typeof res1["lowValueAssetsClaimedSgd"] === 'number' && Math.abs(res1["lowValueAssetsClaimedSgd"] - 10000) <= 0.0001, 'TAX-CAPITAL-ALLOWANCES-ACCELERATED numeric lowValueAssetsClaimedSgd expected 10000');
    const res2 = runCase("calculateCapitalAllowances", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for TAX-CAPITAL-ALLOWANCES-ACCELERATED');
    const res3 = runCase("calculateCapitalAllowances", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for TAX-CAPITAL-ALLOWANCES-ACCELERATED');
  }
  { // Case: GST-RATE-2023
    const input = {"dateStr":"2023-06-15"};
    const res1 = runCase("calculateSingaporeGstRate", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for GST-RATE-2023');
    assert.ok(typeof res1["rate"] === 'number' && Math.abs(res1["rate"] - 0.08) <= 0.0001, 'GST-RATE-2023 numeric rate expected 0.08');
    const res2 = runCase("calculateSingaporeGstRate", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for GST-RATE-2023');
    const res3 = runCase("calculateSingaporeGstRate", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for GST-RATE-2023');
  }
  console.log('    ✅ tax-sg: 25 cases verified.');

  // ==========================================
  // Domain: hr-sg (25 cases)
  // ==========================================
  console.log('  📂 Testing hr-sg golden cases...');
  { // Case: CPF-CITIZEN-STANDARD-2024
    const input = {"ordinaryWage":6000,"additionalWage":0,"age":30,"residentialStatus":"CITIZEN","calendarYear":2024,"communityFund":"CDAC"};
    const res1 = runCase("calculateSingaporeCpf", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CPF-CITIZEN-STANDARD-2024');
    assert.ok(typeof res1["employeeCpfSgd"] === 'number' && Math.abs(res1["employeeCpfSgd"] - 1200) <= 0.0001, 'CPF-CITIZEN-STANDARD-2024 numeric employeeCpfSgd expected 1200');
    assert.ok(typeof res1["employerCpfSgd"] === 'number' && Math.abs(res1["employerCpfSgd"] - 1020) <= 0.0001, 'CPF-CITIZEN-STANDARD-2024 numeric employerCpfSgd expected 1020');
    assert.ok(typeof res1["totalCpfSgd"] === 'number' && Math.abs(res1["totalCpfSgd"] - 2220) <= 0.0001, 'CPF-CITIZEN-STANDARD-2024 numeric totalCpfSgd expected 2220');
    assert.ok(typeof res1["skillsDevelopmentLevySgd"] === 'number' && Math.abs(res1["skillsDevelopmentLevySgd"] - 11.25) <= 0.0001, 'CPF-CITIZEN-STANDARD-2024 numeric skillsDevelopmentLevySgd expected 11.25');
    assert.ok(typeof res1["selfHelpGroupDeductionSgd"] === 'number' && Math.abs(res1["selfHelpGroupDeductionSgd"] - 2) <= 0.0001, 'CPF-CITIZEN-STANDARD-2024 numeric selfHelpGroupDeductionSgd expected 2');
    assert.ok(typeof res1["netTakeHomePaySgd"] === 'number' && Math.abs(res1["netTakeHomePaySgd"] - 4798) <= 0.0001, 'CPF-CITIZEN-STANDARD-2024 numeric netTakeHomePaySgd expected 4798');
    assert.ok(typeof res1["totalEmployerCostSgd"] === 'number' && Math.abs(res1["totalEmployerCostSgd"] - 7031.25) <= 0.0001, 'CPF-CITIZEN-STANDARD-2024 numeric totalEmployerCostSgd expected 7031.25');
    const res2 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CPF-CITIZEN-STANDARD-2024');
    const res3 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CPF-CITIZEN-STANDARD-2024');
  }
  { // Case: CPF-OW-CEILING-2024
    const input = {"ordinaryWage":10000,"age":30,"calendarYear":2024};
    const res1 = runCase("calculateSingaporeCpf", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CPF-OW-CEILING-2024');
    assert.ok(typeof res1["owSubjectToCpfSgd"] === 'number' && Math.abs(res1["owSubjectToCpfSgd"] - 6800) <= 0.0001, 'CPF-OW-CEILING-2024 numeric owSubjectToCpfSgd expected 6800');
    const res2 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CPF-OW-CEILING-2024');
    const res3 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CPF-OW-CEILING-2024');
  }
  { // Case: CPF-OW-CEILING-2025
    const input = {"ordinaryWage":10000,"age":30,"calendarYear":2025};
    const res1 = runCase("calculateSingaporeCpf", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CPF-OW-CEILING-2025');
    assert.ok(typeof res1["owSubjectToCpfSgd"] === 'number' && Math.abs(res1["owSubjectToCpfSgd"] - 7400) <= 0.0001, 'CPF-OW-CEILING-2025 numeric owSubjectToCpfSgd expected 7400');
    const res2 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CPF-OW-CEILING-2025');
    const res3 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CPF-OW-CEILING-2025');
  }
  { // Case: CPF-OW-CEILING-2026
    const input = {"ordinaryWage":10000,"age":30,"calendarYear":2026};
    const res1 = runCase("calculateSingaporeCpf", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CPF-OW-CEILING-2026');
    assert.ok(typeof res1["owSubjectToCpfSgd"] === 'number' && Math.abs(res1["owSubjectToCpfSgd"] - 8000) <= 0.0001, 'CPF-OW-CEILING-2026 numeric owSubjectToCpfSgd expected 8000');
    const res2 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CPF-OW-CEILING-2026');
    const res3 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CPF-OW-CEILING-2026');
  }
  { // Case: CPF-AW-CEILING-BONUS
    const input = {"ordinaryWage":6800,"additionalWage":50000,"age":30,"calendarYear":2024,"ytdOrdinaryWages":74800};
    const res1 = runCase("calculateSingaporeCpf", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CPF-AW-CEILING-BONUS');
    assert.ok(typeof res1["awCeilingRemainingSgd"] === 'number' && Math.abs(res1["awCeilingRemainingSgd"] - 20400) <= 0.0001, 'CPF-AW-CEILING-BONUS numeric awCeilingRemainingSgd expected 20400');
    assert.ok(typeof res1["awSubjectToCpfSgd"] === 'number' && Math.abs(res1["awSubjectToCpfSgd"] - 20400) <= 0.0001, 'CPF-AW-CEILING-BONUS numeric awSubjectToCpfSgd expected 20400');
    const res2 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CPF-AW-CEILING-BONUS');
    const res3 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CPF-AW-CEILING-BONUS');
  }
  { // Case: MOM-OVERTIME-WORKMAN
    const input = {"employeeCategory":"WORKMAN","monthlyBasicSalarySgd":3000,"overtimeHours":20,"dailyMaxHoursWorked":10,"yearsOfService":3};
    const res1 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-OVERTIME-WORKMAN');
    assert.strictEqual(res1["isCoveredUnderPartIV"], true, 'MOM-OVERTIME-WORKMAN value isCoveredUnderPartIV mismatch');
    assert.strictEqual(res1["coverageStatusReason"], "WORKMAN_SALARY_WITHIN_CAP", 'MOM-OVERTIME-WORKMAN value coverageStatusReason mismatch');
    assert.ok(typeof res1["overtimeHoursWorked"] === 'number' && Math.abs(res1["overtimeHoursWorked"] - 20) <= 0.0001, 'MOM-OVERTIME-WORKMAN numeric overtimeHoursWorked expected 20');
    assert.strictEqual(res1["exceedsMonthlyOtCap"], false, 'MOM-OVERTIME-WORKMAN value exceedsMonthlyOtCap mismatch');
    assert.strictEqual(res1["exceedsDailyWorkCap"], false, 'MOM-OVERTIME-WORKMAN value exceedsDailyWorkCap mismatch');
    assert.strictEqual(res1["isFullyCompliant"], true, 'MOM-OVERTIME-WORKMAN value isFullyCompliant mismatch');
    assert.ok(typeof res1["statutoryAnnualLeaveDays"] === 'number' && Math.abs(res1["statutoryAnnualLeaveDays"] - 9) <= 0.0001, 'MOM-OVERTIME-WORKMAN numeric statutoryAnnualLeaveDays expected 9');
    const res2 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-OVERTIME-WORKMAN');
    const res3 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-OVERTIME-WORKMAN');
  }
  { // Case: MOM-COMPASS-STANDARD-PASS
    const input = {"monthlySalarySgd":9000,"candidateAge":30,"sector":"NON_FINANCIAL_SERVICES","salaryPercentileRank":"P90_AND_ABOVE","qualificationLevel":"TOP_TIER","firmPmetCount":20};
    const res1 = runCase("evaluateCompassEpEligibility", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-COMPASS-STANDARD-PASS');
    assert.strictEqual(res1["meetsMinimumQualifyingSalary"], true, 'MOM-COMPASS-STANDARD-PASS value meetsMinimumQualifyingSalary mismatch');
    assert.ok(typeof res1["c1SalaryPoints"] === 'number' && Math.abs(res1["c1SalaryPoints"] - 20) <= 0.0001, 'MOM-COMPASS-STANDARD-PASS numeric c1SalaryPoints expected 20');
    assert.ok(typeof res1["c2QualificationPoints"] === 'number' && Math.abs(res1["c2QualificationPoints"] - 20) <= 0.0001, 'MOM-COMPASS-STANDARD-PASS numeric c2QualificationPoints expected 20');
    assert.ok(typeof res1["c3DiversityPoints"] === 'number' && Math.abs(res1["c3DiversityPoints"] - 10) <= 0.0001, 'MOM-COMPASS-STANDARD-PASS numeric c3DiversityPoints expected 10');
    assert.ok(typeof res1["c4LocalSupportPoints"] === 'number' && Math.abs(res1["c4LocalSupportPoints"] - 10) <= 0.0001, 'MOM-COMPASS-STANDARD-PASS numeric c4LocalSupportPoints expected 10');
    assert.ok(typeof res1["totalCompassScore"] === 'number' && Math.abs(res1["totalCompassScore"] - 60) <= 0.0001, 'MOM-COMPASS-STANDARD-PASS numeric totalCompassScore expected 60');
    assert.strictEqual(res1["isPassMarkMet"], true, 'MOM-COMPASS-STANDARD-PASS value isPassMarkMet mismatch');
    assert.strictEqual(res1["eligibilityVerdict"], "ELIGIBLE_FOR_EP_COMPASS_PASSED", 'MOM-COMPASS-STANDARD-PASS value eligibilityVerdict mismatch');
    const res2 = runCase("evaluateCompassEpEligibility", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-COMPASS-STANDARD-PASS');
    const res3 = runCase("evaluateCompassEpEligibility", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-COMPASS-STANDARD-PASS');
  }
  { // Case: MOM-COMPASS-HIGH-SALARY-EXEMPT
    const input = {"monthlySalarySgd":25000,"candidateAge":35};
    const res1 = runCase("evaluateCompassEpEligibility", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-COMPASS-HIGH-SALARY-EXEMPT');
    assert.strictEqual(res1["isExemptFromCompass"], true, 'MOM-COMPASS-HIGH-SALARY-EXEMPT value isExemptFromCompass mismatch');
    assert.strictEqual(res1["exemptionReason"], "HIGH_SALARY_EXEMPTION_ABOVE_22500_SGD", 'MOM-COMPASS-HIGH-SALARY-EXEMPT value exemptionReason mismatch');
    assert.strictEqual(res1["isPassMarkMet"], true, 'MOM-COMPASS-HIGH-SALARY-EXEMPT value isPassMarkMet mismatch');
    const res2 = runCase("evaluateCompassEpEligibility", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-COMPASS-HIGH-SALARY-EXEMPT');
    const res3 = runCase("evaluateCompassEpEligibility", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-COMPASS-HIGH-SALARY-EXEMPT');
  }
  { // Case: MOM-OT-NON-WORKMAN-EXCLUDED
    const input = {"employeeCategory":"NON_WORKMAN","monthlyBasicSalarySgd":3500,"overtimeHours":10};
    const res1 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-OT-NON-WORKMAN-EXCLUDED');
    assert.strictEqual(res1["isCoveredUnderPartIV"], false, 'MOM-OT-NON-WORKMAN-EXCLUDED value isCoveredUnderPartIV mismatch');
    assert.strictEqual(res1["coverageStatusReason"], "NON_WORKMAN_SALARY_EXCEEDS_CAP", 'MOM-OT-NON-WORKMAN-EXCLUDED value coverageStatusReason mismatch');
    assert.ok(typeof res1["totalOvertimePayPayableSgd"] === 'number' && Math.abs(res1["totalOvertimePayPayableSgd"] - 0) <= 0.0001, 'MOM-OT-NON-WORKMAN-EXCLUDED numeric totalOvertimePayPayableSgd expected 0');
    const res2 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-OT-NON-WORKMAN-EXCLUDED');
    const res3 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-OT-NON-WORKMAN-EXCLUDED');
  }
  { // Case: MOM-OT-BREACH-HOURS
    const input = {"employeeCategory":"WORKMAN","monthlyBasicSalarySgd":2000,"overtimeHours":80,"dailyMaxHoursWorked":14};
    const res1 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-OT-BREACH-HOURS');
    assert.strictEqual(res1["exceedsMonthlyOtCap"], true, 'MOM-OT-BREACH-HOURS value exceedsMonthlyOtCap mismatch');
    assert.strictEqual(res1["exceedsDailyWorkCap"], true, 'MOM-OT-BREACH-HOURS value exceedsDailyWorkCap mismatch');
    assert.strictEqual(res1["isFullyCompliant"], false, 'MOM-OT-BREACH-HOURS value isFullyCompliant mismatch');
    const res2 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-OT-BREACH-HOURS');
    const res3 = runCase("calculateMomOvertimeAndCompliance", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-OT-BREACH-HOURS');
  }
  { // Case: MOM-DRC-SERVICES-QUOTA
    const input = {"sector":"SERVICES","localHeadcount":65,"currentSPassCount":5,"currentWorkPermitCount":20};
    const res1 = runCase("calculateForeignWorkforceQuota", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-DRC-SERVICES-QUOTA');
    assert.ok(typeof res1["maxTotalForeignWorkers"] === 'number' && Math.abs(res1["maxTotalForeignWorkers"] - 35) <= 0.0001, 'MOM-DRC-SERVICES-QUOTA numeric maxTotalForeignWorkers expected 35');
    assert.ok(typeof res1["maxSPassHolders"] === 'number' && Math.abs(res1["maxSPassHolders"] - 7) <= 0.0001, 'MOM-DRC-SERVICES-QUOTA numeric maxSPassHolders expected 7');
    assert.ok(typeof res1["totalForeignHeadroom"] === 'number' && Math.abs(res1["totalForeignHeadroom"] - 10) <= 0.0001, 'MOM-DRC-SERVICES-QUOTA numeric totalForeignHeadroom expected 10');
    assert.ok(typeof res1["sPassHeadroom"] === 'number' && Math.abs(res1["sPassHeadroom"] - 2) <= 0.0001, 'MOM-DRC-SERVICES-QUOTA numeric sPassHeadroom expected 2');
    assert.strictEqual(res1["isFullyCompliant"], true, 'MOM-DRC-SERVICES-QUOTA value isFullyCompliant mismatch');
    assert.ok(typeof res1["totalForeignWorkerLevySgd"] === 'number' && Math.abs(res1["totalForeignWorkerLevySgd"] - 10650) <= 0.0001, 'MOM-DRC-SERVICES-QUOTA numeric totalForeignWorkerLevySgd expected 10650');
    const res2 = runCase("calculateForeignWorkforceQuota", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-DRC-SERVICES-QUOTA');
    const res3 = runCase("calculateForeignWorkforceQuota", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-DRC-SERVICES-QUOTA');
  }
  { // Case: MOM-ANNUAL-LEAVE-PRORATED
    const input = {"completedYearsOfService":2,"completedMonthsInCurrentYear":8,"leaveTakenDays":3,"grossMonthlySalarySgd":3500};
    const res1 = runCase("calculateAnnualLeaveEntitlement", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-ANNUAL-LEAVE-PRORATED');
    assert.ok(typeof res1["statutoryMinimumDays"] === 'number' && Math.abs(res1["statutoryMinimumDays"] - 9) <= 0.0001, 'MOM-ANNUAL-LEAVE-PRORATED numeric statutoryMinimumDays expected 9');
    assert.ok(typeof res1["roundedStatutoryProratedDays"] === 'number' && Math.abs(res1["roundedStatutoryProratedDays"] - 6) <= 0.0001, 'MOM-ANNUAL-LEAVE-PRORATED numeric roundedStatutoryProratedDays expected 6');
    assert.ok(typeof res1["balanceRemainingDays"] === 'number' && Math.abs(res1["balanceRemainingDays"] - 3) <= 0.0001, 'MOM-ANNUAL-LEAVE-PRORATED numeric balanceRemainingDays expected 3');
    const res2 = runCase("calculateAnnualLeaveEntitlement", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-ANNUAL-LEAVE-PRORATED');
    const res3 = runCase("calculateAnnualLeaveEntitlement", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-ANNUAL-LEAVE-PRORATED');
  }
  { // Case: MOM-SICK-LEAVE-QUALIFYING
    const input = {"monthsOfService":6,"outpatientSickLeaveTakenDays":4,"hospitalisationLeaveTakenDays":10,"hasValidMcFromRegisteredDoctor":true};
    const res1 = runCase("calculateSickLeaveEntitlement", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-SICK-LEAVE-QUALIFYING');
    assert.strictEqual(res1["isEligibleForPaidSickLeave"], true, 'MOM-SICK-LEAVE-QUALIFYING value isEligibleForPaidSickLeave mismatch');
    assert.ok(typeof res1["outpatientSickLeaveTotalDays"] === 'number' && Math.abs(res1["outpatientSickLeaveTotalDays"] - 14) <= 0.0001, 'MOM-SICK-LEAVE-QUALIFYING numeric outpatientSickLeaveTotalDays expected 14');
    assert.ok(typeof res1["hospitalisationLeaveTotalDays"] === 'number' && Math.abs(res1["hospitalisationLeaveTotalDays"] - 60) <= 0.0001, 'MOM-SICK-LEAVE-QUALIFYING numeric hospitalisationLeaveTotalDays expected 60');
    assert.ok(typeof res1["remainingOutpatientSickLeaveDays"] === 'number' && Math.abs(res1["remainingOutpatientSickLeaveDays"] - 10) <= 0.0001, 'MOM-SICK-LEAVE-QUALIFYING numeric remainingOutpatientSickLeaveDays expected 10');
    assert.ok(typeof res1["remainingHospitalisationLeaveDays"] === 'number' && Math.abs(res1["remainingHospitalisationLeaveDays"] - 46) <= 0.0001, 'MOM-SICK-LEAVE-QUALIFYING numeric remainingHospitalisationLeaveDays expected 46');
    const res2 = runCase("calculateSickLeaveEntitlement", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-SICK-LEAVE-QUALIFYING');
    const res3 = runCase("calculateSickLeaveEntitlement", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-SICK-LEAVE-QUALIFYING');
  }
  { // Case: MOM-RETRENCHMENT-MANDATORY
    const input = {"monthlySalarySgd":4000,"yearsOfService":3,"benefitWeeksPerYear":4.33,"companyContext":{"totalCompanyHeadcount":20,"retrenchedIn6Months":6}};
    const res1 = runCase("calculateRetrenchmentBenefit", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-RETRENCHMENT-MANDATORY');
    assert.strictEqual(res1["isStatutorilyEligible"], true, 'MOM-RETRENCHMENT-MANDATORY value isStatutorilyEligible mismatch');
    assert.strictEqual(res1["isMandatory"], true, 'MOM-RETRENCHMENT-MANDATORY value isMandatory mismatch');
    assert.ok(typeof res1["reportingDeadlineWorkingDays"] === 'number' && Math.abs(res1["reportingDeadlineWorkingDays"] - 5) <= 0.0001, 'MOM-RETRENCHMENT-MANDATORY numeric reportingDeadlineWorkingDays expected 5');
    const res2 = runCase("calculateRetrenchmentBenefit", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-RETRENCHMENT-MANDATORY');
    const res3 = runCase("calculateRetrenchmentBenefit", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-RETRENCHMENT-MANDATORY');
  }
  { // Case: MOM-PARENTAL-GPML-CHILD1
    const input = {"leaveType":"MATERNITY","monthlyGrossSalarySgd":8000,"childOrderNumber":1,"monthsOfService":6,"isChildSingaporeCitizen":true,"isLawfullyMarried":true};
    const res1 = runCase("calculateParentalLeave", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-PARENTAL-GPML-CHILD1');
    assert.strictEqual(res1["isCdcaQualifying"], true, 'MOM-PARENTAL-GPML-CHILD1 value isCdcaQualifying mismatch');
    assert.ok(typeof res1["totalLeaveWeeks"] === 'number' && Math.abs(res1["totalLeaveWeeks"] - 16) <= 0.0001, 'MOM-PARENTAL-GPML-CHILD1 numeric totalLeaveWeeks expected 16');
    assert.ok(typeof res1["employerFundedWeeks"] === 'number' && Math.abs(res1["employerFundedWeeks"] - 8) <= 0.0001, 'MOM-PARENTAL-GPML-CHILD1 numeric employerFundedWeeks expected 8');
    assert.ok(typeof res1["governmentFundedWeeks"] === 'number' && Math.abs(res1["governmentFundedWeeks"] - 8) <= 0.0001, 'MOM-PARENTAL-GPML-CHILD1 numeric governmentFundedWeeks expected 8');
    assert.ok(typeof res1["governmentReimbursementClaimSgd"] === 'number' && Math.abs(res1["governmentReimbursementClaimSgd"] - 14769.2) <= 0.0001, 'MOM-PARENTAL-GPML-CHILD1 numeric governmentReimbursementClaimSgd expected 14769.2');
    const res2 = runCase("calculateParentalLeave", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-PARENTAL-GPML-CHILD1');
    const res3 = runCase("calculateParentalLeave", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-PARENTAL-GPML-CHILD1');
  }
  { // Case: MOM-PARENTAL-GPPL-FATHER
    const input = {"leaveType":"PATERNITY","monthlyGrossSalarySgd":6000,"childOrderNumber":1,"monthsOfService":6,"isChildSingaporeCitizen":true,"isLawfullyMarried":true};
    const res1 = runCase("calculateParentalLeave", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-PARENTAL-GPPL-FATHER');
    assert.strictEqual(res1["isCdcaQualifying"], true, 'MOM-PARENTAL-GPPL-FATHER value isCdcaQualifying mismatch');
    assert.ok(typeof res1["totalLeaveWeeks"] === 'number' && Math.abs(res1["totalLeaveWeeks"] - 4) <= 0.0001, 'MOM-PARENTAL-GPPL-FATHER numeric totalLeaveWeeks expected 4');
    assert.ok(typeof res1["employerFundedWeeks"] === 'number' && Math.abs(res1["employerFundedWeeks"] - 0) <= 0.0001, 'MOM-PARENTAL-GPPL-FATHER numeric employerFundedWeeks expected 0');
    assert.ok(typeof res1["governmentFundedWeeks"] === 'number' && Math.abs(res1["governmentFundedWeeks"] - 4) <= 0.0001, 'MOM-PARENTAL-GPPL-FATHER numeric governmentFundedWeeks expected 4');
    const res2 = runCase("calculateParentalLeave", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-PARENTAL-GPPL-FATHER');
    const res3 = runCase("calculateParentalLeave", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-PARENTAL-GPPL-FATHER');
  }
  { // Case: MOM-WFA-DISCRIMINATORY-AD
    const input = {"textToAudit":"Looking for young and energetic female preferred staff, mandarin speaking preferred.","hasInternalGrievanceMechanism":false};
    const res1 = runCase("auditWorkplaceFairness", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-WFA-DISCRIMINATORY-AD');
    assert.strictEqual(res1["riskTier"], "CRITICAL_RISK", 'MOM-WFA-DISCRIMINATORY-AD value riskTier mismatch');
    const res2 = runCase("auditWorkplaceFairness", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-WFA-DISCRIMINATORY-AD');
    const res3 = runCase("auditWorkplaceFairness", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-WFA-DISCRIMINATORY-AD');
  }
  { // Case: MOM-PWM-RETAIL-DEFICIT
    const input = {"monthlyGrossSalarySgd":1600,"pwmSectorKey":"RETAIL","isLocalEmployee":true};
    const res1 = runCase("evaluateProgressiveWageCompliance", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-PWM-RETAIL-DEFICIT');
    assert.ok(typeof res1["headcountContribution"] === 'number' && Math.abs(res1["headcountContribution"] - 1) <= 0.0001, 'MOM-PWM-RETAIL-DEFICIT numeric headcountContribution expected 1');
    assert.strictEqual(res1["status"], "FULL_LQS_HEADCOUNT", 'MOM-PWM-RETAIL-DEFICIT value status mismatch');
    assert.strictEqual(res1["isPwmCompliant"], false, 'MOM-PWM-RETAIL-DEFICIT value isPwmCompliant mismatch');
    assert.ok(typeof res1["wageDeficitSgd"] === 'number' && Math.abs(res1["wageDeficitSgd"] - 575) <= 0.0001, 'MOM-PWM-RETAIL-DEFICIT numeric wageDeficitSgd expected 575');
    const res2 = runCase("evaluateProgressiveWageCompliance", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-PWM-RETAIL-DEFICIT');
    const res3 = runCase("evaluateProgressiveWageCompliance", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-PWM-RETAIL-DEFICIT');
  }
  { // Case: MOM-KETS-COMPLIANT
    const input = {"includedItemFlags":{"EMPLOYER_EMPLOYEE_NAMES":true,"JOB_TITLE_DUTIES":true,"START_DATE":true,"EMPLOYMENT_DURATION":true,"HOURS_DAYS_REST":true,"SALARY_PERIOD":true,"BASIC_PAY":true,"FIXED_ALLOWANCES":true,"FIXED_DEDUCTIONS":true,"OVERTIME_RATE":true,"OTHER_BONUS_INCENTIVE":true,"STATUTORY_LEAVES":true,"MEDICAL_BENEFITS":true,"NOTICE_PERIOD":true},"daysSinceStartOfEmployment":10,"isWrittenDocumentProvided":true};
    const res1 = runCase("auditKeyEmploymentTerms", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-KETS-COMPLIANT');
    assert.strictEqual(res1["isFullyCompliant"], true, 'MOM-KETS-COMPLIANT value isFullyCompliant mismatch');
    assert.ok(typeof res1["complianceScore"] === 'number' && Math.abs(res1["complianceScore"] - 100) <= 0.0001, 'MOM-KETS-COMPLIANT numeric complianceScore expected 100');
    const res2 = runCase("auditKeyEmploymentTerms", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-KETS-COMPLIANT');
    const res3 = runCase("auditKeyEmploymentTerms", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-KETS-COMPLIANT');
  }
  { // Case: MOM-PAYSLIP-ITEMISED-AUDIT
    const input = {"includedFields":{"NAMES":true,"PAYMENT_DATE":true,"SALARY_PERIOD":true,"BASIC_SALARY":true,"ALLOWANCES":true,"DEDUCTIONS":true,"NET_SALARY":true,"OVERTIME_DETAILS":true},"employeeWorkedOvertime":true,"daysAfterPaymentIssued":2,"keepsHistoricalRecords2Years":true};
    const res1 = runCase("auditItemisedPayslip", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-PAYSLIP-ITEMISED-AUDIT');
    assert.strictEqual(res1["isFullyCompliant"], true, 'MOM-PAYSLIP-ITEMISED-AUDIT value isFullyCompliant mismatch');
    assert.ok(typeof res1["complianceScore"] === 'number' && Math.abs(res1["complianceScore"] - 100) <= 0.0001, 'MOM-PAYSLIP-ITEMISED-AUDIT numeric complianceScore expected 100');
    const res2 = runCase("auditItemisedPayslip", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-PAYSLIP-ITEMISED-AUDIT');
    const res3 = runCase("auditItemisedPayslip", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-PAYSLIP-ITEMISED-AUDIT');
  }
  { // Case: MOM-PUBLIC-HOLIDAY-PAY
    const input = {"monthlyBasicSalarySgd":3000,"normalWorkingDaysPerWeek":5,"holidaysWorkedCount":1,"compensationMode":"EXTRA_PAY"};
    const res1 = runCase("calculatePublicHolidayCompensation", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-PUBLIC-HOLIDAY-PAY');
    assert.strictEqual(res1["compensationMode"], "EXTRA_PAY", 'MOM-PUBLIC-HOLIDAY-PAY value compensationMode mismatch');
    assert.ok(typeof res1["statutoryDailyRateOfPaySgd"] === 'number' && Math.abs(res1["statutoryDailyRateOfPaySgd"] - 138.46) <= 0.0001, 'MOM-PUBLIC-HOLIDAY-PAY numeric statutoryDailyRateOfPaySgd expected 138.46');
    assert.ok(typeof res1["extraSalaryPayableSgd"] === 'number' && Math.abs(res1["extraSalaryPayableSgd"] - 138.46) <= 0.0001, 'MOM-PUBLIC-HOLIDAY-PAY numeric extraSalaryPayableSgd expected 138.46');
    const res2 = runCase("calculatePublicHolidayCompensation", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-PUBLIC-HOLIDAY-PAY');
    const res3 = runCase("calculatePublicHolidayCompensation", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-PUBLIC-HOLIDAY-PAY');
  }
  { // Case: MOM-CONTRACT-NON-COMPETE
    const input = {"contractualEmployerNoticeWeeks":2,"contractualEmployeeNoticeWeeks":8,"yearsOfService":1,"probationDurationMonths":3,"nonCompeteClause":{"hasNonCompete":true,"durationMonths":24,"geographicalScope":"GLOBAL","protectsTradeSecrets":false}};
    const res1 = runCase("auditEmploymentContract", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-CONTRACT-NON-COMPETE');
    assert.strictEqual(res1["isNoticeAsymmetrical"], true, 'MOM-CONTRACT-NON-COMPETE value isNoticeAsymmetrical mismatch');
    assert.strictEqual(res1["assessment"], "LIKELY_UNENFORCEABLE_VOID", 'MOM-CONTRACT-NON-COMPETE value assessment mismatch');
    const res2 = runCase("auditEmploymentContract", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-CONTRACT-NON-COMPETE');
    const res3 = runCase("auditEmploymentContract", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-CONTRACT-NON-COMPETE');
  }
  { // Case: CPF-NON-CITIZEN-PR1
    const input = {"ordinaryWage":5000,"age":28,"residentialStatus":"SPR_YEAR_1","calendarYear":2024};
    const res1 = runCase("calculateSingaporeCpf", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CPF-NON-CITIZEN-PR1');
    assert.ok(typeof res1["employeeCpfSgd"] === 'number' && Math.abs(res1["employeeCpfSgd"] - 250) <= 0.0001, 'CPF-NON-CITIZEN-PR1 numeric employeeCpfSgd expected 250');
    assert.ok(typeof res1["employerCpfSgd"] === 'number' && Math.abs(res1["employerCpfSgd"] - 200) <= 0.0001, 'CPF-NON-CITIZEN-PR1 numeric employerCpfSgd expected 200');
    assert.ok(typeof res1["totalCpfSgd"] === 'number' && Math.abs(res1["totalCpfSgd"] - 450) <= 0.0001, 'CPF-NON-CITIZEN-PR1 numeric totalCpfSgd expected 450');
    const res2 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CPF-NON-CITIZEN-PR1');
    const res3 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CPF-NON-CITIZEN-PR1');
  }
  { // Case: CPF-SENIOR-CITIZEN-65
    const input = {"ordinaryWage":4000,"age":65,"residentialStatus":"CITIZEN","calendarYear":2024};
    const res1 = runCase("calculateSingaporeCpf", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CPF-SENIOR-CITIZEN-65');
    assert.ok(typeof res1["employeeCpfSgd"] === 'number' && Math.abs(res1["employeeCpfSgd"] - 420) <= 0.0001, 'CPF-SENIOR-CITIZEN-65 numeric employeeCpfSgd expected 420');
    assert.ok(typeof res1["employerCpfSgd"] === 'number' && Math.abs(res1["employerCpfSgd"] - 460) <= 0.0001, 'CPF-SENIOR-CITIZEN-65 numeric employerCpfSgd expected 460');
    assert.ok(typeof res1["totalCpfSgd"] === 'number' && Math.abs(res1["totalCpfSgd"] - 880) <= 0.0001, 'CPF-SENIOR-CITIZEN-65 numeric totalCpfSgd expected 880');
    const res2 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CPF-SENIOR-CITIZEN-65');
    const res3 = runCase("calculateSingaporeCpf", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CPF-SENIOR-CITIZEN-65');
  }
  { // Case: MOM-DRC-MANUFACTURING
    const input = {"sector":"MANUFACTURING","localHeadcount":40,"currentSPassCount":4,"currentWorkPermitCount":20};
    const res1 = runCase("calculateForeignWorkforceQuota", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MOM-DRC-MANUFACTURING');
    assert.ok(typeof res1["maxTotalForeignWorkers"] === 'number' && Math.abs(res1["maxTotalForeignWorkers"] - 60) <= 0.0001, 'MOM-DRC-MANUFACTURING numeric maxTotalForeignWorkers expected 60');
    assert.strictEqual(res1["isFullyCompliant"], true, 'MOM-DRC-MANUFACTURING value isFullyCompliant mismatch');
    const res2 = runCase("calculateForeignWorkforceQuota", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MOM-DRC-MANUFACTURING');
    const res3 = runCase("calculateForeignWorkforceQuota", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MOM-DRC-MANUFACTURING');
  }
  console.log('    ✅ hr-sg: 25 cases verified.');

  // ==========================================
  // Domain: legal-sg (22 cases)
  // ==========================================
  console.log('  📂 Testing legal-sg golden cases...');
  { // Case: ACRA-PRIVATE-COMPLIANT
    const input = {"financialYearEndDate":"2025-12-31","isListedCompany":false,"hasResidentDirector":true,"isSoleDirectorSecretary":false,"currentDate":"2026-06-01"};
    const res1 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for ACRA-PRIVATE-COMPLIANT');
    assert.strictEqual(res1["companyType"], "PRIVATE_NON_LISTED", 'ACRA-PRIVATE-COMPLIANT value companyType mismatch');
    assert.strictEqual(res1["agmDeadlineDate"], "2026-06-30", 'ACRA-PRIVATE-COMPLIANT value agmDeadlineDate mismatch');
    assert.strictEqual(res1["arFilingDeadlineDate"], "2026-07-31", 'ACRA-PRIVATE-COMPLIANT value arFilingDeadlineDate mismatch');
    assert.strictEqual(res1["isAnnualReturnOverdue"], false, 'ACRA-PRIVATE-COMPLIANT value isAnnualReturnOverdue mismatch');
    assert.ok(typeof res1["statutoryLatePenaltySgd"] === 'number' && Math.abs(res1["statutoryLatePenaltySgd"] - 0) <= 0.0001, 'ACRA-PRIVATE-COMPLIANT numeric statutoryLatePenaltySgd expected 0');
    assert.strictEqual(res1["isGovernanceCompliant"], true, 'ACRA-PRIVATE-COMPLIANT value isGovernanceCompliant mismatch');
    const res2 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for ACRA-PRIVATE-COMPLIANT');
    const res3 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for ACRA-PRIVATE-COMPLIANT');
  }
  { // Case: ACRA-LISTED-OVERDUE-T1
    const input = {"financialYearEndDate":"2025-12-31","isListedCompany":true,"currentDate":"2026-06-01"};
    const res1 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for ACRA-LISTED-OVERDUE-T1');
    assert.strictEqual(res1["companyType"], "PUBLIC_LISTED", 'ACRA-LISTED-OVERDUE-T1 value companyType mismatch');
    assert.strictEqual(res1["agmDeadlineDate"], "2026-04-30", 'ACRA-LISTED-OVERDUE-T1 value agmDeadlineDate mismatch');
    assert.strictEqual(res1["arFilingDeadlineDate"], "2026-05-31", 'ACRA-LISTED-OVERDUE-T1 value arFilingDeadlineDate mismatch');
    assert.strictEqual(res1["isAnnualReturnOverdue"], true, 'ACRA-LISTED-OVERDUE-T1 value isAnnualReturnOverdue mismatch');
    assert.strictEqual(res1["penaltyTier"], "TIER_1_UP_TO_3_MONTHS", 'ACRA-LISTED-OVERDUE-T1 value penaltyTier mismatch');
    assert.ok(typeof res1["statutoryLatePenaltySgd"] === 'number' && Math.abs(res1["statutoryLatePenaltySgd"] - 300) <= 0.0001, 'ACRA-LISTED-OVERDUE-T1 numeric statutoryLatePenaltySgd expected 300');
    const res2 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for ACRA-LISTED-OVERDUE-T1');
    const res3 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for ACRA-LISTED-OVERDUE-T1');
  }
  { // Case: ACRA-SMALL-COMPANY-EXEMPT
    const input = {"isPrivateCompany":true,"currentYearFinancials":{"annualRevenueSgd":4500000,"totalAssetsSgd":3200000,"fullTimeEmployees":18},"priorYearFinancials":{"annualRevenueSgd":3800000,"totalAssetsSgd":2700000,"fullTimeEmployees":15}};
    const res1 = runCase("evaluateSmallCompanyAuditExemption", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for ACRA-SMALL-COMPANY-EXEMPT');
    assert.strictEqual(res1["isExemptFromAudit"], true, 'ACRA-SMALL-COMPANY-EXEMPT value isExemptFromAudit mismatch');
    assert.strictEqual(res1["auditRequirementStatus"], "AUDIT_EXEMPT_UNAUDITED_STATEMENTS_PERMITTED", 'ACRA-SMALL-COMPANY-EXEMPT value auditRequirementStatus mismatch');
    assert.strictEqual(res1["verdictCode"], "QUALIFIES_AS_SMALL_COMPANY_AUDIT_EXEMPT", 'ACRA-SMALL-COMPANY-EXEMPT value verdictCode mismatch');
    const res2 = runCase("evaluateSmallCompanyAuditExemption", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for ACRA-SMALL-COMPANY-EXEMPT');
    const res3 = runCase("evaluateSmallCompanyAuditExemption", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for ACRA-SMALL-COMPANY-EXEMPT');
  }
  { // Case: PDPA-BREACH-NRIC-72H
    const input = {"affectedIndividualsCount":85,"compromisedDataCategories":["NRIC_OR_FIN","FINANCIAL_ACCOUNTS_OR_CREDIT_CARDS"],"annualSingaporeTurnoverSgd":5000000,"assessmentCompletedTimestamp":"2026-11-06T10:00:00.000Z"};
    const res1 = runCase("evaluatePdpaBreachNotification", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for PDPA-BREACH-NRIC-72H');
    assert.strictEqual(res1["isMandatoryToNotifyPdpc"], true, 'PDPA-BREACH-NRIC-72H value isMandatoryToNotifyPdpc mismatch');
    assert.ok(typeof res1["pdpcNotificationDeadlineHours"] === 'number' && Math.abs(res1["pdpcNotificationDeadlineHours"] - 72) <= 0.0001, 'PDPA-BREACH-NRIC-72H numeric pdpcNotificationDeadlineHours expected 72');
    assert.ok(typeof res1["maximumStatutoryFinancialPenaltySgd"] === 'number' && Math.abs(res1["maximumStatutoryFinancialPenaltySgd"] - 1000000) <= 0.0001, 'PDPA-BREACH-NRIC-72H numeric maximumStatutoryFinancialPenaltySgd expected 1000000');
    const res2 = runCase("evaluatePdpaBreachNotification", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for PDPA-BREACH-NRIC-72H');
    const res3 = runCase("evaluatePdpaBreachNotification", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for PDPA-BREACH-NRIC-72H');
  }
  { // Case: ACRA-OVERDUE-TIER-2-PENALTY
    const input = {"financialYearEndDate":"2025-06-30","isListedCompany":false,"hasResidentDirector":false,"isSoleDirectorSecretary":true,"currentDate":"2026-06-01"};
    const res1 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for ACRA-OVERDUE-TIER-2-PENALTY');
    assert.strictEqual(res1["isAnnualReturnOverdue"], true, 'ACRA-OVERDUE-TIER-2-PENALTY value isAnnualReturnOverdue mismatch');
    assert.strictEqual(res1["penaltyTier"], "TIER_2_MORE_THAN_3_MONTHS", 'ACRA-OVERDUE-TIER-2-PENALTY value penaltyTier mismatch');
    assert.ok(typeof res1["statutoryLatePenaltySgd"] === 'number' && Math.abs(res1["statutoryLatePenaltySgd"] - 600) <= 0.0001, 'ACRA-OVERDUE-TIER-2-PENALTY numeric statutoryLatePenaltySgd expected 600');
    assert.strictEqual(res1["isGovernanceCompliant"], false, 'ACRA-OVERDUE-TIER-2-PENALTY value isGovernanceCompliant mismatch');
    const res2 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for ACRA-OVERDUE-TIER-2-PENALTY');
    const res3 = runCase("calculateAcraStatutoryDeadlines", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for ACRA-OVERDUE-TIER-2-PENALTY');
  }
  { // Case: PDPA-BREACH-MINOR-INTERNAL
    const input = {"affectedIndividualsCount":20,"compromisedDataCategories":["EMAIL_ADDRESSES"],"remedialActionEliminatedHarm":true,"annualSingaporeTurnoverSgd":2000000};
    const res1 = runCase("evaluatePdpaBreachNotification", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for PDPA-BREACH-MINOR-INTERNAL');
    assert.strictEqual(res1["isMandatoryToNotifyPdpc"], false, 'PDPA-BREACH-MINOR-INTERNAL value isMandatoryToNotifyPdpc mismatch');
    const res2 = runCase("evaluatePdpaBreachNotification", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for PDPA-BREACH-MINOR-INTERNAL');
    const res3 = runCase("evaluatePdpaBreachNotification", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for PDPA-BREACH-MINOR-INTERNAL');
  }
  { // Case: ACRA-AUDIT-REQUIRED-LARGE
    const input = {"isPrivateCompany":true,"currentYearFinancials":{"annualRevenueSgd":15000000,"totalAssetsSgd":12000000,"fullTimeEmployees":80},"priorYearFinancials":{"annualRevenueSgd":14000000,"totalAssetsSgd":11000000,"fullTimeEmployees":75}};
    const res1 = runCase("evaluateSmallCompanyAuditExemption", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for ACRA-AUDIT-REQUIRED-LARGE');
    assert.strictEqual(res1["isExemptFromAudit"], false, 'ACRA-AUDIT-REQUIRED-LARGE value isExemptFromAudit mismatch');
    assert.strictEqual(res1["auditRequirementStatus"], "STATUTORY_AUDIT_MANDATORY", 'ACRA-AUDIT-REQUIRED-LARGE value auditRequirementStatus mismatch');
    const res2 = runCase("evaluateSmallCompanyAuditExemption", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for ACRA-AUDIT-REQUIRED-LARGE');
    const res3 = runCase("evaluateSmallCompanyAuditExemption", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for ACRA-AUDIT-REQUIRED-LARGE');
  }
  { // Case: LEGAL-DIRECTOR-ELIGIBLE
    const input = {"directorName":"Alice Wong","age":32,"residentialStatus":"SC","isUndischargedBankrupt":false,"hasFraudOrDishonestyConviction":false};
    const res1 = runCase("evaluateDirectorEligibility", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-DIRECTOR-ELIGIBLE');
    assert.strictEqual(res1["isLegallyEligible"], true, 'LEGAL-DIRECTOR-ELIGIBLE value isLegallyEligible mismatch');
    assert.strictEqual(res1["status"], "QUALIFIED_FOR_DIRECTORSHIP", 'LEGAL-DIRECTOR-ELIGIBLE value status mismatch');
    const res2 = runCase("evaluateDirectorEligibility", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-DIRECTOR-ELIGIBLE');
    const res3 = runCase("evaluateDirectorEligibility", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-DIRECTOR-ELIGIBLE');
  }
  { // Case: LEGAL-DIRECTOR-DISQUALIFIED-BANKRUPTCY
    const input = {"directorName":"Bob Smith","age":40,"residentialStatus":"SC","isUndischargedBankrupt":true,"hasFraudOrDishonestyConviction":false};
    const res1 = runCase("evaluateDirectorEligibility", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-DIRECTOR-DISQUALIFIED-BANKRUPTCY');
    assert.strictEqual(res1["isLegallyEligible"], false, 'LEGAL-DIRECTOR-DISQUALIFIED-BANKRUPTCY value isLegallyEligible mismatch');
    assert.strictEqual(res1["status"], "LEGALLY_DISQUALIFIED", 'LEGAL-DIRECTOR-DISQUALIFIED-BANKRUPTCY value status mismatch');
    const res2 = runCase("evaluateDirectorEligibility", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-DIRECTOR-DISQUALIFIED-BANKRUPTCY');
    const res3 = runCase("evaluateDirectorEligibility", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-DIRECTOR-DISQUALIFIED-BANKRUPTCY');
  }
  { // Case: LEGAL-STRIKING-OFF-READY
    const input = {"hasCommencedBusiness":false,"hasOutstandingIrasTaxMatters":false,"hasActiveBankAccounts":false,"hasOutstandingDebtsToGovernmentOrThirdParties":false,"hasOngoingLitigation":false,"hasMajorityShareholderApproval":true};
    const res1 = runCase("evaluateStrikingOffReadiness", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-STRIKING-OFF-READY');
    assert.strictEqual(res1["isEligibleToApply"], true, 'LEGAL-STRIKING-OFF-READY value isEligibleToApply mismatch');
    assert.strictEqual(res1["readinessStatus"], "READY_FOR_STRIKING_OFF_APPLICATION", 'LEGAL-STRIKING-OFF-READY value readinessStatus mismatch');
    const res2 = runCase("evaluateStrikingOffReadiness", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-STRIKING-OFF-READY');
    const res3 = runCase("evaluateStrikingOffReadiness", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-STRIKING-OFF-READY');
  }
  { // Case: LEGAL-STRIKING-OFF-BLOCKED-TAX
    const input = {"hasCommencedBusiness":true,"hasCeasedTrading":false,"hasOutstandingIrasTaxMatters":true,"hasActiveBankAccounts":true,"hasOutstandingDebtsToGovernmentOrThirdParties":true};
    const res1 = runCase("evaluateStrikingOffReadiness", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-STRIKING-OFF-BLOCKED-TAX');
    assert.strictEqual(res1["isEligibleToApply"], false, 'LEGAL-STRIKING-OFF-BLOCKED-TAX value isEligibleToApply mismatch');
    assert.strictEqual(res1["readinessStatus"], "BLOCKED_BY_STATUTORY_REQUIREMENTS", 'LEGAL-STRIKING-OFF-BLOCKED-TAX value readinessStatus mismatch');
    const res2 = runCase("evaluateStrikingOffReadiness", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-STRIKING-OFF-BLOCKED-TAX');
    const res3 = runCase("evaluateStrikingOffReadiness", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-STRIKING-OFF-BLOCKED-TAX');
  }
  { // Case: LEGAL-TRADEMARK-DISTINCTIVE
    const input = {"markName":"Zalvoria","niceClasses":[9,42],"usesPreApprovedSpecification":true,"isInventedWord":true};
    const res1 = runCase("evaluateTrademarkRegistrability", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-TRADEMARK-DISTINCTIVE');
    assert.strictEqual(res1["outcomeVerdict"], "HIGH_CHANCE_OF_REGISTRATION", 'LEGAL-TRADEMARK-DISTINCTIVE value outcomeVerdict mismatch');
    assert.ok(typeof res1["totalValidClasses"] === 'number' && Math.abs(res1["totalValidClasses"] - 2) <= 0.0001, 'LEGAL-TRADEMARK-DISTINCTIVE numeric totalValidClasses expected 2');
    const res2 = runCase("evaluateTrademarkRegistrability", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-TRADEMARK-DISTINCTIVE');
    const res3 = runCase("evaluateTrademarkRegistrability", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-TRADEMARK-DISTINCTIVE');
  }
  { // Case: LEGAL-TRADEMARK-DESCRIPTIVE-FAIL
    const input = {"markName":"Singapore Best Tech","niceClasses":[9],"isInventedWord":false,"hasPriorIdenticalMarkInSameClass":true};
    const res1 = runCase("evaluateTrademarkRegistrability", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-TRADEMARK-DESCRIPTIVE-FAIL');
    assert.strictEqual(res1["outcomeVerdict"], "LIKELY_REJECTED", 'LEGAL-TRADEMARK-DESCRIPTIVE-FAIL value outcomeVerdict mismatch');
    const res2 = runCase("evaluateTrademarkRegistrability", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-TRADEMARK-DESCRIPTIVE-FAIL');
    const res3 = runCase("evaluateTrademarkRegistrability", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-TRADEMARK-DESCRIPTIVE-FAIL');
  }
  { // Case: LEGAL-IPOS-FEES-CALCULATION
    const input = {"classes":[9,35,42],"usesPreApprovedSpecification":true};
    const res1 = runCase("calculateIposFilingFees", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-IPOS-FEES-CALCULATION');
    assert.ok(typeof res1["classCount"] === 'number' && Math.abs(res1["classCount"] - 3) <= 0.0001, 'LEGAL-IPOS-FEES-CALCULATION numeric classCount expected 3');
    assert.ok(typeof res1["feePerClassSgd"] === 'number' && Math.abs(res1["feePerClassSgd"] - 280) <= 0.0001, 'LEGAL-IPOS-FEES-CALCULATION numeric feePerClassSgd expected 280');
    assert.ok(typeof res1["totalFeesPayableSgd"] === 'number' && Math.abs(res1["totalFeesPayableSgd"] - 840) <= 0.0001, 'LEGAL-IPOS-FEES-CALCULATION numeric totalFeesPayableSgd expected 840');
    const res2 = runCase("calculateIposFilingFees", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-IPOS-FEES-CALCULATION');
    const res3 = runCase("calculateIposFilingFees", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-IPOS-FEES-CALCULATION');
  }
  { // Case: LEGAL-CONTRACT-HIGH-RISK
    const input = {"governingLawCountry":"FOREIGN","disputeForum":"FOREIGN_COURTS","contractValueSgd":1000000,"liabilityCapSgd":null,"hasUnlimitedIndemnity":true,"excludesConsequentialLoss":false,"hasUnilateralTerminationForConvenience":true,"terminationNoticeDays":7};
    const res1 = runCase("evaluateContractRisk", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-CONTRACT-HIGH-RISK');
    assert.strictEqual(res1["riskTier"], "CRITICAL", 'LEGAL-CONTRACT-HIGH-RISK value riskTier mismatch');
    const res2 = runCase("evaluateContractRisk", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-CONTRACT-HIGH-RISK');
    const res3 = runCase("evaluateContractRisk", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-CONTRACT-HIGH-RISK');
  }
  { // Case: LEGAL-CONTRACT-BALANCED-SG
    const input = {"governingLawCountry":"SINGAPORE","disputeForum":"SIAC","contractValueSgd":500000,"liabilityCapSgd":500000,"hasUnlimitedIndemnity":false,"excludesConsequentialLoss":true,"hasUnilateralTerminationForConvenience":false,"terminationNoticeDays":30};
    const res1 = runCase("evaluateContractRisk", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-CONTRACT-BALANCED-SG');
    assert.strictEqual(res1["riskTier"], "LOW", 'LEGAL-CONTRACT-BALANCED-SG value riskTier mismatch');
    assert.ok(typeof res1["contractRiskScore"] === 'number' && Math.abs(res1["contractRiskScore"] - 0) <= 0.0001, 'LEGAL-CONTRACT-BALANCED-SG numeric contractRiskScore expected 0');
    const res2 = runCase("evaluateContractRisk", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-CONTRACT-BALANCED-SG');
    const res3 = runCase("evaluateContractRisk", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-CONTRACT-BALANCED-SG');
  }
  { // Case: LEGAL-CORP-SEC-COMPLIANT
    const input = {"companyType":"PRIVATE","monthsSinceIncorporation":4,"secretaryProfile":{"isAppointed":true,"isOrdinarilyResidentInSingapore":true,"isAlsoSoleDirector":false},"rorcCompliance":{"isRorcMaintained":true,"daysSinceControllerInfoChange":5,"isLodgedWithAcraCentralRegister":true}};
    const res1 = runCase("auditCorporateSecretarial", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-CORP-SEC-COMPLIANT');
    assert.strictEqual(res1["isFullyCompliant"], true, 'LEGAL-CORP-SEC-COMPLIANT value isFullyCompliant mismatch');
    assert.ok(typeof res1["complianceScore"] === 'number' && Math.abs(res1["complianceScore"] - 100) <= 0.0001, 'LEGAL-CORP-SEC-COMPLIANT numeric complianceScore expected 100');
    const res2 = runCase("auditCorporateSecretarial", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-CORP-SEC-COMPLIANT');
    const res3 = runCase("auditCorporateSecretarial", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-CORP-SEC-COMPLIANT');
  }
  { // Case: LEGAL-CORP-SEC-DEFICIT
    const input = {"companyType":"PRIVATE","monthsSinceIncorporation":8,"secretaryProfile":{"isAppointed":false},"rorcCompliance":{"isRorcMaintained":false,"daysSinceControllerInfoChange":20,"isLodgedWithAcraCentralRegister":false}};
    const res1 = runCase("auditCorporateSecretarial", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-CORP-SEC-DEFICIT');
    assert.strictEqual(res1["isFullyCompliant"], false, 'LEGAL-CORP-SEC-DEFICIT value isFullyCompliant mismatch');
    const res2 = runCase("auditCorporateSecretarial", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-CORP-SEC-DEFICIT');
    const res3 = runCase("auditCorporateSecretarial", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-CORP-SEC-DEFICIT');
  }
  { // Case: LEGAL-TADM-SALARY-DISPUTE
    const input = {"claimType":"SALARY_ARREARS","claimAmountSgd":15000,"isUnionMember":false,"monthsSinceDisputeEvent":4,"wasEmploymentTerminated":true};
    const res1 = runCase("evaluateTadmDispute", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-TADM-SALARY-DISPUTE');
    assert.strictEqual(res1["isEligibleForTadmMediation"], true, 'LEGAL-TADM-SALARY-DISPUTE value isEligibleForTadmMediation mismatch');
    assert.strictEqual(res1["isWithinStatutoryClaimLimit"], true, 'LEGAL-TADM-SALARY-DISPUTE value isWithinStatutoryClaimLimit mismatch');
    const res2 = runCase("evaluateTadmDispute", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-TADM-SALARY-DISPUTE');
    const res3 = runCase("evaluateTadmDispute", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-TADM-SALARY-DISPUTE');
  }
  { // Case: LEGAL-TADM-FEE-LOW-CLAIM
    const input = {"claimAmountSgd":8000};
    const res1 = runCase("calculateTadmRegistrationFee", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-TADM-FEE-LOW-CLAIM');
    assert.ok(typeof res1["applicableFeeSgd"] === 'number' && Math.abs(res1["applicableFeeSgd"] - 10) <= 0.0001, 'LEGAL-TADM-FEE-LOW-CLAIM numeric applicableFeeSgd expected 10');
    const res2 = runCase("calculateTadmRegistrationFee", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-TADM-FEE-LOW-CLAIM');
    const res3 = runCase("calculateTadmRegistrationFee", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-TADM-FEE-LOW-CLAIM');
  }
  { // Case: LEGAL-TADM-FEE-HIGH-CLAIM
    const input = {"claimAmountSgd":18000};
    const res1 = runCase("calculateTadmRegistrationFee", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for LEGAL-TADM-FEE-HIGH-CLAIM');
    assert.ok(typeof res1["applicableFeeSgd"] === 'number' && Math.abs(res1["applicableFeeSgd"] - 20) <= 0.0001, 'LEGAL-TADM-FEE-HIGH-CLAIM numeric applicableFeeSgd expected 20');
    const res2 = runCase("calculateTadmRegistrationFee", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for LEGAL-TADM-FEE-HIGH-CLAIM');
    const res3 = runCase("calculateTadmRegistrationFee", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for LEGAL-TADM-FEE-HIGH-CLAIM');
  }
  { // Case: PDPA-BREACH-MAJOR-500
    const input = {"affectedIndividualsCount":650,"compromisedDataCategories":["EMAIL_ADDRESSES","NAMES"],"annualSingaporeTurnoverSgd":80000000};
    const res1 = runCase("evaluatePdpaBreachNotification", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for PDPA-BREACH-MAJOR-500');
    assert.strictEqual(res1["isSignificantScaleBreach"], true, 'PDPA-BREACH-MAJOR-500 value isSignificantScaleBreach mismatch');
    assert.strictEqual(res1["isMandatoryToNotifyPdpc"], true, 'PDPA-BREACH-MAJOR-500 value isMandatoryToNotifyPdpc mismatch');
    const res2 = runCase("evaluatePdpaBreachNotification", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for PDPA-BREACH-MAJOR-500');
    const res3 = runCase("evaluatePdpaBreachNotification", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for PDPA-BREACH-MAJOR-500');
  }
  console.log('    ✅ legal-sg: 22 cases verified.');

  // ==========================================
  // Domain: finance-sg (25 cases)
  // ==========================================
  console.log('  📂 Testing finance-sg golden cases...');
  { // Case: SORA-WACC-STANDARD
    const input = {"marketValueOfEquitySgd":6000000,"marketValueOfDebtSgd":4000000,"riskFreeRate":0.03,"equityBeta":1.2,"equityRiskPremium":0.055,"soraBaseRate":0.035,"debtCreditSpread":0.015,"citTaxRate":0.17};
    const res1 = runCase("calculateSingaporeWacc", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for SORA-WACC-STANDARD');
    assert.ok(typeof res1["equityWeightPercent"] === 'number' && Math.abs(res1["equityWeightPercent"] - 60) <= 0.0001, 'SORA-WACC-STANDARD numeric equityWeightPercent expected 60');
    assert.ok(typeof res1["debtWeightPercent"] === 'number' && Math.abs(res1["debtWeightPercent"] - 40) <= 0.0001, 'SORA-WACC-STANDARD numeric debtWeightPercent expected 40');
    assert.ok(typeof res1["costOfEquityKePercent"] === 'number' && Math.abs(res1["costOfEquityKePercent"] - 9.6) <= 0.0001, 'SORA-WACC-STANDARD numeric costOfEquityKePercent expected 9.6');
    assert.ok(typeof res1["preTaxCostOfDebtKdPercent"] === 'number' && Math.abs(res1["preTaxCostOfDebtKdPercent"] - 5) <= 0.0001, 'SORA-WACC-STANDARD numeric preTaxCostOfDebtKdPercent expected 5');
    assert.ok(typeof res1["afterTaxCostOfDebtPercent"] === 'number' && Math.abs(res1["afterTaxCostOfDebtPercent"] - 4.15) <= 0.0001, 'SORA-WACC-STANDARD numeric afterTaxCostOfDebtPercent expected 4.15');
    assert.ok(typeof res1["weightedAverageCostOfCapitalPercent"] === 'number' && Math.abs(res1["weightedAverageCostOfCapitalPercent"] - 7.42) <= 0.0001, 'SORA-WACC-STANDARD numeric weightedAverageCostOfCapitalPercent expected 7.42');
    const res2 = runCase("calculateSingaporeWacc", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for SORA-WACC-STANDARD');
    const res3 = runCase("calculateSingaporeWacc", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for SORA-WACC-STANDARD');
  }
  { // Case: SORA-WACC-ALL-EQUITY
    const input = {"marketValueOfEquitySgd":5000000,"marketValueOfDebtSgd":0,"riskFreeRate":0.03,"equityBeta":1,"equityRiskPremium":0.05};
    const res1 = runCase("calculateSingaporeWacc", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for SORA-WACC-ALL-EQUITY');
    assert.ok(typeof res1["equityWeightPercent"] === 'number' && Math.abs(res1["equityWeightPercent"] - 100) <= 0.0001, 'SORA-WACC-ALL-EQUITY numeric equityWeightPercent expected 100');
    assert.ok(typeof res1["debtWeightPercent"] === 'number' && Math.abs(res1["debtWeightPercent"] - 0) <= 0.0001, 'SORA-WACC-ALL-EQUITY numeric debtWeightPercent expected 0');
    assert.ok(typeof res1["costOfEquityKePercent"] === 'number' && Math.abs(res1["costOfEquityKePercent"] - 8) <= 0.0001, 'SORA-WACC-ALL-EQUITY numeric costOfEquityKePercent expected 8');
    assert.ok(typeof res1["weightedAverageCostOfCapitalPercent"] === 'number' && Math.abs(res1["weightedAverageCostOfCapitalPercent"] - 8) <= 0.0001, 'SORA-WACC-ALL-EQUITY numeric weightedAverageCostOfCapitalPercent expected 8');
    const res2 = runCase("calculateSingaporeWacc", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for SORA-WACC-ALL-EQUITY');
    const res3 = runCase("calculateSingaporeWacc", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for SORA-WACC-ALL-EQUITY');
  }
  { // Case: WORKING-CAPITAL-CCC-SURPLUS
    const input = {"currentAssetsSgd":2000000,"currentLiabilitiesSgd":1000000,"cashAndEquivalentsSgd":500000,"tradeReceivablesSgd":700000,"inventorySgd":800000,"tradePayablesSgd":400000,"annualRevenueSgd":7300000,"annualCogsSgd":3650000};
    const res1 = runCase("calculateSingaporeWorkingCapital", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for WORKING-CAPITAL-CCC-SURPLUS');
    assert.ok(typeof res1["netWorkingCapitalSgd"] === 'number' && Math.abs(res1["netWorkingCapitalSgd"] - 1000000) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric netWorkingCapitalSgd expected 1000000');
    assert.ok(typeof res1["currentRatio"] === 'number' && Math.abs(res1["currentRatio"] - 2) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric currentRatio expected 2');
    assert.ok(typeof res1["quickRatio"] === 'number' && Math.abs(res1["quickRatio"] - 1.2) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric quickRatio expected 1.2');
    assert.ok(typeof res1["cashRatio"] === 'number' && Math.abs(res1["cashRatio"] - 0.5) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric cashRatio expected 0.5');
    assert.strictEqual(res1["isSolventShortTerm"], true, 'WORKING-CAPITAL-CCC-SURPLUS value isSolventShortTerm mismatch');
    assert.ok(typeof res1["daysSalesOutstandingDso"] === 'number' && Math.abs(res1["daysSalesOutstandingDso"] - 35) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric daysSalesOutstandingDso expected 35');
    assert.ok(typeof res1["daysInventoryOutstandingDio"] === 'number' && Math.abs(res1["daysInventoryOutstandingDio"] - 80) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric daysInventoryOutstandingDio expected 80');
    assert.ok(typeof res1["daysPayableOutstandingDpo"] === 'number' && Math.abs(res1["daysPayableOutstandingDpo"] - 40) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric daysPayableOutstandingDpo expected 40');
    assert.ok(typeof res1["operatingCycleDays"] === 'number' && Math.abs(res1["operatingCycleDays"] - 115) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric operatingCycleDays expected 115');
    assert.ok(typeof res1["cashConversionCycleDays"] === 'number' && Math.abs(res1["cashConversionCycleDays"] - 75) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric cashConversionCycleDays expected 75');
    assert.ok(typeof res1["workingCapitalRequiredForCccSgd"] === 'number' && Math.abs(res1["workingCapitalRequiredForCccSgd"] - 750000) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric workingCapitalRequiredForCccSgd expected 750000');
    assert.ok(typeof res1["workingCapitalSurplusOrDeficitSgd"] === 'number' && Math.abs(res1["workingCapitalSurplusOrDeficitSgd"] - 250000) <= 0.0001, 'WORKING-CAPITAL-CCC-SURPLUS numeric workingCapitalSurplusOrDeficitSgd expected 250000');
    assert.strictEqual(res1["position"], "WORKING_CAPITAL_SURPLUS", 'WORKING-CAPITAL-CCC-SURPLUS value position mismatch');
    const res2 = runCase("calculateSingaporeWorkingCapital", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for WORKING-CAPITAL-CCC-SURPLUS');
    const res3 = runCase("calculateSingaporeWorkingCapital", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for WORKING-CAPITAL-CCC-SURPLUS');
  }
  { // Case: FIN-WORKING-CAPITAL-DEFICIT
    const input = {"currentAssetsSgd":800000,"currentLiabilitiesSgd":1200000,"cashAndEquivalentsSgd":50000,"tradeReceivablesSgd":450000,"inventorySgd":300000,"tradePayablesSgd":800000,"annualRevenueSgd":3650000,"annualCogsSgd":2500000};
    const res1 = runCase("calculateSingaporeWorkingCapital", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-WORKING-CAPITAL-DEFICIT');
    assert.ok(typeof res1["netWorkingCapitalSgd"] === 'number' && Math.abs(res1["netWorkingCapitalSgd"] - -400000) <= 0.0001, 'FIN-WORKING-CAPITAL-DEFICIT numeric netWorkingCapitalSgd expected -400000');
    assert.strictEqual(res1["isSolventShortTerm"], false, 'FIN-WORKING-CAPITAL-DEFICIT value isSolventShortTerm mismatch');
    assert.strictEqual(res1["position"], "WORKING_CAPITAL_DEFICIT", 'FIN-WORKING-CAPITAL-DEFICIT value position mismatch');
    const res2 = runCase("calculateSingaporeWorkingCapital", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-WORKING-CAPITAL-DEFICIT');
    const res3 = runCase("calculateSingaporeWorkingCapital", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-WORKING-CAPITAL-DEFICIT');
  }
  { // Case: FIN-SFRS-115-TRANSACTION-ALLOCATION
    const input = {"totalTransactionPriceSgd":100000,"performanceObligations":[{"id":"SOFTWARE_LICENSE","standaloneSellingPriceSgd":80000},{"id":"IMPLEMENTATION_SERVICE","standaloneSellingPriceSgd":40000}]};
    const res1 = runCase("allocateTransactionPriceSfrs115", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-SFRS-115-TRANSACTION-ALLOCATION');
    assert.ok(typeof res1["totalTransactionPriceSgd"] === 'number' && Math.abs(res1["totalTransactionPriceSgd"] - 100000) <= 0.0001, 'FIN-SFRS-115-TRANSACTION-ALLOCATION numeric totalTransactionPriceSgd expected 100000');
    assert.ok(typeof res1["totalStandaloneSellingPriceSgd"] === 'number' && Math.abs(res1["totalStandaloneSellingPriceSgd"] - 120000) <= 0.0001, 'FIN-SFRS-115-TRANSACTION-ALLOCATION numeric totalStandaloneSellingPriceSgd expected 120000');
    assert.ok(typeof res1["bundleDiscountSgd"] === 'number' && Math.abs(res1["bundleDiscountSgd"] - 20000) <= 0.0001, 'FIN-SFRS-115-TRANSACTION-ALLOCATION numeric bundleDiscountSgd expected 20000');
    const res2 = runCase("allocateTransactionPriceSfrs115", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-SFRS-115-TRANSACTION-ALLOCATION');
    const res3 = runCase("allocateTransactionPriceSfrs115", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-SFRS-115-TRANSACTION-ALLOCATION');
  }
  { // Case: FIN-SFRS-INCOME-STATEMENT
    const input = {"revenueSgd":1000000,"costOfSalesSgd":400000,"operatingExpensesSgd":250000,"depreciationAndAmortisationSgd":50000,"financeCostsSgd":20000,"taxExpenseSgd":47600};
    const res1 = runCase("compileIncomeStatement", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-SFRS-INCOME-STATEMENT');
    assert.ok(typeof res1["grossProfitSgd"] === 'number' && Math.abs(res1["grossProfitSgd"] - 600000) <= 0.0001, 'FIN-SFRS-INCOME-STATEMENT numeric grossProfitSgd expected 600000');
    assert.ok(typeof res1["ebitdaSgd"] === 'number' && Math.abs(res1["ebitdaSgd"] - 350000) <= 0.0001, 'FIN-SFRS-INCOME-STATEMENT numeric ebitdaSgd expected 350000');
    assert.ok(typeof res1["operatingProfitEbitSgd"] === 'number' && Math.abs(res1["operatingProfitEbitSgd"] - 300000) <= 0.0001, 'FIN-SFRS-INCOME-STATEMENT numeric operatingProfitEbitSgd expected 300000');
    assert.ok(typeof res1["profitBeforeTaxSgd"] === 'number' && Math.abs(res1["profitBeforeTaxSgd"] - 280000) <= 0.0001, 'FIN-SFRS-INCOME-STATEMENT numeric profitBeforeTaxSgd expected 280000');
    assert.ok(typeof res1["netProfitSgd"] === 'number' && Math.abs(res1["netProfitSgd"] - 232400) <= 0.0001, 'FIN-SFRS-INCOME-STATEMENT numeric netProfitSgd expected 232400');
    const res2 = runCase("compileIncomeStatement", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-SFRS-INCOME-STATEMENT');
    const res3 = runCase("compileIncomeStatement", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-SFRS-INCOME-STATEMENT');
  }
  { // Case: FIN-SFRS-BALANCE-SHEET
    const input = {"currentAssets":{"cashAndCashEquivalentsSgd":200000,"tradeAndOtherReceivablesSgd":150000,"inventoriesSgd":150000},"nonCurrentAssets":{"propertyPlantEquipmentSgd":500000,"rightOfUseAssetsSgd":200000},"currentLiabilities":{"tradeAndOtherPayablesSgd":120000,"shortTermBorrowingsSgd":80000},"nonCurrentLiabilities":{"longTermBorrowingsSgd":250000,"leaseLiabilitiesNonCurrentSgd":150000},"equity":{"shareCapitalSgd":200000,"retainedEarningsSgd":400000}};
    const res1 = runCase("compileBalanceSheet", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-SFRS-BALANCE-SHEET');
    assert.ok(typeof res1["totalAssetsSgd"] === 'number' && Math.abs(res1["totalAssetsSgd"] - 1200000) <= 0.0001, 'FIN-SFRS-BALANCE-SHEET numeric totalAssetsSgd expected 1200000');
    assert.ok(typeof res1["totalLiabilitiesSgd"] === 'number' && Math.abs(res1["totalLiabilitiesSgd"] - 600000) <= 0.0001, 'FIN-SFRS-BALANCE-SHEET numeric totalLiabilitiesSgd expected 600000');
    assert.strictEqual(res1["isBalanced"], true, 'FIN-SFRS-BALANCE-SHEET value isBalanced mismatch');
    assert.ok(typeof res1["differenceSgd"] === 'number' && Math.abs(res1["differenceSgd"] - 0) <= 0.0001, 'FIN-SFRS-BALANCE-SHEET numeric differenceSgd expected 0');
    const res2 = runCase("compileBalanceSheet", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-SFRS-BALANCE-SHEET');
    const res3 = runCase("compileBalanceSheet", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-SFRS-BALANCE-SHEET');
  }
  { // Case: FIN-NPV-CALCULATION
    const input = {"initialOutlaySgd":100000,"annualCashFlowsSgd":[35000,45000,50000],"discountRate":0.08};
    const res1 = runCase("calculateNpv", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-NPV-CALCULATION');
    assert.ok(typeof res1["value"] === 'number' && Math.abs(res1["value"] - 10679.27) <= 0.0001, 'FIN-NPV-CALCULATION numeric value expected 10679.27');
    const res2 = runCase("calculateNpv", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-NPV-CALCULATION');
    const res3 = runCase("calculateNpv", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-NPV-CALCULATION');
  }
  { // Case: FIN-IRR-CALCULATION
    const input = {"initialOutlaySgd":100000,"annualCashFlowsSgd":[40000,50000,40000]};
    const res1 = runCase("calculateIrr", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-IRR-CALCULATION');
    assert.ok(typeof res1["value"] === 'number' && Math.abs(res1["value"] - 0.1433) <= 0.0001, 'FIN-IRR-CALCULATION numeric value expected 0.1433');
    const res2 = runCase("calculateIrr", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-IRR-CALCULATION');
    const res3 = runCase("calculateIrr", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-IRR-CALCULATION');
  }
  { // Case: FIN-PAYBACK-PERIOD
    const input = {"initialOutlaySgd":200000,"annualCashFlowsSgd":[80000,80000,80000,80000],"discountRate":0.08};
    const res1 = runCase("calculatePaybackPeriod", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-PAYBACK-PERIOD');
    assert.ok(typeof res1["undiscountedPaybackYears"] === 'number' && Math.abs(res1["undiscountedPaybackYears"] - 2.5) <= 0.0001, 'FIN-PAYBACK-PERIOD numeric undiscountedPaybackYears expected 2.5');
    const res2 = runCase("calculatePaybackPeriod", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-PAYBACK-PERIOD');
    const res3 = runCase("calculatePaybackPeriod", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-PAYBACK-PERIOD');
  }
  { // Case: FIN-CAPITAL-INVESTMENT-COMPREHENSIVE
    const input = {"projectName":"High-Tech Automated Line","initialInvestmentSgd":100000,"annualCashFlowsSgd":[35000,40000,45000,30000],"discountRate":0.08};
    const res1 = runCase("evaluateCapitalInvestment", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-CAPITAL-INVESTMENT-COMPREHENSIVE');
    assert.strictEqual(res1["isAcceptable"], true, 'FIN-CAPITAL-INVESTMENT-COMPREHENSIVE value isAcceptable mismatch');
    assert.strictEqual(res1["verdict"], "ACCEPT_PROJECT", 'FIN-CAPITAL-INVESTMENT-COMPREHENSIVE value verdict mismatch');
    const res2 = runCase("evaluateCapitalInvestment", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-CAPITAL-INVESTMENT-COMPREHENSIVE');
    const res3 = runCase("evaluateCapitalInvestment", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-CAPITAL-INVESTMENT-COMPREHENSIVE');
  }
  { // Case: FIN-SFRS-109-ECL-MATRIX
    const input = {"currentReceivablesSgd":300000,"pastDue1To30DaysSgd":80000,"pastDue31To60DaysSgd":40000,"pastDue61To90DaysSgd":20000,"moreThan90DaysSgd":10000,"macroeconomicMultiplier":1,"specificImpairmentSgd":5000};
    const res1 = runCase("calculateSfrs109Ecl", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-SFRS-109-ECL-MATRIX');
    assert.ok(typeof res1["grossTradeReceivablesSgd"] === 'number' && Math.abs(res1["grossTradeReceivablesSgd"] - 450000) <= 0.0001, 'FIN-SFRS-109-ECL-MATRIX numeric grossTradeReceivablesSgd expected 450000');
    assert.ok(typeof res1["totalGeneralEclAllowanceSgd"] === 'number' && Math.abs(res1["totalGeneralEclAllowanceSgd"] - 13500) <= 0.0001, 'FIN-SFRS-109-ECL-MATRIX numeric totalGeneralEclAllowanceSgd expected 13500');
    assert.ok(typeof res1["specificImpairmentAllowanceSgd"] === 'number' && Math.abs(res1["specificImpairmentAllowanceSgd"] - 5000) <= 0.0001, 'FIN-SFRS-109-ECL-MATRIX numeric specificImpairmentAllowanceSgd expected 5000');
    assert.ok(typeof res1["totalEclAllowanceSgd"] === 'number' && Math.abs(res1["totalEclAllowanceSgd"] - 18500) <= 0.0001, 'FIN-SFRS-109-ECL-MATRIX numeric totalEclAllowanceSgd expected 18500');
    assert.ok(typeof res1["netTradeReceivablesSgd"] === 'number' && Math.abs(res1["netTradeReceivablesSgd"] - 431500) <= 0.0001, 'FIN-SFRS-109-ECL-MATRIX numeric netTradeReceivablesSgd expected 431500');
    assert.ok(typeof res1["taxDeductibleSpecificProvisionSgd"] === 'number' && Math.abs(res1["taxDeductibleSpecificProvisionSgd"] - 5000) <= 0.0001, 'FIN-SFRS-109-ECL-MATRIX numeric taxDeductibleSpecificProvisionSgd expected 5000');
    assert.ok(typeof res1["nonDeductibleGeneralProvisionSgd"] === 'number' && Math.abs(res1["nonDeductibleGeneralProvisionSgd"] - 13500) <= 0.0001, 'FIN-SFRS-109-ECL-MATRIX numeric nonDeductibleGeneralProvisionSgd expected 13500');
    const res2 = runCase("calculateSfrs109Ecl", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-SFRS-109-ECL-MATRIX');
    const res3 = runCase("calculateSfrs109Ecl", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-SFRS-109-ECL-MATRIX');
  }
  { // Case: FIN-INVENTORY-FIFO
    const input = {"purchases":[{"units":100,"unitCostSgd":10},{"units":150,"unitCostSgd":15}],"unitsSold":120};
    const res1 = runCase("calculateFifoInventory", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-INVENTORY-FIFO');
    assert.ok(typeof res1["unitsSold"] === 'number' && Math.abs(res1["unitsSold"] - 120) <= 0.0001, 'FIN-INVENTORY-FIFO numeric unitsSold expected 120');
    assert.ok(typeof res1["endingInventoryUnits"] === 'number' && Math.abs(res1["endingInventoryUnits"] - 130) <= 0.0001, 'FIN-INVENTORY-FIFO numeric endingInventoryUnits expected 130');
    assert.ok(typeof res1["costOfGoodsSoldSgd"] === 'number' && Math.abs(res1["costOfGoodsSoldSgd"] - 1300) <= 0.0001, 'FIN-INVENTORY-FIFO numeric costOfGoodsSoldSgd expected 1300');
    assert.ok(typeof res1["endingInventoryValueSgd"] === 'number' && Math.abs(res1["endingInventoryValueSgd"] - 1950) <= 0.0001, 'FIN-INVENTORY-FIFO numeric endingInventoryValueSgd expected 1950');
    const res2 = runCase("calculateFifoInventory", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-INVENTORY-FIFO');
    const res3 = runCase("calculateFifoInventory", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-INVENTORY-FIFO');
  }
  { // Case: FIN-INVENTORY-WAC
    const input = {"purchases":[{"units":100,"unitCostSgd":10},{"units":150,"unitCostSgd":15}],"unitsSold":120};
    const res1 = runCase("calculateWeightedAverageInventory", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-INVENTORY-WAC');
    assert.ok(typeof res1["endingInventoryUnits"] === 'number' && Math.abs(res1["endingInventoryUnits"] - 130) <= 0.0001, 'FIN-INVENTORY-WAC numeric endingInventoryUnits expected 130');
    assert.ok(typeof res1["averageUnitCostSgd"] === 'number' && Math.abs(res1["averageUnitCostSgd"] - 13) <= 0.0001, 'FIN-INVENTORY-WAC numeric averageUnitCostSgd expected 13');
    assert.ok(typeof res1["costOfGoodsSoldSgd"] === 'number' && Math.abs(res1["costOfGoodsSoldSgd"] - 1560) <= 0.0001, 'FIN-INVENTORY-WAC numeric costOfGoodsSoldSgd expected 1560');
    assert.ok(typeof res1["endingInventoryValueSgd"] === 'number' && Math.abs(res1["endingInventoryValueSgd"] - 1690) <= 0.0001, 'FIN-INVENTORY-WAC numeric endingInventoryValueSgd expected 1690');
    const res2 = runCase("calculateWeightedAverageInventory", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-INVENTORY-WAC');
    const res3 = runCase("calculateWeightedAverageInventory", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-INVENTORY-WAC');
  }
  { // Case: FIN-INVENTORY-NRV-WRITEDOWN
    const input = {"inventoryCostSgd":50000,"estimatedSellingPriceSgd":45000,"estimatedCompletionCostSgd":2000,"estimatedSellingExpenseSgd":1000};
    const res1 = runCase("evaluateLowerOfCostAndNrv", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-INVENTORY-NRV-WRITEDOWN');
    assert.ok(typeof res1["costSgd"] === 'number' && Math.abs(res1["costSgd"] - 50000) <= 0.0001, 'FIN-INVENTORY-NRV-WRITEDOWN numeric costSgd expected 50000');
    assert.ok(typeof res1["netRealisableValueSgd"] === 'number' && Math.abs(res1["netRealisableValueSgd"] - 42000) <= 0.0001, 'FIN-INVENTORY-NRV-WRITEDOWN numeric netRealisableValueSgd expected 42000');
    assert.ok(typeof res1["finalCarryingValueBalanceSheetSgd"] === 'number' && Math.abs(res1["finalCarryingValueBalanceSheetSgd"] - 42000) <= 0.0001, 'FIN-INVENTORY-NRV-WRITEDOWN numeric finalCarryingValueBalanceSheetSgd expected 42000');
    assert.strictEqual(res1["isWriteDownRequired"], true, 'FIN-INVENTORY-NRV-WRITEDOWN value isWriteDownRequired mismatch');
    assert.ok(typeof res1["inventoryWriteDownExpenseSgd"] === 'number' && Math.abs(res1["inventoryWriteDownExpenseSgd"] - 8000) <= 0.0001, 'FIN-INVENTORY-NRV-WRITEDOWN numeric inventoryWriteDownExpenseSgd expected 8000');
    const res2 = runCase("evaluateLowerOfCostAndNrv", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-INVENTORY-NRV-WRITEDOWN');
    const res3 = runCase("evaluateLowerOfCostAndNrv", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-INVENTORY-NRV-WRITEDOWN');
  }
  { // Case: FIN-RATIOS-14-STANDARD
    const input = {"currentAssetsSgd":500000,"currentLiabilitiesSgd":250000,"cashAndEquivalentsSgd":100000,"inventorySgd":120000,"tradeReceivablesSgd":180000,"totalAssetsSgd":1000000,"totalLiabilitiesSgd":400000,"totalDebtSgd":200000,"totalEquitySgd":600000,"revenueSgd":1200000,"costOfGoodsSoldSgd":600000,"ebitOperatingProfitSgd":200000,"netProfitSgd":150000,"interestExpenseSgd":20000};
    const res1 = runCase("analyzeFinancialRatios", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-RATIOS-14-STANDARD');
    assert.ok(typeof res1["currentRatio"] === 'number' && Math.abs(res1["currentRatio"] - 2) <= 0.0001, 'FIN-RATIOS-14-STANDARD numeric currentRatio expected 2');
    assert.ok(typeof res1["quickRatio"] === 'number' && Math.abs(res1["quickRatio"] - 1.52) <= 0.0001, 'FIN-RATIOS-14-STANDARD numeric quickRatio expected 1.52');
    assert.ok(typeof res1["cashRatio"] === 'number' && Math.abs(res1["cashRatio"] - 0.4) <= 0.0001, 'FIN-RATIOS-14-STANDARD numeric cashRatio expected 0.4');
    assert.ok(typeof res1["debtToEquityRatio"] === 'number' && Math.abs(res1["debtToEquityRatio"] - 0.33) <= 0.0001, 'FIN-RATIOS-14-STANDARD numeric debtToEquityRatio expected 0.33');
    assert.ok(typeof res1["interestCoverageRatio"] === 'number' && Math.abs(res1["interestCoverageRatio"] - 10) <= 0.0001, 'FIN-RATIOS-14-STANDARD numeric interestCoverageRatio expected 10');
    assert.ok(typeof res1["grossProfitMarginPercent"] === 'number' && Math.abs(res1["grossProfitMarginPercent"] - 50) <= 0.0001, 'FIN-RATIOS-14-STANDARD numeric grossProfitMarginPercent expected 50');
    assert.ok(typeof res1["netProfitMarginPercent"] === 'number' && Math.abs(res1["netProfitMarginPercent"] - 12.5) <= 0.0001, 'FIN-RATIOS-14-STANDARD numeric netProfitMarginPercent expected 12.5');
    assert.ok(typeof res1["returnOnEquityPercent"] === 'number' && Math.abs(res1["returnOnEquityPercent"] - 25) <= 0.0001, 'FIN-RATIOS-14-STANDARD numeric returnOnEquityPercent expected 25');
    assert.strictEqual(res1["verdict"], "HEALTHY_STRONG", 'FIN-RATIOS-14-STANDARD value verdict mismatch');
    const res2 = runCase("analyzeFinancialRatios", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-RATIOS-14-STANDARD');
    const res3 = runCase("analyzeFinancialRatios", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-RATIOS-14-STANDARD');
  }
  { // Case: FIN-CASH-FLOW-RUNWAY
    const input = {"startingCashBalanceSgd":50000,"minimumCashReserveSgd":10000,"weeklyForecasts":[{"weekNumber":1,"operatingReceiptsSgd":15000,"payrollAndLeviesSgd":8000,"rentAndUtilitiesSgd":4000},{"weekNumber":2,"operatingReceiptsSgd":12000,"payrollAndLeviesSgd":3000,"rentAndUtilitiesSgd":1000},{"weekNumber":3,"operatingReceiptsSgd":20000,"payrollAndLeviesSgd":5000,"rentAndUtilitiesSgd":2000},{"weekNumber":4,"operatingReceiptsSgd":8000,"payrollAndLeviesSgd":12000,"rentAndUtilitiesSgd":1000}]};
    const res1 = runCase("forecastWeeklyCashFlow", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-CASH-FLOW-RUNWAY');
    assert.ok(typeof res1["startingCashBalanceSgd"] === 'number' && Math.abs(res1["startingCashBalanceSgd"] - 50000) <= 0.0001, 'FIN-CASH-FLOW-RUNWAY numeric startingCashBalanceSgd expected 50000');
    assert.strictEqual(res1["isSolventThroughoutPeriod"], true, 'FIN-CASH-FLOW-RUNWAY value isSolventThroughoutPeriod mismatch');
    assert.strictEqual(res1["hasBreachedMinimumReserve"], false, 'FIN-CASH-FLOW-RUNWAY value hasBreachedMinimumReserve mismatch');
    const res2 = runCase("forecastWeeklyCashFlow", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-CASH-FLOW-RUNWAY');
    const res3 = runCase("forecastWeeklyCashFlow", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-CASH-FLOW-RUNWAY');
  }
  { // Case: FIN-BREAK-EVEN-CVP
    const input = {"fixedCostsSgd":120000,"unitSellingPriceSgd":50,"unitVariableCostSgd":20,"projectedSalesUnits":5000,"targetNetProfitSgd":30000};
    const res1 = runCase("calculateBreakEvenAnalysis", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-BREAK-EVEN-CVP');
    assert.ok(typeof res1["unitContributionMarginSgd"] === 'number' && Math.abs(res1["unitContributionMarginSgd"] - 30) <= 0.0001, 'FIN-BREAK-EVEN-CVP numeric unitContributionMarginSgd expected 30');
    assert.ok(typeof res1["contributionMarginRatioPercent"] === 'number' && Math.abs(res1["contributionMarginRatioPercent"] - 60) <= 0.0001, 'FIN-BREAK-EVEN-CVP numeric contributionMarginRatioPercent expected 60');
    assert.ok(typeof res1["breakEvenUnits"] === 'number' && Math.abs(res1["breakEvenUnits"] - 4000) <= 0.0001, 'FIN-BREAK-EVEN-CVP numeric breakEvenUnits expected 4000');
    assert.ok(typeof res1["breakEvenRevenueSgd"] === 'number' && Math.abs(res1["breakEvenRevenueSgd"] - 200000) <= 0.0001, 'FIN-BREAK-EVEN-CVP numeric breakEvenRevenueSgd expected 200000');
    assert.ok(typeof res1["requiredUnitsToSell"] === 'number' && Math.abs(res1["requiredUnitsToSell"] - 5000) <= 0.0001, 'FIN-BREAK-EVEN-CVP numeric requiredUnitsToSell expected 5000');
    assert.ok(typeof res1["requiredRevenueSgd"] === 'number' && Math.abs(res1["requiredRevenueSgd"] - 250000) <= 0.0001, 'FIN-BREAK-EVEN-CVP numeric requiredRevenueSgd expected 250000');
    const res2 = runCase("calculateBreakEvenAnalysis", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-BREAK-EVEN-CVP');
    const res3 = runCase("calculateBreakEvenAnalysis", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-BREAK-EVEN-CVP');
  }
  { // Case: FIN-SAAS-UNIT-ECONOMICS
    const input = {"averageMonthlyRevenuePerUserSgd":100,"grossMarginPercent":80,"monthlyCustomerChurnRatePercent":2.5,"monthlySalesAndMarketingSpendSgd":20000,"newCustomersAcquiredMonthly":25};
    const res1 = runCase("evaluateUnitEconomics", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-SAAS-UNIT-ECONOMICS');
    assert.ok(typeof res1["customerAcquisitionCostSgd"] === 'number' && Math.abs(res1["customerAcquisitionCostSgd"] - 800) <= 0.0001, 'FIN-SAAS-UNIT-ECONOMICS numeric customerAcquisitionCostSgd expected 800');
    assert.ok(typeof res1["customerLifetimeValueSgd"] === 'number' && Math.abs(res1["customerLifetimeValueSgd"] - 3200) <= 0.0001, 'FIN-SAAS-UNIT-ECONOMICS numeric customerLifetimeValueSgd expected 3200');
    assert.ok(typeof res1["ltvToCacRatio"] === 'number' && Math.abs(res1["ltvToCacRatio"] - 4) <= 0.0001, 'FIN-SAAS-UNIT-ECONOMICS numeric ltvToCacRatio expected 4');
    assert.ok(typeof res1["cacPaybackPeriodMonths"] === 'number' && Math.abs(res1["cacPaybackPeriodMonths"] - 10) <= 0.0001, 'FIN-SAAS-UNIT-ECONOMICS numeric cacPaybackPeriodMonths expected 10');
    assert.strictEqual(res1["businessHealthRating"], "IDEAL_OPTIMAL", 'FIN-SAAS-UNIT-ECONOMICS value businessHealthRating mismatch');
    const res2 = runCase("evaluateUnitEconomics", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-SAAS-UNIT-ECONOMICS');
    const res3 = runCase("evaluateUnitEconomics", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-SAAS-UNIT-ECONOMICS');
  }
  { // Case: FIN-VCC-WATERFALL
    const input = {"totalProceedsToDistributeSgd":15000000,"lpInvestedCapitalSgd":10000000,"hurdleRateAnnualPercent":8,"investmentHoldingPeriodYears":3,"carriedInterestPercent":20,"hasGpCatchUp":true};
    const res1 = runCase("calculateVccDistributionWaterfall", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-VCC-WATERFALL');
    assert.ok(typeof res1["totalDistributedSgd"] === 'number' && Math.abs(res1["totalDistributedSgd"] - 15000000) <= 0.0001, 'FIN-VCC-WATERFALL numeric totalDistributedSgd expected 15000000');
    assert.ok(typeof res1["totalDistributedToLpSgd"] === 'number' && Math.abs(res1["totalDistributedToLpSgd"] - 14000000) <= 0.0001, 'FIN-VCC-WATERFALL numeric totalDistributedToLpSgd expected 14000000');
    assert.ok(typeof res1["capitalReturnedSgd"] === 'number' && Math.abs(res1["capitalReturnedSgd"] - 10000000) <= 0.0001, 'FIN-VCC-WATERFALL numeric capitalReturnedSgd expected 10000000');
    assert.ok(typeof res1["netProfitToLpSgd"] === 'number' && Math.abs(res1["netProfitToLpSgd"] - 4000000) <= 0.0001, 'FIN-VCC-WATERFALL numeric netProfitToLpSgd expected 4000000');
    assert.ok(typeof res1["netMoicMultiple"] === 'number' && Math.abs(res1["netMoicMultiple"] - 1.4) <= 0.0001, 'FIN-VCC-WATERFALL numeric netMoicMultiple expected 1.4');
    assert.ok(typeof res1["totalCarriedInterestToGpSgd"] === 'number' && Math.abs(res1["totalCarriedInterestToGpSgd"] - 1000000) <= 0.0001, 'FIN-VCC-WATERFALL numeric totalCarriedInterestToGpSgd expected 1000000');
    assert.ok(typeof res1["effectiveCarryPercentOfProfits"] === 'number' && Math.abs(res1["effectiveCarryPercentOfProfits"] - 20) <= 0.0001, 'FIN-VCC-WATERFALL numeric effectiveCarryPercentOfProfits expected 20');
    const res2 = runCase("calculateVccDistributionWaterfall", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-VCC-WATERFALL');
    const res3 = runCase("calculateVccDistributionWaterfall", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-VCC-WATERFALL');
  }
  { // Case: FIN-SFRS-116-LEASE
    const input = {"annualLeasePaymentSgd":60000,"leaseTermYears":3,"incrementalBorrowingRatePercent":5,"initialDirectCostsSgd":2000};
    const res1 = runCase("calculateSfrs116Lease", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-SFRS-116-LEASE');
    assert.strictEqual(res1["isExemptFromCapitalisation"], false, 'FIN-SFRS-116-LEASE value isExemptFromCapitalisation mismatch');
    assert.ok(typeof res1["initialLeaseLiabilitySgd"] === 'number' && Math.abs(res1["initialLeaseLiabilitySgd"] - 163394.88) <= 0.0001, 'FIN-SFRS-116-LEASE numeric initialLeaseLiabilitySgd expected 163394.88');
    assert.ok(typeof res1["initialRightOfUseAssetSgd"] === 'number' && Math.abs(res1["initialRightOfUseAssetSgd"] - 165394.88) <= 0.0001, 'FIN-SFRS-116-LEASE numeric initialRightOfUseAssetSgd expected 165394.88');
    const res2 = runCase("calculateSfrs116Lease", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-SFRS-116-LEASE');
    const res3 = runCase("calculateSfrs116Lease", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-SFRS-116-LEASE');
  }
  { // Case: FIN-FX-THEORETICAL-FORWARD
    const input = {"spotRate":1.35,"domesticRateAnnual":0.035,"foreignRateAnnual":0.055,"daysToMaturity":360};
    const res1 = runCase("calculateTheoreticalForwardRate", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-FX-THEORETICAL-FORWARD');
    assert.ok(typeof res1["value"] === 'number' && Math.abs(res1["value"] - 1.3248) <= 0.0001, 'FIN-FX-THEORETICAL-FORWARD numeric value expected 1.3248');
    const res2 = runCase("calculateTheoreticalForwardRate", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-FX-THEORETICAL-FORWARD');
    const res3 = runCase("calculateTheoreticalForwardRate", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-FX-THEORETICAL-FORWARD');
  }
  { // Case: FIN-FX-FORWARD-HEDGE-GAIN
    const input = {"foreignCurrency":"USD","foreignExposureAmount":100000,"contractForwardRate":1.34,"currentSpotRate":1.36,"positionType":"BUY_FORWARD_IMPORTER"};
    const res1 = runCase("evaluateFxForwardHedge", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-FX-FORWARD-HEDGE-GAIN');
    assert.ok(typeof res1["hedgedSettlementValueSgd"] === 'number' && Math.abs(res1["hedgedSettlementValueSgd"] - 134000) <= 0.0001, 'FIN-FX-FORWARD-HEDGE-GAIN numeric hedgedSettlementValueSgd expected 134000');
    assert.ok(typeof res1["unhedgedMarketValueSgd"] === 'number' && Math.abs(res1["unhedgedMarketValueSgd"] - 136000) <= 0.0001, 'FIN-FX-FORWARD-HEDGE-GAIN numeric unhedgedMarketValueSgd expected 136000');
    assert.ok(typeof res1["hedgingMarkToMarketSgd"] === 'number' && Math.abs(res1["hedgingMarkToMarketSgd"] - 2000) <= 0.0001, 'FIN-FX-FORWARD-HEDGE-GAIN numeric hedgingMarkToMarketSgd expected 2000');
    assert.strictEqual(res1["hedgingResultStatus"], "HEDGING_GAIN", 'FIN-FX-FORWARD-HEDGE-GAIN value hedgingResultStatus mismatch');
    const res2 = runCase("evaluateFxForwardHedge", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-FX-FORWARD-HEDGE-GAIN');
    const res3 = runCase("evaluateFxForwardHedge", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-FX-FORWARD-HEDGE-GAIN');
  }
  { // Case: FIN-SFRS-FRAMEWORK-SMALL
    const input = {"annualRevenueSgd":8000000,"totalAssetsSgd":7000000,"employeeHeadcount":40,"isPubliclyAccountable":false};
    const res1 = runCase("evaluateSfrsFramework", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-SFRS-FRAMEWORK-SMALL');
    assert.strictEqual(res1["recommendedFramework"], "SFRS_FOR_SMALL_ENTITIES", 'FIN-SFRS-FRAMEWORK-SMALL value recommendedFramework mismatch');
    assert.strictEqual(res1["isEligibleForSmallEntitySfrs"], true, 'FIN-SFRS-FRAMEWORK-SMALL value isEligibleForSmallEntitySfrs mismatch');
    assert.ok(typeof res1["criteriaMetCount"] === 'number' && Math.abs(res1["criteriaMetCount"] - 3) <= 0.0001, 'FIN-SFRS-FRAMEWORK-SMALL numeric criteriaMetCount expected 3');
    const res2 = runCase("evaluateSfrsFramework", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-SFRS-FRAMEWORK-SMALL');
    const res3 = runCase("evaluateSfrsFramework", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-SFRS-FRAMEWORK-SMALL');
  }
  { // Case: FIN-SFRS-FRAMEWORK-FULL
    const input = {"annualRevenueSgd":15000000,"totalAssetsSgd":12000000,"employeeHeadcount":65,"isPubliclyAccountable":false};
    const res1 = runCase("evaluateSfrsFramework", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for FIN-SFRS-FRAMEWORK-FULL');
    assert.strictEqual(res1["recommendedFramework"], "FULL_SFRS", 'FIN-SFRS-FRAMEWORK-FULL value recommendedFramework mismatch');
    assert.strictEqual(res1["isEligibleForSmallEntitySfrs"], false, 'FIN-SFRS-FRAMEWORK-FULL value isEligibleForSmallEntitySfrs mismatch');
    assert.ok(typeof res1["criteriaMetCount"] === 'number' && Math.abs(res1["criteriaMetCount"] - 1) <= 0.0001, 'FIN-SFRS-FRAMEWORK-FULL numeric criteriaMetCount expected 1');
    const res2 = runCase("evaluateSfrsFramework", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for FIN-SFRS-FRAMEWORK-FULL');
    const res3 = runCase("evaluateSfrsFramework", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for FIN-SFRS-FRAMEWORK-FULL');
  }
  console.log('    ✅ finance-sg: 25 cases verified.');

  // ==========================================
  // Domain: strategic-sg (15 cases)
  // ==========================================
  console.log('  📂 Testing strategic-sg golden cases...');
  { // Case: ENTERPRISE-EDG-STANDARD
    const input = {"grantScheme":"EDG","qualifyingProjectCostSgd":200000,"localShareholdingPercentage":35,"isRegisteredInSingapore":true,"groupAnnualTurnoverSgd":5000000,"groupEmployeeCount":25};
    const res1 = runCase("evaluateEnterpriseGrant", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for ENTERPRISE-EDG-STANDARD');
    assert.strictEqual(res1["isEligibleForGrant"], true, 'ENTERPRISE-EDG-STANDARD value isEligibleForGrant mismatch');
    assert.ok(typeof res1["statutorySupportRatePercent"] === 'number' && Math.abs(res1["statutorySupportRatePercent"] - 50) <= 0.0001, 'ENTERPRISE-EDG-STANDARD numeric statutorySupportRatePercent expected 50');
    assert.ok(typeof res1["approvedGrantFundingSgd"] === 'number' && Math.abs(res1["approvedGrantFundingSgd"] - 100000) <= 0.0001, 'ENTERPRISE-EDG-STANDARD numeric approvedGrantFundingSgd expected 100000');
    assert.ok(typeof res1["companyCoPaymentShareSgd"] === 'number' && Math.abs(res1["companyCoPaymentShareSgd"] - 100000) <= 0.0001, 'ENTERPRISE-EDG-STANDARD numeric companyCoPaymentShareSgd expected 100000');
    const res2 = runCase("evaluateEnterpriseGrant", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for ENTERPRISE-EDG-STANDARD');
    const res3 = runCase("evaluateEnterpriseGrant", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for ENTERPRISE-EDG-STANDARD');
  }
  { // Case: ENTERPRISE-MRA-CAPPED
    const input = {"grantScheme":"MRA","qualifyingProjectCostSgd":60000,"localShareholdingPercentage":100,"mraCumulativeClaimedSgd":80000};
    const res1 = runCase("evaluateEnterpriseGrant", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for ENTERPRISE-MRA-CAPPED');
    assert.ok(typeof res1["availableCapHeadroomSgd"] === 'number' && Math.abs(res1["availableCapHeadroomSgd"] - 20000) <= 0.0001, 'ENTERPRISE-MRA-CAPPED numeric availableCapHeadroomSgd expected 20000');
    assert.ok(typeof res1["approvedGrantFundingSgd"] === 'number' && Math.abs(res1["approvedGrantFundingSgd"] - 20000) <= 0.0001, 'ENTERPRISE-MRA-CAPPED numeric approvedGrantFundingSgd expected 20000');
    assert.ok(typeof res1["companyCoPaymentShareSgd"] === 'number' && Math.abs(res1["companyCoPaymentShareSgd"] - 40000) <= 0.0001, 'ENTERPRISE-MRA-CAPPED numeric companyCoPaymentShareSgd expected 40000');
    const res2 = runCase("evaluateEnterpriseGrant", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for ENTERPRISE-MRA-CAPPED');
    const res3 = runCase("evaluateEnterpriseGrant", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for ENTERPRISE-MRA-CAPPED');
  }
  { // Case: CORP-STRUCTURING-FSIE-13W
    const input = {"dividendAmountSgd":1000000,"equityShareholdingPercent":100,"shareHoldingDurationMonths":24,"sourceJurisdictionHeadlineCitRate":0.22,"subjectToTaxInSource":true,"isBonaFideResident":true,"annualMaintenanceCostSgd":8000};
    const res1 = runCase("evaluateCorporateStructuring", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for CORP-STRUCTURING-FSIE-13W');
    assert.ok(typeof res1["dividendGrossAmount"] === 'number' && Math.abs(res1["dividendGrossAmount"] - 1000000) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric dividendGrossAmount expected 1000000');
    assert.ok(typeof res1["equityShareholdingPercentage"] === 'number' && Math.abs(res1["equityShareholdingPercentage"] - 100) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric equityShareholdingPercentage expected 100');
    assert.ok(typeof res1["holdingPeriodMonths"] === 'number' && Math.abs(res1["holdingPeriodMonths"] - 24) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric holdingPeriodMonths expected 24');
    assert.strictEqual(res1["qualifiesForSection138Fsie"], true, 'CORP-STRUCTURING-FSIE-13W value qualifiesForSection138Fsie mismatch');
    assert.ok(typeof res1["singaporeCorporateTaxRate"] === 'number' && Math.abs(res1["singaporeCorporateTaxRate"] - 0) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric singaporeCorporateTaxRate expected 0');
    assert.ok(typeof res1["singaporeCorporateTaxPayable"] === 'number' && Math.abs(res1["singaporeCorporateTaxPayable"] - 0) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric singaporeCorporateTaxPayable expected 0');
    assert.ok(typeof res1["singaporeOutboundDividendWhtRate"] === 'number' && Math.abs(res1["singaporeOutboundDividendWhtRate"] - 0) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric singaporeOutboundDividendWhtRate expected 0');
    assert.ok(typeof res1["netDividendRepatriated"] === 'number' && Math.abs(res1["netDividendRepatriated"] - 1000000) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric netDividendRepatriated expected 1000000');
    assert.ok(typeof res1["annualHoldingMaintenanceCost"] === 'number' && Math.abs(res1["annualHoldingMaintenanceCost"] - 8000) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric annualHoldingMaintenanceCost expected 8000');
    assert.ok(typeof res1["netCashDeliverable"] === 'number' && Math.abs(res1["netCashDeliverable"] - 992000) <= 0.0001, 'CORP-STRUCTURING-FSIE-13W numeric netCashDeliverable expected 992000');
    assert.strictEqual(res1["qualifiesForSection13WSafeHarbour"], true, 'CORP-STRUCTURING-FSIE-13W value qualifiesForSection13WSafeHarbour mismatch');
    assert.strictEqual(res1["statutoryExemptionStatus"], "CONFIRMED_SAFE_HARBOUR_EXEMPT", 'CORP-STRUCTURING-FSIE-13W value statutoryExemptionStatus mismatch');
    const res2 = runCase("evaluateCorporateStructuring", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for CORP-STRUCTURING-FSIE-13W');
    const res3 = runCase("evaluateCorporateStructuring", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for CORP-STRUCTURING-FSIE-13W');
  }
  { // Case: STRAT-EDG-ENHANCED-SUSTAINABILITY
    const input = {"grantScheme":"EDG","qualifyingProjectCostSgd":300000,"localShareholdingPercentage":60,"isSustainabilityOrDeepTech":true};
    const res1 = runCase("evaluateEnterpriseGrant", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-EDG-ENHANCED-SUSTAINABILITY');
    assert.strictEqual(res1["isEligibleForGrant"], true, 'STRAT-EDG-ENHANCED-SUSTAINABILITY value isEligibleForGrant mismatch');
    assert.ok(typeof res1["statutorySupportRatePercent"] === 'number' && Math.abs(res1["statutorySupportRatePercent"] - 70) <= 0.0001, 'STRAT-EDG-ENHANCED-SUSTAINABILITY numeric statutorySupportRatePercent expected 70');
    assert.ok(typeof res1["approvedGrantFundingSgd"] === 'number' && Math.abs(res1["approvedGrantFundingSgd"] - 210000) <= 0.0001, 'STRAT-EDG-ENHANCED-SUSTAINABILITY numeric approvedGrantFundingSgd expected 210000');
    const res2 = runCase("evaluateEnterpriseGrant", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-EDG-ENHANCED-SUSTAINABILITY');
    const res3 = runCase("evaluateEnterpriseGrant", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-EDG-ENHANCED-SUSTAINABILITY');
  }
  { // Case: STRAT-GRANT-DISQUALIFIED-EQUITY
    const input = {"grantScheme":"EDG","qualifyingProjectCostSgd":100000,"localShareholdingPercentage":20};
    const res1 = runCase("evaluateEnterpriseGrant", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-GRANT-DISQUALIFIED-EQUITY');
    assert.strictEqual(res1["isEligibleForGrant"], false, 'STRAT-GRANT-DISQUALIFIED-EQUITY value isEligibleForGrant mismatch');
    const res2 = runCase("evaluateEnterpriseGrant", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-GRANT-DISQUALIFIED-EQUITY');
    const res3 = runCase("evaluateEnterpriseGrant", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-GRANT-DISQUALIFIED-EQUITY');
  }
  { // Case: STRAT-FSIE-LOW-TAX-DISQUALIFIED
    const input = {"dividendAmountSgd":500000,"equityShareholdingPercent":100,"shareHoldingDurationMonths":12,"sourceJurisdictionHeadlineCitRate":0.1,"subjectToTaxInSource":true};
    const res1 = runCase("evaluateCorporateStructuring", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-FSIE-LOW-TAX-DISQUALIFIED');
    assert.strictEqual(res1["qualifiesForSection138Fsie"], false, 'STRAT-FSIE-LOW-TAX-DISQUALIFIED value qualifiesForSection138Fsie mismatch');
    const res2 = runCase("evaluateCorporateStructuring", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-FSIE-LOW-TAX-DISQUALIFIED');
    const res3 = runCase("evaluateCorporateStructuring", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-FSIE-LOW-TAX-DISQUALIFIED');
  }
  { // Case: STRAT-SECTION-13W-DISQUALIFIED
    const input = {"dividendAmountSgd":500000,"equityShareholdingPercent":25,"shareHoldingDurationMonths":12,"sourceJurisdictionHeadlineCitRate":0.2};
    const res1 = runCase("evaluateCorporateStructuring", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-SECTION-13W-DISQUALIFIED');
    assert.strictEqual(res1["qualifiesForSection13WSafeHarbour"], false, 'STRAT-SECTION-13W-DISQUALIFIED value qualifiesForSection13WSafeHarbour mismatch');
    const res2 = runCase("evaluateCorporateStructuring", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-SECTION-13W-DISQUALIFIED');
    const res3 = runCase("evaluateCorporateStructuring", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-SECTION-13W-DISQUALIFIED');
  }
  { // Case: STRAT-MARKET-ENTRY-SUBSIDIARY
    const input = {"targetStructure":"SUBSIDIARY","projectedAnnualRevenueSgd":2500000,"projectedLocalOperatingExpensesSgd":400000,"projectedLocalHeadcount":5,"hasForeignHoldingCompany":true};
    const res1 = runCase("evaluateMarketEntrySg", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-MARKET-ENTRY-SUBSIDIARY');
    assert.strictEqual(res1["targetStructure"], "SUBSIDIARY", 'STRAT-MARKET-ENTRY-SUBSIDIARY value targetStructure mismatch');
    assert.strictEqual(res1["limitedLiabilityProtection"], true, 'STRAT-MARKET-ENTRY-SUBSIDIARY value limitedLiabilityProtection mismatch');
    assert.strictEqual(res1["isApprovedForMarketEntry"], true, 'STRAT-MARKET-ENTRY-SUBSIDIARY value isApprovedForMarketEntry mismatch');
    const res2 = runCase("evaluateMarketEntrySg", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-MARKET-ENTRY-SUBSIDIARY');
    const res3 = runCase("evaluateMarketEntrySg", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-MARKET-ENTRY-SUBSIDIARY');
  }
  { // Case: STRAT-MARKET-ENTRY-BRANCH
    const input = {"targetStructure":"BRANCH","projectedAnnualRevenueSgd":1000000,"projectedLocalOperatingExpensesSgd":150000,"projectedLocalHeadcount":2};
    const res1 = runCase("evaluateMarketEntrySg", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-MARKET-ENTRY-BRANCH');
    assert.strictEqual(res1["targetStructure"], "BRANCH", 'STRAT-MARKET-ENTRY-BRANCH value targetStructure mismatch');
    assert.strictEqual(res1["limitedLiabilityProtection"], false, 'STRAT-MARKET-ENTRY-BRANCH value limitedLiabilityProtection mismatch');
    assert.strictEqual(res1["qualifiesForStartupTaxExemption"], false, 'STRAT-MARKET-ENTRY-BRANCH value qualifiesForStartupTaxExemption mismatch');
    const res2 = runCase("evaluateMarketEntrySg", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-MARKET-ENTRY-BRANCH');
    const res3 = runCase("evaluateMarketEntrySg", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-MARKET-ENTRY-BRANCH');
  }
  { // Case: STRAT-MARKET-ENTRY-REP-OFFICE
    const input = {"targetStructure":"REPRESENTATIVE_OFFICE","projectedAnnualRevenueSgd":500000,"projectedLocalOperatingExpensesSgd":80000,"projectedLocalHeadcount":1};
    const res1 = runCase("evaluateMarketEntrySg", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-MARKET-ENTRY-REP-OFFICE');
    assert.strictEqual(res1["targetStructure"], "REPRESENTATIVE_OFFICE", 'STRAT-MARKET-ENTRY-REP-OFFICE value targetStructure mismatch');
    assert.strictEqual(res1["isLegallyPermittedForCommercialRevenue"], false, 'STRAT-MARKET-ENTRY-REP-OFFICE value isLegallyPermittedForCommercialRevenue mismatch');
    assert.strictEqual(res1["isApprovedForMarketEntry"], false, 'STRAT-MARKET-ENTRY-REP-OFFICE value isApprovedForMarketEntry mismatch');
    const res2 = runCase("evaluateMarketEntrySg", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-MARKET-ENTRY-REP-OFFICE');
    const res3 = runCase("evaluateMarketEntrySg", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-MARKET-ENTRY-REP-OFFICE');
  }
  { // Case: STRAT-COMPETITIVE-MOAT-FINTECH
    const input = {"industryCluster":"FINTECH","hasValuableAsset":true,"hasRareCapability":true,"isCostlyToImitate":true,"isOrganizedToCaptureValue":true,"holdsStatutoryLicense":true,"holdsRegisteredIpInIpos":true};
    const res1 = runCase("evaluateCompetitiveMoatSg", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-COMPETITIVE-MOAT-FINTECH');
    assert.strictEqual(res1["competitiveImplication"], "SUSTAINED_COMPETITIVE_ADVANTAGE", 'STRAT-COMPETITIVE-MOAT-FINTECH value competitiveImplication mismatch');
    assert.strictEqual(res1["strategicMoatVerdict"], "ROBUST_SINGAPORE_MOAT", 'STRAT-COMPETITIVE-MOAT-FINTECH value strategicMoatVerdict mismatch');
    const res2 = runCase("evaluateCompetitiveMoatSg", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-COMPETITIVE-MOAT-FINTECH');
    const res3 = runCase("evaluateCompetitiveMoatSg", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-COMPETITIVE-MOAT-FINTECH');
  }
  { // Case: STRAT-COMPETITIVE-MOAT-COMMODITY
    const input = {"industryCluster":"GENERAL_COMMERCIAL","hasValuableAsset":true,"hasRareCapability":false,"isCostlyToImitate":false,"isOrganizedToCaptureValue":true};
    const res1 = runCase("evaluateCompetitiveMoatSg", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-COMPETITIVE-MOAT-COMMODITY');
    assert.strictEqual(res1["competitiveImplication"], "COMPETITIVE_PARITY", 'STRAT-COMPETITIVE-MOAT-COMMODITY value competitiveImplication mismatch');
    assert.strictEqual(res1["strategicMoatVerdict"], "VULNERABLE_TO_REGIONAL_COMPETITION", 'STRAT-COMPETITIVE-MOAT-COMMODITY value strategicMoatVerdict mismatch');
    const res2 = runCase("evaluateCompetitiveMoatSg", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-COMPETITIVE-MOAT-COMMODITY');
    const res3 = runCase("evaluateCompetitiveMoatSg", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-COMPETITIVE-MOAT-COMMODITY');
  }
  { // Case: STRAT-SCENARIO-SNEER-APPRECIATION
    const input = {"baselineRevenueSgd":10000000,"baselineOpexSgd":7000000,"scenarioType":"MAS_TIGHTENING_SGD_APPRECIATION","foreignRevenueSharePercent":60,"importedGoodsSharePercent":40};
    const res1 = runCase("simulateMacroScenarioSg", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-SCENARIO-SNEER-APPRECIATION');
    assert.strictEqual(res1["scenarioType"], "MAS_TIGHTENING_SGD_APPRECIATION", 'STRAT-SCENARIO-SNEER-APPRECIATION value scenarioType mismatch');
    const res2 = runCase("simulateMacroScenarioSg", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-SCENARIO-SNEER-APPRECIATION');
    const res3 = runCase("simulateMacroScenarioSg", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-SCENARIO-SNEER-APPRECIATION');
  }
  { // Case: STRAT-SCENARIO-INTEREST-RATE-HIKE
    const input = {"baselineRevenueSgd":5000000,"baselineOpexSgd":4000000,"scenarioType":"STAGFLATION_SHOCK"};
    const res1 = runCase("simulateMacroScenarioSg", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-SCENARIO-INTEREST-RATE-HIKE');
    assert.strictEqual(res1["scenarioType"], "STAGFLATION_SHOCK", 'STRAT-SCENARIO-INTEREST-RATE-HIKE value scenarioType mismatch');
    const res2 = runCase("simulateMacroScenarioSg", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-SCENARIO-INTEREST-RATE-HIKE');
    const res3 = runCase("simulateMacroScenarioSg", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-SCENARIO-INTEREST-RATE-HIKE');
  }
  { // Case: STRAT-RISK-MATRIX-CYBER
    const input = {"risks":[{"id":"R1","title":"PDPA Data Breach Risk","category":"REPUTATIONAL_CYBER","likelihood":4,"impact":5,"velocity":3},{"id":"R2","title":"MAS Regulatory Non-Compliance","category":"REGULATORY_COMPLIANCE","likelihood":3,"impact":4,"velocity":2}],"hasBoardRiskCommittee":true,"hasDocumentedErmPolicy":true};
    const res1 = runCase("evaluateStrategicRiskSg", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for STRAT-RISK-MATRIX-CYBER');
    assert.ok(typeof res1["totalRisksEvaluated"] === 'number' && Math.abs(res1["totalRisksEvaluated"] - 2) <= 0.0001, 'STRAT-RISK-MATRIX-CYBER numeric totalRisksEvaluated expected 2');
    assert.ok(typeof res1["criticalExtremeCount"] === 'number' && Math.abs(res1["criticalExtremeCount"] - 1) <= 0.0001, 'STRAT-RISK-MATRIX-CYBER numeric criticalExtremeCount expected 1');
    assert.strictEqual(res1["hasBoardRiskCommittee"], true, 'STRAT-RISK-MATRIX-CYBER value hasBoardRiskCommittee mismatch');
    assert.strictEqual(res1["sgxCodeOfCorporateGovernanceCompliant"], true, 'STRAT-RISK-MATRIX-CYBER value sgxCodeOfCorporateGovernanceCompliant mismatch');
    const res2 = runCase("evaluateStrategicRiskSg", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for STRAT-RISK-MATRIX-CYBER');
    const res3 = runCase("evaluateStrategicRiskSg", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for STRAT-RISK-MATRIX-CYBER');
  }
  console.log('    ✅ strategic-sg: 15 cases verified.');

  // ==========================================
  // Domain: marketing-sg (18 cases)
  // ==========================================
  console.log('  📂 Testing marketing-sg golden cases...');
  { // Case: MKT-SEO-HIGH-AUTHORITY
    const input = {"domainName":"enterprise.com.sg","targetKeywords":["Corporate Tax Services CBD","Singapore Raffles Place Accounting"],"hreflangTags":["en-sg","en"],"localBusinessSchema":{"postalCode":"048624","uen":"202312345K"},"hasGoogleBusinessProfile":true};
    const res1 = runCase("auditSingaporeLocalSeo", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-SEO-HIGH-AUTHORITY');
    assert.ok(typeof res1["localSeoScore"] === 'number' && Math.abs(res1["localSeoScore"] - 100) <= 0.0001, 'MKT-SEO-HIGH-AUTHORITY numeric localSeoScore expected 100');
    assert.strictEqual(res1["status"], "EXCELLENT_LOCAL_AUTHORITY", 'MKT-SEO-HIGH-AUTHORITY value status mismatch');
    assert.strictEqual(res1["hasSingaporeCcTld"], true, 'MKT-SEO-HIGH-AUTHORITY value hasSingaporeCcTld mismatch');
    assert.strictEqual(res1["hasValidSingaporePostalCode"], true, 'MKT-SEO-HIGH-AUTHORITY value hasValidSingaporePostalCode mismatch');
    assert.strictEqual(res1["hasValidAcraUen"], true, 'MKT-SEO-HIGH-AUTHORITY value hasValidAcraUen mismatch');
    const res2 = runCase("auditSingaporeLocalSeo", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-SEO-HIGH-AUTHORITY');
    const res3 = runCase("auditSingaporeLocalSeo", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-SEO-HIGH-AUTHORITY');
  }
  { // Case: MKT-SEO-WEAK-REMEDIATION
    const input = {"domainName":"globalstartup.io","targetKeywords":["Cloud Software Solutions"],"hasGoogleBusinessProfile":false};
    const res1 = runCase("auditSingaporeLocalSeo", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-SEO-WEAK-REMEDIATION');
    assert.strictEqual(res1["status"], "WEAK_LOCAL_SIGNALS_REMEDIATION_REQUIRED", 'MKT-SEO-WEAK-REMEDIATION value status mismatch');
    assert.strictEqual(res1["hasSingaporeCcTld"], false, 'MKT-SEO-WEAK-REMEDIATION value hasSingaporeCcTld mismatch');
    assert.strictEqual(res1["hasValidSingaporePostalCode"], false, 'MKT-SEO-WEAK-REMEDIATION value hasValidSingaporePostalCode mismatch');
    const res2 = runCase("auditSingaporeLocalSeo", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-SEO-WEAK-REMEDIATION');
    const res3 = runCase("auditSingaporeLocalSeo", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-SEO-WEAK-REMEDIATION');
  }
  { // Case: MKT-SEO-MODERATE-LOCAL
    const input = {"domainName":"regionalhub.com","targetKeywords":["Jurong Industrial Warehousing"],"hreflangTags":["en-sg"],"localBusinessSchema":{"postalCode":"609966","uen":"202100123A"},"hasGoogleBusinessProfile":true};
    const res1 = runCase("auditSingaporeLocalSeo", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-SEO-MODERATE-LOCAL');
    assert.strictEqual(res1["status"], "MODERATE_LOCAL_PRESENCE", 'MKT-SEO-MODERATE-LOCAL value status mismatch');
    assert.strictEqual(res1["hasSingaporeCcTld"], false, 'MKT-SEO-MODERATE-LOCAL value hasSingaporeCcTld mismatch');
    assert.strictEqual(res1["hasValidSingaporePostalCode"], true, 'MKT-SEO-MODERATE-LOCAL value hasValidSingaporePostalCode mismatch');
    const res2 = runCase("auditSingaporeLocalSeo", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-SEO-MODERATE-LOCAL');
    const res3 = runCase("auditSingaporeLocalSeo", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-SEO-MODERATE-LOCAL');
  }
  { // Case: MKT-CONTENT-ASAS-COMPLIANT
    const input = {"copyText":"Empowering Singapore enterprises with enterprise-grade financial governance and ACRA statutory compliance.","targetAudience":"B2B_ENTERPRISE"};
    const res1 = runCase("auditSingaporeContentLocalization", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-CONTENT-ASAS-COMPLIANT');
    assert.strictEqual(res1["targetAudience"], "B2B_ENTERPRISE", 'MKT-CONTENT-ASAS-COMPLIANT value targetAudience mismatch');
    assert.ok(typeof res1["localizationQualityScore"] === 'number' && Math.abs(res1["localizationQualityScore"] - 100) <= 0.0001, 'MKT-CONTENT-ASAS-COMPLIANT numeric localizationQualityScore expected 100');
    assert.strictEqual(res1["isAsasCompliant"], true, 'MKT-CONTENT-ASAS-COMPLIANT value isAsasCompliant mismatch');
    assert.ok(typeof res1["totalBreachesDetected"] === 'number' && Math.abs(res1["totalBreachesDetected"] - 0) <= 0.0001, 'MKT-CONTENT-ASAS-COMPLIANT numeric totalBreachesDetected expected 0');
    const res2 = runCase("auditSingaporeContentLocalization", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-CONTENT-ASAS-COMPLIANT');
    const res3 = runCase("auditSingaporeContentLocalization", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-CONTENT-ASAS-COMPLIANT');
  }
  { // Case: MKT-CONTENT-ASAS-BREACH
    const input = {"copyText":"We are the BEST IN SINGAPORE clinic! Guaranteed 100% cure for all patients. Our serum CURES chronic fatigue lah!","targetAudience":"B2B_ENTERPRISE","hasHsaTherapeuticApproval":false};
    const res1 = runCase("auditSingaporeContentLocalization", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-CONTENT-ASAS-BREACH');
    assert.strictEqual(res1["isAsasCompliant"], false, 'MKT-CONTENT-ASAS-BREACH value isAsasCompliant mismatch');
    const res2 = runCase("auditSingaporeContentLocalization", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-CONTENT-ASAS-BREACH');
    const res3 = runCase("auditSingaporeContentLocalization", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-CONTENT-ASAS-BREACH');
  }
  { // Case: MKT-CONTENT-SINGLISH-CONSUMER
    const input = {"copyText":"Don't say bo-jio! Chope your weekend dining table now and enjoy shiok deals!","targetAudience":"B2C_CONSUMER","allowColloquialSinglish":true};
    const res1 = runCase("auditSingaporeContentLocalization", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-CONTENT-SINGLISH-CONSUMER');
    assert.strictEqual(res1["isAsasCompliant"], true, 'MKT-CONTENT-SINGLISH-CONSUMER value isAsasCompliant mismatch');
    const res2 = runCase("auditSingaporeContentLocalization", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-CONTENT-SINGLISH-CONSUMER');
    const res3 = runCase("auditSingaporeContentLocalization", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-CONTENT-SINGLISH-CONSUMER');
  }
  { // Case: MKT-OUTBOUND-B2B-BCI-COMPLIANT
    const input = {"recipientType":"B2B_CORPORATE_CAPACITY","outboundChannels":["EMAIL","LINKEDIN"],"hasFunctionalUnsubscribeMechanism":true,"hasClearSenderIdentity":true};
    const res1 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-OUTBOUND-B2B-BCI-COMPLIANT');
    assert.strictEqual(res1["isFullyCompliant"], true, 'MKT-OUTBOUND-B2B-BCI-COMPLIANT value isFullyCompliant mismatch');
    assert.strictEqual(res1["bciExemptionApplies"], true, 'MKT-OUTBOUND-B2B-BCI-COMPLIANT value bciExemptionApplies mismatch');
    assert.strictEqual(res1["isSpamControlActCompliant"], true, 'MKT-OUTBOUND-B2B-BCI-COMPLIANT value isSpamControlActCompliant mismatch');
    assert.ok(typeof res1["totalBreachesDetected"] === 'number' && Math.abs(res1["totalBreachesDetected"] - 0) <= 0.0001, 'MKT-OUTBOUND-B2B-BCI-COMPLIANT numeric totalBreachesDetected expected 0');
    const res2 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-OUTBOUND-B2B-BCI-COMPLIANT');
    const res3 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-OUTBOUND-B2B-BCI-COMPLIANT');
  }
  { // Case: MKT-OUTBOUND-B2C-DNC-VIOLATION
    const input = {"recipientType":"B2C_INDIVIDUAL_CONSUMER","outboundChannels":["PHONE_VOICE","SMS_WHATSAPP"],"hasCheckedDncRegistry":false,"hasFunctionalUnsubscribeMechanism":true};
    const res1 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-OUTBOUND-B2C-DNC-VIOLATION');
    assert.strictEqual(res1["isFullyCompliant"], false, 'MKT-OUTBOUND-B2C-DNC-VIOLATION value isFullyCompliant mismatch');
    assert.strictEqual(res1["bciExemptionApplies"], false, 'MKT-OUTBOUND-B2C-DNC-VIOLATION value bciExemptionApplies mismatch');
    const res2 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-OUTBOUND-B2C-DNC-VIOLATION');
    const res3 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-OUTBOUND-B2C-DNC-VIOLATION');
  }
  { // Case: MKT-OUTBOUND-SPAM-ACT-VIOLATION
    const input = {"recipientType":"B2B_CORPORATE_CAPACITY","outboundChannels":["EMAIL"],"hasFunctionalUnsubscribeMechanism":false,"hasClearSenderIdentity":true};
    const res1 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-OUTBOUND-SPAM-ACT-VIOLATION');
    assert.strictEqual(res1["isSpamControlActCompliant"], false, 'MKT-OUTBOUND-SPAM-ACT-VIOLATION value isSpamControlActCompliant mismatch');
    const res2 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-OUTBOUND-SPAM-ACT-VIOLATION');
    const res3 = runCase("evaluateSingaporeOutboundCadence", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-OUTBOUND-SPAM-ACT-VIOLATION');
  }
  { // Case: MKT-SOCIAL-LINKEDIN-B2B
    const input = {"platform":"LINKEDIN","campaignGoal":"B2B_LEAD_GEN","allocatedBudgetSgd":10000,"influencerTier":"MICRO"};
    const res1 = runCase("planSingaporeSocialCampaign", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-SOCIAL-LINKEDIN-B2B');
    assert.strictEqual(res1["platform"], "LINKEDIN", 'MKT-SOCIAL-LINKEDIN-B2B value platform mismatch');
    assert.ok(typeof res1["totalBudgetSgd"] === 'number' && Math.abs(res1["totalBudgetSgd"] - 10000) <= 0.0001, 'MKT-SOCIAL-LINKEDIN-B2B numeric totalBudgetSgd expected 10000');
    assert.ok(typeof res1["creatorPartnerships"] === 'number' && Math.abs(res1["creatorPartnerships"] - 4000) <= 0.0001, 'MKT-SOCIAL-LINKEDIN-B2B numeric creatorPartnerships expected 4000');
    assert.ok(typeof res1["paidMediaAmplification"] === 'number' && Math.abs(res1["paidMediaAmplification"] - 4500) <= 0.0001, 'MKT-SOCIAL-LINKEDIN-B2B numeric paidMediaAmplification expected 4500');
    assert.ok(typeof res1["creativeProduction"] === 'number' && Math.abs(res1["creativeProduction"] - 1500) <= 0.0001, 'MKT-SOCIAL-LINKEDIN-B2B numeric creativeProduction expected 1500');
    assert.ok(typeof res1["benchmarkEngagementRatePercent"] === 'number' && Math.abs(res1["benchmarkEngagementRatePercent"] - 2.8) <= 0.0001, 'MKT-SOCIAL-LINKEDIN-B2B numeric benchmarkEngagementRatePercent expected 2.8');
    const res2 = runCase("planSingaporeSocialCampaign", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-SOCIAL-LINKEDIN-B2B');
    const res3 = runCase("planSingaporeSocialCampaign", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-SOCIAL-LINKEDIN-B2B');
  }
  { // Case: MKT-SOCIAL-INSTAGRAM-CONSUMER
    const input = {"platform":"INSTAGRAM","campaignGoal":"BRAND_AWARENESS","allocatedBudgetSgd":5000,"influencerTier":"NANO"};
    const res1 = runCase("planSingaporeSocialCampaign", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-SOCIAL-INSTAGRAM-CONSUMER');
    assert.strictEqual(res1["platform"], "INSTAGRAM", 'MKT-SOCIAL-INSTAGRAM-CONSUMER value platform mismatch');
    assert.strictEqual(res1["selectedTier"], "NANO", 'MKT-SOCIAL-INSTAGRAM-CONSUMER value selectedTier mismatch');
    assert.ok(typeof res1["benchmarkEngagementRatePercent"] === 'number' && Math.abs(res1["benchmarkEngagementRatePercent"] - 4.5) <= 0.0001, 'MKT-SOCIAL-INSTAGRAM-CONSUMER numeric benchmarkEngagementRatePercent expected 4.5');
    const res2 = runCase("planSingaporeSocialCampaign", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-SOCIAL-INSTAGRAM-CONSUMER');
    const res3 = runCase("planSingaporeSocialCampaign", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-SOCIAL-INSTAGRAM-CONSUMER');
  }
  { // Case: MKT-SOCIAL-TIKTOK-GENZ
    const input = {"platform":"TIKTOK","campaignGoal":"BRAND_AWARENESS","allocatedBudgetSgd":8000,"influencerTier":"MID_TIER"};
    const res1 = runCase("planSingaporeSocialCampaign", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-SOCIAL-TIKTOK-GENZ');
    assert.strictEqual(res1["platform"], "TIKTOK", 'MKT-SOCIAL-TIKTOK-GENZ value platform mismatch');
    assert.ok(typeof res1["totalBudgetSgd"] === 'number' && Math.abs(res1["totalBudgetSgd"] - 8000) <= 0.0001, 'MKT-SOCIAL-TIKTOK-GENZ numeric totalBudgetSgd expected 8000');
    const res2 = runCase("planSingaporeSocialCampaign", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-SOCIAL-TIKTOK-GENZ');
    const res3 = runCase("planSingaporeSocialCampaign", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-SOCIAL-TIKTOK-GENZ');
  }
  { // Case: MKT-LEAD-TIER-1-ENTERPRISE
    const input = {"companyPaidUpCapitalSgd":2000000,"isGstRegisteredInIras":true,"employeeHeadcount":300,"ssicSector":"FINANCIAL_SERVICES","decisionMakerSeniority":"C_SUITE","isBudgetConfirmed":true};
    const res1 = runCase("scoreSingaporeB2bLead", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-LEAD-TIER-1-ENTERPRISE');
    assert.ok(typeof res1["leadScore"] === 'number' && Math.abs(res1["leadScore"] - 100) <= 0.0001, 'MKT-LEAD-TIER-1-ENTERPRISE numeric leadScore expected 100');
    assert.strictEqual(res1["leadTier"], "TIER_1_ENTERPRISE_PRIORITY", 'MKT-LEAD-TIER-1-ENTERPRISE value leadTier mismatch');
    assert.strictEqual(res1["isIcpQualified"], true, 'MKT-LEAD-TIER-1-ENTERPRISE value isIcpQualified mismatch');
    assert.strictEqual(res1["recommendedSalesMotion"], "SENIOR_ACCOUNT_EXECUTIVE_OUTBOUND_AND_CUSTOM_POC", 'MKT-LEAD-TIER-1-ENTERPRISE value recommendedSalesMotion mismatch');
    const res2 = runCase("scoreSingaporeB2bLead", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-LEAD-TIER-1-ENTERPRISE');
    const res3 = runCase("scoreSingaporeB2bLead", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-LEAD-TIER-1-ENTERPRISE');
  }
  { // Case: MKT-LEAD-UNQUALIFIED-FILTER
    const input = {"companyPaidUpCapitalSgd":5000,"isGstRegisteredInIras":false,"employeeHeadcount":3,"ssicSector":"RETAIL_TRADE","decisionMakerSeniority":"INDIVIDUAL_CONTRIBUTOR","isBudgetConfirmed":false};
    const res1 = runCase("scoreSingaporeB2bLead", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-LEAD-UNQUALIFIED-FILTER');
    assert.strictEqual(res1["leadTier"], "UNQUALIFIED_LOW_INTENT", 'MKT-LEAD-UNQUALIFIED-FILTER value leadTier mismatch');
    assert.strictEqual(res1["isIcpQualified"], false, 'MKT-LEAD-UNQUALIFIED-FILTER value isIcpQualified mismatch');
    const res2 = runCase("scoreSingaporeB2bLead", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-LEAD-UNQUALIFIED-FILTER');
    const res3 = runCase("scoreSingaporeB2bLead", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-LEAD-UNQUALIFIED-FILTER');
  }
  { // Case: MKT-LEAD-MID-MARKET-TIER-2
    const input = {"companyPaidUpCapitalSgd":100000,"isGstRegisteredInIras":true,"employeeHeadcount":35,"ssicSector":"INFORMATION_COMMUNICATIONS","decisionMakerSeniority":"DIRECTOR_VP","isBudgetConfirmed":true};
    const res1 = runCase("scoreSingaporeB2bLead", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-LEAD-MID-MARKET-TIER-2');
    assert.strictEqual(res1["leadTier"], "TIER_2_MID_MARKET", 'MKT-LEAD-MID-MARKET-TIER-2 value leadTier mismatch');
    assert.strictEqual(res1["isIcpQualified"], true, 'MKT-LEAD-MID-MARKET-TIER-2 value isIcpQualified mismatch');
    const res2 = runCase("scoreSingaporeB2bLead", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-LEAD-MID-MARKET-TIER-2');
    const res3 = runCase("scoreSingaporeB2bLead", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-LEAD-MID-MARKET-TIER-2');
  }
  { // Case: MKT-ADS-GST-REGISTERED-SCALABLE
    const input = {"adSpendExcludingGstSgd":20000,"acquiredCustomersCount":50,"totalAttributedRevenueSgd":120000,"customerLifespanMonths":12,"monthlyGrossMarginPerCustomerSgd":300,"isB2bGstRegistered":true};
    const res1 = runCase("calculateSingaporeAdsRoi", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-ADS-GST-REGISTERED-SCALABLE');
    assert.ok(typeof res1["baseAdSpendBeforeGst"] === 'number' && Math.abs(res1["baseAdSpendBeforeGst"] - 20000) <= 0.0001, 'MKT-ADS-GST-REGISTERED-SCALABLE numeric baseAdSpendBeforeGst expected 20000');
    assert.ok(typeof res1["statutory9PercentGst"] === 'number' && Math.abs(res1["statutory9PercentGst"] - 1800) <= 0.0001, 'MKT-ADS-GST-REGISTERED-SCALABLE numeric statutory9PercentGst expected 1800');
    assert.ok(typeof res1["grossTotalAdSpend"] === 'number' && Math.abs(res1["grossTotalAdSpend"] - 21800) <= 0.0001, 'MKT-ADS-GST-REGISTERED-SCALABLE numeric grossTotalAdSpend expected 21800');
    assert.strictEqual(res1["isGstClaimableAsInputTax"], true, 'MKT-ADS-GST-REGISTERED-SCALABLE value isGstClaimableAsInputTax mismatch');
    assert.ok(typeof res1["effectiveNetAdCost"] === 'number' && Math.abs(res1["effectiveNetAdCost"] - 20000) <= 0.0001, 'MKT-ADS-GST-REGISTERED-SCALABLE numeric effectiveNetAdCost expected 20000');
    assert.ok(typeof res1["blendedCacSgd"] === 'number' && Math.abs(res1["blendedCacSgd"] - 400) <= 0.0001, 'MKT-ADS-GST-REGISTERED-SCALABLE numeric blendedCacSgd expected 400');
    assert.ok(typeof res1["customerLtvSgd"] === 'number' && Math.abs(res1["customerLtvSgd"] - 3600) <= 0.0001, 'MKT-ADS-GST-REGISTERED-SCALABLE numeric customerLtvSgd expected 3600');
    assert.ok(typeof res1["ltvToCacRatio"] === 'number' && Math.abs(res1["ltvToCacRatio"] - 9) <= 0.0001, 'MKT-ADS-GST-REGISTERED-SCALABLE numeric ltvToCacRatio expected 9');
    assert.ok(typeof res1["returnOnAdSpendRoas"] === 'number' && Math.abs(res1["returnOnAdSpendRoas"] - 6) <= 0.0001, 'MKT-ADS-GST-REGISTERED-SCALABLE numeric returnOnAdSpendRoas expected 6');
    assert.strictEqual(res1["marketingEfficiencyTier"], "HEALTHY_SCALABLE_UNIT_ECONOMICS", 'MKT-ADS-GST-REGISTERED-SCALABLE value marketingEfficiencyTier mismatch');
    const res2 = runCase("calculateSingaporeAdsRoi", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-ADS-GST-REGISTERED-SCALABLE');
    const res3 = runCase("calculateSingaporeAdsRoi", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-ADS-GST-REGISTERED-SCALABLE');
  }
  { // Case: MKT-ADS-NON-GST-UNSUSTAINABLE
    const input = {"adSpendExcludingGstSgd":10000,"acquiredCustomersCount":10,"totalAttributedRevenueSgd":20000,"customerLifespanMonths":6,"monthlyGrossMarginPerCustomerSgd":150,"isB2bGstRegistered":false};
    const res1 = runCase("calculateSingaporeAdsRoi", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-ADS-NON-GST-UNSUSTAINABLE');
    assert.ok(typeof res1["effectiveNetAdCost"] === 'number' && Math.abs(res1["effectiveNetAdCost"] - 10900) <= 0.0001, 'MKT-ADS-NON-GST-UNSUSTAINABLE numeric effectiveNetAdCost expected 10900');
    assert.strictEqual(res1["isGstClaimableAsInputTax"], false, 'MKT-ADS-NON-GST-UNSUSTAINABLE value isGstClaimableAsInputTax mismatch');
    assert.ok(typeof res1["blendedCacSgd"] === 'number' && Math.abs(res1["blendedCacSgd"] - 1090) <= 0.0001, 'MKT-ADS-NON-GST-UNSUSTAINABLE numeric blendedCacSgd expected 1090');
    assert.ok(typeof res1["customerLtvSgd"] === 'number' && Math.abs(res1["customerLtvSgd"] - 900) <= 0.0001, 'MKT-ADS-NON-GST-UNSUSTAINABLE numeric customerLtvSgd expected 900');
    assert.ok(typeof res1["ltvToCacRatio"] === 'number' && Math.abs(res1["ltvToCacRatio"] - 0.83) <= 0.0001, 'MKT-ADS-NON-GST-UNSUSTAINABLE numeric ltvToCacRatio expected 0.83');
    assert.strictEqual(res1["marketingEfficiencyTier"], "UNSUSTAINABLE_CASH_DRAIN", 'MKT-ADS-NON-GST-UNSUSTAINABLE value marketingEfficiencyTier mismatch');
    const res2 = runCase("calculateSingaporeAdsRoi", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-ADS-NON-GST-UNSUSTAINABLE');
    const res3 = runCase("calculateSingaporeAdsRoi", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-ADS-NON-GST-UNSUSTAINABLE');
  }
  { // Case: MKT-BRAND-PREMIUM-CATEGORY-LEADER
    const input = {"brandName":"SingaTrust Enterprise","targetSegment":"REGIONAL_ENTERPRISE","priceTier":"PREMIUM_LUXURY","coreDifferentiators":["Deterministic 64 engines","ACRA/IRAS alignment","Sandbox isolation"],"hasRegisteredIposTrademark":true,"alignsWithGreenPlan2030":true,"hasMadeWithPassionEndorsement":true};
    const res1 = runCase("evaluateSingaporeBrandPositioning", input);
    assert.ok(res1 !== null && typeof res1 === 'object', 'Result must be object for MKT-BRAND-PREMIUM-CATEGORY-LEADER');
    assert.ok(typeof res1["perceivedPremiumX"] === 'number' && Math.abs(res1["perceivedPremiumX"] - 8) <= 0.0001, 'MKT-BRAND-PREMIUM-CATEGORY-LEADER numeric perceivedPremiumX expected 8');
    assert.strictEqual(res1["positioningQuadrant"], "PREMIUM_INNOVATOR_CATEGORY_LEADER", 'MKT-BRAND-PREMIUM-CATEGORY-LEADER value positioningQuadrant mismatch');
    assert.ok(typeof res1["singaporeTrustIndex"] === 'number' && Math.abs(res1["singaporeTrustIndex"] - 100) <= 0.0001, 'MKT-BRAND-PREMIUM-CATEGORY-LEADER numeric singaporeTrustIndex expected 100');
    assert.strictEqual(res1["defensibilityTier"], "HIGH_STRATEGIC_DEFENSIBILITY", 'MKT-BRAND-PREMIUM-CATEGORY-LEADER value defensibilityTier mismatch');
    const res2 = runCase("evaluateSingaporeBrandPositioning", input);
    assert.strictEqual(JSON.stringify(res1), JSON.stringify(res2), 'Determinism 2x for MKT-BRAND-PREMIUM-CATEGORY-LEADER');
    const res3 = runCase("evaluateSingaporeBrandPositioning", input);
    assert.strictEqual(JSON.stringify(res2), JSON.stringify(res3), 'Determinism 3x for MKT-BRAND-PREMIUM-CATEGORY-LEADER');
  }
  console.log('    ✅ marketing-sg: 18 cases verified.');

  console.log('\n====================================================================');
  console.log('🎉 All 130 Golden Corpus Cases Passed with 813 Assertions!');
}

runGoldenCorpusTests();
