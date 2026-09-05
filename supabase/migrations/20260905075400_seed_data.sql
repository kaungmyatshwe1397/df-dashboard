-- ============================================
-- DC-FMS Auth Users (Migration)
-- Creates admin and assistant users in auth.users
-- Profiles auto-created by trigger (B-3)
-- ============================================

-- Ensure pgcrypto is available for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto" SCHEMA extensions;

-- ------------------------------------------
-- Admin user
-- Email: admin@test.com / Password: admin123
-- ------------------------------------------

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  raw_user_meta_data,
  raw_app_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'authenticated',
  'authenticated',
  'admin@test.com',
  extensions.crypt('admin123', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '{"username": "admin", "role": "ADMIN"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------
-- Assistant user
-- Email: assistant@test.com / Password: assist123
-- ------------------------------------------

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  raw_user_meta_data,
  raw_app_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  'authenticated',
  'authenticated',
  'assistant@test.com',
  extensions.crypt('assist123', extensions.gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '{"username": "assistant", "role": "ASSISTANT"}'::jsonb,
  '{"provider": "email", "providers": ["email"]}'::jsonb
) ON CONFLICT (id) DO NOTHING;
