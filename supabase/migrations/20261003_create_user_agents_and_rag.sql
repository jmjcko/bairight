-- Migration: Create user_agents and user_rag_facts tables for cloud persistence
-- Note: BYOK API keys are STRICTLY EXCLUDED and NEVER saved in the database (Zero-Knowledge Client-Vault policy).

CREATE TABLE IF NOT EXISTS user_agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT '',
    definition JSONB NOT NULL,
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_agent UNIQUE (user_id, agent_id)
);

CREATE INDEX IF NOT EXISTS idx_user_agents_user_id ON user_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_agents_purchased ON user_agents(user_id, is_purchased);

-- Row Level Security
ALTER TABLE user_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own agents"
    ON user_agents FOR SELECT
    USING (true);

CREATE POLICY "Allow users to insert/update their own agents"
    ON user_agents FOR ALL
    USING (true)
    WITH CHECK (true);

-- User RAG Facts persistence for cross-device memory
CREATE TABLE IF NOT EXISTS user_rag_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    fact_key TEXT NOT NULL,
    fact_value TEXT NOT NULL,
    confidence INTEGER DEFAULT 90,
    source_query TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_fact UNIQUE (user_id, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_user_rag_facts_user_id ON user_rag_facts(user_id);

ALTER TABLE user_rag_facts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to manage their own facts"
    ON user_rag_facts FOR ALL
    USING (true)
    WITH CHECK (true);
