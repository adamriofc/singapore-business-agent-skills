/**
 * Singapore IPOS Trademark Classification & Refusal Risk Engine (`engines/ipos-trademark-engine.js`)
 *
 * Mengimplementasikan audit pendaftaran merek dagang berdasarkan Singapore Trade Marks Act 1998 (Cap. 332)
 * dan International (Nice) Classification of Goods and Services yang dikelola oleh IPOS:
 *   - Verifikasi Nice Classification (Barang: Kelas 1-34, Jasa: Kelas 35-45).
 *   - Evaluasi Alasan Penolakan Mutlak (Absolute Grounds for Refusal - Section 7):
 *       * Devoid of distinctive character (hanya bersifat deskriptif atas barang/jasa).
 *       * Istilah geografis atau pujian umum (misal: "Singapore Best Coffee", "Quality Premium").
 *       * Tanda yang bertentangan dengan ketertiban umum atau moralitas (public order/morality).
 *       * Tanda yang memperdaya publik mengenai sifat atau asal geografis barang.
 *   - Evaluasi Alasan Penolakan Relatif (Relative Grounds for Refusal - Section 8):
 *       * Kemiripan fonetik, visual, atau konseptual dengan merek terdaftar terdahulu.
 *       * Barang/jasa yang identik atau serupa (similarity of goods/services).
 *   - Perhitungan Biaya Statuter Pendaftaran IPOS (Online Form TM4: S$280 - S$380 per kelas).
 *   - Skor Kelayakan Pendaftaran Merek (0 - 100) dan Rekomendasi Spesifikasi Barang/Jasa.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const IPOS_STATUTORY_FEES = {
  PRE_APPROVED_SPECIFICATION_FEE_SGD: 280, // Per kelas jika menggunakan deskripsi barang/jasa yang telah disetujui IPOS
  CUSTOM_SPECIFICATION_FEE_SGD: 380, // Per kelas untuk deskripsi kustom
  VALIDITY_YEARS: 10
};

// Pola kata-kata deskriptif umum yang memicu risiko Section 7 Absolute Grounds
const DESCRIPTIVE_PATTERNS = [
  'best', 'super', 'premium', 'quality', 'fast', 'express', 'cheap', 'pure', 'fresh',
  'singapore', 'lion city', 'asia', 'global', 'solutions', 'services', 'tech', 'group'
];

/**
 * Mengaudit permohonan merek dagang terhadap ketentuan IPOS Trade Marks Act.
 *
 * @param {Object} params
 * @param {string} params.markName Nama atau teks merek dagang yang akan didaftarkan
 * @param {number[]} params.niceClasses Array nomor kelas Nice (1 - 45)
 * @param {boolean} [params.usesPreApprovedSpecification=true] Menggunakan daftar barang/jasa pra-setujui IPOS
 * @param {boolean} [params.isInventedWord=false] Apakah kata tersebut merupakan kata ciptaan/unik (fanciful/arbitrary)
 * @param {boolean} [params.hasPriorIdenticalMarkInSameClass=false] Apakah ada merek identik terdahulu di kelas yang sama
 * @param {boolean} [params.hasVisualPhoneticSimilarity=false] Apakah ada kemiripan visual/fonetik dengan merek terkenal
 * @returns {Object} Skor kelayakan, tier risiko penolakan, rincian biaya IPOS, dan analisis hukum
 */
function evaluateTrademarkEligibility(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const markName = String(params.markName || '').trim();
  const markLower = markName.toLowerCase();
  const classes = Array.isArray(params.niceClasses) ? params.niceClasses : [];
  const usesPreApproved = params.usesPreApprovedSpecification !== undefined
    ? Boolean(params.usesPreApprovedSpecification)
    : true;
  const isInvented = Boolean(params.isInventedWord);
  const priorIdentical = Boolean(params.hasPriorIdenticalMarkInSameClass);
  const phoneticSimilarity = Boolean(params.hasVisualPhoneticSimilarity);

  // Validasi Kelas Nice (1 s/d 45)
  const validClasses = [];
  const invalidClasses = [];
  for (const c of classes) {
    const num = Math.floor(Number(c));
    if (num >= 1 && num <= 45) {
      if (!validClasses.includes(num)) validClasses.push(num);
    } else {
      invalidClasses.push(c);
    }
  }

  const classCount = Math.max(1, validClasses.length);
  const feePerClass = usesPreApproved
    ? IPOS_STATUTORY_FEES.PRE_APPROVED_SPECIFICATION_FEE_SGD
    : IPOS_STATUTORY_FEES.CUSTOM_SPECIFICATION_FEE_SGD;
  const totalIposFeesSgd = classCount * feePerClass;

  let registrabilityScore = isInvented ? 95 : 75;
  const refusalRisks = [];

  // 1. Audit Section 7 (Absolute Grounds for Refusal - Distinctiveness)
  if (!isInvented) {
    const matchedDescriptive = DESCRIPTIVE_PATTERNS.filter(word => markLower.split(/\s+/).includes(word));
    if (matchedDescriptive.length >= 2 || (markLower.split(/\s+/).length <= 2 && matchedDescriptive.length >= 1)) {
      registrabilityScore -= 30;
      refusalRisks.push({
        section: 'Section 7(1)(b) & (c) Trade Marks Act',
        ground: 'ABSOLUTE_GROUNDS_DESCRIPTIVE',
        severity: 'HIGH',
        explanation: `Merek terindikasi bersifat deskriptif atau berupa istilah pujian umum (${matchedDescriptive.join(', ')}) tanpa daya pembeda inheren.`
      });
    }
  }

  // 2. Audit Section 8 (Relative Grounds for Refusal - Conflicts with Prior Marks)
  if (priorIdentical) {
    registrabilityScore -= 50;
    refusalRisks.push({
      section: 'Section 8(1) Trade Marks Act',
      ground: 'RELATIVE_GROUNDS_IDENTICAL',
      severity: 'CRITICAL',
      explanation: "Ditemukan merek identik yang telah terdaftar terdahulu untuk kelas barang/jasa yang sama. Kemungkinan penolakan IPOS hampir pasti kecuali ada surat persetujuan (Letter of Consent)."
    });
  } else if (phoneticSimilarity) {
    registrabilityScore -= 25;
    refusalRisks.push({
      section: 'Section 8(2) Trade Marks Act',
      ground: 'RELATIVE_GROUNDS_SIMILAR',
      severity: 'HIGH',
      explanation: "Terdapat kemiripan visual atau fonetik yang dapat menimbulkan kebingungan publik (likelihood of confusion) terhadap merek terdaftar yang sudah ada."
    });
  }

  const finalScore = Math.max(0, Math.min(100, registrabilityScore));

  let outcomeVerdict = 'HIGH_CHANCE_OF_REGISTRATION';
  if (finalScore < 40) outcomeVerdict = 'LIKELY_REJECTED';
  else if (finalScore < 70) outcomeVerdict = 'BORDERLINE_OBJECTION_RISK';

  return {
    markName,
    registrabilityScore: finalScore,
    outcomeVerdict,
    classificationSummary: {
      appliedClasses: validClasses,
      totalClassesCount: classCount,
      totalValidClasses: validClasses.length,
      hasInvalidClasses: invalidClasses.length > 0,
      invalidClassesList: invalidClasses
    },
    niceClassificationAudit: {
      appliedClasses: validClasses,
      totalClassesCount: classCount,
      totalValidClasses: validClasses.length,
      hasInvalidClasses: invalidClasses.length > 0,
      invalidClassesList: invalidClasses
    },
    statutoryFilingFees: {
      feePerClassSgd: feePerClass,
      specificationType: usesPreApproved ? 'Pre-Approved (Form TM4 Standard)' : 'Custom Items (Form TM4 Non-Standard)',
      totalFeesPayableSgd: totalIposFeesSgd,
      validityPeriodYears: IPOS_STATUTORY_FEES.VALIDITY_YEARS
    },
    refusalRisksDetected: refusalRisks,
    legalAdvice: outcomeVerdict === 'HIGH_CHANCE_OF_REGISTRATION'
      ? "Merek memiliki daya pembeda yang kuat dan layak diajukan secara langsung melalui portal IPOS IP Mingle."
      : outcomeVerdict === 'BORDERLINE_OBJECTION_RISK'
        ? "Pertimbangkan menambahkan elemen logo/figuratif unik atau mengumpulkan bukti penggunaan sebelum pendaftaran (acquired distinctiveness)."
        : "Risiko penolakan mutlak/relatif sangat tinggi. Disarankan mengubah nama merek atau melakukan pencarian clearance mendalam."
  };
}

/**
 * Menghitung estimasi biaya pendaftaran merek IPOS berdasarkan jumlah kelas dan spesifikasi.
 *
 * @param {Object} params
 * @param {number|number[]} params.classes Jumlah kelas atau array nomor kelas
 * @param {boolean} [params.usesPreApprovedSpecification=true] Menggunakan item spesifikasi pre-approved (Form TM4)
 * @returns {Object} Rincian biaya IPOS dalam SGD
 */
function calculateIposFilingFees(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }
  const rawClasses = params.classes !== undefined ? params.classes : (params.niceClasses || 1);
  const classCount = Array.isArray(rawClasses)
    ? Math.max(1, rawClasses.length)
    : Math.max(1, Math.floor(Number(rawClasses) || 1));
  const usesPreApproved = params.usesPreApprovedSpecification !== undefined
    ? Boolean(params.usesPreApprovedSpecification)
    : true;

  const feePerClass = usesPreApproved
    ? IPOS_STATUTORY_FEES.PRE_APPROVED_SPECIFICATION_FEE_SGD
    : IPOS_STATUTORY_FEES.CUSTOM_SPECIFICATION_FEE_SGD;

  return {
    classCount,
    feePerClassSgd: feePerClass,
    specificationType: usesPreApproved ? 'Pre-Approved (Form TM4 Standard)' : 'Custom Items (Form TM4 Non-Standard)',
    totalFeesPayableSgd: classCount * feePerClass,
    validityPeriodYears: IPOS_STATUTORY_FEES.VALIDITY_YEARS
  };
}

module.exports = {
  evaluateTrademarkEligibility,
  evaluateTrademarkRegistrability: evaluateTrademarkEligibility,
  calculateIposFilingFees,
  IPOS_STATUTORY_FEES,
  DESCRIPTIVE_PATTERNS
};
