-- Drop and recreate the guests table with the correct schema
DROP TABLE IF EXISTS stays;
DROP TABLE IF EXISTS guests;

-- Recreate guests table
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

-- Create index
CREATE INDEX idx_guests_user_id ON guests(user_id);
CREATE INDEX idx_guests_booking_code ON guests(booking_code);

-- Note: quotes around column names are important for camelCase fields in PostgreSQL