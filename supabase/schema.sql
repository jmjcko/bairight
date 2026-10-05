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


-- 4. User Custom Agents (Cloud Sync for Authenticated Users)
-- NOTE: BYOK API keys are strictly excluded and never stored in database.
CREATE TABLE IF NOT EXISTS user_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT '',
    definition JSONB NOT NULL,
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_agent UNIQUE (user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON user_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_purchased ON user_agents(user_id, is_purchased);

-- 5. User RAG Facts (Cross-device Personalization)
CREATE TABLE IF NOT EXISTS user_rag_facts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    fact_key TEXT NOT NULL,
    fact_value TEXT NOT NULL,
    confidence INTEGER DEFAULT 90,
    source_query TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_user_fact UNIQUE (user_id, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_user_rag_facts_user_id ON user_rag_facts(user_id);
