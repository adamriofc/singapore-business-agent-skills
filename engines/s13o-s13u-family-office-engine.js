/**
 * Singapore Family Office & Fund Tax Exemption Engine (`engines/s13o-s13u-family-office-engine.js`)
 *
 * Mengimplementasikan evaluasi pemenuhan syarat fasilitas pembebasan pajak dana kelolaan
 * (Fund Tax Incentive Schemes) berdasarkan Sections 13O dan 13U Income Tax Act 1947
 * sesuai pedoman Monetary Authority of Singapore (MAS):
 *   - Section 13O (Singapore Resident Fund Scheme):
 *       * Minimum AUM S$20 juta pada saat aplikasi dan sepanjang masa insentif.
 *       * Minimal 2 investment professionals (IP).
 *       * Minimum annual local business spending: bertingkat (S$200k s/d S$1M tergantung AUM).
 *       * Minimum alokasi investasi lokal: 10% dari AUM atau S$10 juta (mana yang lebih rendah).
 *   - Section 13U (Enhanced Tier Fund Scheme):
 *       * Minimum AUM S$50 juta.
 *       * Minimal 3 investment professionals (minimal 1 independen / non-family member).
 *       * Minimum annual local business spending: S$500k s/d S$1M.
 *       * Minimum alokasi investasi lokal: 10% dari AUM atau S$10 juta.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung batas pengeluaran bisnis lokal tahunan minimal (tier spending).
 * @param {number} aumSgd
 * @param {string} scheme '13O' | '13U'
 * @returns {number}
 */
function getRequiredLocalSpending(aumSgd, scheme) {
  if (scheme === '13U') {
    if (aumSgd >= 100000000) return 1000000; // S$1,000,000 untuk AUM >= S$100M
    return 500000;                          // S$500,000 untuk AUM < S$100M
  }
  // Scheme 13O
  if (aumSgd >= 100000000) return 1000000;
  if (aumSgd >= 50000000) return 500000;
  return 200000; // S$200,000 untuk AUM < S$50M
}

/**
 * Menghitung kewajiban investasi lokal Singapura minimal (Local Investment Requirement).
 * @param {number} aumSgd
 * @returns {number}
 */
function getRequiredLocalInvestment(aumSgd) {
  // 10% of AUM or S$10,000,000, whichever is lower
  return Math.min(aumSgd * 0.10, 10000000);
}

/**
 * Mengevaluasi kepatuhan terhadap skema Section 13O atau Section 13U.
 *
 * @param {Object} params
 * @param {string} params.scheme '13O' atau '13U'
 * @param {number} params.assetsUnderManagementSgd Total dana kelolaan (AUM) dalam SGD
 * @param {number} params.numberOfInvestmentProfessionals Jumlah profesional investasi yang dipekerjakan
 * @param {boolean} [params.hasIndependentProfessional=false] Apakah mempekerjakan IP non-keluarga (wajib untuk 13U)
 * @param {number} params.annualLocalBusinessSpendingSgd Total pengeluaran operasional lokal tahunan dalam SGD
 * @param {number} params.localInvestmentsSgd Nilai investasi pada aset lokal Singapura (ekuitas SGX, obligasi SG, dll.)
 * @returns {Object} Hasil evaluasi kelayakan statutory exemption
 */
function evaluateFamilyOfficeExemption(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const scheme = String(params.scheme || '13O').toUpperCase().trim();
  if (scheme !== '13O' && scheme !== '13U') {
    throw new Error("Skema harus '13O' (Singapore Resident Fund) atau '13U' (Enhanced Tier Fund).");
  }

  const aum = Math.max(0, Number(params.assetsUnderManagementSgd) || 0);
  const ips = Math.max(0, Number(params.numberOfInvestmentProfessionals) || 0);
  const hasIndependentIP = Boolean(params.hasIndependentProfessional);
  const localSpend = Math.max(0, Number(params.annualLocalBusinessSpendingSgd) || 0);
  const localInvest = Math.max(0, Number(params.localInvestmentsSgd) || 0);

  const minAumRequired = scheme === '13U' ? 50000000 : 20000000;
  const minIpsRequired = scheme === '13U' ? 3 : 2;
  const reqSpending = getRequiredLocalSpending(aum, scheme);
  const reqInvestment = getRequiredLocalInvestment(aum);

  const checkAum = aum >= minAumRequired;
  const checkIps = ips >= minIpsRequired;
  const checkIndependent = scheme === '13U' ? hasIndependentIP : true;
  const checkSpending = localSpend >= reqSpending;
  const checkInvestment = localInvest >= reqInvestment;

  const breaches = [];
  if (!checkAum) {
    breaches.push(`AUM S$${aum.toLocaleString()} di bawah batas minimum S$${minAumRequired.toLocaleString()}`);
  }
  if (!checkIps) {
    breaches.push(`Jumlah Investment Professionals (${ips}) kurang dari syarat minimum (${minIpsRequired})`);
  }
  if (!checkIndependent) {
    breaches.push("Skema 13U mewajibkan minimal 1 Investment Professional non-keluarga (independen)");
  }
  if (!checkSpending) {
    breaches.push(`Pengeluaran bisnis lokal tahunan S$${localSpend.toLocaleString()} kurang dari ambang batas S$${reqSpending.toLocaleString()}`);
  }
  if (!checkInvestment) {
    breaches.push(`Investasi pada instrumen lokal Singapura S$${localInvest.toLocaleString()} kurang dari kuota minimum S$${reqInvestment.toLocaleString()}`);
  }

  const isCompliant = checkAum && checkIps && checkIndependent && checkSpending && checkInvestment;

  return {
    scheme,
    isCompliant,
    breaches,
    metrics: {
      aumSgd: aum,
      minAumRequiredSgd: minAumRequired,
      investmentProfessionalsCount: ips,
      minInvestmentProfessionalsRequired: minIpsRequired,
      hasIndependentProfessional: hasIndependentIP,
      annualLocalSpendingSgd: localSpend,
      requiredLocalSpendingSgd: reqSpending,
      localInvestmentsSgd: localInvest,
      requiredLocalInvestmentsSgd: reqInvestment
    },
    statutorySummary: isCompliant
      ? `Lolos kualifikasi insentif pajak Section ${scheme} ITA (0% CIT atas Specified Income dari Designated Investments).`
      : `Tidak memenuhi kualifikasi Section ${scheme} ITA. Terdapat ${breaches.length} ketentuan statuter yang belum terpenuhi.`
  };
}

module.exports = {
  evaluateFamilyOfficeExemption,
  getRequiredLocalSpending,
  getRequiredLocalInvestment
};
