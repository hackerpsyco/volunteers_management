-- Fix RLS policies for centres table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON centres;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON centres;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON centres;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON centres;

-- Create new RLS policies that allow all users
CREATE POLICY "Allow all users to read centres"
  ON centres FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert centres"
  ON centres FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update centres"
  ON centres FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all users to delete centres"
  ON centres FOR DELETE USING (true);
