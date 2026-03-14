-- =============================================
-- Phase A: Add 'user' role + muzakki.user_id
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Add 'user' to the role enum
ALTER TYPE role_enum ADD VALUE IF NOT EXISTS 'user';

-- 2. Add user_id FK to muzakki table (nullable for existing records)
ALTER TABLE muzakki ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_muzakki_user_id ON muzakki(user_id);

-- 4. RLS: Allow users to see their own muzakki record
-- First drop existing policies if they conflict, then recreate
-- (Existing admin/amil/supervisor policies remain; we ADD user-specific ones)

-- Users can see their own muzakki data
CREATE POLICY "Users can view own muzakki"
  ON muzakki FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor', 'amil'))
  );

-- Users can update their own muzakki data
CREATE POLICY "Users can update own muzakki"
  ON muzakki FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin/amil/supervisor can do everything (keep existing or add)
CREATE POLICY "Staff can manage muzakki"
  ON muzakki FOR ALL
  USING (EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor', 'amil')));

-- 5. Users can insert their own muzakki (for registration)
CREATE POLICY "Users can insert own muzakki"
  ON muzakki FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- 6. RLS for zakat_fitrah: users can see/insert own transactions
CREATE POLICY "Users can view own zakat_fitrah"
  ON zakat_fitrah FOR SELECT
  USING (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor', 'amil'))
  );

CREATE POLICY "Users can insert own zakat_fitrah"
  ON zakat_fitrah FOR INSERT
  WITH CHECK (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor', 'amil'))
  );

-- 7. RLS for zakat_mal: users can see/insert own transactions
CREATE POLICY "Users can view own zakat_mal"
  ON zakat_mal FOR SELECT
  USING (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor', 'amil'))
  );

CREATE POLICY "Users can insert own zakat_mal"
  ON zakat_mal FOR INSERT
  WITH CHECK (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor', 'amil'))
  );

-- 8. RLS for infaq_sedekah: users can see/insert own transactions
CREATE POLICY "Users can view own infaq_sedekah"
  ON infaq_sedekah FOR SELECT
  USING (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR nama_donatur IS NOT NULL  -- donatur umum visible to all
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor', 'amil'))
  );

CREATE POLICY "Users can insert own infaq_sedekah"
  ON infaq_sedekah FOR INSERT
  WITH CHECK (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor', 'amil'))
  );

-- 9. Allow users to insert into users table (for self-registration)
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (id = auth.uid());

-- 10. Users can view own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor'))
  );
