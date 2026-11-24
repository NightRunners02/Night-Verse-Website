-- ==============================================================================
-- 🌌 NightVerse Fresh Drop & Recreate Supabase Migration SQL (PostgreSQL 15+)
-- Safe to Run Directly in Supabase SQL Editor (Clean JSONB syntax)
-- ==============================================================================

-- 1. DROP EXISTING TABLES (In Reverse Dependency Order)
DROP TABLE IF EXISTS ticket_messages CASCADE;
DROP TABLE IF EXISTS support_tickets CASCADE;
DROP TABLE IF EXISTS changelogs CASCADE;
DROP TABLE IF EXISTS doc_revisions CASCADE;
DROP TABLE IF EXISTS documentations CASCADE;
DROP TABLE IF EXISTS doc_categories CASCADE;
DROP TABLE IF EXISTS badge_awards CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
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
DROP TABLE IF EXISTS schema_migrations CASCADE;

-- 2. MIGRATION TRACKING TABLE
CREATE TABLE schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CREATE CORE TABLES (All 19 NightVerse Tables)

CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT TRUE,
    profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE blogs (
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

CREATE TABLE photos (
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

CREATE TABLE videos (
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

CREATE TABLE tags (
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

CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT,
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE notifications (
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

CREATE TABLE reports (
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

CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    operator TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE system_settings (
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
    allowed_formats JSONB NOT NULL DEFAULT '["jpg", "jpeg", "png", "gif", "mp4", "mov"]'::jsonb,
    smtp_host TEXT DEFAULT 'smtp.nightverse.com',
    smtp_port INT DEFAULT 587,
    enable_email_verification BOOLEAN NOT NULL DEFAULT TRUE,
    enable_push_notifications BOOLEAN NOT NULL DEFAULT FALSE,
    enable_realtime_stream BOOLEAN NOT NULL DEFAULT TRUE,
    enable_floating_toasts BOOLEAN NOT NULL DEFAULT TRUE,
    creator_masterpieces_blur BOOLEAN NOT NULL DEFAULT FALSE,
    explore_items_per_page INT NOT NULL DEFAULT 12,
    media_approval JSONB NOT NULL DEFAULT '{"photo": true, "video": false, "blog": true}'::jsonb
);

CREATE TABLE badges (
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

CREATE TABLE badge_awards (
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

CREATE TABLE doc_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE documentations (
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

CREATE TABLE doc_revisions (
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

CREATE TABLE changelogs (
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

CREATE TABLE support_tickets (
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

CREATE TABLE ticket_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_blogs_user_id ON blogs(user_id);
CREATE INDEX idx_photos_user_id ON photos(user_id);
CREATE INDEX idx_videos_user_id ON videos(user_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_comments_content ON comments(content_type, content_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id, is_read);
CREATE INDEX idx_reports_status ON reports(status, is_resolved);
CREATE INDEX idx_logs_timestamp ON logs(timestamp DESC);
CREATE INDEX idx_badges_status ON badges(status, tier DESC);
CREATE INDEX idx_badge_awards_user_id ON badge_awards(user_id);
CREATE INDEX idx_documentations_category ON documentations(category_id, status);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id, status);
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id, created_at);

-- 5. RLS & PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

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
        EXECUTE format(
            'CREATE POLICY "nightverse_api_access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);',
            tbl
        );
    END LOOP;
END $$;

-- 6. INITIAL SEED DATA
INSERT INTO users (id, email, username, password_hash, role, is_suspended, email_verified, profile, created_at)
VALUES
('admin-1', 'superadmin@nightverse.com', 'NightAdmin', '73fd106ed862a5e4402ad49b98430c3e7f162b48834abea84bd53c61f5e5640c', 'SUPER_ADMIN', FALSE, TRUE, '{"fullName": "System Overseer", "bio": "Root administrator for the NightVerse ecosystem.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin", "activeBadge": "Super Admin", "badges": ["Super Admin", "Administrator"]}'::jsonb, '2026-01-01T00:00:00.000Z'),
('user-1', 'neon_shadow@nightverse.com', 'neon_shadow', '6fd0ae5092a6c7a0e8189005dc9e9ffab8b098fd1e26f1e0e3cb35d9011b44aa', 'USER', FALSE, TRUE, '{"fullName": "Visual Photographer", "bio": "Capturing the dark cyber landscapes.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=neon_shadow", "activeBadge": "Verified Creator", "badges": ["Verified Creator", "Contributor"]}'::jsonb, '2026-01-01T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO system_settings (id, website_name, logo_text, primary_color, secondary_color, hero_title, hero_subtitle)
VALUES (1, 'NightVerse', 'NIGHTVERSE', 'purple-600', 'cyan-400', 'Universal Hub for Modern Masters', 'Welcome to the future of creative collaboration.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO schema_migrations (version, description)
VALUES ('20261124_fixed_json_syntax', 'Fixed JSONB literal syntax in schema.sql')
ON CONFLICT (version) DO NOTHING;
