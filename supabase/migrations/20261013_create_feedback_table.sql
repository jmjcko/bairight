-- ============================================================================
-- Migration: 20261013_create_feedback_table.sql
-- Description: Community Feedback & Suggestion System with Admin Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id TEXT,
    email TEXT NOT NULL,
    name TEXT,
    category TEXT NOT NULL DEFAULT 'feature',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new', -- 'new', 'in_progress', 'resolved'
    admin_notes TEXT,
    app_version TEXT
);

-- Enable Row-Level Security
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (anonymous visitors or authenticated users) can submit feedback
DROP POLICY IF EXISTS "Anyone can insert feedback" ON public.feedback;
CREATE POLICY "Anyone can insert feedback" ON public.feedback
    FOR INSERT
    WITH CHECK (true);

-- 2. Administrators can read all feedback (or users can read their own feedback)
DROP POLICY IF EXISTS "Admins and owners can view feedback" ON public.feedback;
CREATE POLICY "Admins and owners can view feedback" ON public.feedback
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' IN ('jmjcko@gmail.com', 'jan.mynar@gmail.com')
        OR auth.uid()::text = user_id
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = email
    );

-- 3. Only administrators can update feedback status or admin_notes
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback;
CREATE POLICY "Admins can update feedback" ON public.feedback
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' IN ('jmjcko@gmail.com', 'jan.mynar@gmail.com')
    )
    WITH CHECK (
        auth.jwt() ->> 'email' IN ('jmjcko@gmail.com', 'jan.mynar@gmail.com')
    );
