# Setup Instructions for Servizio Alloggiati

## 1. Database Setup

First, run the cleanup script to remove any existing tables:

```sql
\i cleanup.sql
```

Then create the database structure:

```sql
\i schema.sql
```

## 2. User Creation in Supabase

1. Go to https://vjfaudrwggkwwsbhwhbc.supabase.co/dashboard
2. Navigate to Authentication > Settings > Email Auth
3. Ensure "Enable Email/Password sign in" is turned ON
4. Go to Authentication > Users
5. Click "Add User"
6. Create a new user:
   - Email: admin@example.com
   - Password: (choose a strong password)
   - Check "Auto-confirm user"
7. Copy the UUID of the created user (click on the user to see details)

## 3. Create Admin Profile

After creating the user, run:

```sql
SELECT create_admin_profile('paste-user-uuid-here', 'Admin User');
```

## 4. Login

You can now log in to the application using:
- Email: admin@example.com
- Password: (the password you set in step 2)

## Troubleshooting

If you see a 400 (Bad Request) error:
1. Ensure the user exists in Supabase Authentication
2. Ensure you've created the profile using create_admin_profile
3. Check that the email and password match exactly