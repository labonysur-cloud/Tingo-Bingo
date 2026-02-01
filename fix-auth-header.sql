-- ============================================
-- TEMPORARY FIX: Use Custom Header for User ID
-- Until we set up proper Firebase JWT verification in Supabase
-- ============================================

-- Update get_user_id() to check custom header first
CREATE OR REPLACE FUNCTION public.get_user_id() 
RETURNS TEXT AS $$
DECLARE
  user_id_from_header TEXT;
  user_id_from_jwt TEXT;
BEGIN
  -- Try to get user ID from custom header (temporary approach)
  BEGIN
    user_id_from_header := current_setting('request.headers', true)::json->>'x-user-id';
  EXCEPTION WHEN OTHERS THEN
    user_id_from_header := NULL;
  END;

  -- If we found user ID in header, return it
  IF user_id_from_header IS NOT NULL AND user_id_from_header != '' THEN
    RETURN user_id_from_header;
  END IF;

  -- Otherwise, try JWT token (for future when we set up proper verification)
  BEGIN
    user_id_from_jwt := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN OTHERS THEN
    user_id_from_jwt := NULL;
  END;

  RETURN NULLIF(user_id_from_jwt, '');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Test the function
SELECT public.get_user_id() AS "Current User ID";

-- ✅ This will now work with the X-User-ID header from your app!
