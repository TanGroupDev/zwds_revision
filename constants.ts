export const TARGET_COLOR = { r: 69, g: 27, b: 125 }; // #451b7d
export const COLOR_THRESHOLD = 40; // Euclidean Distance
export const MIN_DIMENSION_PERCENT = 0.01; // 1%
export const BACKGROUND_AREA_THRESHOLD = 0.85; // If box > 85% of image, likely background

// Sample chart for quick testing if needed (Placeholder)
export const PLACEHOLDER_IMAGE = "https://picsum.photos/800/800";

// Gemini Configuration
export const GEMINI_MODEL = "gemini-2.5-pro"; // Good for vision tasks

export const REPORT_PROMPT = `
Halo Gemini.

Saya akan mengunggah 13 screenshot istana (palace) ZWDS.

Tugas pertama Anda adalah hanya membuatkan satu "Dokumen Master" (Master Document) yang akurat dari data mentah di gambar-gambar itu.

JANGAN menganalisis dulu. Jangan juga memulai tugas ini sebelum saya selesai mengupload semua 13 gambar yg terdiri dari 12 palace + 1 personal information tentang subject pemilik chart ZWDS ini secara komplit.

Dokumen ini harus mengikuti format yang telah kita gunakan sebelumnya, yang mencakup hal-hal berikut untuk setiap dari 12 istana:
Nama Istana (Palace Name)
Stem/Branch
Active Stars (termasuk identifikasi Natal LQKJ dan Self-Hua, jika ada)
'Sends' (Kirim): Daftar LQKJ yang dikirim dari Stem istana itu.
'Interactions' (Terima): Daftar LQKJ yang diterima oleh bintang-bintang di istana itu.
'Collision Check' (Clash): Daftar semua Hua Ji (Ji) yang mendarat di istana seberang (opposite palace) dan menghantam istana ini.

Tolong pastikan kalkulasi Fei Hua (terbang) ini 100% akurat yg bisa didapatkan dari hitungan data mentah (Stem & Bintang), dan bukan hanya menyalin dari teks yang mungkin sudah ada di gambar atau mengidentifikasi arah panah.

Output dari step pembuatan rangkuman text ZWDS ini tidak boleh mengandung conversation apapun.

Output harus dijabarkan dalam bahasa inggris.

.docx friendly, sehingga mudah untuk dibaca.
`;
