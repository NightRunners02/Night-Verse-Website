-- ==============================================================================
-- 🌌 NightVerse Full Idempotent Supabase Migration SQL (Single Unified Script)
-- Target: Supabase (PostgreSQL 15+)
-- Safe to Run Directly in Supabase SQL Editor (Zero Destructive Statements)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. MIGRATION TRACKING TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. CREATE TABLES IF NOT EXISTS (All 19 Core NightVerse Tables)
-- ------------------------------------------------------------------------------

-- 1) users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) blogs
CREATE TABLE IF NOT EXISTS blogs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT NOT NULL,
    thumbnail_url TEXT,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'APPROVED',
    visibility TEXT NOT NULL DEFAULT 'public',
    engagement TEXT NOT NULL DEFAULT 'open',
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    reject_reason TEXT,
    category TEXT DEFAULT 'General',
    views INT NOT NULL DEFAULT 0,
    likes_count INT NOT NULL DEFAULT 0,
    liked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    favorites_count INT NOT NULL DEFAULT 0,
    favorited_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    bookmarks_count INT NOT NULL DEFAULT 0,
    bookmarked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    shares_count INT NOT NULL DEFAULT 0,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) photos
CREATE TABLE IF NOT EXISTS photos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL DEFAULT 'URL',
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    resolution TEXT,
    aspect_ratio TEXT DEFAULT '16:9',
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'APPROVED',
    visibility TEXT NOT NULL DEFAULT 'public',
    engagement TEXT NOT NULL DEFAULT 'open',
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    reject_reason TEXT,
    category TEXT DEFAULT 'Photography',
    views INT NOT NULL DEFAULT 0,
    likes_count INT NOT NULL DEFAULT 0,
    liked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    favorites_count INT NOT NULL DEFAULT 0,
    favorited_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    bookmarks_count INT NOT NULL DEFAULT 0,
    bookmarked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    shares_count INT NOT NULL DEFAULT 0,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) videos
CREATE TABLE IF NOT EXISTS videos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT,
    title TEXT NOT NULL,
    description TEXT,
    source_type TEXT NOT NULL DEFAULT 'URL',
    url TEXT NOT NULL,
    video_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    renditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    thumbnail_url TEXT NOT NULL DEFAULT '',
    duration DOUBLE PRECISION NOT NULL DEFAULT 0,
    resolution TEXT DEFAULT '1080p',
    aspect_ratio TEXT DEFAULT '16:9',
    codec TEXT,
    frame_rate DOUBLE PRECISION DEFAULT 30,
    file_size BIGINT DEFAULT 0,
    processing_status TEXT DEFAULT 'COMPLETED',
    is_external BOOLEAN NOT NULL DEFAULT FALSE,
    external_provider TEXT,
    embed_url TEXT,
    external_reference TEXT,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    status TEXT NOT NULL DEFAULT 'PENDING',
    visibility TEXT NOT NULL DEFAULT 'public',
    engagement TEXT NOT NULL DEFAULT 'open',
    allow_comments BOOLEAN NOT NULL DEFAULT TRUE,
    reject_reason TEXT,
    category TEXT DEFAULT 'Motion',
    views INT NOT NULL DEFAULT 0,
    likes_count INT NOT NULL DEFAULT 0,
    liked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    favorites_count INT NOT NULL DEFAULT 0,
    favorited_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    bookmarks_count INT NOT NULL DEFAULT 0,
    bookmarked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    shares_count INT NOT NULL DEFAULT 0,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5) tags
CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'General',
    is_ambiguous BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'APPROVED',
    created_by TEXT DEFAULT 'NightAdmin',
    usage_count INT NOT NULL DEFAULT 0,
    count INT NOT NULL DEFAULT 0,
    growth_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    most_active_username TEXT,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blog_count INT NOT NULL DEFAULT 0,
    photo_count INT NOT NULL DEFAULT 0,
    video_count INT NOT NULL DEFAULT 0,
    growth_daily DOUBLE PRECISION NOT NULL DEFAULT 0,
    growth_weekly DOUBLE PRECISION NOT NULL DEFAULT 0,
    growth_monthly DOUBLE PRECISION NOT NULL DEFAULT 0,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE
);

-- 6) comments
CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7) follows
CREATE TABLE IF NOT EXISTS follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 8) notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    triggered_by_id TEXT,
    triggered_by_name TEXT,
    triggered_by_avatar TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'SYSTEM',
    type TEXT NOT NULL,
    link TEXT,
    target_type TEXT,
    target_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    group_id TEXT,
    group_count INT DEFAULT 1,
    action_taken BOOLEAN NOT NULL DEFAULT FALSE,
    action_by TEXT,
    action_decision TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9) reports
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL,
    reporter_username TEXT,
    content_id TEXT,
    content_type TEXT,
    content_title TEXT,
    creator_id TEXT,
    creator_username TEXT,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 10) logs
CREATE TABLE IF NOT EXISTS logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    operator TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11) system_settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    website_name TEXT NOT NULL DEFAULT 'NightVerse',
    logo_text TEXT NOT NULL DEFAULT 'NIGHTVERSE',
    logo_url TEXT,
    favicon_emoji TEXT DEFAULT '🌌',
    favicon_url TEXT DEFAULT '/favicon.svg',
    favicon_updated_at BIGINT DEFAULT 0,
    primary_color TEXT DEFAULT 'purple-600',
    secondary_color TEXT DEFAULT 'cyan-400',
    homepage_banner TEXT,
    hero_title TEXT DEFAULT 'Universal Hub for Modern Masters',
    hero_subtitle TEXT DEFAULT 'Welcome to the future of creative collaboration. Empowering neon creators, visual designers, and sound artists worldwide.',
    footer_text TEXT DEFAULT '© 2026 NightVerse Enterprise. All Rights Reserved.',
    seo_description TEXT,
    seo_keywords TEXT,
    og_image TEXT,
    max_image_size_mb INT NOT NULL DEFAULT 10,
    max_video_size_mb INT NOT NULL DEFAULT 100,
    allowed_formats JSONB NOT NULL DEFAULT '["jpg","jpeg","png","gif","mp4","mov"]'::jsonb,
    smtp_host TEXT DEFAULT 'smtp.nightverse.com',
    smtp_port INT DEFAULT 587,
    enable_email_verification BOOLEAN NOT NULL DEFAULT TRUE,
    enable_push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    enable_realtime_stream BOOLEAN NOT NULL DEFAULT TRUE,
    creator_masterpieces_blur BOOLEAN NOT NULL DEFAULT FALSE,
    explore_items_per_page INT NOT NULL DEFAULT 12,
    media_approval JSONB NOT NULL DEFAULT '{"photo":true,"video":false,"blog":true}'::jsonb
);

-- 12) badges
CREATE TABLE IF NOT EXISTS badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ROLE',
    tier INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    requirement TEXT NOT NULL,
    color TEXT,
    bg_color TEXT,
    border_color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13) badge_awards
CREATE TABLE IF NOT EXISTS badge_awards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    badge_id TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    badge_tier INT NOT NULL DEFAULT 0,
    granted_by_id TEXT NOT NULL,
    granted_by_username TEXT NOT NULL,
    granted_by_role TEXT NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'SUCCESS'
);

-- 14) doc_categories
CREATE TABLE IF NOT EXISTS doc_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

-- 15) documentations
CREATE TABLE IF NOT EXISTS documentations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id TEXT NOT NULL REFERENCES doc_categories(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    version TEXT NOT NULL DEFAULT 'v2.7.0',
    author_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT DEFAULT 'SUPER_ADMIN',
    display_order INT NOT NULL DEFAULT 0,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    callouts JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- 16) doc_revisions
CREATE TABLE IF NOT EXISTS doc_revisions (
    id TEXT PRIMARY KEY,
    documentation_id TEXT NOT NULL REFERENCES documentations(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    previous_content TEXT NOT NULL,
    updated_content TEXT NOT NULL,
    editor_id TEXT NOT NULL,
    editor_name TEXT NOT NULL,
    editor_role TEXT NOT NULL,
    revision_number INT NOT NULL DEFAULT 1,
    change_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17) changelogs
CREATE TABLE IF NOT EXISTS changelogs (
    id TEXT PRIMARY KEY,
    version_number TEXT NOT NULL,
    release_title TEXT NOT NULL,
    release_date TEXT NOT NULL,
    summary TEXT,
    new_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
    bug_fixes JSONB NOT NULL DEFAULT '[]'::jsonb,
    breaking_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18) support_tickets
CREATE TABLE IF NOT EXISTS support_tickets (
    id TEXT PRIMARY KEY,
    ticket_number TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    subject TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    description TEXT NOT NULL,
    attachment_url TEXT,
    status TEXT NOT NULL DEFAULT 'OPEN',
    assigned_staff_id TEXT,
    assigned_staff_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- 19) ticket_messages
CREATE TABLE IF NOT EXISTS ticket_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. NON-DESTRUCTIVE COLUMN MIGRATIONS (Upgrades Pre-Existing Tables Safely)
-- ------------------------------------------------------------------------------
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS liked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS favorited_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS bookmarks_count INT NOT NULL DEFAULT 0;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS bookmarked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS shares_count INT NOT NULL DEFAULT 0;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE photos ADD COLUMN IF NOT EXISTS resolution TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS aspect_ratio TEXT DEFAULT '16:9';
ALTER TABLE photos ADD COLUMN IF NOT EXISTS liked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE photos ADD COLUMN IF NOT EXISTS favorited_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE photos ADD COLUMN IF NOT EXISTS bookmarks_count INT NOT NULL DEFAULT 0;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS bookmarked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE photos ADD COLUMN IF NOT EXISTS shares_count INT NOT NULL DEFAULT 0;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE videos ADD COLUMN IF NOT EXISTS video_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS renditions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS codec TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS frame_rate DOUBLE PRECISION DEFAULT 30;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'COMPLETED';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_external BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS external_provider TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS embed_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS external_reference TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS liked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS favorited_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS bookmarks_count INT NOT NULL DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS bookmarked_by TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS shares_count INT NOT NULL DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS comments JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE tags ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'General';
ALTER TABLE tags ADD COLUMN IF NOT EXISTS is_ambiguous BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'APPROVED';
ALTER TABLE tags ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'NightAdmin';
ALTER TABLE tags ADD COLUMN IF NOT EXISTS count INT NOT NULL DEFAULT 0;
ALTER TABLE tags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS group_id TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS group_count INT DEFAULT 1;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_taken BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_by TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_decision TEXT;

ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_username TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS content_id TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS content_type TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS content_title TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS creator_id TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS creator_username TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS creator_masterpieces_blur BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS explore_items_per_page INT NOT NULL DEFAULT 12;

-- ------------------------------------------------------------------------------
-- 4. INDEXES FOR PERFORMANCE OPTIMIZATION (Idempotent)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status_visibility ON blogs(status, visibility);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_status_visibility ON photos(status, visibility);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status_visibility ON videos(status, visibility);
CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status, is_resolved);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_badge_awards_user_id ON badge_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_documentations_category ON documentations(category_id, status);
CREATE INDEX IF NOT EXISTS idx_doc_revisions_doc_id ON doc_revisions(documentation_id, revision_number DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id, created_at);

-- ------------------------------------------------------------------------------
-- 5. SUPABASE PERMISSIONS, ROW LEVEL SECURITY & REALTIME PUBLICATION
-- ------------------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Explicit top-level RLS activation for every table (prevents Supabase SQL Editor RLS warning popup)
ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE changelogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl TEXT;
    all_tables TEXT[] := ARRAY[
        'schema_migrations', 'users', 'blogs', 'photos', 'videos', 'tags',
        'comments', 'follows', 'notifications', 'reports', 'logs',
        'system_settings', 'badges', 'badge_awards', 'doc_categories',
        'documentations', 'doc_revisions', 'changelogs', 'support_tickets',
        'ticket_messages'
    ];
BEGIN
    FOREACH tbl IN ARRAY all_tables LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'public'
              AND tablename = tbl
              AND policyname = 'nightverse_api_access'
        ) THEN
            EXECUTE format(
                'CREATE POLICY "nightverse_api_access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (current_user IN (''anon'', ''authenticated'', ''service_role'')) WITH CHECK (current_user IN (''anon'', ''authenticated'', ''service_role''));',
                tbl
            );
        END IF;
    END LOOP;
END $$;

DO $$
DECLARE
    rt_tbl TEXT;
    rt_tables TEXT[] := ARRAY[
        'blogs', 'photos', 'videos', 'tags', 'comments',
        'notifications', 'support_tickets', 'ticket_messages', 'system_settings'
    ];
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        FOREACH rt_tbl IN ARRAY rt_tables LOOP
            BEGIN
                EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', rt_tbl);
            EXCEPTION WHEN OTHERS THEN
                NULL;
            END;
        END LOOP;
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. SEED INITIAL DATA (Idempotent via ON CONFLICT DO NOTHING)
-- ------------------------------------------------------------------------------

-- Seed Users (Password Hashes Match src/lib/crypto.ts SHA-256 + NightVerseSecureSalt_2026)
-- admin-1 / admin-2: admin123 | mod-1: mod123 | user-1 / user-2: user123
INSERT INTO users (id, email, username, password_hash, role, is_suspended, email_verified, profile, created_at)
VALUES
(
    'admin-1',
    'superadmin@nightverse.com',
    'NightAdmin',
    '73fd106ed862a5e4402ad49b98430c3e7f162b48834abea84bd53c61f5e5640c',
    'SUPER_ADMIN',
    FALSE,
    TRUE,
    '{"fullName": "System Overseer", "bio": "Root administrator for the NightVerse ecosystem.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin", "activeBadge": "Super Admin", "badges": ["Super Admin", "Administrator"]}'::jsonb,
    '2026-01-01T00:00:00.000Z'
),
(
    'admin-2',
    'admin@nightverse.com',
    'ExecAdmin',
    '73fd106ed862a5e4402ad49b98430c3e7f162b48834abea84bd53c61f5e5640c',
    'ADMIN',
    FALSE,
    TRUE,
    '{"fullName": "Executive Admin", "bio": "Executive administrator of NightVerse.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=exec", "activeBadge": "Administrator", "badges": ["Administrator"]}'::jsonb,
    '2026-01-01T00:00:00.000Z'
),
(
    'mod-1',
    'mod@nightverse.com',
    'ModLead',
    '1dccc873e0b2ef078d64dcd06535c941f21fe34eec621aed52d3f8cffa5a6c38',
    'MODERATOR',
    FALSE,
    TRUE,
    '{"fullName": "Moderations Lead", "bio": "Content moderation lead.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=mod", "activeBadge": "Moderator", "badges": ["Moderator"]}'::jsonb,
    '2026-01-01T00:00:00.000Z'
),
(
    'user-1',
    'neon_shadow@nightverse.com',
    'neon_shadow',
    '6fd0ae5092a6c7a0e8189005dc9e9ffab8b098fd1e26f1e0e3cb35d9011b44aa',
    'USER',
    FALSE,
    TRUE,
    '{"fullName": "Visual Photographer", "bio": "Capturing the dark cyber landscapes.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=neon_shadow", "activeBadge": "Verified Creator", "badges": ["Verified Creator", "Contributor"]}'::jsonb,
    '2026-01-01T00:00:00.000Z'
),
(
    'user-2',
    'pixel_dreamer@nightverse.com',
    'pixel_dreamer',
    '6fd0ae5092a6c7a0e8189005dc9e9ffab8b098fd1e26f1e0e3cb35d9011b44aa',
    'USER',
    FALSE,
    TRUE,
    '{"fullName": "Cyber Illustrator", "bio": "Painting dreams in bright pixels.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=pixel_dreamer", "activeBadge": "Contributor", "badges": ["Contributor"]}'::jsonb,
    '2026-01-01T00:00:00.000Z'
)
ON CONFLICT (id) DO NOTHING;

-- Seed System Settings
INSERT INTO system_settings (
    id, website_name, logo_text, logo_url, favicon_emoji, favicon_url, favicon_updated_at,
    primary_color, secondary_color, homepage_banner, hero_title, hero_subtitle, footer_text,
    seo_description, seo_keywords, og_image, max_image_size_mb, max_video_size_mb,
    allowed_formats, smtp_host, smtp_port, enable_email_verification,
    enable_push_notifications, enable_realtime_stream, creator_masterpieces_blur,
    explore_items_per_page, media_approval
) VALUES (
    1,
    'NightVerse',
    'NIGHTVERSE',
    NULL,
    '🌌',
    '/favicon.svg',
    0,
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
    '["jpg", "jpeg", "png", "gif", "mp4", "mov"]'::jsonb,
    'smtp.nightverse.com',
    587,
    TRUE,
    FALSE,
    TRUE,
    FALSE,
    12,
    '{"photo": true, "video": false, "blog": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Seed Badges (8 System Badges)
INSERT INTO badges (id, name, icon, description, category, tier, status, requirement, color, bg_color, border_color, created_at)
VALUES
('super-admin', 'Super Admin', 'ShieldAlert', 'Badge kehormatan tertinggi Root Administrator dengan hak veto penuh atas seluruh ekosistem NightVerse.', 'ROLE', 5, 'ACTIVE', 'Hanya dapat dibuka dan diberikan langsung oleh Root Super Administrator.', 'text-rose-400', 'bg-rose-500/10', 'border-rose-500/30', '2026-01-01T00:00:00.000Z'),
('administrator', 'Administrator', 'ShieldCheck', 'Badge otoritas Administrator untuk manajemen direktori, moderasi konten, dan kepengurusan sistem.', 'ROLE', 4, 'ACTIVE', 'Diberikan oleh Super Administrator atas tanggung jawab kepengurusan platform.', 'text-purple-400', 'bg-purple-500/10', 'border-purple-500/30', '2026-01-01T00:00:00.000Z'),
('moderator', 'Moderator', 'Shield', 'Badge pengawas etika dan ketertiban interaksi komunitas visual NightVerse.', 'ROLE', 3, 'ACTIVE', 'Ditetapkan sebagai Moderator oleh Administrator atau Super Administrator.', 'text-cyan-400', 'bg-cyan-500/10', 'border-cyan-500/30', '2026-01-01T00:00:00.000Z'),
('verified-creator', 'Verified Creator', 'CheckCircle2', 'Menandakan kreator resmi yang identitas, portofolio karya, dan kredibilitasnya telah terverifikasi.', 'COMMUNITY', 2, 'ACTIVE', 'Verifikasi profil kreator resmi oleh staf atau pengelola NightVerse.', 'text-blue-400', 'bg-blue-500/10', 'border-blue-500/30', '2026-01-01T00:00:00.000Z'),
('contributor', 'Contributor', 'Trophy', 'Diberikan kepada pengguna yang konsisten menyumbangkan karya bermutu dan aktif membangun komunitas.', 'ACHIEVEMENT', 1, 'ACTIVE', 'Aktif mempublikasikan karya seni digital dan partisipasi positif secara konsisten.', 'text-emerald-400', 'bg-emerald-500/10', 'border-emerald-500/30', '2026-01-01T00:00:00.000Z'),
('vip', 'VIP', 'Crown', 'Badge keanggotaan istimewa VIP NightVerse dengan akses apresiasi komunitas eksklusif.', 'SPECIAL', 0, 'ACTIVE', 'Diberikan melalui event keanggotaan VIP atau apresiasi khusus staf.', 'text-amber-400', 'bg-amber-500/10', 'border-amber-500/30', '2026-01-01T00:00:00.000Z'),
('night-artist', 'Night Artist', 'Sparkles', 'Pengakuan seniman visual malam yang melahirkan karya bertema neon cyberpunk spektakuler.', 'SPECIAL', 0, 'ACTIVE', 'Mendapat apresiasi visual tinggi pada karya seni bertema cyber neon.', 'text-fuchsia-400', 'bg-fuchsia-500/10', 'border-fuchsia-500/30', '2026-01-01T00:00:00.000Z'),
('user', 'User', 'User', 'Badge standar milik seluruh warga kreatif terdaftar di ekosistem NightVerse.', 'ROLE', 0, 'ACTIVE', 'Otomatis diperoleh saat akun baru berhasil dibuat.', 'text-slate-400', 'bg-slate-500/10', 'border-slate-500/30', '2026-01-01T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Badge Awards
INSERT INTO badge_awards (id, user_id, username, badge_id, badge_name, badge_tier, granted_by_id, granted_by_username, granted_by_role, granted_at, reason, status)
VALUES
('award-seed-1', 'admin-1', 'NightAdmin', 'super-admin', 'Super Admin', 5, 'admin-1', 'RootSystem', 'SUPER_ADMIN', '2026-01-01T00:00:00.000Z', 'Genesis Root Administrator Key', 'SUCCESS'),
('award-seed-2', 'admin-1', 'NightAdmin', 'administrator', 'Administrator', 4, 'admin-1', 'RootSystem', 'SUPER_ADMIN', '2026-01-01T00:00:00.000Z', 'Platform Administrator Accolade', 'SUCCESS'),
('award-seed-3', 'user-1', 'neon_shadow', 'verified-creator', 'Verified Creator', 2, 'admin-1', 'NightAdmin', 'SUPER_ADMIN', '2026-01-15T12:00:00.000Z', 'High quality photography portfolio verified', 'SUCCESS'),
('award-seed-4', 'user-2', 'pixel_dreamer', 'contributor', 'Contributor', 1, 'admin-1', 'NightAdmin', 'SUPER_ADMIN', '2026-01-20T10:30:00.000Z', 'Active participation in creative visual forums', 'SUCCESS')
ON CONFLICT (id) DO NOTHING;

-- Seed Initial Tags
INSERT INTO tags (id, name, type, is_ambiguous, status, created_by, usage_count, count, growth_rate, most_active_username, last_used_at, created_at, updated_at)
VALUES
('tag-1', 'cyberpunk', 'General', FALSE, 'APPROVED', 'NightAdmin', 42, 42, 15, 'NightAdmin', NOW(), NOW(), NOW()),
('tag-2', 'neon', 'General', FALSE, 'APPROVED', 'NightAdmin', 38, 38, 12, 'NightAdmin', NOW(), NOW(), NOW()),
('tag-3', 'slippery', 'Artist', FALSE, 'APPROVED', 'NightAdmin', 15, 15, 10, 'NightAdmin', NOW(), NOW(), NOW()),
('tag-4', 'minecraft', 'Copyright', FALSE, 'APPROVED', 'NightAdmin', 22, 22, 8, 'NightAdmin', NOW(), NOW(), NOW()),
('tag-5', 'jenny belle', 'Character', TRUE, 'APPROVED', 'NightAdmin', 11, 11, 5, 'NightAdmin', NOW(), NOW(), NOW()),
('tag-6', 'futuristic', 'General', FALSE, 'APPROVED', 'NightAdmin', 25, 25, 8, 'NightAdmin', NOW(), NOW(), NOW()),
('tag-7', '4k', 'Metadata', FALSE, 'APPROVED', 'NightAdmin', 18, 18, 6, 'NightAdmin', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed Featured Video (with Authentic H.264 Multi-Renditions)
INSERT INTO videos (
    id, user_id, author_name, author_avatar, title, description, source_type, url, video_urls,
    renditions, thumbnail_url, duration, resolution, aspect_ratio, codec, frame_rate, file_size,
    processing_status, is_external, tags, status, visibility, engagement, allow_comments,
    category, views, likes_count, liked_by, created_at
) VALUES (
    'seed-video-cyberpunk',
    'admin-1',
    'NightAdmin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'Neon Horizon 2099 — Cyberpunk Metropolis Odyssey',
    'Official NightVerse benchmark video encoded in authentic H.264 / AVC High Profile with 6 distinct multi-rendition streams (1080p, 720p, 480p, 360p, 240p, 144p). Features real-time rendition switching with seamless timestamp continuity and no buffer resets.',
    'UPLOAD',
    '/renditions/cyberpunk-city/1080p.mp4',
    '["/renditions/cyberpunk-city/1080p.mp4"]'::jsonb,
    '[
      {"id":"r-1080p","resolution":"1080p","width":1920,"height":1080,"codec":"h264 (H.264 / AVC)","bitrate":4488289,"frameRate":30,"url":"/renditions/cyberpunk-city/1080p.mp4","fileSize":8450412},
      {"id":"r-720p","resolution":"720p","width":1280,"height":720,"codec":"h264 (H.264 / AVC)","bitrate":2176892,"frameRate":30,"url":"/renditions/cyberpunk-city/720p.mp4","fileSize":4109018},
      {"id":"r-480p","resolution":"480p","width":854,"height":480,"codec":"h264 (H.264 / AVC)","bitrate":978468,"frameRate":30,"url":"/renditions/cyberpunk-city/480p.mp4","fileSize":1867325},
      {"id":"r-360p","resolution":"360p","width":640,"height":360,"codec":"h264 (H.264 / AVC)","bitrate":578470,"frameRate":30,"url":"/renditions/cyberpunk-city/360p.mp4","fileSize":1114891},
      {"id":"r-240p","resolution":"240p","width":426,"height":240,"codec":"h264 (H.264 / AVC)","bitrate":331865,"frameRate":30,"url":"/renditions/cyberpunk-city/240p.mp4","fileSize":653645},
      {"id":"r-144p","resolution":"144p","width":256,"height":144,"codec":"h264 (H.264 / AVC)","bitrate":168414,"frameRate":30,"url":"/renditions/cyberpunk-city/144p.mp4","fileSize":342535}
    ]'::jsonb,
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
    15,
    '1920x1080',
    '16:9',
    'h264 (H.264 / AVC High Profile)',
    30,
    8450412,
    'COMPLETED',
    FALSE,
    ARRAY['cyberpunk', 'neon', 'futuristic', '4k']::TEXT[],
    'APPROVED',
    'public',
    'open',
    TRUE,
    'Sci-Fi & Cyberpunk',
    1284,
    194,
    ARRAY['admin-1']::TEXT[],
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Follows
INSERT INTO follows (follower_id, following_id, created_at)
VALUES
('user-1', 'admin-1', NOW()),
('user-2', 'admin-1', NOW()),
('user-2', 'user-1', NOW())
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Seed Sample Blog
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
    ARRAY['cyberpunk', 'neon']::TEXT[],
    'APPROVED',
    'public',
    'open',
    TRUE,
    1240,
    88,
    42,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Photo
INSERT INTO photos (id, user_id, author_name, author_avatar, title, description, source_type, url, thumbnail_url, resolution, aspect_ratio, tags, status, visibility, engagement, allow_comments, views, likes_count, favorites_count, created_at)
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
    '1920x1080',
    '16:9',
    ARRAY['cyberpunk', 'neon', 'futuristic']::TEXT[],
    'APPROVED',
    'public',
    'open',
    TRUE,
    3120,
    240,
    115,
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Comment
INSERT INTO comments (id, user_id, username, avatar_url, content, content_type, content_id, created_at)
VALUES (
    'comm-sample-1',
    'user-2',
    'pixel_dreamer',
    'https://api.dicebear.com/7.x/avataaars/svg?seed=pixel_dreamer',
    'Incredible aesthetic and lighting composition! Absolutely loving the cyberpunk vibe.',
    'photo',
    'photo-sample-1',
    NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Seed Documentation Categories (20 Categories)
INSERT INTO doc_categories (id, name, slug, description, icon, display_order) VALUES
('getting-started', 'Getting Started', 'getting-started', 'Panduan awal penggunaan platform, navigasi utama, dan pengenalan ekosistem NightVerse.', 'Compass', 1),
('account-auth', 'Account & Authentication', 'account-auth', 'Manajemen akun, pendaftaran, sistem autentikasi, serta hak akses peran (Roles).', 'UserCheck', 2),
('profile-settings', 'Profile Settings', 'profile-settings', 'Pengaturan identitas publik, bio narasi, avatar, banner, dan preferensi akun.', 'UserCog', 3),
('creator-directory', 'Creator Directory', 'creator-directory', 'Eksplorasi direktori kreator, sistem Visitor View publik, dan jejaring relasi Follow.', 'Users', 4),
('creator-dashboard', 'Creator Dashboard', 'creator-dashboard', 'Pusat analitik kreator, pemantauan karya publik, statistik views, dan performa konten.', 'LayoutDashboard', 5),
('create-work', 'Create Work', 'create-work', 'Panduan publikasi karya, auto-detect creative title dari file media, dan tagging.', 'PlusSquare', 6),
('photo-management', 'Photo Management', 'photo-management', 'Ketentuan upload foto, rasio aspek, dan dukungan animasi GIF tanpa kompresi.', 'Image', 7),
('video-management', 'Video Management', 'video-management', 'Pengelolaan video lokal, pemutar video modern, dan multi-video real-time embed.', 'Video', 8),
('blog-management', 'Blog Management', 'blog-management', 'Penulisan artikel blog, format konten, manajemen draf, dan publikasi.', 'FileText', 9),
('explore-feed', 'Explore Feed', 'explore-feed', 'Navigasi feed utama, algoritma kurasi konten, pencarian, dan penyaringan kategori.', 'Sparkles', 10),
('content-lightbox', 'Content Lightbox', 'content-lightbox', 'Tampilan interaktif media layar penuh, komentar real-time, dan pemutar video modern.', 'Maximize2', 11),
('tags-directory', 'Tags Directory', 'tags-directory', 'Sistem taksonomi 5 kategori (Copyright, General, Artist, Character, Metadata) dan penanda ambigu.', 'Tags', 12),
('badge-management', 'Badge Management', 'badge-management', 'Sistem lencana berjenjang (Tier 0-5), kualifikasi pencapaian, dan audit penerbitan badge.', 'ShieldCheck', 13),
('leaderboard', 'Leaderboard', 'leaderboard', 'Peringkat kreator teratas, metrik penilaian skor, podium, dan filter kategori.', 'Trophy', 14),
('engagement-visibility', 'Engagement & Visibility', 'engagement-visibility', 'Interaksi sosial (Like, Favorite, Bookmark, Share), status Public/Private, dan moderasi komentar.', 'Heart', 15),
('notifications', 'Notifications', 'notifications', 'Pusat notifikasi interaktif, pengelompokan pesan sistem, sosial, dan administratif.', 'Bell', 16),
('system-settings', 'System Settings', 'system-settings', 'Konfigurasi global platform, logo aplikasi terpusat, favicon, dan kebijakan persetujuan konten.', 'Sliders', 17),
('privacy-security', 'Privacy & Security', 'privacy-security', 'Pengendalian privasi tingkat atribut (Public/Private), verifikasi akun, dan enkripsi data.', 'Shield', 18),
('help-center', 'Help Center & Support', 'help-center-support', 'Sistem tiket bantuan, laporan teknis, dan pusat layanan pengguna NightVerse.', 'MessageCircle', 19),
('updates-changelog', 'Updates & Changelog', 'updates-changelog', 'Catatan rilis resmi, perkembangan website dari versi awal hingga rilis terbaru.', 'History', 20)
ON CONFLICT (id) DO NOTHING;

-- Seed Official Documentation Articles (20 Articles)
INSERT INTO documentations (id, title, slug, category_id, summary, content, cover_image, status, version, author_id, author_name, author_role, display_order, steps, callouts, tags, created_at, updated_at, published_at) VALUES
('doc-getting-started-overview', 'Pengenalan Platform NightVerse', 'pengenalan-platform-nightverse', 'getting-started', 'Panduan lengkap mengenai visi, struktur antarmuka, dan fitur-fitur utama di ekosistem NightVerse.', 'NightVerse adalah platform kurasi dan penerbitan karya kreatif multimedia bernuansa cyberpunk dark neon yang menghubungkan para kreator digital di seluruh dunia.

Platform ini memadukan direktori karya visual (Photo & Animated GIF), media bergerak (Video Player & Embed), artikel mendalam (Blog), sistem taksonomi tag 5-kategori, sistem lencana kredensial (Badges Tier 0-5), dan direktori kreator dengan tampilan Visitor View profesional.

### Struktur Navigasi Utama:
1. **Explore Feed**: Beranda utama untuk menelusuri karya publik terkurasi secara visual.
2. **Creator Directory**: Direktori profil seluruh pengguna dan kreator NightVerse beserta peringkat Leaderboard.
3. **Create Work**: Ruang unggah karya mandiri yang dilengkapi fitur auto-detect Creative Title.
4. **Tags Directory**: Ensiklopedia taksonomi tag untuk mengelompokkan karya berdasarkan Hak Cipta, Karakter, Artis, Umum, dan Metadata.
5. **Help Center**: Pusat bantuan dan sistem tiket dukungan terintegrasi.
6. **Profile Settings**: Manajemen informasi profil, lencana, pengaturan privasi granular, dan pusat dokumentasi resmi.', 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 1, '[{"stepNumber":1,"title":"Eksplorasi Halaman Utama","description":"Buka menu Explore Feed untuk melihat konten visual terbaru dari seluruh kreator yang telah disetujui."},{"stepNumber":2,"title":"Interaksi dengan Kreator","description":"Klik kartu profil di Creator Directory untuk melihat Visitor View, mengikuti kreator, atau menyalin tautan profil."},{"stepNumber":3,"title":"Publikasi Karya Pertama","description":"Masuk ke menu Create Work, pilih kategori (Photo, Video, atau Blog), dan unggah aset media Anda."}]'::jsonb, '[{"type":"info","title":"Identitas Visual","text":"NightVerse dirancang dengan tema gelap cyberpunk interaktif dan performa tinggi berbasis IndexedDB."}]'::jsonb, ARRAY['getting-started', 'overview', 'navigation', 'ecosystem']::TEXT[], '2026-10-10T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-10T00:00:00.000Z'),
('doc-account-auth', 'Manajemen Akun & Autentikasi Pengguna', 'manajemen-akun-autentikasi', 'account-auth', 'Prosedur pendaftaran akun, login aman, peran akses (Roles), dan pemulihan kata sandi.', 'NightVerse menyediakan sistem autentikasi aman dengan pemisahan peran (*Role-Based Access Control*) yang jelas untuk menjaga integritas platform.

### Peran Pengguna (Roles):
- **SUPER_ADMIN**: Akses penuh ke seluruh parameter sistem, manajemen operator, penganugerahan badge, dan konfigurasi global.
- **ADMIN**: Pengelola direktori akun, moderasi konten, dan taksonomi tag.
- **MODERATOR**: Peninjau laporan pelanggaran dan verifikasi kelayakan konten publik.
- **USER**: Kreator dan penjelajah yang dapat menerbitkan karya, berinteraksi, dan mengumpulkan lencana.', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 2, '[{"stepNumber":1,"title":"Pendaftaran Akun","description":"Klik Sign Up untuk membuat akun baru dengan email dan kata sandi."},{"stepNumber":2,"title":"Masuk ke Sistem","description":"Gunakan kredensial terdaftar pada halaman login."}]'::jsonb, '[{"type":"tip","title":"Keamanan Sandi","text":"Gunakan kombinasi sandi yang kuat untuk melindungi karya Anda."}]'::jsonb, ARRAY['auth', 'login', 'roles', 'security']::TEXT[], '2026-10-10T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-10T00:00:00.000Z'),
('doc-profile-settings', 'Pengaturan Profil & Informasi Akun', 'pengaturan-profil-akun', 'profile-settings', 'Kustomisasi avatar, banner, bio narasi, minat, tautan media sosial, dan pusat dukungan.', 'Menu **Profile Settings** memungkinkan setiap pengguna mengatur identitas publik mereka secara mendetail. Anda dapat memperbarui foto profil, banner latar belakang, bio, hingga tautan media sosial (Twitter, Instagram, GitHub, YouTube, Discord, TikTok).', 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 3, '[{"stepNumber":1,"title":"Buka Profile Settings","description":"Klik menu Pengaturan Profil pada navigasi samping."},{"stepNumber":2,"title":"Edit Informasi","description":"Ubah bio, avatar, atau tautan sosial, lalu pratinjau sebelum menyimpan."}]'::jsonb, '[{"type":"info","title":"Pratinjau Instan","text":"Gunakan fitur Draft Preview untuk melihat tampilan profil Anda sebelum disimpan ke publik."}]'::jsonb, ARRAY['profile', 'settings', 'avatar', 'social']::TEXT[], '2026-10-12T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-12T00:00:00.000Z'),
('doc-creator-directory', 'Creator Directory & Visitor Profile View', 'creator-directory-visitor-view', 'creator-directory', 'Menjelajahi direktori kreator, jejaring pengikut, dan tampilan Visitor View yang bersih dari kontrol privat.', '**Creator Directory** adalah pusat jejaring untuk menemukan kreator berbakat di NightVerse. Saat Anda mengklik profil seorang kreator, sistem akan menampilkan **Visitor Profile View** murni di mana informasi internal seperti status privasi, tombol edit, atau pengaturan konfigurasi tersembunyi dari pandangan publik.', 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 4, '[{"stepNumber":1,"title":"Buka Creator Directory","description":"Pilih menu direktori dari sidebar."},{"stepNumber":2,"title":"Pilih Kreator","description":"Klik kartu kreator untuk melihat karya publik dan lencana mereka."}]'::jsonb, '[{"type":"tip","title":"Visitor View Murni","text":"Visitor View menampilkan karya publik, bio, lencana, dan statistik pengikut secara transparan."}]'::jsonb, ARRAY['directory', 'creators', 'visitor-view', 'network']::TEXT[], '2026-10-15T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-15T00:00:00.000Z'),
('doc-creator-dashboard', 'Creator Dashboard & Unified Upload Node', 'creator-dashboard-unified-upload', 'creator-dashboard', 'Memantau performa publikasi karya, statistik tayangan, dan sistem upload tunggal (Laptop/Mobile).', 'Creator Dashboard menyediakan ringkasan analitik komprehensif bagi kreator. Sejak rilis v2.7.0, NightVerse memperkenalkan **Unified Upload Node**, sebuah sistem pemilihan file tunggal yang secara otomatis mendeteksi apakah Anda menggunakan Laptop (Desktop) atau Perangkat Mobile.

### Fitur Unggulan:
- **Unified Video Upload**: Satu area untuk drag-and-drop desktop atau pemilihan galeri mobile.
- **Display Frame Protocol**: Tiga metode thumbnail; Upload Image, Capture Frame (mengambil gambar dari video), atau Online URL.
- **Alphabetical Tags**: Pengurutan tag A-Z secara otomatis pada registry pribadi.', 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 5, '[{"stepNumber":1,"title":"Akses Dashboard","description":"Buka Creator Dashboard dari menu utama."},{"stepNumber":2,"title":"Gunakan Upload Media","description":"Gunakan tombol Upload tunggal untuk video atau foto tanpa perlu memilih jenis perangkat."}]'::jsonb, '[{"type":"info","title":"Smart Ingest","text":"Sistem secara otomatis menyesuaikan alur pemrosesan berdasarkan format file yang diunggah."}]'::jsonb, ARRAY['dashboard', 'upload', 'unified', 'creators']::TEXT[], '2026-10-16T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-16T00:00:00.000Z'),
('doc-create-work', 'Create Work & Auto-Detect Creative Title', 'create-work-auto-title', 'create-work', 'Panduan publikasi karya blog, foto, dan video dengan fitur otomatisasi judul dari nama file media.', 'Fitur **Create Work** memudahkan kreator mempublikasikan karya baru. Dilengkapi dengan **Auto-Detect Creative Title**, sistem secara otomatis membaca nama file asli yang diunggah, menghapus ekstensi file, dan mengisikannya ke kolom judul secara instan.', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 6, '[{"stepNumber":1,"title":"Buka Create Work","description":"Pilih menu publikasi karya baru."},{"stepNumber":2,"title":"Unggah Media","description":"Pilih file gambar, video, atau buat artikel blog. Judul akan terisi otomatis."}]'::jsonb, '[{"type":"tip","title":"Efisiensi Upload","text":"Anda tetap dapat menyesuaikan judul otomatis sesuai kebutuhan sebelum menekan tombol publikasi."}]'::jsonb, ARRAY['create-work', 'upload', 'auto-title', 'media']::TEXT[], '2026-10-18T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-18T00:00:00.000Z'),
('doc-photo-management', 'Photo Management & Animasi GIF Tanpa Kompresi', 'photo-management-gif-support', 'photo-management', 'Ketentuan unggah foto dan dukungan penuh animasi GIF bergerak tanpa kehilangan frame asli.', 'Photo Management NightVerse mendukung berbagai format gambar termasuk **GIF Animasi**. Sistem mendeteksi format GIF secara otomatis dan mempertahankan seluruh frame, durasi animasi, serta looping asli tanpa konversi ke format statis.', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 7, '[{"stepNumber":1,"title":"Pilih Foto / GIF","description":"Unggah file gambar atau animasi GIF melalui Create Work."},{"stepNumber":2,"title":"Pratinjau Animasi","description":"Pastikan animasi GIF bergerak lancar pada pratinjau sebelum disimpan."}]'::jsonb, '[{"type":"info","title":"Zero-Loss GIF","text":"Kompresi tidak akan merusak frame animasi GIF asli Anda."}]'::jsonb, ARRAY['photos', 'gif', 'animation', 'images']::TEXT[], '2026-10-20T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-20T00:00:00.000Z'),
('doc-video-management', 'Video Management & Real-Time Quality Switching (H.264/AVC)', 'video-management-real-quality', 'video-management', 'Sistem pergantian resolusi video real-time, encoding H.264/AVC, timestamp continuity, dan Stats for Nerds HUD.', 'NightVerse v2.7.0 mengimplementasikan **Real-Time Video Quality Switching Engine**. Setiap resolusi video memiliki file rendition tersendiri hasil transcoding H.264/AVC yang langsung dialihkan saat dipilih penonton tanpa me-refresh halaman atau mengulang pemutaran dari detik 0.

### Fitur Kunci:
- **Real-Time Rendition Switching**: Beralih langsung ke file rendition target (1080p, 720p, 480p, 360p, 240p, 144p).
- **Seamless Timestamp Continuity**: Posisi pemutaran (timestamp detik) tetap dilanjutkan secara presisi dari titik terakhir.
- **State Preservation**: Status Play/Pause, volume, status mute, dan kecepatan pemutaran (playback speed) dipertahankan utuh.
- **Strict Rendition Availability**: Pilihan resolusi hanya diaktifkan apabila file rendition tersebut benar-benar tersedia dan tidak melebihi resolusi sumber.
- **Stats for Nerds / Telemetry HUD**: Menampilkan live decoded dimensions, viewport resolution, stream bitrate, codec H.264 High Profile, dan buffer health.', 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 8, '[{"stepNumber":1,"title":"Pilih Resolusi","description":"Buka menu Pengaturan ➔ Kualitas Video dan pilih resolusi yang diinginkan."},{"stepNumber":2,"title":"Pantau Transisi","description":"Indikator loading halus akan tampil sesaat selagi player menyelaraskan timestamp ke rendition baru."},{"stepNumber":3,"title":"Periksa Stats for Nerds","description":"Aktifkan toggle ''Stats for Nerds'' untuk memverifikasi dimensi render aktual dan bitrate stream."}]'::jsonb, '[{"type":"tip","title":"H.264 High Profile","text":"Semua rendition dikodekan menggunakan profil H.264 High Profile dengan faststart atom untuk pemutaran instan."},{"type":"info","title":"Tanpa Upscaling Palsu","text":"Resolusi yang melebihi resolusi sumber video asli secara otomatis disaring keluar demi integritas visual."}]'::jsonb, ARRAY['videos', 'h264', 'quality-switching', 'transcoding', 'telemetry']::TEXT[], '2026-10-22T00:00:00.000Z', '2026-11-07T11:20:00.000Z', '2026-10-22T00:00:00.000Z'),
('doc-blog-management', 'Blog Management & Artikel Kreatif', 'blog-management-articles', 'blog-management', 'Panduan penulisan artikel mendalam, manajemen draf, dan publikasi karya tulis kreatif.', 'Blog Management memungkinkan kreator menerbitkan artikel, ulasan karya, atau tutorial mendalam yang dilengkapi dengan penanda tag taksonomi dan thumbnail sampul menarik.', 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 9, '[{"stepNumber":1,"title":"Tulis Artikel","description":"Masukkan judul dan isi teks artikel pada menu Create Work."},{"stepNumber":2,"title":"Publikasikan","description":"Kirim artikel untuk ditinjau atau dipublikasikan langsung ke publik."}]'::jsonb, '[{"type":"info","title":"Cover Thumbnail","text":"Tambahkan thumbnail sampul agar artikel Anda lebih menarik di Explore Feed."}]'::jsonb, ARRAY['blogs', 'articles', 'writing', 'publishing']::TEXT[], '2026-10-23T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-23T00:00:00.000Z'),
('doc-explore-feed', 'Explore Feed & Kurasi Konten', 'explore-feed-curation', 'explore-feed', 'Menelusuri beranda utama dengan filter multi-media, pencarian tag instan, dan animasi GIF bergerak.', 'Explore Feed adalah pusat kurasi karya visual NightVerse. Pengguna dapat menyaring konten berdasarkan kategori media (All, Photos, Videos, Blogs) serta melakukan pencarian taksonomi tag secara instan.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 10, '[{"stepNumber":1,"title":"Buka Explore Feed","description":"Nikmati aliran karya visual terkurasi di beranda."},{"stepNumber":2,"title":"Gunakan Filter","description":"Pilih tab media untuk memfilter foto, video, atau artikel."}]'::jsonb, '[{"type":"tip","title":"GIF Bergerak Otomatis","text":"Seluruh animasi GIF pada feed diputar secara otomatis dan real-time."}]'::jsonb, ARRAY['explore', 'feed', 'curation', 'media']::TEXT[], '2026-10-24T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-24T00:00:00.000Z'),
('doc-content-lightbox', 'Content Lightbox & Interaksi Layar Penuh', 'content-lightbox-interaction', 'content-lightbox', 'Pratinjau media layar penuh, diskusi komentar real-time, dan penyematan tag interaktif.', 'Content Lightbox menyajikan karya dalam mode fokus layar penuh. Pengguna dapat melihat detail lengkap karya, berinteraksi melalui tombol Like, memberikan komentar real-time, serta mengeklik tag untuk menjelajahi karya sejenis.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 11, '[{"stepNumber":1,"title":"Buka Lightbox","description":"Klik salah satu kartu karya di Explore Feed."},{"stepNumber":2,"title":"Berikan Komentar","description":"Tulis tanggapan atau berikan Like pada panel interaksi."}]'::jsonb, '[{"type":"info","title":"Fokus Imersif","text":"Lightbox dirancang untuk memberikan pengalaman menikmati karya seni digital secara maksimal."}]'::jsonb, ARRAY['lightbox', 'comments', 'fullscreen', 'interaction']::TEXT[], '2026-10-24T12:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-24T12:00:00.000Z'),
('doc-tags-directory-taxonomy', 'Sistem Taksonomi 5-Kategori & Alphabetical Sorting', 'sistem-taksonomi-5-kategori-sorting', 'tags-directory', 'Struktur klasifikasi tag NightVerse dan pengurutan otomatis A-Z untuk konsistensi direktori.', 'Tags Directory adalah tulang punggung pengorganisasian metadata konten di NightVerse. Sejak rilis v2.7.0, seluruh tag secara otomatis diurutkan secara **Alphabetical (A-Z)** tanpa membedakan huruf besar/kecil.

### Lima Kategori Tag Utama:
1. **Copyright**: Nama karya cipta, franchise, judul anime, game, manga.
2. **General**: Atribut visual, pakaian, latar belakang, pose, atau objek.
3. **Artist**: Nama kreator atau ilustrator pembuat karya asli.
4. **Character**: Nama tokoh atau karakter spesifik.
5. **Metadata**: Informasi teknis terkait media (e.g. 4k, wallpaper).', 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 12, '[{"stepNumber":1,"title":"Buka Tags Directory","description":"Akses menu dari bilah navigasi."},{"stepNumber":2,"title":"Cari Tag","description":"Gunakan filter pencarian; daftar akan selalu terurut secara abjad."}]'::jsonb, '[{"type":"tip","title":"A-Z Consistency","text":"Pengurutan abjad memudahkan penemuan tag yang sudah ada dan mencegah duplikasi."}]'::jsonb, ARRAY['tags', 'taxonomy', 'sorting', 'alphabetical']::TEXT[], '2026-10-25T11:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-25T11:00:00.000Z'),
('doc-badges-system-tiers', 'Sistem Lencana Kredensial Berjenjang (Tier 0-5)', 'sistem-lencana-kredensial-berjenjang', 'badge-management', 'Struktur lencana kehormatan NightVerse dari Tier 0 (Member) hingga Tier 5 (Super Admin).', 'Sistem Badges NightVerse dirancang untuk menghargai kontribusi, pencapaian, dan otoritas tata kelola komunitas melalui lencana berjenjang dari Tier 0 hingga Tier 5.', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 13, '[{"stepNumber":1,"title":"Cek My Badge Center","description":"Buka profil untuk melihat lencana yang telah dibuka."}]'::jsonb, '[{"type":"info","title":"Otoritas Tier","text":"Setiap penganugerahan lencana dicatat dalam System Audit Log."}]'::jsonb, ARRAY['badges', 'tiers', 'achievements']::TEXT[], '2026-10-30T14:30:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-30T14:30:00.000Z'),
('doc-leaderboard', 'Creator Leaderboard & Peringkat Komunitas', 'creator-leaderboard-peringkat', 'leaderboard', 'Sistem peringkat kreator teratas berdasarkan metrik skor karya, views, dan keterlibatan.', 'Creator Leaderboard menampilkan kreator paling berpengaruh di platform berdasarkan jumlah publikasi, apresiasi publik (*likes*), dan keterlibatan pengikut.', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 14, '[{"stepNumber":1,"title":"Buka Leaderboard","description":"Akses peringkat kreator dari menu Creator Directory."}]'::jsonb, '[{"type":"tip","title":"Podium 3 Besar","text":"Kreator teratas menduduki podium khusus dengan lencana kehormatan."}]'::jsonb, ARRAY['leaderboard', 'ranking', 'creators', 'score']::TEXT[], '2026-10-31T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-10-31T00:00:00.000Z'),
('doc-engagement-visibility', 'Engagement & Visibility (Public / Private Controls)', 'engagement-visibility-controls', 'engagement-visibility', 'Pengendalian visibilitas karya (Public/Private), pengaturan komentar (Open/Muted), dan sinyal sosial.', 'Setiap kreator memiliki kendali penuh atas visibilitas karya mereka. Karya dapat diatur berstatus **Public** (tampil di Explore Feed untuk umum) atau **Private** (hanya dapat dilihat oleh pemilik akun).', 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 15, '[{"stepNumber":1,"title":"Atur Visibilitas","description":"Pilih status Public atau Private saat mengunggah atau menyunting karya."}]'::jsonb, '[{"type":"info","title":"Kontrol Penuh","text":"Privasi karya Anda dijamin aman sesuai preferensi akun."}]'::jsonb, ARRAY['visibility', 'engagement', 'privacy', 'social']::TEXT[], '2026-11-01T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-11-01T00:00:00.000Z'),
('doc-notifications', 'Notification Center & Pemberitahuan Real-Time', 'notification-center-realtime', 'notifications', 'Pusat pemberitahuan interaktif untuk aktivitas sosial, status moderasi karya, dan pengumuman sistem.', 'Notification Center memberikan informasi instan mengenai aktivitas akun Anda, termasuk ketika pengguna lain mengikuti Anda, memberikan *like*, berkomentar, atau status persetujuan karya dari moderator.', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 16, '[{"stepNumber":1,"title":"Buka Notifikasi","description":"Klik ikon lonceng pada bilah navigasi untuk melihat daftar aktivitas terbaru."}]'::jsonb, '[{"type":"tip","title":"Pembaruan Instan","text":"Pemberitahuan muncul secara real-time tanpa perlu memuat ulang halaman."}]'::jsonb, ARRAY['notifications', 'alerts', 'realtime', 'activity']::TEXT[], '2026-11-02T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-11-02T00:00:00.000Z'),
('doc-system-settings-synchronization', 'System Settings & Global Media Policy', 'system-settings-global-policy', 'system-settings', 'Pengelolaan identitas visual, favicon, kebijakan persetujuan otomatis, dan kontrol blur global.', 'Melalui **System Settings**, Super Administrator dapat mengelola identitas global NightVerse. 

### Fitur Pengaturan:
- **Media Approval Policy**: Atur apakah Photo, Video, atau Blog memerlukan persetujuan manual ADMIN atau dipublikasikan secara otomatis.
- **Creator Masterpieces Blur**: Aktifkan efek blur global pada kartu karya di seluruh profil kreator.
- **Unified Logo & Favicon**: Update branding website dari satu panel pusat.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 17, '[{"stepNumber":1,"title":"Buka System Settings","description":"Akses menu pengaturan sistem di Admin Workspace."},{"stepNumber":2,"title":"Konfigurasi Policy","description":"Ubah kebijakan moderasi atau efek blur sesuai kebutuhan platform."}]'::jsonb, '[{"type":"tip","title":"Real-time Sync","text":"Perubahan pengaturan langsung diterapkan secara global tanpa refresh."}]'::jsonb, ARRAY['system-settings', 'policy', 'blur', 'admin']::TEXT[], '2026-11-03T16:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-11-03T16:00:00.000Z'),
('doc-privacy-security', 'Privacy & Security (Audit Logs & Keamanan Data)', 'privacy-security-audit-logs', 'privacy-security', 'Pengendalian keamanan data, audit log aktivitas operator, dan enkripsi penyimpanan.', 'NightVerse memprioritaskan keamanan data dan privasi pengguna. Seluruh aksi administratif dan moderasi tercatat secara transparan di dalam *Audit Center* untuk memastikan akuntabilitas platform.', 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 18, '[{"stepNumber":1,"title":"Akses Audit Center","description":"Super Admin dapat meninjau log aktivitas sistem melalui menu Audit Center."}]'::jsonb, '[{"type":"info","title":"Transparansi Penuh","text":"Setiap perubahan penting dilacak dengan cap waktu dan nama operator."}]'::jsonb, ARRAY['security', 'audit', 'privacy', 'logs']::TEXT[], '2026-11-04T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-11-04T00:00:00.000Z'),
('doc-help-center-tickets', 'Help Center & Support Ticket System', 'help-center-support-tickets', 'help-center', 'Panduan pengiriman tiket bantuan, pelacakan status dukungan, dan komunikasi dengan tim NightVerse.', 'Sistem **Support Ticket** di NightVerse v2.7.0 memungkinkan pengguna melaporkan masalah teknis, bug, atau pertanyaan terkait akun secara langsung ke tim administrasi.

### Cara Kerja Tiket:
- **Subjek & Kategori**: Pilih kategori yang sesuai (Account, Bug Report, Payment, dll).
- **Prioritas**: Tentukan tingkat urgensi (Low, Medium, High, Urgent).
- **Lampiran**: Sertakan gambar atau file pendukung untuk memperjelas masalah.
- **Status Tiket**: Pantau status dari Open, In Progress, Waiting for User, hingga Resolved.', 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 19, '[{"stepNumber":1,"title":"Buka Help Center","description":"Pilih menu Help Center pada navigasi atau Profile Settings."},{"stepNumber":2,"title":"Contact Support","description":"Isi formulir tiket dan tekan Submit Ticket."},{"stepNumber":3,"title":"Pantau Tiket","description":"Cek riwayat tiket Anda untuk melihat balasan dari tim admin."}]'::jsonb, '[{"type":"info","title":"Unique Ticket ID","text":"Setiap tiket memiliki ID unik untuk pelacakan yang akurat."}]'::jsonb, ARRAY['help-center', 'support', 'tickets', 'contact']::TEXT[], '2026-11-06T05:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-11-06T05:00:00.000Z'),
('doc-updates-changelog', 'Updates & Changelog (Riwayat Perkembangan Platform)', 'updates-changelog-riwayat', 'updates-changelog', 'Catatan rilis resmi dari versi v1.0.0 hingga rilis terbaru v2.7.0.', 'Halaman ini mencatat seluruh pembaruan, peningkatan fitur, dan perbaikan bug yang telah dirilis oleh tim engineering NightVerse dari masa ke masa.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80', 'PUBLISHED', 'v2.7.0', 'superadmin', 'NightVerse Core Ops', 'SUPER_ADMIN', 20, '[{"stepNumber":1,"title":"Tinjau Changelog","description":"Buka dokumentasi Changelog untuk melihat detail fitur pada setiap versi."}]'::jsonb, '[{"type":"tip","title":"Selalu Update","text":"Platform terus dikembangkan untuk menghadirkan pengalaman terbaik."}]'::jsonb, ARRAY['changelog', 'updates', 'releases', 'version']::TEXT[], '2026-11-05T00:00:00.000Z', '2026-11-06T05:00:00.000Z', '2026-11-05T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- Seed Platform Changelogs (10 Releases)
INSERT INTO changelogs (id, version_number, release_title, release_date, summary, new_features, improvements, bug_fixes, breaking_changes, created_by, created_at) VALUES
('cl-v270', 'v2.7.0', 'Support Ticket System & High-Fidelity Video Engine', '2026-11-06', 'Pembaruan besar skala sistem dengan integrasi Support Ticket System, Real Video Quality (H.264/AVC), dan Unified Creator Dashboard.', '["Support Ticket System: Pengguna kini dapat mengirimkan tiket bantuan (Account, Tech, Bug, dll) melalui Help Center.","Ticket Center Admin Submenu: Panel khusus di Admin Workspace untuk mengelola tiket dukungan dengan pelacakan status Open ➔ Resolved.","High-Fidelity Video Engine: Dukungan encoding H.264/AVC nyata dengan rendition multi-kualitas (144p hingga 1080p).","Unified Media Upload: Satu node upload tunggal untuk laptop dan mobile dengan deteksi perangkat otomatis.","Display Frame Protocol: Tiga metode penentuan thumbnail (Upload Image, Capture Frame from Video, Online URL).","Alphabetical Tags Registry: Seluruh tag kini otomatis terurut A-Z secara case-insensitive platform-wide."]'::jsonb, '["Real-Time Rendition Switching: Player langsung beralih ke file rendition target (1080p, 720p, 480p, 360p, 240p, 144p) tanpa restart atau memuat ulang halaman.","Timestamp Continuity: Posisi detik pemutaran, status play/pause, volume, mute, dan speed dipertahankan secara mulus saat berganti resolusi.","Stats for Nerds HUD: Menampilkan live decoded dimensions, bitrate, codec AVC, buffer health, dan active rendition URL.","Update dokumentasi resmi ke versi v2.7.0 untuk seluruh 20 kategori sistem.","Pemisahan buffer state untuk thumbnail foto dan video guna mencegah tumpang tindih data.","Integrasi About Application dengan status versi dokumentasi terbaru."]'::jsonb, '["Memperbaiki bug di mana player memutar URL file HD yang sama ketika resolusi rendah (720p/480p/360p) dipilih.","Memperbaiki bug reset currentTime ke detik 0 saat mengganti sumber video di HTML5 player.","Memperbaiki masalah kompresi thumbnail yang menyebabkan hilangnya frame pada animasi GIF.","Mengatasi bug z-index pada tag autocomplete dropdown di dashboard."]'::jsonb, '["SourceType ''LAPTOP'' dan ''MOBILE'' kini dikonsolidasikan ke dalam ''UPLOAD'' untuk kompatibilitas dashboard baru."]'::jsonb, 'Super Admin (NightVerse Core)', '2026-11-06T05:00:00.000Z'),
('cl-v260', 'v2.6.0', 'Creator Masterpieces Blur Effect & Global System Controls', '2026-11-06', 'Peluncuran fitur pengontrol global Creator Masterpieces Blur Effect di System Settings untuk memberikan efek blur pada media visual di profil kreator.', '["Creator Masterpieces Blur Effect: Pengaturan global di System Settings untuk mengaktifkan atau menonaktifkan efek blur pada thumbnail foto, video, dan sampul blog di kartu karya kreator.","Sinkronisasi real-time instan tanpa memerlukan muat ulang halaman."]'::jsonb, '["Penyempurnaan kelengkapan artikel dokumentasi resmi untuk seluruh 19 kategori sistem NightVerse.","Optimalisasi pemfilteran media visual pada profil kreator."]'::jsonb, '["Memperbaiki penanganan state pengaturan global pada database layer."]'::jsonb, '[]'::jsonb, 'Super Admin (NightVerse Core)', '2026-11-06T02:37:00.000Z'),
('cl-v250', 'v2.5.0', 'Instant Tags Taxonomy Migration & Live Category Preview Engine', '2026-11-06', 'Pembaruan arsitektur sinkronisasi taksonomi Tags Directory dengan pemindahan kategori instan, counter dinamis real-time, Live Category Preview pada modal edit, dan desain modal yang compact & scrollable.', '["Instant Category Type Update: Tag langsung berpindah ke kategori baru seketika setelah disimpan tanpa perlu membuka submenu lain atau menekan tombol Sort.","Realtime Category Counter Engine: Angka total tag dan jumlah tiap kategori (Copyright, General, Artist, Character, Metadata, Pending, All) langsung sinkron dalam satu siklus render.","Live Category Preview pada modal Add / Edit Tag: Pratinjau langsung pill tag, badge kategori tujuan, dan indikator alur perpindahan ([Kategori Asal] ➔ [Kategori Sasaran]) sebelum disimpan.","Compact & Scrollable Tag Configuration Modal: Desain modal proporsional dengan max-h-[85vh] dan overflow-y-auto untuk kenyamanan di seluruh resolusi layar."]'::jsonb, '["Immutabilitas data pada DB layer (db.tags.getAll, db.tags.update) untuk mencegah retensi referensi array di memory cache.","Mekanisme rollback otomatis jika terjadi kegagalan penyimpanan ke database lokal.","Integrasi event-driven listener nightverse_tags_updated pada Admin Workspace."]'::jsonb, '["Memperbaiki bug kategori lama yang masih tertinggal setelah Admin mengubah kategori tag dan menekan Save Changes.","Mengatasi modal konfigurasi tag yang terlalu panjang dan terpotong di layar perangkat kecil."]'::jsonb, '[]'::jsonb, 'Super Admin (NightVerse Core)', '2026-11-06T02:15:00.000Z'),
('cl-v240', 'v2.4.0', 'Documentation Center & Knowledge Architecture', '2026-11-06', 'Peluncuran resmi Documentation Center NightVerse, Documentation Management di Admin Workspace, dan pelacakan versi riwayat revisi.', '["Pusat Dokumentasi Resmi (Documentation Center) dengan 19 kategori sistem NightVerse.","Menu Documentation Management di Admin Workspace untuk Super Admin dan Admin.","Rich Documentation Editor dengan dukungan heading, gambar, callout, langkah tutorial, dan tabel.","Sistem pelacakan riwayat revisi (Documentation Versioning) dan fitur restorasi versi.","Pencarian dokumentasi cepat dengan filter kategori dan pengurutan artikel."]'::jsonb, '["Struktur menu Informasi & Dukungan menjadi 4 submenu terorganisir: Help Center, Documentation, FAQ, dan About Application.","Integrasi navigasi breadcrumb dan Table of Contents dinamis untuk membaca artikel panjang.","Dukungan tampilan dokumentasi responsif penuh pada desktop, tablet, dan smartphone."]'::jsonb, '["Memperbaiki sinkronisasi realtime pada pratinjau draf dokumentasi sebelum diterbitkan.","Mencegah konflik slug pada artikel dokumentasi berstatus draf."]'::jsonb, '[]'::jsonb, 'Super Admin (NightVerse Core)', '2026-11-06T01:00:00.000Z'),
('cl-v230', 'v2.3.0', 'Advanced Video Player & Clean Visitor View', '2026-11-06', 'Redesign pemutar video modern dengan Non-Autoplay default serta penerapan arsitektur Visitor View pada Creator Directory.', '["Modern Video Player dengan kebijakan Non-Autoplay ketat dan tombol Play pusat berukuran besar.","Bilah kontrol video lengkap: Play/Pause, Skip -10s, Skip +10s, progress scrubber, volume, PiP, dan Fullscreen.","Menu popover pengaturan video dengan pilihan kecepatan pemutaran (0.5x - 2.0x) dan deteksi kualitas resolusi asli.","Arsitektur Visitor Profile View murni pada Creator Directory tanpa label konfigurasi privasi internal."]'::jsonb, '["Penyembunyian bersih pada data privat (telepon/email) tanpa menyisakan ruang kosong atau placeholder.","Pemisahan tegas antara Visitor View direktori dan Owner View di Profile Settings."]'::jsonb, '["Memperbaiki bug autoplay video pada Content Lightbox di perangkat mobile.","Memperbaiki penanganan callback onClose pada modal konfirmasi penghapusan tag."]'::jsonb, '[]'::jsonb, 'Super Admin (NightVerse Core)', '2026-11-06T00:00:00.000Z'),
('cl-v220', 'v2.2.0', 'Zero-Loss Animated GIF Support & Auto-Detect Title', '2026-11-05', 'Dukungan penuh animasi GIF tanpa kehilangan frame dan fitur pendeteksi judul otomatis dari nama file media.', '["Fitur Auto-Detect Creative Title yang membaca nama file asli media yang diunggah dari laptop maupun HP.","Dukungan animasi GIF asli tanpa kompresi kanvas statis (Direct Frame Bypass) pada Create Work dan Explore Feed.","Sinkronisasi logo aplikasi terpusat antara System Settings dan About Application."]'::jsonb, '["Pembersihan otomatis ekstensi file (.jpg, .png, .mp4, .webp, .gif) pada input Creative Title.","Optimalisasi kinerja rendering feed saat memutar beberapa animasi GIF secara simultan."]'::jsonb, '["Mengatasi masalah animasi GIF yang macet atau berubah menjadi gambar diam di feed.","Memperbaiki hilangnya frame animasi GIF saat proses kompresi foto."]'::jsonb, '[]'::jsonb, 'NightVerse Engineering', '2026-11-05T08:00:00.000Z'),
('cl-v210', 'v2.1.0', 'Dynamic Badges Engine & Creator Leaderboard', '2026-10-30', 'Sistem lencana kredensial 6 tingkatan (Tier 0-5), penganugerahan real-time, dan leaderboard kreator teratas.', '["Sistem lencana berjenjang (Role Badges, Community Badges, Achievement Badges).","Alat Super Admin untuk mendefinisikan, menganugerahkan, dan mencabut badge pengguna.","Creator Leaderboard dengan sistem skor terintegrasi dan podium 3 besar."]'::jsonb, '["Tampilan Role Badge dengan palet warna neon khas NightVerse.","Audit log lengkap untuk setiap transaksi penganugerahan dan pencabutan lencana."]'::jsonb, '["Memperbaiki inkonsistensi tier badge pada kartu direktori pengguna."]'::jsonb, '[]'::jsonb, 'NightVerse Engineering', '2026-10-30T10:00:00.000Z'),
('cl-v200', 'v2.0.0', 'Tags Directory 5-Type Taxonomy & Ambiguity Tagging', '2026-10-25', 'Peluncuran Tags Directory lengkap dengan taksonomi 5 kategori, penanda tag ambigu, dan brankas pemulihan.', '["Sistem klasifikasi 5 kategori: Copyright, General, Artist, Character, dan Metadata.","Status Ambiguous Tag dengan indikator (?) untuk penandaan tag multitafsir.","Fitur pencarian, filter kategori, pengurutan abjad, dan pratinjau tag pada konten.","Manajemen tag massal dan Supervisor Purge Vault untuk pemulihan tag terhapus."]'::jsonb, '["Pemisahan visual warna badge tag berdasarkan kategori di Content Lightbox.","Sinkronisasi real-time penambahan, penyuntingan, dan penghapusan tag ke database."]'::jsonb, '["Memperbaiki bug tag baru yang tidak langsung muncul pada Tags Directory setelah disimpan."]'::jsonb, '[]'::jsonb, 'NightVerse Engineering', '2026-10-25T12:00:00.000Z'),
('cl-v150', 'v1.5.0', 'Creator Hub & Multimedia Feeds', '2026-10-18', 'Eksplorasi feed multimedia, fitur unggah karya visual (Photo, Video, Blog), dan interaksi sinyal sosial.', '["Dukungan multi-media pada Explore Feed dengan filter kategori.","Alur formulir Create Work untuk Blog, Foto, dan Video.","Sinyal interaksi sosial: Like, Favorite, Bookmark, dan Share."]'::jsonb, '["Pratinjau rasio aspek dinamis (16:9, 9:16, 1:1, 4:3) pada kartu karya."]'::jsonb, '["Pencegahan scroll latar belakang saat modal karya dibuka."]'::jsonb, '[]'::jsonb, 'NightVerse Engineering', '2026-10-18T09:00:00.000Z'),
('cl-v100', 'v1.0.0', 'NightVerse Platform Foundation', '2026-10-10', 'Rilis perdana platform NightVerse: autentikasi, manajemen profil, tema dark navy cyberpunk, dan role-based access control.', '["Sistem Autentikasi dan Registrasi Akun Pengguna.","Dukungan peran: SUPER_ADMIN, ADMIN, MODERATOR, dan USER.","Halaman Profile Settings dengan pengaturan privasi granular.","Dashboard Layout responsif dengan tema visual dark cyberpunk."]'::jsonb, '["Penyimpanan lokal terindeks berkapasitas tinggi via IndexedDB."]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'NightVerse Core', '2026-10-10T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 7. RECORD MIGRATION VERSION
-- ------------------------------------------------------------------------------
INSERT INTO schema_migrations (version, description)
VALUES ('20261121_001_nightverse_full_migration', 'Full idempotent NightVerse schema, columns, indexes, RLS policies, Realtime, and seed data')
ON CONFLICT (version) DO NOTHING;

-- ==============================================================================
-- End of NightVerse Unified Supabase Migration SQL
-- ==============================================================================
