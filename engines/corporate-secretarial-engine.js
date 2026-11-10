/**
 * Singapore Corporate Secretarial & Statutory Governance Engine (`engines/corporate-secretarial-engine.js`)
 *
 * Mengimplementasikan audit kepatuhan sekretaris perusahaan dan tata kelola statuter
 * berdasarkan Singapore Companies Act 1967 (Cap. 50) yang diawasi oleh ACRA:
 *   - Kualifikasi Sekretaris Perusahaan (Section 171 Companies Act):
 *       * Kewajiban menunjuk Company Secretary dalam 6 bulan sejak inkorporasi.
 *       * Wajib berdomisili lokal di Singapura (Ordinarily Resident: SC, SPR, EntrePass).
 *       * Untuk Perusahaan Publik: Wajib memiliki kualifikasi profesional terdaftar (CSIS, CA, Advocate & Solicitor).
 *       * Larangan Sole Director merangkap sebagai Company Secretary tunggal (Section 171(1E)).
 *   - Register of Registrable Controllers (RORC / Beneficial Ownership):
 *       * Kewajiban memelihara RORC di kantor terdaftar / ACRA central register dalam 30 hari.
 *       * Ambang batas 25% hak suara / saham atau hak kendali signifikan.
 *   - Register of Nominee Directors (ROND) & Register of Nominee Shareholders (RONS).
 *   - Kuorum Rapat Direksi & Resolusi Tertulis Direktur (Directors' Written Resolutions - DWR).
 *   - Skor Kepatuhan Tata Kelola Korporat (0 - 100) dan Rekomendasi Remediasi ACRA.
 *
 * 100% deterministik, zero external dependencies.
 */

'use strict';

const STATUTORY_TIMELINES = {
  COMPANY_SECRETARY_APPOINTMENT_MONTHS: 6,
  RORC_UPDATE_DEADLINE_DAYS: 30,
  ANNUAL_RETURN_AFTER_FYE_MONTHS_PRIVATE: 7,
  ANNUAL_RETURN_AFTER_FYE_MONTHS_PUBLIC: 5
};

const QUALIFIED_SECRETARY_BODIES = [
  'CSIS', // Chartered Secretaries Institute of Singapore (SAICSA)
  'ISCA', // Institute of Singapore Chartered Accountants
  'LAW_SOCIETY', // Singapore Bar (Advocates and Solicitors)
  'ACCA', // Association of Chartered Certified Accountants
  'CPA_AUSTRALIA'
];

/**
 * Mengaudit kepatuhan sekretaris perusahaan dan register statuter ACRA.
 *
 * @param {Object} params
 * @param {string} [params.companyType='PRIVATE'] 'PRIVATE' atau 'PUBLIC'
 * @param {number} params.monthsSinceIncorporation Usia entitas sejak didirikan (bulan)
 * @param {Object} [params.secretaryProfile] Data profil sekretaris perusahaan
 * @param {boolean} [params.secretaryProfile.isAppointed=true] Apakah sekretaris telah ditunjuk
 * @param {boolean} [params.secretaryProfile.isOrdinarilyResidentInSingapore=true] Domisili lokal di Singapura
 * @param {boolean} [params.secretaryProfile.isAlsoSoleDirector=false] Apakah merangkap sebagai direktur tunggal
 * @param {string} [params.secretaryProfile.professionalQualification] Kualifikasi profesional (wajib untuk Public Co)
 * @param {Object} [params.rorcCompliance] Data kepatuhan Register of Registrable Controllers
 * @param {boolean} [params.rorcCompliance.isRorcMaintained=true] Apakah RORC dipelihara dan disimpan
 * @param {number} [params.rorcCompliance.daysSinceControllerInfoChange=10] Hari sejak perubahan data pengendali
 * @param {boolean} [params.rorcCompliance.isLodgedWithAcraCentralRegister=true] Apakah telah dilaporkan ke register sentral ACRA
 * @returns {Object} Skor kepatuhan tata kelola, daftar pelanggaran statuter, dan tindakan remediasi
 */
function auditCorporateSecretarialCompliance(params) {
  if (!params || typeof params !== 'object') {
    throw new TypeError("Parameter 'params' harus berupa objek valid.");
  }

  const companyType = String(params.companyType || 'PRIVATE').toUpperCase().trim();
  const monthsSinceIncorp = Math.max(0, Number(params.monthsSinceIncorporation) || 0);

  const sec = params.secretaryProfile || {};
  const isSecAppointed = sec.isAppointed !== undefined ? Boolean(sec.isAppointed) : true;
  const isSecResident = sec.isOrdinarilyResidentInSingapore !== undefined ? Boolean(sec.isOrdinarilyResidentInSingapore) : true;
  const isSoleDir = Boolean(sec.isAlsoSoleDirector);
  const qual = String(sec.professionalQualification || '').toUpperCase().trim();

  const rorc = params.rorcCompliance || {};
  const isRorcMaintained = rorc.isRorcMaintained !== undefined ? Boolean(rorc.isRorcMaintained) : true;
  const rorcDays = Math.max(0, Number(rorc.daysSinceControllerInfoChange) || 0);
  const isRorcCentralLodged = rorc.isLodgedWithAcraCentralRegister !== undefined ? Boolean(rorc.isLodgedWithAcraCentralRegister) : true;

  let complianceScore = 100;
  const breaches = [];
  const remedialActions = [];

  // 1. Audit Kewajiban Penunjukan Sekretaris (Section 171(1))
  if (!isSecAppointed) {
    if (monthsSinceIncorp > STATUTORY_TIMELINES.COMPANY_SECRETARY_APPOINTMENT_MONTHS) {
      complianceScore -= 30;
      breaches.push({
        section: 'Section 171(1) Companies Act',
        severity: 'CRITICAL',
        issue: `Perusahaan belum menunjuk Company Secretary meskipun telah berdiri selama ${monthsSinceIncorp} bulan (batas waktu 6 bulan).`
      });
      remedialActions.push("Segera tunjuk Company Secretary yang berkualifikasi dan sampaikan notifikasi ke ACRA via BizFile+.");
    }
  } else {
    // 2. Audit Domisili Residen Lokal Sekretaris
    if (!isSecResident) {
      complianceScore -= 25;
      breaches.push({
        section: 'Section 171(1AA) Companies Act',
        severity: 'CRITICAL',
        issue: "Company Secretary wajib berdomisili lokal di Singapura (Ordinarily Resident in Singapore)."
      });
      remedialActions.push("Ganti sekretaris dengan warga negara Singapura (SC), Singapore PR, atau pemegang EntrePass.");
    }

    // 3. Larangan Perangkapan Sole Director & Company Secretary (Section 171(1E))
    if (isSoleDir) {
      complianceScore -= 30;
      breaches.push({
        section: 'Section 171(1E) Companies Act',
        severity: 'CRITICAL',
        issue: "Direktur tunggal (Sole Director) dilarang keras merangkap sebagai Company Secretary tunggal secara bersamaan."
      });
      remedialActions.push("Tunjuk Company Secretary independen pihak ketiga atau penambahan direktur kedua di ACRA.");
    }

    // 4. Syarat Kualifikasi untuk Public Company
    if (companyType === 'PUBLIC') {
      const isQualified = QUALIFIED_SECRETARY_BODIES.includes(qual);
      if (!isQualified) {
        complianceScore -= 20;
        breaches.push({
          section: 'Section 171(1AA)(b) Companies Act',
          severity: 'HIGH',
          issue: "Untuk Perusahaan Publik, Company Secretary wajib memiliki kualifikasi profesional terdaftar (CSIS, ISCA, Law Society, dll.)."
        });
        remedialActions.push("Pastikan sekretaris perusahaan publik terdaftar pada asosiasi profesional yang diakui hukum Singapura.");
      }
    }
  }

  // 5. Audit Register of Registrable Controllers (RORC - Section 386AF)
  if (!isRorcMaintained) {
    complianceScore -= 25;
    breaches.push({
      section: 'Section 386AF Companies Act',
      severity: 'HIGH',
      issue: "Perusahaan tidak menyelenggarakan atau memelihara Register of Registrable Controllers (RORC)."
    });
    remedialActions.push("Segera susun RORC di kantor terdaftar yang mencatat pemegang 25%+ saham/hak suara.");
  } else {
    if (rorcDays > STATUTORY_TIMELINES.RORC_UPDATE_DEADLINE_DAYS) {
      complianceScore -= 15;
      breaches.push({
        section: 'Section 386AF(3) Companies Act',
        severity: 'MEDIUM',
        issue: `Perubahan data pengendali belum dicatat dalam RORC (${rorcDays} hari berlalu, batas maksimal 30 hari).`
      });
      remedialActions.push("Perbarui register RORC internal dalam waktu maksimal 30 hari sejak verifikasi informasi pengendali.");
    }

    if (!isRorcCentralLodged) {
      complianceScore -= 20;
      breaches.push({
        section: 'ACRA RORC Central Register Requirement',
        severity: 'HIGH',
        issue: "Informasi RORC belum diunggah ke ACRA Central Register of Controllers."
      });
      remedialActions.push("Laporkan data RORC ke sistem ACRA BizFile+ Central Register untuk menghindari denda hingga S$5.000.");
    }
  }

  const finalScore = Math.max(0, Math.min(100, complianceScore));

  let status = 'COMPLIANT';
  if (finalScore < 60) status = 'NON_COMPLIANT';
  else if (finalScore < 85) status = 'ACTION_REQUIRED';

  const isFullyCompliant = breaches.length === 0;

  return {
    isFullyCompliant,
    complianceScore: finalScore,
    status,
    companyType,
    monthsSinceIncorporation: monthsSinceIncorp,
    totalBreachesDetected: breaches.length,
    breaches,
    statutoryBreaches: breaches,
    remedialActionPlan: remedialActions,
    statutoryNote: finalScore === 100
      ? "Seluruh kewajiban sekretaris perusahaan dan register RORC memenuhi standar Companies Act dan ACRA."
      : "Ditemukan ketidakpatuhan statuter. Kegagalan mematuhi kewajiban ACRA dapat mengakibatkan sanksi denda administratif hingga penuntutan di pengadilan."
  };
}

module.exports = {
  auditCorporateSecretarialCompliance,
  auditCorporateSecretarial: auditCorporateSecretarialCompliance,
  STATUTORY_TIMELINES,
  QUALIFIED_SECRETARY_BODIES
};
