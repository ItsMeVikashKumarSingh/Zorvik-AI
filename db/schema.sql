-- ========================================================================
-- ZORVIK AI DEDICATED SUPABASE DATABASE SCHEMA
-- Migration: 0002_zorvik_ai_admin_and_monetization.sql
-- ========================================================================

-- 1. Enable pgvector for semantic memory and conversation embeddings
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Pricing Plans Table (Paid API Tiers)
CREATE TABLE IF NOT EXISTS tbl_pricing_plans (
    id VARCHAR(64) PRIMARY KEY, -- 'starter', 'pro', 'enterprise', 'payg'
    name VARCHAR(128) NOT NULL,
    description TEXT,
    monthly_price_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    monthly_token_quota BIGINT NOT NULL DEFAULT 1000000,
    rate_limit_per_minute INT NOT NULL DEFAULT 60,
    overage_rate_per_million NUMERIC(10, 4) NOT NULL DEFAULT 0.50,
    max_api_keys INT NOT NULL DEFAULT 3,
    features JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 3. Tenants Table (API Consumers & External Microservices)
CREATE TABLE IF NOT EXISTS tbl_tenants (
    id VARCHAR(64) PRIMARY KEY, -- x-tenant-id (e.g., 'zorvik-studio-prod', 'zorviktech-main', 'tenant_live_xxxx')
    name VARCHAR(255) NOT NULL,
    plan_id VARCHAR(64) REFERENCES tbl_pricing_plans(id) DEFAULT 'starter',
    tier VARCHAR(32) NOT NULL DEFAULT 'standard', -- 'starter' | 'pro' | 'enterprise' | 'custom'
    rate_limit_per_minute INT NOT NULL DEFAULT 60,
    monthly_token_quota BIGINT NOT NULL DEFAULT 1000000,
    tokens_used_this_month BIGINT NOT NULL DEFAULT 0,
    custom_system_prompt TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    owner_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 4. Admins & Roles Table
CREATE TABLE IF NOT EXISTS tbl_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    role VARCHAR(32) NOT NULL DEFAULT 'admin', -- 'superadmin' | 'admin' | 'support'
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 5. Mandatory Immutable Audit Logs
CREATE TABLE IF NOT EXISTS tbl_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id VARCHAR(64) NOT NULL,
    admin_email VARCHAR(255) NOT NULL,
    action_type VARCHAR(64) NOT NULL, -- 'CREATE_TENANT', 'UPDATE_QUOTA', 'REVOKE_KEY', 'CHANGE_PLAN', 'TOGGLE_CIRCUIT'
    target_entity VARCHAR(128) NOT NULL, -- 'tenant:zorvik-studio-prod', 'plan:pro'
    details JSONB NOT NULL DEFAULT '{}',
    ip_address VARCHAR(64),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 6. Conversations Table
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

-- 7. Messages Table with 768-dim Vector Embeddings
CREATE TABLE IF NOT EXISTS tbl_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES tbl_conversations(id) ON DELETE CASCADE,
    role VARCHAR(16) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens INT NOT NULL DEFAULT 0,
    model_routed VARCHAR(64),
    embedding vector(768),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 8. Tenant Usage & Telemetry Ledger
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

-- 9. Indexes for Blazing-Fast Performance
CREATE INDEX IF NOT EXISTS idx_conversations_tenant ON tbl_conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON tbl_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_guest ON tbl_conversations(guest_uuid);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON tbl_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON tbl_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant ON tbl_tenant_usage(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON tbl_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON tbl_audit_logs(admin_email);

-- HNSW Vector Index for sub-millisecond semantic search
CREATE INDEX IF NOT EXISTS idx_messages_embedding ON tbl_messages 
USING hnsw (embedding vector_cosine_ops);

-- 10. Semantic Vector Search RPC Function
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

-- 11. Seed Default Pricing Plans
INSERT INTO tbl_pricing_plans (id, name, description, monthly_price_usd, monthly_token_quota, rate_limit_per_minute, overage_rate_per_million, max_api_keys, features, is_active)
VALUES 
    ('starter', 'Starter Developer', 'Essential AI cascade API access for indie developers and prototypes.', 19.00, 5000000, 120, 0.40, 2, '["Gemini 2.5 Flash", "Groq Llama 3.3 70B", "Standard Latency", "Community Support"]'::jsonb, TRUE),
    ('pro', 'Professional Scale', 'High-throughput intelligence with priority Cerebras & Mistral Codestral routing.', 49.00, 20000000, 300, 0.35, 5, '["All Cascade Engines", "Codestral & Cerebras LPU", "Web Search Grounding", "Custom System Prompts", "Priority SLA"]'::jsonb, TRUE),
    ('enterprise', 'Enterprise Custom', 'Dedicated token pools, sub-50ms failover, and customized fine-tuned system directives.', 199.00, 100000000, 1200, 0.25, 20, '["Unlimited Model Access", "Dedicated Circuit Breaker", "Unlimited Web Grounding", "24/7 Dedicated Support", "Custom Fine-Tuning"]'::jsonb, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 12. Seed Default System Tenants
INSERT INTO tbl_tenants (id, name, plan_id, tier, rate_limit_per_minute, monthly_token_quota, custom_system_prompt, is_active)
VALUES 
    ('public-guest', 'Zorvik AI Public Web Guest', 'starter', 'starter', 30, 200000, NULL, TRUE),
    ('zorvik-studio-prod', 'Zorvik Studio Production', 'enterprise', 'enterprise', 600, 50000000, 'You are integrated into Zorvik Studio.', TRUE),
    ('zorviktech-main', 'Zorvik-Tech Primary Platform', 'enterprise', 'enterprise', 600, 50000000, 'You are integrated into Zorvik-Tech.', TRUE),
    ('zconnect-service', 'ZConnect Messaging Platform', 'pro', 'pro', 300, 20000000, 'You are integrated into ZConnect.', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 13. Seed Default Admin
INSERT INTO tbl_admins (email, role, is_active)
VALUES ('admin@zorvik.tech', 'superadmin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- 14. Row Level Security (RLS)
ALTER TABLE tbl_pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tbl_tenant_usage ENABLE ROW LEVEL SECURITY;

-- Pricing Plans: Public read for active plans
CREATE POLICY "Allow public read active plans"
    ON tbl_pricing_plans FOR SELECT
    USING (is_active = TRUE);

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
