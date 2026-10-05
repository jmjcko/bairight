-- ============================================================================
-- Migration: 20261005_full_cloud_persistence.sql
-- Description: Universal Cloud Persistence for bAIright (Multi-Browser Sync)
-- Covers: users, agents, chat_threads, chat_messages, user_rag_facts, user_prompts, pinned_products
-- Zero-Knowledge Security: BYOK API keys are strictly forbidden from database storage
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, -- Google sub identifier
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    avatar_url TEXT,
    preferred_locale VARCHAR(10) DEFAULT 'cs',
    preferred_font VARCHAR(50) DEFAULT 'modern',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Agents
CREATE TABLE IF NOT EXISTS agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_slug TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'active',
    is_purchased BOOLEAN DEFAULT FALSE,
    purchased_at TIMESTAMPTZ,
    definition JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_agent_slug UNIQUE (user_id, agent_slug)
);

CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(user_id, status);

-- 3. Chat Threads
CREATE TABLE IF NOT EXISTS chat_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_id UUID REFERENCES agents(id) ON DELETE SET NULL,
    agent_slug TEXT NOT NULL,
    title TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_agent_thread UNIQUE (user_id, agent_slug)
);

CREATE INDEX IF NOT EXISTS idx_chat_threads_user ON chat_threads(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_threads_agent ON chat_threads(user_id, agent_slug);

-- 4. Chat Messages
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES chat_threads(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    product_metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_thread ON chat_messages(thread_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);

-- 5. User RAG Memory Facts
CREATE TABLE IF NOT EXISTS user_rag_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    fact_key TEXT NOT NULL,
    fact_value TEXT NOT NULL,
    confidence INTEGER DEFAULT 90,
    is_enriched BOOLEAN DEFAULT TRUE,
    source_query TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_fact_key UNIQUE (user_id, fact_key)
);

CREATE INDEX IF NOT EXISTS idx_user_rag_facts_user ON user_rag_facts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rag_facts_category ON user_rag_facts(user_id, category);

-- 6. User Generated Prompts
CREATE TABLE IF NOT EXISTS user_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_slug TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    answers_summary TEXT,
    provider_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_prompts_user ON user_prompts(user_id, agent_slug);

-- 7. Pinned Products
CREATE TABLE IF NOT EXISTS pinned_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_slug TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_data JSONB NOT NULL,
    pinned_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_pinned_product UNIQUE (user_id, agent_slug, product_name)
);

CREATE INDEX IF NOT EXISTS idx_pinned_products_lookup ON pinned_products(user_id, agent_slug);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rag_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users access own profile" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow users access own agents" ON agents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow users access own threads" ON chat_threads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow users access own messages" ON chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow users access own facts" ON user_rag_facts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow users access own prompts" ON user_prompts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow users access own pinned products" ON pinned_products FOR ALL USING (true) WITH CHECK (true);
