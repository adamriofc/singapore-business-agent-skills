/**
 * Singapore Buyer's Stamp Duty (BSD) & Additional Buyer's Stamp Duty (ABSD) Engine (`engines/stamp-duty-absd-engine.js`)
 *
 * Mengimplementasikan kalkulasi bea meterai properti berdasarkan Stamp Duties Act 1929 dan aturan terkini IRAS:
 *   - Buyer's Stamp Duty (BSD) Properti Residensial (Tarif bertingkat 1% s/d 6%).
 *   - Buyer's Stamp Duty (BSD) Properti Non-Residensial / Komersial (Tarif bertingkat 1% s/d 5%).
 *   - Additional Buyer's Stamp Duty (ABSD) Properti Residensial (Perubahan April 2023):
 *       * Singapore Citizen (SC): Properti ke-1: 0%, ke-2: 20%, ke-3+: 30%.
 *       * Permanent Resident (SPR): Properti ke-1: 5%, ke-2: 30%, ke-3+: 35%.
 *       * Warga Negara Asing (Foreigner): 60% untuk semua properti.
 *       * Badan Usaha / Entitas / Trust: 65% untuk semua properti.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

/**
 * Menghitung Buyer's Stamp Duty (BSD) untuk properti residensial.
 * @param {number} purchasePriceOrMarketValue Nilai pembelian atau nilai pasar wajar (mana yang lebih tinggi)
 * @returns {number}
 */
function calculateResidentialBsd(price) {
  let bsd = 0;
  let remaining = price;

  // Tier 1: S$0 - S$180,000 @ 1%
  const t1 = Math.min(remaining, 180000);
  bsd += t1 * 0.01;
  remaining -= t1;

  // Tier 2: S$180,001 - S$360,000 @ 2%
  if (remaining > 0) {
    const t2 = Math.min(remaining, 180000);
    bsd += t2 * 0.02;
    remaining -= t2;
  }

  // Tier 3: S$360,001 - S$1,000,000 @ 3% (span S$640,000)
  if (remaining > 0) {
    const t3 = Math.min(remaining, 640000);
    bsd += t3 * 0.03;
    remaining -= t3;
  }

  // Tier 4: S$1,000,001 - S$1,500,000 @ 4% (span S$500,000)
  if (remaining > 0) {
    const t4 = Math.min(remaining, 500000);
    bsd += t4 * 0.04;
    remaining -= t4;
  }

  // Tier 5: S$1,500,001 - S$3,000,000 @ 5% (span S$1,500,000)
  if (remaining > 0) {
    const t5 = Math.min(remaining, 1500000);
    bsd += t5 * 0.05;
    remaining -= t5;
  }

  // Tier 6: > S$3,000,000 @ 6%
  if (remaining > 0) {
    bsd += remaining * 0.06;
  }

  return Number(bsd.toFixed(2));
}

/**
 * Menghitung Buyer's Stamp Duty (BSD) untuk properti non-residensial (komersial/industri).
 * @param {number} price
 * @returns {number}
 */
function calculateNonResidentialBsd(price) {
  let bsd = 0;
  let remaining = price;

  // Tier 1: First S$180,000 @ 1%
  const t1 = Math.min(remaining, 180000);
  bsd += t1 * 0.01;
  remaining -= t1;

  // Tier 2: Next S$180,000 @ 2%
  if (remaining > 0) {
    const t2 = Math.min(remaining, 180000);
    bsd += t2 * 0.02;
    remaining -= t2;
  }

  // Tier 3: Next S$640,000 @ 3%
  if (remaining > 0) {
    const t3 = Math.min(remaining, 640000);
    bsd += t3 * 0.03;
    remaining -= t3;
  }

  // Tier 4: Next S$500,000 @ 4%
  if (remaining > 0) {
    const t4 = Math.min(remaining, 500000);
    bsd += t4 * 0.04;
    remaining -= t4;
  }

  // Tier 5: > S$1,500,000 @ 5%
  if (remaining > 0) {
    bsd += remaining * 0.05;
  }

  return Number(bsd.toFixed(2));
}

/**
 * Mendapatkan tarif ABSD berdasarkan profil pembeli dan urutan properti per April 2023.
 * @param {string} profile 'SC' | 'SPR' | 'FOREIGNER' | 'ENTITY'
 * @param {number} propertyCount Jumlah total properti residensial yang dimiliki termasuk properti ini
 * @returns {number} Rasio desimal tarif ABSD
 */
function getAbsdRate(profile, propertyCount) {
  const normProfile = String(profile).toUpperCase().trim();
  const count = Math.max(1, Number(propertyCount) || 1);

  switch (normProfile) {
    case 'SC':
    case 'CITIZEN':
      if (count === 1) return 0.00;
      if (count === 2) return 0.20;
      return 0.30;
    case 'SPR':
    case 'PR':
      if (count === 1) return 0.05;
      if (count === 2) return 0.30;
      return 0.35;
    case 'FOREIGNER':
    case 'FR':
      return 0.60;
    case 'ENTITY':
    case 'COMPANY':
    case 'TRUST':
      return 0.65;
    default:
      return 0.65;
  }
}

/**
 * Menghitung total beban bea meterai (BSD + ABSD).
 *
 * @param {Object} params
 * @param {number} params.propertyValue Nilai beli atau nilai pasar properti dalam SGD
 * @param {string} [params.propertyType='RESIDENTIAL'] 'RESIDENTIAL' atau 'COMMERCIAL' / 'INDUSTRIAL'
 * @param {string} [params.buyerProfile='SC'] 'SC', 'SPR', 'FOREIGNER', atau 'ENTITY'
 * @param {number} [params.propertyCount=1] Urutan kepemilikan properti residensial di Singapura
 * @returns {Object} Rincian perhitungan bea meterai
 */
function calculatePropertyStampDuty(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const value = Math.max(0, Number(params.propertyValue) || 0);
  const type = String(params.propertyType || 'RESIDENTIAL').toUpperCase().trim();
  const profile = String(params.buyerProfile || 'SC').toUpperCase().trim();
  const count = Math.max(1, Number(params.propertyCount) || 1);

  const isResidential = type === 'RESIDENTIAL';

  // Kalkulasi BSD
  const bsd = isResidential ? calculateResidentialBsd(value) : calculateNonResidentialBsd(value);

  // Kalkulasi ABSD (Hanya berlaku untuk properti residensial)
  let absdRate = 0;
  let absd = 0;

  if (isResidential) {
    absdRate = getAbsdRate(profile, count);
    absd = Number((value * absdRate).toFixed(2));
  }

  const totalStampDuty = Number((bsd + absd).toFixed(2));
  const effectiveStampDutyRatePercent = value > 0
    ? Number(((totalStampDuty / value) * 100).toFixed(2))
    : 0;

  return {
    propertyValueSgd: value,
    propertyType: type,
    buyerProfile: profile,
    propertyCountNumber: count,
    bsd: {
      amountSgd: bsd,
      effectiveRatePercent: value > 0 ? Number(((bsd / value) * 100).toFixed(2)) : 0
    },
    absd: {
      ratePercent: Number((absdRate * 100).toFixed(2)),
      amountSgd: absd,
      isApplicable: isResidential
    },
    totalStampDutyPayableSgd: totalStampDuty,
    effectiveStampDutyRatePercent
  };
}

module.exports = {
  calculatePropertyStampDuty,
  calculateResidentialBsd,
  calculateNonResidentialBsd,
  getAbsdRate
};
