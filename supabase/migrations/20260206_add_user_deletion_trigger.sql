-- Add trigger to delete auth user when user_profile is deleted
-- This ensures that when a user is deleted from user_profiles, 
-- their auth account is also removed

CREATE OR REPLACE FUNCTION delete_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete the auth user from auth.users
  DELETE FROM auth.users WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function when a user_profile is deleted
DROP TRIGGER IF EXISTS on_user_profile_deleted ON user_profiles;
CREATE TRIGGER on_user_profile_deleted
  BEFORE DELETE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION delete_auth_user();
