-- Crea tabella per le prenotazioni
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    room_number TEXT NOT NULL,
    guest_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view bookings"
    ON bookings FOR SELECT
    USING (true);

-- Modifica la tabella guests per riferire alla prenotazione invece che usare booking_code
ALTER TABLE guests 
DROP COLUMN IF EXISTS booking_code,
ADD COLUMN booking_id UUID REFERENCES bookings(id);

-- Aggiorna le policy per guests considerando booking_id
DROP POLICY IF EXISTS "Users can view their own guests" ON guests;
DROP POLICY IF EXISTS "Users can insert guests" ON guests;
DROP POLICY IF EXISTS "Users can update their draft guests" ON guests;
DROP POLICY IF EXISTS "Users can delete their draft guests" ON guests;

CREATE POLICY "Users can view their own guests"
    ON guests FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert guests"
    ON guests FOR INSERT
    WITH CHECK (
        user_id = auth.uid() 
        AND status = 'draft'
        AND EXISTS (
            SELECT 1 FROM bookings 
            WHERE bookings.id = booking_id
            AND bookings.status = 'active'
        )
    );

CREATE POLICY "Users can update their draft guests"
    ON guests FOR UPDATE
    USING (
        user_id = auth.uid() 
        AND status = 'draft'
    );

CREATE POLICY "Users can delete their draft guests"
    ON guests FOR DELETE
    USING (
        user_id = auth.uid() 
        AND status = 'draft'
    );

-- Aggiorna la funzione finalize_guests per usare booking_id
CREATE OR REPLACE FUNCTION finalize_guests(booking_id_param UUID)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verifica che l'utente sia il proprietario dei record
    IF NOT EXISTS (
        SELECT 1 
        FROM guests 
        WHERE booking_id = booking_id_param
        AND status = 'draft'
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Non autorizzato a finalizzare questi ospiti';
    END IF;

    -- Aggiorna lo stato degli ospiti
    UPDATE guests 
    SET status = 'submitted'
    WHERE booking_id = booking_id_param
    AND status = 'draft'
    AND user_id = auth.uid();

    -- Aggiorna lo stato della prenotazione
    UPDATE bookings
    SET status = 'completed'
    WHERE id = booking_id_param;
END;
$$ LANGUAGE plpgsql;

-- Aggiorna la funzione generate_export_data
CREATE OR REPLACE FUNCTION generate_export_data(booking_id_param UUID)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    new_export_id UUID;
BEGIN
    -- Verifica che l'utente sia admin
    IF NOT EXISTS (
        SELECT 1 
        FROM profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Solo gli admin possono generare export';
    END IF;

    INSERT INTO exported_data (json_data, generated_by)
    SELECT 
        json_build_object(
            'booking_code', b.code,
            'check_in_date', b.check_in_date,
            'check_out_date', b.check_out_date,
            'room_number', b.room_number,
            'submission_date', CURRENT_TIMESTAMP,
            'guests', json_agg(
                json_build_object(
                    'firstName', g."firstName",
                    'lastName', g."lastName",
                    'address', g.address,
                    'documentType', g."documentType",
                    'documentNumber', g."documentNumber",
                    'stayDuration', g."stayDuration",
                    'is_main_guest', g.is_main_guest
                )
            )
        ),
        auth.uid()
    FROM guests g
    JOIN bookings b ON b.id = g.booking_id
    WHERE g.booking_id = booking_id_param
    AND g.status = 'submitted'
    GROUP BY b.id, b.code, b.check_in_date, b.check_out_date, b.room_number
    RETURNING id INTO new_export_id;

    RETURN new_export_id;
END;
$$ LANGUAGE plpgsql;

-- Inserisci alcune prenotazioni di esempio
INSERT INTO bookings (code, check_in_date, check_out_date, room_number, guest_name) VALUES
('BOOK001', CURRENT_DATE, CURRENT_DATE + 3, '101', 'Mario Rossi'),
('BOOK002', CURRENT_DATE + 1, CURRENT_DATE + 4, '102', 'Giuseppe Verdi'),
('BOOK003', CURRENT_DATE + 2, CURRENT_DATE + 5, '201', 'Anna Bianchi');