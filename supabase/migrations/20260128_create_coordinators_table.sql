-- Create coordinators table
CREATE TABLE coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE coordinators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON coordinators
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON coordinators
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON coordinators
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON coordinators
  FOR DELETE USING (true);

-- Create index on status for faster queries
CREATE INDEX idx_coordinators_status ON coordinators(status);
