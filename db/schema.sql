-- ========================================================================
-- ZORVIK AI DEDICATED SUPABASE DATABASE SCHEMA
-- Migration: 0001_zorvik_ai_core_schema.sql
-- ========================================================================

-- 1. Enable pgvector for semantic memory and conversation embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tenants Table (Zorvik Studio, Zorvik-Tech, and External API Consumers)
CREATE TABLE IF NOT EXISTS tbl_tenants (
    id VARCHAR(64) PRIMARY KEY, -- x-tenant-id (e.g., 'zorvik-studio-prod', 'zorviktech-main', 'public-guest')
    name VARCHAR(255) NOT NULL,
    tier VARCHAR(32) NOT NULL DEFAULT 'standard', -- 'free' | 'standard' | 'enterprise'
    rate_limit_per_minute INT NOT NULL DEFAULT 60,
    monthly_token_quota BIGINT NOT NULL DEFAULT 1000000,
    custom_system_prompt TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Conversations Table
CREATE TABLE IF NOT EXISTS tbl_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tbl_tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL DEFAULT 'New Chat',
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    guest_uuid VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Messages Table with 768-dim Vector Embeddings (Gemini text-embedding-004)
CREATE TABLE IF NOT EXISTS tbl_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES tbl_conversations(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens INT NOT NULL DEFAULT 0,
    model_routed VARCHAR(64),
    embedding vector(768), -- 768-dimensional embedding for semantic memory
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Tenant Usage & Telemetry Ledger
CREATE TABLE IF NOT EXISTS tbl_tenant_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id VARCHAR(64) NOT NULL REFERENCES tbl_tenants(id) ON DELETE CASCADE,
    endpoint VARCHAR(128) NOT NULL,
    model_routed VARCHAR(64),
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    latency_ms INT NOT NULL DEFAULT 0,
    status_code INT NOT NULL DEFAULT 200,
    ip_hash VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Indexes for Blazing-Fast Performance
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON tbl_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON tbl_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_guest ON tbl_conversations(guest_uuid);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON tbl_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON tbl_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant ON tbl_tenant_usage(tenant_id, created_at DESC);

-- HNSW Vector Index for sub-millisecond semantic search
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON tbl_messages 
USING hnsw (embedding vector_cosine_ops);

-- 7. Semantic Vector Search RPC Function
CREATE OR REPLACE FUNCTION match_messages (
    query_embedding vector(768),
    match_threshold float DEFAULT 0.70,
    match_count int DEFAULT 5,
    p_conversation_id uuid DEFAULT NULL,
    p_tenant_id varchar DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    conversation_id uuid,
    role varchar,
    content text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.id,
        m.conversation_id,
        m.role,
        m.content,
        1 - (m.embedding <=> query_embedding) AS similarity
    FROM tbl_messages m
    JOIN tbl_conversations c ON m.conversation_id = c.id
    WHERE m.embedding IS NOT NULL
      AND 1 - (m.embedding <=> query_embedding) > match_threshold
      AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
      AND (p_tenant_id IS NULL OR c.tenant_id = p_tenant_id)
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- 8. Seed Default System Tenants
INSERT INTO tbl_tenants (id, name, tier, rate_limit_per_minute, monthly_token_quota, custom_system_prompt, is_active)
VALUES 
    ('public-guest', 'Zorvik AI Public Web Guest', 'free', 30, 200000, NULL, TRUE),
    ('zorvik-studio-prod', 'Zorvik Studio Production', 'enterprise', 300, 10000000, 'You are integrated into Zorvik Studio.', TRUE),
    ('zorviktech-main', 'Zorvik-Tech Primary Platform', 'enterprise', 300, 10000000, 'You are integrated into Zorvik-Tech.', TRUE),
    ('zconnect-service', 'ZConnect Messaging Platform', 'standard', 120, 5000000, 'You are integrated into ZConnect.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9. Row Level Security (RLS)
ALTER TABLE tbl_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tenant_usage ENABLE ROW LEVEL SECURITY;

-- Tenants: Public read for active tenants (for validation)
CREATE POLICY "Allow public read active tenants"
    ON tbl_tenants FOR SELECT
    USING (is_active = TRUE);

-- Conversations: Users can read/write their own conversations, or guests by guest_uuid
CREATE POLICY "Users can manage own conversations"
    ON tbl_conversations FOR ALL
    USING (auth.uid() = user_id OR (is_guest = TRUE AND guest_uuid IS NOT NULL))
    WITH CHECK (auth.uid() = user_id OR (is_guest = TRUE AND guest_uuid IS NOT NULL));

-- Messages: Users can manage messages in their conversations
CREATE POLICY "Users can manage messages in their conversations"
    ON tbl_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tbl_conversations c
            WHERE c.id = tbl_messages.conversation_id
              AND (c.user_id = auth.uid() OR c.is_guest = TRUE)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tbl_conversations c
            WHERE c.id = tbl_messages.conversation_id
              AND (c.user_id = auth.uid() OR c.is_guest = TRUE)
        )
    );
