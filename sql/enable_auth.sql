-- Instructions for enabling authentication and creating users in Supabase

/*
IMPORTANT: Authentication is managed through the Supabase Dashboard

Steps to create an admin user:

1. Enable Email Authentication
   - Go to https://vjfaudrwggkwwsbhwhbc.supabase.co/dashboard
   - Navigate to Authentication > Settings > Email Auth
   - Ensure "Enable Email/Password sign in" is turned ON
   - Save changes

2. Create User
   - Go to Authentication > Users
   - Click "Add User"
   - Fill in:
     Email: admin@example.com
     Password: your-password
   - Check "Auto-confirm user"
   - Click "Create User"

3. Get User ID
   - Click on the created user in the users list
   - Copy the UUID

4. Create Admin Profile
   - Run this SQL command with the copied UUID:
*/

-- Replace 'your-uuid-here' with the actual UUID from step 3
SELECT create_admin_profile('your-uuid-here', 'Admin User');

/*
5. Test Login
   - Try logging in to the application with:
     Email: admin@example.com
     Password: your-password

If you get a 400 error:
- Verify the user exists in Authentication > Users
- Confirm the user is "confirmed" (check email confirmation status)
- Ensure the profile was created successfully
- Double-check the email and password being entered
*/