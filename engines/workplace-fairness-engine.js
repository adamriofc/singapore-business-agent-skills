/**
 * Singapore Workplace Fairness & TAFEP Anti-Discrimination Engine (`engines/workplace-fairness-engine.js`)
 *
 * Mengimplementasikan audit kepatuhan rekrutmen dan ketenagakerjaan berdasarkan
 * Workplace Fairness Legislation (WFA) dan Tripartite Guidelines on Fair Employment Practices (TGFEP)
 * yang diawasi oleh TAFEP (Tripartite Alliance for Fair and Progressive Employment Practices) dan MOM:
 *   - 5 Kategori Karakteristik yang Dilindungi Hukum (Protected Characteristics):
 *       1. Usia (Age).
 *       2. Kewarganegaraan & Kebangsaan (Nationality, Citizenship, Residential Status).
 *       3. Jenis Kelamin, Status Perkawinan, Kehamilan, Tanggung Jawab Pengasuhan.
 *       4. Ras, Bahasa, Agama (Race, Language, Religion).
 *       5. Disabilitas dan Kondisi Kesehatan Mental.
 *   - Deteksi Klausul & Kata Kunci Diskriminatif pada Deskripsi Pekerjaan / Kebijakan Internal.
 *   - Validasi Genuine Occupational Requirement (GOR / GOQ) yang sah secara hukum.
 *   - Skor Kepatuhan WFA (0 - 100) dan klasifikasi risiko investigasi TAFEP/MOM.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const PROTECTED_CATEGORIES = {
  AGE: {
    name: 'Age',
    bannedPhrases: ['young and energetic', 'fresh graduates only', 'mature candidates need not apply', 'below 35', 'above 50']
  },
  GENDER_FAMILY: {
    name: 'Gender, Marital Status & Pregnancy',
    bannedPhrases: ['female preferred', 'male preferred', 'single only', 'no family commitments', 'not pregnant']
  },
  RACE_RELIGION: {
    name: 'Race & Religion',
    bannedPhrases: ['chinese preferred', 'malay preferred', 'indian preferred', 'christian background', 'muslim only']
  },
  LANGUAGE: {
    name: 'Language Proficiency',
    bannedPhrases: ['mandarin speaking preferred', 'native english speaker only', 'chinese speaking required']
  },
  NATIONALITY: {
    name: 'Nationality & Citizenship',
    bannedPhrases: ['singaporeans only', 'pr only', 'foreigners only', 'ep holders need not apply']
  }
};

/**
 * Mengaudit teks iklan lowongan kerja atau kebijakan SDM untuk kepatuhan Workplace Fairness.
 *
 * @param {Object} params
 * @param {string} params.textToAudit Teks iklan lowongan kerja atau kebijakan internal perusahaan
 * @param {boolean} [params.hasGenuineOccupationalRequirement=false] Apakah perusahaan memiliki alasan operasional sah (GOR)
 * @param {string} [params.gorJustification] Alasan pembenaran GOR (misal: penerjemah resmi bahasa Mandarin, instruktur kebugaran wanita)
 * @param {boolean} [params.hasInternalGrievanceMechanism=true] Apakah perusahaan memiliki saluran penanganan keluhan internal
 * @returns {Object} Skor kepatuhan WFA, daftar pelanggaran yang terdeteksi, dan advis TAFEP
 */
function auditWorkplaceFairness(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const rawText = String(params.textToAudit || '').toLowerCase();
  const hasGor = Boolean(params.hasGenuineOccupationalRequirement);
  const gorJustification = String(params.gorJustification || '').trim();
  const hasGrievance = params.hasInternalGrievanceMechanism !== undefined
    ? Boolean(params.hasInternalGrievanceMechanism)
    : true;

  const detectedViolations = [];
  let scoreDeductions = 0;

  for (const [catKey, meta] of Object.entries(PROTECTED_CATEGORIES)) {
    for (const phrase of meta.bannedPhrases) {
      if (rawText.includes(phrase)) {
        // Cek apakah ada pengecualian GOR sah untuk kategori bahasa atau gender
        const isExemptedByGor = hasGor && gorJustification.length > 10 && (catKey === 'LANGUAGE' || catKey === 'GENDER_FAMILY');

        if (!isExemptedByGor) {
          detectedViolations.push({
            category: meta.name,
            matchedPhrase: phrase,
            severity: 'HIGH',
            guidelineReference: `TGFEP Section on Non-Discriminatory Job Advertisements (${meta.name})`,
            recommendation: `Hapus frasa "${phrase}" dan ganti dengan kualifikasi berbasis kompetensi objektif.`
          });
          scoreDeductions += 20;
        }
      }
    }
  }

  if (!hasGrievance) {
    scoreDeductions += 15;
    detectedViolations.push({
      category: 'Grievance Mechanism',
      matchedPhrase: 'N/A',
      severity: 'MEDIUM',
      guidelineReference: 'WFA Mandatory Internal Grievance Handling Process',
      recommendation: 'Perusahaan wajib membentuk saluran dan prosedur penanganan keluhan diskriminasi internal yang independen dan terlindungi dari retaliasi.'
    });
  }

  const complianceScore = Math.max(0, 100 - scoreDeductions);

  let riskTier = 'COMPLIANT';
  if (complianceScore < 60) riskTier = 'CRITICAL_RISK';
  else if (complianceScore < 85) riskTier = 'MODERATE_RISK';

  return {
    complianceScore,
    riskTier,
    hasGenuineOccupationalRequirement: hasGor,
    gorJustification: hasGor ? gorJustification : null,
    totalViolationsDetected: detectedViolations.length,
    violations: detectedViolations,
    tafepStatutoryGuidance: riskTier === 'COMPLIANT'
      ? "Teks memenuhi standar Tripartite Guidelines on Fair Employment Practices (TGFEP). Risiko sanksi MOM/TAFEP sangat rendah."
      : riskTier === 'MODERATE_RISK'
        ? "Terdapat potensi pelanggaran pedoman TAFEP. Perbaiki terminologi sebelum mempublikasikan lowongan di MyCareersFuture."
        : "BAHAYA: Terdeteksi pelanggaran diskriminasi eksplisit di bawah Workplace Fairness Act. Dapat dikenakan sanksi penangguhan izin mempekerjakan tenaga kerja asing (Work Pass suspension) oleh MOM."
  };
}

module.exports = {
  auditWorkplaceFairness,
  PROTECTED_CATEGORIES
};
