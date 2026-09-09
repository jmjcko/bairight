-- Supabase PostgreSQL Schema for OrthoStride Podiatrist & Shoe Shopper

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. User Sessions
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_identifier TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Biomechanical Profiles
CREATE TABLE IF NOT EXISTS biomechanical_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    weight_kg NUMERIC(5,2),
    foot_width TEXT CHECK (foot_width IN ('standard_d', 'wide_2e', 'extra_wide_4e', 'narrow_b')),
    strike_type TEXT CHECK (strike_type IN ('supination', 'neutral', 'mild_overpronation', 'severe_overpronation', 'heel_strike', 'midfoot_strike', 'forefoot_strike')),
    past_injuries TEXT[] DEFAULT '{}',
    knee_condition TEXT CHECK (knee_condition IN ('none', 'patellar_tendinopathy', 'meniscus_tear', 'osteoarthritis_grade_1', 'osteoarthritis_grade_2', 'osteoarthritis_grade_3')),
    activity_type TEXT DEFAULT 'road_running',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_session_profile UNIQUE (session_id)
);

-- 3. Chat Messages & Tool Execution Logs
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES user_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
    content TEXT NOT NULL,
    tool_calls JSONB,
    tool_results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for optimal lookup
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_biomechanical_profiles_session ON biomechanical_profiles(session_id);
