-- =============================================
-- Trigger: Handle New User Registration
-- Automates creation of 'users' and 'muzakki' records
-- =============================================

-- 1. Function to handle new user insertion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- A. Insert into public.users
  INSERT INTO public.users (id, nama, email, role, status_aktif)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nama', 'User Baru'),
    new.email,
    'user', -- Default role is always user for self-registration
    true
  );

  -- B. Insert into public.muzakki
  INSERT INTO public.muzakki (
    nama_kk, 
    nama_kepala_keluarga, 
    rt, 
    rw, 
    jumlah_anggota, 
    status_aktif, 
    user_id,
    no_kk -- adding placeholder or metadata
  )
  VALUES (
    COALESCE(new.raw_user_meta_data->>'nama', 'Keluarga Baru'),
    COALESCE(new.raw_user_meta_data->>'nama_kepala_keluarga', 'Kepala Keluarga'),
    COALESCE(new.raw_user_meta_data->>'rt', '00'),
    COALESCE(new.raw_user_meta_data->>'rw', '00'),
    (COALESCE(new.raw_user_meta_data->>'jumlah_anggota', '1'))::integer,
    true,
    new.id,
    '0000000000000000' -- no_kk is NOT NULL in schema, adding placeholder
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
