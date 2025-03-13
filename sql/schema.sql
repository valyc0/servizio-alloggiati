-- Create tables for servizio-alloggiati

-- Create profiles table that extends Supabase auth.users
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own profile
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Accommodations table (rooms/units)
CREATE TABLE accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    floor INTEGER,
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for accommodations
ALTER TABLE accommodations ENABLE ROW LEVEL SECURITY;

-- Create policies for accommodations
CREATE POLICY "Staff and admin can view accommodations"
    ON accommodations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Staff and admin can insert accommodations"
    ON accommodations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin')
        )
    );

CREATE POLICY "Staff and admin can update accommodations"
    ON accommodations FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'admin')
        )
    );

-- Guests table with camelCase column names
CREATE TABLE guests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    address TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "stayDuration" TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    is_main_guest BOOLEAN DEFAULT false,
    booking_code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for guests
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Create policies for guests
CREATE POLICY "Users can view their own guests"
    ON guests FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert guests"
    ON guests FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own guests"
    ON guests FOR UPDATE
    USING (user_id = auth.uid());

-- Stays table (booking records)
CREATE TABLE stays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_id UUID REFERENCES guests(id),
    accommodation_id UUID REFERENCES accommodations(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for stays
ALTER TABLE stays ENABLE ROW LEVEL SECURITY;

-- Create policies for stays
CREATE POLICY "Staff and admin can view stays"
    ON stays FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Staff and admin can insert stays"
    ON stays FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'admin')
        )
    );

CREATE POLICY "Staff and admin can update stays"
    ON stays FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('staff', 'admin')
        )
    );

-- Create indexes for better query performance
CREATE INDEX idx_guests_user_id ON guests(user_id);
CREATE INDEX idx_guests_booking_code ON guests(booking_code);
CREATE INDEX idx_stays_dates ON stays(check_in_date, check_out_date);
CREATE INDEX idx_accommodations_status ON accommodations(status);

-- Sample data insertions
-- Note: To insert sample data, first create users through Supabase Auth UI or API
-- Then use the auth.uid() in the following statements

-- Insert sample accommodations
INSERT INTO accommodations (room_number, type, capacity, floor) VALUES
('101', 'single', 1, 1),
('102', 'double', 2, 1),
('201', 'suite', 4, 2),
('202', 'double', 2, 2);