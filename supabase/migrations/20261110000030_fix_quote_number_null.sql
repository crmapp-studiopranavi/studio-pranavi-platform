-- Fix: next_quote_number() returns null when business_settings has no rows.
-- The SELECT INTO leaves prefix as NULL when no row exists; concatenation
-- then produces NULL which violates quotes.quote_number NOT NULL.

create or replace function next_quote_number()
returns text language plpgsql security definer
set search_path = ''
as $$
declare
  prefix  text;
  seq_val bigint;
begin
  select coalesce(quotation_prefix, 'QT')
  into prefix
  from public.business_settings
  limit 1;

  -- Guard: if business_settings is empty the SELECT INTO leaves prefix NULL.
  prefix := coalesce(prefix, 'QT');

  seq_val := nextval('public.quote_number_seq');
  return prefix || '-' || lpad(seq_val::text, 5, '0');
end;
$$;
