-- ==============================================================================
-- 🌌 NightVerse Database Schema & Initial Data
-- Platform Sosial & Kreator Digital Modern
-- Standard SQL Script (PostgreSQL & MySQL Compatible)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. DROP EXISTING TABLES (In Reverse Dependency Order)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS logs CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS videos CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS blogs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ------------------------------------------------------------------------------
-- 2. CREATE TABLES
-- ------------------------------------------------------------------------------

-- Table: users (Data Pengguna & Autentikasi)
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'USER', -- SUPER_ADMIN, ADMIN, MODERATOR, USER
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    profile JSONB, -- fullName, bio, avatarUrl, location, social links, activeBadge, badges, privacy settings
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: blogs (Konten Artikel / Blog Kreator)
CREATE TABLE blogs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED, REVISION, DRAFT
    visibility VARCHAR(32) NOT NULL DEFAULT 'public', -- public, private
    engagement VARCHAR(32) NOT NULL DEFAULT 'open', -- open, muted
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    reject_reason TEXT,
    category VARCHAR(64) DEFAULT 'General',
    views INT NOT NULL DEFAULT 0,
    likes_count INT NOT NULL DEFAULT 0,
    favorites_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: photos (Konten Foto / Visual Art)
CREATE TABLE photos (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(32) NOT NULL DEFAULT 'URL', -- LAPTOP, MOBILE, URL, EMBED
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'APPROVED', -- PENDING, APPROVED, REJECTED, REVISION, DRAFT
    visibility VARCHAR(32) NOT NULL DEFAULT 'public', -- public, private
    engagement VARCHAR(32) NOT NULL DEFAULT 'open', -- open, muted
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    reject_reason TEXT,
    category VARCHAR(64) DEFAULT 'Photography',
    views INT NOT NULL DEFAULT 0,
    likes_count INT NOT NULL DEFAULT 0,
    favorites_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: videos (Konten Video / Multimedia)
CREATE TABLE videos (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_name VARCHAR(255) NOT NULL,
    author_avatar TEXT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    source_type VARCHAR(32) NOT NULL DEFAULT 'URL', -- LAPTOP, MOBILE, URL, EMBED
    url TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration INT NOT NULL DEFAULT 0, -- Dalam detik
    resolution VARCHAR(32) DEFAULT '1080p',
    aspect_ratio VARCHAR(32) DEFAULT '16:9',
    tags TEXT[] DEFAULT '{}',
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED, REVISION, DRAFT
    visibility VARCHAR(32) NOT NULL DEFAULT 'public', -- public, private
    engagement VARCHAR(32) NOT NULL DEFAULT 'open', -- open, muted
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    reject_reason TEXT,
    category VARCHAR(64) DEFAULT 'Motion',
    views INT NOT NULL DEFAULT 0,
    likes_count INT NOT NULL DEFAULT 0,
    favorites_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: tags (Sistem Tag & Topik Tren)
CREATE TABLE tags (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    usage_count INT NOT NULL DEFAULT 0,
    growth_rate INT NOT NULL DEFAULT 0,
    most_active_username VARCHAR(255),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    blog_count INT NOT NULL DEFAULT 0,
    photo_count INT NOT NULL DEFAULT 0,
    video_count INT NOT NULL DEFAULT 0,
    growth_daily INT NOT NULL DEFAULT 0,
    growth_weekly INT NOT NULL DEFAULT 0,
    growth_monthly INT NOT NULL DEFAULT 0,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE
);

-- Table: comments (Komentar Konten)
CREATE TABLE comments (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    content TEXT NOT NULL,
    content_type VARCHAR(32) NOT NULL, -- blog, photo, video
    content_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: follows (Hubungan Pengikut Pengguna)
CREATE TABLE follows (
    follower_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

-- Table: notifications (Notifikasi Sistem & Sosial)
CREATE TABLE notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL, -- User ID spesifik, "all", atau "admin"
    triggered_by_id VARCHAR(64),
    triggered_by_name VARCHAR(255),
    triggered_by_avatar TEXT,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(32) NOT NULL DEFAULT 'SYSTEM', -- CONTENT, SOCIAL, SYSTEM, ADMIN
    type VARCHAR(64) NOT NULL,
    link TEXT,
    target_type VARCHAR(32), -- blog, photo, video
    target_id VARCHAR(64),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: reports (Laporan Pelanggaran Konten/Pengguna)
CREATE TABLE reports (
    id VARCHAR(64) PRIMARY KEY,
    reporter_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(32) NOT NULL, -- blog, photo, video, user, comment
    target_id VARCHAR(64) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN', -- OPEN, RESOLVED, DISMISSED
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Table: logs (Audit Trail & Activity Log Sistem)
CREATE TABLE logs (
    id VARCHAR(64) PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    details TEXT NOT NULL,
    operator VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table: system_settings (Pengaturan Konfigurasi Platform)
CREATE TABLE system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    website_name VARCHAR(255) NOT NULL DEFAULT 'NightVerse',
    logo_text VARCHAR(255) NOT NULL DEFAULT 'NIGHTVERSE',
    favicon_emoji VARCHAR(32) DEFAULT '🌌',
    favicon_url TEXT DEFAULT '/favicon.svg',
    favicon_updated_at BIGINT DEFAULT 0,
    primary_color VARCHAR(64) DEFAULT 'purple-600',
    secondary_color VARCHAR(64) DEFAULT 'cyan-400',
    homepage_banner TEXT,
    hero_title TEXT DEFAULT 'Universal Hub for Modern Masters',
    hero_subtitle TEXT DEFAULT 'Welcome to the future of creative collaboration.',
    footer_text TEXT DEFAULT '© 2026 NightVerse Enterprise. All Rights Reserved.',
    seo_description TEXT,
    seo_keywords TEXT,
    og_image TEXT,
    max_image_size_mb INT DEFAULT 10,
    max_video_size_mb INT DEFAULT 100,
    allowed_formats JSONB,
    smtp_host VARCHAR(255) DEFAULT 'smtp.nightverse.com',
    smtp_port INT DEFAULT 587,
    enable_email_verification BOOLEAN DEFAULT TRUE,
    enable_push_notifications BOOLEAN DEFAULT FALSE,
    enable_realtime_stream BOOLEAN DEFAULT TRUE,
    media_approval JSONB -- {"photo": true, "video": false, "blog": true}
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE OPTIMIZATION
-- ------------------------------------------------------------------------------
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_blogs_user_id ON blogs(user_id);
CREATE INDEX idx_blogs_status_visibility ON blogs(status, visibility);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_photos_status_visibility ON photos(status, visibility);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_videos_status_visibility ON videos(status, visibility);
CREATE INDEX idx_comments_content ON comments(content_type, content_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX idx_follows_following ON follows(following_id);

-- ------------------------------------------------------------------------------
-- 4. SEED INITIAL DATA
-- ------------------------------------------------------------------------------

-- Seed Users
INSERT INTO users (id, email, username, password_hash, role, is_suspended, email_verified, profile, created_at)
VALUES 
(
    'admin-1',
    'superadmin@nightverse.com',
    'NightAdmin',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- hash for admin123
    'SUPER_ADMIN',
    FALSE,
    TRUE,
    '{"fullName": "System Overseer", "bio": "Root administrator for the NightVerse ecosystem.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin", "activeBadge": "Admin Master", "badges": ["Admin Master", "Verified Creator"]}',
    CURRENT_TIMESTAMP
),
(
    'admin-2',
    'admin@nightverse.com',
    'ExecAdmin',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- hash for admin123
    'ADMIN',
    FALSE,
    TRUE,
    '{"fullName": "Executive Admin", "bio": "Executive administrator of NightVerse.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=exec", "activeBadge": "Administrator", "badges": ["Administrator"]}',
    CURRENT_TIMESTAMP
),
(
    'mod-1',
    'mod@nightverse.com',
    'ModLead',
    '811776b647037f022efefdd2be4552b75a133d1c16f08148b81313e2e7fb2613', -- hash for mod123
    'MODERATOR',
    FALSE,
    TRUE,
    '{"fullName": "Moderations Lead", "bio": "Content moderation lead.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=mod", "activeBadge": "Moderator", "badges": ["Moderator"]}',
    CURRENT_TIMESTAMP
),
(
    'user-1',
    'neon_shadow@nightverse.com',
    'neon_shadow',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- hash for user123
    'USER',
    FALSE,
    TRUE,
    '{"fullName": "Visual Photographer", "bio": "Capturing the dark cyber landscapes.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=neon_shadow", "activeBadge": "Verified Creator", "badges": ["Verified Creator", "Contributor"]}',
    CURRENT_TIMESTAMP
),
(
    'user-2',
    'pixel_dreamer@nightverse.com',
    'pixel_dreamer',
    'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', -- hash for user123
    'USER',
    FALSE,
    TRUE,
    '{"fullName": "Cyber Illustrator", "bio": "Painting dreams in bright pixels.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=pixel_dreamer", "activeBadge": "Top Contributor", "badges": ["Top Contributor"]}',
    CURRENT_TIMESTAMP
);

-- Seed System Settings
INSERT INTO system_settings (
    id, website_name, logo_text, favicon_emoji, favicon_url, primary_color, secondary_color, 
    homepage_banner, hero_title, hero_subtitle, footer_text, seo_description, seo_keywords, 
    og_image, max_image_size_mb, max_video_size_mb, allowed_formats, enable_email_verification, 
    enable_push_notifications, enable_realtime_stream, media_approval
) VALUES (
    1,
    'NightVerse',
    'NIGHTVERSE',
    '🌌',
    '/favicon.svg',
    'purple-600',
    'cyan-400',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1500',
    'Universal Hub for Modern Masters',
    'Welcome to the future of creative collaboration. Empowering neon creators, visual designers, and sound artists worldwide.',
    '© 2026 NightVerse Enterprise. All Rights Reserved.',
    'NightVerse - The premier creative portfolio platform.',
    'cyberpunk, designer portfolio, neon artistry',
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
    10,
    100,
    '["jpg", "jpeg", "png", "gif", "mp4", "mov"]',
    TRUE,
    FALSE,
    TRUE,
    '{"photo": true, "video": false, "blog": true}'
);

-- Seed Initial Tags
INSERT INTO tags (id, name, usage_count, growth_rate, most_active_username, created_at, last_used_at)
VALUES 
('1', 'cyberpunk', 42, 15, 'NightAdmin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('2', 'neon', 38, 12, 'NightAdmin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('3', 'futuristic', 25, 8, 'NightAdmin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Seed Sample Follows
INSERT INTO follows (follower_id, following_id, created_at)
VALUES 
('user-1', 'admin-1', CURRENT_TIMESTAMP),
('user-2', 'admin-1', CURRENT_TIMESTAMP),
('user-2', 'user-1', CURRENT_TIMESTAMP);

-- Seed Sample Blogs
INSERT INTO blogs (id, user_id, author_name, author_avatar, title, description, content, thumbnail_url, tags, status, visibility, engagement, allow_comments, views, likes_count, favorites_count, created_at)
VALUES (
    'blog-sample-1',
    'admin-1',
    'NightAdmin',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
    'Designing Neon Urban Landscapes in NightVerse',
    'An in-depth guide to building immersive dark neon scenes for web showcase.',
    'Welcome creators! In this comprehensive tutorial, we dive deep into color balancing, lighting overlays, and responsive card layouts in dark theme web apps.',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1000',
    ARRAY['cyberpunk', 'neon'],
    'APPROVED',
    'public',
    'open',
    TRUE,
    1240,
    88,
    42,
    CURRENT_TIMESTAMP
);

-- Seed Sample Photos
INSERT INTO photos (id, user_id, author_name, author_avatar, title, description, source_type, url, thumbnail_url, tags, status, visibility, engagement, allow_comments, views, likes_count, favorites_count, created_at)
VALUES (
    'photo-sample-1',
    'user-1',
    'neon_shadow',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=neon_shadow',
    'Cyberpunk Tokyo Alleyways at Night',
    'Captured in Shinjuku with high contrast neon reflections after rain.',
    'URL',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=1200',
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&q=80&w=600',
    ARRAY['cyberpunk', 'neon', 'futuristic'],
    'APPROVED',
    'public',
    'open',
    TRUE,
    3120,
    240,
    115,
    CURRENT_TIMESTAMP
);

-- Seed Sample Comments
INSERT INTO comments (id, user_id, username, avatar_url, content, content_type, content_id, created_at)
VALUES (
    'comm-sample-1',
    'user-2',
    'pixel_dreamer',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=pixel_dreamer',
    'Incredible aesthetic and lighting composition! Absolutely loving the cyberpunk vibe.',
    'photo',
    'photo-sample-1',
    CURRENT_TIMESTAMP
);

-- ==============================================================================
-- End of NightVerse Database Schema Script
-- ==============================================================================
