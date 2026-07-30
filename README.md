# 🌌 NightVerse – Platform Sosial & Kreator Digital Modern

Selamat datang di **NightVerse**, sebuah platform ekosistem sosial dan kreator digital yang dirancang untuk memberikan pengalaman interaktif, imersif, dan aman bagi seluruh penggunanya. NightVerse bukan sekadar media sosial biasa, melainkan sebuah ruang komprehensif di mana kreator dapat memamerkan karya mereka, pengguna dapat berinteraksi secara mulus, dan administrator dapat mengelola komunitas dengan alat ukur yang sangat mumpuni.

Aplikasi ini dibangun menggunakan teknologi web terkini (React, TypeScript, Vite, Tailwind CSS) untuk memastikan performa yang cepat, antarmuka yang modern, serta dukungan penuh untuk pengalaman lintas perangkat (desktop dan mobile).

---

## 🎯 Visi & Misi

**NightVerse** bertujuan untuk membangun komunitas digital yang sehat dan terstruktur dengan sistem penghargaan (Badge System) yang transparan, alat moderasi yang canggih (Admin Workspace), dan ruang kreasi tanpa batas (Creator Dashboard). Kami mengedepankan keamanan (Role-Based Access Control) dan kenyamanan pengguna dengan desain *user interface* yang estetis serta fitur-fitur berorientasi komunitas.

---

## ✨ Fitur Utama (Core Features)

### 1. 🎨 Ruang Eksplorasi & Umpan Konten (Explore Feed)
* **Algoritma Pintar:** Menampilkan konten-konten terbaru, terpopuler, dan paling banyak diinteraksi (Views, Likes, Comments).
* **Mode Tampilan Dinamis:** Mendukung tampilan grid (masonry) untuk eksplorasi visual yang memanjakan mata.
* **Content Lightbox:** Pengalaman melihat konten (foto, video, blog) secara fokus dengan teater mode. Dilengkapi dengan kolom komentar real-time, tombol *subscribe/follow*, dan aksi interaktif lainnya.

### 2. 🛡️ Sistem Manajemen Badge (Badge System)
Sistem reputasi dan identitas digital yang mendalam:
* **My Badge Collection:** Halaman profil bagi pengguna untuk melihat koleksi badge yang dimiliki (Unlocked) dan yang belum didapatkan (Locked) beserta persyaratannya.
* **Active Badge Signature:** Pengguna dapat memilih satu **Badge Utama** yang akan terus menempel pada *username* mereka di seluruh platform (Komentar, Feed, Profil, dll).
* **Hierarki Badge:** Mendukung berbagai tingkat eksklusivitas, seperti: *Administrator, Moderator, Verified Creator, Contributor, VIP*, dan *User*. Perubahan badge bersifat *real-time* tanpa perlu memuat ulang halaman.

### 3. 👑 Admin Workspace & Super Admin Tools
Pusat kendali komprehensif khusus untuk pengelola platform, dilindungi dengan *Role-Based Access Control* (RBAC) ketat:
* **Dashboard Analytics:** Metrik pertumbuhan pengguna, aktivitas konten, dan status sistem.
* **User Directory:** Manajemen pengguna lengkap.
* **Badge Management:** Kemampuan bagi Admin/Super Admin untuk memberikan (*Unlock*) atau mencabut badge dari pengguna dengan catatan alasan dan tanggal. Dilengkapi sistem pencarian cerdas.
* **Audit Trail (Activity Log):** Setiap tindakan kritikal (seperti pemberian badge, penghapusan konten, dan banned pengguna) akan dicatat ke dalam log aktivitas sistem yang hanya bisa dibaca oleh admin.
* **Content & Reports Center:** Sistem moderasi konten untuk meninjau laporan dari pengguna, memberi peringatan, hingga menghapus konten yang melanggar panduan komunitas.

### 4. ✍️ Creator Dashboard (Work Creator)
Alat khusus bagi para kreator untuk merancang dan mempublikasikan karya mereka:
* **Single Upload Section:** Pengalaman unggah media yang menyatu, pintar, dan responsif. Mendukung *drag-and-drop* di desktop serta *file picker* ramah sentuhan di mobile.
* **Dukungan Multi-Format:** Mengunggah Blog (Rich text & Thumbnail), Foto berkualitas tinggi, hingga Video.
* **Real-Time Preview:** Indikator unggahan langsung dengan pratinjau visual sebelum dipublikasikan.

### 5. ⚙️ Pengaturan Profil & Privasi (Profile Settings)
* **Customization:** Personalisasi avatar, bio, hingga tautan media sosial.
* **Privacy Control:** Kendali penuh atas siapa yang bisa melihat profil, email, dan daftar pengikut.
* **Tag Analytics & Preferences:** Mengatur minat untuk menyesuaikan umpan beranda.

### 6. 🌗 Tampilan Responsif & Tema Gelap (Dark/Light Mode)
* Dibangun dengan prinsip **Mobile-First namun Desktop-Optimized**.
* Antarmuka yang mulus baik digunakan di layar *smartphone* kecil maupun monitor *ultra-wide*.
* **Night Mode:** Sesuai dengan namanya (NightVerse), platform ini mengusung mode gelap yang elegan, menggunakan palet warna *slate* dan *indigo* untuk kenyamanan mata.

---

## 🛠️ Teknologi yang Digunakan (Tech Stack)

NightVerse mengandalkan ekosistem teknologi modern berbasis JavaScript/TypeScript:
* **Frontend:** React 18, Vite, TypeScript
* **Styling:** Tailwind CSS (dengan plugin interaktif & animasi dari `motion`)
* **State Management & Context:** React Context API untuk manajemen status pengguna (*AppState*).
* **Database (Simulated/Local):** Sistem database klien terintegrasi untuk purwarupa yang mulus (menyimpan data profil, log, konten).
* **Icons:** Lucide React

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

Jika Anda ingin menjalankan atau mengembangkan NightVerse secara lokal, ikuti langkah-langkah berikut:

### Prasyarat:
Pastikan **Node.js** (versi 18 atau lebih baru) telah terinstal di komputer Anda.

### 1. Kloning Repositori & Instalasi
Buka terminal Anda, arahkan ke direktori proyek, dan jalankan perintah:
```bash
# Menginstal seluruh pustaka dan dependensi yang dibutuhkan
npm install
```

### 2. Mode Pengembangan (Development)
Untuk menjalankan peladen lokal dengan fitur *Hot Module Replacement* (HMR):
```bash
npm run dev
```
Aplikasi akan berjalan di lokal pada port yang ditentukan (biasanya `http://localhost:3000`).

### 3. Membangun untuk Produksi (Build)
Jika Anda ingin melakukan kompilasi aplikasi untuk lingkungan produksi (*deployment*):
```bash
npm run build
```
Perintah ini akan membuat folder `dist/` yang berisi aset statis yang telah dioptimalkan (minified) serta kode server.

### 4. Mode Produksi (Start)
Untuk menjalankan aplikasi hasil *build*:
```bash
npm run start
```

---

## 🔒 Struktur Akses Pengguna (RBAC)

NightVerse membedakan pengguna berdasarkan hak akses berikut:
1. **Super Administrator (`SUPER_ADMIN`):** Memiliki akses absolut ke semua sistem, termasuk mengubah peran Administrator lain dan mengakses *Super Admin Tools*.
2. **Administrator (`ADMIN`):** Mengelola operasional harian, moderasi, laporan, dan pengelolaan *badge* untuk pengguna reguler, namun tidak dapat mengubah sistem super-admin.
3. **Moderator (`MODERATOR`):** Membantu meninjau konten, laporan pengguna, dan menjaga keamanan komunitas.
4. **Verified Creator & Contributor (`VERIFIED` / `CONTRIBUTOR`):** Mendapat prioritas eksposur, badge khusus, dan kepercayaan sistem untuk algoritma konten.
5. **User (`USER`):** Pengguna standar yang dapat berinteraksi, menikmati karya, dan memberikan apresiasi.

---

## 🤝 Kontribusi

Aplikasi ini dikembangkan untuk terus berevolusi. Jika Anda bagian dari tim pengembang, pastikan untuk selalu memeriksa komponen modular di dalam direktori `src/components/`, menggunakan tipe data kuat di `src/types.ts`, dan memanfaatkan `AppState.tsx` untuk komunikasi data lintas komponen.

*NightVerse – Jelajahi Malam, Temukan Inspirasi. 🌌*