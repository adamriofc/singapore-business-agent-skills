/**
 * Singapore SFRS Accounting & Revenue Recognition Engine (`engines/sfrs-accounting-engine.js`)
 *
 * Mengimplementasikan evaluasi standar akuntansi keuangan Singapura (Singapore Financial Reporting Standards - SFRS):
 *   - Kualifikasi Kerangka Pelaporan (SFRS for Small Entities vs Full SFRS):
 *       * Small Entity Thresholds: Memenuhi minimal 2 dari 3 kriteria dalam 2 tahun berturut-turut:
 *           1. Total pendapatan tahunan <= S$10.000.000.
 *           2. Total aset kotor <= S$10.000.000.
 *           3. Jumlah karyawan penuh waktu <= 50 orang.
 *       * Tidak memiliki akuntabilitas publik (not publicly accountable).
 *   - Evaluasi Model 5 Langkah Pengakuan Pendapatan (SFRS 115 Revenue from Contracts with Customers):
 *       1. Identify the contract with a customer.
 *       2. Identify the performance obligations in the contract.
 *       3. Determine the transaction price.
 *       4. Allocate the transaction price to the performance obligations.
 *       5. Recognise revenue when (or as) the entity satisfies a performance obligation.
 *   - Alokasi Harga Transaksi berdasarkan Standalone Selling Prices (SSP).
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const SMALL_ENTITY_THRESHOLDS = {
  MAX_REVENUE_SGD: 10000000,
  MAX_TOTAL_ASSETS_SGD: 10000000,
  MAX_EMPLOYEES: 50
};

/**
 * Mengevaluasi kelayakan entitas menerapkan SFRS for Small Entities.
 *
 * @param {Object} params
 * @param {boolean} [params.isPubliclyAccountable=false] Apakah entitas memiliki akuntabilitas publik (terdaftar di bursa / lembaga keuangan)
 * @param {number} params.annualRevenueSgd Pendapatan tahunan dalam SGD
 * @param {number} params.totalAssetsSgd Total aset dalam SGD
 * @param {number} params.headcount Jumlah karyawan
 * @returns {Object} Hasil evaluasi kerangka pelaporan akuntansi yang berlaku
 */
function evaluateSfrsFramework(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const isPublic = Boolean(params.isPubliclyAccountable);
  const revenue = Math.max(0, Number(params.annualRevenueSgd) || 0);
  const assets = Math.max(0, Number(params.totalAssetsSgd) || 0);
  const headcount = Math.max(0, Math.floor(Number(params.headcount) || 0));

  if (isPublic) {
    return {
      recommendedFramework: 'FULL_SFRS',
      isEligibleForSmallEntitySfrs: false,
      disqualificationReason: 'PUBLICLY_ACCOUNTABLE_ENTITY',
      thresholdChecks: {
        revenueMet: false,
        assetsMet: false,
        headcountMet: false
      },
      explanation: 'Entitas memiliki akuntabilitas publik (terdaftar di bursa/institusi keuangan), wajib menerapkan Full SFRS.'
    };
  }

  const revenueMet = revenue <= SMALL_ENTITY_THRESHOLDS.MAX_REVENUE_SGD;
  const assetsMet = assets <= SMALL_ENTITY_THRESHOLDS.MAX_TOTAL_ASSETS_SGD;
  const headcountMet = headcount <= SMALL_ENTITY_THRESHOLDS.MAX_EMPLOYEES;

  const criteriaMetCount = [revenueMet, assetsMet, headcountMet].filter(Boolean).length;
  const qualifies = criteriaMetCount >= 2;

  return {
    recommendedFramework: qualifies ? 'SFRS_FOR_SMALL_ENTITIES' : 'FULL_SFRS',
    isEligibleForSmallEntitySfrs: qualifies,
    criteriaMetCount,
    thresholdChecks: {
      annualRevenueSgd: revenue,
      revenueMet,
      totalAssetsSgd: assets,
      assetsMet,
      headcount,
      headcountMet
    },
    explanation: qualifies
      ? `Memenuhi ${criteriaMetCount} dari 3 kriteria ambang batas statuter. Berhak memilih SFRS for Small Entities untuk simplifikasi pelaporan.`
      : `Hanya memenuhi ${criteriaMetCount} dari 3 kriteria ambang batas statuter (minimal 2). Wajib menerapkan Full SFRS.`
  };
}

/**
 * Menghitung alokasi harga transaksi pendapatan berdasarkan SFRS 115 (Step 4: Standalone Selling Price Allocation).
 *
 * @param {Object} params
 * @param {number} params.totalTransactionPriceSgd Total harga paket kontrak (SGD)
 * @param {Array<{ id: string, name: string, standaloneSellingPriceSgd: number }>} params.performanceObligations Daftar kewajiban pelaksanaan
 * @returns {Object} Alokasi proporsional harga transaksi ke masing-masing kewajiban pelaksanaan
 */
function allocateTransactionPriceSfrs115(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const totalPrice = Math.max(0, Number(params.totalTransactionPriceSgd) || 0);
  const obligations = Array.isArray(params.performanceObligations) ? params.performanceObligations : [];

  const totalSsp = obligations.reduce((sum, item) => sum + Math.max(0, Number(item.standaloneSellingPriceSgd) || 0), 0);

  if (totalSsp === 0 || obligations.length === 0) {
    return {
      totalTransactionPriceSgd: totalPrice,
      totalStandaloneSellingPriceSgd: 0,
      allocations: []
    };
  }

  const discountAmountSgd = totalSsp > totalPrice ? Math.round((totalSsp - totalPrice) * 100) / 100 : 0;

  const allocations = obligations.map(item => {
    const ssp = Math.max(0, Number(item.standaloneSellingPriceSgd) || 0);
    const ratio = ssp / totalSsp;
    const allocatedRevenue = Math.round(totalPrice * ratio * 100) / 100;
    return {
      id: item.id || item.name,
      name: item.name,
      standaloneSellingPriceSgd: ssp,
      weightRatio: Math.round(ratio * 10000) / 10000,
      allocatedRevenueSgd: allocatedRevenue
    };
  });

  return {
    totalTransactionPriceSgd: totalPrice,
    totalStandaloneSellingPriceSgd: totalSsp,
    bundleDiscountSgd: discountAmountSgd,
    allocations
  };
}

module.exports = {
  evaluateSfrsFramework,
  allocateTransactionPriceSfrs115,
  SMALL_ENTITY_THRESHOLDS
};
