-- The registry needs stable server-side ordering before pagination so each patient appears on one page.
BEGIN;

CREATE FUNCTION public.search_patients_sorted(
  p_query text DEFAULT '', p_address text DEFAULT '', p_age integer DEFAULT NULL,
  p_gender text DEFAULT NULL, p_registered boolean DEFAULT NULL,
  p_page integer DEFAULT 1, p_page_size integer DEFAULT 10, p_exact_name text DEFAULT NULL,
  p_sort_desc boolean DEFAULT false, p_sort_key text DEFAULT 'id'
)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  WITH matches AS (
    SELECT p.* FROM public.patients p
    WHERE (coalesce(btrim(p_query), '') = '' OR strpos(lower(p.patient_name), lower(btrim(p_query))) > 0
      OR strpos(lower(coalesce(p.patient_id, '')), lower(btrim(p_query))) > 0)
      AND (coalesce(btrim(p_address), '') = '' OR strpos(lower(coalesce(p.address, '')), lower(btrim(p_address))) > 0)
      AND (p_age IS NULL OR p.age = p_age)
      AND (p_gender IS NULL OR p.gender::text = p_gender)
      AND (p_registered IS NULL OR p.is_registered = p_registered)
      AND (p_exact_name IS NULL OR lower(regexp_replace(btrim(p.patient_name), '\s+', ' ', 'g'))
        = lower(regexp_replace(btrim(p_exact_name), '\s+', ' ', 'g')))
  ), page_rows AS (
    SELECT * FROM matches ORDER BY
      CASE WHEN p_sort_key = 'id' AND p_sort_desc THEN patient_id END DESC NULLS LAST,
      CASE WHEN p_sort_key = 'id' AND NOT p_sort_desc THEN patient_id END ASC NULLS LAST,
      CASE WHEN p_sort_key = 'name' AND p_sort_desc THEN lower(patient_name) END DESC NULLS LAST,
      CASE WHEN p_sort_key = 'name' AND NOT p_sort_desc THEN lower(patient_name) END ASC NULLS LAST,
      CASE WHEN p_sort_key = 'registered_at' AND p_sort_desc THEN coalesce(registered_at, created_at) END DESC NULLS LAST,
      CASE WHEN p_sort_key = 'registered_at' AND NOT p_sort_desc THEN coalesce(registered_at, created_at) END ASC NULLS LAST,
      id ASC
      LIMIT least(greatest(coalesce(p_page_size, 10), 1), 100)
      OFFSET (greatest(coalesce(p_page, 1), 1) - 1)::bigint * least(greatest(coalesce(p_page_size, 10), 1), 100)
  )
  SELECT jsonb_build_object('patients', coalesce((SELECT jsonb_agg(to_jsonb(r)) FROM page_rows r), '[]'::jsonb),
    'total', (SELECT count(*) FROM matches));
$$;

REVOKE ALL ON FUNCTION public.search_patients_sorted(text,text,integer,text,boolean,integer,integer,text,boolean,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_patients_sorted(text,text,integer,text,boolean,integer,integer,text,boolean,text) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
