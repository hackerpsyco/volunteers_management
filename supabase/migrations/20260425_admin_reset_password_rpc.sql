CREATE OR REPLACE FUNCTION admin_reset_user_password(target_user_id UUID, new_password TEXT)
RETURNS VOID AS $$
DECLARE
    caller_role_id int;
BEGIN
  -- Get the role_id of the person calling this function
  SELECT role_id INTO caller_role_id FROM public.user_profiles WHERE id = auth.uid();
  
  -- Check if the caller is an admin (role_id = 1)
  IF caller_role_id != 1 THEN
    RAISE EXCEPTION 'Access denied. You must be an administrator to reset passwords.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf'))
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users (admin check should be done in app or here)
GRANT EXECUTE ON FUNCTION admin_reset_user_password(UUID, TEXT) TO authenticated;
