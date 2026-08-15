-- ==============================================================================
-- Florxup - WhatsApp-Style Social Chatting & Information-Sharing Platform
-- Built for "Code for Humanity" Hackathon on Devpost
-- Database Schema, Security Policies & Realtime Setup (PostgreSQL / Supabase)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles Table (Stores User Identity & Public Cryptographic Key)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,                     -- Custom image URL or NULL (for plain initials fallback)
    status_bio TEXT DEFAULT 'Building for Humanity with Florxup 🚀',
    public_key TEXT NOT NULL,            -- Exported Public Key in JWK JSON format
    is_online BOOLEAN DEFAULT false,
    last_seen TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()),
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_is_online ON public.profiles(is_online);

-- 3. Contacts Table (Allows Users to Add & Manage Connections)
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_user_contact UNIQUE (user_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_contacts_user ON public.contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact ON public.contacts(contact_id);

-- 4. Private 1-on-1 Messages Table
-- Messages are encrypted on the sender's client device before reaching the database.
-- The server only stores the ciphertext and initialization vector (IV).
CREATE TABLE IF NOT EXISTS public.private_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ciphertext TEXT NOT NULL,          -- Encrypted payload (Base64)
    iv TEXT NOT NULL,                  -- Initialization Vector (Base64)
    is_delivered BOOLEAN DEFAULT false,
    is_read BOOLEAN DEFAULT false,
    delivered_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_private_messages_conversation 
    ON public.private_messages(sender_id, recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_private_messages_recipient 
    ON public.private_messages(recipient_id, is_read);

-- 5. Global Community Feed Messages Table
CREATE TABLE IF NOT EXISTS public.global_dev_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,            -- Markdown, text, and code snippet content
    message_type TEXT DEFAULT 'text', -- 'text' | 'code' | 'humanity_project' | 'announcement'
    tags TEXT[] DEFAULT '{}',
    reactions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_global_messages_created 
    ON public.global_dev_messages(created_at DESC);

-- ==============================================================================
-- 6. Row Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_dev_messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read for public keys, update own profile
CREATE POLICY "Allow public read access for profiles" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Contacts: Users manage their own contacts list
CREATE POLICY "Users can view their contacts"
    ON public.contacts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add contacts"
    ON public.contacts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete contacts"
    ON public.contacts FOR DELETE
    USING (auth.uid() = user_id);

-- Private Messages: Only participants can read or insert
CREATE POLICY "Users can view private messages they sent or received" 
    ON public.private_messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert messages as sender" 
    ON public.private_messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update message status" 
    ON public.private_messages FOR UPDATE 
    USING (auth.uid() = recipient_id OR auth.uid() = sender_id);

-- Global Messages: Authenticated community read & write
CREATE POLICY "Anyone authenticated can view global community messages" 
    ON public.global_dev_messages FOR SELECT 
    USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Users can insert global community messages" 
    ON public.global_dev_messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

-- ==============================================================================
-- 7. Realtime Publication Setup
-- ==============================================================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.profiles, 
    public.contacts,
    public.private_messages, 
    public.global_dev_messages;
COMMIT;

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.contacts REPLICA IDENTITY FULL;
ALTER TABLE public.private_messages REPLICA IDENTITY FULL;
ALTER TABLE public.global_dev_messages REPLICA IDENTITY FULL;
