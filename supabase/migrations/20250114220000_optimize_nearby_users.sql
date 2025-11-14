-- Optimized nearby users function with JOIN to eliminate N+1 queries
CREATE OR REPLACE FUNCTION find_nearby_users_with_profiles(
  radius_km NUMERIC DEFAULT 10,
  max_results INT DEFAULT 50
)
RETURNS TABLE (
  user_id UUID,
  distance_km NUMERIC,
  last_seen TIMESTAMPTZ,
  is_online BOOLEAN,
  profile JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_user_location GEOGRAPHY;
BEGIN
  -- Get current user's location
  SELECT location INTO current_user_location
  FROM location_history
  WHERE user_id = auth.uid()
  ORDER BY created_at DESC
  LIMIT 1;

  -- Return empty if user has no location
  IF current_user_location IS NULL THEN
    RETURN;
  END IF;

  -- Find nearby users with profile data in a single query (JOIN)
  RETURN QUERY
  SELECT
    lh.user_id,
    (ST_Distance(lh.location, current_user_location) / 1000)::NUMERIC(10,2) AS distance_km,
    lh.created_at AS last_seen,
    CASE
      WHEN lh.created_at > NOW() - INTERVAL '5 minutes' THEN TRUE
      ELSE FALSE
    END AS is_online,
    jsonb_build_object(
      'name', p.name,
      'age', p.age,
      'bio', p.bio,
      'photos', p.photos
    ) AS profile
  FROM location_history lh
  INNER JOIN profiles p ON p.id = lh.user_id
  WHERE
    lh.user_id != auth.uid()
    AND lh.id IN (
      SELECT DISTINCT ON (user_id) id
      FROM location_history
      WHERE user_id != auth.uid()
      ORDER BY user_id, created_at DESC
    )
    AND ST_DWithin(
      lh.location,
      current_user_location,
      radius_km * 1000
    )
  ORDER BY distance_km ASC
  LIMIT max_results;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION find_nearby_users_with_profiles TO authenticated;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_location_history_user_created
ON location_history(user_id, created_at DESC);
