-- ============================================================================
-- Make national ID optional: patients may be registered without a national ID.
-- (Postgres unique constraints treat NULLs as distinct, so multiple patients
-- without a national ID are allowed.)
-- ============================================================================

alter table public.patients
  alter column national_id drop not null;