-- Create testimonials table and seed sample rows for Florxup
-- Run this in Supabase SQL editor (or any Postgres client connected to your Supabase DB).

create extension if not exists "pgcrypto";

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  organization text,
  avatar text,
  content text not null,
  rating int default 5,
  badge text,
  verified boolean default true,
  created_at timestamptz default now()
);

-- Seed example testimonials (these mirror bundled defaults)
insert into testimonials (name, role, organization, avatar, content, rating, badge, verified)
values
('Dr. Elena Rostova', 'Crisis Response Lead', 'Global Aid Relief Network',
 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
 'During emergency disaster deployments where cellular networks fail or are compromised, Florxup gives our teams instant, tamper-proof private coordination with zero setup friction.', 5, 'Humanitarian Responder', true),
('Marcus Vance', 'Investigative Journalist', 'Freedom Press Initiative',
 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
 'The ability to communicate with whistleblowers without requesting their phone numbers or personal metadata is a game changer. The client-side ECDH encryption is rock solid.', 5, 'Press & Privacy Advocate', true),
('Amina Al-Mansoor', 'Cybersecurity Researcher', 'Open Cryptographic Alliance',
 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
 'Auditing Florxup was a breath of fresh air: keys stay strictly in IndexedDB, the AES-GCM ciphertexts are non-recoverable by servers, and the WebCrypto implementation is textbook precision.', 5, 'Security Auditor', true),
('Kaito Tanaka', 'Open-Source Maintainer', 'CivicTech Foundation',
 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
 'The real-time global channels combined with seamless one-on-one encrypted rooms make community organizing faster than any legacy social tool I have used.', 5, 'Civic Tech Builder', true),
('Sofia Benitez', 'Human Rights Defender', 'Defensores Libres LATAM',
 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
 'In regions under active digital censorship, Florxup allowed our grassroots volunteers to safely dispatch medical logistics without exposing identities.', 5, 'Grassroots Coordinator', true),
('Lena Ortiz', 'Logistics Coordinator', 'ReliefTrack',
 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
 'Florxup enabled our supply chain teams to coordinate drop-offs across municipalities securely — even when standard comms were down.', 5, 'Logistics', true),
('Noor Al-Hassan', 'Field Advocate', 'SafeVoices',
 'https://images.unsplash.com/photo-1545996124-1b6f2d1b6b7a?w=150&auto=format&fit=crop&q=80',
 'The platform\'s privacy model helped protect vulnerable contacts while we coordinated safe passage and shelter logistics in hostile regions.', 5, 'Field Advocate', true)
;

-- Optional: Grant select to anon role (Supabase projects use anon/public key for client queries)
grant select on testimonials to authenticated, anon;
