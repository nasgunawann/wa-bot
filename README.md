# Antigravity WhatsApp Bot (Baileys v7+ & TypeScript)

WhatsApp Bot otomatis untuk obrolan pribadi (DM) dan grup yang dibangun menggunakan **Baileys v7+**, ditulis menggunakan **TypeScript** penuh, dan dijalankan dengan **ESM (ECMAScript Modules)**.

## ✨ Fitur Utama

- **TypeScript Native**: Dilengkapi dengan tipe data yang kuat untuk meningkatkan kehandalan penanganan pesan.
- **Eksekusi Cepat Tanpa Build (`tsx`)**: Menjalankan TypeScript secara langsung tanpa perlu proses compile manual.
- **Otomatisasi DM & Grup**: Bot dapat mendeteksi chat di dalam obrolan pribadi maupun grup secara responsif.
- **Sistem Sesi Mandiri (`useMultiFileAuthState`)**: Session tersimpan otomatis di folder `auth_session`, jadi Anda tidak perlu melakukan scan ulang QR saat bot restart.
- **Auto Read & Auto Reply**: Otomatis membaca pesan masuk dan merespon kata kunci populer (seperti: `halo`, `p`, dll.).
- **Welcome & Goodbye Grup**: Fitur sambutan anggota baru dan salam perpisahan otomatis ketika ada anggota grup yang keluar.
- **Fitur Perintah Lengkap**:
  - `/ping` - Mengukur kecepatan respon bot.
  - `/help` atau `/menu` - Menampilkan daftar menu bantuan interaktif.
  - `/owner` - Menampilkan kontak pemilik bot.
  - `/groupinfo` - Informasi detail tentang grup saat ini.
  - `/tagall` - Tag seluruh anggota grup (Khusus Admin / Owner).
  - `/say <teks>` - Mengulang teks (Khusus Owner).
  - `/broadcast <teks>` - Mengirim siaran pesan (Khusus Owner).

## 🚀 Persyaratan Sistem

- **Node.js** v20.0.0 atau yang lebih baru.
- **pnpm** (direkomendasikan) atau npm/yarn.

## 🛠️ Cara Instalasi & Penggunaan

1. **Instal dependensi**:
   ```bash
   pnpm install
   ```

2. **Konfigurasi Bot**:
   Buka file `config.ts` dan sesuaikan pengaturan seperti owner number, nama bot, prefix, dll.
   ```typescript
   const config: BotConfig = {
       prefix: '/',
       owners: ['6281234567890@s.whatsapp.net'], // Ubah ke nomor WA Anda
       botName: 'Antigravity Bot',
       autoRead: true,
       // ...
   };
   ```

3. **Jalankan Bot**:
   ```bash
   pnpm start
   ```

4. **Hubungkan WhatsApp**:
   Scan kode QR yang muncul di terminal Anda menggunakan aplikasi WhatsApp Anda (*Linked Devices / Perangkat Tertaut*).

## 📝 Catatan Penting Baileys v7 TypeScript & ESM
- **ESM Import Extension**: Dalam runtime TypeScript ESM (diatur oleh `NodeNext` di `tsconfig.json`), impor file lokal wajib menggunakan ekstensi `.js` (contoh: `import config from './config.js'`). Jangan khawatir, ini akan dibaca secara tepat ke file `.ts` oleh compiler/runner.
- **Protobuf Safety**: Menggunakan tipe data `proto.IWebMessageInfo` dari Baileys untuk integrasi parser yang aman dari kesalahan pengetikan data schema.
