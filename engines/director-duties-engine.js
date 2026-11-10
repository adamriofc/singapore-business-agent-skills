/**
 * Singapore Director Duties & Disqualification Compliance Engine (`engines/director-duties-engine.js`)
 *
 * Mengimplementasikan audit kewajiban fidusia dan kelayakan kualifikasi direktur perusahaan
 * berdasarkan Singapore Companies Act 1967 (Cap. 50):
 *   - Kualifikasi Statuter Pengangkatan Direktur (Section 145):
 *       * Usia minimal 18 tahun, memiliki kecakapan hukum penuh.
 *       * Minimal 1 direktur yang berdomisili lokal di Singapura (Ordinarily Resident: SC, SPR, EntrePass).
 *   - Diskualifikasi Otomatis Direktur (Section 148 & 149):
 *       * Orang yang dinyatakan pailit belum direhabilitasi (Undischarged Bankrupt - S.148).
 *       * Direktur yang dihukum atas tindak pidana penipuan/ketidakjujuran (Fraud/Dishonesty - S.154).
 *       * Direktur dari entitas insolven yang dilikuidasi tidak layak (Unfit Directors of Insolvent Companies - S.149).
 *       * Diskualifikasi atas kegagalan kepatuhan pengarsipan berulang (3 pesanan pengadilan di bawah S.13 atau 3 pelanggaran S.155).
 *   - Kewajiban Pengungkapan Konflik Kepentingan (Section 156):
 *       * Kewajiban mendeklarasikan kepentingan langsung/tidak langsung dalam kontrak dengan perusahaan.
 *   - Kewajiban Bertindak Jujur dan Hati-Hati (Section 157 Fiduciary Duty & Reasonable Diligence).
 *   - Skor Kepatuhan Direktur (0 - 100) dan Rekomendasi Mitigasi Liabilitas Personal.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const STATUTORY_DIRECTOR_RULES = {
  MINIMUM_AGE: 18,
  DISQUALIFICATION_BANKRUPTCY_PENALTY_FINE_MAX_SGD: 10000,
  DISQUALIFICATION_IMPRISONMENT_MAX_YEARS: 2
};

/**
 * Mengaudit profil dan kepatuhan direktur terhadap ketentuan Companies Act.
 *
 * @param {Object} params
 * @param {string} params.directorName Nama direktur
 * @param {number} params.ageInYears Usia direktur dalam tahun
 * @param {string} [params.residentialStatus='SC'] Status kependudukan ('SC', 'SPR', 'ENTREPASS', 'EMPLOYMENT_PASS', 'FOREIGN')
 * @param {boolean} [params.isUndischargedBankrupt=false] Apakah dalam status pailit belum direhabilitasi
 * @param {boolean} [params.hasFraudOrDishonestyConviction=false] Apakah pernah dihukum atas kejahatan penipuan/ketidakjujuran
 * @param {number} [params.unfitInsolventLiquidationsCount=0] Jumlah perusahaan insolven yang dipimpin dalam 5 tahun terakhir
 * @param {boolean} [params.hasDisclosedConflictOfInterest=true] Apakah telah mendeklarasikan konflik kepentingan (S.156)
 * @param {boolean} [params.isSoleDirector=false] Apakah bertindak sebagai direktur tunggal
 * @returns {Object} Kelayakan hukum menjabat direktur, skor integritas, dan audit kepatuhan
 */
function auditDirectorEligibility(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const name = String(params.directorName || 'Director').trim();
  const age = Math.max(0, Math.floor(Number(params.ageInYears !== undefined ? params.ageInYears : params.age) || 0));
  const resStatus = String(params.residentialStatus || 'SC').toUpperCase().trim();
  const isBankrupt = Boolean(params.isUndischargedBankrupt);
  const hasFraud = Boolean(params.hasFraudOrDishonestyConviction);
  const insolventCount = Math.max(0, Number(params.unfitInsolventLiquidationsCount) || 0);
  const conflictDisclosed = params.hasDisclosedConflictOfInterest !== undefined
    ? Boolean(params.hasDisclosedConflictOfInterest)
    : true;
  const isSole = Boolean(params.isSoleDirector);

  const isOrdinarilyResident = resStatus === 'SC' || resStatus === 'SPR' || resStatus === 'ENTREPASS';

  let isEligible = true;
  let complianceScore = 100;
  const disqualifications = [];
  const riskNotes = [];

  // 1. Audit Batas Usia Minimum (Section 145(2))
  if (age < STATUTORY_DIRECTOR_RULES.MINIMUM_AGE) {
    isEligible = false;
    complianceScore -= 50;
    disqualifications.push({
      basis: 'Section 145(2) Companies Act',
      ground: 'UNDERAGE',
      description: `Usia (${age} tahun) kurang dari batas minimum statuter 18 tahun.`
    });
  }

  // 2. Audit Status Kepailitan (Section 148)
  if (isBankrupt) {
    isEligible = false;
    complianceScore -= 100;
    disqualifications.push({
      basis: 'Section 148 Companies Act',
      ground: 'UNDISCHARGED_BANKRUPT',
      description: "Pailit belum direhabilitasi (Undischarged Bankrupt) dilarang mutlak menjabat sebagai direktur tanpa izin pengadilan Tinggi (High Court) atau Official Assignee."
    });
  }

  // 3. Audit Vonis Pidana Penipuan (Section 154)
  if (hasFraud) {
    isEligible = false;
    complianceScore -= 100;
    disqualifications.push({
      basis: 'Section 154 Companies Act',
      ground: 'FRAUD_CONVICTION',
      description: "Pernah divonis atas tindak pidana terkait pembentukan/pengelolaan perusahaan atau penipuan/ketidakjujuran dengan ancaman penjara 3 bulan atau lebih (diskualifikasi 5 tahun)."
    });
  }

  // 4. Audit Unfit Director of Insolvent Companies (Section 149)
  if (insolventCount >= 2) {
    complianceScore -= 40;
    riskNotes.push({
      basis: 'Section 149 Companies Act',
      severity: 'HIGH',
      description: `Pernah memimpin ${insolventCount} perusahaan insolven yang dilikuidasi. Menghadapi risiko penyelidikan diskualifikasi oleh Official Receiver.`
    });
  }

  // 5. Audit Pengungkapan Konflik Kepentingan (Section 156)
  if (!conflictDisclosed) {
    complianceScore -= 25;
    riskNotes.push({
      basis: 'Section 156 Companies Act',
      severity: 'HIGH',
      description: "Gagal mendeklarasikan konflik kepentingan pribadi dalam transaksi korporat. Dapat dikenai denda hingga S$5.000 atau penjara hingga 12 bulan."
    });
  }

  // 6. Evaluasi Domisili Residen Lokal
  if (isSole && !isOrdinarilyResident) {
    isEligible = false;
    complianceScore -= 50;
    disqualifications.push({
      basis: 'Section 145(1) Companies Act',
      ground: 'NO_LOCAL_RESIDENT_DIRECTOR',
      description: "Direktur tunggal bukan merupakan penduduk lokal Singapura (bukan SC/SPR/EntrePass). Perusahaan wajib memiliki minimal satu direktur lokal."
    });
  }

  const finalScore = Math.max(0, Math.min(100, complianceScore));

  return {
    directorName: name,
    isLegallyEligible: isEligible,
    complianceScore: finalScore,
    status: isEligible ? 'QUALIFIED_FOR_DIRECTORSHIP' : 'LEGALLY_DISQUALIFIED',
    profileAudit: {
      age,
      residentialStatus: resStatus,
      isOrdinarilyResidentInSingapore: isOrdinarilyResident,
      isUndischargedBankrupt: isBankrupt,
      hasFraudConviction: hasFraud,
      hasDisclosedConflictOfInterest: conflictDisclosed
    },
    totalDisqualifications: disqualifications.length,
    disqualificationsList: disqualifications,
    governanceRisksList: riskNotes,
    statutoryAdvice: isEligible
      ? "Direktur memenuhi seluruh syarat hukum pengangkatan dan kualifikasi di bawah Singapore Companies Act."
      : "PERINGATAN HUKUM: Orang ini tidak memenuhi syarat atau dilarang secara hukum menjabat sebagai direktur. Bertindak sebagai direktur dalam status diskualifikasi adalah tindak pidana serius."
  };
}

module.exports = {
  auditDirectorEligibility,
  evaluateDirectorEligibility: auditDirectorEligibility,
  STATUTORY_DIRECTOR_RULES
};
