-- Initial schema for CubeCoach AI
-- Creates all core tables, RLS policies, auth trigger, and storage bucket

-- uuid_generate_v4() is unavailable in newer Supabase projects where uuid-ossp
-- is installed in the extensions schema. Use gen_random_uuid() instead (PG 13+).


-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text,
    avatar_url text,
    wca_id text,
    wca_data jsonb,
    wca_last_fetched timestamptz,
    method text CHECK (method IN ('cfop', 'roux', 'beginner', 'unknown')),
    current_average text,
    primary_goal text,
    knows_how_to_solve boolean DEFAULT false,
    onboarding_complete boolean DEFAULT false,
    tier text DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'lifetime')),
    stripe_customer_id text,
    xp integer DEFAULT 0,
    level integer DEFAULT 1,
    completed_lessons jsonb DEFAULT '[]',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solve_sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.solves (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    session_id uuid REFERENCES public.solve_sessions(id) ON DELETE CASCADE NOT NULL,
    time_ms integer NOT NULL,
    penalty text CHECK (penalty IN ('dnf', '+2')),
    scramble text,
    method text,
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analyses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    video_path text,
    method text CHECK (method IN ('cfop', 'roux')),
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'complete', 'failed')),
    report jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.analysis_chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id uuid REFERENCES public.analyses(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    role text CHECK (role IN ('user', 'assistant')) NOT NULL,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookmarks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    video_url text NOT NULL,
    title text NOT NULL,
    source text,
    topic_tag text,
    method_tag text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.badges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    badge_key text NOT NULL,
    earned_at timestamptz DEFAULT now(),
    UNIQUE(user_id, badge_key)
);

CREATE TABLE IF NOT EXISTS public.xp_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.user_profiles(id) ON DELETE CASCADE NOT NULL,
    source text NOT NULL,
    xp_amount integer NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- ============================================================
-- Indexes (on user_id columns used in RLS policies)
-- ============================================================

CREATE INDEX IF NOT EXISTS solve_sessions_user_id_idx ON public.solve_sessions(user_id);
CREATE INDEX IF NOT EXISTS solves_user_id_idx ON public.solves(user_id);
CREATE INDEX IF NOT EXISTS solves_session_id_idx ON public.solves(session_id);
CREATE INDEX IF NOT EXISTS analyses_user_id_idx ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS analysis_chats_user_id_idx ON public.analysis_chats(user_id);
CREATE INDEX IF NOT EXISTS analysis_chats_analysis_id_idx ON public.analysis_chats(analysis_id);
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS badges_user_id_idx ON public.badges(user_id);
CREATE INDEX IF NOT EXISTS xp_events_user_id_idx ON public.xp_events(user_id);

-- ============================================================
-- Auth trigger: auto-create user_profile on sign-up
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solve_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_events ENABLE ROW LEVEL SECURITY;

-- user_profiles (keyed on id, not user_id)
CREATE POLICY "user_profiles_select" ON public.user_profiles
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "user_profiles_insert" ON public.user_profiles
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_update" ON public.user_profiles
    FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "user_profiles_delete" ON public.user_profiles
    FOR DELETE TO authenticated USING (auth.uid() = id);

-- solve_sessions
CREATE POLICY "solve_sessions_select" ON public.solve_sessions
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "solve_sessions_insert" ON public.solve_sessions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solve_sessions_update" ON public.solve_sessions
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solve_sessions_delete" ON public.solve_sessions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- solves
CREATE POLICY "solves_select" ON public.solves
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "solves_insert" ON public.solves
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solves_update" ON public.solves
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "solves_delete" ON public.solves
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- analyses
CREATE POLICY "analyses_select" ON public.analyses
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "analyses_insert" ON public.analyses
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_update" ON public.analyses
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analyses_delete" ON public.analyses
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- analysis_chats
CREATE POLICY "analysis_chats_select" ON public.analysis_chats
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "analysis_chats_insert" ON public.analysis_chats
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analysis_chats_update" ON public.analysis_chats
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "analysis_chats_delete" ON public.analysis_chats
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- bookmarks
CREATE POLICY "bookmarks_select" ON public.bookmarks
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert" ON public.bookmarks
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_update" ON public.bookmarks
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete" ON public.bookmarks
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- badges
CREATE POLICY "badges_select" ON public.badges
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "badges_insert" ON public.badges
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "badges_update" ON public.badges
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "badges_delete" ON public.badges
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- xp_events
CREATE POLICY "xp_events_select" ON public.xp_events
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "xp_events_insert" ON public.xp_events
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "xp_events_update" ON public.xp_events
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "xp_events_delete" ON public.xp_events
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- Storage
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('solve-videos', 'solve-videos', false)
ON CONFLICT (id) DO NOTHING;
