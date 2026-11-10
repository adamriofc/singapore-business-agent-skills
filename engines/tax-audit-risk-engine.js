/**
 * Singapore Tax Audit & Compliance Risk Engine (`engines/tax-audit-risk-engine.js`)
 *
 * Mengimplementasikan mesin asesmen risiko audit pajak IRAS (Inland Revenue Authority of Singapore)
 * untuk mendeteksi anomali kepatuhan sebelum terbitnya surat penyelidikan atau query resmi IRAS:
 *   - Rekonsiliasi Omzet GST F5 vs Omzet Laba Rugi CIT (Form C / C-S) (varians > 5%).
 *   - Deviasi Gross Profit Margin terhadap standar industri SSIC.
 *   - Lonjakan beban tunjangan direktur dan biaya hiburan tanpa voucer pendukung.
 *   - Anomali pinjaman pemegang saham / direktur (director loan balances).
 *   - Ketidaksesuaian Withholding Tax (Section 45/45A) atas beban bunga dan royalti luar negeri.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menganalisis profil kepatuhan fiskal dan menghasilkan skor risiko audit IRAS (0 - 100).
 *
 * @param {Object} params
 * @param {number} params.revenueCitSgd Omzet yang dilaporkan pada Form C / C-S (CIT)
 * @param {number} params.revenueGstAnnualSgd Akumulasi omzet kena pajak pada 4 kuartal GST F5
 * @param {number} params.grossProfitMarginPercent Margin laba kotor perusahaan (dalam %)
 * @param {number} [params.industryBenchmarkGpmPercent=30] Standar rata-rata GPM industri SSIC relevan
 * @param {number} params.directorRemunerationSgd Total remunerasi direktur
 * @param {number} [params.directorLoanCreditBalanceSgd=0] Saldo pinjaman dari direktur/pemegang saham
 * @param {number} [params.foreignInterestRoyaltyExpenseSgd=0] Beban bunga/royalti ke entitas asing
 * @param {number} [params.whtRemittedSgd=0] Withholding tax yang telah disetor ke IRAS
 * @returns {Object} Skor risiko, klasifikasi tier, dan daftar temuan anomali
 */
function assessTaxAuditRisk(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const citRevenue = Math.max(0, Number(params.revenueCitSgd) || 0);
  const gstRevenue = Math.max(0, Number(params.revenueGstAnnualSgd) || 0);
  const gpm = Number(params.grossProfitMarginPercent) || 0;
  const benchmarkGpm = Number(params.industryBenchmarkGpmPercent) !== undefined
    ? Number(params.industryBenchmarkGpmPercent)
    : 30;
  const dirRemun = Math.max(0, Number(params.directorRemunerationSgd) || 0);
  const dirLoan = Math.max(0, Number(params.directorLoanCreditBalanceSgd) || 0);
  const foreignExpense = Math.max(0, Number(params.foreignInterestRoyaltyExpenseSgd) || 0);
  const whtRemitted = Math.max(0, Number(params.whtRemittedSgd) || 0);

  let score = 0;
  const riskFlags = [];

  // 1. Rekonsiliasi GST vs CIT Revenue
  if (citRevenue > 0 && gstRevenue > 0) {
    const revDiff = Math.abs(citRevenue - gstRevenue);
    const variancePercent = Number(((revDiff / citRevenue) * 100).toFixed(2));
    if (variancePercent > 5.0) {
      const flagScore = variancePercent > 15.0 ? 30 : 20;
      score += flagScore;
      riskFlags.push({
        domain: 'GST_CIT_RECONCILIATION',
        severity: variancePercent > 15.0 ? 'HIGH' : 'MEDIUM',
        score: flagScore,
        description: `Varians omzet GST vs CIT sebesar ${variancePercent}% (S$${revDiff.toLocaleString()}) melebihi toleransi wajar 5%.`
      });
    }
  }

  // 2. Deviasi Margin Laba Kotor terhadap Benchmark Industri SSIC
  const gpmDiff = Math.abs(gpm - benchmarkGpm);
  if (gpmDiff > 12.0) {
    const flagScore = gpmDiff > 20.0 ? 25 : 15;
    score += flagScore;
    riskFlags.push({
      domain: 'PROFIT_MARGIN_ANOMALY',
      severity: gpmDiff > 20.0 ? 'HIGH' : 'MEDIUM',
      score: flagScore,
      description: `Gross Profit Margin (${gpm}%) menyimpang ${gpmDiff.toFixed(1)}% dari rata-rata industri SSIC (${benchmarkGpm}%).`
    });
  }

  // 3. Rasio Remunerasi Direktur terhadap Omzet
  if (citRevenue > 0) {
    const dirRatio = (dirRemun / citRevenue) * 100;
    if (dirRatio > 35.0) {
      score += 20;
      riskFlags.push({
        domain: 'DIRECTOR_REMUNERATION_RATIO',
        severity: 'MEDIUM',
        score: 20,
        description: `Remunerasi direktur menyerap ${dirRatio.toFixed(1)}% dari total omzet tahunan.`
      });
    }
  }

  // 4. Saldo Pinjaman Direktur / Pihak Berelasi
  if (dirLoan > 250000 && citRevenue > 0 && (dirLoan / citRevenue) > 0.40) {
    score += 15;
    riskFlags.push({
      domain: 'UNEXPLAINED_DIRECTOR_LOAN',
      severity: 'MEDIUM',
      score: 15,
      description: `Saldo kredit pinjaman direktur/pemegang saham (S$${dirLoan.toLocaleString()}) sangat tinggi relatif terhadap omzet.`
    });
  }

  // 5. Withholding Tax Exposure atas Beban Luar Negeri
  if (foreignExpense > 0) {
    // Estimasi WHT minimum statuter 10% - 15%
    const expectedMinWht = foreignExpense * 0.10;
    if (whtRemitted < expectedMinWht) {
      score += 25;
      riskFlags.push({
        domain: 'WITHHOLDING_TAX_UNDERPAYMENT',
        severity: 'HIGH',
        score: 25,
        description: `Beban bunga/royalti asing S$${foreignExpense.toLocaleString()} hanya menyetor WHT S$${whtRemitted.toLocaleString()} (di bawah tarif minimum 10%).`
      });
    }
  }

  // Normalisasi skor maks 100
  const normalizedScore = Math.min(100, score);

  let riskTier = 'LOW';
  if (normalizedScore >= 70) riskTier = 'SEVERE';
  else if (normalizedScore >= 45) riskTier = 'HIGH';
  else if (normalizedScore >= 20) riskTier = 'MEDIUM';

  return {
    riskScore: normalizedScore,
    riskTier,
    totalFlagsIdentified: riskFlags.length,
    riskFlags,
    auditRecommendation: riskTier === 'LOW'
      ? "Profil kepatuhan fiskal bersih dan konsisten. Risiko penyelidikan IRAS rendah."
      : riskTier === 'MEDIUM'
        ? "Terdapat beberapa anomali rekonsiliasi moderat. Siapkan dokumentasi voucer pendukung."
        : "Risiko tinggi terbitnya surat klarifikasi atau audit kepatuhan oleh IRAS. Diperlukan penyesuaian fiskal preventif."
  };
}

module.exports = {
  assessTaxAuditRisk
};
