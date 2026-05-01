-- Migration: Create RPC to ensure student account exists
-- This function creates a student account if it doesn't exist, with default password '123456'
-- If the account already exists, it does not touch the password.

CREATE OR REPLACE FUNCTION ensure_student_account(
  student_email TEXT,
  student_full_name TEXT,
  student_class_id UUID
)
RETURNS VOID AS $$
DECLARE
  caller_role_id INT;
  target_user_id UUID;
  current_instance_id UUID;
BEGIN
  -- 1. Check if caller is admin (role_id = 1)
  SELECT role_id INTO caller_role_id FROM public.user_profiles WHERE id = auth.uid();
  
  IF caller_role_id IS NULL OR caller_role_id != 1 THEN
    RAISE EXCEPTION 'Access denied. Only administrators can manage student accounts.';
  END IF;

  -- Get current instance_id from the caller
  SELECT instance_id INTO current_instance_id FROM auth.users WHERE id = auth.uid() LIMIT 1;

  -- 2. Check if user already exists in auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = student_email;

  IF target_user_id IS NULL THEN
    -- 3. Create new user in auth.users if they don't exist
    target_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token,
      is_sso_user
    )
    VALUES (
      target_user_id,
      current_instance_id,
      student_email,
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', student_full_name),
      now(),
      now(),
      'authenticated',
      'authenticated',
      '',
      '',
      '',
      '',
      false
    );

    -- Create identity for the user
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    )
    VALUES (
      gen_random_uuid(),
      target_user_id,
      jsonb_build_object('sub', target_user_id, 'email', student_email),
      'email',
      student_email,
      now(),
      now(),
      now()
    );
  ELSE
    -- 3b. Update existing user to ensure they are valid for login (fix for previously created buggy accounts)
    UPDATE auth.users
    SET 
      instance_id = current_instance_id,
      aud = 'authenticated',
      role = 'authenticated',
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
    WHERE id = target_user_id;

    -- Ensure identity exists
    IF NOT EXISTS (SELECT 1 FROM auth.identities WHERE user_id = target_user_id) THEN
      INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
      )
      VALUES (
        gen_random_uuid(),
        target_user_id,
        jsonb_build_object('sub', target_user_id, 'email', student_email),
        'email',
        student_email,
        now(),
        now(),
        now()
      );
    END IF;
  END IF;

  -- 4. Ensure public.user_profiles record exists and is correct
  -- role_id = 5 is Student
  INSERT INTO public.user_profiles (id, email, full_name, role_id, class_id, is_active)
  VALUES (target_user_id, student_email, student_full_name, 5, student_class_id, true)
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    class_id = EXCLUDED.class_id,
    role_id = 5,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_student_account(TEXT, TEXT, UUID) TO authenticated;
