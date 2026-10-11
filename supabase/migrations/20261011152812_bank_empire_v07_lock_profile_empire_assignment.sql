-- Impedisce agli utenti di cambiare autonomamente impero modificando il proprio profilo.
-- Non esiste ancora una schermata di modifica profilo; la policy era quindi superflua e consentiva
-- di alterare l'aggregazione economica degli imperi tramite chiamate API dirette.
drop policy if exists "Users can update their own profile" on public.profiles;
