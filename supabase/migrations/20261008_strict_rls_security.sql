-- ============================================================================
-- Migration: 20261008_strict_rls_security.sql
-- Description: Production Row-Level Security (RLS) Hardening for bAIright
-- Fixes: OWASP A01: Broken Access Control / BOLA vulnerability
-- Ensures: Only authenticated users can access their own agents, threads, messages, and facts.
-- Zero-Knowledge: BYOK API keys are strictly forbidden from database storage.
-- ============================================================================

-- Ensure Row Level Security is strictly enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rag_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pinned_products ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow users access own profile" ON users;
DROP POLICY IF EXISTS "Users can only access own profile" ON users;
DROP POLICY IF EXISTS "Users can only read own profile" ON users;
DROP POLICY IF EXISTS "Users can only insert own profile" ON users;
DROP POLICY IF EXISTS "Users can only update own profile" ON users;

CREATE POLICY "Users can only read own profile" ON users
    FOR SELECT
    USING (
        auth.uid()::text = id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = id
        OR auth.jwt() ->> 'email' = email
    );

CREATE POLICY "Users can only insert own profile" ON users
    FOR INSERT
    WITH CHECK (
        auth.uid()::text = id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = id
        OR auth.jwt() ->> 'email' = email
    );

CREATE POLICY "Users can only update own profile" ON users
    FOR UPDATE
    USING (
        auth.uid()::text = id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = id
        OR auth.jwt() ->> 'email' = email
    )
    WITH CHECK (
        auth.uid()::text = id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = id
        OR auth.jwt() ->> 'email' = email
    );

-- ----------------------------------------------------------------------------
-- 2. AGENTS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow users access own agents" ON agents;
DROP POLICY IF EXISTS "Users can only access own agents" ON agents;

CREATE POLICY "Users can only access own agents" ON agents
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    )
    WITH CHECK (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    );

-- ----------------------------------------------------------------------------
-- 3. CHAT THREADS TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow users access own threads" ON chat_threads;
DROP POLICY IF EXISTS "Users can only access own threads" ON chat_threads;

CREATE POLICY "Users can only access own threads" ON chat_threads
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    )
    WITH CHECK (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    );

-- ----------------------------------------------------------------------------
-- 4. CHAT MESSAGES TABLE POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow users access own messages" ON chat_messages;
DROP POLICY IF EXISTS "Users can only access own messages" ON chat_messages;

CREATE POLICY "Users can only access own messages" ON chat_messages
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    )
    WITH CHECK (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    );

-- ----------------------------------------------------------------------------
-- 5. USER RAG MEMORY FACTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow users access own facts" ON user_rag_facts;
DROP POLICY IF EXISTS "Users can only access own facts" ON user_rag_facts;

CREATE POLICY "Users can only access own facts" ON user_rag_facts
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    )
    WITH CHECK (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    );

-- ----------------------------------------------------------------------------
-- 6. USER GENERATED PROMPTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow users access own prompts" ON user_prompts;
DROP POLICY IF EXISTS "Users can only access own prompts" ON user_prompts;

CREATE POLICY "Users can only access own prompts" ON user_prompts
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    )
    WITH CHECK (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    );

-- ----------------------------------------------------------------------------
-- 7. PINNED PRODUCTS POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow users access own pinned products" ON pinned_products;
DROP POLICY IF EXISTS "Users can only access own pinned products" ON pinned_products;

CREATE POLICY "Users can only access own pinned products" ON pinned_products
    FOR ALL
    USING (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    )
    WITH CHECK (
        auth.uid()::text = user_id 
        OR (auth.jwt() -> 'user_metadata' ->> 'sub') = user_id
        OR auth.jwt() ->> 'email' = (SELECT email FROM users WHERE users.id = user_id)
    );
