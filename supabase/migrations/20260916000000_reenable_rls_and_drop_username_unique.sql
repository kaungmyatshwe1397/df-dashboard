-- Migration: Re-enable RLS and drop username unique constraint.
-- username is not an auth identifier; email is the unique key.

-- Drop the UNIQUE constraint on username (email remains the unique identifier)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_username_key;

-- Re-enable RLS on all tables (disabled in previous dev migration)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE labs ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_types ENABLE ROW LEVEL SECURITY;
