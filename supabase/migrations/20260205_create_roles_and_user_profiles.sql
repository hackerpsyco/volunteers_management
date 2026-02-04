-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id SMALLINT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO roles (id, name ) VALUES
  (1, 'Admin'),
  (2, 'Supervisor'),
  (3, 'Coordinator'),
  (4, 'Facilitator')
ON CONFLICT (id) DO NOTHING;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  location VARCHAR(255),
  bio TEXT,
  profile_image_url TEXT,
  role_id SMALLINT REFERENCES roles(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_user_profiles_role_id ON user_profiles(role_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for roles (everyone can read)
CREATE POLICY "Allow authenticated users to view roles"
  ON roles FOR SELECT
  TO authenticated
  USING (TRUE);

-- RLS Policies for user_profiles
CREATE POLICY "Allow users to view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow users to update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Allow authenticated users to insert profiles"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

CREATE POLICY "Allow authenticated users to delete profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (TRUE);

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policy for profile images storage
CREATE POLICY "Allow authenticated users to upload profile images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Allow authenticated users to update their profile images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'profile-images' AND auth.uid()::text = owner)
  WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = owner);

CREATE POLICY "Allow public to view profile images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-images');
