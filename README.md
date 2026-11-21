# Keuanganku

Aplikasi Android gratis untuk mencatat keuangan pribadi: pengeluaran harian, gaji masuk (pokok, lembur, SPPD), dan berapa persen yang tersisa tiap bulan.

## Fitur

- **Catat otomatis dari notifikasi** — pembayaran yang notifikasinya muncul dari Livin' by Mandiri dan GoPay/Gojek langsung tercatat. Aplikasi bank/e-wallet lain bisa dinyalakan di menu *Catat otomatis*.
- **Rekap gaji** — gaji pokok, lembur (dengan jumlah jam), SPPD (tujuan & lama hari), pemasukan lain; masuk vs keluar vs sisa dan persentasenya.
- **Impor data lama** — Excel (.xlsx/.xls), CSV, dan PDF e-statement; kolom dikenali otomatis, transaksi yang sudah ada dilewati.
- **Laporan** — grafik 6/12 bulan, pengeluaran per kategori dan per sumber, anggaran belanja bulanan.
- **Ekspor** — Excel (rekap bulanan, pengeluaran, pemasukan), laporan PDF, serta cadangan .json untuk pindah HP.

## Privasi

- Aplikasi **tidak meminta izin internet**, jadi tidak bisa mengirim data ke mana pun.
- Semua catatan tersimpan di HP. Teks notifikasi hanya dibaca dari aplikasi yang kamu nyalakan.
- Repo ini hanya berisi kode — tidak ada data pengguna.

## Pasang

1. Buka halaman [Releases](../../releases/latest) dan unduh file `Keuanganku-*.apk`.
2. Buka file itu di HP (izinkan "pasang dari sumber ini" bila diminta).
3. Di aplikasi, ketuk **Aktifkan catat otomatis** lalu izinkan *Keuanganku* di pengaturan akses notifikasi.

Untuk catat otomatis, pastikan notifikasi transaksi di Livin' dan GoPay menyala.

## Build

APK dirakit otomatis oleh GitHub Actions setiap ada push ke `main` (`.github/workflows/build.yml`).
Secara lokal: Android SDK + JDK 17, lalu `gradle assembleRelease`.

Struktur:
- `app/src/main/java/.../MainActivity.java` — WebView + jembatan ke Android (simpan file, cetak PDF, pengaturan notifikasi)
- `app/src/main/java/.../NotifService.java`, `Parser.java` — membaca notifikasi pembayaran
- `app/src/main/assets/www/` — tampilan aplikasi (HTML/CSS/JS), dengan SheetJS dan pdf.js untuk impor

Kunci tanda tangan (`keystore/`) sengaja disimpan di repo agar update dari Releases bisa langsung menimpa versi lama. Pasang APK hanya dari repo ini.

Pustaka pihak ketiga: [SheetJS](https://sheetjs.com) (Apache 2.0), [pdf.js](https://mozilla.github.io/pdf.js/) (Apache 2.0), font Inter & Outfit (OFL).
