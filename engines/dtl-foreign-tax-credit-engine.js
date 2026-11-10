/**
 * Singapore Foreign Tax Credit (FTC) & Double Taxation Relief Engine (`engines/dtl-foreign-tax-credit-engine.js`)
 *
 * Mengimplementasikan evaluasi Foreign Tax Credit (FTC) dan FTC Pooling System berdasarkan
 * Income Tax Act 1947 (Sections 50, 50A, dan 50B) serta Section 13(8) Foreign-Sourced Income Exemption (FSIE).
 *
 * Aturan Statuter:
 *   - Double Taxation Relief (DTR) konvensional: kredit dibatasi pada nilai terendah antara
 *     pajak luar negeri yang dibayar vs pajak Singapura yang terutang atas penghasilan tersebut.
 *   - FTC Pooling System (Section 50A): perusahaan dapat menggabungkan (pool) kredit pajak luar negeri
 *     jika memenuhi 3 syarat:
 *       1. Pajak penghasilan telah dibayar di yurisdiksi luar negeri.
 *       2. Tarif pajak nominal (headline tax rate) yurisdiksi luar negeri minimal 15%.
 *       3. Terdapat pajak Singapura yang terutang atas penghasilan luar negeri tersebut.
 *   - Section 13(8) FSIE: Pembebasan pajak atas dividen, keuntungan cabang, dan penghasilan jasa luar negeri.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const STATUTORY_CIT_RATE = 0.17;
const FTC_POOLING_HEADLINE_RATE_MIN = 0.15; // Minimal 15% tarif nominal luar negeri

/**
 * Menghitung Foreign Tax Credit (FTC) baik metode spesifik maupun FTC Pooling.
 *
 * @param {Object} params
 * @param {Array<Object>} params.foreignIncomes Daftar penghasilan luar negeri
 *   Contoh elemen: {
 *     country: 'Australia',
 *     incomeType: 'Dividend',
 *     foreignIncomeGrossSgd: 100000,
 *     foreignTaxPaidSgd: 30000,
 *     foreignHeadlineTaxRate: 0.30
 *   }
 * @param {boolean} [params.usePooling=true] Apakah menggunakan FTC Pooling System
 * @param {number} [params.singaporeExpensesAttributableSgd=0] Beban yang diatribusikan ke penghasilan luar negeri
 * @returns {Object} Hasil evaluasi klaim FTC dan beban pajak neto Singapura
 */
function calculateForeignTaxCredit(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const foreignIncomes = Array.isArray(params.foreignIncomes) ? params.foreignIncomes : [];
  const usePooling = params.usePooling !== undefined ? Boolean(params.usePooling) : true;
  const sgExpenses = Math.max(0, Number(params.singaporeExpensesAttributableSgd) || 0);

  let totalForeignIncomeGross = 0;
  let totalForeignTaxPaid = 0;
  let totalQualifyingForPoolingTaxPaid = 0;
  let totalQualifyingForPoolingSgTax = 0;

  const itemizedResults = [];

  for (const item of foreignIncomes) {
    const gross = Math.max(0, Number(item.foreignIncomeGrossSgd) || 0);
    const taxPaid = Math.max(0, Number(item.foreignTaxPaidSgd) || 0);
    const headlineRate = Number(item.foreignHeadlineTaxRate) || 0;

    totalForeignIncomeGross += gross;
    totalForeignTaxPaid += taxPaid;

    // Pajak Singapura teoritis atas penghasilan ini (asumsi 17%)
    const sgTaxPayableSpecific = Number((gross * STATUTORY_CIT_RATE).toFixed(2));
    const specificCreditAllowed = Math.min(taxPaid, sgTaxPayableSpecific);

    const qualifiesForPooling = headlineRate >= FTC_POOLING_HEADLINE_RATE_MIN && taxPaid > 0;

    if (qualifiesForPooling) {
      totalQualifyingForPoolingTaxPaid += taxPaid;
      totalQualifyingForPoolingSgTax += sgTaxPayableSpecific;
    }

    itemizedResults.push({
      country: item.country || 'Unknown',
      incomeType: item.incomeType || 'General',
      foreignIncomeGrossSgd: gross,
      foreignTaxPaidSgd: taxPaid,
      foreignHeadlineTaxRate: headlineRate,
      sgTaxPayableSpecificSgd: sgTaxPayableSpecific,
      specificCreditAllowedSgd: specificCreditAllowed,
      qualifiesForPooling
    });
  }

  // Komputasi Total Pajak Singapura atas Penghasilan Bersih Luar Negeri
  const netForeignIncomeSgd = Math.max(0, totalForeignIncomeGross - sgExpenses);
  const totalSgTaxBeforeCredit = Number((netForeignIncomeSgd * STATUTORY_CIT_RATE).toFixed(2));

  let totalFtcClaimed = 0;
  let calculationMethod = 'Item-by-item Specific FTC';

  if (usePooling && totalQualifyingForPoolingTaxPaid > 0) {
    calculationMethod = 'FTC Pooling System (Section 50A)';
    // Pada pooling, kredit dibatasi pada nilai terendah antara total pajak asing yang memenuhi syarat
    // dan total pajak Singapura atas penghasilan luar negeri yang dipooling
    totalFtcClaimed = Math.min(totalQualifyingForPoolingTaxPaid, totalQualifyingForPoolingSgTax, totalSgTaxBeforeCredit);
  } else {
    // Penjumlahan klaim per item (metode konvensional)
    const sumSpecific = itemizedResults.reduce((acc, curr) => acc + curr.specificCreditAllowedSgd, 0);
    totalFtcClaimed = Math.min(sumSpecific, totalSgTaxBeforeCredit);
  }

  const netSingaporeTaxPayable = Math.max(0, Number((totalSgTaxBeforeCredit - totalFtcClaimed).toFixed(2)));

  return {
    calculationMethod,
    summary: {
      totalForeignIncomeGrossSgd: totalForeignIncomeGross,
      attributableExpensesSgd: sgExpenses,
      netForeignIncomeTaxableSgd: netForeignIncomeSgd,
      singaporeTaxBeforeCreditSgd: totalSgTaxBeforeCredit,
      totalForeignTaxPaidSgd: totalForeignTaxPaid,
      totalFtcAllowedSgd: totalFtcClaimed,
      netSingaporeTaxPayableSgd: netSingaporeTaxPayable
    },
    poolingDetails: {
      poolingElected: usePooling,
      qualifyingForeignTaxPaidSgd: totalQualifyingForPoolingTaxPaid,
      qualifyingSgTaxBenchmarkSgd: totalQualifyingForPoolingSgTax,
      headlineRateThreshold: FTC_POOLING_HEADLINE_RATE_MIN
    },
    itemized: itemizedResults
  };
}

module.exports = {
  calculateForeignTaxCredit,
  FTC_POOLING_HEADLINE_RATE_MIN
};
