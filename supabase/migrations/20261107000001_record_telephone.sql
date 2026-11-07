-- Telephone belongs to the visit and stays independent of the patient register.
BEGIN;
ALTER TABLE public.patient_records ADD COLUMN telephone text;

CREATE OR REPLACE FUNCTION public.save_gp_record(p_submission_id uuid, p_patient jsonb, p_record jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_request jsonb;
  v_submission public.record_save_submissions%ROWTYPE;
  v_cycle public.monthly_cycles%ROWTYPE;
  v_record public.patient_records%ROWTYPE;
  v_date date;
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL OR coalesce(public.get_user_role(), '') NOT IN ('ADMIN', 'ASSISTANT') THEN
    RAISE EXCEPTION 'You do not have permission to create records.' USING ERRCODE = '42501';
  END IF;
  IF p_submission_id IS NULL OR p_patient IS NULL OR jsonb_typeof(p_patient) <> 'object'
    OR p_record IS NULL OR jsonb_typeof(p_record) <> 'object' THEN
    RAISE EXCEPTION 'A submission, patient details, and treatment are required.' USING ERRCODE = '22023';
  END IF;
  v_request := jsonb_build_object('version', 'standalone-gp-1', 'patient', p_patient, 'record', p_record);
  INSERT INTO public.record_save_submissions(id, user_id, request) VALUES(p_submission_id, v_user_id, v_request)
    ON CONFLICT(id) DO NOTHING;
  SELECT * INTO STRICT v_submission FROM public.record_save_submissions WHERE id = p_submission_id FOR UPDATE;
  IF v_submission.user_id <> v_user_id THEN
    RAISE EXCEPTION 'This submission belongs to another user.' USING ERRCODE = '42501';
  END IF;
  IF v_submission.request <> v_request THEN
    RAISE EXCEPTION 'This save already used different values. Retry the original values, then edit the saved record.' USING ERRCODE = '22023';
  END IF;
  IF v_submission.result IS NOT NULL THEN RETURN v_submission.result; END IF;

  IF coalesce(p_record->>'category', '') <> 'GP'
    OR nullif(btrim(p_patient->>'patient_name'), '') IS NULL
    OR coalesce(p_patient->>'age', '') !~ '^\d{1,3}$'
    OR coalesce(p_patient->>'gender', '') NOT IN ('MALE', 'FEMALE')
    OR nullif(btrim(p_record->>'diagnosis'), '') IS NULL
    OR coalesce(p_record->>'total_cost', '') !~ '^\d+$'
    OR coalesce(p_record->>'entry_date', '') !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RAISE EXCEPTION 'Check the patient details, record date, treatment, and cost.' USING ERRCODE = '22023';
  END IF;
  IF (p_patient->>'age')::integer NOT BETWEEN 0 AND 120 OR (p_record->>'total_cost')::integer <= 0 THEN
    RAISE EXCEPTION 'Enter age 0-120 and a whole-number cost greater than 0.' USING ERRCODE = '22023';
  END IF;
  v_date := (p_record->>'entry_date')::date;
  IF v_date > (now() AT TIME ZONE 'Asia/Bangkok')::date THEN
    RAISE EXCEPTION 'Record date cannot be in the future.' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.monthly_cycles(month_year) VALUES(to_char(v_date, 'YYYY-MM')) ON CONFLICT(month_year) DO NOTHING;
  SELECT * INTO STRICT v_cycle FROM public.monthly_cycles WHERE month_year = to_char(v_date, 'YYYY-MM');
  INSERT INTO public.patient_records(cycle_id, patient_uuid, patient_id, patient_name, age, gender, address, telephone,
    entry_date, category, diagnosis, total_cost, month_label, paid, remaining, is_carried_forward)
  VALUES(v_cycle.id, NULL, NULL, btrim(p_patient->>'patient_name'), (p_patient->>'age')::smallint,
    (p_patient->>'gender')::public.gender, nullif(btrim(p_patient->>'address'), ''), nullif(btrim(p_patient->>'telephone'), ''), v_date, 'GP',
    btrim(p_record->>'diagnosis'), (p_record->>'total_cost')::integer, to_char(v_date, 'Mon YYYY'), 0, 0, false)
  RETURNING * INTO v_record;
  v_result := jsonb_build_object('record', to_jsonb(v_record) - 'lab_fee' - 'lab_payment_status',
    'cycle', to_jsonb(v_cycle), 'payment', NULL);
  UPDATE public.record_save_submissions SET result = v_result WHERE id = p_submission_id;
  RETURN v_result;
END;
$$;

COMMENT ON COLUMN public.patient_records.telephone IS 'Optional telephone supplied with a visit; not a registry identifier.';
NOTIFY pgrst, 'reload schema';
COMMIT;
