-- Enable RLS on all remaining transaction tables to ensure the policies established in 20260313_user_role.sql are actually enforced by Postgres.

ALTER TABLE zakat_fitrah ENABLE ROW LEVEL SECURITY;
ALTER TABLE zakat_mal ENABLE ROW LEVEL SECURITY;
ALTER TABLE infaq_sedekah ENABLE ROW LEVEL SECURITY;
ALTER TABLE mustahiq ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribusi ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
