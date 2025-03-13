-- Inserire l'UUID dell'utente creato in Supabase Auth
INSERT INTO profiles (id, full_name, role)
VALUES (
    'INSERISCI-QUI-UUID-UTENTE',  -- Sostituisci con l'UUID dell'utente
    'Staff User',                  -- Puoi cambiare il nome
    'staff'                       -- Ruolo normale staff
);

/*
Per trovare l'UUID dell'utente:
1. Vai su Supabase Dashboard
2. Authentication > Users
3. Clicca sull'utente
4. Copia l'UUID

Esempio di come dovrebbe apparire il comando finale:

INSERT INTO profiles (id, full_name, role)
VALUES (
    'd4b1c4b2-1234-5678-90ab-cdef12345678',
    'Mario Rossi',
    'staff'
);
*/