-- =============================================
-- Fix: Prevent Infinite Recursion in RLS Policies
-- =============================================

-- 1. Redefine 'Users can view own profile' without self-reference
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (
    id = auth.uid()
    OR (auth.jwt() ->> 'role')::text IN ('admin', 'supervisor')
  );

-- 2. Redefine 'Users can view own muzakki' 
DROP POLICY IF EXISTS "Users can view own muzakki" ON muzakki;
CREATE POLICY "Users can view own muzakki"
  ON muzakki FOR SELECT
  USING (
    user_id = auth.uid()
    OR (auth.jwt() ->> 'role')::text IN ('admin', 'supervisor', 'amil')
  );

-- 3. Redefine 'Staff can manage muzakki'
DROP POLICY IF EXISTS "Staff can manage muzakki" ON muzakki;
CREATE POLICY "Staff can manage muzakki"
  ON muzakki FOR ALL
  USING (
    (auth.jwt() ->> 'role')::text IN ('admin', 'supervisor', 'amil')
  );

-- 4. Redefine 'Users can view own zakat_fitrah'
DROP POLICY IF EXISTS "Users can view own zakat_fitrah" ON zakat_fitrah;
CREATE POLICY "Users can view own zakat_fitrah"
  ON zakat_fitrah FOR SELECT
  USING (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR (auth.jwt() ->> 'role')::text IN ('admin', 'supervisor', 'amil')
  );

-- 5. Redefine 'Users can view own zakat_mal'
DROP POLICY IF EXISTS "Users can view own zakat_mal" ON zakat_mal;
CREATE POLICY "Users can view own zakat_mal"
  ON zakat_mal FOR SELECT
  USING (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR (auth.jwt() ->> 'role')::text IN ('admin', 'supervisor', 'amil')
  );

-- 6. Redefine 'Users can view own infaq_sedekah'
DROP POLICY IF EXISTS "Users can view own infaq_sedekah" ON infaq_sedekah;
CREATE POLICY "Users can view own infaq_sedekah"
  ON infaq_sedekah FOR SELECT
  USING (
    muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid())
    OR nama_donatur IS NOT NULL
    OR (auth.jwt() ->> 'role')::text IN ('admin', 'supervisor', 'amil')
  );
