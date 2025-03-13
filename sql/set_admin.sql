-- Inserire l'UUID dell'utente creato in Supabase Auth
INSERT INTO profiles (id, full_name, role)
VALUES (
    'e737b686-cd95-4f39-ae9b-289beca389cb',  -- Sostituisci con l'UUID dell'utente
    'Admin User',                  -- Puoi cambiare il nome
    'admin'
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
    'Admin User',
    'admin'
);
*/