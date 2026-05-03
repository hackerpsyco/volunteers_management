-- Migration: Improve ensure_student_account to handle email updates and password resets
-- This function now accepts an optional old_email to handle account updates
-- It also ALWAYS resets the password to '123456' to ensure the admin can fix login issues

CREATE OR REPLACE FUNCTION ensure_student_account(
  student_email TEXT,
  student_full_name TEXT,
  student_class_id UUID,
  old_email TEXT DEFAULT NULL
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
  IF current_instance_id IS NULL THEN
    current_instance_id := '00000000-0000-0000-0000-000000000000';
  END IF;

  -- 2. Handle email update if old_email is provided
  IF old_email IS NOT NULL AND old_email != student_email THEN
    SELECT id INTO target_user_id FROM auth.users WHERE email = old_email;
    
    IF target_user_id IS NOT NULL THEN
      -- Update existing user's email
      UPDATE auth.users
      SET 
        email = student_email,
        updated_at = now(),
        email_confirmed_at = COALESCE(email_confirmed_at, now())
      WHERE id = target_user_id;

      -- Update identity
      UPDATE auth.identities
      SET 
        identity_data = jsonb_build_object('sub', target_user_id, 'email', student_email),
        provider_id = student_email,
        updated_at = now()
      WHERE user_id = target_user_id;
    END IF;
  END IF;

  -- 3. If target_user_id is still null, check if the NEW email already exists
  IF target_user_id IS NULL THEN
    SELECT id INTO target_user_id FROM auth.users WHERE email = student_email;
  END IF;

  -- 4. Create new user if they don't exist
  IF target_user_id IS NULL THEN
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

    -- Create identity
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
    -- 5. Ensure existing user is valid for login and RESET password to default
    UPDATE auth.users
    SET 
      instance_id = current_instance_id,
      aud = 'authenticated',
      role = 'authenticated',
      encrypted_password = crypt('123456', gen_salt('bf')),
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

  -- 6. Ensure public.user_profiles record exists and is correct
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
