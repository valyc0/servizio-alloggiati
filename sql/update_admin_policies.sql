-- Policy per permettere agli admin di vedere e modificare tutte le registrazioni
DROP POLICY IF EXISTS "Admins can view all guests" ON guests;
DROP POLICY IF EXISTS "Admins can update all guests" ON guests;

CREATE POLICY "Admins can view all guests"
    ON guests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Admins can update all guests"
    ON guests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy per permettere agli admin di vedere tutte le prenotazioni
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

CREATE POLICY "Admins can view all bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Aggiorna la policy per le prenotazioni per tutti gli utenti
DROP POLICY IF EXISTS "Anyone can view bookings" ON bookings;

CREATE POLICY "Users can view their related bookings"
    ON bookings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM guests
            WHERE guests.booking_id = bookings.id
            AND guests.user_id = auth.uid()
        )
    );