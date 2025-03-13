-- Cleanup script for servizio-alloggiati

-- Drop indexes first
DROP INDEX IF EXISTS idx_guests_last_name;
DROP INDEX IF EXISTS idx_stays_dates;
DROP INDEX IF EXISTS idx_accommodations_status;

-- Drop RLS policies for stays table (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'stays') THEN
        DROP POLICY IF EXISTS "Staff and admin can view stays" ON stays;
        DROP POLICY IF EXISTS "Staff and admin can insert stays" ON stays;
        DROP POLICY IF EXISTS "Staff and admin can update stays" ON stays;
    END IF;
END $$;

-- Drop RLS policies for guests table (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'guests') THEN
        DROP POLICY IF EXISTS "Staff and admin can view guests" ON guests;
        DROP POLICY IF EXISTS "Staff and admin can insert guests" ON guests;
        DROP POLICY IF EXISTS "Staff and admin can update guests" ON guests;
    END IF;
END $$;

-- Drop RLS policies for accommodations table (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'accommodations') THEN
        DROP POLICY IF EXISTS "Staff and admin can view accommodations" ON accommodations;
        DROP POLICY IF EXISTS "Staff and admin can insert accommodations" ON accommodations;
        DROP POLICY IF EXISTS "Staff and admin can update accommodations" ON accommodations;
    END IF;
END $$;

-- Drop RLS policies for profiles table (if table exists)
DO $$ BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
    END IF;
END $$;

-- Drop tables in correct order (to handle foreign key constraints)
DROP TABLE IF EXISTS stays;
DROP TABLE IF EXISTS guests;
DROP TABLE IF EXISTS accommodations;
DROP TABLE IF EXISTS profiles;

-- Note: This script does not remove Supabase Auth users
-- Those need to be managed through the Supabase dashboard or Auth API