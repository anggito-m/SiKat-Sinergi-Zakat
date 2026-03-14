-- =============================================
-- Fix: RLS Policies for Mustahiq and Distribusi
-- =============================================

-- Allow staff (admin, supervisor, amil) to view and manage mustahiq
DROP POLICY IF EXISTS "Staff can manage mustahiq" ON mustahiq;
CREATE POLICY "Staff can manage mustahiq" 
  ON mustahiq FOR ALL 
  USING (is_staff());

-- Allow staff (admin, supervisor, amil) to view and manage distribusi
DROP POLICY IF EXISTS "Staff can manage distribusi" ON distribusi;
CREATE POLICY "Staff can manage distribusi" 
  ON distribusi FOR ALL 
  USING (is_staff());

-- Optional: Allow regular users to see their own distributions if they are linked to a mustahiq
-- (Not requested yet, but good for future-proofing if we ever link users/muzakki to mustahiq)
