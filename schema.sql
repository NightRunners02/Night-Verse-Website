-- ==============================================================================
-- NightVerse Unified Supabase PostgreSQL Schema & Realtime Migration SQL
-- PostgreSQL 15+ / Supabase SQL Editor Ready (Idempotent & Clean JSONB Syntax)
-- ==============================================================================

-- 1. MIGRATION TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.schema_migrations (
    version TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CORE TABLES (All 19 NightVerse Tables)

CREATE TABLE IF NOT EXISTS public.users (
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

CREATE TABLE IF NOT EXISTS public.blogs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
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

CREATE TABLE IF NOT EXISTS public.photos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    source_type TEXT NOT NULL DEFAULT 'URL',
    url TEXT NOT NULL DEFAULT '',
    thumbnail_url TEXT DEFAULT '',
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

CREATE TABLE IF NOT EXISTS public.videos (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_avatar TEXT DEFAULT '',
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    source_type TEXT NOT NULL DEFAULT 'URL',
    url TEXT NOT NULL DEFAULT '',
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

CREATE TABLE IF NOT EXISTS public.tags (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL DEFAULT 'General',
    is_ambiguous BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'APPROVED',
    created_by TEXT DEFAULT 'NightAdmin',
    usage_count INT NOT NULL DEFAULT 0,
    count INT NOT NULL DEFAULT 0,
    growth_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
    most_active_username TEXT DEFAULT 'NightAdmin',
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

CREATE TABLE IF NOT EXISTS public.comments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    avatar_url TEXT DEFAULT '',
    content TEXT NOT NULL,
    content_type TEXT NOT NULL,
    content_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.follows (
    follower_id TEXT NOT NULL,
    following_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    triggered_by_id TEXT,
    triggered_by_name TEXT,
    triggered_by_avatar TEXT,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'SYSTEM',
    type TEXT NOT NULL DEFAULT 'INFO',
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

CREATE TABLE IF NOT EXISTS public.reports (
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
    description TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'OPEN',
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    operator TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_settings (
    id INT PRIMARY KEY DEFAULT 1,
    website_name TEXT NOT NULL DEFAULT 'NightVerse',
    logo_text TEXT NOT NULL DEFAULT 'NIGHTVERSE',
    logo_url TEXT,
    favicon_emoji TEXT DEFAULT '🌌',
    favicon_url TEXT DEFAULT '/favicon.svg',
    favicon_updated_at BIGINT DEFAULT 0,
    primary_color TEXT DEFAULT 'purple-600',
    secondary_color TEXT DEFAULT 'cyan-400',
    homepage_banner TEXT DEFAULT 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1500',
    hero_title TEXT DEFAULT 'Universal Hub for Modern Masters',
    hero_subtitle TEXT DEFAULT 'Welcome to the future of creative collaboration. Empowering neon creators, visual designers, and sound artists worldwide.',
    footer_text TEXT DEFAULT '© 2026 NightVerse Enterprise. All Rights Reserved.',
    seo_description TEXT DEFAULT 'NightVerse - The premier creative portfolio platform.',
    seo_keywords TEXT DEFAULT 'cyberpunk, designer portfolio, neon artistry',
    og_image TEXT DEFAULT 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200',
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

CREATE TABLE IF NOT EXISTS public.badges (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'ROLE',
    tier INT NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    requirement TEXT NOT NULL DEFAULT '',
    color TEXT,
    bg_color TEXT,
    border_color TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badge_awards (
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

CREATE TABLE IF NOT EXISTS public.doc_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.documentations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category_id TEXT NOT NULL REFERENCES public.doc_categories(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    cover_image TEXT,
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    version TEXT NOT NULL DEFAULT 'v2.7.0',
    author_id TEXT NOT NULL DEFAULT 'admin-1',
    author_name TEXT NOT NULL DEFAULT 'NightAdmin',
    author_role TEXT DEFAULT 'SUPER_ADMIN',
    display_order INT NOT NULL DEFAULT 0,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    callouts JSONB NOT NULL DEFAULT '[]'::jsonb,
    tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.doc_revisions (
    id TEXT PRIMARY KEY,
    documentation_id TEXT NOT NULL REFERENCES public.documentations(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    previous_content TEXT NOT NULL DEFAULT '',
    updated_content TEXT NOT NULL DEFAULT '',
    editor_id TEXT NOT NULL,
    editor_name TEXT NOT NULL,
    editor_role TEXT NOT NULL,
    revision_number INT NOT NULL DEFAULT 1,
    change_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.changelogs (
    id TEXT PRIMARY KEY,
    version_number TEXT NOT NULL,
    release_title TEXT NOT NULL,
    release_date TEXT NOT NULL,
    summary TEXT,
    new_features JSONB NOT NULL DEFAULT '[]'::jsonb,
    improvements JSONB NOT NULL DEFAULT '[]'::jsonb,
    bug_fixes JSONB NOT NULL DEFAULT '[]'::jsonb,
    breaking_changes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT NOT NULL DEFAULT 'Super Admin',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.support_tickets (
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

CREATE TABLE IF NOT EXISTS public.ticket_messages (
    id TEXT PRIMARY KEY,
    ticket_id TEXT NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    message TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. FORWARD-COMPATIBLE COLUMN ENSURE (Safe when re-running on existing tables)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS video_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS renditions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS codec TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS frame_rate DOUBLE PRECISION DEFAULT 30;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'COMPLETED';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_external BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS external_provider TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS embed_url TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS external_reference TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS website_name TEXT NOT NULL DEFAULT 'NightVerse';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS logo_text TEXT NOT NULL DEFAULT 'NIGHTVERSE';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS favicon_emoji TEXT DEFAULT '🌌';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS favicon_url TEXT DEFAULT '/favicon.svg';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS favicon_updated_at BIGINT DEFAULT 0;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT 'purple-600';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT 'cyan-400';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS homepage_banner TEXT DEFAULT 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1500';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS hero_title TEXT DEFAULT 'Universal Hub for Modern Masters';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS hero_subtitle TEXT DEFAULT 'Welcome to the future of creative collaboration. Empowering neon creators, visual designers, and sound artists worldwide.';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS footer_text TEXT DEFAULT '© 2026 NightVerse Enterprise. All Rights Reserved.';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS seo_description TEXT DEFAULT 'NightVerse - The premier creative portfolio platform.';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS seo_keywords TEXT DEFAULT 'cyberpunk, designer portfolio, neon artistry';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS og_image TEXT DEFAULT 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=1200';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS max_image_size_mb INT NOT NULL DEFAULT 10;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS max_video_size_mb INT NOT NULL DEFAULT 100;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS allowed_formats JSONB NOT NULL DEFAULT '["jpg", "jpeg", "png", "gif", "mp4", "mov"]'::jsonb;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS smtp_host TEXT DEFAULT 'smtp.nightverse.com';
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS smtp_port INT DEFAULT 587;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS enable_email_verification BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS enable_push_notifications BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS enable_realtime_stream BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS enable_floating_toasts BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS creator_masterpieces_blur BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS explore_items_per_page INT NOT NULL DEFAULT 12;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS media_approval JSONB NOT NULL DEFAULT '{"photo": true, "video": false, "blog": true}'::jsonb;

-- 4. AUTO-UPDATE UPDATED_AT TRIGGERS
CREATE OR REPLACE FUNCTION public.nightverse_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.nightverse_set_updated_at();

DROP TRIGGER IF EXISTS trg_tags_updated_at ON public.tags;
CREATE TRIGGER trg_tags_updated_at
BEFORE UPDATE ON public.tags
FOR EACH ROW EXECUTE FUNCTION public.nightverse_set_updated_at();

DROP TRIGGER IF EXISTS trg_documentations_updated_at ON public.documentations;
CREATE TRIGGER trg_documentations_updated_at
BEFORE UPDATE ON public.documentations
FOR EACH ROW EXECUTE FUNCTION public.nightverse_set_updated_at();

DROP TRIGGER IF EXISTS trg_support_tickets_updated_at ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.nightverse_set_updated_at();

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_blogs_user_id ON public.blogs(user_id);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON public.blogs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_user_id ON public.photos(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_status ON public.photos(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_user_id ON public.videos(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON public.videos(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tags_name ON public.tags(name);
CREATE INDEX IF NOT EXISTS idx_comments_content ON public.comments(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status, is_resolved);
CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON public.logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_badges_status ON public.badges(status, tier DESC);
CREATE INDEX IF NOT EXISTS idx_badge_awards_user_id ON public.badge_awards(user_id);
CREATE INDEX IF NOT EXISTS idx_documentations_category ON public.documentations(category_id, status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id, created_at);

-- 6. RLS & API PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_awards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doc_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.changelogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

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
        EXECUTE format('DROP POLICY IF EXISTS "nightverse_api_access" ON public.%I;', tbl);
        EXECUTE format(
            'CREATE POLICY "nightverse_api_access" ON public.%I FOR ALL TO anon, authenticated, service_role USING (true) WITH CHECK (true);',
            tbl
        );
    END LOOP;
END $$;

-- 7. SUPABASE REALTIME PUBLICATION & REPLICA IDENTITY FULL
DO $$
DECLARE
    tbl TEXT;
    realtime_tables TEXT[] := ARRAY[
        'users', 'blogs', 'photos', 'videos', 'tags',
        'comments', 'follows', 'notifications', 'reports', 'logs',
        'system_settings', 'badges', 'badge_awards', 'doc_categories',
        'documentations', 'doc_revisions', 'changelogs', 'support_tickets',
        'ticket_messages'
    ];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;

    FOREACH tbl IN ARRAY realtime_tables LOOP
        EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL;', tbl);
        IF NOT EXISTS (
            SELECT 1
            FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = tbl
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I;', tbl);
        END IF;
    END LOOP;
END $$;

-- 8. COMPLETE SEED DATA (Matches db.ts Defaults)
INSERT INTO public.users (id, email, username, password_hash, role, is_suspended, email_verified, profile, created_at)
VALUES
('admin-1', 'superadmin@nightverse.com', 'NightAdmin', '73fd106ed862a5e4402ad49b98430c3e7f162b48834abea84bd53c61f5e5640c', 'SUPER_ADMIN', FALSE, TRUE, '{"fullName": "System Overseer", "bio": "Root administrator for the NightVerse ecosystem.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=admin", "activeBadge": "Super Admin", "badges": ["Super Admin", "Administrator"]}'::jsonb, '2026-01-01T00:00:00.000Z'),
('admin-2', 'admin@nightverse.com', 'ExecAdmin', '73fd106ed862a5e4402ad49b98430c3e7f162b48834abea84bd53c61f5e5640c', 'ADMIN', FALSE, TRUE, '{"fullName": "Executive Admin", "bio": "Executive administrator of NightVerse.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=exec", "activeBadge": "Administrator", "badges": ["Administrator"]}'::jsonb, '2026-01-01T00:00:00.000Z'),
('mod-1', 'mod@nightverse.com', 'ModLead', '1dccc873e0b2ef078d64dcd06535c941f21fe34eec621aed52d3f8cffa5a6c38', 'MODERATOR', FALSE, TRUE, '{"fullName": "Moderations Lead", "bio": "Content moderation lead.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=mod", "activeBadge": "Moderator", "badges": ["Moderator"]}'::jsonb, '2026-01-01T00:00:00.000Z'),
('user-1', 'neon_shadow@nightverse.com', 'neon_shadow', '6fd0ae5092a6c7a0e8189005dc9e9ffab8b098fd1e26f1e0e3cb35d9011b44aa', 'USER', FALSE, TRUE, '{"fullName": "Visual Photographer", "bio": "Capturing the dark cyber landscapes.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=neon_shadow", "activeBadge": "Verified Creator", "badges": ["Verified Creator", "Contributor"]}'::jsonb, '2026-01-01T00:00:00.000Z'),
('user-2', 'pixel_dreamer@nightverse.com', 'pixel_dreamer', '6fd0ae5092a6c7a0e8189005dc9e9ffab8b098fd1e26f1e0e3cb35d9011b44aa', 'USER', FALSE, TRUE, '{"fullName": "Cyber Illustrator", "bio": "Painting dreams in bright pixels.", "avatarUrl": "https://api.dicebear.com/7.x/avataaars/svg?seed=pixel_dreamer", "activeBadge": "Contributor", "badges": ["Contributor"]}'::jsonb, '2026-01-01T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.system_settings (
    id, website_name, logo_text, logo_url, favicon_emoji, favicon_url, favicon_updated_at,
    primary_color, secondary_color, homepage_banner, hero_title, hero_subtitle,
    footer_text, seo_description, seo_keywords, og_image,
    max_image_size_mb, max_video_size_mb, allowed_formats,
    smtp_host, smtp_port, enable_email_verification, enable_push_notifications,
    enable_realtime_stream, enable_floating_toasts, creator_masterpieces_blur,
    explore_items_per_page, media_approval
)
VALUES (
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
    TRUE,
    FALSE,
    12,
    '{"photo": true, "video": false, "blog": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.badges (id, name, icon, description, category, tier, status, requirement, color, bg_color, border_color, created_at)
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

INSERT INTO public.badge_awards (id, user_id, username, badge_id, badge_name, badge_tier, granted_by_id, granted_by_username, granted_by_role, granted_at, reason, status)
VALUES
('award-seed-1', 'admin-1', 'NightAdmin', 'super-admin', 'Super Admin', 5, 'admin-1', 'RootSystem', 'SUPER_ADMIN', '2026-01-01T00:00:00.000Z', 'Genesis Root Administrator Key', 'SUCCESS'),
('award-seed-2', 'admin-1', 'NightAdmin', 'administrator', 'Administrator', 4, 'admin-1', 'RootSystem', 'SUPER_ADMIN', '2026-01-01T00:00:00.000Z', 'Platform Administrator Accolade', 'SUCCESS'),
('award-seed-3', 'user-1', 'neon_shadow', 'verified-creator', 'Verified Creator', 2, 'admin-1', 'NightAdmin', 'SUPER_ADMIN', '2026-01-15T12:00:00.000Z', 'High quality photography portfolio verified', 'SUCCESS'),
('award-seed-4', 'user-2', 'pixel_dreamer', 'contributor', 'Contributor', 1, 'admin-1', 'NightAdmin', 'SUPER_ADMIN', '2026-01-20T10:30:00.000Z', 'Active participation in creative visual forums', 'SUCCESS')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.tags (id, name, type, is_ambiguous, status, created_by, usage_count, count, growth_rate, most_active_username)
VALUES
('tag-1', 'cyberpunk', 'General', FALSE, 'APPROVED', 'NightAdmin', 42, 42, 15, 'NightAdmin'),
('tag-2', 'neon', 'General', FALSE, 'APPROVED', 'NightAdmin', 38, 38, 12, 'NightAdmin'),
('tag-3', 'slippery', 'Artist', FALSE, 'APPROVED', 'NightAdmin', 15, 15, 10, 'NightAdmin'),
('tag-4', 'minecraft', 'Copyright', FALSE, 'APPROVED', 'NightAdmin', 22, 22, 8, 'NightAdmin'),
('tag-5', 'jenny belle', 'Character', TRUE, 'APPROVED', 'NightAdmin', 11, 11, 5, 'NightAdmin'),
('tag-6', 'futuristic', 'General', FALSE, 'APPROVED', 'NightAdmin', 25, 25, 8, 'NightAdmin'),
('tag-7', '4k', 'Metadata', FALSE, 'APPROVED', 'NightAdmin', 18, 18, 6, 'NightAdmin')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.videos (
    id, user_id, author_name, author_avatar, title, description, source_type, url,
    video_urls, renditions, thumbnail_url, duration, resolution, aspect_ratio,
    codec, frame_rate, file_size, processing_status, is_external, tags, status,
    visibility, engagement, allow_comments, category, views, likes_count, liked_by, created_at
)
VALUES (
    'seed-video-cyberpunk',
    'admin-1',
    'NightAdmin',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    'Neon Horizon 2099 — Cyberpunk Metropolis Odyssey',
    'Official NightVerse benchmark video encoded in authentic H.264 / AVC High Profile with 6 distinct multi-rendition streams (1080p, 720p, 480p, 360p, 240p, 144p). Features real-time rendition switching with seamless timestamp continuity and no buffer resets.',
    'UPLOAD',
    '/renditions/cyberpunk-city/1080p.mp4',
    '["/renditions/cyberpunk-city/1080p.mp4"]'::jsonb,
    '[{"id":"r-1080p","resolution":"1080p","width":1920,"height":1080,"codec":"h264 (H.264 / AVC)","bitrate":4488289,"frameRate":30,"url":"/renditions/cyberpunk-city/1080p.mp4","fileSize":8450412},{"id":"r-720p","resolution":"720p","width":1280,"height":720,"codec":"h264 (H.264 / AVC)","bitrate":2176892,"frameRate":30,"url":"/renditions/cyberpunk-city/720p.mp4","fileSize":4109018},{"id":"r-480p","resolution":"480p","width":854,"height":480,"codec":"h264 (H.264 / AVC)","bitrate":978468,"frameRate":30,"url":"/renditions/cyberpunk-city/480p.mp4","fileSize":1867325},{"id":"r-360p","resolution":"360p","width":640,"height":360,"codec":"h264 (H.264 / AVC)","bitrate":578470,"frameRate":30,"url":"/renditions/cyberpunk-city/360p.mp4","fileSize":1114891},{"id":"r-240p","resolution":"240p","width":426,"height":240,"codec":"h264 (H.264 / AVC)","bitrate":331865,"frameRate":30,"url":"/renditions/cyberpunk-city/240p.mp4","fileSize":653645},{"id":"r-144p","resolution":"144p","width":256,"height":144,"codec":"h264 (H.264 / AVC)","bitrate":168414,"frameRate":30,"url":"/renditions/cyberpunk-city/144p.mp4","fileSize":342535}]'::jsonb,
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=1200',
    15,
    '1920x1080',
    '16:9',
    'h264 (H.264 / AVC High Profile)',
    30,
    8450412,
    'COMPLETED',
    FALSE,
    ARRAY['cyberpunk', 'neon', 'futuristic', '4k'],
    'APPROVED',
    'public',
    'open',
    TRUE,
    'Sci-Fi & Cyberpunk',
    1284,
    194,
    ARRAY['admin-1'],
    '2026-01-01T00:00:00.000Z'
)
ON CONFLICT (id) DO NOTHING;

UPDATE public.system_settings
SET
    logo_url = NULLIF(BTRIM(logo_url), ''),
    favicon_url = COALESCE(NULLIF(BTRIM(favicon_url), ''), '/favicon.svg'),
    favicon_updated_at = COALESCE(favicon_updated_at, 0),
    favicon_emoji = COALESCE(NULLIF(BTRIM(favicon_emoji), ''), '🌌')
WHERE id = 1;

INSERT INTO public.schema_migrations (version, description)
VALUES
('20261124_fixed_json_syntax', 'Fixed JSONB literal syntax in schema.sql'),
('20261125_unified_realtime_video_fix', 'Idempotent unified schema with supabase_realtime publication, triggers, and complete seeds'),
('20261125_favicon_and_full_schema_sync', 'Full system_settings forward-compatible column guards and favicon persistence defaults'),
('20261125_app_logo_and_settings_sync', 'Application logo_url normalization and unified system_settings realtime sync')
ON CONFLICT (version) DO NOTHING;
