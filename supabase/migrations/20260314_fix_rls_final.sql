-- =============================================
-- Final Fix for RLS and RPC Mismatches
-- =============================================

-- A. SECURITY DEFINER functions to bypass RLS recursion
CREATE OR REPLACE FUNCTION is_admin_or_supervisor()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'supervisor', 'amil')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B. Fix RLS Policies for Zakat & Users
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (id = auth.uid() OR is_admin_or_supervisor());

DROP POLICY IF EXISTS "Users can view own zakat_fitrah" ON zakat_fitrah;
CREATE POLICY "Users can view own zakat_fitrah" ON zakat_fitrah FOR SELECT USING (muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid()) OR is_staff());

DROP POLICY IF EXISTS "Users can view own zakat_mal" ON zakat_mal;
CREATE POLICY "Users can view own zakat_mal" ON zakat_mal FOR SELECT USING (muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid()) OR is_staff());

DROP POLICY IF EXISTS "Users can view own infaq_sedekah" ON infaq_sedekah;
CREATE POLICY "Users can view own infaq_sedekah" ON infaq_sedekah FOR SELECT USING (muzakki_id IN (SELECT id FROM muzakki WHERE user_id = auth.uid()) OR nama_donatur IS NOT NULL OR is_staff());

DROP POLICY IF EXISTS "Users can view own muzakki" ON muzakki;
CREATE POLICY "Users can view own muzakki" ON muzakki FOR SELECT USING (user_id = auth.uid() OR is_staff());

-- C. Fix process_mayar_webhook column names
CREATE OR REPLACE FUNCTION process_mayar_webhook(
    p_payment_id TEXT,
    p_amount DECIMAL,
    p_metadata JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_updated_count INT;
    v_jenis TEXT;
    v_muzakki_id UUID;
    v_anggota INT;
BEGIN
    -- 1. Try to update existing Zakat Fitrah
    UPDATE zakat_fitrah 
    SET status = 'selesai' 
    WHERE mayar_payment_id = p_payment_id;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count > 0 THEN
        RETURN '{"success": true, "message": "Zakat Fitrah updated"}'::jsonb;
    END IF;

    -- 2. Try to update existing Zakat Mal
    UPDATE zakat_mal 
    SET status = 'selesai' 
    WHERE mayar_payment_id = p_payment_id;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count > 0 THEN
        RETURN '{"success": true, "message": "Zakat Mal updated"}'::jsonb;
    END IF;

    -- 3. Try to update existing Infaq Sedekah
    UPDATE infaq_sedekah 
    SET status = 'selesai' 
    WHERE mayar_payment_id = p_payment_id;
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    IF v_updated_count > 0 THEN
        RETURN '{"success": true, "message": "Infaq updated"}'::jsonb;
    END IF;

    -- 4. If no records updated, try auto-insert from metadata (AI Chat)
    IF p_metadata IS NOT NULL THEN
        v_jenis := p_metadata->>'jenis_pembayaran';
        v_muzakki_id := (p_metadata->>'muzakki_id')::UUID;
        
        IF v_jenis IS NOT NULL AND v_muzakki_id IS NOT NULL THEN
            IF v_jenis = 'fitrah' THEN
                v_anggota := COALESCE((p_metadata->>'jumlah_anggota')::INT, 1);
                INSERT INTO zakat_fitrah (muzakki_id, jumlah_anggota_aktual, total_setara_uang, jenis_bayar, metode_pembayaran, status, mayar_payment_id)
                VALUES (v_muzakki_id, v_anggota, p_amount, 'uang', 'mayar', 'selesai', p_payment_id);
                RETURN '{"success": true, "message": "New Zakat Fitrah inserted from AI chat"}'::jsonb;
                
            ELSIF v_jenis = 'mal' THEN
                INSERT INTO zakat_mal (muzakki_id, nominal_zakat, tahun_hijriah, total_harta, nisab_referensi, metode_pembayaran, status, mayar_payment_id)
                VALUES (v_muzakki_id, p_amount, '1447', p_amount * 40, p_amount * 40, 'mayar', 'selesai', p_payment_id);
                RETURN '{"success": true, "message": "New Zakat Mal inserted from AI chat"}'::jsonb;
                
            ELSIF v_jenis = 'infaq' THEN
                INSERT INTO infaq_sedekah (muzakki_id, nominal, metode_pembayaran, status, mayar_payment_id)
                VALUES (v_muzakki_id, p_amount, 'mayar', 'selesai', p_payment_id);
                RETURN '{"success": true, "message": "New Infaq inserted from AI chat"}'::jsonb;
            END IF;
        END IF;
    END IF;

    RETURN '{"success": true, "message": "No matching transaction found and no valid AI metadata"}'::jsonb;
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object('error', SQLERRM);
END;
$$;
