import { DocumentationCategory, DocumentationArticle, ChangelogRelease } from "../types.js";

export const DEFAULT_DOC_CATEGORIES: DocumentationCategory[] = [
  {
    id: "getting-started",
    name: "Getting Started",
    slug: "getting-started",
    description: "Panduan awal penggunaan platform, navigasi utama, dan pengenalan ekosistem NightVerse.",
    icon: "Compass",
    displayOrder: 1
  },
  {
    id: "account-auth",
    name: "Account & Authentication",
    slug: "account-auth",
    description: "Manajemen akun, pendaftaran, sistem autentikasi, serta hak akses peran (Roles).",
    icon: "UserCheck",
    displayOrder: 2
  },
  {
    id: "profile-settings",
    name: "Profile Settings",
    slug: "profile-settings",
    description: "Pengaturan identitas publik, bio narasi, avatar, banner, dan preferensi akun.",
    icon: "UserCog",
    displayOrder: 3
  },
  {
    id: "creator-directory",
    name: "Creator Directory",
    slug: "creator-directory",
    description: "Eksplorasi direktori kreator, sistem Visitor View publik, dan jejaring relasi Follow.",
    icon: "Users",
    displayOrder: 4
  },
  {
    id: "creator-dashboard",
    name: "Creator Dashboard",
    slug: "creator-dashboard",
    description: "Pusat analitik kreator, pemantauan karya publik, statistik views, dan performa konten.",
    icon: "LayoutDashboard",
    displayOrder: 5
  },
  {
    id: "create-work",
    name: "Create Work",
    slug: "create-work",
    description: "Panduan publikasi karya, auto-detect creative title dari file media, dan tagging.",
    icon: "PlusSquare",
    displayOrder: 6
  },
  {
    id: "photo-management",
    name: "Photo Management",
    slug: "photo-management",
    description: "Ketentuan upload foto, rasio aspek, dan dukungan animasi GIF tanpa kompresi.",
    icon: "Image",
    displayOrder: 7
  },
  {
    id: "video-management",
    name: "Video Management",
    slug: "video-management",
    description: "Pengelolaan video lokal, pemutar video modern, dan multi-video real-time embed.",
    icon: "Video",
    displayOrder: 8
  },
  {
    id: "blog-management",
    name: "Blog Management",
    slug: "blog-management",
    description: "Penulisan artikel blog, format konten, manajemen draf, dan publikasi.",
    icon: "FileText",
    displayOrder: 9
  },
  {
    id: "explore-feed",
    name: "Explore Feed",
    slug: "explore-feed",
    description: "Navigasi feed utama, algoritma kurasi konten, pencarian, dan penyaringan kategori.",
    icon: "Sparkles",
    displayOrder: 10
  },
  {
    id: "content-lightbox",
    name: "Content Lightbox",
    slug: "content-lightbox",
    description: "Tampilan interaktif media layar penuh, komentar real-time, dan pemutar video modern.",
    icon: "Maximize2",
    displayOrder: 11
  },
  {
    id: "tags-directory",
    name: "Tags Directory",
    slug: "tags-directory",
    description: "Sistem taksonomi 5 kategori (Copyright, General, Artist, Character, Metadata) dan penanda ambigu.",
    icon: "Tags",
    displayOrder: 12
  },
  {
    id: "badge-management",
    name: "Badge Management",
    slug: "badge-management",
    description: "Sistem lencana berjenjang (Tier 0-5), kualifikasi pencapaian, dan audit penerbitan badge.",
    icon: "ShieldCheck",
    displayOrder: 13
  },
  {
    id: "leaderboard",
    name: "Leaderboard",
    slug: "leaderboard",
    description: "Peringkat kreator teratas, metrik penilaian skor, podium, dan filter kategori.",
    icon: "Trophy",
    displayOrder: 14
  },
  {
    id: "engagement-visibility",
    name: "Engagement & Visibility",
    slug: "engagement-visibility",
    description: "Interaksi sosial (Like, Favorite, Bookmark, Share), status Public/Private, dan moderasi komentar.",
    icon: "Heart",
    displayOrder: 15
  },
  {
    id: "notifications",
    name: "Notifications",
    slug: "notifications",
    description: "Pusat notifikasi interaktif, pengelompokan pesan sistem, sosial, dan administratif.",
    icon: "Bell",
    displayOrder: 16
  },
  {
    id: "system-settings",
    name: "System Settings",
    slug: "system-settings",
    description: "Konfigurasi global platform, logo aplikasi terpusat, favicon, dan kebijakan persetujuan konten.",
    icon: "Sliders",
    displayOrder: 17
  },
  {
    id: "privacy-security",
    name: "Privacy & Security",
    slug: "privacy-security",
    description: "Pengendalian privasi tingkat atribut (Public/Private), verifikasi akun, dan enkripsi data.",
    icon: "Shield",
    displayOrder: 18
  },
  {
    id: "help-center",
    name: "Help Center & Support",
    slug: "help-center-support",
    description: "Sistem tiket bantuan, laporan teknis, dan pusat layanan pengguna NightVerse.",
    icon: "MessageCircle",
    displayOrder: 19
  },
  {
    id: "updates-changelog",
    name: "Updates & Changelog",
    slug: "updates-changelog",
    description: "Catatan rilis resmi, perkembangan website dari versi awal hingga rilis terbaru.",
    icon: "History",
    displayOrder: 20
  }
];

export const DEFAULT_DOC_ARTICLES: DocumentationArticle[] = [
  {
    id: "doc-getting-started-overview",
    title: "Pengenalan Platform NightVerse",
    slug: "pengenalan-platform-nightverse",
    categoryId: "getting-started",
    summary: "Panduan lengkap mengenai visi, struktur antarmuka, dan fitur-fitur utama di ekosistem NightVerse.",
    content: `NightVerse adalah platform kurasi dan penerbitan karya kreatif multimedia bernuansa cyberpunk dark neon yang menghubungkan para kreator digital di seluruh dunia.

Platform ini memadukan direktori karya visual (Photo & Animated GIF), media bergerak (Video Player & Embed), artikel mendalam (Blog), sistem taksonomi tag 5-kategori, sistem lencana kredensial (Badges Tier 0-5), dan direktori kreator dengan tampilan Visitor View profesional.

### Struktur Navigasi Utama:
1. **Explore Feed**: Beranda utama untuk menelusuri karya publik terkurasi secara visual.
2. **Creator Directory**: Direktori profil seluruh pengguna dan kreator NightVerse beserta peringkat Leaderboard.
3. **Create Work**: Ruang unggah karya mandiri yang dilengkapi fitur auto-detect Creative Title.
4. **Tags Directory**: Ensiklopedia taksonomi tag untuk mengelompokkan karya berdasarkan Hak Cipta, Karakter, Artis, Umum, dan Metadata.
5. **Help Center**: Pusat bantuan dan sistem tiket dukungan terintegrasi.
6. **Profile Settings**: Manajemen informasi profil, lencana, pengaturan privasi granular, dan pusat dokumentasi resmi.`,
    coverImage: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 1,
    steps: [
      {
        stepNumber: 1,
        title: "Eksplorasi Halaman Utama",
        description: "Buka menu Explore Feed untuk melihat konten visual terbaru dari seluruh kreator yang telah disetujui."
      },
      {
        stepNumber: 2,
        title: "Interaksi dengan Kreator",
        description: "Klik kartu profil di Creator Directory untuk melihat Visitor View, mengikuti kreator, atau menyalin tautan profil."
      },
      {
        stepNumber: 3,
        title: "Publikasi Karya Pertama",
        description: "Masuk ke menu Create Work, pilih kategori (Photo, Video, atau Blog), dan unggah aset media Anda."
      }
    ],
    callouts: [
      {
        type: "info",
        title: "Identitas Visual",
        text: "NightVerse dirancang dengan tema gelap cyberpunk interaktif dan performa tinggi berbasis IndexedDB."
      }
    ],
    tags: ["getting-started", "overview", "navigation", "ecosystem"],
    createdAt: "2026-10-10T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-10T00:00:00.000Z"
  },
  {
    id: "doc-account-auth",
    title: "Manajemen Akun & Autentikasi Pengguna",
    slug: "manajemen-akun-autentikasi",
    categoryId: "account-auth",
    summary: "Prosedur pendaftaran akun, login aman, peran akses (Roles), dan pemulihan kata sandi.",
    content: `NightVerse menyediakan sistem autentikasi aman dengan pemisahan peran (*Role-Based Access Control*) yang jelas untuk menjaga integritas platform.

### Peran Pengguna (Roles):
- **SUPER_ADMIN**: Akses penuh ke seluruh parameter sistem, manajemen operator, penganugerahan badge, dan konfigurasi global.
- **ADMIN**: Pengelola direktori akun, moderasi konten, dan taksonomi tag.
- **MODERATOR**: Peninjau laporan pelanggaran dan verifikasi kelayakan konten publik.
- **USER**: Kreator dan penjelajah yang dapat menerbitkan karya, berinteraksi, dan mengumpulkan lencana.`,
    coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 2,
    steps: [
      { stepNumber: 1, title: "Pendaftaran Akun", description: "Klik Sign Up untuk membuat akun baru dengan email dan kata sandi." },
      { stepNumber: 2, title: "Masuk ke Sistem", description: "Gunakan kredensial terdaftar pada halaman login." }
    ],
    callouts: [{ type: "tip", title: "Keamanan Sandi", text: "Gunakan kombinasi sandi yang kuat untuk melindungi karya Anda." }],
    tags: ["auth", "login", "roles", "security"],
    createdAt: "2026-10-10T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-10T00:00:00.000Z"
  },
  {
    id: "doc-profile-settings",
    title: "Pengaturan Profil & Informasi Akun",
    slug: "pengaturan-profil-akun",
    categoryId: "profile-settings",
    summary: "Kustomisasi avatar, banner, bio narasi, minat, tautan media sosial, dan pusat dukungan.",
    content: `Menu **Profile Settings** memungkinkan setiap pengguna mengatur identitas publik mereka secara mendetail. Anda dapat memperbarui foto profil, banner latar belakang, bio, hingga tautan media sosial (Twitter, Instagram, GitHub, YouTube, Discord, TikTok).`,
    coverImage: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 3,
    steps: [
      { stepNumber: 1, title: "Buka Profile Settings", description: "Klik menu Pengaturan Profil pada navigasi samping." },
      { stepNumber: 2, title: "Edit Informasi", description: "Ubah bio, avatar, atau tautan sosial, lalu pratinjau sebelum menyimpan." }
    ],
    callouts: [{ type: "info", title: "Pratinjau Instan", text: "Gunakan fitur Draft Preview untuk melihat tampilan profil Anda sebelum disimpan ke publik." }],
    tags: ["profile", "settings", "avatar", "social"],
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-12T00:00:00.000Z"
  },
  {
    id: "doc-creator-directory",
    title: "Creator Directory & Visitor Profile View",
    slug: "creator-directory-visitor-view",
    categoryId: "creator-directory",
    summary: "Menjelajahi direktori kreator, jejaring pengikut, dan tampilan Visitor View yang bersih dari kontrol privat.",
    content: `**Creator Directory** adalah pusat jejaring untuk menemukan kreator berbakat di NightVerse. Saat Anda mengklik profil seorang kreator, sistem akan menampilkan **Visitor Profile View** murni di mana informasi internal seperti status privasi, tombol edit, atau pengaturan konfigurasi tersembunyi dari pandangan publik.`,
    coverImage: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 4,
    steps: [
      { stepNumber: 1, title: "Buka Creator Directory", description: "Pilih menu direktori dari sidebar." },
      { stepNumber: 2, title: "Pilih Kreator", description: "Klik kartu kreator untuk melihat karya publik dan lencana mereka." }
    ],
    callouts: [{ type: "tip", title: "Visitor View Murni", text: "Visitor View menampilkan karya publik, bio, lencana, dan statistik pengikut secara transparan." }],
    tags: ["directory", "creators", "visitor-view", "network"],
    createdAt: "2026-10-15T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-15T00:00:00.000Z"
  },
  {
    id: "doc-creator-dashboard",
    title: "Creator Dashboard & Unified Upload Node",
    slug: "creator-dashboard-unified-upload",
    categoryId: "creator-dashboard",
    summary: "Memantau performa publikasi karya, statistik tayangan, dan sistem upload tunggal (Laptop/Mobile).",
    content: `Creator Dashboard menyediakan ringkasan analitik komprehensif bagi kreator. Sejak rilis v2.7.0, NightVerse memperkenalkan **Unified Upload Node**, sebuah sistem pemilihan file tunggal yang secara otomatis mendeteksi apakah Anda menggunakan Laptop (Desktop) atau Perangkat Mobile.

### Fitur Unggulan:
- **Unified Video Upload**: Satu area untuk drag-and-drop desktop atau pemilihan galeri mobile.
- **Display Frame Protocol**: Tiga metode thumbnail; Upload Image, Capture Frame (mengambil gambar dari video), atau Online URL.
- **Alphabetical Tags**: Pengurutan tag A-Z secara otomatis pada registry pribadi.`,
    coverImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 5,
    steps: [
      { stepNumber: 1, title: "Akses Dashboard", description: "Buka Creator Dashboard dari menu utama." },
      { stepNumber: 2, title: "Gunakan Upload Media", description: "Gunakan tombol Upload tunggal untuk video atau foto tanpa perlu memilih jenis perangkat." }
    ],
    callouts: [{ type: "info", title: "Smart Ingest", text: "Sistem secara otomatis menyesuaikan alur pemrosesan berdasarkan format file yang diunggah." }],
    tags: ["dashboard", "upload", "unified", "creators"],
    createdAt: "2026-10-16T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-16T00:00:00.000Z"
  },
  {
    id: "doc-create-work",
    title: "Create Work & Auto-Detect Creative Title",
    slug: "create-work-auto-title",
    categoryId: "create-work",
    summary: "Panduan publikasi karya blog, foto, dan video dengan fitur otomatisasi judul dari nama file media.",
    content: `Fitur **Create Work** memudahkan kreator mempublikasikan karya baru. Dilengkapi dengan **Auto-Detect Creative Title**, sistem secara otomatis membaca nama file asli yang diunggah, menghapus ekstensi file, dan mengisikannya ke kolom judul secara instan.`,
    coverImage: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 6,
    steps: [
      { stepNumber: 1, title: "Buka Create Work", description: "Pilih menu publikasi karya baru." },
      { stepNumber: 2, title: "Unggah Media", description: "Pilih file gambar, video, atau buat artikel blog. Judul akan terisi otomatis." }
    ],
    callouts: [{ type: "tip", title: "Efisiensi Upload", text: "Anda tetap dapat menyesuaikan judul otomatis sesuai kebutuhan sebelum menekan tombol publikasi." }],
    tags: ["create-work", "upload", "auto-title", "media"],
    createdAt: "2026-10-18T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-18T00:00:00.000Z"
  },
  {
    id: "doc-photo-management",
    title: "Photo Management & Animasi GIF Tanpa Kompresi",
    slug: "photo-management-gif-support",
    categoryId: "photo-management",
    summary: "Ketentuan unggah foto dan dukungan penuh animasi GIF bergerak tanpa kehilangan frame asli.",
    content: `Photo Management NightVerse mendukung berbagai format gambar termasuk **GIF Animasi**. Sistem mendeteksi format GIF secara otomatis dan mempertahankan seluruh frame, durasi animasi, serta looping asli tanpa konversi ke format statis.`,
    coverImage: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 7,
    steps: [
      { stepNumber: 1, title: "Pilih Foto / GIF", description: "Unggah file gambar atau animasi GIF melalui Create Work." },
      { stepNumber: 2, title: "Pratinjau Animasi", description: "Pastikan animasi GIF bergerak lancar pada pratinjau sebelum disimpan." }
    ],
    callouts: [{ type: "info", title: "Zero-Loss GIF", text: "Kompresi tidak akan merusak frame animasi GIF asli Anda." }],
    tags: ["photos", "gif", "animation", "images"],
    createdAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-20T00:00:00.000Z"
  },
  {
    id: "doc-video-management",
    title: "Video Management & Real-Time Quality Switching (H.264/AVC)",
    slug: "video-management-real-quality",
    categoryId: "video-management",
    summary: "Sistem pergantian resolusi video real-time, encoding H.264/AVC, timestamp continuity, dan Stats for Nerds HUD.",
    content: `NightVerse v2.7.0 mengimplementasikan **Real-Time Video Quality Switching Engine**. Setiap resolusi video memiliki file rendition tersendiri hasil transcoding H.264/AVC yang langsung dialihkan saat dipilih penonton tanpa me-refresh halaman atau mengulang pemutaran dari detik 0.

### Fitur Kunci:
- **Real-Time Rendition Switching**: Beralih langsung ke file rendition target (1080p, 720p, 480p, 360p, 240p, 144p).
- **Seamless Timestamp Continuity**: Posisi pemutaran (timestamp detik) tetap dilanjutkan secara presisi dari titik terakhir.
- **State Preservation**: Status Play/Pause, volume, status mute, dan kecepatan pemutaran (playback speed) dipertahankan utuh.
- **Strict Rendition Availability**: Pilihan resolusi hanya diaktifkan apabila file rendition tersebut benar-benar tersedia dan tidak melebihi resolusi sumber.
- **Stats for Nerds / Telemetry HUD**: Menampilkan live decoded dimensions, viewport resolution, stream bitrate, codec H.264 High Profile, dan buffer health.`,
    coverImage: "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 8,
    steps: [
      { stepNumber: 1, title: "Pilih Resolusi", description: "Buka menu Pengaturan ➔ Kualitas Video dan pilih resolusi yang diinginkan." },
      { stepNumber: 2, title: "Pantau Transisi", description: "Indikator loading halus akan tampil sesaat selagi player menyelaraskan timestamp ke rendition baru." },
      { stepNumber: 3, title: "Periksa Stats for Nerds", description: "Aktifkan toggle 'Stats for Nerds' untuk memverifikasi dimensi render aktual dan bitrate stream." }
    ],
    callouts: [
      { type: "tip", title: "H.264 High Profile", text: "Semua rendition dikodekan menggunakan profil H.264 High Profile dengan faststart atom untuk pemutaran instan." },
      { type: "info", title: "Tanpa Upscaling Palsu", text: "Resolusi yang melebihi resolusi sumber video asli secara otomatis disaring keluar demi integritas visual." }
    ],
    tags: ["videos", "h264", "quality-switching", "transcoding", "telemetry"],
    createdAt: "2026-10-22T00:00:00.000Z",
    updatedAt: "2026-11-07T11:20:00.000Z",
    publishedAt: "2026-10-22T00:00:00.000Z"
  },
  {
    id: "doc-blog-management",
    title: "Blog Management & Artikel Kreatif",
    slug: "blog-management-articles",
    categoryId: "blog-management",
    summary: "Panduan penulisan artikel mendalam, manajemen draf, dan publikasi karya tulis kreatif.",
    content: `Blog Management memungkinkan kreator menerbitkan artikel, ulasan karya, atau tutorial mendalam yang dilengkapi dengan penanda tag taksonomi dan thumbnail sampul menarik.`,
    coverImage: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 9,
    steps: [
      { stepNumber: 1, title: "Tulis Artikel", description: "Masukkan judul dan isi teks artikel pada menu Create Work." },
      { stepNumber: 2, title: "Publikasikan", description: "Kirim artikel untuk ditinjau atau dipublikasikan langsung ke publik." }
    ],
    callouts: [{ type: "info", title: "Cover Thumbnail", text: "Tambahkan thumbnail sampul agar artikel Anda lebih menarik di Explore Feed." }],
    tags: ["blogs", "articles", "writing", "publishing"],
    createdAt: "2026-10-23T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-23T00:00:00.000Z"
  },
  {
    id: "doc-explore-feed",
    title: "Explore Feed & Kurasi Konten",
    slug: "explore-feed-curation",
    categoryId: "explore-feed",
    summary: "Menelusuri beranda utama dengan filter multi-media, pencarian tag instan, dan animasi GIF bergerak.",
    content: `Explore Feed adalah pusat kurasi karya visual NightVerse. Pengguna dapat menyaring konten berdasarkan kategori media (All, Photos, Videos, Blogs) serta melakukan pencarian taksonomi tag secara instan.`,
    coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 10,
    steps: [
      { stepNumber: 1, title: "Buka Explore Feed", description: "Nikmati aliran karya visual terkurasi di beranda." },
      { stepNumber: 2, title: "Gunakan Filter", description: "Pilih tab media untuk memfilter foto, video, atau artikel." }
    ],
    callouts: [{ type: "tip", title: "GIF Bergerak Otomatis", text: "Seluruh animasi GIF pada feed diputar secara otomatis dan real-time." }],
    tags: ["explore", "feed", "curation", "media"],
    createdAt: "2026-10-24T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-24T00:00:00.000Z"
  },
  {
    id: "doc-content-lightbox",
    title: "Content Lightbox & Interaksi Layar Penuh",
    slug: "content-lightbox-interaction",
    categoryId: "content-lightbox",
    summary: "Pratinjau media layar penuh, diskusi komentar real-time, dan penyematan tag interaktif.",
    content: `Content Lightbox menyajikan karya dalam mode fokus layar penuh. Pengguna dapat melihat detail lengkap karya, berinteraksi melalui tombol Like, memberikan komentar real-time, serta mengeklik tag untuk menjelajahi karya sejenis.`,
    coverImage: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 11,
    steps: [
      { stepNumber: 1, title: "Buka Lightbox", description: "Klik salah satu kartu karya di Explore Feed." },
      { stepNumber: 2, title: "Berikan Komentar", description: "Tulis tanggapan atau berikan Like pada panel interaksi." }
    ],
    callouts: [{ type: "info", title: "Fokus Imersif", text: "Lightbox dirancang untuk memberikan pengalaman menikmati karya seni digital secara maksimal." }],
    tags: ["lightbox", "comments", "fullscreen", "interaction"],
    createdAt: "2026-10-24T12:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-24T12:00:00.000Z"
  },
  {
    id: "doc-tags-directory-taxonomy",
    title: "Sistem Taksonomi 5-Kategori & Alphabetical Sorting",
    slug: "sistem-taksonomi-5-kategori-sorting",
    categoryId: "tags-directory",
    summary: "Struktur klasifikasi tag NightVerse dan pengurutan otomatis A-Z untuk konsistensi direktori.",
    content: `Tags Directory adalah tulang punggung pengorganisasian metadata konten di NightVerse. Sejak rilis v2.7.0, seluruh tag secara otomatis diurutkan secara **Alphabetical (A-Z)** tanpa membedakan huruf besar/kecil.

### Lima Kategori Tag Utama:
1. **Copyright**: Nama karya cipta, franchise, judul anime, game, manga.
2. **General**: Atribut visual, pakaian, latar belakang, pose, atau objek.
3. **Artist**: Nama kreator atau ilustrator pembuat karya asli.
4. **Character**: Nama tokoh atau karakter spesifik.
5. **Metadata**: Informasi teknis terkait media (e.g. 4k, wallpaper).`,
    coverImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 12,
    steps: [
      { stepNumber: 1, title: "Buka Tags Directory", description: "Akses menu dari bilah navigasi." },
      { stepNumber: 2, title: "Cari Tag", description: "Gunakan filter pencarian; daftar akan selalu terurut secara abjad." }
    ],
    callouts: [{ type: "tip", title: "A-Z Consistency", text: "Pengurutan abjad memudahkan penemuan tag yang sudah ada dan mencegah duplikasi." }],
    tags: ["tags", "taxonomy", "sorting", "alphabetical"],
    createdAt: "2026-10-25T11:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-25T11:00:00.000Z"
  },
  {
    id: "doc-badges-system-tiers",
    title: "Sistem Lencana Kredensial Berjenjang (Tier 0-5)",
    slug: "sistem-lencana-kredensial-berjenjang",
    categoryId: "badge-management",
    summary: "Struktur lencana kehormatan NightVerse dari Tier 0 (Member) hingga Tier 5 (Super Admin).",
    content: `Sistem Badges NightVerse dirancang untuk menghargai kontribusi, pencapaian, dan otoritas tata kelola komunitas melalui lencana berjenjang dari Tier 0 hingga Tier 5.`,
    coverImage: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 13,
    steps: [
      { stepNumber: 1, title: "Cek My Badge Center", description: "Buka profil untuk melihat lencana yang telah dibuka." }
    ],
    callouts: [{ type: "info", title: "Otoritas Tier", text: "Setiap penganugerahan lencana dicatat dalam System Audit Log." }],
    tags: ["badges", "tiers", "achievements"],
    createdAt: "2026-10-30T14:30:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-30T14:30:00.000Z"
  },
  {
    id: "doc-leaderboard",
    title: "Creator Leaderboard & Peringkat Komunitas",
    slug: "creator-leaderboard-peringkat",
    categoryId: "leaderboard",
    summary: "Sistem peringkat kreator teratas berdasarkan metrik skor karya, views, dan keterlibatan.",
    content: `Creator Leaderboard menampilkan kreator paling berpengaruh di platform berdasarkan jumlah publikasi, apresiasi publik (*likes*), dan keterlibatan pengikut.`,
    coverImage: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 14,
    steps: [
      { stepNumber: 1, title: "Buka Leaderboard", description: "Akses peringkat kreator dari menu Creator Directory." }
    ],
    callouts: [{ type: "tip", title: "Podium 3 Besar", text: "Kreator teratas menduduki podium khusus dengan lencana kehormatan." }],
    tags: ["leaderboard", "ranking", "creators", "score"],
    createdAt: "2026-10-31T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-10-31T00:00:00.000Z"
  },
  {
    id: "doc-engagement-visibility",
    title: "Engagement & Visibility (Public / Private Controls)",
    slug: "engagement-visibility-controls",
    categoryId: "engagement-visibility",
    summary: "Pengendalian visibilitas karya (Public/Private), pengaturan komentar (Open/Muted), dan sinyal sosial.",
    content: `Setiap kreator memiliki kendali penuh atas visibilitas karya mereka. Karya dapat diatur berstatus **Public** (tampil di Explore Feed untuk umum) atau **Private** (hanya dapat dilihat oleh pemilik akun).`,
    coverImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 15,
    steps: [
      { stepNumber: 1, title: "Atur Visibilitas", description: "Pilih status Public atau Private saat mengunggah atau menyunting karya." }
    ],
    callouts: [{ type: "info", title: "Kontrol Penuh", text: "Privasi karya Anda dijamin aman sesuai preferensi akun." }],
    tags: ["visibility", "engagement", "privacy", "social"],
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-11-01T00:00:00.000Z"
  },
  {
    id: "doc-notifications",
    title: "Notification Center & Pemberitahuan Real-Time",
    slug: "notification-center-realtime",
    categoryId: "notifications",
    summary: "Pusat pemberitahuan interaktif untuk aktivitas sosial, status moderasi karya, dan pengumuman sistem.",
    content: `Notification Center memberikan informasi instan mengenai aktivitas akun Anda, termasuk ketika pengguna lain mengikuti Anda, memberikan *like*, berkomentar, atau status persetujuan karya dari moderator.`,
    coverImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 16,
    steps: [
      { stepNumber: 1, title: "Buka Notifikasi", description: "Klik ikon lonceng pada bilah navigasi untuk melihat daftar aktivitas terbaru." }
    ],
    callouts: [{ type: "tip", title: "Pembaruan Instan", text: "Pemberitahuan muncul secara real-time tanpa perlu memuat ulang halaman." }],
    tags: ["notifications", "alerts", "realtime", "activity"],
    createdAt: "2026-11-02T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-11-02T00:00:00.000Z"
  },
  {
    id: "doc-system-settings-synchronization",
    title: "System Settings & Global Media Policy",
    slug: "system-settings-global-policy",
    categoryId: "system-settings",
    summary: "Pengelolaan identitas visual, favicon, kebijakan persetujuan otomatis, dan kontrol blur global.",
    content: `Melalui **System Settings**, Super Administrator dapat mengelola identitas global NightVerse. 

### Fitur Pengaturan:
- **Media Approval Policy**: Atur apakah Photo, Video, atau Blog memerlukan persetujuan manual ADMIN atau dipublikasikan secara otomatis.
- **Creator Masterpieces Blur**: Aktifkan efek blur global pada kartu karya di seluruh profil kreator.
- **Unified Logo & Favicon**: Update branding website dari satu panel pusat.`,
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 17,
    steps: [
      { stepNumber: 1, title: "Buka System Settings", description: "Akses menu pengaturan sistem di Admin Workspace." },
      { stepNumber: 2, title: "Konfigurasi Policy", description: "Ubah kebijakan moderasi atau efek blur sesuai kebutuhan platform." }
    ],
    callouts: [{ type: "tip", title: "Real-time Sync", text: "Perubahan pengaturan langsung diterapkan secara global tanpa refresh." }],
    tags: ["system-settings", "policy", "blur", "admin"],
    createdAt: "2026-11-03T16:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-11-03T16:00:00.000Z"
  },
  {
    id: "doc-privacy-security",
    title: "Privacy & Security (Audit Logs & Keamanan Data)",
    slug: "privacy-security-audit-logs",
    categoryId: "privacy-security",
    summary: "Pengendalian keamanan data, audit log aktivitas operator, dan enkripsi penyimpanan.",
    content: `NightVerse memprioritaskan keamanan data dan privasi pengguna. Seluruh aksi administratif dan moderasi tercatat secara transparan di dalam *Audit Center* untuk memastikan akuntabilitas platform.`,
    coverImage: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 18,
    steps: [
      { stepNumber: 1, title: "Akses Audit Center", description: "Super Admin dapat meninjau log aktivitas sistem melalui menu Audit Center." }
    ],
    callouts: [{ type: "info", title: "Transparansi Penuh", text: "Setiap perubahan penting dilacak dengan cap waktu dan nama operator." }],
    tags: ["security", "audit", "privacy", "logs"],
    createdAt: "2026-11-04T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-11-04T00:00:00.000Z"
  },
  {
    id: "doc-help-center-tickets",
    title: "Help Center & Support Ticket System",
    slug: "help-center-support-tickets",
    categoryId: "help-center",
    summary: "Panduan pengiriman tiket bantuan, pelacakan status dukungan, dan komunikasi dengan tim NightVerse.",
    content: `Sistem **Support Ticket** di NightVerse v2.7.0 memungkinkan pengguna melaporkan masalah teknis, bug, atau pertanyaan terkait akun secara langsung ke tim administrasi.

### Cara Kerja Tiket:
- **Subjek & Kategori**: Pilih kategori yang sesuai (Account, Bug Report, Payment, dll).
- **Prioritas**: Tentukan tingkat urgensi (Low, Medium, High, Urgent).
- **Lampiran**: Sertakan gambar atau file pendukung untuk memperjelas masalah.
- **Status Tiket**: Pantau status dari Open, In Progress, Waiting for User, hingga Resolved.`,
    coverImage: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 19,
    steps: [
      { stepNumber: 1, title: "Buka Help Center", description: "Pilih menu Help Center pada navigasi atau Profile Settings." },
      { stepNumber: 2, title: "Contact Support", description: "Isi formulir tiket dan tekan Submit Ticket." },
      { stepNumber: 3, title: "Pantau Tiket", description: "Cek riwayat tiket Anda untuk melihat balasan dari tim admin." }
    ],
    callouts: [{ type: "info", title: "Unique Ticket ID", text: "Setiap tiket memiliki ID unik untuk pelacakan yang akurat." }],
    tags: ["help-center", "support", "tickets", "contact"],
    createdAt: "2026-11-06T05:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-11-06T05:00:00.000Z"
  },
  {
    id: "doc-updates-changelog",
    title: "Updates & Changelog (Riwayat Perkembangan Platform)",
    slug: "updates-changelog-riwayat",
    categoryId: "updates-changelog",
    summary: "Catatan rilis resmi dari versi v1.0.0 hingga rilis terbaru v2.7.0.",
    content: `Halaman ini mencatat seluruh pembaruan, peningkatan fitur, dan perbaikan bug yang telah dirilis oleh tim engineering NightVerse dari masa ke masa.`,
    coverImage: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80",
    status: "PUBLISHED",
    version: "v2.7.0",
    authorId: "superadmin",
    authorName: "NightVerse Core Ops",
    authorRole: "SUPER_ADMIN",
    displayOrder: 20,
    steps: [
      { stepNumber: 1, title: "Tinjau Changelog", description: "Buka dokumentasi Changelog untuk melihat detail fitur pada setiap versi." }
    ],
    callouts: [{ type: "tip", title: "Selalu Update", text: "Platform terus dikembangkan untuk menghadirkan pengalaman terbaik." }],
    tags: ["changelog", "updates", "releases", "version"],
    createdAt: "2026-11-05T00:00:00.000Z",
    updatedAt: "2026-11-06T05:00:00.000Z",
    publishedAt: "2026-11-05T00:00:00.000Z"
  }
];

export const DEFAULT_CHANGELOGS: ChangelogRelease[] = [
  {
    id: "cl-v270",
    versionNumber: "v2.7.0",
    releaseTitle: "Support Ticket System & High-Fidelity Video Engine",
    releaseDate: "2026-11-06",
    summary: "Pembaruan besar skala sistem dengan integrasi Support Ticket System, Real Video Quality (H.264/AVC), dan Unified Creator Dashboard.",
    newFeatures: [
      "Support Ticket System: Pengguna kini dapat mengirimkan tiket bantuan (Account, Tech, Bug, dll) melalui Help Center.",
      "Ticket Center Admin Submenu: Panel khusus di Admin Workspace untuk mengelola tiket dukungan dengan pelacakan status Open ➔ Resolved.",
      "High-Fidelity Video Engine: Dukungan encoding H.264/AVC nyata dengan rendition multi-kualitas (144p hingga 1080p).",
      "Unified Media Upload: Satu node upload tunggal untuk laptop dan mobile dengan deteksi perangkat otomatis.",
      "Display Frame Protocol: Tiga metode penentuan thumbnail (Upload Image, Capture Frame from Video, Online URL).",
      "Alphabetical Tags Registry: Seluruh tag kini otomatis terurut A-Z secara case-insensitive platform-wide."
    ],
    improvements: [
      "Real-Time Rendition Switching: Player langsung beralih ke file rendition target (1080p, 720p, 480p, 360p, 240p, 144p) tanpa restart atau memuat ulang halaman.",
      "Timestamp Continuity: Posisi detik pemutaran, status play/pause, volume, mute, dan speed dipertahankan secara mulus saat berganti resolusi.",
      "Stats for Nerds HUD: Menampilkan live decoded dimensions, bitrate, codec AVC, buffer health, dan active rendition URL.",
      "Update dokumentasi resmi ke versi v2.7.0 untuk seluruh 20 kategori sistem.",
      "Pemisahan buffer state untuk thumbnail foto dan video guna mencegah tumpang tindih data.",
      "Integrasi About Application dengan status versi dokumentasi terbaru."
    ],
    bugFixes: [
      "Memperbaiki bug di mana player memutar URL file HD yang sama ketika resolusi rendah (720p/480p/360p) dipilih.",
      "Memperbaiki bug reset currentTime ke detik 0 saat mengganti sumber video di HTML5 player.",
      "Memperbaiki masalah kompresi thumbnail yang menyebabkan hilangnya frame pada animasi GIF.",
      "Mengatasi bug z-index pada tag autocomplete dropdown di dashboard."
    ],
    breakingChanges: [
      "SourceType 'LAPTOP' dan 'MOBILE' kini dikonsolidasikan ke dalam 'UPLOAD' untuk kompatibilitas dashboard baru."
    ],
    createdBy: "Super Admin (NightVerse Core)",
    createdAt: "2026-11-06T05:00:00.000Z"
  },
  {
    id: "cl-v260",
    versionNumber: "v2.6.0",
    releaseTitle: "Creator Masterpieces Blur Effect & Global System Controls",
    releaseDate: "2026-11-06",
    summary: "Peluncuran fitur pengontrol global Creator Masterpieces Blur Effect di System Settings untuk memberikan efek blur pada media visual di profil kreator.",
    newFeatures: [
      "Creator Masterpieces Blur Effect: Pengaturan global di System Settings untuk mengaktifkan atau menonaktifkan efek blur pada thumbnail foto, video, dan sampul blog di kartu karya kreator.",
      "Sinkronisasi real-time instan tanpa memerlukan muat ulang halaman."
    ],
    improvements: [
      "Penyempurnaan kelengkapan artikel dokumentasi resmi untuk seluruh 19 kategori sistem NightVerse.",
      "Optimalisasi pemfilteran media visual pada profil kreator."
    ],
    bugFixes: [
      "Memperbaiki penanganan state pengaturan global pada database layer."
    ],
    breakingChanges: [],
    createdBy: "Super Admin (NightVerse Core)",
    createdAt: "2026-11-06T02:37:00.000Z"
  },
  {
    id: "cl-v250",
    versionNumber: "v2.5.0",
    releaseTitle: "Instant Tags Taxonomy Migration & Live Category Preview Engine",
    releaseDate: "2026-11-06",
    summary: "Pembaruan arsitektur sinkronisasi taksonomi Tags Directory dengan pemindahan kategori instan, counter dinamis real-time, Live Category Preview pada modal edit, dan desain modal yang compact & scrollable.",
    newFeatures: [
      "Instant Category Type Update: Tag langsung berpindah ke kategori baru seketika setelah disimpan tanpa perlu membuka submenu lain atau menekan tombol Sort.",
      "Realtime Category Counter Engine: Angka total tag dan jumlah tiap kategori (Copyright, General, Artist, Character, Metadata, Pending, All) langsung sinkron dalam satu siklus render.",
      "Live Category Preview pada modal Add / Edit Tag: Pratinjau langsung pill tag, badge kategori tujuan, dan indikator alur perpindahan ([Kategori Asal] ➔ [Kategori Sasaran]) sebelum disimpan.",
      "Compact & Scrollable Tag Configuration Modal: Desain modal proporsional dengan max-h-[85vh] dan overflow-y-auto untuk kenyamanan di seluruh resolusi layar."
    ],
    improvements: [
      "Immutabilitas data pada DB layer (db.tags.getAll, db.tags.update) untuk mencegah retensi referensi array di memory cache.",
      "Mekanisme rollback otomatis jika terjadi kegagalan penyimpanan ke database lokal.",
      "Integrasi event-driven listener nightverse_tags_updated pada Admin Workspace."
    ],
    bugFixes: [
      "Memperbaiki bug kategori lama yang masih tertinggal setelah Admin mengubah kategori tag dan menekan Save Changes.",
      "Mengatasi modal konfigurasi tag yang terlalu panjang dan terpotong di layar perangkat kecil."
    ],
    breakingChanges: [],
    createdBy: "Super Admin (NightVerse Core)",
    createdAt: "2026-11-06T02:15:00.000Z"
  },
  {
    id: "cl-v240",
    versionNumber: "v2.4.0",
    releaseTitle: "Documentation Center & Knowledge Architecture",
    releaseDate: "2026-11-06",
    summary: "Peluncuran resmi Documentation Center NightVerse, Documentation Management di Admin Workspace, dan pelacakan versi riwayat revisi.",
    newFeatures: [
      "Pusat Dokumentasi Resmi (Documentation Center) dengan 19 kategori sistem NightVerse.",
      "Menu Documentation Management di Admin Workspace untuk Super Admin dan Admin.",
      "Rich Documentation Editor dengan dukungan heading, gambar, callout, langkah tutorial, dan tabel.",
      "Sistem pelacakan riwayat revisi (Documentation Versioning) dan fitur restorasi versi.",
      "Pencarian dokumentasi cepat dengan filter kategori dan pengurutan artikel."
    ],
    improvements: [
      "Struktur menu Informasi & Dukungan menjadi 4 submenu terorganisir: Help Center, Documentation, FAQ, dan About Application.",
      "Integrasi navigasi breadcrumb dan Table of Contents dinamis untuk membaca artikel panjang.",
      "Dukungan tampilan dokumentasi responsif penuh pada desktop, tablet, dan smartphone."
    ],
    bugFixes: [
      "Memperbaiki sinkronisasi realtime pada pratinjau draf dokumentasi sebelum diterbitkan.",
      "Mencegah konflik slug pada artikel dokumentasi berstatus draf."
    ],
    breakingChanges: [],
    createdBy: "Super Admin (NightVerse Core)",
    createdAt: "2026-11-06T01:00:00.000Z"
  },
  {
    id: "cl-v230",
    versionNumber: "v2.3.0",
    releaseTitle: "Advanced Video Player & Clean Visitor View",
    releaseDate: "2026-11-06",
    summary: "Redesign pemutar video modern dengan Non-Autoplay default serta penerapan arsitektur Visitor View pada Creator Directory.",
    newFeatures: [
      "Modern Video Player dengan kebijakan Non-Autoplay ketat dan tombol Play pusat berukuran besar.",
      "Bilah kontrol video lengkap: Play/Pause, Skip -10s, Skip +10s, progress scrubber, volume, PiP, dan Fullscreen.",
      "Menu popover pengaturan video dengan pilihan kecepatan pemutaran (0.5x - 2.0x) dan deteksi kualitas resolusi asli.",
      "Arsitektur Visitor Profile View murni pada Creator Directory tanpa label konfigurasi privasi internal."
    ],
    improvements: [
      "Penyembunyian bersih pada data privat (telepon/email) tanpa menyisakan ruang kosong atau placeholder.",
      "Pemisahan tegas antara Visitor View direktori dan Owner View di Profile Settings."
    ],
    bugFixes: [
      "Memperbaiki bug autoplay video pada Content Lightbox di perangkat mobile.",
      "Memperbaiki penanganan callback onClose pada modal konfirmasi penghapusan tag."
    ],
    breakingChanges: [],
    createdBy: "Super Admin (NightVerse Core)",
    createdAt: "2026-11-06T00:00:00.000Z"
  },
  {
    id: "cl-v220",
    versionNumber: "v2.2.0",
    releaseTitle: "Zero-Loss Animated GIF Support & Auto-Detect Title",
    releaseDate: "2026-11-05",
    summary: "Dukungan penuh animasi GIF tanpa kehilangan frame dan fitur pendeteksi judul otomatis dari nama file media.",
    newFeatures: [
      "Fitur Auto-Detect Creative Title yang membaca nama file asli media yang diunggah dari laptop maupun HP.",
      "Dukungan animasi GIF asli tanpa kompresi kanvas statis (Direct Frame Bypass) pada Create Work dan Explore Feed.",
      "Sinkronisasi logo aplikasi terpusat antara System Settings dan About Application."
    ],
    improvements: [
      "Pembersihan otomatis ekstensi file (.jpg, .png, .mp4, .webp, .gif) pada input Creative Title.",
      "Optimalisasi kinerja rendering feed saat memutar beberapa animasi GIF secara simultan."
    ],
    bugFixes: [
      "Mengatasi masalah animasi GIF yang macet atau berubah menjadi gambar diam di feed.",
      "Memperbaiki hilangnya frame animasi GIF saat proses kompresi foto."
    ],
    breakingChanges: [],
    createdBy: "NightVerse Engineering",
    createdAt: "2026-11-05T08:00:00.000Z"
  },
  {
    id: "cl-v210",
    versionNumber: "v2.1.0",
    releaseTitle: "Dynamic Badges Engine & Creator Leaderboard",
    releaseDate: "2026-10-30",
    summary: "Sistem lencana kredensial 6 tingkatan (Tier 0-5), penganugerahan real-time, dan leaderboard kreator teratas.",
    newFeatures: [
      "Sistem lencana berjenjang (Role Badges, Community Badges, Achievement Badges).",
      "Alat Super Admin untuk mendefinisikan, menganugerahkan, dan mencabut badge pengguna.",
      "Creator Leaderboard dengan sistem skor terintegrasi dan podium 3 besar."
    ],
    improvements: [
      "Tampilan Role Badge dengan palet warna neon khas NightVerse.",
      "Audit log lengkap untuk setiap transaksi penganugerahan dan pencabutan lencana."
    ],
    bugFixes: [
      "Memperbaiki inkonsistensi tier badge pada kartu direktori pengguna."
    ],
    breakingChanges: [],
    createdBy: "NightVerse Engineering",
    createdAt: "2026-10-30T10:00:00.000Z"
  },
  {
    id: "cl-v200",
    versionNumber: "v2.0.0",
    releaseTitle: "Tags Directory 5-Type Taxonomy & Ambiguity Tagging",
    releaseDate: "2026-10-25",
    summary: "Peluncuran Tags Directory lengkap dengan taksonomi 5 kategori, penanda tag ambigu, dan brankas pemulihan.",
    newFeatures: [
      "Sistem klasifikasi 5 kategori: Copyright, General, Artist, Character, dan Metadata.",
      "Status Ambiguous Tag dengan indikator (?) untuk penandaan tag multitafsir.",
      "Fitur pencarian, filter kategori, pengurutan abjad, dan pratinjau tag pada konten.",
      "Manajemen tag massal dan Supervisor Purge Vault untuk pemulihan tag terhapus."
    ],
    improvements: [
      "Pemisahan visual warna badge tag berdasarkan kategori di Content Lightbox.",
      "Sinkronisasi real-time penambahan, penyuntingan, dan penghapusan tag ke database."
    ],
    bugFixes: [
      "Memperbaiki bug tag baru yang tidak langsung muncul pada Tags Directory setelah disimpan."
    ],
    breakingChanges: [],
    createdBy: "NightVerse Engineering",
    createdAt: "2026-10-25T12:00:00.000Z"
  },
  {
    id: "cl-v150",
    versionNumber: "v1.5.0",
    releaseTitle: "Creator Hub & Multimedia Feeds",
    releaseDate: "2026-10-18",
    summary: "Eksplorasi feed multimedia, fitur unggah karya visual (Photo, Video, Blog), dan interaksi sinyal sosial.",
    newFeatures: [
      "Dukungan multi-media pada Explore Feed dengan filter kategori.",
      "Alur formulir Create Work untuk Blog, Foto, dan Video.",
      "Sinyal interaksi sosial: Like, Favorite, Bookmark, dan Share."
    ],
    improvements: [
      "Pratinjau rasio aspek dinamis (16:9, 9:16, 1:1, 4:3) pada kartu karya."
    ],
    bugFixes: [
      "Pencegahan scroll latar belakang saat modal karya dibuka."
    ],
    breakingChanges: [],
    createdBy: "NightVerse Engineering",
    createdAt: "2026-10-18T09:00:00.000Z"
  },
  {
    id: "cl-v100",
    versionNumber: "v1.0.0",
    releaseTitle: "NightVerse Platform Foundation",
    releaseDate: "2026-10-10",
    summary: "Rilis perdana platform NightVerse: autentikasi, manajemen profil, tema dark navy cyberpunk, dan role-based access control.",
    newFeatures: [
      "Sistem Autentikasi dan Registrasi Akun Pengguna.",
      "Dukungan peran: SUPER_ADMIN, ADMIN, MODERATOR, dan USER.",
      "Halaman Profile Settings dengan pengaturan privasi granular.",
      "Dashboard Layout responsif dengan tema visual dark cyberpunk."
    ],
    improvements: [
      "Penyimpanan lokal terindeks berkapasitas tinggi via IndexedDB."
    ],
    bugFixes: [],
    breakingChanges: [],
    createdBy: "NightVerse Core",
    createdAt: "2026-10-10T00:00:00.000Z"
  }
];
