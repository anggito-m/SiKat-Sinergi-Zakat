-- Create standard tables and Enums for ZakatDesa

CREATE TYPE role_enum AS ENUM ('admin', 'amil', 'supervisor');
CREATE TYPE asnaf_enum AS ENUM ('fakir', 'miskin', 'amil', 'mualaf', 'riqab', 'gharim', 'fisabilillah', 'ibnu_sabil');
CREATE TYPE jenis_bayar_enum AS ENUM ('beras', 'uang');
CREATE TYPE sumber_zakat_enum AS ENUM ('fitrah', 'maal', 'infaq');

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  nama TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role role_enum NOT NULL DEFAULT 'amil',
  status_aktif BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE amil_rt_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amil_id UUID REFERENCES users(id) ON DELETE CASCADE,
  rt TEXT NOT NULL,
  rw TEXT,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE muzakki (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kk TEXT NOT NULL,
  nama_kepala_keluarga TEXT NOT NULL,
  no_kk TEXT NOT NULL,
  jumlah_anggota INTEGER NOT NULL,
  rt TEXT,
  rw TEXT,
  telepon TEXT,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE mustahiq (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  no_kk TEXT,
  jumlah_anggota INTEGER,
  rt TEXT,
  rw TEXT,
  kategori_asnaf asnaf_enum NOT NULL,
  alamat TEXT,
  telepon TEXT,
  status_aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE zakat_fitrah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muzakki_id UUID REFERENCES muzakki(id),
  jumlah_anggota_aktual INTEGER NOT NULL,
  jenis_bayar jenis_bayar_enum NOT NULL,
  nominal_beras_kg DECIMAL(10, 2),
  nominal_uang DECIMAL(12, 2),
  total_setara_uang DECIMAL(12, 2),
  metode_pembayaran TEXT,
  mayar_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  amil_id UUID REFERENCES users(id)
);

CREATE TABLE Zakat_mal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muzakki_id UUID REFERENCES muzakki(id),
  tahun_hijriah TEXT NOT NULL,
  penghasilan_tahunan DECIMAL(15, 2),
  tabungan DECIMAL(15, 2),
  emas_gram DECIMAL(10, 2),
  nilai_investasi DECIMAL(15, 2),
  nilai_perdagangan DECIMAL(15, 2),
  total_harta DECIMAL(15, 2) NOT NULL,
  nisab_referensi DECIMAL(15, 2) NOT NULL,
  nominal_zakat DECIMAL(15, 2) NOT NULL,
  catatan TEXT,
  mayar_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  amil_id UUID REFERENCES users(id)
);

CREATE TABLE infaq_sedekah (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  muzakki_id UUID REFERENCES muzakki(id),
  nama_donatur TEXT,
  nominal DECIMAL(15, 2) NOT NULL,
  catatan TEXT,
  mayar_payment_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE distribusi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mustahiq_id UUID REFERENCES mustahiq(id),
  kategori_asnaf asnaf_enum NOT NULL,
  nominal DECIMAL(15, 2) NOT NULL,
  sumber_zakat sumber_zakat_enum NOT NULL,
  periode TEXT,
  catatan TEXT,
  amil_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  messages_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  zakat_type TEXT,
  final_amount DECIMAL(15, 2),
  mayar_link_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert default config values
INSERT INTO config (key, value) VALUES 
('nisab_maal_rp', '85000000'),
('nilai_emas_per_gram', '1000000'),
('nilai_2_5kg_beras_rp', '45000'),
('tahun_hijriah', '1447');

-- Set up Row Level Security (RLS) policies 
-- Note: Further setup can be run in Supabase UI or migrations
ALTER TABLE muzakki ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Amil can only view assigned RT muzakki" ON muzakki
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM amil_rt_assignments a
      WHERE a.amil_id = auth.uid() AND a.rt = muzakki.rt
    )
    OR
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() AND u.role IN ('admin', 'supervisor')
    )
  );
