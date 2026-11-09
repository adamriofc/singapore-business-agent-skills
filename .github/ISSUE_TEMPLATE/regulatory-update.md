---
name: Singapore Regulatory update / correction
about: Usulkan perubahan regulasi Singapura, tarif pajak (IRAS), batas CPF, aturan MOM, atau tenggat ACRA.
title: "[REGULATORY] <judul singkat perubahan>"
labels: ["regulatory", "provenance"]
assignees: ""
---

<!--
PENTING (no-fiction policy):
1. Semua perubahan angka WAJIB menyertakan minimal 1 tautan sumber resmi pemerintah Singapura (IRAS, CPFB, MOM, ACRA, PDPC) + 1 sumber pembanding resmi / statutory publication.
2. Tautan yang rusak (404/dialihkan) juga diterima dengan bukti status HTTP.
3. Tanpa bukti, issue akan ditandai `needs-evidence` dan tidak diproses.
-->

## 1. Deskripsi Perubahan
Apa yang berubah dan mengapa? (mis. batas upah CPF OW 2026, tarif GST, ambang batas COMPASS EP MOM baru, pembaruan DTA SG-ID)

## 2. Dampak pada Ruleset
- [ ] `engines/rules/tax.json`
- [ ] `engines/rules/cpf.json`
- [ ] `engines/rules/employment.json`
- [ ] `engines/rules/acra.json`
- [ ] `engines/rules/pdpa.json`
- [ ] `engines/rules/finance.json`
- [ ] `engines/rules/enterprise.json`
- [ ] `engines/rules/dta-sg-id.json`
- [ ] Engine JS terkait: _(sebutkan)_
- [ ] `PROVENANCE.md` register

## 3. Bukti Sumber (wajib: minimum 2)
| # | Jenis Sumber | Tautan | Status HTTP (200/404) | Tanggal Cek |
|---|---|---|---|---|
| 1 | Sumber resmi (IRAS / CPFB / MOM / ACRA / PDPC / SSO) | | | |
| 2 | Sumber pembanding (statutory board circular / gazette / e-tax guide) | | | |

## 4. Nilai Baru (bila angka)
| Field | Nilai Lama | Nilai Baru | Efektif Sejak |
|---|---|---|---|
| _contoh: cpfOwCeiling2026_ | _7.400_ | _8.000_ | _2026-01-01_ |

## 5. Link Rusak yang Diganti (bila ada)
| Rule ID | Link Lama (mati) | Pengganti | Status Baru |

## 6. Checklist Sebelum Submit
- [ ] Saya mengecek tautan dengan `curl -A "Mozilla/5.0"` (atau browser untuk situs anti-bot)
- [ ] Angka dikonfirmasi minimal 2 sumber resmi Singapura
- [ ] Saya membaca `SKILL_PROTOCOL.md` dan `PROVENANCE.md`
