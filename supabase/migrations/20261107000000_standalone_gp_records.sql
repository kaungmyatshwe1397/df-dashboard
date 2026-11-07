-- GP visits keep demographics without creating registry profiles or inferring registration status.
BEGIN;

ALTER TABLE public.patient_records
  ALTER COLUMN patient_uuid DROP NOT NULL,
  ADD COLUMN age smallint,
  ADD COLUMN gender public.gender,
  ADD CONSTRAINT standalone_gp_demographics CHECK (
    patient_uuid IS NOT NULL OR (
      category = 'GP' AND patient_id IS NULL
      AND nullif(btrim(patient_name), '') IS NOT NULL
      AND age IS NOT NULL AND age BETWEEN 0 AND 120
      AND gender IS NOT NULL AND gender IN ('MALE', 'FEMALE')
    )
  );

CREATE OR REPLACE FUNCTION public.link_visit_patient()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE v_patient public.patients%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.patient_uuid IS DISTINCT FROM OLD.patient_uuid THEN
    RAISE EXCEPTION 'A visit cannot be reassigned to another patient.' USING ERRCODE = '23514';
  END IF;
  IF NEW.patient_uuid IS NULL AND NEW.patient_id IS NULL AND NEW.category = 'GP' THEN
    NEW.patient_name := btrim(NEW.patient_name);
    NEW.address := nullif(btrim(NEW.address), '');
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    -- Avoid reversing the profile-sync lock order while holding a visit lock.
    SELECT * INTO v_patient FROM public.patients WHERE id = NEW.patient_uuid;
  ELSIF NEW.patient_uuid IS NULL THEN
    SELECT * INTO v_patient FROM public.patients WHERE patient_id = NEW.patient_id FOR SHARE;
  ELSE
    SELECT * INTO v_patient FROM public.patients WHERE id = NEW.patient_uuid FOR SHARE;
  END IF;
  IF v_patient.id IS NULL THEN RAISE EXCEPTION 'Patient was not found.' USING ERRCODE = '23503'; END IF;
  NEW.patient_uuid := v_patient.id;
  NEW.patient_id := v_patient.patient_id;
  NEW.patient_name := v_patient.patient_name;
  NEW.address := v_patient.address;
  IF TG_OP = 'UPDATE' AND NEW.category = 'CASE' AND NEW.total_cost IS DISTINCT FROM OLD.total_cost THEN
    SELECT coalesce(sum(paid_amount), 0) INTO NEW.paid FROM public.case_payments WHERE record_id = NEW.id;
    IF NEW.total_cost < NEW.paid THEN
      RAISE EXCEPTION 'Total cost cannot be less than the amount already paid.' USING ERRCODE = '23514';
    END IF;
    NEW.remaining := NEW.total_cost - NEW.paid;
  END IF;
  RETURN NEW;
END;
$$;

CREATE FUNCTION public.save_gp_record(p_submission_id uuid, p_patient jsonb, p_record jsonb)
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
  INSERT INTO public.patient_records(cycle_id, patient_uuid, patient_id, patient_name, age, gender, address,
    entry_date, category, diagnosis, total_cost, month_label, paid, remaining, is_carried_forward)
  VALUES(v_cycle.id, NULL, NULL, btrim(p_patient->>'patient_name'), (p_patient->>'age')::smallint,
    (p_patient->>'gender')::public.gender, nullif(btrim(p_patient->>'address'), ''), v_date, 'GP',
    btrim(p_record->>'diagnosis'), (p_record->>'total_cost')::integer, to_char(v_date, 'Mon YYYY'), 0, 0, false)
  RETURNING * INTO v_record;
  v_result := jsonb_build_object('record', to_jsonb(v_record) - 'lab_fee' - 'lab_payment_status',
    'cycle', to_jsonb(v_cycle), 'payment', NULL);
  UPDATE public.record_save_submissions SET result = v_result WHERE id = p_submission_id;
  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.save_gp_record(uuid,jsonb,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_gp_record(uuid,jsonb,jsonb) TO authenticated;
COMMENT ON COLUMN public.patient_records.patient_uuid IS 'Optional for standalone GP visits; linked identities remain immutable.';
COMMENT ON COLUMN public.patient_records.age IS 'Age recorded for a standalone GP visit; linked visits use their patient profile.';
COMMENT ON COLUMN public.patient_records.gender IS 'Gender recorded for a standalone GP visit; linked visits use their patient profile.';
NOTIFY pgrst, 'reload schema';
COMMIT;
