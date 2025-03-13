-- Aggiungi stato agli ospiti solo se la colonna non esiste
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 
                  FROM information_schema.columns 
                  WHERE table_name='guests' AND column_name='status') 
    THEN
        ALTER TABLE guests
        ADD COLUMN status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted'));
    END IF;
END $$;

-- Rimuovi tutte le policy esistenti dalla tabella guests
DO $$ 
DECLARE
    pol record;
BEGIN 
    -- Elimina tutte le policy esistenti per la tabella guests
    FOR pol IN
        SELECT policyname::text
        FROM pg_policies 
        WHERE tablename = 'guests'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON guests', pol.policyname);
    END LOOP;
END $$;

-- Policy per utenti normali
CREATE POLICY "Users can view their own guests"
    ON guests FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert guests"
    ON guests FOR INSERT
    WITH CHECK (user_id = auth.uid() AND status = 'draft');

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

-- Crea tabella per i JSON esportati se non esiste
CREATE TABLE IF NOT EXISTS exported_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    json_data JSONB NOT NULL,
    generated_by UUID REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'error')),
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS per exported_data se non è già abilitato
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE tablename = 'exported_data' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE exported_data ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Rimuovi e ricrea la policy per exported_data
DO $$ 
DECLARE
    pol record;
BEGIN 
    FOR pol IN
        SELECT policyname::text
        FROM pg_policies 
        WHERE tablename = 'exported_data'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON exported_data', pol.policyname);
    END LOOP;
END $$;

CREATE POLICY "Admins can manage exported data"
    ON exported_data
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Funzione per finalizzare gli ospiti (cambiare stato da draft a submitted)
-- Usa SECURITY DEFINER per bypassare RLS
CREATE OR REPLACE FUNCTION finalize_guests(booking_code_param TEXT)
RETURNS void
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Verifica che l'utente sia il proprietario dei record
    IF NOT EXISTS (
        SELECT 1 
        FROM guests 
        WHERE booking_code = booking_code_param 
        AND status = 'draft'
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Non autorizzato a finalizzare questi ospiti';
    END IF;

    -- Esegui l'aggiornamento
    UPDATE guests 
    SET status = 'submitted'
    WHERE booking_code = booking_code_param
    AND status = 'draft'
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Funzione per gli admin per generare il JSON di esportazione
-- Usa SECURITY DEFINER per bypassare RLS
CREATE OR REPLACE FUNCTION generate_export_data(booking_code_param TEXT)
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
            'booking_code', booking_code_param,
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
    WHERE g.booking_code = booking_code_param
    AND g.status = 'submitted'
    GROUP BY booking_code_param
    RETURNING id INTO new_export_id;

    RETURN new_export_id;
END;
$$ LANGUAGE plpgsql;