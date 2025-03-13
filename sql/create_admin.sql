-- Function to create an admin profile after user creation through Supabase Auth
-- Usage: After creating a user through Supabase Auth dashboard or API,
-- call this function with the user's UUID

CREATE OR REPLACE FUNCTION create_admin_profile(user_id UUID, user_full_name TEXT)
RETURNS void AS $$
BEGIN
    -- Insert admin profile
    INSERT INTO profiles (id, full_name, role)
    VALUES (user_id, user_full_name, 'admin');

    -- Grant necessary database permissions
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
    GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
END;
$$ LANGUAGE plpgsql;

-- Example usage (replace UUID with actual user ID from Supabase Auth):
-- SELECT create_admin_profile('your-user-uuid-here', 'Admin User');

-- Note: To create a user through Supabase:
-- 1. Go to Authentication > Users in Supabase dashboard
-- 2. Click "Create User"
-- 3. Enter email and password
-- 4. Copy the UUID of the created user
-- 5. Run this function with the UUID