-- Fix RLS policies for centre_time_slots table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON centre_time_slots;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON centre_time_slots;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON centre_time_slots;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON centre_time_slots;

-- Create new RLS policies that allow all users
CREATE POLICY "Allow all users to read centre_time_slots"
  ON centre_time_slots FOR SELECT USING (true);

CREATE POLICY "Allow all users to insert centre_time_slots"
  ON centre_time_slots FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all users to update centre_time_slots"
  ON centre_time_slots FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow all users to delete centre_time_slots"
  ON centre_time_slots FOR DELETE USING (true);
